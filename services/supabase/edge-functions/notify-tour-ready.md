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
    const { data: requests, error: fetchError } = await supabase
      .from("tour_requests")
      .select("id, user_email, city, country, language")
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
      const userLang = req.language || "es";
      const isEn = userLang.startsWith("en");
      const isFr = userLang.startsWith("fr");
      const isDe = userLang.startsWith("de");
      const isIt = userLang.startsWith("it");
      const isPt = userLang.startsWith("pt");

      let subjectStr = `✅ Tu tour de ${cityName} ya está disponible`;
      let titleStr = "🗺️ Tu tour está listo";
      let descStr  = "El tour que solicitaste ya ha sido creado y está disponible en la app.";
      let btnAppStr = "Abrir BDAI (Móvil) →";
      let btnWebStr = "Abrir BDAI Web";
      let footerStr = "Este es un correo automático del sistema de BDAI. No respondas a este email.";

      if (isEn) {
        subjectStr = `✅ Your ${cityName} tour is now available`;
        titleStr = "🗺️ Your tour is ready";
        descStr  = "The tour you requested has been created and is now available in the app.";
        btnAppStr = "Open BDAI (Mobile) →";
        btnWebStr = "Open BDAI Web";
        footerStr = "This is an automated email from the BDAI system. Please do not reply.";
      } else if (isFr) {
        subjectStr = `✅ Votre visite de ${cityName} est disponible`;
        titleStr = "🗺️ Votre visite est prête";
        descStr  = "La visite que vous avez demandée a été créée et est maintenant disponible dans l'application.";
        btnAppStr = "Ouvrir BDAI (Mobile) →";
        btnWebStr = "Ouvrir BDAI Web";
        footerStr = "Ceci est un e-mail automatique du système BDAI. Veuillez ne pas répondre.";
      } else if (isDe) {
        subjectStr = `✅ Deine ${cityName} Tour ist verfügbar`;
        titleStr = "🗺️ Deine Tour ist bereit";
        descStr  = "Die von Ihnen angeforderte Tour wurde erstellt und ist jetzt in der App verfügbar.";
        btnAppStr = "BDAI öffnen (Handy) →";
        btnWebStr = "BDAI Web öffnen";
        footerStr = "Dies ist eine automatische E-Mail des BDAI-Systems. Bitte nicht antworten.";
      } else if (isIt) {
        subjectStr = `✅ Il tuo tour di ${cityName} è disponibile`;
        titleStr = "🗺️ Il tuo tour è pronto";
        descStr  = "Il tour che hai richiesto è stato creato ed è ora disponibile nell'app.";
        btnAppStr = "Apri BDAI (Mobile) →";
        btnWebStr = "Apri BDAI Web";
        footerStr = "Questa è un'email automatica del sistema BDAI. Per favore non rispondere.";
      } else if (isPt) {
        subjectStr = `✅ O teu tour de ${cityName} já está disponível`;
        titleStr = "🗺️ O teu tour está pronto";
        descStr  = "O tour que você solicitou foi criado e já está disponível no aplicativo.";
        btnAppStr = "Abrir BDAI (Mobile) →";
        btnWebStr = "Abrir BDAI Web";
        footerStr = "Este é um email automático do sistema BDAI. Por favor, não responda.";
      }

      const subject = subjectStr;
      const htmlBody = `
        <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; max-width: 600px; border: 1px solid #1e293b;">
          <h2 style="color: #22d3ee; margin-top: 0; font-size: 20px;">
            ${titleStr}
          </h2>
          <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
            <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #f8fafc;">
              ${cityName}${countryName ? `, ${countryName}` : ""}
            </p>
            <p style="margin: 10px 0 0; color: #94a3b8; font-size: 14px;">
               ${descStr}
            </p>
          </div>
          <div style="margin-bottom: 30px;">
            <a href="intent://app.bdai.travel#Intent;scheme=https;end" 
               style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none;
                      padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; margin-right: 10px; margin-bottom: 10px;">
              ${btnAppStr}
            </a>
            <a href="${appUrl}" 
               style="display: inline-block; background: #334155; color: #f8fafc; text-decoration: none;
                      padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 13px;">
              ${btnWebStr}
            </a>
          </div>
          <p style="font-size: 11px; color: #475569; margin-top: 10px; border-top: 1px solid #334155; padding-top: 20px;">
            ${footerStr}
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
