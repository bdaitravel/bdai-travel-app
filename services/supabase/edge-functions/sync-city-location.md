// services/supabase/edge-functions/sync-city-location.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'sync-city-location'
// Se dispara vía Database Webhook en tours_cache (INSERT + UPDATE).
// Cuando una ciudad tiene su PRIMER tour en status READY, calcula el centro de
// la ciudad (centroide de las paradas de ese tour) y lo guarda en la tabla
// `city_locations`, que alimenta el mapa de descubrimiento de la pestaña
// "tours" (components/CityDiscoveryMap.tsx). Si la ciudad ya tenía fila en
// city_locations, no hace nada — el centroide no se recalcula en cada
// actualización posterior, solo se fija una vez.
//
// DESPLIEGUE:
//   1. Crear la tabla `city_locations` (ver SQL en AGENTS.md, sección
//      "Mapa de descubrimiento de tours") ANTES de desplegar esta función.
//   2. Pegar este código en Supabase Dashboard → Edge Functions → Nueva función:
//      "sync-city-location"
//   3. Configurar Database Webhook: tabla `tours_cache`, eventos INSERT + UPDATE,
//      función destino `sync-city-location` (mismo patrón que el resto de
//      webhooks documentados en AGENTS.md).

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const serviceKey  = Deno.env.get("MY_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Copia deliberada de lib/slugToDisplayName.ts — las Edge Functions se
// despliegan pegando UN solo fichero en el Dashboard (sin imports relativos
// al resto del repo, ver AGENTS.md), así que no se puede importar desde ahí.
// Si se añade un país nuevo al mapa del cliente, replicar aquí también.
const COUNTRY_SLUGS: Record<string, { name: string }> = {
  spain: { name: "Spain" }, france: { name: "France" }, italy: { name: "Italy" },
  germany: { name: "Germany" }, portugal: { name: "Portugal" }, uk: { name: "United Kingdom" },
  england: { name: "England" }, usa: { name: "USA" }, mexico: { name: "Mexico" },
  argentina: { name: "Argentina" }, brazil: { name: "Brazil" }, colombia: { name: "Colombia" },
  chile: { name: "Chile" }, peru: { name: "Peru" }, japan: { name: "Japan" },
  china: { name: "China" }, india: { name: "India" }, australia: { name: "Australia" },
  canada: { name: "Canada" }, netherlands: { name: "Netherlands" }, belgium: { name: "Belgium" },
  switzerland: { name: "Switzerland" }, austria: { name: "Austria" }, greece: { name: "Greece" },
  turkey: { name: "Turkey" }, poland: { name: "Poland" }, czech: { name: "Czech Republic" },
  hungary: { name: "Hungary" }, romania: { name: "Romania" }, russia: { name: "Russia" },
  ukraine: { name: "Ukraine" }, norway: { name: "Norway" }, sweden: { name: "Sweden" },
  denmark: { name: "Denmark" }, finland: { name: "Finland" }, ireland: { name: "Ireland" },
  croatia: { name: "Croatia" }, morocco: { name: "Morocco" }, egypt: { name: "Egypt" },
  thailand: { name: "Thailand" }, vietnam: { name: "Vietnam" }, indonesia: { name: "Indonesia" },
  korea: { name: "South Korea" }, singapore: { name: "Singapore" }, israel: { name: "Israel" },
  jordan: { name: "Jordan" }, uae: { name: "UAE" },
  // Ampliación (ago-2026) tras encontrar ~95/357 ciudades reales con country
  // vacío en el backfill inicial — ver AGENTS.md "Mapa de descubrimiento de
  // tours". Mantener en sincronía con scripts/backfill_city_locations.sql y
  // scripts/fix_city_locations_countries.sql.
  ghana: { name: "Ghana" }, ethiopia: { name: "Ethiopia" }, kazakhstan: { name: "Kazakhstan" },
  iraq: { name: "Iraq" }, lebanon: { name: "Lebanon" }, philippines: { name: "Philippines" },
  senegal: { name: "Senegal" }, tanzania: { name: "Tanzania" }, qatar: { name: "Qatar" },
  ecuador: { name: "Ecuador" }, cuba: { name: "Cuba" }, nepal: { name: "Nepal" },
  rwanda: { name: "Rwanda" }, jamaica: { name: "Jamaica" }, malaysia: { name: "Malaysia" },
  bolivia: { name: "Bolivia" }, maldives: { name: "Maldives" }, monaco: { name: "Monaco" },
  uruguay: { name: "Uruguay" }, oman: { name: "Oman" }, fiji: { name: "Fiji" },
  kenya: { name: "Kenya" }, bahamas: { name: "Bahamas" }, aruba: { name: "Aruba" },
  panama: { name: "Panama" }, cambodia: { name: "Cambodia" }, iceland: { name: "Iceland" },
  latvia: { name: "Latvia" }, taiwan: { name: "Taiwan" }, estonia: { name: "Estonia" },
  uzbekistan: { name: "Uzbekistan" }, tunisia: { name: "Tunisia" }, zimbabwe: { name: "Zimbabwe" },
  lithuania: { name: "Lithuania" }, myanmar: { name: "Myanmar" }, laos: { name: "Laos" },
  south_africa: { name: "South Africa" }, sri_lanka: { name: "Sri Lanka" },
  new_zealand: { name: "New Zealand" }, united_states: { name: "USA" },
  united_kingdom: { name: "United Kingdom" }, saudi_arabia: { name: "Saudi Arabia" },
  new_caledonia: { name: "New Caledonia" }, czech_republic: { name: "Czech Republic" },
  dominican_republic: { name: "Dominican Republic" }, costa_rica: { name: "Costa Rica" },
  puerto_rico: { name: "Puerto Rico" }, vatican_city: { name: "Vatican City" },
  french_polynesia: { name: "French Polynesia" }, netherlands_antilles: { name: "Netherlands" },
  united_arab_emirates: { name: "UAE" }, papua_new_guinea: { name: "Papua New Guinea" },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function slugToDisplayName(slug: string): { city: string; country: string } {
  const parts = slug.split("_");
  for (let i = parts.length - 1; i >= 1; i--) {
    const countryKey = parts.slice(i).join("_");
    const match = COUNTRY_SLUGS[countryKey];
    if (match) {
      const city = parts.slice(0, i).map(cap).join(" ");
      return { city, country: match.name };
    }
  }
  return { city: parts.map(cap).join(" "), country: "" };
}

interface StopLike { latitude?: number; longitude?: number; }
interface TourLike { stops?: StopLike[]; isSponsored?: boolean; }

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const payload = await req.json();
    const record = payload?.record;
    if (!record) return new Response("No record in payload", { status: 400 });

    if (record.status !== "READY") {
      return new Response("Not READY, skipping.", { status: 200 });
    }

    const slug = record.city; // en tours_cache la PK es 'city' (slug)

    // Idempotente: si ya existe, no se recalcula.
    const { data: existing } = await supabase
      .from("city_locations")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return new Response("City already has a location, skipping.", { status: 200 });
    }

    const tours = (record.data as TourLike[]) || [];
    let latSum = 0, lngSum = 0, n = 0;
    for (const tour of tours) {
      if (tour.isSponsored) continue;
      for (const stop of tour.stops || []) {
        const lat = stop.latitude, lng = stop.longitude;
        if (typeof lat !== "number" || typeof lng !== "number" || (lat === 0 && lng === 0)) continue;
        latSum += lat; lngSum += lng; n++;
      }
    }

    if (n === 0) {
      console.warn(`[sync-city-location] '${slug}' sin paradas válidas, no se puede calcular centroide.`);
      return new Response("No valid stops to compute centroid.", { status: 200 });
    }

    const { city, country } = slugToDisplayName(slug);
    const { error } = await supabase.from("city_locations").insert({
      slug, name: city, country, lat: latSum / n, lng: lngSum / n,
    });

    if (error) {
      console.error(`[sync-city-location] Error insertando '${slug}':`, error.message);
      return new Response("Insert failed", { status: 500 });
    }

    console.log(`[sync-city-location] '${slug}' añadida a city_locations.`);
    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("[sync-city-location] Error inesperado:", e);
    return new Response("Internal error", { status: 500 });
  }
});
```
