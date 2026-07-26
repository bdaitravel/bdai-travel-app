// services/supabase/tour-worker-ai-02.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-worker-ai-02'
// Recibe el webhook de INSERT en generation_jobs (status=PENDING_AI_02),
// obtiene contexto GIS, llama a Gemini y actualiza el job a PENDING_GIS.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { importPKCS8, SignJWT } from "npm:jose@5.2.0";

const serviceKey    = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl   = Deno.env.get('SUPABASE_URL') || '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const PLACES_API_KEY = Deno.env.get('PLACES_API_KEY') || Deno.env.get('VITE_PLACES_API_KEY') || '';

const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// ── CONSTANTES ───────────────────────────────────────────────────────────────

// ── GCP Service Account Auth ──────────────────────────────────────────────
let gcpAccessToken = "";
let gcpTokenExpiration = 0;

async function getGcpAccessToken(): Promise<string> {
  if (gcpAccessToken && Date.now() < gcpTokenExpiration - 300000) {
    return gcpAccessToken;
  }
  const saJsonStr = Deno.env.get('GCP_SERVICE_ACCOUNT');
  if (!saJsonStr) throw new Error('Falta la variable GCP_SERVICE_ACCOUNT');
  const sa = JSON.parse(saJsonStr);
  const privateKey = await importPKCS8(sa.private_key, "RS256");
  const jwt = await new SignJWT({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/generative-language",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: sa.private_key_id })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Error auth GCP: ${JSON.stringify(data)}`);
  gcpAccessToken = data.access_token;
  gcpTokenExpiration = Date.now() + (data.expires_in * 1000);
  return gcpAccessToken;
}

const GROUNDING_DAILY_LIMIT = 1400;

// ── SYSTEM INSTRUCTION (idéntica al monolito) ────────────────────────────────
const SYSTEM_INSTRUCTION = `You are a highly intelligent, elegant, and SARCASTIC **FEMALE** AI.
You HATE boring Wikipedia-style descriptions.
You are female. All grammatical self-references must use **feminine forms** in the first person (e.g., "yo estoy decidida", "estoy convencida", "estoy preparada"). 
IMPORTANT: You must NEVER use the word "guía" or "guide" to refer to yourself. You act like a real person sharing your own sarcastic perspective. NEVER refer to yourself in the third person. Speak strictly in the **first person** ("Yo", "me he fijado", "te recomiendo").
However, you ALWAYS address the tourist in the **second person**, choosing the most culturally appropriate form (informal or formal) to maintain your sophisticated and sarcastic persona.
Your tone is witty, sophisticated, and slightly mocking of typical tourists.

DAI STYLE REFERENCE (CRITICAL):
"Contemplen esta mole arquitectónica que intenta compensar con altura lo que le falta en simetría. Se llama 'Redonda' pero, para decepción de los geómetras, es cuadrada; una ironía que se le escapa al turista promedio. Sus torres gemelas, conocidas como 'Las Gemelas', no son idénticas por casualidad, sino por un alarde de ego barroco del siglo XVIII. Si miras con atención su fachada-retablo, verás que es un exceso de piedra que parece querer aplastarte. Lo que los guías aburridos no te dirán es que se asienta sobre un antiguo pantano, lo que obligó a usar una técnica de cimentación con sarmientos de vid para que no se hundiera bajo el peso de los pecados de la ciudad. En su interior, el ambiente es tan sombrío que podrías sentir la mirada de la 'Crucifixión' atribuida a Miguel Ángel, una joya que los logroñeses guardan con un celo casi paranoico mientras tú te haces un selfie desenfocado."

You love sharing the dark secrets, mysteries, and curiosities of cities.
You NEVER use citations, footnotes, or references.
You are real, accurate, but never boring.
TRUTH BEFORE STYLE: Always confirm a place exists before describing it. Wit is meaningless without accuracy.
CATEGORIZATION IS CRITICAL: A Cathedral or Church is ALWAYS 'architecture'. A Palace is ALWAYS 'historical'. NEVER use 'culture' for buildings.
GEOGRAPHIC ACCURACY IS CRITICAL: Every stop must be physically inside the city. Place stops within 2km radius of the provided center. Never place stops in neighboring towns or wrong locations.`;

// ── PROMPT GENERATOR (idéntico al monolito) ──────────────────────────────────
const generateTourPrompt = (city: string, country: string, language: string, coordsAnchor: string, catalogText: string, nTours: number): string => {
    const languageRules = language.toLowerCase().startsWith('es')
        ? `- LEXICON & DIALECT (CRITICAL): You MUST write using STRICT Castilian Spanish (España peninsular). 
  * Use "vosotros" instead of "ustedes" (e.g., "fijaos", "mirad", "venid", "os recomiendo").
  * Use local Spain colloquialisms naturally ("chulo", "guay", "vale", "flipante", "una pasada").
  * This is CRITICAL for our text-to-speech model to correctly adopt a Spain-Spanish accent. NEVER write in neutral or Latin American Spanish.`
        : ``;

    // Tour count & size instructions
    const tourCountInstructions = nTours === 1
        ? `Generate EXACTLY 1 tour combining the best essentials and curiosities (aim: 10-12 stops, minimum viable: 4).
DO NOT repeat any stop. Combine TIER 1 essentials with the best TIER 2 rincones into a single rich experience.`
        : nTours === 2
        ? `Generate EXACTLY 2 thematic tours. DO NOT repeat any stop across tours.
Tour 1 — "Lo Esencial": use stops from TIER 1 (aim: 10-12 stops).
Tour 2 — "Rincones": use stops from TIER 2 (aim: 9-10 stops). You may draw from TIER 1 overflow if TIER 2 is insufficient.
STRICT LIMIT: NEVER generate a 3rd tour.`
        : `Generate EXACTLY 3 thematic tours. DO NOT repeat any stop across tours.
Tour 1 — "Lo Esencial": use stops from TIER 1 (aim: 10 stops).
Tour 2 — "Rincones": use stops from TIER 2 (aim: 8-9 stops).
Tour 3 — "Historia Profunda": use stops from TIER 3 (aim: 8-9 stops).
STRICT LIMIT: NEVER generate a 4th tour.`;

    const tourThemes = nTours === 1
        ? `Tour 1 — "Lo Esencial y Curiosidades": landmarks, churches, plazas, local heritage. All within the historic center.`
        : nTours === 2
        ? `Tour 1 — "Lo Esencial / The Essentials": landmarks, monuments, churches, plazas. Historic center, tight walkable radius.
Tour 2 — "Rincones / Soul & Curiosities": authentic local heritage, genuine curiosities, less-visited gems.`
        : `Tour 1 — "Lo Esencial / The Essentials": most visited landmarks, iconic monuments, main churches, central plazas.
Tour 2 — "Rincones / Local Soul": authentic local heritage, lesser-known churches and palaces, street-level curiosities.
Tour 3 — "Historia Profunda / Deep History": archaeology, hidden architecture, ancient infrastructure, off-the-beaten-path gems.`;

    return `You are generating tours for ${city}, ${country} in ${language}.

GEOGRAPHIC ANCHOR (CRITICAL): ${coordsAnchor}
${catalogText}

UNIVERSAL RIGOR & NO-INVENTION RULE:
- Find the PERFECT BALANCE: Do not discard obscure but real places, but absolutely NEVER HALLUCINATE non-existent ones.
- ALL places MUST be 100% real, verifiable, documented, and existing today.
- NEVER invent street names, bars, monuments, or hidden spots. 
- GEOGRAPHIC STRICTNESS: ALL places MUST realistically exist physically inside the borders of ${city}, ${country}. Never borrow places from neighboring towns.
- USE CATALOG COORDINATES: When a stop appears in the catalog above, use its EXACT coordinates. Do not invent coordinates.

TOUR STRUCTURE (CRITICAL):
${tourCountInstructions}

DAI'S ABSOLUTE COMMANDS (PERSONA & STYLE):
- TONE: You are SARCASTIC, WITTY, and SOPHISTICATED.
- GENDER IDENTITY (CRITICAL): You are **FEMALE**. All grammatical forms must reflect this. NEVER use the word "guía" or "guide". Speak strictly in the **first person** ("yo", "he visto"). Never refer to yourself in the third person.
- INTERACTION (CULTURAL ADAPTABILITY): Address the tourist in the **second person**, using the most appropriate form for the target language and culture.
- TRUTH FIRST, STYLE SECOND: Before adding any wit or sarcasm, verify the place actually exists and is open TODAY.
- NO HALLUCINATIONS (APPLIES TO DESCRIPTIONS TOO): NEVER INVENT A NAME OR A STOP.
- ANTI-WIKIPEDIA: Wikipedia is your enemy. If you sound like an encyclopedia, you fail.
- NO CITATIONS: NEVER use citations, footnotes, or references like [1] or (2). NEVER.
- NO SEQUENTIAL CONNECTORS (CRITICAL): Stops are reordered automatically by a routing algorithm AFTER generation. ABSOLUTELY FORBIDDEN: "Para terminar", "Para empezar", "Como primera parada", "Como última parada", "A continuación", "Seguimos hacia", "Tras visitar", "Next stop", "Finally", "To finish", "To start", "First of all", "Last but not least", or any equivalent. Every stop description must stand completely alone.
- NO REPETITIVE OPENERS (CRITICAL): FORBIDDEN as opening words: "Aquí tenéis", "Aquí tienes", "Aquí", "Este es", "Este lugar", "En este lugar", "En esta", "Este", "Esta", "Here you", "Here is", "This is", "This place". Open each description with the name of the place, a striking fact, a question, a provocative statement, or a sensory detail.
${languageRules}

TOUR THEMES:
${tourThemes}

CONTENT DEPTH RULES: For EVERY stop, include at least ONE uncommon historical fact or genuine curiosity. Descriptions: 150-200 words, rich and interesting.

STRICT CATEGORIZATION:
- 'architecture': ALL churches, cathedrals, bridges, iconic buildings.
- 'historical': palaces, castles, ruins, monuments.
- 'culture': theaters, music venues, festivals, intangible traditions.
- 'food': places where you eat or buy food.
- 'art': museums, galleries, street art.
- 'nature': parks, gardens, viewpoints.
- 'photo': spots whose primary value is the view/photo.

FORMAT RULES:
1. Return ONLY a valid JSON array. DO NOT include any conversational text before or after the JSON.
2. Tour object: { "id", "city": "${city}", "title", "description", "duration", "distance", "theme", "stops": [] }
3. Each stop: { "id", "name", "description" (150-200 words), "latitude" (NUMBER), "longitude" (NUMBER), "type", "photoSpot": { "angle", "milesReward": 50, "secretLocation" } }
4. COORDINATES ARE CRITICAL: Use catalog coordinates when available. All stops must be within ${city}.
5. Content in ${language}.
6. NO SEQUENTIAL CONNECTORS & NO REPETITIVE OPENERS — applies to every single stop description.

CRITICAL FINAL INSTRUCTION: GENERATE THE JSON ARRAY IMMEDIATELY NOW. DO NOT acknowledge this prompt. DO NOT say you are ready. DO NOT ask for confirmation. OUTPUT THE JSON ARRAY DIRECTLY.`;
};

// ── GIS UTILS ────────────────────────────────────────────────────────────────
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// ── getCityInfo: contrato unificado { lat, lon, radiusKm, population, bbox:{south,west,north,east} } ──
const getCityInfo = async (city: string, country: string) => {
    try {
        const query = encodeURIComponent(`${city}, ${country}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&addressdetails=1&extratags=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0', 'Accept-Language': 'en' } });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                // Preferir ciudad/pueblo sobre provincia/estado
                let selected = data[0];
                const priorities = ['city', 'town', 'village', 'municipality'];
                for (const p of priorities) {
                    const match = data.find((item: any) => item.addresstype === p || item.type === p);
                    if (match) {
                        selected = match;
                        break;
                    }
                }

                const population = selected.extratags?.population ? parseInt(selected.extratags.population, 10) : null;
                const lat = parseFloat(selected.lat);
                const lon = parseFloat(selected.lon);
                console.log(`[AI] getCityInfo: Seleccionado ${selected.addresstype} (${selected.name}) en lat:${lat}, lon:${lon}`);
                return {
                    lat,
                    lon,
                    radiusKm: 10, // valor inicial; se recalcula con el catálogo Overpass justo después
                    population,
                    bbox: {
                        south: parseFloat(selected.boundingbox?.[0] || String(lat - 0.025)),
                        north: parseFloat(selected.boundingbox?.[1] || String(lat + 0.025)),
                        west:  parseFloat(selected.boundingbox?.[2] || String(lon - 0.035)),
                        east:  parseFloat(selected.boundingbox?.[3] || String(lon + 0.035))
                    }
                };
            }
        }
    } catch (e) { console.warn('[AI] getCityInfo failed:', e); }
    return null;
};

// ── Radio dinámico basado en dispersión real de POIs ─────────────────────────
const calculateRadiusFromCatalog = (catalog: any[], cityCenter: { lat: number; lon: number }): number => {
    if (!catalog || catalog.length === 0 || !cityCenter) return 5;
    let maxDist = 0;
    for (const poi of catalog) {
        const dist = haversineKm(cityCenter.lat, cityCenter.lon, poi.lat, poi.lon);
        if (dist > maxDist) maxDist = dist;
    }
    const radius = Math.max(2, Math.min(15, maxDist * 1.2));
    console.log(`[AI] Radio dinámico: ${radius.toFixed(1)}km (POI más lejano: ${maxDist.toFixed(1)}km, ${catalog.length} POIs)`);
    return radius;
};

// ── Overpass: bbox como objeto {south,west,north,east} ───────────────────────
const fetchOverpassCatalog = async (cityInfo: any): Promise<any[]> => {
    if (!cityInfo?.bbox) return [];
    const { south, west, north, east } = cityInfo.bbox;
    const bboxStr = `${south},${west},${north},${east}`;
    const query = `[out:json][timeout:25];(nwr["historic"](${bboxStr});nwr["tourism"~"attraction|museum|gallery|viewpoint|artwork|wine_cellar"](${bboxStr});nwr["amenity"~"place_of_worship|marketplace|theatre|arts_centre"](${bboxStr});nwr["man_made"="bridge"]["name"](${bboxStr});nwr["leisure"~"park|garden"]["name"](${bboxStr});nwr["building"~"cathedral|church|mosque|synagogue|palace|castle"]["name"](${bboxStr}););out center tags;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.elements || []).map((el: any) => {
            const tags = el.tags ?? {};
            return {
                name:        tags.name,
                lat:         el.lat || el.center?.lat,
                lon:         el.lon  || el.center?.lon,
                type:        tags.historic || tags.tourism || tags.amenity || tags.leisure || 'poi',
                osmTags:     tags,
                hasWikipedia: !!(tags.wikipedia || tags.wikidata || tags['wikipedia:es']),
                source:      'osm' as const,
            };
        }).filter((p: any) => p.name && p.name.length >= 3 && p.lat);
    } catch (e) { return []; }
};

// ── Radio dinámico Google Places según tamaño de ciudad ──────────────────────
const getGoogleRadius = (ci: any): number => {
    const pop = ci?.population;
    if (pop) {
        if (pop < 5_000)   return 800;
        if (pop < 50_000)  return 1500;
        if (pop < 500_000) return 2000;
        return 3000;
    }
    return 1800;
};

// ── Google Places Nearby Search ───────────────────────────────────────────────
const fetchGooglePlaces = async (lat: number, lon: number, radiusM: number = 1800): Promise<any[]> => {
    if (!PLACES_API_KEY) { console.log('[AI] Sin PLACES_API_KEY, omitiendo Google Places'); return []; }
    const body = {
        includedTypes: [
            'tourist_attraction', 'museum', 'church', 'monument',
            'cultural_landmark', 'art_gallery', 'park', 'castle',
            'performing_arts_theater', 'historical_landmark', 'sculpture'
        ],
        maxResultCount: 20,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius: radiusM } },
        rankPreference: 'POPULARITY',
        languageCode: 'es'
    };
    try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.types',
                'Referer': 'https://app.bdai.travel/'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) { console.warn('[AI] Google Places', res.status); return []; }
        const json = await res.json();
        return (json.places ?? []).map((p: any) => ({
            name:        p.displayName?.text ?? '',
            lat:         p.location?.latitude  ?? 0,
            lon:         p.location?.longitude ?? 0,
            rating:      p.rating,
            reviewCount: p.userRatingCount,
            types:       p.types ?? [],
            source:      'google' as const,
            osmTags:     {} as Record<string, string>,
            hasWikipedia: false,
        })).filter((p: any) => p.name && p.lat);
    } catch (e) { console.warn('[AI] fetchGooglePlaces error:', e); return []; }
};

