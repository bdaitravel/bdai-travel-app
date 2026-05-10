/**
 * seedTours.ts — BDAI offline tour pre-seeder
 *
 * Usage:
 *   npx tsx scripts/seedTours.ts [path/to/cities.txt]
 *
 * Required .env vars (or export before running):
 *   VITE_SUPABASE_URL   (or SUPABASE_URL)
 *   VITE_SUPABASE_ANON_KEY  (or SUPABASE_ANON_KEY)   — for edge function calls
 *   SUPABASE_SERVICE_ROLE_KEY                          — for direct DB writes
 *   VITE_GEMINI_API_KEY (or GEMINI_API_KEY)           — for translation
 *
 * cities.txt format — one entry per line:
 *   Madrid, Spain
 *   Paris, France
 *   # lines starting with # are ignored
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stop {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: string;
  visited: boolean;
  coordinatesVerified?: boolean;
  [key: string]: unknown;
}

interface Tour {
  id: string;
  city: string;
  country?: string;
  title: string;
  description: string;
  duration: string;
  distance: string;
  difficulty: string;
  theme: string;
  stops: Stop[];
  isEssential?: boolean;
  routePolyline?: string;
  routeMode?: string;
  [key: string]: unknown;
}

// ── Environment ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const GEMINI_KEY   = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error('❌  Missing env vars. Required:');
  if (!SUPABASE_URL) console.error('   VITE_SUPABASE_URL (or SUPABASE_URL)');
  if (!SERVICE_KEY)  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  if (!ANON_KEY)     console.error('   VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)  [for edge functions]');
  if (!GEMINI_KEY)   console.error('   VITE_GEMINI_API_KEY (or GEMINI_API_KEY)');
  process.exit(1);
}

// Two clients: service_role for DB reads/writes, anon for Edge Functions
const db   = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const edge = createClient(SUPABASE_URL, ANON_KEY || SERVICE_KEY, { auth: { persistSession: false } });

// ── Utilities ─────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const log = (label: string, msg: string) =>
  console.log(`[${label.padEnd(22).slice(0, 22)}] ${msg}`);

const normalizeKey = (city: string, country: string): string => {
  const clean = (s: string) =>
    s.toLowerCase()
     .normalize('NFD').replace(/[̀-ͯ]/g, '')
     .replace(/[\s\-\/\\]+/g, '_')
     .replace(/[^a-z0-9_]/g, '')
     .trim();
  const c  = clean(city);
  const co = clean(country);
  if (!co || co === 'cache') return c;
  if (c.endsWith(`_${co}`)) return c;
  return `${c}_${co}`;
};

// ── Step 1 — Ensure Spanish tours exist ───────────────────────────────────────

async function ensureSpanishTours(
  cityName: string, country: string, slug: string
): Promise<Tour[] | null> {
  const { data: existing } = await db
    .from('tours_cache')
    .select('status, data')
    .eq('city', slug)
    .eq('language', 'es')
    .maybeSingle();

  if (existing?.status === 'READY' && (existing.data as Tour[])?.length > 0) {
    log(cityName, `✅ ES tours already cached`);
    return existing.data as Tour[];
  }

  log(cityName, `🚀 Triggering tour generation (es)...`);
  const { error } = await edge.functions.invoke('tour-orchestrator', {
    body: { city: cityName, country, language: 'es', slug }
  });

  if (error) {
    log(cityName, `❌ Orchestrator error: ${error.message}`);
    return null;
  }

  // Poll — max 15 min at 15s intervals (60 attempts)
  for (let i = 1; i <= 60; i++) {
    await sleep(15_000);
    const { data } = await db
      .from('tours_cache')
      .select('status, data')
      .eq('city', slug)
      .eq('language', 'es')
      .maybeSingle();

    const status: string = data?.status ?? 'unknown';
    log(cityName, `  ⏳ Poll ${i}/60: ${status}`);

    if (status === 'READY' && (data!.data as Tour[])?.length > 0) {
      log(cityName, `✅ ES generation complete`);
      return data!.data as Tour[];
    }
    if (status === 'ERROR') {
      log(cityName, `❌ Generation failed (ERROR status)`);
      return null;
    }
  }

  log(cityName, `❌ Timeout waiting for ES tours (15 min)`);
  return null;
}

// ── Step 2 — Generate audio for all stops ─────────────────────────────────────

async function generateAudioForTours(
  cityName: string, tours: Tour[], lang: string
): Promise<void> {
  const stops = tours.flatMap(t => t.stops).filter(s => s.description);
  log(cityName, `🎙️  Generating audio — ${stops.length} stops (${lang})`);

  let ok = 0;
  for (const stop of stops) {
    try {
      const { data, error } = await edge.functions.invoke('generate-audio-dai', {
        body: { text: stop.description, language: lang, city: cityName }
      });
      if (error) throw new Error(error.message);
      if (data?.url) ok++;
    } catch (e: any) {
      log(cityName, `  ⚠️  Audio failed for "${stop.name}": ${e.message}`);
    }
    await sleep(400); // stay well below Gemini TTS rate limit
  }

  log(cityName, `  ✅ Audio: ${ok}/${stops.length} stops (${lang})`);
}

// ── Step 3 — Translate ES tours to EN via Gemini ──────────────────────────────

async function translateToEnglish(cityName: string, tours: Tour[]): Promise<Tour[]> {
  log(cityName, `🌐 Translating to English...`);

  // Send only translatable fields to keep the prompt minimal
  const slim = tours.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    theme: t.theme,
    stops: t.stops.map(s => ({ id: s.id, name: s.name, description: s.description }))
  }));

  const prompt = `Translate the following Spanish travel tour data to English.
Return ONLY a valid JSON array with the same structure.
Rules:
- Translate: title, description, theme, stop.name, stop.description
- Replace "_es_" with "_en_" in all id strings
- Leave coordinates, types, distances, durations and all other numeric/boolean fields untouched
- Preserve the exact same array length and object structure

${JSON.stringify(slim)}`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini translation error ${res.status}: ${err.slice(0, 200)}`);
  }

  const resJson = await res.json();
  const rawText: string = resJson.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';

  let translated: { id: string; title: string; description: string; theme: string; stops: { id: string; name: string; description: string }[] }[];
  try {
    translated = JSON.parse(rawText);
  } catch {
    // Strip markdown fences if Gemini wrapped the JSON
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    translated = match ? JSON.parse(match[1]) : [];
  }

  if (!translated.length) throw new Error('Gemini returned empty translation');

  // Merge translated text back into full tour structures (keep all non-text fields)
  return tours.map((tour, i) => {
    const tr = translated[i];
    if (!tr) return tour;
    return {
      ...tour,
      id:          tr.id          || tour.id.replace(/_es_/g, '_en_'),
      title:       tr.title       || tour.title,
      description: tr.description || tour.description,
      theme:       tr.theme       || tour.theme,
      stops: tour.stops.map((stop, j) => ({
        ...stop,
        id:          tr.stops?.[j]?.id          || stop.id.replace(/_es_/g, '_en_'),
        name:        tr.stops?.[j]?.name        || stop.name,
        description: tr.stops?.[j]?.description || stop.description,
      }))
    };
  });
}

// ── Step 4 — Upsert English tours to tours_cache ──────────────────────────────

async function upsertEnglishTours(slug: string, tours: Tour[]): Promise<void> {
  const { error } = await db.from('tours_cache').upsert({
    city: slug,
    language: 'en',
    status: 'READY',
    data: tours,
    updated_at: new Date().toISOString()
  }, { onConflict: 'city, language' });

  if (error) throw new Error(`tours_cache upsert failed: ${error.message}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const citiesFile = process.argv[2] ?? join(__dirname, 'cities.txt');

  if (!existsSync(citiesFile)) {
    console.error(`❌  Cities file not found: ${citiesFile}`);
    console.error('    Create scripts/cities.txt with lines like:  Madrid, Spain');
    process.exit(1);
  }

  const lines = readFileSync(citiesFile, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  BDAI Tour Seeder — ${lines.length} cities`);
  console.log(`${'═'.repeat(60)}\n`);

  for (const line of lines) {
    const comma = line.lastIndexOf(',');
    if (comma === -1) {
      console.warn(`⚠️  Skipping: "${line}"  (expected "City, Country")`);
      continue;
    }
    const cityName = line.slice(0, comma).trim();
    const country  = line.slice(comma + 1).trim();
    const slug     = normalizeKey(cityName, country);

    console.log(`\n── ${cityName}, ${country}  [${slug}]`);

    try {
      // 1. Ensure Spanish tours exist (generate if missing, poll until READY)
      const esTours = await ensureSpanishTours(cityName, country, slug);
      if (!esTours) { log(cityName, '⏭️  Skipping — no ES tours'); continue; }

      // 2. Generate Spanish audio for every stop
      await generateAudioForTours(cityName, esTours, 'es');

      // 3. English tours: translate from ES if not already seeded
      const { data: existingEn } = await db
        .from('tours_cache')
        .select('status, data')
        .eq('city', slug)
        .eq('language', 'en')
        .maybeSingle();

      let enTours: Tour[];
      if (existingEn?.status === 'READY' && (existingEn.data as Tour[])?.length > 0) {
        log(cityName, `✅ EN tours already cached`);
        enTours = existingEn.data as Tour[];
      } else {
        enTours = await translateToEnglish(cityName, esTours);
        await upsertEnglishTours(slug, enTours);
        log(cityName, `✅ EN tours saved (${enTours.length} tours)`);
      }

      // 4. Generate English audio for every stop
      await generateAudioForTours(cityName, enTours, 'en');

      log(cityName, '🎉 Done');

    } catch (e: any) {
      log(cityName, `❌ Error: ${e.message}`);
    }

    await sleep(2_000); // brief cooldown between cities
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  Seeding complete!');
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
