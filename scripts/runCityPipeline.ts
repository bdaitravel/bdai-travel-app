/**
 * runCityPipeline.ts — Pipeline maestro BDAI
 *
 * Genera tours en español → traduce al inglés → genera audios en ambos idiomas → convierte WAV→MP3.
 * Lee el estado de cada ciudad desde scripts/cities-pipeline.txt y lo actualiza automáticamente.
 *
 * Límite diario GCP gratuito:
 *   ~44 ciudades/día (2 idiomas). Procesa por defecto MAX_CITIES_PER_RUN = 43.
 *
 * Uso:
 *   npx tsx scripts/runCityPipeline.ts            → procesa el siguiente lote pendiente
 *   npx tsx scripts/runCityPipeline.ts --status   → solo muestra el estado de la lista
 *   npx tsx scripts/runCityPipeline.ts --limit 10 → limita el lote a 10 ciudades
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { importPKCS8, SignJWT } from 'jose';
import lamejs from '@breezystack/lamejs';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// ── Config ─────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY       = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY          = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SA_PATH           = path.resolve('../tmp-gdrive-to-m365-f40632c4812f.json');
const CITIES_FILE       = path.resolve('./scripts/cities-pipeline.txt');

// Límite diario GCP gratuito (44 ciudades/día en 2 idiomas) menos 1 de margen de seguridad
const MAX_CITIES_PER_RUN = 43;

// Espera entre peticiones de audio: 4s para no superar 15 RPM de GCP
const AUDIO_SLEEP_MS = 4_000;

if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  console.error('❌ Faltan variables de entorno. Necesarias: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const db   = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const edge = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const log   = (tag: string, msg: string) => console.log(`[${tag.padEnd(24).slice(0, 24)}] ${msg}`);

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface Stop  { id: string; name: string; description: string; [k: string]: unknown; }
interface Tour  { id: string; stops: Stop[]; title: string; description: string; theme: string; [k: string]: unknown; }
type Status = 'PENDING' | 'DONE' | 'ES_ONLY' | 'ERROR' | 'SKIP';

interface CityEntry {
  line:     string;   // línea original completa del fichero
  cityName: string;
  country:  string;
  slug:     string;
  status:   Status;
  lineIndex: number;
}

// ── Parseo del fichero de ciudades ─────────────────────────────────────────────
function parseNormalize(str: string): string {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-\/\\]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .trim();
}

function buildSlug(city: string, country: string): string {
  const c = parseNormalize(city);
  const co = parseNormalize(country);
  if (!co || co === 'cache') return c;
  if (c.endsWith(`_${co}`)) return c;
  return `${c}_${co}`;
}

function loadCities(): CityEntry[] {
  const lines = fs.readFileSync(CITIES_FILE, 'utf-8').split('\n');
  const entries: CityEntry[] = [];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    // Formato: "Ciudad, País | [STATUS]"
    const pipeIdx = line.lastIndexOf('|');
    const definition = (pipeIdx === -1 ? line : line.slice(0, pipeIdx)).trim();
    const statusRaw   = pipeIdx === -1 ? '[PENDING]' : line.slice(pipeIdx + 1).trim();
    const statusMatch = statusRaw.match(/\[(\w+)\]/);
    const status = (statusMatch ? statusMatch[1] : 'PENDING') as Status;

    const commaIdx = definition.lastIndexOf(',');
    if (commaIdx === -1) return;
    const cityName = definition.slice(0, commaIdx).trim();
    const country  = definition.slice(commaIdx + 1).trim();

    entries.push({ line: rawLine, cityName, country, slug: buildSlug(cityName, country), status, lineIndex: idx });
  });

  return entries;
}

function updateCityStatus(entry: CityEntry, newStatus: Status) {
  const lines = fs.readFileSync(CITIES_FILE, 'utf-8').split('\n');
  const pipeIdx = entry.line.lastIndexOf('|');
  const definition = (pipeIdx === -1 ? entry.line : entry.line.slice(0, pipeIdx)).trimEnd();
  lines[entry.lineIndex] = `${definition} | [${newStatus}]`;
  fs.writeFileSync(CITIES_FILE, lines.join('\n'), 'utf-8');
  entry.status = newStatus;
  entry.line = lines[entry.lineIndex];
}

// ── GCP Service Account OAuth2 ─────────────────────────────────────────────────
let _gcpToken: string | null = null;
let _gcpExpiry = 0;

async function getGcpToken(): Promise<string> {
  if (_gcpToken && Date.now() < _gcpExpiry - 60_000) return _gcpToken;

  if (!fs.existsSync(SA_PATH)) {
    throw new Error(`No se encontró el archivo de Service Account en: ${SA_PATH}`);
  }
  const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf-8'));
  const privateKey = await importPKCS8(sa.private_key, 'RS256');

  const jwt = await new SignJWT({
    iss: sa.client_email, sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/generative-language',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: sa.private_key_id })
    .setIssuedAt().setExpirationTime('1h')
    .sign(privateKey);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(`Error auth GCP: ${JSON.stringify(data)}`);

  _gcpToken  = data.access_token;
  _gcpExpiry = Date.now() + data.expires_in * 1000;
  return _gcpToken!;
}

// ── Paso 1: Asegurar tour en español ──────────────────────────────────────────
async function ensureSpanishTour(entry: CityEntry): Promise<Tour[] | null> {
  const { cityName, country, slug } = entry;

  const { data: existing } = await db
    .from('tours_cache').select('status, data')
    .eq('city', slug).eq('language', 'es').maybeSingle();

  if (existing?.status === 'READY' && (existing.data as Tour[])?.length > 0) {
    log(cityName, '✅ Tour ES ya existe en caché');
    return existing.data as Tour[];
  }

  log(cityName, '🚀 Disparando generación de tour en español...');
  const { error } = await edge.functions.invoke('tour-orchestrator', {
    body: { city: cityName, country, language: 'es', slug }
  });

  if (error) {
    log(cityName, `❌ Error orchestrator: ${error.message}`);
    return null;
  }

  // Poll cada 15s durante 15 min
  for (let i = 1; i <= 60; i++) {
    await sleep(15_000);
    const { data } = await db.from('tours_cache').select('status, data')
      .eq('city', slug).eq('language', 'es').maybeSingle();
    const st = data?.status ?? 'unknown';
    log(cityName, `  ⏳ Poll ${i}/60: ${st}`);
    if (st === 'READY' && (data!.data as Tour[])?.length > 0) {
      log(cityName, '✅ Tour ES generado correctamente');
      return data!.data as Tour[];
    }
    if (st === 'ERROR') { log(cityName, '❌ Generación falló (ERROR)'); return null; }
  }

  log(cityName, '❌ Timeout esperando tour ES (15 min)');
  return null;
}

// ── Paso 2: Traducir ES → EN usando Gemini 2.5 Flash + GCP OAuth2 ──────────────
async function translateToEnglish(entry: CityEntry, tours: Tour[]): Promise<Tour[]> {
  const { cityName } = entry;
  log(cityName, '🌐 Traduciendo tours al inglés...');

  const slim = tours.map(t => ({
    id: t.id, title: t.title, description: t.description, theme: t.theme,
    stops: t.stops.map(s => ({ id: s.id, name: s.name, description: s.description }))
  }));

  const prompt = `Translate the following JSON array of travel tours from Spanish to English.
Return ONLY a valid JSON array with the exact same structure.

CRITICAL RULES:
1. Maintain the EXACT same JSON structure and keys.
2. DO NOT translate place names (e.g., "Plaza Mayor" stays "Plaza Mayor").
3. Translate: "title", "description", "theme" of each tour, and "name" and "description" of each stop.
4. Replace "_es_" with "_en_" in all id strings.
5. Preserve the EXACT personality of the narrator: a highly intelligent, sophisticated, and SARCASTIC female AI speaking in first person. Adapt wit and humor naturally to English.
6. Return ONLY the translated JSON array, no markdown, no explanations.

JSON to translate:
${JSON.stringify(slim)}`;

  const token = await getGcpToken();
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }
    })
  });

  if (!res.ok) throw new Error(`Gemini translation error ${res.status}: ${await res.text()}`);

  const resJson: any = await res.json();
  const rawText: string = resJson.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  let translated: any[];
  try { translated = JSON.parse(clean); }
  catch { throw new Error('Gemini devolvió JSON inválido en la traducción'); }

  if (!translated.length) throw new Error('Gemini devolvió una traducción vacía');

  return tours.map((tour, i) => {
    const tr = translated[i];
    if (!tr) return tour;
    return {
      ...tour,
      id:          tr.id          || tour.id.replace(/_es_/g, '_en_'),
      title:       tr.title       || tour.title,
      description: tr.description || tour.description,
      theme:       tr.theme       || tour.theme,
      stops: tour.stops.map((s, j) => ({
        ...s,
        id:          tr.stops?.[j]?.id          || s.id.replace(/_es_/g, '_en_'),
        name:        tr.stops?.[j]?.name        || s.name,
        description: tr.stops?.[j]?.description || s.description,
      }))
    };
  });
}

// ── Paso 3: Guardar tours EN en tours_cache ────────────────────────────────────
async function saveEnglishTours(slug: string, tours: Tour[], routePolylines: any): Promise<void> {
  const { error } = await db.from('tours_cache').upsert({
    city: slug, language: 'en', status: 'READY',
    data: tours, route_polylines: routePolylines,
    updated_at: new Date().toISOString()
  }, { onConflict: 'city, language' });
  if (error) throw new Error(`Error guardando EN en tours_cache: ${error.message}`);
}

// ── Paso 4: Generar audios para un lote de tours ───────────────────────────────
async function generateAudios(entry: CityEntry, tours: Tour[], lang: string): Promise<void> {
  const stops = tours.flatMap(t => t.stops).filter(s => s.description?.trim());
  log(entry.cityName, `🎙️ Generando ${stops.length} audios (${lang})...`);

  let ok = 0; let errors = 0;
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    try {
      const { data, error } = await edge.functions.invoke('generate-audio-gcp', {
        body: { text: stop.description, language: lang, city: entry.slug }
      });
      if (error) throw new Error(error.message);
      if (data?.url) ok++;
    } catch (e: any) {
      log(entry.cityName, `  ⚠️ Audio fallido "${stop.name}": ${e.message}`);
      errors++;
    }
    // 4s entre peticiones para respetar el límite de 15 RPM de GCP
    if (i < stops.length - 1) await sleep(AUDIO_SLEEP_MS);
  }
  log(entry.cityName, `  ✅ Audio ${lang}: ${ok} ok, ${errors} errores`);
}

// ── Paso 5: Convertir WAV → MP3 localmente ────────────────────────────────────
function encodePcmToMp3(pcmData: Uint8Array): Uint8Array {
  const int16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2);
  const encoder = new lamejs.Mp3Encoder(1, 24000, 64);
  const chunks: Int8Array[] = [];
  const chunkSize = 1152;
  for (let i = 0; i < int16.length; i += chunkSize) {
    const buf = encoder.encodeBuffer(int16.subarray(i, i + chunkSize));
    if (buf.length > 0) chunks.push(buf);
  }
  const flush = encoder.flush();
  if (flush.length > 0) chunks.push(flush);
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), offset); offset += chunk.length; }
  return result;
}

// ── Conversión global WAV → MP3 (pase final completo) ────────────────────────
async function migrateAllWavToMp3(): Promise<void> {
  console.log('\n' + '─'.repeat(60));
  console.log('  🔄 Pase final: convirtiendo TODOS los WAV restantes a MP3...');
  const { data: records, error } = await db.from('audio_cache').select('*');
  if (error || !records) { console.log('  ⚠️ No se pudo leer audio_cache'); return; }

  const wavRecords = records.filter((r: any) => r.url?.endsWith('.wav'));
  if (!wavRecords.length) { console.log('  ✅ No quedan archivos WAV pendientes.'); return; }

  console.log(`  Encontrados ${wavRecords.length} WAV en total...`);
  let converted = 0;

  for (const record of wavRecords) {
    try {
      const res = await fetch(record.url);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const pcm = new Uint8Array(buf, 44);
      const mp3Data = encodePcmToMp3(pcm);

      const urlObj = new URL(record.url);
      const pathParts = urlObj.pathname.split('/audios/');
      if (pathParts.length < 2) continue;
      const oldPath = decodeURIComponent(pathParts[1]);
      const newPath = oldPath.replace('.wav', '.mp3');

      const { error: uploadErr } = await db.storage.from('audios').upload(newPath, mp3Data, {
        contentType: 'audio/mpeg', upsert: true
      });
      if (uploadErr) continue;

      const { data: { publicUrl } } = db.storage.from('audios').getPublicUrl(newPath);
      await db.from('audio_cache').update({ url: publicUrl }).eq('text_hash', record.text_hash).eq('language', record.language);
      await db.storage.from('audios').remove([oldPath]);
      converted++;
    } catch { /* continuar */ }
  }

  const savedMb = ((wavRecords.length - converted) === 0 && converted > 0)
    ? ' — Storage optimizado al máximo'
    : '';
  console.log(`  ✅ Pase final: ${converted}/${wavRecords.length} archivos convertidos a MP3${savedMb}`);
}