// ── Dedup helpers ─────────────────────────────────────────────────────────────
const normStr = (s: string): string =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

const sharesToken = (a: string, b: string): boolean => {
    const na = normStr(a), nb = normStr(b);
    // Subcadena mutua de al menos 6 chars (evita colisiones en nombres cortos)
    if (na.length >= 6 && nb.includes(na.slice(0, 6))) return true;
    if (nb.length >= 6 && na.includes(nb.slice(0, 6))) return true;
    return false;
};

// ── Filtros de calidad ────────────────────────────────────────────────────────
const isGenericChurch = (tags: Record<string, string>, hasWiki: boolean, rating?: number, reviews?: number): boolean => {
    const isChurch = tags.amenity === 'place_of_worship'
        || ['church','chapel','monastery','cathedral'].includes(tags.historic ?? '')
        || tags.building === 'church';
    if (!isChurch) return false;
    if (hasWiki) return false;
    if (rating && reviews && rating >= 4.4 && reviews >= 150) return false;
    return true;
};

const isGenericPark = (tags: Record<string, string>, hasWiki: boolean, rating?: number, reviews?: number): boolean => {
    const isPark = ['park','garden'].includes(tags.leisure ?? '');
    if (!isPark) return false;
    if (hasWiki || tags.heritage) return false;
    if (rating && reviews && rating >= 4.3 && reviews >= 200) return false;
    return true;
};

