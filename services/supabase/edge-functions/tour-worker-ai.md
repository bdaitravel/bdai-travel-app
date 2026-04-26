```javascript
// services/supabase/tour-worker-ai.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-worker-ai'

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// -- UTILIDADES GEOGRÁFICAS (Movidas aquí para evitar Timeouts en el Orquestador) --
const getCityInfo = async (city, country) => {
    try {
        const query = `${encodeURIComponent(city)}, ${encodeURIComponent(country)}`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&extratags=1&limit=1`, {
            headers: { 'Accept-Language': 'en', 'User-Agent': 'BDAI-Travel-App/1.0' }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data && data.length > 0) {
            const result = data[0];
            const population = result.extratags?.population ? parseInt(result.extratags.population, 10) : 100000;
            return {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon),
                population: population,
                bbox: result.boundingbox.map(parseFloat)
            };
        }
        return null;
    } catch (e) { return null; }
};

const fetchOverpassCatalog = async (cityInfo) => {
    if (!cityInfo || !cityInfo.bbox) return [];
    try {
        const [south, north, west, east] = cityInfo.bbox;
        const bboxStr = `${south},${west},${north},${east}`;
        const overpassQuery = `[out:json][timeout:25];(nwr["historic"](${bboxStr});nwr["tourism"~"attraction|museum|gallery|viewpoint|artwork|wine_cellar"](${bboxStr});nwr["amenity"~"place_of_worship|marketplace|theatre|arts_centre"](${bboxStr});nwr["man_made"="bridge"](${bboxStr});nwr["leisure"~"park|garden"](${bboxStr});nwr["building"~"cathedral|church|mosque|synagogue|palace|castle"](${bboxStr}););out center;`;
        const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST", body: overpassQuery, headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        if (!res.ok) return [];
        const data = await res.json();
        const catalog = [];
        const seenNames = new Set();
        for (const el of data.elements) {
            const name = el.tags?.name || el.tags?.["name:en"];
            if (!name) continue;
            const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seenNames.has(norm)) continue;
            seenNames.add(norm);
            let lat = el.lat || el.center?.lat;
            let lon = el.lon || el.center?.lon;
            if (lat && lon) catalog.push({ name, type: el.tags.tourism || "poi", lat, lon });
        }
        return catalog;
    } catch (e) { return []; }
};

serve(async (req) => {
    try {
        const secret = req.headers.get('x-webhook-secret');
        if (secret !== Deno.env.get('WEBHOOK_SECRET')) {
            return new Response("Unauthorized", { status: 401 });
        }

        const payload = await req.json();
        if (payload.table !== 'generation_jobs' || payload.type !== 'INSERT') {
            return new Response("OK", { status: 200 });
        }

        const job = payload.record;
        console.log(`[WORKER AI] Procesando ${job.city_slug}...`);

        const parts = job.city_slug.split('_');
        const city = parts[0];
        const country = parts[1] || "";
        
        // 1. OBTENER CONTEXTO (Ahora aquí, en background)
        const cityInfo = await getCityInfo(city, country);
        const overpassCatalog = await fetchOverpassCatalog(cityInfo);
        console.log(`[WORKER AI] Catálogo obtenido: ${overpassCatalog.length} puntos.`);

        // 2. LLAMADA A GEMINI
        const systemInstruction = `You are DAI (Better Destinations AI), the ultimate, sophisticated, and slightly sarcastic female local expert for ${city}, ${country}.`;
        const catalogText = overpassCatalog.length > 0 ? overpassCatalog.map(p => `- ${p.name} (${p.type})`).join("\n") : "No verified catalog. Use high-confidence knowledge.";
        const languageRules = job.language === 'es' ? "MANDATORY: PENINSULAR SPANISH ('vosotros', 'chulo')." : `MANDATORY: ${job.language}.`;

        const prompt = `Generate exactly 2 tours (or 1 if <16 stops total) for ${city}, ${country} in ${job.language}. Aim for 12 stops each. Tour 1: Essentials. Tour 2: Soul & Curiosities. Return JSON array. 
        CATALOG: ${catalogText}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Referer': 'https://www.bdai.travel/' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, response_mime_type: "application/json" }
            })
        });

        if (!response.ok) throw new Error("Gemini Error");

        const data = await response.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        const rawTours = JSON.parse(rawContent.replace(/```json/g, '').replace(/```/g, '').trim());

        // 3. GUARDAR RESULTADOS Y PASAR AL SIGUIENTE PASO
        await supabaseClient.from('generation_jobs').update({ 
            city_info: cityInfo,
            overpass_catalog: overpassCatalog,
            raw_ai_data: rawTours, 
            status: 'PENDING_GIS',
            updated_at: new Date().toISOString()
        }).eq('id', job.id);

        return new Response("OK", { status: 200 });

    } catch (error) {
        console.error("[WORKER AI] Error:", error);
        return new Response("Error", { status: 500 });
    }
});
```
