// services/supabase/tour-worker-ai-02.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-worker-ai-02'
// Recibe el webhook de INSERT en generation_jobs (status=PENDING_AI_02),
// obtiene contexto GIS, llama a Gemini y actualiza el job a PENDING_GIS.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { importPKCS8, SignJWT } from "npm:jose@5.2.0";

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

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
const generateTourPrompt = (city: string, country: string, language: string, coordsAnchor: string, catalogText: string): string => {
    const languageRules = language.toLowerCase().startsWith('es')
        ? `- LEXICON & DIALECT (CRITICAL): You MUST write using STRICT Castilian Spanish (España peninsular). 
  * Use "vosotros" instead of "ustedes" (e.g., "fijaos", "mirad", "venid", "os recomiendo").
  * Use local Spain colloquialisms naturally ("chulo", "guay", "vale", "flipante", "una pasada").
  * This is CRITICAL for our text-to-speech model to correctly adopt a Spain-Spanish accent. NEVER write in neutral or Latin American Spanish.`
        : ``;

    return `You are generating tours for ${city}, ${country} in ${language}.

GEOGRAPHIC ANCHOR (CRITICAL): ${coordsAnchor}
${catalogText}

UNIVERSAL RIGOR & NO-INVENTION RULE:
- Find the PERFECT BALANCE: Do not discard obscure but real places, but absolutely NEVER HALLUCINATE non-existent ones (e.g., if it can't be found on the internet, DO NOT invent it).
- ALL places MUST be 100% real, verifiable, documented, and existing today.
- NEVER invent street names, bars, monuments, or hidden spots. 
- GEOGRAPHIC STRICTNESS: ALL places MUST realistically exist physically inside the borders of ${city}, ${country}. Do NOT borrow or import real places from other cities or distant towns under any circumstance. If you run out of real places in ${city}, simply stop. 

DEEP RETRIEVAL FOR 2 THEMATIC TOURS (CRITICAL):
Your PRIMARY GOAL is to generate exactly 2 thematic tours, each targeting exactly 12 stops (up to 24 verified stops total).
STOP COUNT TARGET (NON-NEGOTIABLE): BOTH tours MUST target exactly 12 stops each. DO NOT STOP AT 5 OR 6 STOPS. Use the massive catalog provided below to fill all 12 spots per tour. Only go below 12 if you genuinely run out of real places, which is extremely rare. A tour of 11 stops is acceptable if the 12th truly cannot be found. A tour of 5 to 8 stops when more real places clearly exist is considered a COMPLETE FAILURE of your instructions.
To reach 12 stops per tour, you MUST perform a DEEP RETRIEVAL of your knowledge base for ${city} and its specific regional heritage, and aggressively utilize the provided catalog.

GRACEFUL DEGRADATION (only when genuinely impossible to find enough verifiable places):
- If fewer than 16 truly real stops exist in total: generate EXACTLY 1 tour (aim for 12 stops, minimum viable: 4 stops).
- If 16 or more truly real stops exist: generate EXACTLY 2 tours, each aiming for 12 stops (minimum 8 each).
STRICT LIMIT: NEVER generate a 3rd tour. You are strictly limited to a maximum of 2 tour objects.
ALWAYS push hard to reach 12 stops per tour before settling for fewer.
DO NOT repeat any stop across tours.
(If only 1 tour possible: combine essentials and the best curiosities into a single rich experience.)

DAI'S ABSOLUTE COMMANDS (PERSONA & STYLE):
- TONE: You are SARCASTIC, WITTY, and SOPHISTICATED.
- GENDER IDENTITY (CRITICAL): You are **FEMALE**. All grammatical forms must reflect this. NEVER use the word "guía" or "guide". Speak strictly in the **first person** ("yo", "he visto"). Never refer to yourself in the third person.
- INTERACTION (CULTURAL ADAPTABILITY): Address the tourist in the **second person**, using the most appropriate form for the target language and culture.
- TRUTH FIRST, STYLE SECOND: Before adding any wit or sarcasm, verify the place actually exists and is open TODAY.
- NO HALLUCINATIONS (APPLIES TO DESCRIPTIONS TOO): NEVER INVENT A NAME OR A STOP.
- ANTI-WIKIPEDIA: Wikipedia is your enemy. If you sound like an encyclopedia, you fail.
- NO CITATIONS: NEVER use citations, footnotes, or references like [1] or (2). NEVER.
- NO SEQUENTIAL CONNECTORS (CRITICAL): Stops are reordered automatically by a routing algorithm AFTER generation, so the order you write them in is NOT the final order. ABSOLUTELY FORBIDDEN: any word or phrase implying sequence or position — "Para terminar", "Para empezar", "Como primera parada", "Como última parada", "A continuación", "Seguimos hacia", "Tras visitar", "Antes de continuar", "El próximo punto", "Next stop", "Finally", "To finish", "To start", "First of all", "Last but not least", or any equivalent in any language. Every stop description must stand completely alone, as if the tourist could arrive there at any point in the tour.
- NO REPETITIVE OPENERS (CRITICAL): Every stop description must begin differently. FORBIDDEN as opening words: "Aquí tenéis", "Aquí tienes", "Aquí", "Este es", "Este lugar", "En este lugar", "En esta", "Este", "Esta", "Here you", "Here is", "This is", "This place". Open each description with the name of the place, a striking fact, a question, a provocative statement, or a sensory detail — never a generic filler phrase.
${languageRules}

TOUR PROGRESSION (THEMATIC ORDER IS MANDATORY):
Tour 1 — "Lo Esencial / The Essentials" (aim: 12 stops): landmarks, monuments, churches, plazas. Concentrated within the HISTORIC CENTER in a tight walkable radius.
Tour 2 — "Alma y Curiosidades / Soul & Curiosities" (aim: 12 stops): authentic local heritage AND genuine curiosities (physically identifiable elements with surprising facts).

CONTENT DEPTH RULES: For EVERY stop, include at least ONE uncommon historical fact or genuine curiosity. Descriptions should be 150-200 words, rich and interesting.

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
4. COORDINATES ARE CRITICAL: Use the geographic anchor above. All stops must be strictly within the boundaries of ${city}.
5. Content in ${language}.
6. NO SEQUENTIAL CONNECTORS & NO REPETITIVE OPENERS: See DAI'S ABSOLUTE COMMANDS above — these rules apply to every single stop description without exception.

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
        return (data.elements || []).map((el: any) => ({
            name: el.tags?.name,
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            type: el.tags?.historic || el.tags?.tourism || el.tags?.amenity || 'poi'
        })).filter((p: any) => p.name && p.name.length >= 3 && p.lat);
    } catch (e) { return []; }
};

// ── Clustering geográfico de POIs con naming cardinal (igual que monolito) ───
const clusterCatalogByProximity = (catalog: any[], cityInfo: any): any[] => {
    if (!catalog.length || !cityInfo) return [];
    const CLUSTER_RADIUS_KM = 0.2;
    const clusters: any[][] = [];
    const assigned = new Set<number>();
    const sorted = [...catalog].sort((a, b) =>
        haversineKm(cityInfo.lat, cityInfo.lon, a.lat, a.lon) - haversineKm(cityInfo.lat, cityInfo.lon, b.lat, b.lon)
    );
    for (let i = 0; i < sorted.length; i++) {
        if (assigned.has(i)) continue;
        const cluster = [sorted[i]];
        assigned.add(i);
        const queue = [i];
        while (queue.length > 0) {
            const curr = queue.shift()!;
            for (let j = 0; j < sorted.length; j++) {
                if (!assigned.has(j) && haversineKm(sorted[curr].lat, sorted[curr].lon, sorted[j].lat, sorted[j].lon) <= CLUSTER_RADIUS_KM) {
                    cluster.push(sorted[j]); assigned.add(j); queue.push(j);
                }
            }
        }
        clusters.push(cluster);
    }
    return clusters.map(cluster => {
        const cLat = cluster.reduce((s, p) => s + p.lat, 0) / cluster.length;
        const cLon = cluster.reduce((s, p) => s + p.lon, 0) / cluster.length;
        const dist = haversineKm(cityInfo.lat, cityInfo.lon, cLat, cLon);
        const dLat = cLat - cityInfo.lat;
        const dLon = cLon - cityInfo.lon;
        let zoneName: string;
        if (dist < 0.3) { zoneName = 'Central Zone'; }
        else {
            const ns = dLat > 0.001 ? 'North' : dLat < -0.001 ? 'South' : '';
            const ew = dLon > 0.001 ? 'East' : dLon < -0.001 ? 'West' : '';
            zoneName = `${ns}${ns && ew ? '-' : ''}${ew} Quarter`.trim() || 'Extended Zone';
        }
        return { zoneName, pois: cluster, distToCenter: dist };
    }).sort((a, b) => a.distToCenter - b.distToCenter);
};

// ── Formatear catálogo para el prompt (igual que monolito) ───────────────────
const formatCatalogForPrompt = (clusteredCatalog: any[], flatCatalog: any[]): string => {
    if (!clusteredCatalog?.length && !flatCatalog?.length) return '';
    const totalCount = flatCatalog?.length || 0;
    const MAX_POIS = 120;
    let totalShown = 0;
    if (!clusteredCatalog?.length) {
        const entries = flatCatalog.slice(0, MAX_POIS)
            .map(p => `- "${p.name}" (${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}) [${p.type}]`)
            .join('\n');
        return `\n\nVERIFIED POI CATALOG (${totalCount} POIs):\n${entries}`;
    }
    let text = `\n\nVERIFIED POI CATALOG (ORGANIZED BY GEOGRAPHIC ZONES — ${totalCount} POIs total, showing top ${MAX_POIS}):
The following places are CONFIRMED to exist in this city with verified coordinates from OpenStreetMap.
You MUST prioritize these over your own knowledge to reach your 12-stop target. Use the EXACT names and coordinates provided.
If you want to include a place NOT in this catalog, you MUST be 100% certain it exists TODAY.

GEOGRAPHIC ROUTING RULE (CRITICAL): Within each tour, group stops from ADJACENT zones to create a naturally walkable route.`;
    for (const zone of clusteredCatalog) {
        if (totalShown >= MAX_POIS) break;
        text += `\nZONE — ${zone.zoneName} (${zone.pois.length} POIs):\n`;
        for (const poi of zone.pois) {
            if (totalShown >= MAX_POIS) break;
            text += `- "${poi.name}" (${poi.lat.toFixed(6)}, ${poi.lon.toFixed(6)}) [${poi.type}]\n`;
            totalShown++;
        }
    }
    return text;
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

        // 1. Contexto geográfico
        const cityInfo = await getCityInfo(city, country);
        const catalog = await fetchOverpassCatalog(cityInfo);

        // SMART CENTER: Si el catálogo Overpass tiene suficientes POIs,
        // usar su centroide como centro geográfico real. Esto corrige el
        // problema de ciudades donde Nominatim devuelve el centroide
        // administrativo del municipio (ej. Málaga) en lugar del turístico.
        if (cityInfo && catalog.length >= 10) {
            const catLat = catalog.reduce((s: number, p: any) => s + p.lat, 0) / catalog.length;
            const catLon = catalog.reduce((s: number, p: any) => s + p.lon, 0) / catalog.length;
            const shiftKm = haversineKm(cityInfo.lat, cityInfo.lon, catLat, catLon);
            if (shiftKm > 1) {
                console.log(`[AI] 📍 Centro ajustado: Nominatim (${cityInfo.lat.toFixed(4)}, ${cityInfo.lon.toFixed(4)}) → Catálogo (${catLat.toFixed(4)}, ${catLon.toFixed(4)}), shift=${shiftKm.toFixed(1)}km`);
                cityInfo.lat = catLat;
                cityInfo.lon = catLon;
            }
        }

        // RADIO DINÁMICO: calcular ANTES de pasar cityInfo al GIS worker
        if (cityInfo && catalog.length > 0) {
            cityInfo.radiusKm = calculateRadiusFromCatalog(catalog, cityInfo);
        } else if (cityInfo) {
            cityInfo.radiusKm = 5; // fallback sin catálogo
        }

        const clusteredCatalog = clusterCatalogByProximity(catalog, cityInfo);
        const catalogText = formatCatalogForPrompt(clusteredCatalog, catalog);

        // 2. Grounding & Prompt
        const grounding = await checkGroundingQuota();
        const coordsAnchor = cityInfo
            ? `The geographic anchor for ${city} is near latitude ${cityInfo.lat.toFixed(6)}, longitude ${cityInfo.lon.toFixed(6)}. Focus strictly on the Historical Center / Old Town, keeping stops within a 2km radius of each other.`
            : `All stops must be located within the urban area of ${city}, ${country}.`;
        const prompt = generateTourPrompt(city, country, job.language, coordsAnchor, catalogText);

        // 3. Llamada a Gemini
        console.log(`[AI] Llamando a Gemini ${grounding.allowed ? 'CON' : 'SIN'} Grounding...`);
        const accessToken = await getGcpAccessToken();
        const gRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Referer': 'https://www.bdai.travel/',
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