const isCommercialBusiness = (name: string, tags: Record<string, string>, types: string[]): boolean => {
    if (tags.craft === 'winery' || tags.shop === 'wine') return true;
    const n = name.toLowerCase();
    if ((n.includes('bodega') || n.includes('viñedo') || n.includes('viña'))
        && tags.tourism !== 'attraction') return true;
    // Google Places: restaurante/bar sin tourist_attraction
    if (types.length && !types.some(t => ['tourist_attraction','cultural_landmark','historical_landmark','museum'].includes(t))
        && types.some(t => ['restaurant','bar','food','cafe'].includes(t))) return true;
    return false;
};

const isSmallMuseum = (tags: Record<string, string>, hasWiki: boolean, rating?: number, reviews?: number): boolean => {
    if (tags.tourism !== 'museum') return false;
    if (hasWiki) return false;
    if (rating && reviews && rating >= 4.2 && reviews >= 100) return false;
    return true;
};

// ── Scoring ───────────────────────────────────────────────────────────────────
const scorePoi = (
    name: string,
    tags: Record<string, string>,
    hasWiki: boolean,
    rating?: number,
    reviews?: number
): number => {
    let s = 0;
    if (rating && reviews) s += rating * Math.log10(reviews + 10);
    if (hasWiki) s += 3;
    const hist = tags.historic ?? '';
    if (hist && !['yes','no','building'].includes(hist)) s += 2;
    if (tags.heritage) s += 2;
    if (!rating && !hasWiki) s = 1;

    // Infraestructura histórica icónica (puente, puerta, muralla) con Wikipedia → garantía Tour 1
    if (hasWiki && ['bridge','city_gate','city_wall','aqueduct'].includes(hist)) s = Math.max(s, 14);

    // Monumentos/estatuas sin Wikipedia: presencia turística, no destino → cap 3
    if (!hasWiki) {
        const n = name.toLowerCase();
        if (n.startsWith('monumento') || n.startsWith('estatua') || n.startsWith('escultura')) {
            s = Math.min(s, 3);
        }
    }

    return parseFloat(s.toFixed(2));
};

