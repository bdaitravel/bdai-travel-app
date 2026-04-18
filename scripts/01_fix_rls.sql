-- 01_fix_rls.sql
-- Solución PROFESIONAL a la vulnerabilidad "rls_disabled_in_public".

-- 1. Habilitar RLS en todas las tablas expuestas
ALTER TABLE tours_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE secrets ENABLE ROW LEVEL SECURITY; -- Comentado: la tabla 'secrets' no existe en `public`.

-- 2. Limpiar políticas inseguras previas
DROP POLICY IF EXISTS "Permitir INSERT en tours_cache a cualquiera" ON tours_cache;
DROP POLICY IF EXISTS "Permitir UPDATE en tours_cache a cualquiera" ON tours_cache;
DROP POLICY IF EXISTS "Permitir INSERT en audio_cache a cualquiera" ON audio_cache;
DROP POLICY IF EXISTS "Permitir UPDATE en audio_cache a cualquiera" ON audio_cache;
DROP POLICY IF EXISTS "Permitir UPDATE en profiles a cualquiera" ON profiles;
DROP POLICY IF EXISTS "Permitir INSERT en profiles a cualquiera" ON profiles;

-- 3. Sólo Lectura para Públicos en Tours y Audio
DROP POLICY IF EXISTS "Permitir SELECT en tours_cache a cualquiera" ON tours_cache;
CREATE POLICY "Permitir SELECT en tours_cache a cualquiera" 
ON tours_cache FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir SELECT en audio_cache a cualquiera" ON audio_cache;
CREATE POLICY "Permitir SELECT en audio_cache a cualquiera" 
ON audio_cache FOR SELECT USING (true);

-- 4. Perfiles (Lectura Pública, o según decidas. Si usas Supabase Auth: = auth.uid())
DROP POLICY IF EXISTS "Permitir SELECT en profiles a cualquiera" ON profiles;
CREATE POLICY "Permitir SELECT en profiles a cualquiera" 
ON profiles FOR SELECT USING (true);
-- Las escrituras al perfil se harán vía RPC para evitar inyecciones masivas si aún no hay Supabase Auth.

-- 5. RPC para guardar Tours (AdminPanel y funciones core)
CREATE OR REPLACE FUNCTION upsert_tours_cache_rpc(
    p_city text, 
    p_language text, 
    p_data jsonb, 
    p_route_polylines jsonb, 
    p_status text,
    p_locked_until timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO tours_cache (city, language, data, route_polylines, status, locked_until, updated_at) 
    VALUES (p_city, p_language, p_data, COALESCE(p_route_polylines, '{}'::jsonb), p_status, p_locked_until, now())
    ON CONFLICT (city, language) 
    DO UPDATE SET 
        data = EXCLUDED.data,
        route_polylines = EXCLUDED.route_polylines,
        status = EXCLUDED.status,
        locked_until = EXCLUDED.locked_until,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- 6. RPC para Comunidad
CREATE OR REPLACE FUNCTION add_community_post(p_city text, p_posts jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO tours_cache (city, language, data, status, updated_at) 
    VALUES (p_city, 'community', p_posts, 'READY', now())
    ON CONFLICT (city, language) 
    DO UPDATE SET 
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- 7. RPC para Perfiles (Transición sin Auth directo)
CREATE OR REPLACE FUNCTION upsert_profile_rpc(p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Utiliza el email como conflict target
    INSERT INTO profiles (
        id, email, username, first_name, last_name, name, miles, language, avatar, rank,
        culture_points, food_points, photo_points, history_points, nature_points, art_points, arch_points,
        interests, accessibility, is_public, bio, age, birthday, city, country, stats,
        visited_cities, completed_tours, badges, stamps, captured_moments, audio_speed, updated_at
    ) 
    VALUES (
        ((p_payload->>'id'))::uuid, 
        p_payload->>'email', 
        p_payload->>'username', 
        p_payload->>'first_name', 
        p_payload->>'last_name', 
        p_payload->>'name', 
        (p_payload->>'miles')::int, 
        p_payload->>'language', 
        p_payload->>'avatar', 
        p_payload->>'rank',
        COALESCE((p_payload->>'culture_points')::int, 0),
        COALESCE((p_payload->>'food_points')::int, 0),
        COALESCE((p_payload->>'photo_points')::int, 0),
        COALESCE((p_payload->>'history_points')::int, 0),
        COALESCE((p_payload->>'nature_points')::int, 0),
        COALESCE((p_payload->>'art_points')::int, 0),
        COALESCE((p_payload->>'arch_points')::int, 0),
        (p_payload->>'interests')::jsonb,
        p_payload->>'accessibility',
        (p_payload->>'is_public')::boolean,
        p_payload->>'bio',
        (p_payload->>'age')::int,
        p_payload->>'birthday',
        p_payload->>'city',
        p_payload->>'country',
        (p_payload->>'stats')::jsonb,
        (p_payload->>'visited_cities')::jsonb,
        (p_payload->>'completed_tours')::jsonb,
        (p_payload->>'badges')::jsonb,
        (p_payload->>'stamps')::jsonb,
        (p_payload->>'captured_moments')::jsonb,
        COALESCE((p_payload->>'audio_speed')::numeric, 1.0),
        now()
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        name = EXCLUDED.name,
        miles = EXCLUDED.miles,
        language = EXCLUDED.language,
        avatar = EXCLUDED.avatar,
        rank = EXCLUDED.rank,
        culture_points = EXCLUDED.culture_points,
        food_points = EXCLUDED.food_points,
        photo_points = EXCLUDED.photo_points,
        history_points = EXCLUDED.history_points,
        nature_points = EXCLUDED.nature_points,
        art_points = EXCLUDED.art_points,
        arch_points = EXCLUDED.arch_points,
        interests = EXCLUDED.interests,
        accessibility = EXCLUDED.accessibility,
        is_public = EXCLUDED.is_public,
        bio = EXCLUDED.bio,
        age = EXCLUDED.age,
        birthday = EXCLUDED.birthday,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        stats = EXCLUDED.stats,
        visited_cities = EXCLUDED.visited_cities,
        completed_tours = EXCLUDED.completed_tours,
        badges = EXCLUDED.badges,
        stamps = EXCLUDED.stamps,
        captured_moments = EXCLUDED.captured_moments,
        audio_speed = EXCLUDED.audio_speed,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- 8. RPC para Bloqueo de City Generation
CREATE OR REPLACE FUNCTION lock_tour_cache_rpc(p_city text, p_language text, p_locked_until timestamptz)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status text;
    v_locked_until timestamptz;
BEGIN
    v_status := (SELECT status FROM tours_cache WHERE city = p_city AND language = p_language LIMIT 1);
    v_locked_until := (SELECT locked_until FROM tours_cache WHERE city = p_city AND language = p_language LIMIT 1);
    
    IF v_status IS NOT NULL THEN
        IF v_status = 'GENERATING' AND v_locked_until > now() THEN
            RETURN false;
        END IF;
        
        UPDATE tours_cache SET status = 'GENERATING', locked_until = p_locked_until, updated_at = now()
        WHERE city = p_city AND language = p_language;
    ELSE
        INSERT INTO tours_cache (city, language, data, status, locked_until, updated_at)
        VALUES (p_city, p_language, '[]'::jsonb, 'GENERATING', p_locked_until, now());
    END IF;
    RETURN true;
END;
$$;

-- 9. RPC para borrar en cache (AdminPanel)
CREATE OR REPLACE FUNCTION delete_tours_cache_rpc(p_city text, p_language text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM tours_cache WHERE city = p_city AND language = p_language;
END;
$$;
