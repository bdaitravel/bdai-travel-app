// scripts/fix-logrono-stops.mjs
// Corrige dos paradas mal geocodificadas en logrono_spain (en + es):
//   - Concatedral de Santa María de la Redonda → fachada Plaza del Mercado (norte)
//   - Bodegas Franco-Españolas → entrada Calle Cabo Noval (Places API, sin snap de calle)
// Recalcula la ruta del tour afectado.
// Uso: node scripts/fix-logrono-stops.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://slldavgsoxunkphqeamx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU1NTY2MSwiZXhwIjoyMDgwMTMxNjYxfQ.rfpnTCt0AuSC1AE2MZgYmU67ARZXWh2__pIf5CoHKTc';
const PLACES_API_KEY   = 'AIzaSyBytczKNs8oOO7r0sjGcehkW9VHZDVJqrA';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const LOGRONO = { lat: 42.46612, lon: -2.43967, radiusKm: 15.6 };

// ── Utils ─────────────────────────────────────────────────────────────────────
const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Places API v1 ─────────────────────────────────────────────────────────────
const searchPlaces = async (query) => {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress',
            'Referer': 'https://app.bdai.travel/',
        },
        body: JSON.stringify({
            textQuery: query,
            locationBias: {
                circle: {
                    center: { latitude: LOGRONO.lat, longitude: LOGRONO.lon },
                    radius: Math.round(LOGRONO.radiusKm * 1000),
                },
            },
            maxResultCount: 5,
        }),
    });
    if (!res.ok) throw new Error(`Places API ${res.status}: ${await res.text()}`);
    const d = await res.json();
    for (const p of (d.places || [])) {
        const lat = p.location.latitude;
        const lon = p.location.longitude;
        if (haversineKm(lat, lon, LOGRONO.lat, LOGRONO.lon) <= LOGRONO.radiusKm) {
            return { lat, lon, name: p.displayName?.text, address: p.formattedAddress };
        }
    }
    return null;
};