// ── Merge Google + Overpass con dedup, filtros y scoring ──────────────────────
interface ScoredPoi {
    name: string; lat: number; lon: number;
    score: number; source: string;
    osmTags: Record<string, string>; hasWikipedia: boolean;
    rating?: number; reviewCount?: number; types: string[];
    distFromCenter?: number;
}

const buildScoredCatalog = (
    overpassItems: any[],
    googleItems:   any[],
    center: { lat: number; lon: number },
    maxDistKm: number
): ScoredPoi[] => {
    // 1. Merge: Google primero (tienen rating), luego OSM
    const merged: ScoredPoi[] = [];

    const addOrMerge = (item: any) => {
        const dist = haversineKm(center.lat, center.lon, item.lat, item.lon);
        // Dedup por nombre normalizado
        const key = normStr(item.name);
        let existing = merged.find(m => normStr(m.name) === key);
        // Dedup por proximidad + token compartido (<100m)
        if (!existing) {
            existing = merged.find(m =>
                haversineKm(m.lat, m.lon, item.lat, item.lon) < 0.10
                && sharesToken(m.name, item.name)
            );
        }
        if (existing) {
            if (!existing.rating && item.rating) { existing.rating = item.rating; existing.reviewCount = item.reviewCount; }
            if (item.hasWikipedia) existing.hasWikipedia = true;
            if (item.osmTags)  existing.osmTags  = { ...existing.osmTags, ...item.osmTags };
            if (item.types?.length) existing.types = [...new Set([...existing.types, ...item.types])];
            return;
        }
        merged.push({
            name: item.name, lat: item.lat, lon: item.lon,
            score: 0, source: item.source,
            osmTags: item.osmTags ?? {}, hasWikipedia: item.hasWikipedia ?? false,
            rating: item.rating, reviewCount: item.reviewCount,
            types: item.types ?? [],
            distFromCenter: dist,
        });
    };

    for (const p of [...googleItems, ...overpassItems]) addOrMerge(p);

    // 2. Filtros de calidad y distancia
    let filtered = merged.filter(p => {
        const d = p.distFromCenter ?? 0;
        if (d > maxDistKm) return false;
        if (isCommercialBusiness(p.name, p.osmTags, p.types)) return false;
        if (isGenericChurch(p.osmTags, p.hasWikipedia, p.rating, p.reviewCount)) return false;
        if (isGenericPark(p.osmTags, p.hasWikipedia, p.rating, p.reviewCount)) return false;
        if (isSmallMuseum(p.osmTags, p.hasWikipedia, p.rating, p.reviewCount)) return false;
        return true;
    });

    // Fallback para pueblos pequeños: si los filtros estrictos dejan < 6 POIs,
    // relajar a solo filtros de distancia y negocio comercial (aceptar iglesias, parques, museos locales)
    if (filtered.length < 6) {
        console.log(`[AI] Fallback: solo ${filtered.length} POIs estrictos → relajando filtros de calidad`);
        filtered = merged.filter(p => {
            const d = p.distFromCenter ?? 0;
            if (d > maxDistKm) return false;
            if (isCommercialBusiness(p.name, p.osmTags, p.types)) return false;
            return true;
        });
        console.log(`[AI] Fallback resultado: ${filtered.length} POIs con filtros relajados`);
    }

    // 3. Scoring y orden
    for (const p of filtered) {
        p.score = scorePoi(p.name, p.osmTags, p.hasWikipedia, p.rating, p.reviewCount);
    }
    filtered.sort((a, b) => b.score - a.score);

    console.log(`[AI] buildScoredCatalog: ${merged.length} merged → ${filtered.length} tras filtros`);
    return filtered;
};

