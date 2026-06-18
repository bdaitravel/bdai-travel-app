/**
 * scripts/generategcpallaudios.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Generador COMPLETO de audios para BDAI.
 *
 * MEJORAS vs generateGcpAudios.ts:
 *   ⚡  Fast-path para --city: salta el syncInventory global (lento).
 *   ⚡  Paradas en paralelo dentro de cada ciudad (STOP_CONCURRENCY).
 *   ⚡  Ciudades en paralelo cuando no se usa --city (CITY_CONCURRENCY).
 *   ⏱️  Timeout por llamada a la edge function (30 s por defecto).
 *   📣  Progreso en tiempo real: una línea por parada procesada.
 *   📊  Resumen final agrupado por tour.
 *
 * USO:
 *   npx tsx scripts/generategcpallaudios.ts                  # todos los pendientes
 *   npx tsx scripts/generategcpallaudios.ts --city sevilla_spain
 *   npx tsx scripts/generategcpallaudios.ts --dry-run
 *   npx tsx scripts/generategcpallaudios.ts --stop-concurrency 6
 *   npx tsx scripts/generategcpallaudios.ts --city-concurrency 4
 *
 * VARIABLES DE ENTORNO (en .env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY       (invocar edge functions)
 *   SUPABASE_SERVICE_ROLE_KEY    (leer/escribir tablas protegidas)
 */

import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  syncInventory,
  getPendingCities,
  markGenerated,
  InventoryRow,
} from './lib/audioInventory';

// ─── Entorno ──────────────────────────────────────────────────────────────────

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL  || process.env.SUPABASE_URL  || '';
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌  Faltan variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).');
  process.exit(1);
}

const db   = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY, { auth: { persistSession: false } });
const edge = createClient(SUPABASE_URL, ANON_KEY,                { auth: { persistSession: false } });

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  const v = parseInt(args[i + 1], 10);
  return isNaN(v) || v < 1 ? fallback : v;
}

const DRY_RUN          = args.includes('--dry-run');
const cityArg          = args.includes('--city') ? args[args.indexOf('--city') + 1] : null;
// ⚠️  NOTA SOBRE CONCURRENCIA:
// La edge function hace: JWT OAuth → Gemini TTS (puede tardar 20-25s) → MP3 encode → Storage upload.
// Con más de 4-6 requests simultáneas se satura Supabase Edge Functions y se producen timeouts.
// Recomendado: STOP=2 × CITY=2 = 4 requests simultáneas máximo.
const STOP_CONCURRENCY = getArg('--stop-concurrency', 2);   // paradas en paralelo dentro de 1 ciudad
const CITY_CONCURRENCY = getArg('--city-concurrency', 2);   // ciudades en paralelo (modo global)
const EDGE_TIMEOUT_MS  = 90_000;                            // 90s: Gemini TTS (~25s) + OAuth + upload

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Stop { id?: string; name: string; description: string; [k: string]: unknown; }
interface Tour { id?: string; stops: Stop[];                     [k: string]: unknown; }

