// scripts/fix-polylines.mjs
// Regenera los OSRM polylines de una o más ciudades sin re-optimizar el orden de paradas.
// También aplica reordenaciones manuales de paradas definidas en MANUAL_SWAPS.
//
// Uso: node scripts/fix-polylines.mjs <city_slug> [city_slug2 ...]
// Ejemplo: node scripts/fix-polylines.mjs madrid_spain
//          node scripts/fix-polylines.mjs logrono_spain soria_spain madrid_spain

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://slldavgsoxunkphqeamx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU1NTY2MSwiZXhwIjoyMDgwMTMxNjYxfQ.rfpnTCt0AuSC1AE2MZgYmU67ARZXWh2__pIf5CoHKTc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Reordenaciones manuales de paradas ───────────────────────────────────────
// Estructura: { city_slug: { language: [ { tourIndex (0-based), swaps: [[a,b],...] (1-based) } ] } }
// Los swaps se aplican en orden secuencial dentro del mismo tour.
// Si una ciudad/idioma no tiene entrada aquí, solo se regeneran los polylines.
const MANUAL_SWAPS = {
    // Sin swaps pendientes — solo regenerar polylines con el servidor correcto.
};

// ── Utils ─────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const calcDuration = (distKm, nStops) => {
    const total = Math.round(distKm * 12 + nStops * 10); // 5 km/h + 10 min/parada
    if (total < 60) return `${total} min`;
    const h = Math.floor(total / 60), m = total % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

// ── Intercambio de paradas (índices 1-based → 0-based internamente) ───────────
const applySwaps = (stops, swaps) => {
    const s = [...stops];
    for (const [a, b] of swaps) {
        [s[a - 1], s[b - 1]] = [s[b - 1], s[a - 1]];
    }
    return s;
};

// ── OSRM walking route ────────────────────────────────────────────────────────
const fetchOsrmPolyline = async (stops) => {
    const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
    try {
        const res = await fetch(
            `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=polyline`,
            { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } }
        );
        if (!res.ok) return null;
        const d = await res.json();
        if (d.code !== 'Ok' || !d.routes?.[0]) return null;
        return {
            polyline: d.routes[0].geometry,
            distKm: d.routes[0].distance / 1000,
        };
    } catch { return null; }
};

// ── Main ──────────────────────────────────────────────────────────────────────
const citySlugs = process.argv.slice(2);
if (!citySlugs.length) {
    console.error('\nUso: node scripts/fix-polylines.mjs <city_slug> [city_slug2 ...]\n');
    process.exit(1);
}

for (const citySlug of citySlugs) {
    console.log(`\n${'═'.repeat(64)}`);
    console.log(`🗺️  ${citySlug}`);
    console.log('═'.repeat(64));

    const { data: rows, error } = await supabase
        .from('tours_cache')
        .select('language, data, route_polylines')
        .eq('city', citySlug)
        .eq('status', 'READY');

    if (error) { console.error(`  ❌ Error: ${error.message}`); continue; }
    if (!rows?.length) { console.log('  Sin filas READY.'); continue; }

    for (const row of rows) {
        const { language, data: tours } = row;
        const langSwaps = MANUAL_SWAPS[citySlug]?.[language] ?? [];
        console.log(`\n  🌐 ${language} | ${tours.length} tours`);

        const newPolylines = { ...(row.route_polylines || {}) };

        for (let ti = 0; ti < tours.length; ti++) {
            const tour = tours[ti];
            const tourSwapConfig = langSwaps.find(c => c.tourIndex === ti);

            if (tourSwapConfig) {
                console.log(`\n  📍 [${ti + 1}] "${tour.title}" — ${tourSwapConfig.swaps.length} intercambio(s):`);
                const before = tour.stops.map(s => s.name);
                tour.stops = applySwaps(tour.stops, tourSwapConfig.swaps);
                for (const [a, b] of tourSwapConfig.swaps) {
                    console.log(`     parada ${a} "${before[a - 1]}" ↔ parada ${b} "${before[b - 1]}"`);
                }
            } else {
                console.log(`\n  📍 [${ti + 1}] "${tour.title}" — sin cambios de orden`);
            }

            process.stdout.write(`     🔄 OSRM polyline...`);
            const osrm = await fetchOsrmPolyline(tour.stops);
            if (osrm) {
                const oldDist = tour.distance;
                tour.distance = `${osrm.distKm.toFixed(1)} km`;
                tour.duration = calcDuration(osrm.distKm, tour.stops.length);
                if (tour.id) newPolylines[tour.id] = osrm.polyline;
                const lenOk = osrm.polyline.length > 50 ? '✅' : '⚠️ corto';
                console.log(` ${lenOk}  ${oldDist ?? '?'} → ${tour.distance} | ${tour.duration} (${osrm.polyline.length} chars)`);
            } else {
                console.log(` ⚠️  OSRM falló, polyline anterior sin cambios`);
            }

            await sleep(500);
        }

        process.stdout.write(`\n  💾 Guardando ${citySlug}/${language}...`);
        const { error: saveErr } = await supabase
            .from('tours_cache')
            .update({
                data: tours,
                route_polylines: newPolylines,
                updated_at: new Date().toISOString(),
            })
            .eq('city', citySlug)
            .eq('language', language);

        console.log(saveErr ? ` ❌ ${saveErr.message}` : ' ✅');
    }
}

console.log('\n✅ Completado.\n');
