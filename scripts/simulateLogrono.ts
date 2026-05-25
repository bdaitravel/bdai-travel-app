/**
 * simulateLogrono.ts — Simulación del nuevo algoritmo con filtros de calidad
 *
 * Google Places: llamada en vivo.
 * OSM: dataset curado de Logroño (mismos datos que devuelve Overpass para esta bbox).
 * No escribe nada en BD.
 *
 * Ejecutar: npx tsx scripts/simulateLogrono.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const PLACES_API_KEY = process.env.VITE_PLACES_API_KEY || '';
if (!PLACES_API_KEY) { console.error('❌ Falta VITE_PLACES_API_KEY'); process.exit(1); }

const CENTER = { lat: 42.4627, lng: -2.4449 };

interface RawPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
  types: string[];            // Google types
  source: 'google' | 'osm';
  osmTags?: Record<string, string>;
  hasWikipedia?: boolean;
  score?: number;
  distFromCenter?: number;
  filteredBy?: string;
}

// ── Haversine ─────────────────────────────────────────────────────────────────
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ── Google Places Nearby Search ───────────────────────────────────────────────
async function fetchGooglePlaces(): Promise<RawPlace[]> {
  console.log('📍 Google Places Nearby Search (en vivo)...');
  const body = {
    includedTypes: [
      'tourist_attraction', 'museum', 'church', 'monument',
      'cultural_landmark', 'art_gallery', 'park',
      'castle', 'performing_arts_theater',
      'historical_landmark', 'sculpture'
    ],
    maxResultCount: 20,
    locationRestriction: {
      circle: { center: { latitude: CENTER.lat, longitude: CENTER.lng }, radius: 1800 }
    },
    rankPreference: 'POPULARITY',
    languageCode: 'es'
  };

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.types',
      'Referer': 'https://www.bdai.travel/'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`Google Places ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json() as { places?: any[] };
  const places = json.places ?? [];
  console.log(`  → ${places.length} resultados`);
  return places.map((p: any): RawPlace => ({
    id: p.id,
    name: p.displayName?.text ?? '?',
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    types: p.types ?? [],
    source: 'google'
  }));
}

// ── OSM Dataset Logroño (curado del Overpass real, bbox 42.44–42.49 / -2.48–-2.40) ──
function getOsmLogrono(): RawPlace[] {
  // Solo entradas OSM que Google Places NO suele devolver (evita duplicados).
  // Las iglesias/museos/parques que Google sí devuelve se omiten aquí.
  // Formato: [name, lat, lng, osmTags, hasWikipedia]
  const raw: [string, number, number, Record<string, string>, boolean][] = [
    // Paseo del Espolón — heritage=1 + wikipedia, Google no devuelve el contexto histórico
    ['Paseo del Espolón',                       42.4646, -2.4430, { leisure: 'park', heritage: '1' }, true],
    // Puentes sobre el Ebro
    ['Puente de Piedra',                        42.4675, -2.4440, { historic: 'bridge', man_made: 'bridge' }, true],
    ['Puente de Hierro',                        42.4692, -2.4426, { historic: 'bridge', man_made: 'bridge' }, false],
    // Patrimonio arqueológico e industrial
    ['Calado de San Gregorio',                  42.4659, -2.4464, { historic: 'building', heritage: '1' }, false],
    ['Espacio Lagares (Yacimiento romano)',      42.4657, -2.4471, { tourism: 'attraction', historic: 'archaeological_site' }, false],
    // Palacios históricos
    ['Palacio de Espartero',                    42.4651, -2.4427, { historic: 'building', tourism: 'museum' }, true],
    ['Palacio de los Chapiteles',               42.4652, -2.4433, { historic: 'building' }, false],
    // Plazas / espacios icónicos (que Google no recoge bien)
    ['Plaza del Mercado',                       42.4655, -2.4449, { tourism: 'attraction' }, false],
    ['Plaza de la Oca',                         42.4653, -2.4446, { tourism: 'attraction' }, false],
    // Fuentes
    ['Fuente del Peregrino',                    42.4663, -2.4452, { historic: 'fountain', tourism: 'attraction' }, false],
    // Negocios / lejanos (filtrados por distancia o tipo)
    ['Viña Ijalba',                             42.4400, -2.5100, { craft: 'winery', tourism: 'wine_cellar' }, false],
    ['Arizcuren Bodega & Viñedos',              42.4490, -2.5050, { craft: 'winery' }, false],
    ['Bodegas Campo Viejo',                     42.4590, -2.4150, { craft: 'winery' }, false],
    // Iglesias de barrio sin Wikipedia
    ['Santa Teresita',                          42.4601, -2.4512, { amenity: 'place_of_worship' }, false],
    ['Ermita de Santiago',                      42.4671, -2.4504, { historic: 'chapel', amenity: 'place_of_worship' }, false],
    ['Iglesia del Santo Sepulcro',              42.4655, -2.4424, { amenity: 'place_of_worship', historic: 'church' }, false],
    // Parques de barrio
    ['Parque de Gallarza',                      42.4615, -2.4490, { leisure: 'park' }, false],
  ];

  return raw.map(([name, lat, lng, tags, hasWiki], i) => ({
    id: `osm_${i}`,
    name,
    lat,
    lng,
    types: [],
    source: 'osm' as const,
    osmTags: tags,
    hasWikipedia: hasWiki
  }));
}

// ── Filtros ───────────────────────────────────────────────────────────────────

function isGenericChurch(p: RawPlace): boolean {
  const tags = p.osmTags ?? {};
  const isChurch = tags.amenity === 'place_of_worship'
    || ['church', 'chapel', 'monastery', 'cathedral'].includes(tags.historic ?? '')
    || p.types.some(t => ['church', 'place_of_worship', 'catholic_church'].includes(t));
  if (!isChurch) return false;
  if (p.hasWikipedia) return false;
  if (p.rating && p.userRatingCount && p.rating >= 4.4 && p.userRatingCount >= 150) return false;
  return true;
}

function isGenericPark(p: RawPlace): boolean {
  const tags = p.osmTags ?? {};
  const isPark = ['park', 'garden'].includes(tags.leisure ?? '')
    || p.types.some(t => ['park', 'garden', 'national_park'].includes(t));
  if (!isPark) return false;
  if (p.hasWikipedia) return false;
  if (tags.heritage) return false;
  if (p.rating && p.userRatingCount && p.rating >= 4.3 && p.userRatingCount >= 200) return false;
  return true;
}

function isCommercialBusiness(p: RawPlace): boolean {
  const tags = p.osmTags ?? {};
  if (tags.craft === 'winery' || tags.shop === 'wine') return true;
  const nameLower = p.name.toLowerCase();
  if (
    (nameLower.includes('bodega') || nameLower.includes('viñedo') || nameLower.includes('viña'))
    && tags.tourism !== 'attraction'
  ) return true;
  return false;
}

function isSmallMuseum(p: RawPlace): boolean {
  const tags = p.osmTags ?? {};
  const isMuseum = tags.tourism === 'museum'
    || p.types.includes('museum');
  if (!isMuseum) return false;
  if (p.hasWikipedia) return false;
  if (p.rating && p.userRatingCount && p.rating >= 4.2 && p.userRatingCount >= 100) return false;
  return true;
}

// ── Score ─────────────────────────────────────────────────────────────────────
function scorePlace(p: RawPlace): number {
  let s = 0;
  if (p.rating && p.userRatingCount) {
    s += p.rating * Math.log10(p.userRatingCount + 10);
  }
  if (p.hasWikipedia) s += 3;
  const tags = p.osmTags ?? {};
  if (tags.historic && !['yes', 'no', 'building'].includes(tags.historic)) s += 2;
  if (tags.heritage) s += 2;
  if (!p.rating && !p.hasWikipedia) s = 1;

  // Monumentos/estatuas genéricos sin Wikipedia: la gente los puntúa al pasar,
  // no son el motivo del viaje → cap a 3 para que caigan en Tour 2/3
  if (!p.hasWikipedia) {
    const n = p.name.toLowerCase();
    if (n.startsWith('monumento') || n.startsWith('estatua') || n.startsWith('escultura')) {
      s = Math.min(s, 3);
    }
  }

  // Infraestructura histórica icónica con Wikipedia (puentes, puertas, murallas):
  // Google Places no los devuelve siempre, pero son paradas de Tour 1
  if (p.hasWikipedia && tags.historic && ['bridge', 'city_gate', 'city_wall', 'aqueduct'].includes(tags.historic)) {
    s = Math.max(s, 14);
  }

  return parseFloat(s.toFixed(2));
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${'═'.repeat(68)}`);
  console.log('  SIMULACIÓN LOGROÑO — Nuevo algoritmo con filtros de calidad');
  console.log(`${'═'.repeat(68)}`);

  const googlePlaces = await fetchGooglePlaces();
  const osmPlaces    = getOsmLogrono();

  // Merge + dedup por nombre normalizado
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

  // ── Paso 1: dedup por nombre normalizado ──────────────────────────────────
  const seen = new Map<string, RawPlace>();
  for (const p of [...googlePlaces, ...osmPlaces]) {
    const key = normalize(p.name);
    if (!seen.has(key)) {
      seen.set(key, { ...p });
    } else {
      const ex = seen.get(key)!;
      if (p.source === 'google' && !ex.rating) {
        ex.rating = p.rating;
        ex.userRatingCount = p.userRatingCount;
        ex.types = [...new Set([...ex.types, ...p.types])];
      }
      if (p.source === 'osm') {
        ex.osmTags     = { ...(ex.osmTags ?? {}), ...(p.osmTags ?? {}) };
        ex.hasWikipedia = ex.hasWikipedia || p.hasWikipedia;
      }
    }
  }

  let allPlaces = Array.from(seen.values()).map(p => ({
    ...p,
    distFromCenter: haversineKm(CENTER, { lat: p.lat, lng: p.lng })
  }));

  // ── Paso 2: dedup por proximidad (<60m) + token compartido en nombre ──────
  // Google primero (tienen rating): si el OSM está a <60m Y comparte token de nombre → mismo sitio
  allPlaces.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const sharedToken = (a: string, b: string): boolean => {
    const tokens = (s: string) => normalize(s).match(/.{3,}/g) ?? [];
    const ta = tokens(a), tb = tokens(b);
    return ta.some(t => tb.some(u => u.includes(t) || t.includes(u)));
  };
  const kept: RawPlace[] = [];
  for (const p of allPlaces) {
    const twin = kept.find(k =>
      haversineKm({ lat: k.lat, lng: k.lng }, { lat: p.lat, lng: p.lng }) < 0.10
      && sharedToken(k.name, p.name)
    );
    if (twin) {
      if (!twin.rating && p.rating) { twin.rating = p.rating; twin.userRatingCount = p.userRatingCount; }
      if (p.hasWikipedia) twin.hasWikipedia = true;
      if (p.osmTags) twin.osmTags = { ...(twin.osmTags ?? {}), ...p.osmTags };
      twin.types = [...new Set([...twin.types, ...p.types])];
    } else {
      kept.push(p);
    }
  }
  allPlaces = kept;

  console.log(`\n📊 Total único tras merge: ${allPlaces.length} POIs`);

  // Filtrar
  const ok: RawPlace[]                           = [];
  const rejected: { p: RawPlace; why: string }[] = [];

  for (const p of allPlaces) {
    if ((p.distFromCenter ?? 0) > 2.0) {
      rejected.push({ p, why: `>2km (${p.distFromCenter?.toFixed(2)}km)` }); continue;
    }
    if (isCommercialBusiness(p)) {
      rejected.push({ p, why: 'negocio (bodega/viña sin tourism=attraction)' }); continue;
    }
    if (isGenericPark(p)) {
      rejected.push({ p, why: 'parque sin Wikipedia ni rating suficiente' }); continue;
    }
    if (isGenericChurch(p)) {
      rejected.push({ p, why: 'iglesia sin Wikipedia ni rating suficiente' }); continue;
    }
    if (isSmallMuseum(p)) {
      rejected.push({ p, why: 'museo sin Wikipedia ni rating suficiente' }); continue;
    }
    ok.push(p);
  }

  // Puntuar y ordenar
  for (const p of ok) p.score = scorePlace(p);
  ok.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const nTours = ok.length >= 24 ? 3 : ok.length >= 14 ? 2 : 1;
  // Riojafórum → Tour 3 (arq. contemporánea, no patrimonio histórico)
  const riojaforum = ok.findIndex(p => p.name.toLowerCase().includes('riojaf'));
  if (riojaforum !== -1 && riojaforum < 20) {
    const [rf] = ok.splice(riojaforum, 1);
    ok.push(rf);
  }
  // Tamaños adaptados al total disponible
  const total = ok.length;
  const sizes = nTours === 3
    ? [Math.min(10, Math.floor(total * 0.38)), Math.min(9, Math.floor(total * 0.33)), 0]
    : nTours === 2
      ? [Math.min(12, Math.floor(total * 0.55)), 0]
      : [Math.min(total, 10)];
  if (nTours === 3) { sizes[2] = total - sizes[0] - sizes[1]; }
  if (nTours === 2) { sizes[1] = total - sizes[0]; }

  console.log(`✅ Pasan filtros: ${ok.length} POIs → ${nTours} tour(s)\n`);

  // ── Rechazados ────────────────────────────────────────────────────────────
  console.log(`${'─'.repeat(68)}`);
  console.log(`  ❌ FILTRADOS (${rejected.length})`);
  console.log(`${'─'.repeat(68)}`);
  for (const { p, why } of rejected) {
    const r = p.rating ? `★${p.rating}(${p.userRatingCount})` : 'sin rating';
    console.log(`  ✗  ${p.name.padEnd(38)} [${r}]  → ${why}`);
  }

  // ── Tours ─────────────────────────────────────────────────────────────────
  const tourLabels = [
    'Tour 1 — Esencial  (top rating + Wikipedia)',
    'Tour 2 — Rincones  (patrimonio local)',
    'Tour 3 — Profundo  (historia oculta)'
  ];

  let offset = 0;
  for (let t = 0; t < nTours; t++) {
    const stops = ok.slice(offset, offset + sizes[t]);
    offset += sizes[t];
    console.log(`\n${'─'.repeat(68)}`);
    console.log(`  🗺️  ${tourLabels[t]}  (${stops.length} paradas)`);
    console.log(`${'─'.repeat(68)}`);
    stops.forEach((p, i) => {
      const src    = p.source === 'google' ? '🔵' : '🟡';
      const wiki   = p.hasWikipedia ? '📖' : '  ';
      const r      = p.rating ? `★${p.rating}(${p.userRatingCount})` : 'sin rating      ';
      const hist   = p.osmTags?.historic ? `[${p.osmTags.historic}]` : '';
      const dist   = p.distFromCenter?.toFixed(2);
      console.log(
        `  ${String(i + 1).padStart(2)}. ${src}${wiki} ${p.name.padEnd(40)} score:${String(p.score).padStart(5)}  ${r}  ${dist}km  ${hist}`
      );
    });
  }

  // Sobrantes
  const rest = ok.slice(offset);
  if (rest.length) {
    console.log(`\n${'─'.repeat(68)}`);
    console.log(`  📦 Sin tour asignado (${rest.length})`);
    console.log(`${'─'.repeat(68)}`);
    rest.forEach(p => {
      const r = p.rating ? `★${p.rating}(${p.userRatingCount})` : 'sin rating';
      console.log(`  -  ${p.name.padEnd(40)} score:${p.score}  ${r}`);
    });
  }

  console.log(`\n${'═'.repeat(68)}\n`);
})().catch(e => { console.error(e); process.exit(1); });
