```javascript
// services/supabase/tour-orchestrator.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-orchestrator'

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

        console.log(`[ORCHESTRATOR] Encolando ${slug}...`);

        // 1. Marcar UI como GENERANDO (Rápido)
        await supabaseClient.from('tours_cache').upsert({
            city: slug,
            language: language.toLowerCase(),
            status: 'GENERATING',
            updated_at: new Date().toISOString()
        }, { onConflict: 'city, language' });

        // 2. Encolar trabajo en generation_jobs (Rápido)
        // NOTA: Ya no buscamos el catálogo aquí para evitar el timeout del navegador (EarlyDrop).
        // Lo buscará el tour-worker-ai.
        const { error: insertError } = await supabaseClient.from('generation_jobs').insert({
            city_slug: slug,
            language: language.toLowerCase(),
            status: 'PENDING_AI'
        });

        if (insertError) throw insertError;

        return new Response(JSON.stringify({ status: "BACKGROUND_QUEUED" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("[ORCHESTRATOR] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
});
```
