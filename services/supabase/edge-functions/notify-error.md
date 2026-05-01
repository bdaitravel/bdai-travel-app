# notify-error

Edge Function que recibe el webhook de Supabase al insertar en `error_logs` y envía un email a SUPPORT_EMAIL via Resend.

## Setup

1. Crea una cuenta gratuita en [resend.com](https://resend.com) (3.000 emails/mes gratis).
2. Obtén tu API Key en Resend → Settings → API Keys.
3. Añade los siguientes **Secrets** en Supabase → Edge Functions → Secrets:
   - `RESEND_API_KEY` — tu API key de Resend
   - `SUPPORT_EMAIL` — dirección de destino: `support@bdai.travel`
4. Despliega esta Edge Function pegando el código en Supabase → Edge Functions → New Function → nombre: `notify-error`.
5. Crea el **Database Webhook** en Supabase → Database → Webhooks → Create:
   - Table: `error_logs`
   - Events: `INSERT`
   - URL: `https://slldavgsoxunkphqeamx.supabase.co/functions/v1/notify-error`
   - HTTP Headers: `Authorization: Bearer <tu-anon-key>`

## Código

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') ?? '';

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

    if (!RESEND_API_KEY || !SUPPORT_EMAIL) {
      console.warn('[notify-error] RESEND_API_KEY o SUPPORT_EMAIL no configurados.');
      return new Response('Missing config', { status: 200 }); // 200 para no reintentar
    }

    const isAutomatic = (record.error_message as string)?.startsWith('[AUTO]');
    const subject = isAutomatic
      ? `🔴 BDAI — Crash automático detectado`
      : `🐛 BDAI — Nuevo reporte de usuario`;

    const htmlBody = `
      <div style="font-family: monospace; background: #020617; color: #e2e8f0; padding: 24px; border-radius: 12px; max-width: 600px;">
        <h2 style="color: ${isAutomatic ? '#f87171' : '#c084fc'}; margin-top: 0;">
          ${isAutomatic ? '🔴 Error automático capturado' : '🐛 Reporte manual de usuario'}
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #94a3b8; padding: 4px 8px 4px 0; white-space: nowrap;">Usuario</td>
            <td style="color: #e2e8f0; padding: 4px 0;">${record.user_email || 'anonymous'}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 4px 8px 4px 0; white-space: nowrap;">Idioma</td>
            <td style="color: #e2e8f0; padding: 4px 0;">${record.language || '—'}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 4px 8px 4px 0; white-space: nowrap;">URL</td>
            <td style="color: #e2e8f0; padding: 4px 0;">${record.url || '—'}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 4px 8px 4px 0; white-space: nowrap;">Fecha</td>
            <td style="color: #e2e8f0; padding: 4px 0;">${record.created_at || new Date().toISOString()}</td>
          </tr>
        </table>
        <hr style="border-color: #1e293b; margin: 16px 0;" />
        <h3 style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Mensaje</h3>
        <pre style="background: #0f172a; padding: 12px; border-radius: 8px; white-space: pre-wrap; word-break: break-word; font-size: 13px; color: #f1f5f9;">${record.error_message || '(vacío)'}</pre>
        ${record.context ? `
        <h3 style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Contexto técnico</h3>
        <pre style="background: #0f172a; padding: 12px; border-radius: 8px; white-space: pre-wrap; word-break: break-word; font-size: 11px; color: #64748b;">${record.context}</pre>
        ` : ''}
        <p style="color: #475569; font-size: 11px; margin-top: 24px;">
          BDAI Error Tracking · <a href="https://supabase.com/dashboard/project/slldavgsoxunkphqeamx/editor" style="color: #6366f1;">Ver en Supabase</a>
        </p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BDAI Errors <errors@bdai.travel>',
        to: [SUPPORT_EMAIL],
        subject,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[notify-error] Resend error:', res.status, errText);
      return new Response('Email failed', { status: 500 });
    }

    console.log(`[notify-error] Email enviado a ${SUPPORT_EMAIL} para error_log id=${record.id}`);
    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('[notify-error] Exception:', err);
    return new Response('Internal error', { status: 500 });
  }
});
```
