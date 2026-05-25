/**
 * generateEsOnly.ts — Pre-seeder de tours en español
 *
 * Llama a tour-orchestrator-02 (edge function) por cada ciudad y espera
 * hasta que el pipeline completo termine (AI → GIS → tours_cache READY).
 * La distancia, duración, TSP y verificación de coordenadas las hace el pipeline.
 *
 * Uso:
 *   npx tsx scripts/generateEsOnly.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// ── Environment ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan vars: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!ANON_KEY) {
  console.error('❌ Falta VITE_SUPABASE_ANON_KEY (necesario para llamar edge functions)');
  process.exit(1);
}

// service_role para leer tours_cache; anon para invocar edge functions
const db   = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const edge = createClient(SUPABASE_URL, ANON_KEY,    { auth: { persistSession: false } });

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const log = (city: string, msg: string) =>
  console.log(`[${city.padEnd(22).slice(0, 22)}] ${msg}`);

// ── normalizeKey — misma lógica que el cliente y el orchestrator ───────────────
const normalizeKey = (city: string, country: string): string => {
  const clean = (s: string) =>
    s.toLowerCase()
     .normalize('NFD').replace(/[̀-ͯ]/g, '')
     .replace(/[\s\-\/\\]+/g, '_')
     .replace(/[^a-z0-9_]/g, '')
     .trim();
  const c = clean(city), co = clean(country);
  if (!co || co === 'cache') return c;
  if (c.endsWith(`_${co}`)) return c;
  return `${c}_${co}`;
};

// ── Llamar a tour-orchestrator-02 y esperar hasta READY ───────────────────────
async function seedCity(cityName: string, country: string): Promise<boolean> {
  const slug = normalizeKey(cityName, country);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${cityName}, ${country}  [${slug}]`);
  console.log(`${'─'.repeat(60)}`);

  // Comprobar si ya existe y está READY
  const { data: existing } = await db
    .from('tours_cache')
    .select('status, updated_at')
    .eq('city', slug)
    .eq('language', 'es')
    .maybeSingle();

  if (existing?.status === 'READY') {
    log(cityName, '✅ Ya existe en tours_cache con status READY. Saltando.');
    return true;
  }

  // Invocar edge function tour-orchestrator-02
  log(cityName, '🚀 Invocando tour-orchestrator-02...');
  const { error } = await edge.functions.invoke('tour-orchestratror-02', {
    body: { city: cityName, country, language: 'es', slug }
  });

  if (error) {
    log(cityName, `❌ Error al invocar orchestrator: ${error.message}`);
    return false;
  }

  log(cityName, '⏳ Job encolado. Esperando pipeline (AI → GIS)...');

  // Poll cada 15s, máximo 20 min (80 intentos)
  for (let i = 1; i <= 80; i++) {
    await sleep(15_000);

    const { data } = await db
      .from('tours_cache')
      .select('status, data')
      .eq('city', slug)
      .eq('language', 'es')
      .maybeSingle();

    const status: string = data?.status ?? 'pending';
    log(cityName, `  Poll ${i.toString().padStart(2)}/80: ${status}`);

    if (status === 'READY') {
      const tours = data!.data as any[];
      log(cityName, `✅ Generado. ${tours.length} tour(s):`);
      tours.forEach((t, idx) => {
        const nStops = t.stops?.length ?? 0;
        log(cityName, `   Tour ${idx + 1}: "${t.title}" — ${nStops} paradas, ${t.distance || '?'}, ${t.duration || '?'}`);
      });
      return true;
    }

    if (status === 'ERROR') {
      log(cityName, '❌ Pipeline terminó con ERROR.');
      return false;
    }
  }

  log(cityName, '❌ Timeout (20 min). El pipeline no terminó a tiempo.');
  return false;
}

// ── Cities ──────────────────────────────────────────────────────────────────────
const cities: { city: string; country: string }[] = [
  { city: 'Vitoria-Gasteiz',    country: 'Spain' },
  { city: 'Aldeanueva de Ebro', country: 'Spain' },
  { city: 'Barcelona',          country: 'Spain' },
  { city: 'Viana',              country: 'Spain' },
  { city: 'San Sebastián',      country: 'Spain' },
  { city: 'Bilbao',             country: 'Spain' },
  { city: 'Palma de Mallorca',  country: 'Spain' },
];

// ── Run ─────────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  BDAI — generateEsOnly  →  tour-orchestrator-02');
  console.log(`  ${cities.length} ciudades a generar en español`);
  console.log('══════════════════════════════════════════════════════════════');

  const results: { city: string; ok: boolean }[] = [];

  for (const { city, country } of cities) {
    const ok = await seedCity(city, country);
    results.push({ city, ok });
    if (cities.indexOf({ city, country }) < cities.length - 1) {
      await sleep(3_000); // cooldown entre ciudades
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  Resumen:');
  results.forEach(r => console.log(`  ${r.ok ? '✅' : '❌'}  ${r.city}`));
  console.log('══════════════════════════════════════════════════════════════\n');
})().catch(e => { console.error(e); process.exit(1); });
