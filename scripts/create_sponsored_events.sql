-- ============================================================================
-- SPONSORED EVENTS — analítica de tours patrocinados
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- Registra dos eventos por parada patrocinada:
--   · check_in     → el usuario verificó por GPS que está en el local (≤50m)
--   · benefit_open → el usuario abrió el modal del beneficio (requiere check-in previo)
--
-- Seguridad: el cliente SOLO puede insertar (nunca leer, modificar ni borrar).
-- La lectura/agregación se hace desde el Dashboard o scripts con service_role.
-- Esto evita que un cliente pueda extraer emails de otros usuarios.
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsored_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug  TEXT NOT NULL,                    -- mismo slug que sponsored_tours.city_slug
  tour_id    TEXT NOT NULL,                    -- ej. agoncillo_spain_es_sp0
  stop_id    TEXT NOT NULL,                    -- ej. agoncillo_spain_es_sp0_stop0
  event_type TEXT NOT NULL CHECK (event_type IN ('check_in', 'benefit_open')),
  user_email TEXT NOT NULL DEFAULT 'anonymous',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para las agregaciones habituales (informe por parada y tipo de evento)
CREATE INDEX IF NOT EXISTS idx_sponsored_events_stop
  ON sponsored_events (stop_id, event_type);

CREATE INDEX IF NOT EXISTS idx_sponsored_events_city
  ON sponsored_events (city_slug, created_at);

-- ============================================================================
-- RLS — INSERT-only para el cliente
-- ============================================================================
ALTER TABLE sponsored_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert eventos sponsored" ON sponsored_events;
CREATE POLICY "insert eventos sponsored"
ON sponsored_events FOR INSERT
WITH CHECK (true);

-- Sin políticas de SELECT/UPDATE/DELETE a propósito: el cliente no puede leer
-- eventos (protege los emails) ni alterar el histórico. Solo service_role.

-- ============================================================================
-- CONSULTAS DE INFORME (ejecutar en SQL Editor cuando quieras ver métricas)
-- ============================================================================

-- Personas únicas que hicieron check-in y que abrieron el beneficio, por parada
-- (COUNT DISTINCT user_email = personas; COUNT(*) = pulsaciones totales)
SELECT
  stop_id,
  event_type,
  COUNT(DISTINCT user_email) AS personas_unicas,
  COUNT(*)                   AS pulsaciones_totales,
  MIN(created_at)            AS primer_evento,
  MAX(created_at)            AS ultimo_evento
FROM sponsored_events
GROUP BY stop_id, event_type
ORDER BY stop_id, event_type;

-- Embudo por local: cuántos llegaron (check-in) vs cuántos abrieron el beneficio
-- SELECT
--   stop_id,
--   COUNT(DISTINCT user_email) FILTER (WHERE event_type = 'check_in')     AS personas_checkin,
--   COUNT(DISTINCT user_email) FILTER (WHERE event_type = 'benefit_open') AS personas_beneficio
-- FROM sponsored_events
-- GROUP BY stop_id;

-- Actividad de los últimos 30 días por ciudad
-- SELECT city_slug, event_type, COUNT(*) AS eventos
-- FROM sponsored_events
-- WHERE created_at > now() - interval '30 days'
-- GROUP BY city_slug, event_type
-- ORDER BY city_slug;
