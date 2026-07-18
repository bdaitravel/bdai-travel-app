-- ============================================================================
-- TOUR PATROCINADO — Logroño, 2 paradas
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Requiere: tabla sponsored_tours ya creada (scripts/create_sponsored_tours.sql)
--
-- Coordenadas geocodificadas (2026-07-04):
--   · Bar Ejemplo 1 — Calle Duquesa de la Victoria 35 → 42.464726, -2.438850
--     (portal exacto en OSM, nodo 9231288295)
--   · Bar Ejemplo 2 — Calle Calvo Sotelo 34 → 42.463896, -2.441047
--     (nombre oficial de la vía: Calle Presidente Leopoldo Calvo Sotelo;
--      posición del nº 34 vía Photon, nodo OSM 13208188081)
--
-- Convención de IDs: {slug}_{lang}_sp{n} / ..._stop{m}
-- ============================================================================
INSERT INTO sponsored_tours (city_slug, language, data, active, sponsor_name)
VALUES (
  'logrono_spain',
  'es',
  '[
    {
      "id": "logrono_spain_es_sp0",
      "city": "Logroño",
      "country": "Spain",
      "title": "Paradas recomendadas de Logroño",
      "description": "Selección de negocios locales recomendados en Logroño. Sin ruta fija: visita cada parada cuando quieras y pulsa sobre ella para leer su descripción.",
      "duration": "Libre",
      "distance": "—",
      "difficulty": "Easy",
      "theme": "Patrocinado",
      "isSponsored": true,
      "stops": [
        {
          "id": "logrono_spain_es_sp0_stop0",
          "name": "Bar Ejemplo 1",
          "description": "El pintxo estrella del Bar Ejemplo 1 es ...",
          "latitude": 42.464726,
          "longitude": -2.438850,
          "type": "food",
          "visited": false,
          "coordinatesVerified": true,
          "business": {
            "type": "cafe",
            "address": "Calle Duquesa de la Victoria 35, Logroño",
            "benefit": "El beneficio es ..."
          }
        },
        {
          "id": "logrono_spain_es_sp0_stop1",
          "name": "Bar Ejemplo 2",
          "description": "El pintxo estrella del Bar Ejemplo 2 es ...",
          "latitude": 42.463896,
          "longitude": -2.441047,
          "type": "food",
          "visited": false,
          "coordinatesVerified": true,
          "business": {
            "type": "cafe",
            "address": "Calle Calvo Sotelo 34, Logroño",
            "benefit": "El beneficio es ..."
          }
        }
      ]
    }
  ]'::jsonb,
  true,
  'Bar Ejemplo 1 y Bar Ejemplo 2'
)
ON CONFLICT (city_slug, language) DO UPDATE
SET data = EXCLUDED.data,
    active = EXCLUDED.active,
    sponsor_name = EXCLUDED.sponsor_name;

-- ============================================================================
-- VERIFICACIÓN — debe devolver 1 fila con 2 paradas
-- ============================================================================
SELECT city_slug, language, active, sponsor_name,
       jsonb_array_length(data->0->'stops') AS num_paradas,
       data->0->'stops'->0->>'name' AS parada_1,
       data->0->'stops'->1->>'name' AS parada_2
FROM sponsored_tours
WHERE city_slug = 'logrono_spain';
