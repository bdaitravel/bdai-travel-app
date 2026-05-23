# Database Webhook: Trigger GIS Worker 02

**Misión**: Despierta a la Edge Function de Validación Geográfica (GIS) en cuanto el AI Worker `-02` termina de generar las paradas y actualiza el job a `PENDING_GIS_02`. Es el equivalente `-02` de `Trigger GIS Worker`.

## Configuración en el Dashboard de Supabase

- **Name**: `Trigger GIS Worker 02`
- **Table**: `generation_jobs`
- **Events**: `Update` (SOLO activado para actualizaciones)
- **Type**: `Supabase Edge Functions`
- **Edge Function**: `tour-worker-gis-02`
- **Method**: `POST`
- **Timeout**: `5000ms` (el webhook espera el ACK; la función sigue corriendo en background — la verificación Nominatim puede tardar varios minutos con 24 paradas)
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <SUPABASE_ANON_KEY>`

## Flujo de Eventos

1. `tour-worker-ai-02` hace un `UPDATE` en `generation_jobs`, inyectando el JSON de Gemini en `raw_ai_data`, el contexto geográfico en `city_info` (con `lat`, `lon`, `radiusKm` dinámico, `bbox`) y cambiando `status` a `'PENDING_GIS_02'`.
2. Este webhook se dispara automáticamente debido al `UPDATE`.
3. El payload del webhook contiene `{ "type": "UPDATE", "record": { "id": "...", "status": "PENDING_GIS_02", "raw_ai_data": [...], "city_info": {...} }, "old_record": {...} }`.
4. La Edge Function `tour-worker-gis-02` recibe el payload, verifica que el status es `PENDING_GIS_02`, valida coordenadas contra Nominatim/Photon (con fallback a BBox de Gemini), optimiza la ruta (NN + 2-opt + Or-opt + OSRM polyline) y guarda el resultado final en `tours_cache` con `status = 'READY'`.

## Notas importantes

- El filtro de status (`PENDING_GIS_02`) se aplica **dentro del código** de la función (no en el webhook). El webhook dispara en cualquier UPDATE de `generation_jobs`, y la función filtra al comprobar `job.status !== 'PENDING_GIS_02'`.
- El radio mínimo de verificación GIS es **20km** (`Math.max(20, cityInfo.radiusKm)`), lo que cubre el casco urbano de cualquier ciudad española sin descartar paradas legítimas.
- Si hay menos de 4 paradas verificadas, la función guarda un "empty tour" con sabor DAI en lugar de fallar.
- Tras guardar en `tours_cache`, actualiza el job a `COMPLETED`.