interface CityResult {
  city:       string;
  lang:       string;
  total:      number;
  cached:     number;
  generated:  number;
  failed:     number;
  skipped:    boolean;
  elapsedMs:  number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** SHA-256 idéntico al que usa la edge function generate-audio-gcp */
function textHash(text: string): string {
  const clean = text.replace(/[*_~`]/g, '').trim();
  return crypto.createHash('sha256').update(clean, 'utf8').digest('hex');
}

/** Semáforo para limitar la concurrencia */
class Semaphore {
  private q: Array<() => void> = [];
  private n = 0;
  constructor(private limit: number) {}
  acquire(): Promise<void> {
    if (this.n < this.limit) { this.n++; return Promise.resolve(); }
    return new Promise<void>(res => this.q.push(res)).then(() => { this.n++; });
  }
  release() { this.n--; const next = this.q.shift(); if (next) next(); }
}

/** Helper: envuelve una promesa con un timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout (${ms / 1000}s) — ${label}`)), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

/** Formatea ms en segundos con un decimal */
const fmtMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/** Devuelve hh:mm:ss desde un Date */
function hms(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

// ─── invokeWithRetry ─────────────────────────────────────────────────────────

const RETRY_DELAYS_MS = [8_000, 20_000]; // 2 reintentos: espera 8s, luego 20s

/**
 * Llama a la edge function con reintentos automáticos.
 * Cubre errores transitorios: timeouts de Gemini, rate-limits (429), 500 fugaces.
 *
 * @returns true si el audio se generó OK
 * @throws si se agotan todos los intentos
 */
async function invokeWithRetry(stop: Stop, lang: string, citySlug: string): Promise<true> {
  const maxAttempts = 1 + RETRY_DELAYS_MS.length;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const label = attempt > 1 ? ` (intento ${attempt}/${maxAttempts})` : '';
    try {
      const invokeP = edge.functions.invoke('generate-audio-gcp', {
        body: { text: stop.description, language: lang, city: citySlug },
      });

      const { data, error: invokeErr } = await withTimeout(invokeP, EDGE_TIMEOUT_MS, stop.name);

      if (invokeErr) {
        // Intentar extraer el cuerpo real del error (FunctionsHttpError tiene .context = Response)
        let detail = invokeErr.message;
        try {
          const ctx = (invokeErr as any).context;
          if (ctx?.json) {
            const body = await ctx.json();
            if (body?.error) detail = body.error;
          }
        } catch { /* ignorar si no se puede parsear */ }
        throw new Error(detail);
      }

      if (!data?.url) throw new Error('Sin URL de audio en la respuesta.');
      return true;

    } catch (e: any) {
      const isLast = attempt === maxAttempts;
      if (isLast) throw e;

      const waitMs = RETRY_DELAYS_MS[attempt - 1];
      console.log(`     ⏳ ${stop.name}${label} — ${e.message}. Reintentando en ${waitMs / 1000}s...`);
      await sleep(waitMs);
    }
  }
  // Nunca llega aquí pero TypeScript lo requiere
  throw new Error('Reintentos agotados');
}

// ─── processCity ──────────────────────────────────────────────────────────────

/**
 * Procesa todos los audios faltantes de una ciudad+idioma.
 * Verifica audio_cache en batch; solo llama a la edge function para los que faltan.
 * Muestra progreso en tiempo real con una línea por parada.
 */
async function processCity(citySlug: string, lang: string, prefix = ''): Promise<CityResult> {
  const t0 = Date.now();
  const base: CityResult = { city: citySlug, lang, total: 0, cached: 0, generated: 0, failed: 0, skipped: false, elapsedMs: 0 };

  // ── 1. Obtener tour ──────────────────────────────────────────────────────────
  const { data: record, error } = await db
    .from('tours_cache')
    .select('data')
    .eq('city', citySlug)
    .eq('language', lang)
    .eq('status', 'READY')
    .maybeSingle();

  if (error || !record?.data) {
    console.log(`${prefix}⏭️  ${citySlug} [${lang}] — sin tour en caché. Saltando.`);
    return { ...base, skipped: true, elapsedMs: Date.now() - t0 };
  }

  const tours: Tour[] = record.data;
  const stops = tours.flatMap(t => t.stops).filter(s => s.description?.trim());
  const total = stops.length;

  if (total === 0) {
    console.log(`${prefix}⏭️  ${citySlug} [${lang}] — el tour no tiene paradas con descripción.`);
    return { ...base, skipped: true, elapsedMs: Date.now() - t0 };
  }

  base.total = total;

  // ── 2. Verificar en lote qué hashes ya existen ───────────────────────────────
  const hashMap = stops.map(s => ({ hash: textHash(s.description), stop: s }));
  const { data: existing } = await db
    .from('audio_cache')
    .select('text_hash')
    .eq('language', lang)
    .in('text_hash', hashMap.map(h => h.hash));

  const cachedSet = new Set<string>(existing?.map(e => e.text_hash) ?? []);
  base.cached = cachedSet.size;

  const pending = hashMap.filter(h => !cachedSet.has(h.hash));
  const alreadyDone = total - pending.length;

  console.log(`\n${prefix}▶  ${citySlug} [${lang}]  |  ${total} paradas  |  ${alreadyDone} en caché  |  ${pending.length} a generar`);

  if (pending.length === 0) {
    console.log(`${prefix}   ✅ Todos los audios ya existían. Nada que generar.`);
    base.generated = 0;
    base.elapsedMs = Date.now() - t0;
    return base;
  }

  // ── 3. Generar en paralelo con semáforo ─────────────────────────────────────
  const sem     = new Semaphore(STOP_CONCURRENCY);
  let doneCount = alreadyDone;

  const stopTasks = pending.map(({ stop }, i) =>
    async () => {
      await sem.acquire();
      const st = Date.now();
      const idx = `[${String(++doneCount).padStart(2)}/${total}]`;

      try {
        if (!DRY_RUN) {
          await invokeWithRetry(stop, lang, citySlug);
        }

        base.generated++;
        console.log(`${prefix}   ✅ ${idx} ${stop.name}  (${fmtMs(Date.now() - st)})`);
      } catch (e: any) {
        base.failed++;
        console.log(`${prefix}   ❌ ${idx} ${stop.name}  — ${e.message}`);
      } finally {
        sem.release();
      }
    }
  );

  await Promise.all(stopTasks.map(fn => fn()));

  base.elapsedMs = Date.now() - t0;
  const okTotal = base.cached + base.generated;
  console.log(`${prefix}   📊 Fin ${citySlug} [${lang}]: ${okTotal}/${total} OK  |  ${base.generated} nuevos  |  ${base.failed} errores  |  ${fmtMs(base.elapsedMs)}`);

  return base;
}

// ─── Concurrencia entre ciudades ──────────────────────────────────────────────

async function runConcurrent<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const sem     = new Semaphore(limit);
  const results = new Array<T>(tasks.length);
  await Promise.all(
    tasks.map((fn, i) => (async () => {
      await sem.acquire();
      try { results[i] = await fn(); } finally { sem.release(); }
    })())
  );
  return results;
}

// ─── printSummary ─────────────────────────────────────────────────────────────

function printSummary(results: CityResult[], totalMs: number): void {
  const pad  = (s: string | number, n: number) => String(s).padEnd(n);
  const padL = (s: string | number, n: number) => String(s).padStart(n);
  const COL  = { city: 38, lang: 6, total: 8, cached: 8, gen: 8, fail: 6, status: 14 };

  const header =
    `  ${pad('Ciudad',   COL.city)} ${pad('Lang',    COL.lang)} ` +
    `${padL('Paradas', COL.total)} ${padL('Caché',  COL.cached)} ` +
    `${padL('Nuevas',  COL.gen)}  ${padL('Err', COL.fail)}  ${pad('Estado', COL.status)}`;
  const sep = `  ${'─'.repeat(header.length - 2)}`;

  const sorted = [...results].sort((a, b) => {
    if (a.skipped !== b.skipped) return a.skipped ? 1 : -1;
    const aOk = (a.cached + a.generated) >= a.total && a.total > 0;
    const bOk = (b.cached + b.generated) >= b.total && b.total > 0;
    if (aOk !== bOk) return aOk ? 1 : -1;
    return a.city.localeCompare(b.city) || a.lang.localeCompare(b.lang);
  });

  console.log('\n' + sep);
  console.log(header);
  console.log(sep);

  let cTotal = 0, cComplete = 0, cPartial = 0, cSkipped = 0, cNewAudios = 0, cFail = 0;

  for (const r of sorted) {
    if (r.skipped) { cSkipped++; continue; }
    cTotal++;
    const okTotal   = r.cached + r.generated;
    const isComplete = okTotal >= r.total && r.total > 0;
    const status     = isComplete ? '✅ COMPLETO' : `❌ faltan ${r.total - okTotal}`;
    if (isComplete) cComplete++; else cPartial++;
    cNewAudios += r.generated;
    cFail      += r.failed;

    const cityLabel = r.city.length > COL.city - 1 ? r.city.slice(0, COL.city - 3) + '..' : r.city;
    console.log(
      `  ${pad(cityLabel, COL.city)} ${pad(r.lang,      COL.lang)} ` +
      `${padL(r.total,   COL.total)} ${padL(r.cached,  COL.cached)} ` +
      `${padL(r.generated, COL.gen)}  ${padL(r.failed, COL.fail)}  ${status}`
    );
  }

  console.log(sep);
  console.log(`\n  📊  RESUMEN FINAL  (tiempo total: ${fmtMs(totalMs)})`);
  console.log(`  ├─ Tours con datos:         ${cTotal}`);
  console.log(`  ├─ Tours completos ✅:       ${cComplete}`);
  console.log(`  ├─ Tours incompletos ❌:     ${cPartial}`);
  console.log(`  ├─ Tours sin caché (⏭️):    ${cSkipped}`);
  console.log(`  ├─ Audios nuevos generados: ${cNewAudios}`);
  console.log(`  └─ Errores de generación:   ${cFail}`);
  console.log();
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startT = Date.now();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  BDAI — Generador Completo de Audios GCP');
  if (DRY_RUN)  console.log('  🔍  MODO: DRY RUN — no se llama a la edge function');
  if (cityArg)  console.log(`  🎯  Ciudad única: ${cityArg}`);
  console.log(`  ⚡  Paradas en paralelo: ${STOP_CONCURRENCY}   |   Timeout por parada: ${EDGE_TIMEOUT_MS / 1000}s`);
  if (!cityArg) console.log(`  🏙️  Ciudades en paralelo: ${CITY_CONCURRENCY}`);
  console.log(`  🔢  Max requests simultáneas: ${STOP_CONCURRENCY * CITY_CONCURRENCY} (recomendado ≤ 6)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let results: CityResult[];

  // ── FAST-PATH: ciudad única ──────────────────────────────────────────────────
  // Salta el syncInventory global (queries a audio_cache por cada ciudad de la BD)
  // y va directo a procesar la ciudad solicitada.
  if (cityArg) {
    console.log(`[${hms(new Date())}] Modo ciudad única — cargando idiomas disponibles...`);

    const { data: cacheRows, error } = await db
      .from('tours_cache')
      .select('language')
      .eq('city', cityArg)
      .eq('status', 'READY');

    if (error || !cacheRows?.length) {
      console.error(`❌  No se encontraron tours READY para "${cityArg}" en tours_cache.`);
      process.exit(1);
    }

    const langs = cacheRows.map(r => r.language);
    console.log(`[${hms(new Date())}] Idiomas encontrados: ${langs.join(', ')}\n`);

    const tasks  = langs.map(lang => () => processCity(cityArg, lang, '  '));
    results = await runConcurrent(tasks, CITY_CONCURRENCY);

    // Actualizar inventario
    if (!DRY_RUN) {
      await Promise.all(
        results
          .filter(r => !r.skipped && r.total > 0)
          .map(r => markGenerated(db, r.city, r.lang, r.cached + r.generated, r.total))
      );
    }

  // ── MODO GLOBAL: todos los pendientes ────────────────────────────────────────
  } else {
    console.log(`[${hms(new Date())}] Sincronizando inventario (puede tardar unos segundos)...`);
    let inventory: InventoryRow[];
    try {
      inventory = await syncInventory(db);
    } catch (e: any) {
      if (e.message?.includes('audio_inventory') || e.message?.includes('relation')) {
        console.error('\n❌  La tabla audio_inventory no existe. Ejecuta: scripts/sql-create-audio-inventory.sql\n');
      } else {
        console.error('\n❌  Error en sincronización:', e.message);
      }
      process.exit(1);
    }

    const pending = getPendingCities(inventory);

    if (pending.length === 0) {
      console.log('🎉  ¡Todos los tours ya tienen sus audios generados!\n');
      return;
    }

    console.log(`[${hms(new Date())}] ${inventory.length} tours en BD  |  ${pending.length} pendientes.\n`);

    const tasks = pending.map(({ city_slug, language }) =>
      () => processCity(city_slug, language)
    );
    results = await runConcurrent(tasks, CITY_CONCURRENCY);

    if (!DRY_RUN) {
      await Promise.all(
        results
          .filter(r => !r.skipped && r.total > 0)
          .map(r => markGenerated(db, r.city, r.lang, r.cached + r.generated, r.total))
      );
    }
  }

  // ── RESUMEN ──────────────────────────────────────────────────────────────────
  printSummary(results, Date.now() - startT);
}

main().catch(e => {
  console.error('\nError fatal:', e?.message ?? e);
  process.exit(1);
});
