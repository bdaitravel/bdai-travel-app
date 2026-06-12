# Database Webhook: Trigger Error Log

**Misión**: Notifica por email a soporte en cuanto se registra un nuevo error en `error_logs`, ya sea un reporte manual de usuario o un crash automático capturado por el `ErrorBoundary`.

## Configuración en el Dashboard de Supabase

- **Name**: `Trigger Error Log`
- **Table**: `error_logs`
- **Events**: `Insert` (SOLO activado para inserciones)
- **Type**: `Webhook`
- **Method**: `POST`
- **URL**: `https://slldavgsoxunkphqeamx.supabase.co/functions/v1/notify-error`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TU_ANON_KEY>`

## Secrets necesarios en Edge Functions

Antes de activar este webhook, asegúrate de que existen estos dos secrets en Supabase → Edge Functions → Secrets:

- `RESEND_API_KEY` — API key de [resend.com](https://resend.com) (3.000 emails/mes gratis)
- `SUPPORT_EMAIL` — dirección de destino: `support@bdai.travel`

## Flujo de Eventos

### Reporte manual de usuario
1. El usuario pulsa "Reportar Error" en el `ProfileModal` o en el `ErrorBoundary`.
2. `ReportBugModal` llama a `errorService.submitBugReport()`.
3. `errorService` inserta una fila en `error_logs` con `error_message` = descripción del usuario, más `url`, `user_email`, `language` y `userAgent` en `context`.
4. Este webhook se dispara automáticamente por el `INSERT`.
5. La Edge Function `notify-error` recibe el payload y envía un email a `SUPPORT_EMAIL` con asunto `🐛 BDAI — Nuevo reporte de usuario`.

### Crash automático (sin acción del usuario)
1. React detecta un error de renderizado y lo captura el `ErrorBoundary`.
2. En `componentDidCatch`, se llama automáticamente a `errorService.logAutoError()`.
3. `errorService` inserta una fila en `error_logs` con `error_message` prefijado `[AUTO]`, el stack del componente y el stack técnico en `context`.
4. Este webhook se dispara automáticamente por el `INSERT`.
5. La Edge Function `notify-error` recibe el payload y envía un email con asunto `🔴 BDAI — Crash automático detectado`.

## Payload de ejemplo

```json
{
  "type": "INSERT",
  "record": {
    "id": "uuid-generado",
    "error_message": "[AUTO] Cannot read properties of undefined (reading 'map')",
    "context": "url: https://app.bdai.travel/#/city/logrono\nagent: Mozilla/5.0...\ncomponent_stack: at CityDetailView...\njs_stack: TypeError: Cannot read...",
    "user_email": "anonymous",
    "language": "es",
    "url": "https://app.bdai.travel/#/city/logrono",
    "created_at": "2026-05-01T10:23:45.000Z"
  }
}
```