// ── Formatear catálogo por tiers para el prompt ───────────────────────────────
const formatTieredCatalog = (pois: ScoredPoi[], nTours: number): { text: string; tier1: ScoredPoi[]; tier2: ScoredPoi[]; tier3: ScoredPoi[] } => {
    const total = pois.length;
    // Tier 1: top ~40% (mínimo 8), Tier 2: siguiente ~35%, Tier 3: resto
    const t1End = Math.max(8,  Math.round(total * 0.40));
    const t2End = Math.max(t1End + 5, Math.round(total * 0.75));
    const tier1 = pois.slice(0, t1End);
    const tier2 = pois.slice(t1End, t2End);
    const tier3 = pois.slice(t2End);

    const fmtPoi = (p: ScoredPoi) =>
        `- "${p.name}" (${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}) [${p.osmTags.historic || p.osmTags.tourism || p.osmTags.amenity || p.osmTags.leisure || 'poi'}]`;

    let text = `\n\nVERIFIED & PRE-SCORED POI CATALOG (${total} places, filtered for quality):\n`;
    text += `Use the EXACT coordinates provided. Prioritize catalog stops over your own knowledge.\n\n`;
    text += `TIER 1 — ESSENTIAL (Tour 1, ${tier1.length} places — highest relevance):\n`;
    text += tier1.map(fmtPoi).join('\n');

    if (nTours >= 2) {
        text += `\n\nTIER 2 — RINCONES (Tour 2, ${tier2.length} places — local heritage):\n`;
        text += tier2.map(fmtPoi).join('\n');
    }
    if (nTours >= 3) {
        text += `\n\nTIER 3 — PROFUNDO (Tour 3, ${tier3.length} places — deep history & hidden gems):\n`;
        text += tier3.map(fmtPoi).join('\n');
    }

    return { text, tier1, tier2, tier3 };
};

