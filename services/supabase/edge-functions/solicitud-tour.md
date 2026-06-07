import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Importamos nodemailer de forma compatible con Deno 2
import nodemailer from "https://esm.sh/nodemailer@6.9.13";

const SMTP_HOSTNAME = Deno.env.get("SMTP_HOSTNAME") || "";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465");
const SMTP_USER = Deno.env.get("SMTP_USER") || "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const DAISY_EMAIL = Deno.env.get("DAISY_EMAIL") || "";

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const payload = await req.json();
    const { city, country, language, slug, userEmail } = payload;

    if (!city || !country) {
      return new Response('Faltan campos obligatorios: city, country', { status: 400 });
    }

    const subject = `BDAI — Nuevo tour solicitado, ${city}, ${language}`;

    const htmlBody = `
      <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; max-width: 600px; border: 1px solid #1e293b;">
        <h2 style="color: #22d3ee; margin-top: 0; font-size: 20px;">
          🗺️ Nueva Solicitud de Tour
        </h2>
        <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Ciudad:</strong> ${city}</p>
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">País:</strong> ${country}</p>
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Idioma:</strong> ${language || '—'}</p>
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Slug:</strong> ${slug || '—'}</p>
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Usuario:</strong> ${userEmail || 'Anónimo'}</p>
        </div>
        <p style="font-size: 11px; color: #475569; margin-top: 30px; border-top: 1px solid #334155; padding-top: 20px;">
          Este es un correo automático del sistema de solicitudes de BDAI.
        </p>
      </div>
    `;

    // Configuración de Nodemailer
    const transporter = nodemailer.createTransport({
      host: SMTP_HOSTNAME,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: true 
      }
    });

    console.log(`Enviando mail de solicitud de tour vía ${SMTP_HOSTNAME}:${SMTP_PORT}...`);

    await transporter.sendMail({
      from: `"BDAI System" <${SMTP_USER}>`,
      to: DAISY_EMAIL,
      subject: subject,
      html: htmlBody,
    });

    console.log(`[solicitud-tour] Email enviado con éxito para ${city}, ${country}.`);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[solicitud-tour] Error en el worker:', err.message);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
