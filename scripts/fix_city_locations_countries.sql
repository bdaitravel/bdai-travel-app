-- scripts/fix_city_locations_countries.sql
-- Ejecutar UNA vez en Supabase Dashboard → SQL Editor, DESPUÉS de haber
-- corrido create_city_locations.sql + backfill_city_locations.sql.
--
-- Corrige las filas de city_locations que quedaron con country = '' porque
-- el mapa de países del backfill original solo reconocía el último token
-- del slug como país — fallaba con países de más de una palabra en el slug
-- (ej. "cape_town_south_africa", "dubai_united_arab_emirates") y con varios
-- países de una palabra que directamente no estaban en la lista (ej. "laos",
-- "senegal", "fiji"). Este script prueba primero los últimos 3 tokens, luego
-- los últimos 2, luego 1 — mismo criterio (ampliado) que ya llevan
-- backfill_city_locations.sql y sync-city-location.md para altas futuras.
--
-- Solo toca filas con country = '' — no reescribe nada que ya estuviera bien.
-- Idempotente: se puede volver a ejecutar sin efectos raros.

with country_map(code, name) as (
  values
    -- Lista original (un token)
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
    -- Ampliación (un token) — encontrados con country vacío en producción
    ('ghana','Ghana'), ('ethiopia','Ethiopia'), ('kazakhstan','Kazakhstan'), ('iraq','Iraq'),
    ('lebanon','Lebanon'), ('philippines','Philippines'), ('senegal','Senegal'), ('tanzania','Tanzania'),
    ('qatar','Qatar'), ('ecuador','Ecuador'), ('cuba','Cuba'), ('nepal','Nepal'), ('rwanda','Rwanda'),
    ('jamaica','Jamaica'), ('malaysia','Malaysia'), ('bolivia','Bolivia'), ('maldives','Maldives'),
    ('monaco','Monaco'), ('uruguay','Uruguay'), ('oman','Oman'), ('fiji','Fiji'), ('kenya','Kenya'),
    ('bahamas','Bahamas'), ('aruba','Aruba'), ('panama','Panama'), ('cambodia','Cambodia'),
    ('iceland','Iceland'), ('latvia','Latvia'), ('taiwan','Taiwan'), ('estonia','Estonia'),
    ('uzbekistan','Uzbekistan'), ('tunisia','Tunisia'), ('zimbabwe','Zimbabwe'), ('lithuania','Lithuania'),
    ('myanmar','Myanmar'), ('laos','Laos'),
    -- Ampliación (dos tokens)
    ('south_africa','South Africa'), ('sri_lanka','Sri Lanka'), ('new_zealand','New Zealand'),
    ('united_states','USA'), ('united_kingdom','United Kingdom'), ('saudi_arabia','Saudi Arabia'),
    ('new_caledonia','New Caledonia'), ('czech_republic','Czech Republic'),
    ('dominican_republic','Dominican Republic'), ('costa_rica','Costa Rica'), ('puerto_rico','Puerto Rico'),
    ('vatican_city','Vatican City'), ('french_polynesia','French Polynesia'),
    ('netherlands_antilles','Netherlands'),
    -- Ampliación (tres tokens)
    ('united_arab_emirates','UAE'), ('papua_new_guinea','Papua New Guinea')
),
-- trim() quita espacios/saltos de línea sueltos al principio o final del slug
-- (hay un par de filas con ese defecto en tours_cache.city original) antes
-- de partirlo en tokens — no afecta al slug real usado para el JOIN final.
tokenized as (
  select
    cl.slug,
    string_to_array(trim(cl.slug), '_') as parts
  from city_locations cl
  where cl.country = ''
),
candidates as (
  select
    slug, parts,
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
    c.slug, c.parts, c.n,
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
update city_locations cl
set
  country = m.country,
  name = initcap(replace(array_to_string(m.parts[1 : greatest(m.city_token_count,1)], '_'), '_', ' ')),
  updated_at = now()
from matched m
where cl.slug = m.slug
  and m.country is not null;

-- Comprobación tras ejecutar:
-- select count(*) filter (where country = '') as sin_pais, count(*) as total from city_locations;
