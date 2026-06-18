// services/supabase/edge-functions/notify-tour-ready.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'notify-tour-ready'
// Se dispara vía Database Webhook en tours_cache (INSERT + UPDATE).
// Cuando status = 'READY', busca todos los usuarios que solicitaron ese slug
// y aún no han sido notificados, les envía un email y marca sus filas como notificadas.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import nodemailer from "https://esm.sh/nodemailer@6.9.13";

const SMTP_HOSTNAME = Deno.env.get("SMTP_HOSTNAME") || "";
const SMTP_PORT     = parseInt(Deno.env.get("SMTP_PORT") || "465");
const SMTP_USER     = Deno.env.get("SMTP_USER") || "";
const SMTP_PASS     = Deno.env.get("SMTP_PASS") || "";

const serviceKey   = Deno.env.get("MY_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseUrl  = Deno.env.get("SUPABASE_URL") || "";

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

serve(async (req: Request) => {
  try {
    console.log(`[notify-tour-ready] Request: ${req.method}`);

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const payload = await req.json();
    const record  = payload?.record;

    if (!record) {
      console.error("[notify-tour-ready] No record en payload.");
      return new Response("No record in payload", { status: 400 });
    }

    // ── Filtro principal: solo actuar cuando el tour está READY ──────────────
    if (record.status !== "READY") {
      console.log(`[notify-tour-ready] Status '${record.status}' ignorado. Solo proceso READY.`);
      return new Response("Not READY, skipping.", { status: 200 });
    }

    const slug     = record.city;      // en tours_cache la PK es 'city' (slug)
    const language = record.language;

    console.log(`[notify-tour-ready] Tour READY: slug=${slug}, language=${language}`);

    // ── Buscar solicitudes pendientes de notificación para este slug ─────────
    // Nota: no filtramos por language — un usuario que pidió "es" merece saber
    // que el tour está listo aunque haya salido en otro idioma primero.
    // Si se quiere restringir por idioma, añadir .eq("language", language).
    const { data: requests, error: fetchError } = await supabase
      .from("tour_requests")
      .select("id, user_email, city, country")
      .eq("slug", slug)
      .is("notified_at", null);

    if (fetchError) {
      console.error("[notify-tour-ready] Error consultando tour_requests:", fetchError.message);
      return new Response(`DB error: ${fetchError.message}`, { status: 500 });
    }

    if (!requests || requests.length === 0) {
      console.log(`[notify-tour-ready] Sin solicitudes pendientes para slug '${slug}'.`);
      return new Response("No pending requests.", { status: 200 });
    }

    console.log(`[notify-tour-ready] ${requests.length} solicitudes encontradas para '${slug}'.`);

    // ── Deduplicar por email (un mismo usuario pudo pedir la misma ciudad 2x) ─
    const uniqueByEmail = new Map<string, typeof requests[0]>();
    for (const r of requests) {
      if (r.user_email && r.user_email !== "Anónimo") {
        uniqueByEmail.set(r.user_email.toLowerCase(), r);
      }
    }

    const transporter = nodemailer.createTransport({
      host:   SMTP_HOSTNAME,
      port:   SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth:   { user: SMTP_USER, pass: SMTP_PASS },
      tls:    { rejectUnauthorized: true }
    });

    const cityName    = requests[0].city;
    const countryName = requests[0].country;
    const appUrl      = `https://app.bdai.travel`;

    let emailsSent = 0;

    // ── Enviar email a cada usuario único ────────────────────────────────────
    for (const [email, req] of uniqueByEmail) {
      const subject  = `✅ Tu tour de ${cityName} ya está disponible`;
      const htmlBody = `
        <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; max-width: 600px; border: 1px solid #1e293b;">
          <h2 style="color: #22d3ee; margin-top: 0; font-size: 20px;">
            🗺️ Tu tour está listo
          </h2>
          <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #f8fafc;">
              ${cityName}${countryName ? `, ${countryName}` : ""}
            </p>
            <p style="margin: 10px 0 0; color: #94a3b8; font-size: 14px;">
              El tour walking que solicitaste ya ha sido creado y está disponible en la app.
            </p>
          </div>
          <a href="${appUrl}" 
             style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none;
                    padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px;">
            Abrir BDAI →
          </a>
          <p style="font-size: 11px; color: #475569; margin-top: 30px; border-top: 1px solid #334155; padding-top: 20px;">
            Este es un correo automático del sistema de BDAI. No respondas a este email.
          </p>
        </div>
      `;

      try {
        await transporter.sendMail({
          from:    `"BDAI" <${SMTP_USER}>`,
          to:      email,
          subject: subject,
          html:    htmlBody
        });
        emailsSent++;
        console.log(`[notify-tour-ready] ✅ Email enviado a ${email} para ${cityName}`);
      } catch (mailErr: any) {
        // No abortamos el bucle si un email falla — seguimos con el resto
        console.error(`[notify-tour-ready] ❌ Error enviando a ${email}:`, mailErr.message);
      }
    }

    // ── Marcar TODAS las filas como notificadas (incl. anónimos y duplicados) ──
    // Marcamos todas las filas del slug, no solo las que tuvieron email válido,
    // para evitar reintentos infinitos en filas sin email útil.
    const allIds = requests.map(r => r.id);
    const { error: updateError } = await supabase
      .from("tour_requests")
      .update({ notified_at: new Date().toISOString() })
      .in("id", allIds);

    if (updateError) {
      console.error("[notify-tour-ready] Error marcando notified_at:", updateError.message);
      // No devolvemos error aquí — los emails ya se enviaron. Es mejor loguear y seguir.
    }

    console.log(`[notify-tour-ready] Completado. Emails enviados: ${emailsSent}/${uniqueByEmail.size}. Filas marcadas: ${allIds.length}.`);
    return new Response(JSON.stringify({ ok: true, emailsSent, totalRequests: requests.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("[notify-tour-ready] Error fatal:", err.message, err.stack);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
