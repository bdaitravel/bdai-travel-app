// scripts/inspectCityTour.ts
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const citySlug = process.argv[2] || 'malaga_spain';

async function inspect() {
  console.log(`\n🔍 Inspeccionando tours de: ${citySlug}\n`);

  const { data: records, error } = await supabase
    .from('tours_cache')
    .select('language, status, data, updated_at')
    .eq('city', citySlug);

  if (error) { console.error('Error:', error.message); return; }
  if (!records?.length) { console.log('No hay registros para esta ciudad.'); return; }

  for (const rec of records) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  Idioma: ${rec.language} | Estado: ${rec.status} | Actualizado: ${rec.updated_at}`);
    console.log('═'.repeat(60));
    const tours: any[] = rec.data || [];
    console.log(`  Número de tours: ${tours.length}`);

    tours.forEach((tour: any, ti: number) => {
      const stops = tour.stops || [];
      console.log(`\n  Tour ${ti + 1}: "${tour.title}"`);
      console.log(`    Paradas: ${stops.length}`);
      stops.forEach((stop: any, si: number) => {
        const lat = stop.latitude ?? stop.lat ?? 'N/A';
        const lon = stop.longitude ?? stop.lon ?? 'N/A';
        const verified = stop.coordinatesVerified ? '✅' : '❓';
        console.log(`    [${si + 1}] ${verified} ${stop.name}`);
        console.log(`         Coords: (${lat}, ${lon})`);
      });
    });
  }
}

inspect();