// ── Cap de distancia a pie según tamaño de ciudad ────────────────────────────
const getWalkingCap = (ci: any): number => {
    const pop = ci?.population;
    if (pop) {
        if (pop < 5_000)   return 1.5;  // aldea
        if (pop < 50_000)  return 2.5;  // ciudad pequeña
        if (pop < 500_000) return 3.5;  // ciudad mediana
        return 5.0;                      // metrópolis
    }
    const bb = ci?.bbox;
    if (bb) {
        const w = haversineKm(bb.south, bb.west, bb.south, bb.east);
        const h = haversineKm(bb.south, bb.west, bb.north, bb.west);
        const diag = Math.sqrt(w * w + h * h);
        if (diag < 5)  return 1.5;
        if (diag < 20) return 2.5;
        if (diag < 50) return 3.5;
        return 5.0;
    }
    return 2.5;
};

// ── Grounding quota ───────────────────────────────────────────────────────────
const checkGroundingQuota = async (): Promise<{ allowed: boolean; used: number }> => {
    try {
        const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
        const { count } = await supabaseClient.from('tours_cache')
            .select('*', { count: 'exact', head: true })
            .gte('updated_at', todayStart.toISOString());
        const used = count || 0;
        const allowed = used < GROUNDING_DAILY_LIMIT;
        if (!allowed) console.warn(`[AI] 🚫 Grounding bloqueado: ${used}/${GROUNDING_DAILY_LIMIT}`);
        else console.log(`[AI] 📊 Grounding: ${used}/${GROUNDING_DAILY_LIMIT}`);
        return { allowed, used };
    } catch (e) {
        return { allowed: true, used: 0 };
    }
};

