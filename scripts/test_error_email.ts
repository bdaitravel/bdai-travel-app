import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testErrorLogging() {
  console.log('🚀 Enviando error de prueba a Supabase...');
  
  const { data, error } = await supabase
    .from('error_logs')
    .insert([
      {
        error_message: '[AUTO] Prueba de integración SMTP - Todo OK',
        context: 'User-Agent: Antigravity Test Script\nURL: https://bdai.travel/test\nTimestamp: ' + new Date().toISOString(),
        user_email: 'test-admin@bdai.travel',
        language: 'es',
        url: 'https://bdai.travel/test-smtp'
      }
    ])
    .select();

  if (error) {
    console.error('❌ Error al insertar en Supabase:', error);
  } else {
    console.log('✅ Registro de error insertado correctamente:', data);
    console.log('🔔 Si el Webhook y la Edge Function están configurados, el email debería llegar en unos segundos.');
  }
}

testErrorLogging();
