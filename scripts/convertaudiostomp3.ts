/**
 * scripts/convertaudiostomp3.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Convierte todos los ficheros WAV del bucket "audios" de Supabase a MP3.
 *
 * Estructura del bucket:
 *   audios/<ciudad>/<idioma>/<hash>.wav
 *   audios/<ciudad>/<idioma>/<hash>.mp3
 *
 * LÓGICA POR FICHERO WAV:
 *   A) Si ya existe el MP3 correspondiente en el bucket:
 *      → Verificar que audio_cache apunta a la URL del MP3 (corregir si no)
 *      → Eliminar el WAV
 *      → No re-codificar (ya está hecho)
 *
 *   B) Si NO existe el MP3:
 *      → Descargar WAV → convertir a MP3 → subir MP3
 *      → Actualizar audio_cache con la URL del MP3
 *      → Eliminar el WAV
 *
 * USO:
 *   cd bdai-travel-app
 *   npx tsx scripts/convertaudiostomp3.ts                        # todo el bucket
 *   npx tsx scripts/convertaudiostomp3.ts --city alberitespain   # solo una ciudad
 *   npx tsx scripts/convertaudiostomp3.ts --lang es              # solo un idioma
 *   npx tsx scripts/convertaudiostomp3.ts --city alberitespain --lang es
 *   npx tsx scripts/convertaudiostomp3.ts --dry-run              # sin modificar nada
 *   npx tsx scripts/convertaudiostomp3.ts --list                 # solo listar WAVs
 *
 * VARIABLES DE ENTORNO (.env.local):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← recomendado (puede omitirse si el bucket es público)
 *   VITE_SUPABASE_ANON_KEY      ← fallback
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import lamejs from '@breezystack/lamejs';

// ─── Entorno ──────────────────────────────────────────────────────────────────

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL  || process.env.SUPABASE_URL  || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL) {
  console.error('❌  Falta VITE_SUPABASE_URL en .env.local');
  process.exit(1);
}

if (!SERVICE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY no encontrada. Usando ANON_KEY.');
  console.warn('    Si el bucket no tiene RLS esto funcionará igualmente.\n');
}

const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SERVICE_KEY || ANON_KEY,
  { auth: { persistSession: false } }
);

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const LIST_ONLY = args.includes('--list');
const cityArg   = args.includes('--city') ? args[args.indexOf('--city') + 1] : null;
const langArg   = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;

// ─── Encoder MP3 ──────────────────────────────────────────────────────────────

/**
 * Convierte un ArrayBuffer WAV (PCM16 mono) a MP3 usando lamejs.
 * Detecta el chunk "data" dinámicamente para soportar headers WAV no estándar.
 */
function encodeWavToMp3(wavBuffer: ArrayBuffer): Uint8Array {
  const view = new DataView(wavBuffer);

  // Validar firma RIFF
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (riff !== 'RIFF') throw new Error(`No es un WAV válido (firma: "${riff}")`);

  // Leer sample rate real del header (offset 24)
  const sampleRate = view.getUint32(24, true);

  // Buscar el chunk "data" dinámicamente (más robusto que asumir 44 bytes fijos)
  let dataOffset = 12;
  while (dataOffset < wavBuffer.byteLength - 8) {
    const id   = String.fromCharCode(view.getUint8(dataOffset), view.getUint8(dataOffset + 1), view.getUint8(dataOffset + 2), view.getUint8(dataOffset + 3));
    const size = view.getUint32(dataOffset + 4, true);
    if (id === 'data') { dataOffset += 8; break; }
    dataOffset += 8 + size;
  }

  const pcm   = new Uint8Array(wavBuffer, dataOffset);
  const int16 = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 2));

  const encoder   = new lamejs.Mp3Encoder(1, sampleRate, 64);
  const parts: Uint8Array[] = [];
  const CHUNK = 1152;

  for (let i = 0; i < int16.length; i += CHUNK) {
    const slice   = int16.subarray(i, i + CHUNK);
    const encoded = encoder.encodeBuffer(slice) as unknown as Uint8Array;
    if (encoded.length > 0) parts.push(new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength));
  }
  const flush = encoder.flush() as unknown as Uint8Array;
  if (flush.length > 0) parts.push(new Uint8Array(flush.buffer, flush.byteOffset, flush.byteLength));

  const total  = parts.reduce((a, p) => a + p.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { result.set(p, off); off += p.length; }
  return result;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

interface StorageFile {
  path: string;
  size: number;
}

/**
 * Lista recursivamente TODOS los ficheros de un bucket/prefijo.
 * Diferencia carpetas (id === null) de ficheros (id !== null).
 */
async function listAllFiles(bucket: string, prefix = '', depth = 0): Promise<StorageFile[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });

  if (error) {
    console.error(`❌  Error listando "${prefix || '(raíz)'}" en bucket "${bucket}": ${error.message}`);
    return [];
  }
  if (!data || data.length === 0) return [];

  const results: StorageFile[] = [];
  for (const item of data) {
    if (item.name === '.emptyFolderPlaceholder') continue;
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    const isFolder = item.id === null || item.metadata === null;
    if (isFolder) {
      results.push(...await listAllFiles(bucket, fullPath, depth + 1));
    } else {
      results.push({ path: fullPath, size: (item.metadata as any)?.size ?? 0 });
    }
  }
  return results;
}

