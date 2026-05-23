// fix-logrono-stops.mjs — restauración + corrección manual de 2 paradas en Logroño
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://slldavgsoxunkphqeamx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU1NTY2MSwiZXhwIjoyMDgwMTMxNjYxfQ.rfpnTCt0AuSC1AE2MZgYmU67ARZXWh2__pIf5CoHKTc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Coordenadas correctas por nombre exacto
// Las 15 primeras: restauradas del run anterior (snap OSRM correcto)
// Concatedral y Plaza del Mercado: corrección manual solicitada por el usuario
const CORRECT_COORDS = {
    'Murallas del Revellín y Puerta del Revellín': { latitude: 42.466866,  longitude: -2.450019 },
    'Parlamento de La Rioja (Antiguo Convento de la Merced)': { latitude: 42.46664,   longitude: -2.449623 },
    // Corrección manual: entrada fachada sur → Calle Portales
    'Concatedral de Santa María de la Redonda':   { latitude: 42.46649,   longitude: -2.44533  },
    // Corrección manual: centroide real de la plaza
    'Plaza del Mercado':                          { latitude: 42.46679,   longitude: -2.44583  },
    'Antiguo Palacio de los Chapiteles':          { latitude: 42.466425,  longitude: -2.443587 },
    'Iglesia de San Bartolomé':                   { latitude: 42.467283,  longitude: -2.443797 },
    'Puente de Piedra':                           { latitude: 42.470381,  longitude: -2.443855 },
    'Casa de la Danza':                           { latitude: 42.468602,  longitude: -2.44546  },
    'Fuente de los Peregrinos (Plaza de Santiago)': { latitude: 42.4676352, longitude: -2.4473089 },
    'Iglesia de Santiago el Real':                { latitude: 42.467667,  longitude: -2.447579 },
    'Bodegas Franco-Españolas':                   { latitude: 42.472451,  longitude: -2.446989 },
    'Casa de las Ciencias':                       { latitude: 42.471199,  longitude: -2.44555  },
    'Calado de San Gregorio':                     { latitude: 42.468241,  longitude: -2.445237 },
    'Centro de la Cultura del Rioja (CCR)':       { latitude: 42.467696,  longitude: -2.445538 },
    'Mercado de San Blas':                        { latitude: 42.4657861, longitude: -2.4469235 },
    'Museo de La Rioja':                          { latitude: 42.46596,   longitude: -2.448663 },
    'Plaza de la Oca (en Plaza de Santiago)':     { latitude: 42.4680813, longitude: -2.4475515 },
};

function haversineM(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function main() {
    console.log('\n🔧 Restauración + fix manual — Logroño\n');

    const { data: row, error } = await supabase
        .from('tours_cache')
        .select('*')
        .eq('city', 'logrono_spain')
        .eq('language', 'es')
        .single();

    if (error) { console.error('Error leyendo tours_cache:', error); process.exit(1); }

    let fixed = 0, skipped = 0;
    const updatedData = row.data.map(tour => ({
        ...tour,
        stops: (tour.stops || []).map(stop => {
            const coords = CORRECT_COORDS[stop.name];
            if (!coords) {
                console.log(`   ⏭  ${stop.name} (sin cambio)`);
                skipped++;
                return stop;
            }
            const distM = Math.round(haversineM(stop.latitude, stop.longitude, coords.latitude, coords.longitude));
            const tag = distM > 5 ? `⬆  Δ${distM}m` : `≈ ok`;
            console.log(`   ✅ ${stop.name.substring(0, 50).padEnd(50)} ${tag}`);
            fixed++;
            return { ...stop, ...coords };
        }),
    }));

    console.log(`\nCorregidas: ${fixed} | Sin cambio: ${skipped}\n`);

    const { error: updateErr } = await supabase
        .from('tours_cache')
        .update({ data: updatedData, updated_at: new Date().toISOString() })
        .eq('city', 'logrono_spain')
        .eq('language', 'es');

    if (updateErr) { console.error('Error guardando:', updateErr); process.exit(1); }
    console.log('💾 Guardado en Supabase.\n');
}

main().catch(err => { console.error('Error fatal:', err); process.exit(1); });
