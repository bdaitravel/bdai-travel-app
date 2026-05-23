import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  // 1. Check tours_cache for malaga
  console.log('\n═══ TOURS_CACHE ═══');
  const { data: cache, error: cacheErr } = await db
    .from('tours_cache')
    .select('city, language, status, data, error_message, updated_at')
    .like('city', '%malaga%');

  if (cacheErr) console.error('Error:', cacheErr);
  
  if (cache) {
    for (const row of cache) {
      console.log(`\nCity: ${row.city} | Lang: ${row.language} | Status: ${row.status} | Updated: ${row.updated_at}`);
      if (row.error_message) console.log(`  Error: ${row.error_message}`);
      
      if (row.data && Array.isArray(row.data)) {
        for (const tour of row.data) {
          console.log(`\n  📌 Tour: "${tour.title}"`);
          console.log(`     Theme: ${tour.theme} | City: ${tour.city} | Country: ${tour.country}`);
          console.log(`     Distance: ${tour.distance} | Duration: ${tour.duration}`);
          console.log(`     Stops: ${tour.stops?.length || 0}`);
          
          if (tour.stops) {
            for (const stop of tour.stops) {
              console.log(`       - ${stop.name} (${stop.latitude?.toFixed(5)}, ${stop.longitude?.toFixed(5)}) [${stop.type}] verified=${stop.coordinatesVerified}`);
            }
          }
        }
      }
    }
  }

  // 2. Check generation_jobs for malaga
  console.log('\n\n═══ GENERATION_JOBS ═══');
  const { data: jobs, error: jobErr } = await db
    .from('generation_jobs')
    .select('id, city_slug, language, status, error_message, city_info, created_at, updated_at')
    .like('city_slug', '%malaga%')
    .order('created_at', { ascending: false })
    .limit(3);

  if (jobErr) console.error('Error:', jobErr);
  
  if (jobs) {
    for (const job of jobs) {
      console.log(`\nJob ${job.id}`);
      console.log(`  Slug: ${job.city_slug} | Lang: ${job.language} | Status: ${job.status}`);
      console.log(`  City Info:`, JSON.stringify(job.city_info, null, 2));
      if (job.error_message) console.log(`  Error: ${job.error_message}`);
    }
  }

  // 3. Check raw_ai_data from the latest job to see what AI generated vs what GIS kept
  console.log('\n\n═══ RAW AI DATA (latest job) ═══');
  const { data: rawJobs } = await db
    .from('generation_jobs')
    .select('raw_ai_data, city_info')
    .like('city_slug', '%malaga%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (rawJobs && rawJobs[0]?.raw_ai_data) {
    const rawTours = rawJobs[0].raw_ai_data;
    const cityInfo = rawJobs[0].city_info;
    console.log(`City Info used: lat=${cityInfo?.lat}, lon=${cityInfo?.lon}, radiusKm=${cityInfo?.radiusKm}`);
    console.log(`BBox: ${JSON.stringify(cityInfo?.bbox)}`);
    
    for (const tour of rawTours) {
      console.log(`\n  🤖 AI Tour: "${tour.title}" — ${tour.stops?.length || 0} stops`);
      if (tour.stops) {
        for (const stop of tour.stops) {
          console.log(`       - ${stop.name} (${stop.latitude?.toFixed(5)}, ${stop.longitude?.toFixed(5)}) [${stop.type}]`);
        }
      }
    }
  } else {
    console.log('No raw AI data found.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
