# Database Webhook: Trigger Tour Request

**Misión**: Notifica por email cuando un usuario solicita un tour para un municipio que aún no tiene contenido generado.

## Configuración en el Dashboard de Supabase

- **Name**: `Trigger Tour Request`
- **Table**: `tour_requests`
- **Events**: `Insert` (SOLO activado para inserciones)
- **Type**: `Webhook`
- **Method**: `POST`
- **URL**: `https://slldavgsoxunkphqeamx.supabase.co/functions/v1/solicitud-tour`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TU_ANON_KEY>`

## Secrets necesarios en Edge Functions

Asegúrate de que existen estos secrets en Supabase → Edge Functions → Secrets:

- `SMTP_HOSTNAME` — servidor SMTP (p.ej. `smtp.dondominio.com`)
- `SMTP_PORT` — puerto SMTP (p.ej. `465`)
- `SMTP_USER` — usuario SMTP
- `SMTP_PASS` — contraseña SMTP
- `DAISY_EMAIL` — dirección de destino donde llegan las solicitudes

## Flujo de Eventos

1. El usuario busca un municipio sin tour generado y lo selecciona.
2. El cliente inserta una fila en `tour_requests` (ciudad, país, idioma, slug, email del usuario).
3. Este webhook se dispara automáticamente por el `INSERT`.
4. La Edge Function `solicitud-tour` recibe el payload y envía un email a `DAISY_EMAIL`.

## Payload de ejemplo

```json
{
  "type": "INSERT",
  "record": {
    "id": "uuid-generado",
    "city": "Tudelilla",
    "country": "Spain",
    "language": "es",
    "slug": "tudelilla_spain",
    "user_email": "usuario@email.com",
    "created_at": "2026-06-08T18:00:00.000Z"
  }
}
```