// ─── Helpers de path ──────────────────────────────────────────────────────────

/** ciudad/idioma/hash.wav → ciudad */
const extractCity = (p: string) => p.split('/')[0] ?? 'unknown';
/** ciudad/idioma/hash.wav → idioma */
const extractLang = (p: string) => p.split('/')[1] ?? 'unknown';
/** ciudad/idioma/hash.wav → ciudad/idioma/hash.mp3 */
const toMp3Path   = (p: string) => p.replace(/\.wav$/i, '.mp3');

// ─── Estadísticas ─────────────────────────────────────────────────────────────

interface Stats {
  lang:         string;
  wavFound:     number;
  alreadyMp3:   number;  // MP3 ya existía → solo verificar BD y borrar WAV
  converted:    number;  // WAV convertido a MP3 nuevo
  dbFixed:      number;  // filas de audio_cache corregidas (apuntaban a WAV)
  wavDeleted:   number;
  errors:       number;
  savedBytes:   number;
}

// ─── Proceso de un WAV ────────────────────────────────────────────────────────

/**
 * Procesa un único fichero WAV.
 *
 * @param wavPath      - path en el bucket, e.g. "alberitespain/es/abc123.wav"
 * @param mp3Exists    - true si ya hay un fichero .mp3 con el mismo nombre en el bucket
 * @param stats        - se mutan in-place
 */
async function processWavFile(wavPath: string, mp3Exists: boolean, stats: Stats): Promise<void> {
  const mp3Path = toMp3Path(wavPath);

  const { data: { publicUrl: wavUrl } } = supabase.storage.from('audios').getPublicUrl(wavPath);
  const { data: { publicUrl: mp3Url } } = supabase.storage.from('audios').getPublicUrl(mp3Path);

  try {
    if (mp3Exists) {
      // ── CASO A: MP3 ya existe en el bucket ────────────────────────────────
      console.log(`  ♻️  MP3 ya existe: ${mp3Path}`);

      if (!DRY_RUN) {
        // A1. Asegurar que audio_cache no apunta al WAV
        await fixAudioCacheUrl(wavUrl, mp3Url, stats);

        // A2. Eliminar el WAV redundante
        const { error: delErr } = await supabase.storage.from('audios').remove([wavPath]);
        if (delErr) {
          console.warn(`  ⚠️  No se pudo borrar WAV ${wavPath}: ${delErr.message}`);
        } else {
          stats.wavDeleted++;
          console.log(`  🗑️  WAV eliminado: ${wavPath}`);
        }
      } else {
        console.log(`  🔍 [DRY-RUN] Verificaría audio_cache y borraría ${wavPath}`);
      }

      stats.alreadyMp3++;

    } else {
      // ── CASO B: No hay MP3 → convertir ───────────────────────────────────
      console.log(`  📥 Descargando WAV: ${wavPath}`);
      const response = await fetch(wavUrl);
      if (!response.ok) {
        console.error(`  ❌ HTTP ${response.status} al descargar ${wavUrl}`);
        stats.errors++;
        return;
      }

      const wavBuf   = await response.arrayBuffer();
      const wavKB    = Math.round(wavBuf.byteLength / 1024);

      let mp3Data: Uint8Array;
      try {
        mp3Data = encodeWavToMp3(wavBuf);
      } catch (encErr: any) {
        console.error(`  ❌ Error codificando ${wavPath}: ${encErr.message}`);
        stats.errors++;
        return;
      }

      const mp3KB  = Math.round(mp3Data.byteLength / 1024);
      const saved  = Math.round(100 - (mp3Data.byteLength / wavBuf.byteLength) * 100);

      if (DRY_RUN) {
        console.log(`  🔍 [DRY-RUN] ${wavPath} → ${mp3Path} | ${wavKB}KB → ${mp3KB}KB (−${saved}%)`);
        stats.converted++;
        stats.savedBytes += wavBuf.byteLength - mp3Data.byteLength;
        return;
      }

      // B1. Subir MP3
      const { error: uploadErr } = await supabase.storage
        .from('audios')
        .upload(mp3Path, mp3Data, { contentType: 'audio/mpeg', upsert: true });

      if (uploadErr) {
        console.error(`  ❌ Error subiendo ${mp3Path}: ${uploadErr.message}`);
        stats.errors++;
        return;
      }

      // B2. Actualizar audio_cache
      await fixAudioCacheUrl(wavUrl, mp3Url, stats);

      // B3. Eliminar WAV original
      const { error: delErr } = await supabase.storage.from('audios').remove([wavPath]);
      if (delErr) {
        console.warn(`  ⚠️  No se pudo borrar WAV ${wavPath}: ${delErr.message}`);
      } else {
        stats.wavDeleted++;
      }

      stats.converted++;
      stats.savedBytes += wavBuf.byteLength - mp3Data.byteLength;
      console.log(`  ✅ Convertido: ${wavPath} → ${mp3Path} | ${wavKB}KB → ${mp3KB}KB (−${saved}%)`);
    }

  } catch (err: any) {
    console.error(`  ❌ Error inesperado en ${wavPath}: ${err.message}`);
    stats.errors++;
  }
}

