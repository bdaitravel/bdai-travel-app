# Database Webhook: Trigger AI Worker 02

**Misión**: Despierta a la Edge Function de Inteligencia Artificial (Gemini via GCP Service Account) en cuanto el orquestador `-02` encola un nuevo trabajo. Es el equivalente `-02` de `Trigger AI Worker`.

## Configuración en el Dashboard de Supabase

- **Name**: `Trigger AI Worker 02`
- **Table**: `generation_jobs`
- **Events**: `Insert` (SOLO activado para inserciones)
- **Type**: `Supabase Edge Functions`
- **Edge Function**: `tour-worker-ai-02`
- **Method**: `POST`
- **Timeout**: `5000ms` (el webhook espera el ACK; la función sigue corriendo en background hasta completarse)
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <SUPABASE_ANON_KEY>`

## Flujo de Eventos

1. `tour-orchestratror-02` (con typo intencional — así está desplegada) hace un `INSERT` en `generation_jobs` con `status = 'PENDING_AI_02'`.
2. Este webhook se dispara automáticamente.
3. El payload del webhook contiene `{ "type": "INSERT", "record": { "id": "...", "status": "PENDING_AI_02", "city_info": { "city": "...", "country": "..." }, ... } }`.
4. La Edge Function `tour-worker-ai-02` recibe el payload, obtiene contexto GIS (Nominatim + Overpass), llama a Gemini (`gemini-2.5-flash` con Google Search grounding) y actualiza el job a `PENDING_GIS_02`.

## Notas importantes

- La función autentica a Gemini vía **GCP Service Account** (secret `GCP_SERVICE_ACCOUNT`), no vía API key directa. Requiere que el secret esté configurado en Supabase Edge Functions.
- El filtro de status (`PENDING_AI_02`) se aplica **dentro del código** de la función (no en el webhook). El webhook dispara en cualquier INSERT, y la función filtra.
