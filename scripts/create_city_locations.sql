-- scripts/create_city_locations.sql
-- Ejecutar UNA vez en Supabase Dashboard → SQL Editor.
-- Crea la tabla que alimenta el mapa de descubrimiento de tours
-- (components/CityDiscoveryMap.tsx) — ver AGENTS.md "Mapa de descubrimiento
-- de tours" para el contexto completo.

create table if not exists city_locations (
  slug text primary key,
  name text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

alter table city_locations enable row level security;

-- Lectura pública: el cliente anónimo consulta esta tabla directamente desde
-- getCityLocationsWithTours() en toursService.ts para pintar el mapa.
create policy "public read city_locations" on city_locations
  for select using (true);

-- Sin política de INSERT/UPDATE/DELETE a propósito: solo escribe el
-- service_role (este backfill y, más adelante, la Edge Function
-- sync-city-location), nunca el cliente.