/**
 * Corrige en audio_cache cualquier fila que apunte a la URL WAV,
 * actualizándola a la URL MP3.
 * También detecta filas que ya apuntan al MP3 (y las cuenta como OK).
 */
async function fixAudioCacheUrl(wavUrl: string, mp3Url: string, stats: Stats): Promise<void> {
  // Buscar filas que aún apuntan al WAV
  const { data: rows, error: selErr } = await supabase
    .from('audio_cache')
    .select('id, url')
    .eq('url', wavUrl);

  if (selErr) {
    console.warn(`  ⚠️  No se pudo consultar audio_cache para ${wavUrl}: ${selErr.message}`);
    return;
  }

  if (!rows || rows.length === 0) {
    // Puede que ya apunte al MP3. Verificamos.
    const { count } = await supabase
      .from('audio_cache')
      .select('id', { count: 'exact', head: true })
      .eq('url', mp3Url);

    if ((count ?? 0) > 0) {
      // Ya apunta al MP3 correcto, nada que hacer
    } else {
      console.warn(`  ⚠️  Sin filas en audio_cache para WAV ni para MP3:`);
      console.warn(`      WAV: ${wavUrl}`);
      console.warn(`      MP3: ${mp3Url}`);
    }
    return;
  }

  // Actualizar las filas que apuntan al WAV → MP3
  const { error: updErr } = await supabase
    .from('audio_cache')
    .update({ url: mp3Url })
    .eq('url', wavUrl);

  if (updErr) {
    console.warn(`  ⚠️  Error actualizando audio_cache: ${updErr.message}`);
  } else {
    console.log(`  🗃️  audio_cache: ${rows.length} fila(s) corregidas → MP3`);
    stats.dbFixed += rows.length;
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  BDAI — Conversor de Audios WAV → MP3');
  if (DRY_RUN)   console.log('  🔍  MODO: DRY RUN — no se modificará nada');
  if (LIST_ONLY) console.log('  📋  MODO: LIST ONLY — solo se listan los WAVs');
  if (cityArg)   console.log(`  🏙️  Ciudad filtrada: ${cityArg}`);
  if (langArg)   console.log(`  🌐  Idioma filtrado: ${langArg}`);
  console.log(`  🔑  Clave: ${SERVICE_KEY ? 'SERVICE_ROLE_KEY ✓' : 'ANON_KEY (bucket público)'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── 1. Listar todos los ficheros ──────────────────────────────────────────
  // Si se filtró por ciudad, listar solo ese prefijo (más rápido)
  const prefix = cityArg ?? '';
  console.log(`📂 Escaneando bucket "audios"${cityArg ? ` → ${cityArg}/` : ''}...`);
  const allFiles = await listAllFiles('audios', prefix);

  if (allFiles.length === 0) {
    console.log('\n⚠️  No se encontraron ficheros.');
    if (cityArg) console.log(`   ¿Existe la carpeta "${cityArg}" en el bucket?`);
    return;
  }

  console.log(`   Total ficheros encontrados: ${allFiles.length}`);

  // ── 2. Separar WAVs y MPs3 y aplicar filtro de idioma ────────────────────
  const allPaths = new Set(allFiles.map(f => f.path));

  let wavFiles = allFiles.filter(f => f.path.toLowerCase().endsWith('.wav'));
  if (langArg) {
    wavFiles = wavFiles.filter(f => extractLang(f.path) === langArg);
  }

  if (wavFiles.length === 0) {
    console.log('\n✅ No hay ficheros WAV en los filtros aplicados. ¡Nada que hacer!\n');
    return;
  }

  // Para cada WAV, saber si ya existe el MP3
  const wavWithStatus = wavFiles.map(f => ({
    ...f,
    mp3Exists: allPaths.has(toMp3Path(f.path)),
  }));

  const withMp3    = wavWithStatus.filter(f => f.mp3Exists).length;
  const withoutMp3 = wavWithStatus.length - withMp3;
  console.log(`   WAVs encontrados: ${wavFiles.length}  (${withMp3} ya tienen MP3 en bucket, ${withoutMp3} a convertir)\n`);

  // ── 3. Modo LIST ONLY ─────────────────────────────────────────────────────
  if (LIST_ONLY) {
    console.log('📋 Detalle:\n');
    // Agrupar por ciudad → idioma
    const tree = new Map<string, Map<string, typeof wavWithStatus>>();
    for (const f of wavWithStatus) {
      const city = extractCity(f.path);
      const lang = extractLang(f.path);
      if (!tree.has(city)) tree.set(city, new Map());
      if (!tree.get(city)!.has(lang)) tree.get(city)!.set(lang, []);
      tree.get(city)!.get(lang)!.push(f);
    }
    for (const [city, langs] of [...tree.entries()].sort()) {
      console.log(`  📁 ${city}/`);
      for (const [lang, files] of [...langs.entries()].sort()) {
        const mp3Count = files.filter(f => f.mp3Exists).length;
        console.log(`    [${lang}]  ${files.length} WAV(s)  |  ${mp3Count} ya tienen MP3`);
        for (const f of files) {
          const tag = f.mp3Exists ? '♻️ [MP3 existe]' : '🔄 [convertir]';
          console.log(`       ${tag} ${f.path.split('/').pop()}`);
        }
      }
    }
    console.log();
    return;
  }

  // ── 4. Agrupar por idioma y procesar ─────────────────────────────────────
  const byLang = new Map<string, typeof wavWithStatus>();
  for (const f of wavWithStatus) {
    const lang = extractLang(f.path);
    if (!byLang.has(lang)) byLang.set(lang, []);
    byLang.get(lang)!.push(f);
  }

  const langsToProcess = [...byLang.keys()].sort();
  const globalStats: Stats[] = [];

  for (const lang of langsToProcess) {
    const files = byLang.get(lang)!;
    const stats: Stats = { lang, wavFound: files.length, alreadyMp3: 0, converted: 0, dbFixed: 0, wavDeleted: 0, errors: 0, savedBytes: 0 };

    console.log(`\n${'─'.repeat(62)}`);
    console.log(`🌐  Idioma: [${lang}]  |  ${files.length} WAV(s)`);
    console.log('─'.repeat(62));

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      console.log(`\n  [${String(i + 1).padStart(2)}/${files.length}] ${f.path}  ${f.mp3Exists ? '← MP3 ya existe' : ''}`);
      await processWavFile(f.path, f.mp3Exists, stats);
    }

    globalStats.push(stats);
  }

  // ── 5. Resumen ────────────────────────────────────────────────────────────
  const sum = (key: keyof Stats) => globalStats.reduce((a, s) => a + (s[key] as number), 0);

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  RESUMEN FINAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const pad  = (s: string | number, n: number) => String(s).padEnd(n);
  const padL = (s: string | number, n: number) => String(s).padStart(n);
  const HDR  = `  ${pad('Idioma', 8)} ${padL('WAVs', 5)} ${padL('♻️ MP3ok', 8)} ${padL('🔄 Conv', 7)} ${padL('🗃️ BD', 5)} ${padL('🗑️ Del', 6)} ${padL('❌ Err', 6)}`;
  console.log(HDR);
  console.log(`  ${'─'.repeat(HDR.length - 2)}`);
  for (const s of globalStats) {
    console.log(
      `  ${pad(s.lang, 8)} ${padL(s.wavFound, 5)} ${padL(s.alreadyMp3, 8)} ${padL(s.converted, 7)} ` +
      `${padL(s.dbFixed, 5)} ${padL(s.wavDeleted, 6)} ${padL(s.errors, 6)}`
    );
  }
  console.log(`  ${'─'.repeat(HDR.length - 2)}`);
  console.log(
    `  ${pad('TOTAL', 8)} ${padL(sum('wavFound'), 5)} ${padL(sum('alreadyMp3'), 8)} ${padL(sum('converted'), 7)} ` +
    `${padL(sum('dbFixed'), 5)} ${padL(sum('wavDeleted'), 6)} ${padL(sum('errors'), 6)}`
  );

  const savedMB = (sum('savedBytes') / 1024 / 1024).toFixed(2);
  if (sum('savedBytes') > 0) console.log(`\n  🏆 Espacio ahorrado: ${savedMB} MB`);
  if (DRY_RUN)               console.log('\n  ℹ️  DRY RUN: no se modificó nada en Supabase.');
  if (sum('errors') > 0) {
    console.log(`\n  ⚠️  ${sum('errors')} error(es). Revisa los mensajes anteriores.`);
    process.exit(1);
  } else {
    console.log('\n  ✅ Proceso completado.\n');
  }
}

main().catch(err => {
  console.error('\n❌  Error fatal:', err?.message ?? err);
  process.exit(1);
});
