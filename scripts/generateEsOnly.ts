import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// ── Environment ───────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing env vars. Required:');
  if (!SUPABASE_URL) console.error('   VITE_SUPABASE_URL (or SUPABASE_URL)');
  if (!SERVICE_KEY)  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db   = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const edge = createClient(SUPABASE_URL, ANON_KEY || SERVICE_KEY, { auth: { persistSession: false } });

// ── Utilities ─────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const log = (label: string, msg: string) => console.log(`[${label.padEnd(20).slice(0, 20)}] ${msg}`);

const normalizeKey = (city: string, country: string): string => {
  const clean = (s: string) =>
    s.toLowerCase()
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
     .replace(/[\s\-\/\\]+/g, '_')
     .replace(/[^a-z0-9_]/g, '')
     .trim();
  const c  = clean(city);
  const co = clean(country);
  if (!co || co === 'cache') return c;
  if (c.endsWith(`_${co}`)) return c;
  return `${c}_${co}`;
};

// ── Main Logic ────────────────────────────────────────────────────────────────

async function generateSpanishTourOnly(cityName: string, country: string) {
  const slug = normalizeKey(cityName, country);
  log(cityName, `🚀 Iniciando generación (ES) para ${slug}...`);

  // Borrar cualquier estado anterior fallido o colgado (opcional pero recomendado)
  await db.from('tours_cache').delete().eq('city', slug).eq('language', 'es');
  await db.from('generation_jobs').delete().eq('city_slug', slug);

  // Llamar al orquestador nuevo (-02) - NOTA: incluimos la 'r' extra del typo en el nombre de la función en Supabase
  const { error } = await edge.functions.invoke('tour-orchestratror-02', {
    body: { city: cityName, country, language: 'es', slug }
  });

  if (error) {
    log(cityName, `❌ Error llamando al orquestador: ${error.message}`);
    console.error(error);
    return;
  }

  // Polling (esperar a que el worker GIS marque el tour como READY)
  log(cityName, `⏳ Esperando a que termine el proceso en Supabase (max 15 min)...`);
  for (let i = 1; i <= 60; i++) {
    await sleep(15000); // 15 segundos entre cada comprobación
    
    const { data } = await db
      .from('tours_cache')
      .select('status, error_message')
      .eq('city', slug)
      .eq('language', 'es')
      .maybeSingle();

    const status = data?.status || 'desconocido';
    log(cityName, `   ... intento ${i}/60: estado actual = ${status}`);

    if (status === 'READY') {
      log(cityName, `✅ ¡Generación completada con éxito!`);
      return;
    }
    
    if (status === 'ERROR') {
      log(cityName, `❌ La generación falló. Razón: ${data?.error_message || 'Desconocida'}`);
      return;
    }
  }

  log(cityName, `⏰ Tiempo de espera agotado (15 min).`);
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`  BDAI Tour Generator (Solo ES, Sin Audio)`);
  console.log(`======================================================\n`);

  const cities = [
    { city: 'Soria', country: 'Spain' },
    { city: 'Vitoria-Gasteiz', country: 'Spain' },
  ];

  for (const c of cities) {
    console.log(`\n── Procesando: ${c.city}, ${c.country} ──`);
    await generateSpanishTourOnly(c.city, c.country);
  }
  
  console.log(`\n======================================================`);
  console.log(`  Proceso Finalizado`);
  console.log(`======================================================\n`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
