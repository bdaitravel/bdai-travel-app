
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://slldavgsoxunkphqeamx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU1NTY2MSwiZXhwIjoyMDgwMTMxNjYxfQ.rfpnTCt0AuSC1AE2MZgYmU67ARZXWh2__pIf5CoHKTc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkToursCache() {
  console.log('--- Verificando tours_cache ---');
  const { data, error } = await supabase
    .from('tours_cache')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error al leer tours_cache:', error);
  } else {
    console.log('Conexión exitosa. Primer registro encontrado:', data);
    if (data && data[0] && data[0].data) {
        const sampleTour = Array.isArray(data[0].data) ? data[0].data[0] : data[0].data;
        console.log('Campos en el objeto Tour:', Object.keys(sampleTour || {}));
    }
  }
}

checkToursCache();
