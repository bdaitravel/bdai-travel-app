// services/supabase/tour-worker-ai-02.md
// Versión migrada a GCP Service Account (OAuth2)
// Esta función escucha el estado 'PENDING_AI_02' para no interferir con la original.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { importPKCS8, SignJWT } from "npm:jose@5.2.0";

const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

const supabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

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

const SYSTEM_INSTRUCTION = `You are a highly intelligent, elegant, and SARCASTIC **FEMALE** AI.
You female. Speak in the first person ("Yo", "me he fijado"). Never use the word "guía".
Your tone is witty, sophisticated, and slightly mocking of typical tourists.
TRUTH BEFORE STYLE: Always confirm a place exists before describing it.`;

const generateTourPrompt = (city: string, country: string, language: string, coordsAnchor: string, catalogText: string): string => {
    return `Generate 2 thematic tours for ${city}, ${country} in ${language}.
${coordsAnchor}
${catalogText}
Each tour must target 12 stops. Return ONLY a JSON array of tour objects.`;
};

const getCityInfo = async (city: string, country: string) => {
    try {
        const query = encodeURIComponent(`${city}, ${country}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                return { lat, lon, radiusKm: 5, bbox: {
                    south: parseFloat(data[0].boundingbox[0]),
                    north: parseFloat(data[0].boundingbox[1]),
                    west: parseFloat(data[0].boundingbox[2]),
                    east: parseFloat(data[0].boundingbox[3])
                }};
            }
        }
    } catch (e) { console.warn('getCityInfo failed:', e); }
    return null;
};

const tryExtractTours = (text: string): any[] => {
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    try { return JSON.parse(clean); } catch (_) { return []; }
};

serve(async (req) => {
    try {
        const secret = req.headers.get('x-webhook-secret');
        if (secret !== Deno.env.get('WEBHOOK_SECRET')) return new Response('Unauthorized', { status: 401 });

        const payload = await req.json();
        // Filtramos para que solo actúe en INSERT de PENDING_AI_02
        if (payload.record?.status !== 'PENDING_AI_02') return new Response('Ignored status');

        const job = payload.record;
        const parts = job.city_slug.split('_');
        const city = parts[0];
        const country = parts.slice(1).join('_');

        console.log(`[AI-02] Procesando job ${job.id}: ${job.city_slug}`);

        const cityInfo = await getCityInfo(city, country);
        const prompt = generateTourPrompt(city, country, job.language, `Anchor: ${cityInfo?.lat}, ${cityInfo?.lon}`, "");

        const accessToken = await getGcpAccessToken();
        const modelName = "gemini-2.5-flash"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

        const gRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${accessToken}`,
                'Referer': 'https://www.bdai.travel/' 
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                generationConfig: { temperature: 0.7, topP: 1, topK: 1 }
            })
        });

        if (!gRes.ok) throw new Error(`Gemini API ${gRes.status}`);

        const resJson = await gRes.json();
        const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const finalTours = tryExtractTours(rawText);

        // Actualizamos a PENDING_GIS para que se active el GIS original
        await supabaseClient.from('generation_jobs').update({
            city_info: cityInfo,
            raw_ai_data: finalTours,
            status: 'PENDING_GIS',
            updated_at: new Date().toISOString()
        }).eq('id', job.id);

        console.log(`[AI-02] Job ${job.id} pasado a PENDING_GIS.`);
        return new Response('OK');

    } catch (e: any) {
        console.error('[AI-02] Fatal Error:', e);
        return new Response('Error', { status: 500 });
    }
});
