// scripts/translateSpecificCities.ts
// Script para traducir tours específicos existentes (Logroño, Vitoria, Soria)
// al inglés (y Vitoria al euskera) usando la API de Gemini 2.5 Flash.

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables desde .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY_02 || process.env.VITE_GEMINI_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("❌ Falta la API Key de Gemini en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function translateWithGemini(data: any, targetLang: string, targetLangName: string): Promise<any> {
  const prompt = `Translate the following JSON array of travel tours from Spanish to ${targetLangName} (which is the target language: ${targetLang}).
    
CRITICAL RULES:
1. Maintain the EXACT same JSON structure, keys (e.g. "title", "description", "stop_name", "stop_description"), coordinates, and values. Only translate the string values representing user-facing text.
2. DO NOT translate place names (e.g., "Plaza Mayor" must remain "Plaza Mayor", "Catedral" must remain "Catedral").
3. Preserve the EXACT personality of the original Spanish narrator: a highly intelligent, sophisticated, and SARCASTIC female AI speaking in the first person ("I"). Adapt the sarcasm, wordplay, and cultural context naturally to ${targetLangName}.
4. Return ONLY the final translated JSON array, without any markdown code blocks, explanations, or conversational preamble.

JSON to translate:
${JSON.stringify(data)}`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    })
  });
  
  if (!res.ok) {
    throw new Error(`Gemini API returned status ${res.status}: ${await res.text()}`);
  }
  
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

async function runTranslationPipeline() {
  console.log("🚀 Iniciando pipeline de traducción por lotes para Logroño, Vitoria y Soria...");
  
  const targets = [
    { city: 'logrono_spain', lang: 'en', name: 'English' },
    { city: 'vitoria_spain', lang: 'en', name: 'English' },
    { city: 'vitoria_spain', lang: 'eu', name: 'Basque (Euskera)' },
    { city: 'soria_spain', lang: 'en', name: 'English' }
  ];

  for (const target of targets) {
    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`[PROCESO] Traducción de ${target.city} a ${target.name} (${target.lang})...`);
    
    try {
      // 1. Buscar el tour en Español
      const { data: esTour, error: fetchError } = await supabase
        .from('tours_cache')
        .select('*')
        .eq('city', target.city)
        .eq('language', 'es')
        .eq('status', 'READY')
        .maybeSingle();
        
      if (fetchError) {
        console.error(`❌ Error consultando tour base en Español para ${target.city}:`, fetchError.message);
        continue;
      }
      
      if (!esTour) {
        console.warn(`⚠️ No se encontró el tour base en Español (READY) para la ciudad: ${target.city}`);
        continue;
      }
      
      console.log(`✅ Encontrado tour en Español para ${target.city} con ${esTour.data?.length || 0} tours.`);
      
      // 2. Ejecutar traducción con Gemini
      console.log(`🤖 Traduciendo con Gemini 2.5 Flash...`);
      const translatedData = await translateWithGemini(esTour.data, target.lang, target.name);
      
      if (!translatedData || !Array.isArray(translatedData) || translatedData.length === 0) {
        console.error(`❌ Error: El JSON traducido está vacío o no es un array válido.`);
        continue;
      }
      
      console.log(`✅ Traducción exitosa. Guardando en tours_cache...`);
      
      // 3. Guardar en tours_cache
      const { error: saveError } = await supabase
        .from('tours_cache')
        .upsert({
          city: target.city,
          language: target.lang,
          data: translatedData,
          route_polylines: esTour.route_polylines || {},
          status: 'READY',
          updated_at: new Date().toISOString()
        }, { onConflict: 'city, language' });
        
      if (saveError) {
        console.error(`❌ Error guardando traducción para ${target.city} (${target.lang}):`, saveError.message);
      } else {
        console.log(`🎉 ¡ÉXITO! Tour para ${target.city} en ${target.name} listo en la base de datos.`);
      }
      
      // Espera de seguridad para evitar tocar los límites de rate limit
      console.log("😴 Esperando 2 segundos...");
      await sleep(2000);
      
    } catch (err: any) {
      console.error(`❌ Error procesando ${target.city} a ${target.lang}:`, err.message || err);
    }
  }
  
  console.log(`\n🏁 Pipeline finalizado.`);
}

runTranslationPipeline();
