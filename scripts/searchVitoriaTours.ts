// scripts/searchVitoriaTours.ts
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function search() {
  console.log("🔍 Buscando registros en tours_cache que contengan 'vitoria'...");
  const { data: cacheData, error: cacheError } = await supabase
    .from('tours_cache')
    .select('city, language, status, updated_at');
    
  if (cacheError) {
    console.error("Error cache:", cacheError);
    return;
  }
  
  const vitoriaCache = cacheData.filter(r => r.city.toLowerCase().includes('vitoria'));
  console.log("Coincidencias en tours_cache:", vitoriaCache);

  console.log("\n🔍 Buscando registros en generation_jobs que contengan 'vitoria'...");
  const { data: jobsData, error: jobsError } = await supabase
    .from('generation_jobs')
    .select('id, city_slug, language, status, created_at');
    
  if (jobsError) {
    console.error("Error jobs:", jobsError);
    return;
  }
  
  const vitoriaJobs = jobsData.filter(r => r.city_slug.toLowerCase().includes('vitoria'));
  console.log("Coincidencias en generation_jobs:", vitoriaJobs);
}

search();
