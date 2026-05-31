import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Support both .env and .env.local
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌  Missing env vars. Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Client for edge function invocation and DB reads
const db = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY, { auth: { persistSession: false } });
const edge = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

interface Stop {
  id: string;
  name: string;
  description: string;
  [key: string]: unknown;
}

interface Tour {
  id: string;
  stops: Stop[];
  [key: string]: unknown;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function processCity(city: string) {
  console.log(`\n=== Procesando ciudad: ${city} ===`);
  
  // Buscar los tours en español e inglés
  const { data: records, error } = await db
    .from('tours_cache')
    .select('language, data')
    .eq('city', city);

  if (error) {
    console.error(`Error buscando tours para ${city}:`, error.message);
    return;
  }

  if (!records || records.length === 0) {
    console.log(`No se encontraron tours para ${city}.`);
    return;
  }

  for (const record of records) {
    const lang = record.language;
    const tours: Tour[] = record.data;
    const stops = tours.flatMap(t => t.stops).filter(s => s.description && s.description.trim() !== '');
    
    console.log(`\nGenerando audio para ${city} (${lang}) - ${stops.length} paradas...`);
    
    let ok = 0;
    let cached = 0;
    let errors = 0;

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      try {
        console.log(`[${i+1}/${stops.length}] ${stop.name}...`);
        
        const { data, error } = await edge.functions.invoke('generate-audio-gcp', {
          body: { text: stop.description, language: lang, city: city }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.url) {
          ok++;
        }
      } catch (e: any) {
        console.error(`  ⚠️ Error al generar audio para "${stop.name}":`, e.message);
        errors++;
      }
      
      // Respetar rate limits de Gemini
      await sleep(500); 
    }

    console.log(`✅ Finalizado ${city} (${lang}): ${ok} completados, ${errors} errores.`);
  }
}

async function main() {
  // Buscar todas las ciudades
  const { data: allTours } = await db.from('tours_cache').select('city');
  if (!allTours) {
    console.error("No se pudieron obtener las ciudades de la base de datos.");
    return;
  }
  
  const uniqueCities = Array.from(new Set(allTours.map((t: any) => t.city)));
  console.log("Ciudades en la base de datos:", uniqueCities);

  const targetCities = uniqueCities.filter(c => c.includes('barcelona') || c.includes('sevilla') || c.includes('valencia'));

  if (targetCities.length === 0) {
    console.log("No se encontraron tours para Barcelona, Sevilla o Valencia.");
    return;
  }

  for (const city of targetCities) {
    await processCity(city);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
