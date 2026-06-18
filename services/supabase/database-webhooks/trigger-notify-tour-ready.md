# Database Webhook: Trigger Notify Tour Ready

**Misión**: Notifica por email a todos los usuarios que solicitaron un tour cuando ese tour pasa a `READY` en `tours_cache`, ya sea por el pipeline automático o por creación manual desde el Dashboard.

## Configuración en el Dashboard de Supabase

- **Name**: `Trigger Notify Tour Ready`
- **Table**: `tours_cache`
- **Events**: `Insert`, `Update`
- **Type**: `Webhook`
- **Method**: `POST`
- **URL**: `https://slldavgsoxunkphqeamx.supabase.co/functions/v1/notify-tour-ready`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TU_ANON_KEY>`

## Funcionamiento

El webhook se dispara en cualquier INSERT o UPDATE sobre `tours_cache`. La edge function filtra internamente y solo actúa cuando `record.status === 'READY'`. Esto cubre:

- ✅ Tours creados por el pipeline automático (`tour-worker-gis-02`)
- ✅ Tours creados o actualizados **manualmente** desde el Dashboard de Supabase

## Flujo de Eventos

1. `tours_cache` recibe un upsert con `status: 'READY'` (automático o manual)
2. Este webhook se dispara automáticamente
3. `notify-tour-ready` consulta `tour_requests` donde `slug = record.city` AND `notified_at IS NULL`
4. Deduplica por `user_email` (evita dobles emails al mismo usuario)
5. Envía un email a cada usuario único desde `SMTP_USER`
6. Actualiza `notified_at` en todas las filas procesadas para evitar reenvíos

## Secrets necesarios (ya existentes)

- `SMTP_HOSTNAME`
- `SMTP_PORT`
- `SMTP_USER` — también usado como dirección `From`
- `SMTP_PASS`
- `MY_SERVICE_ROLE_KEY` (o `SUPABASE_SERVICE_ROLE_KEY` — inyectado automáticamente)

## Payload de ejemplo

```json
{
  "type": "UPDATE",
  "record": {
    "city": "logrono_spain",
    "language": "es",
    "status": "READY",
    "updated_at": "2026-06-18T16:00:00.000Z"
  }
}
```
