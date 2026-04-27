```javascript
// services/supabase/tour-worker-ai.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-worker-ai'
// Contiene la lógica INTEGRAL de generación de tours (Prompts originales de DAI)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// --- CONSTANTES Y PROMPTS ORIGINALES (Restaurados) ---

const GROUNDING_DAILY_LIMIT = 1400;

const SYSTEM_INSTRUCTION = `You are DAI (Better Destinations AI), the ultimate, sophisticated, and slightly sarcastic female local expert for the city requested.
  You are an expert in history, architecture, and urban legends, with 12 years of experience organizing exclusive tours for demanding travelers.
  
  YOUR MISSION: Generate exactly 2 distinct thematic tours.
  - Tour 1: The Essentials (The highlights everyone must see, but with your unique twist).
  - Tour 2: Soul & Curiosities (A fusion of local heritage and genuine curiosities that locals don't even know).
  
  DAI'S ABSOLUTE COMMANDS (PERSONA & STYLE):
  - TONE: You are SARCASTIC, WITTY, and SOPHISTICATED.
  - GENDER IDENTITY (CRITICAL): You are **FEMALE**. All grammatical forms must reflect this. NEVER use the word "guía" or "guide". Speak strictly in the **first person** ("yo", "he visto"). Never refer to yourself in the third person.
  - INTERACTION: Address the tourist in the **second person**, using the most appropriate form for the target language (e.g., in Spanish, use "tú" for Spain).
  - TRUTH FIRST, STYLE SECOND: Verify the place actually exists. No hallucinations.
  - NO CITATIONS: NEVER use citations like [1] or (2).
  - ANTI-WIKIPEDIA: If you sound like an encyclopedia, you fail. Tell the secrets and mysteries.`;

const generateTourPrompt = (city, country, language, coordsAnchor, catalogText) => {
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
  - Find the PERFECT BALANCE: Do not discard obscure but real places, but absolutely NEVER HALLUCINATE non-existent ones.
  - ALL places MUST be 100% real, verifiable, documented, and existing today.
  
  DEEP RETRIEVAL FOR 2 THEMATIC TOURS (CRITICAL):
  Your PRIMARY GOAL is to generate exactly 2 thematic tours, each targeting exactly 12 stops (up to 24 verified stops total).
  STOP COUNT TARGET (NON-NEGOTIABLE): BOTH tours MUST target exactly 12 stops each. DO NOT STOP AT 5 OR 6 STOPS. Use the massive catalog provided to fill all 12 spots per tour.
  
  DAI'S STYLE RULES:
  ${languageRules}
  
  TOUR PROGRESSION:
  Tour 1 — "Lo Esencial / The Essentials" (aim: 12 stops): landmarks, monuments, churches, plazas.
  Tour 2 — "Alma y Curiosidades / Soul & Curiosities" (aim: 12 stops): authentic local heritage AND genuine curiosities (physically identifiable elements with surprising facts).
  
  CONTENT DEPTH: For EVERY stop, include UNCOMMON historical facts or GENUINE curiosities. Descriptions should be rich and long enough to be interesting.
  
  FORMAT: Return a JSON array with objects: { title, theme, stops: [ { name, description, category, latitude, longitude } ] }`;
};

