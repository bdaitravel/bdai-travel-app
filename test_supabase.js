const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://slldavgsoxunkphqeamx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing Supabase with Anon Key...');
  const { data, error } = await supabase
    .from('tours_cache')
    .upsert({ 
      city: 'test_connection', 
      language: 'es', 
      data: [{ id: 'test', title: 'Test Connection' }],
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Success! RLS is likely disabled or allows inserts.');
    process.exit(0);
  }
}

test();
