# Database Webhook: Trigger Sync City Location

**Misión**: Mantiene al día la tabla `city_locations` (centro de cada ciudad con tours, usada por el mapa de descubrimiento en `components/CityDiscoveryMap.tsx`) — cuando una ciudad recibe su primer tour en `READY`, calcula y guarda su centroide automáticamente. No recalcula ciudades que ya tienen fila.

## Configuración en el Dashboard de Supabase

- **Name**: `Trigger Sync City Location`
- **Table**: `tours_cache`
- **Events**: `Insert`, `Update`
- **Type**: `Webhook`
- **Method**: `POST`
- **URL**: `https://slldavgsoxunkphqeamx.supabase.co/functions/v1/sync-city-location`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TU_ANON_KEY>`

## Requisitos previos

1. Haber ejecutado `scripts/create_city_locations.sql` (crea la tabla).
2. Haber ejecutado `scripts/backfill_city_locations.sql` (rellena las ciudades ya existentes) — este webhook solo cubre ciudades **nuevas** a partir de aquí, no sustituye el backfill inicial.
3. Haber desplegado la Edge Function `sync-city-location` (ver `services/supabase/edge-functions/sync-city-location.md`).

## Funcionamiento

El webhook se dispara en cualquier INSERT o UPDATE sobre `tours_cache`. La edge function filtra internamente:

1. Ignora si `record.status !== 'READY'`
2. Consulta `city_locations` por `slug = record.city` — si ya existe, no hace nada (idempotente, el centroide no se recalcula en actualizaciones posteriores)
3. Si no existe, calcula el centroide de las paradas no patrocinadas de `record.data` y hace `INSERT` en `city_locations`

## Secrets necesarios (ya existentes)

- `MY_SERVICE_ROLE_KEY` (o `SUPABASE_SERVICE_ROLE_KEY` — inyectado automáticamente)

## Payload de ejemplo

```json
{
  "type": "INSERT",
  "record": {
    "city": "nueva_ciudad_spain",
    "language": "es",
    "status": "READY",
    "data": [ { "stops": [ { "latitude": 42.1, "longitude": -2.4 } ] } ]
  }
}
```
