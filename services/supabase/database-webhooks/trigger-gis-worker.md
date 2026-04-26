# Database Webhook: Trigger GIS Worker

**Misión**: Despierta a la Edge Function de Validación Geográfica (GIS) en cuanto Gemini termina de generar las paradas y actualiza el estado del trabajo.

## Configuración en el Dashboard de Supabase

- **Name**: `Trigger GIS Worker`
- **Table**: `generation_jobs`
- **Events**: `Update` (SOLO activado para actualizaciones)
- **Type**: `Webhook`
- **Method**: `POST`
- **URL**: `https://slldavgsoxunkphqeamx.supabase.co/functions/v1/tour-worker-gis`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TU_ANON_KEY>` (Requerido si la función no es pública).

## Filtros Recomendados (Opcional pero muy útil)
Para evitar que el webhook se dispare innecesariamente en *cualquier* update de la tabla, lo ideal es que configuremos un trigger en la base de datos o utilicemos las opciones de filtrado de webhooks de Supabase si están disponibles:
- Condición: `old_record.status = 'PENDING_AI' AND record.status = 'PENDING_GIS'`

## Flujo de Eventos
1. `tour-worker-ai` hace un `UPDATE` en la tabla `generation_jobs`, inyectando el JSON bruto de Gemini en `raw_ai_data` y cambiando `status` a `'PENDING_GIS'`.
2. Este webhook se dispara automáticamente debido al `UPDATE`.
3. El payload del webhook contiene `{ "type": "UPDATE", "record": { "id": "...", "status": "PENDING_GIS", "raw_ai_data": [...] }, "old_record": {...} }`.
4. La Edge Function `tour-worker-gis` recibe el payload, verifica que el estado es `PENDING_GIS` y comienza la verificación masiva contra Nominatim.
