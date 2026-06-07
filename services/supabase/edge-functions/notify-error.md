import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Importamos nodemailer de forma compatible con Deno 2
import nodemailer from "https://esm.sh/nodemailer@6.9.13";

const SMTP_HOSTNAME = Deno.env.get("SMTP_HOSTNAME") || "";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465");
const SMTP_USER = Deno.env.get("SMTP_USER") || "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") || "";

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const payload = await req.json();
    const record = payload?.record;

    if (!record) {
      return new Response('No record in payload', { status: 400 });
    }

    const isAutomatic = (record.error_message as string)?.startsWith('[AUTO]');
    const subject = isAutomatic
      ? `🔴 BDAI — Crash automático detectado`
      : `🐛 BDAI — Nuevo reporte de usuario`;

    const htmlBody = `
      <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; max-width: 600px; border: 1px solid #1e293b;">
        <h2 style="color: ${isAutomatic ? '#ef4444' : '#a855f7'}; margin-top: 0; font-size: 20px;">
          ${isAutomatic ? '🚨 Error Crítico Detectado' : '📩 Nuevo Reporte de Usuario'}
        </h2>
        <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Usuario:</strong> ${record.user_email || 'Anónimo'}</p>
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Idioma:</strong> ${record.language || '—'}</p>
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">URL:</strong> <a href="${record.url}" style="color: #6366f1;">${record.url || '—'}</a></p>
        </div>
        <div style="background: #020617; padding: 15px; border-radius: 8px; border-left: 4px solid ${isAutomatic ? '#ef4444' : '#a855f7'};">
            <code style="font-family: monospace; font-size: 13px; color: #e2e8f0; white-space: pre-wrap;">${record.error_message}</code>
        </div>
        <p style="font-size: 11px; color: #475569; margin-top: 30px; border-top: 1px solid #334155; padding-top: 20px;">
          Este es un correo automático del sistema de monitoreo de BDAI.
        </p>
      </div>
    `;

    // Configuración de Nodemailer (Mucho más robusto)
    const transporter = nodemailer.createTransport({
      host: SMTP_HOSTNAME,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true para 465 (SSL/TLS), false para 587 (STARTTLS)
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        // Esto asegura que la conexión sea segura pero no falle por certificados auto-firmados o dominios de hosting
        rejectUnauthorized: true 
      }
    });

    console.log(`Enviando mail vía ${SMTP_HOSTNAME}:${SMTP_PORT}...`);

    await transporter.sendMail({
      from: `"BDAI System" <${SMTP_USER}>`,
      to: SUPPORT_EMAIL,
      subject: subject,
      html: htmlBody,
    });

    console.log(`[notify-error] Email enviado con éxito.`);
    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('[notify-error] Error en el worker:', err.message);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
