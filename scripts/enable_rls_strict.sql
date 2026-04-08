-- Activar Row Level Security (RLS) en todas las tablas críticas
ALTER TABLE tours_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS PARA TOURS_CACHE (ESTRICTAS)
-- Los usuarios solo pueden LEER. Nadie en el cliente puede modificar tours.
-- (Cuidado: esto asume que moverás la lógica de generación a una Edge Function,
--  porque actualmente geminiService.ts intenta guardar el tour desde el frontend).
-- ==========================================
CREATE POLICY "Permitir SELECT en tours_cache a cualquiera" 
ON tours_cache FOR SELECT 
USING (true);

-- No hay política de INSERT, UPDATE o DELETE para el cliente.
-- Solo Edge Functions (usando service_role) podrán guardarlos.


-- ==========================================
-- POLÍTICAS PARA PROFILES (SÚPER ESTRICTAS)
-- Un usuario solo puede ver y modificar su propio perfil, asumiendo que usas
-- Supabase Auth (donde el ID del perfil cuadra con auth.uid()).
-- ==========================================
-- Para ver su perfil:
CREATE POLICY "Usuarios ven solo su perfil" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Para crear su perfil al registrarse:
CREATE POLICY "Usuarios insertan solo su perfil" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Para editar su perfil:
CREATE POLICY "Usuarios editan solo su perfil" 
ON profiles FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);


-- ==========================================
-- POLÍTICAS PARA AUDIO_CACHE 
-- Asumiendo que el cliente todavía necesita leer audios.
-- Si la Edge Function es la única que los inserta:
-- ==========================================
CREATE POLICY "Permitir SELECT en audio_cache" 
ON audio_cache FOR SELECT 
USING (true);

-- Si actualmente el cliente hace el INSERT desde el navegador para guardar
-- hashes re-usables (al volver de invocar a tu edge function), necesitarás permitirlo.
-- Si la Edge Function mete el audio de forma directa usando "service_role", 
-- entonces borra esta regla y no autorices INSERTS.
CREATE POLICY "Permitir INSERT en audio_cache" 
ON audio_cache FOR INSERT 
WITH CHECK (true);


-- ==========================================
-- POLÍTICAS PARA SECRETS
-- Cierre total. Solo accesible vía service_role en el backend.
-- ==========================================
-- Sin políticas -> Totalmente denegado para el tráfico de la web.
