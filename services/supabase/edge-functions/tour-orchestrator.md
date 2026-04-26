```javascript
// services/supabase/tour-orchestrator.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-orchestrator'
// Despliegue: copiar este código en el editor del Dashboard de Supabase.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

if (!serviceKey || !supabaseUrl) {
    console.error("Faltan variables de entorno CRÍTICAS (SUPABASE_URL o SERVICE_ROLE_KEY)");
}

const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// -- UTILIDADES GEOGRÁFICAS BÁSICAS --
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
                bbox: result.boundingbox.map(parseFloat) // [south, north, west, east]
            };
        }
        return null;
    } catch (e) {
        console.error("Error getCityInfo:", e);
        return null;
    }
};

const fetchOverpassCatalog = async (cityInfo) => {
    if (!cityInfo || !cityInfo.bbox) return [];
    try {
        const [south, north, west, east] = cityInfo.bbox;
        const bboxStr = `${south},${west},${north},${east}`;
        const overpassQuery = `
            [out:json][timeout:25];
            (
              nwr["historic"](${bboxStr});
              nwr["tourism"~"attraction|museum|gallery|viewpoint|artwork|wine_cellar"](${bboxStr});
              nwr["amenity"~"place_of_worship|marketplace|theatre|arts_centre"](${bboxStr});
              nwr["man_made"="bridge"](${bboxStr});
              nwr["leisure"~"park|garden"](${bboxStr});
              nwr["building"~"cathedral|church|mosque|synagogue|palace|castle"](${bboxStr});
            );
            out center;
        `;
        const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: overpassQuery,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
        const data = await res.json();
        
        const catalog = [];
        const seenNames = new Set();
        
        for (const el of data.elements) {
            if (!el.tags || (!el.tags.name && !el.tags["name:en"])) continue;
            const name = el.tags.name || el.tags["name:en"];
            const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (seenNames.has(normalizedName)) continue;
            seenNames.add(normalizedName);
            
            let lat = el.lat || el.center?.lat;
            let lon = el.lon || el.center?.lon;
            if (!lat || !lon) continue;
            
            catalog.push({ name, type: el.tags.historic ? "historic" : el.tags.tourism || "poi", lat, lon });
        }
        return catalog;
    } catch (e) {
        console.error("Error fetching Overpass catalog:", e);
        return [];
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const body = await req.json();
        const { city, country, language, slug } = body;

        if (!city || !country || !language || !slug) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), { 
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }

        console.log(`[ORCHESTRATOR] Solicitando tours para ${city}, ${country} (${slug})`);

        // 1. Marcar UI como GENERANDO
        await supabaseClient.from('tours_cache').upsert({
            city: slug,
            language: language.toLowerCase(),
            status: 'GENERATING',
            updated_at: new Date().toISOString()
        }, { onConflict: 'city, language' });

        // 2. Extraer contexto (Catálogo)
        const cityInfo = await getCityInfo(city, country);
        const overpassCatalog = await fetchOverpassCatalog(cityInfo);
        
        console.log(`[ORCHESTRATOR] Catálogo Overpass obtenido: ${overpassCatalog.length} elementos.`);

        // 3. Encolar trabajo en generation_jobs
        const { error: insertError } = await supabaseClient.from('generation_jobs').insert({
            city_slug: slug,
            language: language.toLowerCase(),
            city_info: cityInfo,
            overpass_catalog: overpassCatalog,
            status: 'PENDING_AI'
        });

        if (insertError) {
            console.error("[ORCHESTRATOR] Error insertando job:", insertError);
            throw insertError;
        }

        // 4. Responder al cliente que el background ha iniciado
        return new Response(JSON.stringify({ status: "BACKGROUND_QUEUED", message: "Job encolado correctamente." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("[ORCHESTRATOR] Fatal Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
});
```