async function migrateWavToMp3(citySlug: string): Promise<void> {
  const safeSlug = citySlug.replace(/[^a-z0-9]/g, '');
  const { data: records, error } = await db.from('audio_cache').select('*').ilike('city', safeSlug);
  if (error || !records) return;

  const wavRecords = records.filter(r => r.url?.endsWith('.wav'));
  if (!wavRecords.length) return;

  console.log(`   🔄 Convirtiendo ${wavRecords.length} archivos WAV → MP3 para ${citySlug}...`);
  let converted = 0;

  for (const record of wavRecords) {
    try {
      const res = await fetch(record.url);
      if (!res.ok) continue;
      const buf = await res.arrayBuffer();
      const pcm = new Uint8Array(buf, 44); // saltar cabecera WAV de 44 bytes
      const mp3Data = encodePcmToMp3(pcm);

      const urlObj = new URL(record.url);
      const pathParts = urlObj.pathname.split('/audios/');
      if (pathParts.length < 2) continue;
      const oldPath = decodeURIComponent(pathParts[1]);
      const newPath = oldPath.replace('.wav', '.mp3');

      const { error: uploadErr } = await db.storage.from('audios').upload(newPath, mp3Data, {
        contentType: 'audio/mpeg', upsert: true
      });
      if (uploadErr) continue;

      const { data: { publicUrl } } = db.storage.from('audios').getPublicUrl(newPath);
      await db.from('audio_cache').update({ url: publicUrl }).eq('text_hash', record.text_hash).eq('language', record.language);
      await db.storage.from('audios').remove([oldPath]);
      converted++;
    } catch { /* continuar con el siguiente */ }
  }
  console.log(`   ✅ ${converted}/${wavRecords.length} archivos convertidos a MP3`);
}

