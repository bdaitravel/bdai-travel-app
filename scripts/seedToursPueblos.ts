// scripts/seedToursPueblos.ts
// Script para generar tours masivamente usando el nuevo orquestador GCP (-02)

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// LISTA DE PUEBLOS A GENERAR
const PUEBLOS = [
  { city: 'Burgo de Osma', country: 'Spain' },
  { city: 'Almazán', country: 'Spain' },
  { city: 'Medinaceli', country: 'Spain' },
  { city: 'Berlanga de Duero', country: 'Spain' }
];

const LANGUAGE = 'es';

async function seedTours() {
  console.log(`🚀 Iniciando generación masiva para ${PUEBLOS.length} pueblos...`);

  for (const pueblo of PUEBLOS) {
    console.log(`\n--------------------------------------------`);
    console.log(`🏙️  Procesando: ${pueblo.city}, ${pueblo.country}...`);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/tour-orchestrator-02`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          city: pueblo.city,
          country: pueblo.country,
          language: LANGUAGE
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Encolado correctamente: ${data.slug}`);
      } else {
        console.error(`❌ Error al encolar ${pueblo.city}:`, data.error);
      }
    } catch (error) {
      console.error(`❌ Error de conexión para ${pueblo.city}:`, error);
    }

    // Pequeño delay para no saturar
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n--------------------------------------------`);
  console.log(`🎉 Proceso de encolado finalizado.`);
  console.log(`Los tours se generarán en segundo plano en Supabase.`);
}

seedTours();