// ── Parser robusto: maneja preámbulos de texto, markdown y corchetes espúreos ──
// Gemini con grounding a veces devuelve texto libre ANTES del JSON (estilo DAI).
// Estrategia: buscar el array JSON más largo (más paradas) entre todos los candidatos.
const tryExtractTours = (text: string): any[] => {
    // Paso 1: limpiar bloques markdown y citas numéricas tipo [1]
    const clean = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/\[\d+\]/g, '')   // citas numéricas [1], [2]...
        .trim();

    // Paso 2: JSON directo (cuando response_mime_type funciona sin grounding)
    try {
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (_) {}

    // Paso 3: encontrar TODOS los arrays JSON candidatos y quedarse con el más rico.
    // Usamos un parser de balance de corchetes para no depender de regex goloso.
    const candidates: any[] = [];
    for (let i = 0; i < clean.length; i++) {
        if (clean[i] !== '[') continue;
        let depth = 0;
        let j = i;
        while (j < clean.length) {
            if (clean[j] === '[') depth++;
            else if (clean[j] === ']') { depth--; if (depth === 0) break; }
            j++;
        }
        if (depth === 0) {
            const candidate = clean.slice(i, j + 1);
            try {
                const parsed = JSON.parse(candidate);
                // Solo nos interesan arrays que contengan objetos con 'stops' (tours reales)
                if (Array.isArray(parsed) && parsed.some((t: any) => Array.isArray(t.stops))) {
                    candidates.push(parsed);
                }
            } catch (_) {}
        }
    }

    if (candidates.length > 0) {
        // Elegir el candidato con más paradas totales
        candidates.sort((a, b) => {
            const stopsA = a.reduce((s: number, t: any) => s + (t.stops?.length || 0), 0);
            const stopsB = b.reduce((s: number, t: any) => s + (t.stops?.length || 0), 0);
            return stopsB - stopsA;
        });
        console.log(`[AI] tryExtractTours: ${candidates[0].length} tours, ${candidates[0].reduce((s: number, t: any) => s + (t.stops?.length || 0), 0)} paradas totales.`);
        return candidates[0];
    }

    console.error('[AI] tryExtractTours: no se pudo extraer ningún array de tours válido.');
    return [];
};

