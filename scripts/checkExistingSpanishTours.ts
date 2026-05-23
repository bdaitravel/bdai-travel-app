// scripts/checkExistingSpanishTours.ts
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const cities = ['logrono_spain', 'vitoria_spain', 'soria_spain'];
  
  console.log("🔍 Consultando estado de tours base en Español...");
  
  for (const city of cities) {
    const { data, error } = await supabase
      .from('tours_cache')
      .select('city, language, status, updated_at')
      .eq('city', city)
      .eq('language', 'es')
      .maybeSingle();
      
    if (error) {
      console.error(`❌ Error para ${city}:`, error.message);
    } else if (data) {
      console.log(`✅ ${city}: Encontrado. Idioma: ${data.language}, Status: ${data.status}, Actualizado: ${data.updated_at}`);
    } else {
      console.log(`⚠️ ${city}: No existe en la base de datos en Español (es).`);
    }
  }
}

check();
