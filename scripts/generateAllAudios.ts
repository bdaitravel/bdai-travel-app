// scripts/generateAllAudios.ts
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const targets = [
  { city: 'logrono_spain', languages: ['en'] },
  { city: 'soria_spain', languages: ['en'] },
  { city: 'vitoria_gasteiz_spain', languages: ['en', 'eu'] }
];

async function generateAudiosForTarget(city: string, lang: string) {
  console.log(`\n🎙️  Buscando paradas para ${city} [${lang}]...`);
  
  // Buscar en tours_cache
  const { data: record, error } = await supabase
    .from('tours_cache')
    .select('data')
    .eq('city', city)
    .eq('language', lang)
    .eq('status', 'READY')
    .maybeSingle();
    
  if (error || !record || !record.data) {
    console.error(`⚠️  No se encontró el tour base en tours_cache para ${city} [${lang}].`);
    return;
  }
  
  const tours: any[] = record.data;
  const stops = tours.flatMap(t => t.stops).filter(s => s.description && s.description.trim() !== '');
  
  console.log(`✅ Encontradas ${stops.length} paradas. Generando audios...`);
  
  let ok = 0;
  let cached = 0;
  let errors = 0;
  
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const cleanText = stop.description.replace(/[*_~`]/g, '').trim();
    
    try {
      console.log(`   [${i + 1}/${stops.length}] Procesando "${stop.name}"...`);
      
      const { data, error: invokeError } = await supabase.functions.invoke('generate-audio-gcp', {
        body: { text: cleanText, language: lang, city: city }
      });
      
      if (invokeError) {
        throw new Error(invokeError.message || JSON.stringify(invokeError));
      }
      
      if (data?.url) {
        ok++;
      } else {
        throw new Error("No se devolvió la URL del audio.");
      }
    } catch (e: any) {
      console.error(`   ⚠️  Error en "${stop.name}":`, e.message || e);
      errors++;
    }
    
    await sleep(500); // Respetar rate limits de Gemini
  }
  
  console.log(`📊 Ciudad ${city} [${lang}] finalizada: ${ok} exitosos, ${errors} errores.`);
}

async function run() {
  console.log("🚀 Iniciando Generación de Audios para Ciudades Específicas...");
  
  for (const target of targets) {
    for (const lang of target.languages) {
      await generateAudiosForTarget(target.city, lang);
      await sleep(2000); // Cooldown entre idiomas
    }
  }
  
  console.log("\n🏁 Proceso de generación de audios completado.");
}

run();
