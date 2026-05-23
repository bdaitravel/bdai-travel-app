import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);

(async () => {
  const { data } = await supabase.from('generation_jobs').select('*').eq('city_slug', 'malaga_spain').limit(1);
  if (!data || data.length === 0) { console.log('nada'); return; }
  const job = data[0];
  console.log('Job found:', job.status);
  
  if (job.status === 'PENDING_AI_02') {
      try {
          const res = await fetch('https://slldavgsoxunkphqeamx.supabase.co/functions/v1/tour-worker-ai-02', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + serviceKey,
              'x-webhook-secret': process.env.WEBHOOK_SECRET || ''
            },
            body: JSON.stringify({ type: 'INSERT', record: job })
          });
          console.log('Status AI:', res.status, await res.text());
      } catch (e) {
          console.error("Fetch failed:", e);
      }
  }
})();