// ── SERVIDOR ──────────────────────────────────────────────────────────────────
serve(async (req) => {
    try {
        // Seguridad: verificar el Webhook Secret
        // const secret = req.headers.get('x-webhook-secret');
        // if (secret !== Deno.env.get('WEBHOOK_SECRET')) {
        //     console.error('[AI] Unauthorized webhook attempt');
        //     return new Response('Unauthorized', { status: 401 });
        // }

        const payload = await req.json();
        const job = payload.record;

        if (job.status !== 'PENDING_AI_02') {
            return new Response('Not PENDING_AI_02', { status: 200 });
        }

        const jobId = job.id;
        const cityInfoObj = job.city_info || {};
        const city = cityInfoObj.city || job.city_slug.split('_')[0];
        const country = cityInfoObj.country || 'Spain';

        console.log(`[AI] Iniciando generación para Job ${jobId}: ${city} / ${job.language}`);

        // 1. Contexto geográfico + catálogos
        const cityInfo = await getCityInfo(city, country);
        const googleRadius = cityInfo ? getGoogleRadius(cityInfo) : 1800;
        console.log(`[AI] Radio Google Places: ${googleRadius}m`);
        const [overpassItems, googleItems] = await Promise.all([
            fetchOverpassCatalog(cityInfo),
            cityInfo ? fetchGooglePlaces(cityInfo.lat, cityInfo.lon, googleRadius) : Promise.resolve([]),
        ]);

        // SMART CENTER basado en centroide del catálogo Overpass
        if (cityInfo && overpassItems.length >= 10) {
            const catLat = overpassItems.reduce((s: number, p: any) => s + p.lat, 0) / overpassItems.length;
            const catLon = overpassItems.reduce((s: number, p: any) => s + p.lon, 0) / overpassItems.length;
            const shiftKm = haversineKm(cityInfo.lat, cityInfo.lon, catLat, catLon);
            if (shiftKm > 1) {
                console.log(`[AI] 📍 Centro ajustado: ${cityInfo.lat.toFixed(4)},${cityInfo.lon.toFixed(4)} → ${catLat.toFixed(4)},${catLon.toFixed(4)} (shift ${shiftKm.toFixed(1)}km)`);
                cityInfo.lat = catLat;
                cityInfo.lon = catLon;
            }
        }

        // RADIO DINÁMICO
        const allRaw = [...overpassItems, ...googleItems];
        if (cityInfo && allRaw.length > 0) {
            cityInfo.radiusKm = calculateRadiusFromCatalog(allRaw, cityInfo);
        } else if (cityInfo) {
            cityInfo.radiusKm = 5;
        }

        // 2. Merge + filtros + scoring → catálogo pre-clasificado
        const center = cityInfo ? { lat: cityInfo.lat, lon: cityInfo.lon } : { lat: 0, lon: 0 };
        const maxDist = cityInfo ? getWalkingCap(cityInfo) : 2.5; // walking distance cap dinámico
        console.log(`[AI] Walking cap: ${maxDist}km (pop: ${cityInfo?.population ?? 'N/A'})`);
        const scoredCatalog = cityInfo
            ? buildScoredCatalog(overpassItems, googleItems, center, maxDist)
            : [];

        // 3. Decidir número de tours según POIs de calidad disponibles
        const nTours = scoredCatalog.length >= 24 ? 3
                     : scoredCatalog.length >= 14 ? 2
                     : 1;
        console.log(`[AI] ${scoredCatalog.length} POIs filtrados → ${nTours} tour(s)`);

        const { text: catalogText } = formatTieredCatalog(scoredCatalog, nTours);

        // 4. Grounding & Prompt
        const grounding = await checkGroundingQuota();
        const coordsAnchor = cityInfo
            ? `The geographic anchor for ${city} is near latitude ${cityInfo.lat.toFixed(6)}, longitude ${cityInfo.lon.toFixed(6)}. Focus strictly on the Historical Center / Old Town, keeping stops within a ${maxDist.toFixed(1)}km radius of the center.`
            : `All stops must be located within the urban area of ${city}, ${country}.`;
        const prompt = generateTourPrompt(city, country, job.language, coordsAnchor, catalogText, nTours);

        // 3. Llamada a Gemini
        console.log(`[AI] Llamando a Gemini ${grounding.allowed ? 'CON' : 'SIN'} Grounding...`);
        const accessToken = await getGcpAccessToken();
        const gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Referer': 'https://app.bdai.travel/',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                    ...(grounding.allowed ? { tools: [{ google_search: {} }] } : {}),
                    generationConfig: { temperature: 0.7, topP: 1, topK: 1 }
                    // NOTA: NO se usa response_mime_type:"application/json" porque es incompatible
                    // con google_search (grounding). Se usa tryExtractTours para parseo robusto.
                })
            }
        );

        if (!gRes.ok) {
            const errTxt = await gRes.text();
            throw new Error(`Gemini API ${gRes.status}: ${errTxt}`);
        }

        const resJson = await gRes.json();

        // Log grounding metadata para auditoría
        const searchQueries = resJson.candidates?.[0]?.groundingMetadata?.webSearchQueries;
        if (searchQueries) console.log(`[AI] Grounding queries: ${JSON.stringify(searchQueries)}`);

        if (!resJson.candidates || resJson.candidates.length === 0) {
            const errorMsg = resJson.error?.message || 'No candidates returned from Gemini';
            console.error('[AI] Sin candidatos:', JSON.stringify(resJson));
            await supabaseClient.from('generation_jobs').update({ status: 'FAILED', error_message: `AI Failure: ${errorMsg}` }).eq('id', job.id);
            await supabaseClient.from('tours_cache').update({ status: 'ERROR', error_message: `AI Failure: ${errorMsg}` }).eq('city', job.city_slug).eq('language', job.language);
            return new Response('AI Failure', { status: 200 });
        }

        const rawText = resJson.candidates[0]?.content?.parts?.[0]?.text || '[]';
        const finalTours = tryExtractTours(rawText);

        if (finalTours.length === 0) {
            const errorMsg = 'AI returned empty or unparseable tour array';
            console.error('[AI] Parse fallido. Raw:', rawText.substring(0, 300));
            await supabaseClient.from('generation_jobs').update({ status: 'FAILED', error_message: errorMsg }).eq('id', job.id);
            await supabaseClient.from('tours_cache').update({ status: 'ERROR', error_message: errorMsg }).eq('city', job.city_slug).eq('language', job.language);
            return new Response('Format Error', { status: 200 });
        }

        // Garantizar que cada tour tiene el campo 'city' aunque Gemini lo haya omitido.
        // TourCard.tsx usa tour.city para generateAudio — sin esto el audio falla con city=undefined.
        const toursWithCity = finalTours.map((t: any) => ({
            ...t,
            city: t.city || city,
            country: t.country || country,
        }));

        // 4. Pasar el trabajo al GIS worker: guardar cityInfo (con radiusKm ya calculado) y los tours brutos
        const finalCityInfo = cityInfo ? { ...cityInfo, city, country } : { city, country };
        await supabaseClient.from('generation_jobs').update({
            city_info: finalCityInfo,        // { city, country, lat, lon, radiusKm, population, bbox:{south,west,north,east} }
            raw_ai_data: toursWithCity,
            status: 'PENDING_GIS_02',
            updated_at: new Date().toISOString()
        }).eq('id', jobId);

        console.log(`[AI] Job ${job.id} actualizado a PENDING_GIS con ${finalTours.length} tours.`);
        return new Response('OK');

    } catch (e: any) {
        console.error('[AI] Fatal Error:', e);
        try {
            const payload = await req.clone().json();
            if (payload?.record) {
                await supabaseClient.from('generation_jobs').update({ status: 'FAILED', error_message: `Worker Error: ${e.message}` }).eq('id', payload.record.id);
                await supabaseClient.from('tours_cache').update({ status: 'ERROR', error_message: `Worker Error: ${e.message}` }).eq('city', payload.record.city_slug).eq('language', payload.record.language);
            }
        } catch (_) {}
        return new Response('Error', { status: 500 });
    }
});
