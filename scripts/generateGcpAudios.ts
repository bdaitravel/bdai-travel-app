/**
 * scripts/generateGcpAudios.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Generador de audios para BDAI usando GCP TTS via edge function.
 *
 * FLUJO:
 *   Fase 0 — SYNC:     Lee tours_cache completo, cruza con audio_cache,
 *                       upserta estado en audio_inventory e imprime tabla.
 *   Fase 1 — FILTER:   Obtiene las entradas city+lang con has_audio = false.
 *   Fase 2 — GENERATE: Para cada pendiente, genera audios stop por stop
 *                       (la edge function devuelve caché si el hash ya existe).
 *   Fase 3 — UPDATE:   Actualiza audio_inventory con el resultado.
 *
 * USO:
 *   npx tsx scripts/generateGcpAudios.ts            # genera pendientes
 *   npx tsx scripts/generateGcpAudios.ts --dry-run  # solo muestra tabla
 *   npx tsx scripts/generateGcpAudios.ts --city sevilla_spain  # una ciudad
 *
 * VARIABLES DE ENTORNO (en .env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY   (para invocar edge functions)
 *   SUPABASE_SERVICE_ROLE_KEY (para leer/escribir tours_cache y audio_inventory)
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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
  console.error('❌  Faltan variables de entorno. Necesarias: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// db → service role para leer/escribir tours_cache y audio_inventory
// edge → anon key para invocar edge functions (requiere autenticación cliente)
const db   = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY, { auth: { persistSession: false } });
const edge = createClient(SUPABASE_URL, ANON_KEY,                { auth: { persistSession: false } });

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const cityArg  = args.includes('--city') ? args[args.indexOf('--city') + 1] : null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

interface Stop {
  id: string;
  name: string;
  description: string;
  [k: string]: unknown;
}

interface Tour {
  id: string;
  stops: Stop[];
  [k: string]: unknown;
}

// ─── processCity ──────────────────────────────────────────────────────────────

/**
 * Genera los audios de una ciudad+idioma.
 * La edge function hace caché interna por text_hash+language, así que
 * si un audio ya existe simplemente lo devuelve sin coste de TTS.
 *
 * @returns [audiosOk, totalStops]
 */
async function processCity(citySlug: string, lang: string): Promise<[number, number]> {
  console.log(`\n  ▶  ${citySlug} [${lang}]`);

  const { data: record, error } = await db
    .from('tours_cache')
    .select('data')
    .eq('city', citySlug)
    .eq('language', lang)
    .eq('status', 'READY')
    .maybeSingle();

  if (error || !record?.data) {
    console.log(`     ⚠️  No se encontró el tour en tours_cache.`);
    return [0, 0];
  }

  const tours: Tour[] = record.data;
  const stops = tours
    .flatMap(t => t.stops)
    .filter(s => s.description && s.description.trim() !== '');

  const total = stops.length;
  if (total === 0) {
    console.log(`     ⚠️  El tour no tiene paradas con descripción.`);
    return [0, 0];
  }

  console.log(`     ${total} paradas a procesar...`);

  let ok      = 0;
  let errors  = 0;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const label = `[${String(i + 1).padStart(2)}/${total}] ${stop.name}`;

    try {
      const { data, error: invokeErr } = await edge.functions.invoke('generate-audio-gcp', {
        body: { text: stop.description, language: lang, city: citySlug },
      });

      if (invokeErr) throw new Error(invokeErr.message || JSON.stringify(invokeErr));

      if (data?.url) {
        console.log(`     ✅ ${label}`);
        ok++;
      } else {
        throw new Error('La edge function no devolvió URL de audio.');
      }
    } catch (e: any) {
      console.error(`     ❌ ${label} — ${e.message}`);
      errors++;
    }

    // Respetar rate limits: 500ms entre paradas, 2s cada 10 paradas
    await sleep(i > 0 && i % 10 === 0 ? 2000 : 500);
  }

  console.log(`     📊 Resultado: ${ok} ✅  ${errors} ❌  de ${total} paradas.`);
  return [ok, total];
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  BDAI — Generador de Audios GCP                              ');
  if (DRY_RUN)  console.log('  🔍  MODO: DRY RUN (solo muestra tabla, no genera)');
  if (cityArg)  console.log(`  🎯  MODO: Ciudad única — ${cityArg}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── FASE 0: SYNC ────────────────────────────────────────────────────────────
  let inventory: InventoryRow[];
  try {
    inventory = await syncInventory(db);
  } catch (e: any) {
    // Si la tabla no existe aún, informar al usuario con instrucción clara
    if (e.message?.includes('audio_inventory') || e.message?.includes('relation')) {
      console.error('\n❌  La tabla audio_inventory no existe todavía en Supabase.');
      console.error('   Ejecuta primero el SQL en Supabase Dashboard → SQL Editor:');
      console.error('   scripts/sql-create-audio-inventory.sql\n');
    } else {
      console.error('\n❌  Error en SYNC:', e.message);
    }
    process.exit(1);
  }

  printInventoryTable(inventory);

  if (DRY_RUN) {
    console.log('🔍  Dry run completado. No se ha generado ningún audio.');
    return;
  }

  // ── FASE 1: FILTER ──────────────────────────────────────────────────────────
  let pending = getPendingCities(inventory);

  // Si se especificó una ciudad concreta, filtrar solo esa
  if (cityArg) {
    pending = pending.filter(r => r.city_slug === cityArg);
    if (pending.length === 0) {
      const inInventory = inventory.find(r => r.city_slug === cityArg);
      if (inInventory?.has_audio) {
        console.log(`✅  ${cityArg} ya tiene todos los audios generados. Nada que hacer.`);
      } else if (!inInventory) {
        console.log(`⚠️  ${cityArg} no está en el inventario (¿existe en tours_cache?).`);
      }
      return;
    }
  }

  if (pending.length === 0) {
    console.log('🎉  Todos los tours ya tienen audios generados. Nada que hacer.');
    return;
  }

  console.log(`\n🎙️  Iniciando generación para ${pending.length} entradas pendientes...`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── FASE 2 + 3: GENERATE & UPDATE ─────────────────────────────────────────
  let globalOk    = 0;
  let globalFail  = 0;

  for (let i = 0; i < pending.length; i++) {
    const { city_slug, language } = pending[i];
    console.log(`\n[${i + 1}/${pending.length}] Procesando ${city_slug} [${language}]...`);

    const [audiosOk, totalStops] = await processCity(city_slug, language);
    await markGenerated(db, city_slug, language, audiosOk, totalStops);

    if (audiosOk >= totalStops && totalStops > 0) {
      globalOk++;
    } else {
      globalFail++;
    }

    // Cooldown entre ciudades para no saturar la edge function
    if (i < pending.length - 1) await sleep(3000);
  }

  // ── RESUMEN FINAL ───────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏁  Generación completada.`);
  console.log(`   ✅  Ciudades completadas: ${globalOk}`);
  console.log(`   ⚠️  Con errores parciales:  ${globalFail}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(e => { console.error('Error fatal:', e); process.exit(1); });
