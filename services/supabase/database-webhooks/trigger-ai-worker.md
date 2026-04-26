# Database Webhook: Trigger AI Worker

**Misión**: Despierta a la Edge Function de Inteligencia Artificial (Gemini) en cuanto el orquestador encola un nuevo trabajo.

## Configuración en el Dashboard de Supabase

- **Name**: `Trigger AI Worker`
- **Table**: `generation_jobs`
- **Events**: `Insert` (SOLO activado para inserciones)
- **Type**: `Webhook`
- **Method**: `POST`
- **URL**: `https://slldavgsoxunkphqeamx.supabase.co/functions/v1/tour-worker-gis`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TU_ANON_KEY>` (Requerido si la función no es pública, aunque por defecto las webhooks mandan el JWT del service role o anon, se recomienda verificar).

## Flujo de Eventos
1. `tour-orchestrator` hace un `INSERT` en la tabla `generation_jobs` con `status = 'PENDING_AI'`.
2. Este webhook se dispara automáticamente.
3. El payload del webhook contiene `{ "type": "INSERT", "record": { "id": "...", "status": "PENDING_AI", ... } }`.
4. La Edge Function `tour-worker-ai` recibe el payload e inicia el trabajo con Gemini.