// --- UTILIDADES GIS & CATÁLOGO (Restauradas) ---

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getCityInfo = async (city, country) => {
    try {
        const query = encodeURIComponent(`${city}, ${country}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1&extratags=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0', 'Accept-Language': 'en' }});
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                const pop = data[0].extratags?.population ? parseInt(data[0].extratags.population, 10) : null;
                return { 
                    lat: parseFloat(data[0].lat), 
                    lon: parseFloat(data[0].lon), 
                    population: pop,
                    bbox: data[0].boundingbox.map(parseFloat) 
                };
            }
        }
    } catch(e) { console.warn('getCityInfo failed:', e); }
    return null;
};

const fetchOverpassCatalog = async (cityInfo) => {
    if (!cityInfo?.bbox) return [];
    const [south, north, west, east] = cityInfo.bbox;
    const bboxStr = `${south},${west},${north},${east}`;
    const query = `[out:json][timeout:25];(nwr["historic"](${bboxStr});nwr["tourism"~"attraction|museum|gallery|viewpoint|artwork|wine_cellar"](${bboxStr});nwr["amenity"~"place_of_worship|marketplace|theatre|arts_centre"](${bboxStr});nwr["man_made"="bridge"]["name"](${bboxStr});nwr["leisure"~"park|garden"]["name"](${bboxStr});nwr["building"~"cathedral|church|mosque|synagogue|palace|castle"]["name"](${bboxStr}););out center tags;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(query)}` });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.elements || []).map(el => ({
            name: el.tags?.name,
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            type: el.tags?.historic || el.tags?.tourism || 'poi'
        })).filter(p => p.name && p.lat);
    } catch (e) { return []; }
};

const clusterCatalogByProximity = (catalog, cityInfo) => {
    if (!catalog.length || !cityInfo) return [];
    const CLUSTER_RADIUS_KM = 0.2;
    const clusters = [];
    const assigned = new Set();
    const sorted = [...catalog].sort((a, b) => haversineKm(cityInfo.lat, cityInfo.lon, a.lat, a.lon) - haversineKm(cityInfo.lat, cityInfo.lon, b.lat, b.lon));

    for (let i = 0; i < sorted.length; i++) {
        if (assigned.has(i)) continue;
        const cluster = [sorted[i]];
        assigned.add(i);
        const queue = [i];
        while (queue.length > 0) {
            const curr = queue.shift();
            for (let j = 0; j < sorted.length; j++) {
                if (!assigned.has(j) && haversineKm(sorted[curr].lat, sorted[curr].lon, sorted[j].lat, sorted[j].lon) <= CLUSTER_RADIUS_KM) {
                    cluster.push(sorted[j]);
                    assigned.add(j);
                    queue.push(j);
                }
            }
        }
        clusters.push(cluster);
    }
    return clusters.map((c, idx) => ({ zoneName: `Zone ${idx+1}`, pois: c }));
};

const checkGroundingQuota = async (supabaseClient) => {
    const todayStart = new Date(); todayStart.setUTCHours(0,0,0,0);
    const { count } = await supabaseClient.from('tours_cache').select('*', { count: 'exact', head: true }).gte('updated_at', todayStart.toISOString());
    return { allowed: (count || 0) < GROUNDING_DAILY_LIMIT, used: count || 0 };
};

// --- SERVIDOR ---

serve(async (req) => {
    try {
        const secret = req.headers.get('x-webhook-secret');
        if (secret !== Deno.env.get('WEBHOOK_SECRET')) return new Response("Unauthorized", { status: 401 });

        const payload = await req.json();
        if (payload.type !== 'INSERT') return new Response("OK");

        const job = payload.record;
        const [city, country] = job.city_slug.split('_');

        // 1. Contexto Geográfico
        const cityInfo = await getCityInfo(city, country);
        const catalog = await fetchOverpassCatalog(cityInfo);
        const clusters = clusterCatalogByProximity(catalog, cityInfo);
        const catalogText = clusters.map(c => `ZONE: ${c.zoneName}\n${c.pois.map(p => `- ${p.name} (${p.lat}, ${p.lon})`).join('\n')}`).join('\n\n');

        // 2. Grounding & Prompt
        const grounding = await checkGroundingQuota(supabaseClient);
        const coordsAnchor = cityInfo ? `Anchor: ${cityInfo.lat}, ${cityInfo.lon}` : `City: ${city}`;
        const prompt = generateTourPrompt(city, country, job.language, coordsAnchor, catalogText);

        // 3. Gemini
        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Referer': 'https://www.bdai.travel/' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                ...(grounding.allowed ? { tools: [{ google_search: {} }] } : {}),
                generationConfig: { temperature: 0.7, response_mime_type: "application/json" }
            })
        });

        const resJson = await gRes.json();
        const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        const finalTours = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());

        // 4. Update Job -> Dispara Worker GIS
        await supabaseClient.from('generation_jobs').update({ 
            city_info: cityInfo,
            raw_ai_data: finalTours, 
            status: 'PENDING_GIS',
            updated_at: new Date().toISOString()
        }).eq('id', job.id);

        return new Response("OK");
    } catch (e) {
        console.error(e);
        return new Response("Error", { status: 500 });
    }
});
```