// ── Modo --status ──────────────────────────────────────────────────────────────
function printStatus(cities: CityEntry[]) {
  const counts = { PENDING: 0, DONE: 0, ES_ONLY: 0, ERROR: 0, SKIP: 0 };
  cities.forEach(c => counts[c.status] = (counts[c.status] || 0) + 1);

  console.log('\n' + '═'.repeat(60));
  console.log('  BDAI City Pipeline — Estado de la lista');
  console.log('═'.repeat(60));
  console.log(`  ✅ DONE     : ${counts.DONE}`);
  console.log(`  ⏳ PENDING  : ${counts.PENDING}`);
  console.log(`  🟡 ES_ONLY  : ${counts.ES_ONLY}`);
  console.log(`  ❌ ERROR    : ${counts.ERROR}`);
  console.log(`  ⏭️  SKIP     : ${counts.SKIP}`);
  console.log('─'.repeat(60));

  const pending = cities.filter(c => c.status === 'PENDING' || c.status === 'ES_ONLY' || c.status === 'ERROR');
  if (pending.length > 0) {
    console.log(`\n  Próximas ${Math.min(5, pending.length)} ciudades a procesar:`);
    pending.slice(0, 5).forEach(c => console.log(`    • ${c.cityName}, ${c.country}  [${c.status}]`));
  } else {
    console.log('\n  🎉 ¡Lista completa! No quedan ciudades pendientes.');
  }
  console.log('═'.repeat(60) + '\n');
}

