// scripts/testAudioGenerator.ts
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

async function test(functionName: string) {
  console.log(`\n🎙️ Probando ${functionName} con texto de prueba...`);
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { text: "Esto es una prueba de audio muy corta.", language: "es", city: "test_city" }
    });
    
    if (error) {
      console.error(`❌ Error en ${functionName}:`, error.message || error);
    } else {
      console.log(`✅ ${functionName} funcionó correctamente! URL de audio:`, data?.url || JSON.stringify(data));
    }
  } catch (err: any) {
    console.error(`❌ Excepción en ${functionName}:`, err.message || err);
  }
}

async function run() {
  await test('generate-audio-gcp');
  await test('generate-audio-dai');
}

run();