// ── OSM: fachada norte de edificio (nodo con mayor lat del polígono del edificio) ──
// La Concatedral da a la Plaza del Mercado por la fachada norte.
const getOSMBuildingNorthFace = async (lat, lon) => {
    const query = `[out:json][timeout:10];
(way["building"](around:80,${lat},${lon});
 way["historic"](around:80,${lat},${lon});
 way["amenity"="place_of_worship"](around:80,${lat},${lon}););
out geom;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });
        if (!res.ok) return null;
        const d = await res.json();
        if (!d.elements?.length) return null;

        const way = d.elements.find(e => e.geometry?.length > 0);
        if (!way) return null;

        // Nodo más al norte = fachada norte
        const northNode = way.geometry.reduce((best, node) =>
            node.lat > best.lat ? node : best, way.geometry[0]);

        // Centroide del polígono
        const centLat = way.geometry.reduce((s, n) => s + n.lat, 0) / way.geometry.length;
        const centLon = way.geometry.reduce((s, n) => s + n.lon, 0) / way.geometry.length;

        // Punto a 2/3 del camino entre centroide y nodo norte
        const entryLat = centLat + (northNode.lat - centLat) * 0.67;
        const entryLon = centLon + (northNode.lon - centLon) * 0.67;

        console.log(`  OSM centroide: (${centLat.toFixed(6)}, ${centLon.toFixed(6)})`);
        console.log(`  OSM nodo norte: (${northNode.lat.toFixed(6)}, ${northNode.lon.toFixed(6)})`);
        console.log(`  → Entrada fachada norte: (${entryLat.toFixed(6)}, ${entryLon.toFixed(6)})`);
        return { lat: entryLat, lon: entryLon };
    } catch (e) {
        console.log('  OSM error:', e.message);
        return null;
    }
};

// ── Ruta: NN + 2-opt + or-opt + OSRM polyline ────────────────────────────────
const buildMatrix = stops => {
    const n = stops.length;
    const m = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
            const d = haversineKm(stops[i].latitude, stops[i].longitude, stops[j].latitude, stops[j].longitude);
            m[i][j] = m[j][i] = d;
        }
    return m;
};

const nn = (stops, m) => {
    const n = stops.length;
    let best = [], bestD = Infinity;
    for (let s = 0; s < n; s++) {
        const vis = new Set(), ord = [];
        let cur = s;
        while (ord.length < n) {
            ord.push(cur); vis.add(cur);
            let minD = Infinity, nxt = -1;
            for (let j = 0; j < n; j++) if (!vis.has(j) && m[cur][j] < minD) { minD = m[cur][j]; nxt = j; }
            if (nxt === -1) break;
            cur = nxt;
        }
        let d = 0; for (let i = 0; i < ord.length - 1; i++) d += m[ord[i]][ord[i + 1]];
        if (d < bestD) { bestD = d; best = [...ord]; }
    }
    return best;
};

const twoOpt = (ord, m) => {
    const n = ord.length;
    let improved = true, r = [...ord];
    while (improved) {
        improved = false;
        for (let i = 0; i < n - 2; i++)
            for (let j = i + 2; j < n; j++) {
                if (j === n - 1 && i === 0) continue;
                const cur = m[r[i]][r[i + 1]] + m[r[j]][r[(j + 1) % n]];
                const nw  = m[r[i]][r[j]]     + m[r[i + 1]][r[(j + 1) % n]];
                if (nw < cur - 0.001) {
                    r = [...r.slice(0, i + 1), ...r.slice(i + 1, j + 1).reverse(), ...r.slice(j + 1)];
                    improved = true;
                }
            }
    }
    return r;
};

const orOpt = (ord, m) => {
    const dist = r => { let d = 0; for (let i = 0; i < r.length - 1; i++) d += m[r[i]][r[i + 1]]; return d; };
    let improved = true, r = [...ord];
    while (improved) {
        improved = false;
        for (let p = 0; p < r.length && !improved; p++) {
            const stop = r[p], wo = r.filter((_, i) => i !== p);
            let best = dist(r) - 0.001, bestQ = -1;
            for (let q = 0; q <= wo.length; q++) {
                const d = dist([...wo.slice(0, q), stop, ...wo.slice(q)]);
                if (d < best) { best = d; bestQ = q; }
            }
            if (bestQ !== -1) {
                const w = r.filter((_, i) => i !== p);
                r = [...w.slice(0, bestQ), stop, ...w.slice(bestQ)];
                improved = true;
            }
        }
    }
    return r;
};

const optimizeTour = async (stops) => {
    const m = buildMatrix(stops);
    let ord = nn(stops, m);
    ord = twoOpt(ord, m);
    ord = orOpt(ord, m);
    const optimized = ord.map(i => stops[i]);

    let distKm = 0;
    for (let i = 0; i < optimized.length - 1; i++)
        distKm += haversineKm(optimized[i].latitude, optimized[i].longitude,
                              optimized[i + 1].latitude, optimized[i + 1].longitude);

    let polyline = null;
    try {
        const coords = optimized.map(s => `${s.longitude},${s.latitude}`).join(';');
        const r = await fetch(
            `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=polyline`,
            { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } }
        );
        if (r.ok) { const d = await r.json(); if (d.code === 'Ok') polyline = d.routes?.[0]?.geometry; }
    } catch {}

    return { stops: optimized, distKm, polyline };
};

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n🔧  Fix paradas Logroño — Concatedral + Bodegas Franco-Españolas\n');

// ── 1. Obtener coordenadas corregidas ─────────────────────────────────────────

// Bodegas: Places API directamente (sin snap de calle — el snap la movió dentro del complejo)
console.log('📡 Bodegas Franco-Españolas en Places API...');
const bodegasResult = await searchPlaces('Bodegas Franco-Españolas, Logroño, Spain');
if (!bodegasResult) { console.error('❌ Bodegas no encontrada.'); process.exit(1); }
console.log(`  → ${bodegasResult.name}`);
console.log(`     ${bodegasResult.lat}, ${bodegasResult.lon} | ${bodegasResult.address}`);

await sleep(300);

// Concatedral: Places API + fachada norte OSM (hacia Plaza del Mercado)
console.log('\n📡 Concatedral de Santa María de la Redonda en Places API...');
const concatedralGP = await searchPlaces('Concatedral de Santa María de la Redonda, Logroño, Spain');
if (!concatedralGP) { console.error('❌ Concatedral no encontrada.'); process.exit(1); }
console.log(`  Places API: ${concatedralGP.lat}, ${concatedralGP.lon} | ${concatedralGP.address}`);

await sleep(300);

console.log('\n  Buscando fachada norte (Plaza del Mercado) en OSM...');
const concatedralNorth = await getOSMBuildingNorthFace(concatedralGP.lat, concatedralGP.lon);
const concatedralFinal = concatedralNorth || concatedralGP;

if (!concatedralNorth) {
    console.log('  (OSM sin datos — usando coordenadas Places API)');
}
console.log(`  → Final: ${concatedralFinal.lat.toFixed(6)}, ${concatedralFinal.lon.toFixed(6)}`);

// ── 2. Resumen de cambios ─────────────────────────────────────────────────────
const OLD_BODEGAS     = { lat: 42.472451,  lon: -2.446989  };
const OLD_CONCATEDRAL = { lat: 42.466761,  lon: -2.445519  };

console.log('\n📊 Cambios a aplicar:');
const dCon = Math.round(haversineKm(OLD_CONCATEDRAL.lat, OLD_CONCATEDRAL.lon, concatedralFinal.lat, concatedralFinal.lon) * 1000);
const dBod = Math.round(haversineKm(OLD_BODEGAS.lat, OLD_BODEGAS.lon, bodegasResult.lat, bodegasResult.lon) * 1000);
console.log(`  Concatedral: (${OLD_CONCATEDRAL.lat}, ${OLD_CONCATEDRAL.lon}) → (${concatedralFinal.lat.toFixed(6)}, ${concatedralFinal.lon.toFixed(6)})  Δ${dCon}m`);
console.log(`  Bodegas:     (${OLD_BODEGAS.lat}, ${OLD_BODEGAS.lon}) → (${bodegasResult.lat.toFixed(6)}, ${bodegasResult.lon.toFixed(6)})  Δ${dBod}m`);

// ── 3. Aplicar a en + es ──────────────────────────────────────────────────────
for (const lang of ['en', 'es']) {
    console.log(`\n🌐 logrono_spain / ${lang}`);

    const { data: row, error } = await supabase
        .from('tours_cache')
        .select('data, route_polylines')
        .eq('city', 'logrono_spain')
        .eq('language', lang)
        .single();

    if (error || !row) { console.error(`  ❌ Error leyendo: ${error?.message}`); continue; }

    const tours = row.data;
    const polylines = row.route_polylines || {};
    let anyChanged = false;

    for (const tour of tours) {
        let tourChanged = false;
        for (const stop of tour.stops) {
            if (stop.name === 'Concatedral de Santa María de la Redonda') {
                stop.latitude  = concatedralFinal.lat;
                stop.longitude = concatedralFinal.lon;
                stop.coordinatesVerified = true;
                console.log(`  ✅ Concatedral → (${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)})`);
                tourChanged = true; anyChanged = true;
            } else if (stop.name === 'Bodegas Franco-Españolas') {
                stop.latitude  = bodegasResult.lat;
                stop.longitude = bodegasResult.lon;
                stop.coordinatesVerified = true;
                console.log(`  ✅ Bodegas → (${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)})`);
                tourChanged = true; anyChanged = true;
            }
        }

        if (tourChanged) {
            console.log(`  🔄 Recalculando ruta: "${tour.title}"...`);
            const oldDist = tour.distance || '?';
            const { stops: newOrder, distKm, polyline } = await optimizeTour(tour.stops);
            tour.stops = newOrder;
            tour.distance = `${distKm.toFixed(1)} km`;
            const total = Math.round(distKm * 15 + newOrder.length * 7.5 + 20);
            const h = Math.floor(total / 60), m = total % 60;
            tour.duration = m > 0 ? `${h}h ${m}min` : `${h}h`;
            if (polyline && tour.id) polylines[tour.id] = polyline;
            console.log(`     ${oldDist} → ${tour.distance} | ${tour.duration}`);
            await sleep(400);
        }
    }

    if (!anyChanged) { console.log('  (sin cambios)'); continue; }

    const { error: saveErr } = await supabase
        .from('tours_cache')
        .update({ data: tours, route_polylines: polylines, updated_at: new Date().toISOString() })
        .eq('city', 'logrono_spain')
        .eq('language', lang);

    if (saveErr) console.error(`  ❌ Error guardando: ${saveErr.message}`);
    else console.log(`  💾 Guardado ✅`);
}

console.log('\n✅ Completado.\n');
