// scripts/translateAllSpecificCities.ts
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { importPKCS8, SignJWT } from 'jose';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ── GCP Service Account Auth ──────────────────────────────────────────────
async function getGcpAccessToken(): Promise<string> {
  const saPath = path.resolve('../tmp-gdrive-to-m365-f40632c4812f.json');
  if (!fs.existsSync(saPath)) {
    throw new Error(`Falta el archivo de Service Account de GCP en: ${saPath}`);
  }
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
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
  
  const data: any = await response.json();
  if (!response.ok) {
    throw new Error(`Error auth GCP: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

// ── Translation using Gemini 2.5 Flash ─────────────────────────────────────
async function translateTours(tours: any[], targetLang: string, accessToken: string): Promise<any[]> {
  const isEn = targetLang === 'en';
  const langName = isEn ? 'English' : 'Basque (Euskera)';
  
  console.log(`🌐 Traduciendo ${tours.length} tours al ${langName}...`);
  
  // Enviar solo campos traducibles para minimizar consumo de tokens y asegurar formato
  const slim = tours.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    theme: t.theme,
    stops: t.stops.map((s: any) => ({ id: s.id, name: s.name, description: s.description }))
  }));
  
  const prompt = `Translate the following JSON array of travel tours from Spanish to ${langName}.
Return ONLY a valid JSON array with the exact same structure.

CRITICAL RULES:
1. Maintain the EXACT same JSON structure and keys ("id", "title", "description", "theme", "stops", "name").
2. DO NOT translate place names (e.g., "Plaza Mayor" must remain "Plaza Mayor").
3. Translate: "title", "description", "theme" of the tour, and the "name" and "description" of each stop.
4. Replace "_es_" with "_${targetLang}_" in all id strings (e.g. "tour_es_0" becomes "tour_${targetLang}_0").
5. Preserve the EXACT personality of the original Spanish narrator: a highly intelligent, sophisticated, and SARCASTIC female AI speaking in the first person ("I" in English, first person feminine in Basque where applicable). Adapt the sarcasm, wit, and cultural humor naturally to ${langName}.
6. Return ONLY the final translated JSON array, without any markdown code blocks, explanations, or conversational preamble.

JSON to translate:
${JSON.stringify(slim)}`;

  const modelName = "gemini-2.5-flash"; 
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${accessToken}`,
      'Referer': 'https://www.bdai.travel/' 
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: "You are a professional travel copywriter and translator specializing in witty, premium, and sarcastic content." }] },
      generationConfig: { temperature: 0.2, topP: 1, topK: 1 }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error en API de Gemini: ${res.status} - ${errText}`);
  }

  const resJson: any = await res.json();
  const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  
  // Limpieza robusta de formato markdown de Gemini
  const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  let translatedSlim: any[];
  try {
    translatedSlim = JSON.parse(clean);
  } catch (err: any) {
    console.error("❌ Falló el parseo de JSON traducido. Respuesta cruda:", rawText);
    throw err;
  }
  
  // Mezclar traducción de vuelta en el tour completo conservando coordenadas, polilíneas, etc.
  return tours.map((tour, i) => {
    const tr = translatedSlim[i];
    if (!tr) return tour;
    
    return {
      ...tour,
      id: tr.id || tour.id.replace(/_es_/g, `_${targetLang}_`),
      title: tr.title || tour.title,
      description: tr.description || tour.description,
      theme: tr.theme || tour.theme,
      stops: tour.stops.map((stop: any, j: number) => {
        const trStop = tr.stops?.[j];
        return {
          ...stop,
          id: trStop?.id || stop.id.replace(/_es_/g, `_${targetLang}_`),
          name: trStop?.name || stop.name,
          description: trStop?.description || stop.description
        };
      })
    };
  });
}

// ── Main Process ───────────────────────────────────────────────────────────
async function run() {
  console.log("🚀 Iniciando Pipeline Maestro de Traducción via GCP Service Account...");
  const accessToken = await getGcpAccessToken();
  console.log("✅ Token OAuth2 de GCP obtenido correctamente.");

  const translations = [
    { city: 'logrono_spain', lang: 'en' },
    { city: 'soria_spain', lang: 'en' },
    { city: 'vitoria_gasteiz_spain', lang: 'en' },
    { city: 'vitoria_gasteiz_spain', lang: 'eu' }
  ];

  for (const item of translations) {
    console.log(`\n────────────────────────────────────────────────────────────────`);
    console.log(`📋 Procesando: ${item.city} a [${item.lang}]`);
    
    // 1. Obtener tour base
    const { data: baseTour, error: fetchError } = await supabase
      .from('tours_cache')
      .select('*')
      .eq('city', item.city)
      .eq('language', 'es')
      .eq('status', 'READY')
      .maybeSingle();

    if (fetchError || !baseTour) {
      console.error(`❌ Error o tour base en Español no encontrado para ${item.city}.`);
      continue;
    }

    console.log(`✅ Tour base en Español encontrado (${baseTour.data.length} tours).`);

    try {
      // 2. Traducir
      const translatedData = await translateTours(baseTour.data, item.lang, accessToken);
      
      // 3. Guardar en tours_cache
      const { error: upsertError } = await supabase
        .from('tours_cache')
        .upsert({
          city: item.city,
          language: item.lang,
          status: 'READY',
          data: translatedData,
          route_polylines: baseTour.route_polylines,
          updated_at: new Date().toISOString()
        }, { onConflict: 'city, language' });

      if (upsertError) {
        console.error(`❌ Error guardando en base de datos:`, upsertError.message);
      } else {
        console.log(`🎉 Guardado con éxito en tours_cache (${item.city} [${item.lang}]) como READY!`);
      }
    } catch (err: any) {
      console.error(`❌ Error traduciendo/guardando ${item.city} [${item.lang}]:`, err.message || err);
    }
    
    await sleep(2000); // Evitar rate limits
  }

  console.log("\n🏁 Proceso de traducción finalizado con éxito.");
}

run();
