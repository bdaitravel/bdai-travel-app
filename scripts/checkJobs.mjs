import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);

(async () => {
  const { data } = await supabase.from('generation_jobs').select('*').eq('city_slug', 'malaga_spain').order('created_at', { ascending: false }).limit(1);
  console.log('JOB STATUS:', JSON.stringify(data, null, 2));
  process.exit(0);
})();
