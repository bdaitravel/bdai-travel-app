-- ============================================================================
-- SPONSORED TOURS — tabla de tours patrocinados (paradas de negocios locales)
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- Ciclo de vida independiente de tours_cache: los tours patrocinados se crean
-- a mano por contrato comercial y NO deben ser sobreescritos por el pipeline
-- de generación IA (-02). Por eso viven en su propia tabla.
--
-- Seguridad: el cliente SOLO puede leer tours activos y en vigencia.
-- Sin políticas de INSERT/UPDATE/DELETE → escribir queda reservado a
-- service_role (Dashboard, scripts con service key o edge functions).
-- ============================================================================

CREATE TABLE IF NOT EXISTS sponsored_tours (
  city_slug    TEXT NOT NULL,
  language     TEXT NOT NULL,
  data         JSONB NOT NULL,                      -- Tour[] (cada tour lleva isSponsored: true)
  active       BOOLEAN NOT NULL DEFAULT true,       -- interruptor: apagar sin borrar si el contrato termina
  sponsor_name TEXT,                                -- nombre comercial del patrocinador (facturación/auditoría)
  starts_at    TIMESTAMPTZ NOT NULL DEFAULT now(),  -- inicio de vigencia del contrato
  ends_at      TIMESTAMPTZ,                         -- fin de vigencia; NULL = sin caducidad
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (city_slug, language)
);

-- Mantener updated_at al día en cada UPDATE
CREATE OR REPLACE FUNCTION set_sponsored_tours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sponsored_tours_updated_at ON sponsored_tours;
CREATE TRIGGER trg_sponsored_tours_updated_at
  BEFORE UPDATE ON sponsored_tours
  FOR EACH ROW EXECUTE FUNCTION set_sponsored_tours_updated_at();

-- ============================================================================
-- RLS — el cliente (anon/authenticated) solo lee lo activo y en vigencia
-- ============================================================================
ALTER TABLE sponsored_tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select sponsored activos" ON sponsored_tours;
CREATE POLICY "select sponsored activos"
ON sponsored_tours FOR SELECT
USING (
  active
  AND starts_at <= now()
  AND (ends_at IS NULL OR ends_at > now())
);

-- Sin políticas de escritura a propósito: INSERT/UPDATE/DELETE denegados
-- para anon y authenticated. Solo service_role puede escribir.

-- ============================================================================
-- TOUR DE EJEMPLO — Agoncillo, 1 parada: Bar Ejemplo 1 (Plaza del Castillo 17)
-- Coordenadas verificadas manualmente: 42.446557, -2.291210
--
-- Convención de ID: {slug}_{lang}_sp{n} — el sufijo "sp" distingue los tours
-- patrocinados para que la rehidratación del frontend sepa en qué tabla buscar.
-- ============================================================================
INSERT INTO sponsored_tours (city_slug, language, data, active, sponsor_name)
VALUES (
  'agoncillo_spain',
  'es',
  '[
    {
      "id": "agoncillo_spain_es_sp0",
      "city": "Agoncillo",
      "country": "Spain",
      "title": "Paradas recomendadas de Agoncillo",
      "description": "Selección de negocios locales recomendados en Agoncillo. Sin ruta fija: visita cada parada cuando quieras y pulsa sobre ella para leer su descripción.",
      "duration": "Libre",
      "distance": "—",
      "difficulty": "Easy",
      "theme": "Patrocinado",
      "isSponsored": true,
      "stops": [
        {
          "id": "agoncillo_spain_es_sp0_stop0",
          "name": "Bar Ejemplo 1",
          "description": "El pintxo estrella del Bar Ejemplo 1 es ...",
          "latitude": 42.446557,
          "longitude": -2.291210,
          "type": "food",
          "visited": false,
          "coordinatesVerified": true,
          "business": {
            "type": "cafe",
            "address": "Plaza del Castillo 17, Agoncillo",
            "benefit": "El beneficio es ..."
          }
        }
      ]
    }
  ]'::jsonb,
  true,
  'Bar Ejemplo 1'
)
ON CONFLICT (city_slug, language) DO UPDATE
SET data = EXCLUDED.data,
    active = EXCLUDED.active,
    sponsor_name = EXCLUDED.sponsor_name;

-- ============================================================================
-- VERIFICACIÓN — debe devolver 1 fila con el tour de Agoncillo
-- ============================================================================
SELECT city_slug, language, active, sponsor_name,
       jsonb_array_length(data) AS num_tours,
       data->0->'stops'->0->>'name' AS primera_parada
FROM sponsored_tours
WHERE city_slug = 'agoncillo_spain';
