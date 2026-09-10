-- scripts/backfill_city_locations.sql
-- Ejecutar UNA vez en Supabase Dashboard → SQL Editor, DESPUÉS de
-- create_city_locations.sql. Calcula el centro de cada ciudad con al menos
-- un tour READY como el centroide (promedio) de las coordenadas de sus
-- paradas ya existentes en tours_cache.data — no llama a ningún servicio
-- externo, todo el dato ya está en la base de datos.
--
-- Es idempotente por el ON CONFLICT DO NOTHING: se puede volver a ejecutar
-- sin duplicar ni pisar filas ya existentes.
--
-- El mapeo de slug de país → nombre replica (ampliado) el de
-- services/supabase/edge-functions/sync-city-location.md. Si se añade un
-- país nuevo a un fichero, replicarlo en el otro.

with country_map(code, name) as (
  values
    ('spain','Spain'), ('france','France'), ('italy','Italy'), ('germany','Germany'),
    ('portugal','Portugal'), ('uk','United Kingdom'), ('england','England'), ('usa','USA'),
    ('mexico','Mexico'), ('argentina','Argentina'), ('brazil','Brazil'), ('colombia','Colombia'),
    ('chile','Chile'), ('peru','Peru'), ('japan','Japan'), ('china','China'), ('india','India'),
    ('australia','Australia'), ('canada','Canada'), ('netherlands','Netherlands'), ('belgium','Belgium'),
    ('switzerland','Switzerland'), ('austria','Austria'), ('greece','Greece'), ('turkey','Turkey'),
    ('poland','Poland'), ('czech','Czech Republic'), ('hungary','Hungary'), ('romania','Romania'),
    ('russia','Russia'), ('ukraine','Ukraine'), ('norway','Norway'), ('sweden','Sweden'),
    ('denmark','Denmark'), ('finland','Finland'), ('ireland','Ireland'), ('croatia','Croatia'),
    ('morocco','Morocco'), ('egypt','Egypt'), ('thailand','Thailand'), ('vietnam','Vietnam'),
    ('indonesia','Indonesia'), ('korea','South Korea'), ('singapore','Singapore'), ('israel','Israel'),
    ('jordan','Jordan'), ('uae','UAE'),
    ('ghana','Ghana'), ('ethiopia','Ethiopia'), ('kazakhstan','Kazakhstan'), ('iraq','Iraq'),
    ('lebanon','Lebanon'), ('philippines','Philippines'), ('senegal','Senegal'), ('tanzania','Tanzania'),
    ('qatar','Qatar'), ('ecuador','Ecuador'), ('cuba','Cuba'), ('nepal','Nepal'), ('rwanda','Rwanda'),
    ('jamaica','Jamaica'), ('malaysia','Malaysia'), ('bolivia','Bolivia'), ('maldives','Maldives'),
    ('monaco','Monaco'), ('uruguay','Uruguay'), ('oman','Oman'), ('fiji','Fiji'), ('kenya','Kenya'),
    ('bahamas','Bahamas'), ('aruba','Aruba'), ('panama','Panama'), ('cambodia','Cambodia'),
    ('iceland','Iceland'), ('latvia','Latvia'), ('taiwan','Taiwan'), ('estonia','Estonia'),
    ('uzbekistan','Uzbekistan'), ('tunisia','Tunisia'), ('zimbabwe','Zimbabwe'), ('lithuania','Lithuania'),
    ('myanmar','Myanmar'), ('laos','Laos'),
    ('south_africa','South Africa'), ('sri_lanka','Sri Lanka'), ('new_zealand','New Zealand'),
    ('united_states','USA'), ('united_kingdom','United Kingdom'), ('saudi_arabia','Saudi Arabia'),
    ('new_caledonia','New Caledonia'), ('czech_republic','Czech Republic'),
    ('dominican_republic','Dominican Republic'), ('costa_rica','Costa Rica'), ('puerto_rico','Puerto Rico'),
    ('vatican_city','Vatican City'), ('french_polynesia','French Polynesia'),
    ('netherlands_antilles','Netherlands'),
    ('united_arab_emirates','UAE'), ('papua_new_guinea','Papua New Guinea')
),
-- Aplana cada parada de cada tour no patrocinado de cada ciudad READY
stops as (
  select
    tc.city as slug,
    (stop->>'latitude')::double precision as lat,
    (stop->>'longitude')::double precision as lng
  from tours_cache tc,
       jsonb_array_elements(tc.data) as tour,
       jsonb_array_elements(tour->'stops') as stop
  where tc.status = 'READY'
    and coalesce((tour->>'isSponsored')::boolean, false) = false
    and (stop->>'latitude') is not null
    and (stop->>'longitude') is not null
    and not ((stop->>'latitude')::double precision = 0 and (stop->>'longitude')::double precision = 0)
),
centroids as (
  select slug, avg(lat) as lat, avg(lng) as lng
  from stops
  group by slug
),
-- trim() quita espacios/saltos de línea sueltos que puedan colarse en
-- tours_cache.city antes de partir el slug en tokens.
tokenized as (
  select slug, lat, lng, string_to_array(trim(slug), '_') as parts
  from centroids
),
-- Prueba país de 3, 2 y 1 token (de más a menos específico) para cubrir
-- tanto slugs simples ("logrono_spain") como compuestos
-- ("cape_town_south_africa", "abu_dhabi_united_arab_emirates").
candidates as (
  select
    slug, lat, lng, parts,
    array_length(parts, 1) as n,
    case when array_length(parts,1) >= 3
         then array_to_string(parts[array_length(parts,1)-2 : array_length(parts,1)], '_') end as suf3,
    case when array_length(parts,1) >= 2
         then array_to_string(parts[array_length(parts,1)-1 : array_length(parts,1)], '_') end as suf2,
    parts[array_length(parts,1)] as suf1
  from tokenized
),
matched as (
  select
    c.slug, c.lat, c.lng, c.parts, c.n,
    coalesce(cm3.name, cm2.name, cm1.name) as country,
    case
      when cm3.name is not null then c.n - 3
      when cm2.name is not null then c.n - 2
      when cm1.name is not null then c.n - 1
      else c.n
    end as city_token_count
  from candidates c
  left join country_map cm3 on cm3.code = c.suf3
  left join country_map cm2 on cm2.code = c.suf2
  left join country_map cm1 on cm1.code = c.suf1
)
insert into city_locations (slug, name, country, lat, lng)
select
  m.slug,
  initcap(replace(array_to_string(m.parts[1 : greatest(m.city_token_count,1)], '_'), '_', ' ')) as name,
  coalesce(m.country, '') as country,
  m.lat,
  m.lng
from matched m
on conflict (slug) do nothing;

-- Comprobación rápida tras ejecutar:
-- select count(*) filter (where country = '') as sin_pais, count(*) as total from city_locations;
