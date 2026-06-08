/**
 * scripts/generateGcpAudiosdia.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Generador DIARIO de audios para BDAI respetando el límite gratuito de GCP.
 * 
 * LÍMITE CONFIGURADO: 27.000 caracteres/día (aprox. 810.000 al mes).
 * Gratuito en GCP: 1.000.000 (Neural) / 4.000.000 (Standard).
 *
 * ORDEN DE PRIORIDAD:
 *   1. es, 2. en, 3. ca, 4. fr, 5. resto
 *
 * USO:
 *   npx tsx scripts/generateGcpAudiosdia.ts
 *   npx tsx scripts/generateGcpAudiosdia.ts --dry-run
 */

import * as dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import {
  syncInventory,
  getPendingCities,
  markGenerated,
  printInventoryTable,
  InventoryRow,
} from './lib/audioInventory';

// ─── Config ───────────────────────────────────────────────────────────────────

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL  || process.env.SUPABASE_URL  || '';
const ANON_KEY      = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Faltan variables de entorno.');
  process.exit(1);
}

const db   = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY, { auth: { persistSession: false } });
const edge = createClient(SUPABASE_URL, ANON_KEY,                { auth: { persistSession: false } });

// ─── LÍMITES Y PRIORIDADES ───────────────────────────────────────────────────

const DAILY_LIMIT_CHARS = 29000;
const LANG_PRIORITY = ['es', 'en', 'ca', 'fr'];

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function computeTextHash(text: string): string {
  const clean = text.replace(/[*_~`]/g, '').trim();
  return crypto.createHash('sha256').update(clean, 'utf8').digest('hex');
}

interface Stop {
  id: string;
  name: string;
  description: string;
}

interface Tour {
  stops: Stop[];
}

// ─── processCity ──────────────────────────────────────────────────────────────

let globalCharsSynthesized = 0;

async function processCity(citySlug: string, lang: string): Promise<[number, number]> {
  console.log(`\n  ▶  ${citySlug} [${lang}]`);

  // Obtener el tour
  const { data: record, error } = await db
    .from('tours_cache')
    .select('data')
    .eq('city', citySlug)
    .eq('language', lang)
    .eq('status', 'READY')
    .maybeSingle();

  if (error || !record?.data) {
    console.log(`     ⚠️ No se encontró el tour.`);
    return [0, 0];
  }

  const tours: Tour[] = record.data;
  const stops = tours
    .flatMap(t => t.stops)
    .filter(s => s.description && s.description.trim() !== '');

  const total = stops.length;
  if (total === 0) return [0, 0];

  console.log(`     ${total} paradas detectadas. Revisando caché...`);

  // Obtener qué hashes ya existen en audio_cache para este idioma
  const hashes = stops.map(s => ({ hash: computeTextHash(s.description), stop: s }));
  const { data: existing } = await db
    .from('audio_cache')
    .select('text_hash')
    .eq('language', lang)
    .in('text_hash', hashes.map(h => h.hash));

  const existingHashes = new Set(existing?.map(e => e.text_hash) || []);
  
  let ok = existingHashes.size;
  let errors = 0;

  for (let i = 0; i < hashes.length; i++) {
    const { hash, stop } = hashes[i];
    const label = `[${String(i + 1).padStart(2)}/${total}] ${stop.name}`;

    if (existingHashes.has(hash)) {
      // Ya está en caché, no consume cuota GCP
      continue;
    }

    // Comprobar límite
    const charCount = stop.description.length;
    if (globalCharsSynthesized + charCount > DAILY_LIMIT_CHARS) {
      console.log(`     🛑 Límite de 29k caracteres alcanzado. Saltando el resto.`);
      return [ok, total];
    }

    if (DRY_RUN) {
      console.log(`     🔍 (Dry Run) Sintetizaría: ${charCount} chars — ${stop.name}`);
      globalCharsSynthesized += charCount;
      ok++;
      continue;
    }

    try {
      const { data, error: invokeErr } = await edge.functions.invoke('generate-audio-gcp', {
        body: { text: stop.description, language: lang, city: citySlug },
      });

      if (invokeErr) throw new Error(invokeErr.message);

      if (data?.url) {
        console.log(`     ✅ ${label} (+${charCount} chars)`);
        globalCharsSynthesized += charCount;
        ok++;
      } else {
        throw new Error('Sin URL de audio');
      }
    } catch (e: any) {
      console.error(`     ❌ ${label} — ${e.message}`);
      errors++;
    }

    await sleep(500);
  }

  console.log(`     📊 Ciudad finalizada: ${ok}/${total} audios listos. Cuota hoy: ${globalCharsSynthesized} chars.`);
  return [ok, total];
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  BDAI — Generador de Audios DIARIO (Límite: 29.000 chars)    ');
  if (DRY_RUN) console.log('  🔍 MODO: DRY RUN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Sincronizar inventario
  let inventory: InventoryRow[];
  try {
    inventory = await syncInventory(db);
  } catch (e: any) {
    console.error('❌ Error synchronizing inventory:', e.message);
    process.exit(1);
  }
  
  printInventoryTable(inventory);

  // Filtrar pendientes y ordenar por prioridad
  let pending = getPendingCities(inventory);
  
  pending.sort((a, b) => {
    const idxA = LANG_PRIORITY.indexOf(a.language);
    const idxB = LANG_PRIORITY.indexOf(b.language);
    
    // Si ambos están en la lista de prioridad, respetar el orden de la lista
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    // El que tiene prioridad va primero
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    // El resto por orden alfabético de ciudad
    return a.city_slug.localeCompare(b.city_slug);
  });

  if (pending.length === 0) {
    console.log('🎉 Todo al día. Nada que generar.');
    return;
  }

  console.log(`🎙️  Iniciando generación para ${pending.length} entradas pendientes...`);

  for (let i = 0; i < pending.length; i++) {
    if (globalCharsSynthesized >= DAILY_LIMIT_CHARS) {
      console.log('\n🛑 Cuota diaria completada. Deteniendo proceso.');
      break;
    }

    const { city_slug, language } = pending[i];
    console.log(`\n[${i + 1}/${pending.length}] ${city_slug} [${language}]`);

    const [audiosOk, totalStops] = await processCity(city_slug, language);
    
    if (!DRY_RUN) {
      await markGenerated(db, city_slug, language, audiosOk, totalStops);
    }

    if (i < pending.length - 1) await sleep(2000);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏁 Resumen del día:`);
  console.log(`   🔸 Caracteres sintetizados: ${globalCharsSynthesized} / ${DAILY_LIMIT_CHARS}`);
  console.log(`   🔸 % de cuota diaria: ${((globalCharsSynthesized / DAILY_LIMIT_CHARS) * 100).toFixed(1)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(e => { console.error('Error fatal:', e); process.exit(1); });
