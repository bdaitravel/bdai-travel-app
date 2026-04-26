```javascript
// services/supabase/tour-worker-ai.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'tour-worker-ai'
// Despliegue: copiar este código en el editor del Dashboard de Supabase.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

serve(async (req) => {
    try {
        // SEGURIDAD: Verificar el Webhook Secret
        const secret = req.headers.get('x-webhook-secret');
        if (secret !== Deno.env.get('WEBHOOK_SECRET')) {
            console.error("[WORKER AI] Unauthorized webhook attempt");
            return new Response("Unauthorized", { status: 401 });
        }

        const payload = await req.json();
        
        // Supabase Database Webhooks envían { type, table, record, old_record }
        if (payload.table !== 'generation_jobs' || payload.type !== 'INSERT') {
            return new Response("Not an INSERT on generation_jobs", { status: 200 });
        }

        const job = payload.record;
        if (job.status !== 'PENDING_AI') {
            return new Response("Job is not PENDING_AI", { status: 200 });
        }

        console.log(`[WORKER AI] Iniciando generación para Job ${job.id} (${job.city_slug})`);

        // Extraer ciudad del slug (ej. "madrid_spain")
        const parts = job.city_slug.split('_');
        const city = parts[0];
        const country = parts[1] || "";
        const language = job.language;
        const catalog = job.overpass_catalog || [];

        // Preparar prompts y configuración de Gemini
        const systemInstruction = `You are DAI (Better Destinations AI), the ultimate, sophisticated, and slightly sarcastic female local expert for ${city}, ${country}.`;
        
        const catalogText = catalog.length > 0 
            ? catalog.map(p => `- ${p.name} (${p.type})`).join("\n") 
            : "No verified catalog available. Rely strictly on high-confidence knowledge.";

        const languageRules = language === 'es' ? 
            "MANDATORY: You must speak in PENINSULAR SPANISH from Spain (use 'vosotros', 'fijaos', 'chulo', 'guay', etc). Never use Latin American variations." : 
            `MANDATORY: Speak fluently and idiomatically in ${language}.`;

        const prompt = `
Generate EXACTLY 2 thematic tours for ${city}, ${country} in ${language}.

DEEP RETRIEVAL FOR 2 THEMATIC TOURS (CRITICAL):
Your PRIMARY GOAL is to generate exactly 2 thematic tours, each targeting exactly 12 stops (up to 24 verified stops total).
STOP COUNT TARGET (NON-NEGOTIABLE): BOTH tours MUST target exactly 12 stops each. DO NOT STOP AT 5 OR 6 STOPS. Use the massive catalog provided below to fill all 12 spots per tour.

GRACEFUL DEGRADATION (only when genuinely impossible to find enough verifiable places):
- If you cannot find at least 8 verifiable stops for EACH tour: generate EXACTLY 1 combined tour (aim for 12 stops, absolute minimum viable: 4 stops).
- If you can find 8 or more verifiable stops for EACH tour: generate EXACTLY 2 tours, each aiming for 12 stops.
STRICT LIMIT: NEVER generate a 3rd tour. You are strictly limited to a maximum of 2 tour objects.

DAI'S ABSOLUTE COMMANDS (PERSONA & STYLE):
- TONE: You are SARCASTIC, WITTY, and SOPHISTICATED.
- GENDER IDENTITY: You are FEMALE. Speak strictly in the first person ("yo", "he visto"). Never use the word "guía".
- TRUTH FIRST: Never invent a place. If it doesn't exist today, do not include it.
${languageRules}

TOUR PROGRESSION (THEMATIC ORDER IS MANDATORY):
Tour 1 — "Lo Esencial / The Essentials" (aim: 12 stops): The city's most famous stops — the landmarks, monuments, churches, plazas, streets and buildings that most visitors come specifically to see.
Tour 2 — "Alma y Curiosidades / Soul & Curiosities" (aim: 12 stops): A deliberate FUSION of authentic local heritage AND genuine curiosities (forgotten plaques, hidden histories, ancient cellars).

CATALOG OF VERIFIED PLACES:
${catalogText}

OUTPUT FORMAT:
Return ONLY valid JSON matching this structure:
[
  {
    "title": "Tour Title",
    "theme": "essentials", // or "curiosities" or "mixed"
    "duration": "2.5 horas",
    "stops": [
      {
        "name": "Exact local name of place",
        "description": "DAI's sarcastic, immersive explanation..."
      }
    ]
  }
]
`;

        // Llamada a Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Referer': 'https://www.bdai.travel/' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errBody}`);
        }

        const data = await response.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const rawTours = JSON.parse(rawContent);

        console.log(`[WORKER AI] Gemini devolvió ${rawTours.length} tours.`);

        // Actualizar el job para el siguiente paso
        const { error: updateError } = await supabaseClient.from('generation_jobs')
            .update({ 
                raw_ai_data: rawTours, 
                status: 'PENDING_GIS',
                updated_at: new Date().toISOString()
            })
            .eq('id', job.id);

        if (updateError) throw updateError;

        return new Response("AI Processing Completed", { status: 200 });

    } catch (error) {
        console.error("[WORKER AI] Fatal Error:", error);
        
        // Intentar actualizar el job a FAILED
        try {
            const payload = await req.json();
            if (payload && payload.record && payload.record.id) {
                await supabaseClient.from('generation_jobs')
                    .update({ status: 'FAILED', error_message: error.message })
                    .eq('id', payload.record.id);
            }
        } catch(e) {}

        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
```
