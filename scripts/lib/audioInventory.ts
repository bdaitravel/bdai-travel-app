/**
 * scripts/lib/audioInventory.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de inventario de audios para BDAI.
 *
 * Cruza tours_cache (paradas existentes) con audio_cache (hashes generados)
 * para saber qué ciudad+idioma ya tiene todos sus audios generados.
 *
 * FLUJO:
 *   1. syncInventory()     → Escanea tours_cache completo, verifica audio_cache
 *                            y upserta en audio_inventory
 *   2. getPendingCities()  → Retorna city+lang donde has_audio = false
 *   3. markGenerated()     → Actualiza el inventario tras una generación
 */

import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface InventoryRow {
  city_slug: string;
  language: string;
  total_stops: number;
  audios_ok: number;
  has_audio: boolean;
  last_checked: string;
  last_generated: string | null;
}

interface StopInCache {
  name: string;
  description: string;
  [k: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Replica el mismo hash SHA-256 que usa la edge function generate-audio-gcp */
function computeTextHash(text: string): string {
  const clean = text.replace(/[*_~`]/g, '').trim();
  return crypto.createHash('sha256').update(clean, 'utf8').digest('hex');
}

/** Extrae todas las paradas con descripción de un array de tours */
function extractStops(tourData: any[]): StopInCache[] {
  return (tourData || [])
    .flatMap((t: any) => t?.stops ?? [])
    .filter((s: any) => s?.description && s.description.trim() !== '');
}

// ─── syncInventory ────────────────────────────────────────────────────────────

/**
 * Lee TODA la tabla tours_cache, comprueba qué paradas tienen audio
 * en audio_cache (por text_hash + language) y upserta el resultado
 * en audio_inventory.
 *
 * @returns El inventario completo actualizado (ordenado por city_slug + language)
 */
export async function syncInventory(db: SupabaseClient): Promise<InventoryRow[]> {
  console.log('\n📋 [SYNC] Escaneando tours_cache...');

  // 1. Leer todos los registros de tours_cache
  const { data: cacheRows, error: cacheErr } = await db
    .from('tours_cache')
    .select('city, language, data, status')
    .eq('status', 'READY');

  if (cacheErr) throw new Error(`[SYNC] Error leyendo tours_cache: ${cacheErr.message}`);
  if (!cacheRows || cacheRows.length === 0) {
    console.log('  ⚠️  tours_cache vacía o sin registros READY.');
    return [];
  }

  console.log(`  ✅ ${cacheRows.length} registros city+lang encontrados en tours_cache.`);

  // 2. Para cada city+lang, calcular hashes de sus paradas y comprobar en audio_cache
  const upsertRows: Omit<InventoryRow, 'last_generated'>[] = [];

  for (const row of cacheRows) {
    const { city, language, data } = row;
    const stops = extractStops(data ?? []);
    const totalStops = stops.length;

    if (totalStops === 0) {
      upsertRows.push({
        city_slug: city,
        language,
        total_stops: 0,
        audios_ok: 0,
        has_audio: false,
        last_checked: new Date().toISOString(),
      });
      continue;
    }

    // Calcular hashes de todas las paradas
    const hashes = stops.map(s => computeTextHash(s.description));

    // Consultar en lote: ¿cuántos de esos hashes existen en audio_cache con este idioma?
    const { data: existingAudios, error: audioErr } = await db
      .from('audio_cache')
      .select('text_hash')
      .eq('language', language)
      .in('text_hash', hashes);

    if (audioErr) {
      console.warn(`  ⚠️  Error consultando audio_cache para ${city} [${language}]: ${audioErr.message}`);
    }

    const audiosOk = existingAudios?.length ?? 0;
    const hasAudio = audiosOk >= totalStops && totalStops > 0;

    upsertRows.push({
      city_slug: city,
      language,
      total_stops: totalStops,
      audios_ok: audiosOk,
      has_audio: hasAudio,
      last_checked: new Date().toISOString(),
    });
  }

  // 3. Upsert masivo en audio_inventory (preservando last_generated)
  const { error: upsertErr } = await db
    .from('audio_inventory')
    .upsert(upsertRows, { onConflict: 'city_slug, language', ignoreDuplicates: false });

  if (upsertErr) throw new Error(`[SYNC] Error upserting audio_inventory: ${upsertErr.message}`);

  // 4. Leer el inventario actualizado
  const { data: inventory, error: readErr } = await db
    .from('audio_inventory')
    .select('*')
    .order('city_slug')
    .order('language');

  if (readErr) throw new Error(`[SYNC] Error leyendo audio_inventory: ${readErr.message}`);

  return (inventory ?? []) as InventoryRow[];
}

// ─── getPendingCities ─────────────────────────────────────────────────────────

/**
 * Retorna los registros del inventario donde has_audio = false.
 * Espera recibir el inventario ya sincronizado para evitar una llamada extra.
 */
export function getPendingCities(inventory: InventoryRow[]): InventoryRow[] {
  return inventory.filter(r => !r.has_audio);
}

// ─── markGenerated ────────────────────────────────────────────────────────────

/**
 * Actualiza audio_inventory tras completar la generación de una ciudad.
 */
export async function markGenerated(
  db: SupabaseClient,
  citySlug: string,
  language: string,
  audiosOk: number,
  totalStops: number
): Promise<void> {
  const hasAudio = audiosOk >= totalStops && totalStops > 0;
  const { error } = await db
    .from('audio_inventory')
    .update({
      audios_ok: audiosOk,
      has_audio: hasAudio,
      last_generated: new Date().toISOString(),
      last_checked: new Date().toISOString(),
    })
    .eq('city_slug', citySlug)
    .eq('language', language);

  if (error) {
    console.warn(`  ⚠️  No se pudo actualizar audio_inventory para ${citySlug} [${language}]: ${error.message}`);
  }
}

// ─── printInventoryTable ──────────────────────────────────────────────────────

/** Imprime en consola una tabla resumen del inventario */
export function printInventoryTable(inventory: InventoryRow[]): void {
  if (inventory.length === 0) {
    console.log('  (inventario vacío)');
    return;
  }

  const pad = (s: string | number, n: number) => String(s).padEnd(n);
  const padL = (s: string | number, n: number) => String(s).padStart(n);

  const COL = { city: 36, lang: 6, total: 8, ok: 9, status: 10 };
  const header =
    `  ${pad('Ciudad', COL.city)} ${pad('Lang', COL.lang)} ` +
    `${padL('Paradas', COL.total)} ${padL('Con Audio', COL.ok)} ${pad('Estado', COL.status)}`;
  const sep = `  ${'-'.repeat(header.length - 2)}`;

  console.log('\n' + sep);
  console.log(header);
  console.log(sep);

  // Agrupar por estado para mostrar pendientes primero
  const sorted = [...inventory].sort((a, b) => {
    if (a.has_audio !== b.has_audio) return a.has_audio ? 1 : -1;
    return a.city_slug.localeCompare(b.city_slug) || a.language.localeCompare(b.language);
  });

  for (const r of sorted) {
    const status = r.has_audio ? '✅ SÍ' : '❌ NO';
    const city = pad(r.city_slug.length > COL.city - 1 ? r.city_slug.slice(0, COL.city - 2) + '..' : r.city_slug, COL.city);
    console.log(
      `  ${city} ${pad(r.language, COL.lang)} ` +
      `${padL(r.total_stops, COL.total)} ${padL(r.audios_ok, COL.ok)}  ${status}`
    );
  }

  const pending = inventory.filter(r => !r.has_audio).length;
  const complete = inventory.filter(r => r.has_audio).length;
  console.log(sep);
  console.log(`  Total: ${inventory.length} entradas | ✅ Completas: ${complete} | ❌ Pendientes: ${pending}\n`);
}