// ── Pipeline principal por ciudad ──────────────────────────────────────────────
async function processCity(entry: CityEntry): Promise<void> {
  const { cityName, country, slug } = entry;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📍 ${cityName}, ${country}  [${slug}]`);
  console.log('─'.repeat(60));

  try {
    // 1. Tour en Español
    const esTours = await ensureSpanishTour(entry);
    if (!esTours) { updateCityStatus(entry, 'ERROR'); return; }
    updateCityStatus(entry, 'ES_ONLY');

    // 2. Audios en Español
    await generateAudios(entry, esTours, 'es');

    // 3. Traducción al Inglés
    const { data: existingEn } = await db.from('tours_cache').select('status, data, route_polylines')
      .eq('city', slug).eq('language', 'en').maybeSingle();

    let enTours: Tour[];
    let routePolylines: any;

    if (existingEn?.status === 'READY' && (existingEn.data as Tour[])?.length > 0) {
      log(cityName, '✅ Tour EN ya existe en caché');
      enTours = existingEn.data as Tour[];
      routePolylines = existingEn.route_polylines;
    } else {
      // Obtener polilíneas del tour ES base
      const { data: esRecord } = await db.from('tours_cache').select('route_polylines')
        .eq('city', slug).eq('language', 'es').maybeSingle();
      routePolylines = esRecord?.route_polylines;

      enTours = await translateToEnglish(entry, esTours);
      await saveEnglishTours(slug, enTours, routePolylines);
      log(cityName, `✅ Tour EN guardado (${enTours.length} tours)`);
    }

    // 4. Audios en Inglés
    await generateAudios(entry, enTours, 'en');

    // 5. Convertir WAV → MP3 para esta ciudad
    await migrateWavToMp3(slug);

    updateCityStatus(entry, 'DONE');
    log(cityName, '🎉 Ciudad completada con éxito');

  } catch (e: any) {
    log(cityName, `❌ Error: ${e.message}`);
    updateCityStatus(entry, 'ERROR');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const onlyStatus = args.includes('--status');
  const limitIdx   = args.indexOf('--limit');
  const limit      = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : MAX_CITIES_PER_RUN;

  const all = loadCities();

  if (onlyStatus) { printStatus(all); return; }

  // Ciudades a procesar: PENDING y ES_ONLY primero, luego ERROR como último recurso
  const queue = [
    ...all.filter(c => c.status === 'PENDING'),
    ...all.filter(c => c.status === 'ES_ONLY'),
    ...all.filter(c => c.status === 'ERROR'),
  ].slice(0, limit);

  console.log('\n' + '═'.repeat(60));
  console.log(`  BDAI City Pipeline`);
  console.log(`  Ciudades en cola: ${queue.length} (límite: ${limit})`);
  console.log('═'.repeat(60));

  if (queue.length === 0) {
    console.log('\n  🎉 ¡No hay ciudades pendientes! Usa --status para ver el resumen.');
    return;
  }

  printStatus(all);

  for (const entry of queue) {
    await processCity(entry);
    await sleep(3_000); // cooldown breve entre ciudades
  }

  // Pase final global WAV→MP3 para cualquier archivo que haya podido escaparse
  await migrateAllWavToMp3();

  console.log('\n' + '═'.repeat(60));
  const final = loadCities();
  printStatus(final);
  console.log('  Pipeline finalizado.\n' + '═'.repeat(60) + '\n');
}

main().catch(e => { console.error(e); process.exit(1); });
