// services/supabase/edge-functions/tour-orchestrator-02.md
// Versión -02 del orquestador que activa el pipeline de GCP (Service Account)

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
            return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400, headers: corsHeaders });
        }

        const slug = rawSlug || normalizeKey(city, country);
        const lang = language.toLowerCase();

        console.log(`[ORCHESTRATOR-02] Encolando ${slug} / ${lang} para GCP...`);

        // Marcar como generando
        await supabaseClient.from('tours_cache').upsert({
            city: slug,
            language: lang,
            status: 'GENERATING',
            updated_at: new Date().toISOString()
        }, { onConflict: 'city, language' });

        // INSERT con status especial PENDING_AI_02
        const { error: insertError } = await supabaseClient.from('generation_jobs').insert({
            city_slug: slug,
            language: lang,
            status: 'PENDING_AI_02' 
        });

        if (insertError) throw insertError;

        return new Response(JSON.stringify({ status: 'QUEUED_GCP', slug }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
