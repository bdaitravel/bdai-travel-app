// services/supabase/tour-orchestrator-02.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-orchestrator-02'

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// ── Normalizar slug (misma lógica que el cliente) ────────────────────────────
const normalizeKey = (city: string, country: string): string | null => {
    if (!city || !country) return null;
    const clean = (str: string) => str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s\-\/\\]+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .trim();
    const safeCity = clean(city);
    const safeCountry = clean(country);
    if (!safeCity) return null;
    if (!safeCountry || safeCountry === 'cache') return safeCity;
    if (safeCity.endsWith(`_${safeCountry}`)) return safeCity;
    return `${safeCity}_${safeCountry}`;
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const body = await req.json();
        const { city, country, language, slug: rawSlug } = body;

        if (!city || !country || !language) {
            return new Response(JSON.stringify({ error: 'Missing parameters: city, country, language' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const slug = rawSlug || normalizeKey(city, country);
        if (!slug) {
            return new Response(JSON.stringify({ error: 'Could not compute slug from city/country' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const lang = language.toLowerCase();
        console.log(`[ORCHESTRATOR] Encolando ${slug} / ${lang}...`);

        // 1. Verificar si ya hay un job reciente en vuelo para evitar duplicados
        const { data: existing } = await supabaseClient
            .from('tours_cache')
            .select('status, updated_at')
            .eq('city', slug)
            .eq('language', lang)
            .maybeSingle();

        if (existing?.status === 'GENERATING' && existing?.updated_at) {
            const ageMinutes = (Date.now() - new Date(existing.updated_at).getTime()) / 60000;
            if (ageMinutes < 10) {
                console.log(`[ORCHESTRATOR] ${slug} ya en generación (${ageMinutes.toFixed(1)} min). Ignorando duplicado.`);
                return new Response(JSON.stringify({ status: 'GENERATING' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            console.log(`[ORCHESTRATOR] Lock obsoleto (${ageMinutes.toFixed(1)} min). Reintentando.`);
        }

        // 2. Marcar UI como GENERANDO
        await supabaseClient.from('tours_cache').upsert({
            city: slug,
            language: lang,
            status: 'GENERATING',
            updated_at: new Date().toISOString()
        }, { onConflict: 'city, language' });

        // 3. Encolar trabajo en generation_jobs → dispara el Trigger AI Worker
        const { error: insertError } = await supabaseClient.from('generation_jobs').insert({
            city_slug: slug,
            language: lang,
            status: 'PENDING_AI_02',
            city_info: { city, country }
        });

        if (insertError) throw insertError;

        console.log(`[ORCHESTRATOR] Job encolado OK para ${slug} / ${lang}`);
        return new Response(JSON.stringify({ status: 'BACKGROUND_QUEUED' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[ORCHESTRATOR] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});