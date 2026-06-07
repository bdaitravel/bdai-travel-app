-- ============================================================
-- AUDIO INVENTORY TABLE
-- Ejecutar UNA VEZ en Supabase Dashboard → SQL Editor
-- ============================================================
-- Registra el estado de generación de audios por ciudad+idioma
-- cruzando tours_cache (paradas existentes) con audio_cache (hashes generados)

CREATE TABLE IF NOT EXISTS audio_inventory (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug        text        NOT NULL,
  language         text        NOT NULL,
  total_stops      int         NOT NULL DEFAULT 0,
  audios_ok        int         NOT NULL DEFAULT 0,
  has_audio        boolean     NOT NULL DEFAULT false,
  last_checked     timestamptz NOT NULL DEFAULT now(),
  last_generated   timestamptz,
  UNIQUE (city_slug, language)
);

-- Índice para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_audio_inventory_pending
  ON audio_inventory (city_slug, language)
  WHERE has_audio = false;

-- Comentarios descriptivos
COMMENT ON TABLE audio_inventory IS
  'Inventario de estado de audios por ciudad+idioma. Actualizado por generateGcpAudios.ts antes de cada ejecución.';
COMMENT ON COLUMN audio_inventory.city_slug IS
  'Clave de la ciudad en tours_cache, ej: sevilla_spain';
COMMENT ON COLUMN audio_inventory.total_stops IS
  'Número total de paradas con descripción en tours_cache para este city+lang';
COMMENT ON COLUMN audio_inventory.audios_ok IS
  'Número de paradas cuyo text_hash+language existe en audio_cache';
COMMENT ON COLUMN audio_inventory.has_audio IS
  'true si audios_ok >= total_stops y total_stops > 0';
COMMENT ON COLUMN audio_inventory.last_generated IS
  'Timestamp de la última ejecución de generación exitosa';

-- RLS: solo service_role puede escribir; anon puede leer
ALTER TABLE audio_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audio_inventory_read_all" ON audio_inventory
  FOR SELECT USING (true);

CREATE POLICY "audio_inventory_service_write" ON audio_inventory
  FOR ALL USING (auth.role() = 'service_role');
