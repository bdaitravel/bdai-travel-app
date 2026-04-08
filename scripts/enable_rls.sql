-- Activar Row Level Security (RLS) en todas las tablas críticas publicadas
ALTER TABLE tours_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS PARA TOURS_CACHE
-- De acuerdo con AGENTS.md, la app cliente necesita leer, insertar y actualizar los tours generados, pero NUNCA borrar.
-- ==========================================
CREATE POLICY "Permitir SELECT en tours_cache a cualquiera" 
ON tours_cache FOR SELECT 
USING (true);

CREATE POLICY "Permitir INSERT en tours_cache a cualquiera" 
ON tours_cache FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE en tours_cache a cualquiera" 
ON tours_cache FOR UPDATE 
USING (true) WITH CHECK (true);

-- No se crea política para DELETE, lo que previene que los usuarios (anon) borren registros.

-- ==========================================
-- POLÍTICAS PARA AUDIO_CACHE
-- Mismo planteamiento: se permite lectura, inserción y actualización progresiva, sin borrados masivos.
-- ==========================================
CREATE POLICY "Permitir SELECT en audio_cache a cualquiera" 
ON audio_cache FOR SELECT 
USING (true);

CREATE POLICY "Permitir INSERT en audio_cache a cualquiera" 
ON audio_cache FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE en audio_cache a cualquiera" 
ON audio_cache FOR UPDATE 
USING (true) WITH CHECK (true);


-- ==========================================
-- POLÍTICAS PARA PROFILES
-- Los perfiles se crean y actualizan de forma transparente (Zustand -> database) sin auth (de momento).
-- ==========================================
CREATE POLICY "Permitir SELECT en profiles a cualquiera" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Permitir INSERT en profiles a cualquiera" 
ON profiles FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE en profiles a cualquiera" 
ON profiles FOR UPDATE 
USING (true) WITH CHECK (true);


-- ==========================================
-- POLÍTICAS PARA SECRETS
-- Nadie en `public` debe tener acceso. Solo la base de datos interna y Edge Functions con service_role.
-- Activar RLS sin crear políticas restringe completamente el acceso a los roles `anon` y `authenticated`.
-- ==========================================
-- (Ya asegurada al hacer ENABLE ROW LEVEL SECURITY sin políticas asociadas)

