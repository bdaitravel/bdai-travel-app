// scripts/testWorkerAiGcp.ts
// Script para probar la nueva Edge Function tour-worker-ai-02 (GCP Service Account)

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'tu_webhook_secret_aqui';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testWorker() {
  console.log("🚀 Iniciando prueba de tour-worker-ai-02...");

  // Simulamos un payload de webhook de INSERT en generation_jobs
  const mockPayload = {
    type: 'INSERT',
    record: {
      id: 'test-job-' + Date.now(),
      city_slug: 'soria_spain',
      language: 'es'
    }
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tour-worker-ai-02`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': WEBHOOK_SECRET
      },
      body: JSON.stringify(mockPayload)
    });

    const status = response.status;
    const body = await response.text();

    console.log(`\n--- RESULTADO ---`);
    console.log(`Status: ${status}`);
    console.log(`Cuerpo: ${body}`);

    if (status === 200) {
      console.log("\n✅ La Edge Function respondió correctamente.");
      console.log("Revisa los logs en Supabase para ver si Gemini generó los tours.");
    } else {
      console.log("\n❌ Hubo un error al llamar a la Edge Function.");
    }

  } catch (error) {
    console.error("Error en la petición:", error);
  }
}

testWorker();
