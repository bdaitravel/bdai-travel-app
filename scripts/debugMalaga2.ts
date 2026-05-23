import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  const output: string[] = [];
  const log = (msg: string) => { output.push(msg); };

  // 1. tours_cache
  const { data: cache } = await db
    .from('tours_cache')
    .select('city, language, status, data, error_message, updated_at')
    .like('city', '%malaga%');

  log('=== TOURS_CACHE ===');
  if (cache) {
    for (const row of cache) {
      log(`City: ${row.city} | Lang: ${row.language} | Status: ${row.status}`);
      if (row.data && Array.isArray(row.data)) {
        for (const tour of row.data) {
          log(`  TOUR: "${tour.title}" | theme=${tour.theme} | city=${tour.city} | country=${tour.country}`);
          log(`  distance=${tour.distance} | duration=${tour.duration} | stops=${tour.stops?.length || 0}`);
          if (tour.stops) {
            for (let i = 0; i < tour.stops.length; i++) {
              const s = tour.stops[i];
              log(`    [${i+1}] ${s.name} | (${s.latitude?.toFixed(5)}, ${s.longitude?.toFixed(5)}) | type=${s.type} | verified=${s.coordinatesVerified}`);
            }
          }
        }
      }
    }
  }

  // 2. generation_jobs
  log('\n=== GENERATION_JOBS ===');
  const { data: jobs } = await db
    .from('generation_jobs')
    .select('id, city_slug, language, status, error_message, city_info, created_at')
    .like('city_slug', '%malaga%')
    .order('created_at', { ascending: false })
    .limit(3);

  if (jobs) {
    for (const job of jobs) {
      log(`Job ${job.id} | slug=${job.city_slug} | lang=${job.language} | status=${job.status}`);
      log(`  city_info: ${JSON.stringify(job.city_info)}`);
      if (job.error_message) log(`  error: ${job.error_message}`);
    }
  }

  // 3. Raw AI data
  log('\n=== RAW AI DATA (what Gemini generated) ===');
  const { data: rawJobs } = await db
    .from('generation_jobs')
    .select('raw_ai_data, city_info')
    .like('city_slug', '%malaga%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (rawJobs && rawJobs[0]?.raw_ai_data) {
    const rawTours = rawJobs[0].raw_ai_data;
    const ci = rawJobs[0].city_info;
    log(`CityInfo -> lat=${ci?.lat}, lon=${ci?.lon}, radiusKm=${ci?.radiusKm}`);
    log(`BBox -> ${JSON.stringify(ci?.bbox)}`);

    let totalAiStops = 0;
    for (const tour of rawTours) {
      const nStops = tour.stops?.length || 0;
      totalAiStops += nStops;
      log(`  AI TOUR: "${tour.title}" — ${nStops} stops`);
      if (tour.stops) {
        for (let i = 0; i < tour.stops.length; i++) {
          const s = tour.stops[i];
          log(`    [${i+1}] ${s.name} | (${s.latitude?.toFixed(5)}, ${s.longitude?.toFixed(5)}) | type=${s.type}`);
        }
      }
    }
    log(`\nTOTAL AI STOPS: ${totalAiStops}`);
  }

  // 4. Compare: which stops from AI survived GIS verification?
  log('\n=== COMPARISON: AI vs FINAL ===');
  if (rawJobs?.[0]?.raw_ai_data && cache?.[0]?.data) {
    const aiStopNames = new Set<string>();
    for (const tour of rawJobs[0].raw_ai_data) {
      for (const s of (tour.stops || [])) {
        aiStopNames.add(s.name);
      }
    }
    const finalStopNames = new Set<string>();
    for (const tour of cache[0].data) {
      for (const s of (tour.stops || [])) {
        finalStopNames.add(s.name);
      }
    }
    const dropped = [...aiStopNames].filter(n => !finalStopNames.has(n));
    const kept = [...finalStopNames];
    log(`AI generated: ${aiStopNames.size} unique stops`);
    log(`Final (after GIS): ${finalStopNames.size} stops`);
    log(`KEPT: ${kept.join(', ')}`);
    log(`DROPPED by GIS: ${dropped.join(', ')}`);
  }

  const report = output.join('\n');
  writeFileSync('scripts/malaga_debug_report.txt', report, 'utf-8');
  console.log(report);
}

main().catch(e => { console.error(e); process.exit(1); });
