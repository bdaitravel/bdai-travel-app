// scripts/triggerToursPipeline.ts
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

async function trigger(functionName: string, city: string, country: string, language: string, slug: string) {
  console.log(`\n🚀 Invocando ${functionName} para: ${city} (${language}) [slug: ${slug}]...`);
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { city, country, language, slug }
    });
    
    if (error) {
      console.error(`❌ Error en invocación:`, error.message);
    } else {
      console.log(`✅ Respuesta exitosa de ${functionName}:`, JSON.stringify(data));
      return true;
    }
  } catch (err: any) {
    console.error(`❌ Excepción:`, err);
  }
  return false;
}

async function run() {
  const name = 'tour-orchestrator';
  await trigger(name, 'Logroño', 'Spain', 'en', 'logrono_spain');
}

run();
