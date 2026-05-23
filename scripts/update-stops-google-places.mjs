// scripts/update-stops-google-places.mjs
// Verifica coordenadas de todas las paradas en tours_cache via Google Places API,
// recalcula rutas optimizadas (NN + 2-opt + or-opt + OSRM) y guarda en Supabase.
// Uso: node scripts/update-stops-google-places.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://slldavgsoxunkphqeamx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU1NTY2MSwiZXhwIjoyMDgwMTMxNjYxfQ.rfpnTCt0AuSC1AE2MZgYmU67ARZXWh2__pIf5CoHKTc';
const PLACES_API_KEY   = 'AIzaSyBytczKNs8oOO7r0sjGcehkW9VHZDVJqrA';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Utils ─────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// ── Google Places API (New) v1: searchText → fachada/entrada principal ────────
const verifyWithGooglePlaces = async (stop, city, country, cityInfo) => {
    if (!stop.latitude || !stop.longitude) return null;

    const radiusKm = cityInfo.radiusKm || 5;
    const radiusM  = Math.min(Math.round(radiusKm * 1000), 50000);

    try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.location',
                'Referer': 'https://www.bdai.travel/',
            },
            body: JSON.stringify({
                textQuery: `${stop.name}, ${city}, ${country}`,
                locationBias: {
                    circle: {
                        center: { latitude: cityInfo.lat, longitude: cityInfo.lon },
                        radius: radiusM,
                    },
                },
                maxResultCount: 1,
            }),
        });
        if (!res.ok) return null;

        const data = await res.json();
        if (!data.places?.length) return null;

        const { latitude: lat, longitude: lng } = data.places[0].location;
        const distToCenter = haversineKm(lat, lng, cityInfo.lat, cityInfo.lon);

        if (distToCenter <= radiusKm) {
            return { ...stop, latitude: lat, longitude: lng };
        }
        return null;

    } catch (e) {
        return null;
    }
};

// ── OSM Overpass: entrada principal y centros de espacios abiertos ────────────
const isOpenSpaceStop = (stop) => {
    const name = (stop.name || '').toLowerCase();
    return /plaza|platz|plein|piazza|square|markt|march[eé]|mercado|jard[ií]n|jardin|park|parque|jardim|campo|pra[çc]a|cours|esplanade/.test(name);
};

const getOSMEntrance = async (lat, lon) => {
    // Query relacional: busca edificios/históricos/turismo cerca y extrae sus nodos entrada
    const query = `[out:json][timeout:8];(nwr(around:150,${lat},${lon})["building"];nwr(around:150,${lat},${lon})["historic"];nwr(around:150,${lat},${lon})["tourism"];)->.pois;(node(w.pois)["entrance"~"main|yes|visitor|public"];node(r.pois)["entrance"~"main|yes|visitor|public"];);out body;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });
        if (res.ok) {
            const d = await res.json();
            if (d.elements?.length) {
                const main = d.elements.find(e => e.tags?.entrance === 'main');
                const visitor = d.elements.find(e => e.tags?.entrance === 'visitor' || e.tags?.entrance === 'public');
                const el = main || visitor || d.elements[0];
                return { lat: el.lat, lon: el.lon };
            }
        }
    } catch {}

    // Fallback: caja ampliada (~120m)
    const delta = 0.0015;
    const fallbackQuery = `[out:json][timeout:8];node["entrance"~"main|yes|visitor|public"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});out body;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(fallbackQuery)}`,
        });
        if (res.ok) {
            const d = await res.json();
            if (d.elements?.length) {
                const main = d.elements.find(e => e.tags?.entrance === 'main');
                const el = main || d.elements[0];
                return { lat: el.lat, lon: el.lon };
            }
        }
    } catch {}
    return null;
};

const snapToNearestStreet = async (lat, lon) => {
    try {
        const res = await fetch(
            `https://routing.openstreetmap.de/routed-foot/nearest/v1/foot/${lon},${lat}?number=1`,
            { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } }
        );
        if (res.ok) {
            const d = await res.json();
            if (d.code === 'Ok' && d.waypoints?.length) {
                const [snapLon, snapLat] = d.waypoints[0].location;
                const dist = haversineKm(lat, lon, snapLat, snapLon);
                if (dist <= 0.12) return { lat: snapLat, lon: snapLon };
            }
        }
    } catch {}
    return null;
};

const refineCoordinates = async (stop, lat, lon) => {
    if (isOpenSpaceStop(stop)) {
        const center = await getOSMAreaCenter(lat, lon);
        if (center) {
            console.log(`     🗺️  ${stop.name.substring(0, 38).padEnd(38)} OSM área → centroide`);
            return { lat: center.lat, lon: center.lon };
        }
    } else {
        const entrance = await getOSMEntrance(lat, lon);
        if (entrance) {
            console.log(`     🚪 ${stop.name.substring(0, 38).padEnd(38)} OSM entrada principal`);
            return { lat: entrance.lat, lon: entrance.lon };
        }
        const snapped = await snapToNearestStreet(lat, lon);
        if (snapped) {
            console.log(`     🧲 ${stop.name.substring(0, 38).padEnd(38)} snap acera OSRM`);
            return { lat: snapped.lat, lon: snapped.lon };
        }
    }
    return { lat, lon };
};

const getOSMAreaCenter = async (lat, lon) => {
    const delta = 0.002; // ~200 m
    const query = `[out:json][timeout:8];(way["place"~"square|marketplace"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});way["leisure"="park"](${lat - delta},${lon - delta},${lat + delta},${lon + delta}););out center;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });
        if (!res.ok) return null;
        const d = await res.json();
        if (!d.elements?.length) return null;
        let best = null, bestDist = Infinity;
        for (const el of d.elements) {
            if (!el.center) continue;
            const dist = haversineKm(el.center.lat, el.center.lon, lat, lon);
            if (dist < bestDist) { bestDist = dist; best = el; }
        }
        if (!best || bestDist > 0.3) return null;
        return { lat: best.center.lat, lon: best.center.lon };
    } catch { return null; }
};

// ── Route optimization (idéntico al GIS worker) ───────────────────────────────
const buildRouteMatrix = (stops) => {
    const n = stops.length;
    const m = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
            const d = haversineKm(stops[i].latitude, stops[i].longitude, stops[j].latitude, stops[j].longitude);
            m[i][j] = m[j][i] = d;
        }
    return m;
};

const nearestNeighborRoute = (stops, m) => {
    const n = stops.length;
    let best = [], bestD = Infinity;
    for (let start = 0; start < n; start++) {
        const visited = new Set(), order = [];
        let cur = start;
        while (order.length < n) {
            if (visited.has(cur)) {
                let minD = Infinity, nxt = -1;
                for (let j = 0; j < n; j++) if (!visited.has(j) && m[cur][j] < minD) { minD = m[cur][j]; nxt = j; }
                if (nxt === -1) break;
                cur = nxt;
            }
            order.push(cur); visited.add(cur);
            let minD = Infinity, nxt = -1;
            for (let j = 0; j < n; j++) if (!visited.has(j) && m[cur][j] < minD) { minD = m[cur][j]; nxt = j; }
            if (nxt === -1) break;
            cur = nxt;
        }
        let d = 0;
        for (let i = 0; i < order.length - 1; i++) d += m[order[i]][order[i + 1]];
        if (d < bestD) { bestD = d; best = [...order]; }
    }
    return best;
};

const twoOptRoute = (order, m) => {
    const n = order.length;
    let improved = true, route = [...order];
    while (improved) {
        improved = false;
        for (let i = 0; i < n - 2; i++)
            for (let j = i + 2; j < n; j++) {
                if (j === n - 1 && i === 0) continue;
                const cur = m[route[i]][route[i + 1]] + m[route[j]][route[(j + 1) % n]];
                const nw  = m[route[i]][route[j]] + m[route[i + 1]][route[(j + 1) % n]];
                if (nw < cur - 0.001) {
                    route = [...route.slice(0, i + 1), ...route.slice(i + 1, j + 1).reverse(), ...route.slice(j + 1)];
                    improved = true;
                }
            }
    }
    return route;
};

const orOptRoute = (order, m) => {
    const dist = (r) => { let d = 0; for (let i = 0; i < r.length - 1; i++) d += m[r[i]][r[i + 1]]; return d; };
    let improved = true, route = [...order];
    while (improved) {
        improved = false;
        for (let p = 0; p < route.length && !improved; p++) {
            const stop = route[p], without = route.filter((_, i) => i !== p);
            const cur = dist(route);
            let best = cur - 0.001, bestQ = -1;
            for (let q = 0; q <= without.length; q++) {
                const d = dist([...without.slice(0, q), stop, ...without.slice(q)]);
                if (d < best) { best = d; bestQ = q; }
            }
            if (bestQ !== -1) {
                const w = route.filter((_, i) => i !== p);
                route = [...w.slice(0, bestQ), stop, ...w.slice(bestQ)];
                improved = true;
            }
        }
    }
    return route;
};

const calcRouteDuration = (distKm, nStops) => {
    const total = Math.round(distKm * 15 + nStops * 7.5 + 20);
    if (total < 60) return `${total} min`;
    const h = Math.floor(total / 60), m = total % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

const optimizeAndPolyline = async (tour) => {
    if (!tour.stops || tour.stops.length <= 2) return tour;
    const stops = tour.stops;
    const m = buildRouteMatrix(stops);
    let order = nearestNeighborRoute(stops, m);
    order = twoOptRoute(order, m);
    order = orOptRoute(order, m);
    const optimized = order.map(i => stops[i]);

    let distKm = 0;
    for (let i = 0; i < optimized.length - 1; i++)
        distKm += haversineKm(optimized[i].latitude, optimized[i].longitude, optimized[i + 1].latitude, optimized[i + 1].longitude);

    let polyline = tour.routePolyline; // conservar la anterior si OSRM falla
    try {
        const coords = optimized.map(s => `${s.longitude},${s.latitude}`).join(';');
        const osrmRes = await fetch(
            `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=polyline`,
            { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } }
        );
        if (osrmRes.ok) {
            const d = await osrmRes.json();
            if (d.code === 'Ok') polyline = d.routes?.[0]?.geometry;
        }
    } catch (_) {}

    return {
        ...tour,
        stops: optimized,
        distance: `${distKm.toFixed(1)} km`,
        duration: calcRouteDuration(distKm, optimized.length),
        routePolyline: polyline,
    };
};

// ── cityInfo desde las paradas del row ────────────────────────────────────────
const cityInfoFromStops = (allStops) => {
    const valid = allStops.filter(s => s.latitude && s.longitude && isFinite(s.latitude) && isFinite(s.longitude));
    if (!valid.length) return { lat: 0, lon: 0, radiusKm: 5 };
    const lat = valid.reduce((s, p) => s + p.latitude, 0) / valid.length;
    const lon = valid.reduce((s, p) => s + p.longitude, 0) / valid.length;
    let maxDist = 0;
    for (const s of valid) {
        const d = haversineKm(lat, lon, s.latitude, s.longitude);
        if (d > maxDist) maxDist = d;
    }
    const radiusKm = Math.max(3, Math.min(15, maxDist * 1.5));
    return { lat, lon, radiusKm };
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🗺️  BDAI — Actualización de coordenadas via Google Places API');
    console.log('═'.repeat(64));

    const { data: rows, error } = await supabase
        .from('tours_cache')
        .select('*')
        .eq('status', 'READY');

    if (error) { console.error('Error leyendo tours_cache:', error); process.exit(1); }
    if (!rows.length) { console.log('No hay filas con status=READY en tours_cache.'); return; }

    const totalTours = rows.reduce((s, r) => s + (r.data?.length || 0), 0);
    const totalStops = rows.reduce((s, r) => s + (r.data || []).reduce((ss, t) => ss + (t.stops?.length || 0), 0), 0);
    console.log(`\nFilas: ${rows.length} | Tours: ${totalTours} | Paradas totales: ${totalStops}\n`);

    const globalNotFound = [];

    for (const row of rows) {
        const tours    = row.data || [];
        const citySlug = row.city;
        const language = row.language;

        // city y country desde el primer tour que tenga esos campos
        const refTour  = tours[0] || {};
        const city     = refTour.city     || citySlug.split('_')[0];
        const country  = refTour.country  || citySlug.split('_').slice(1).join(' ');

        const allStops = tours.flatMap(t => t.stops || []);
        const cityInfo = cityInfoFromStops(allStops);

        console.log(`\n${'─'.repeat(64)}`);
        console.log(`🏙️  ${citySlug} (${language})`);
        console.log(`   Ciudad: "${city}" | País: "${country}"`);
        console.log(`   Centro aprox: ${cityInfo.lat.toFixed(5)}, ${cityInfo.lon.toFixed(5)} | Radio: ${cityInfo.radiusKm.toFixed(1)} km`);
        console.log(`   Tours: ${tours.length} | Paradas: ${allStops.length}`);

        const existingPolylines = row.route_polylines || {};
        const updatedTours = [];

        for (const tour of tours) {
            const stops = tour.stops || [];
            console.log(`\n  📍 "${tour.title}" — ${stops.length} paradas`);

            const updatedStops = [];

            for (const stop of stops) {
                await sleep(180); // respetar cuota Google Places

                const googleResult = await verifyWithGooglePlaces(stop, city, country, cityInfo);

                if (googleResult) {
                    const refined = await refineCoordinates(stop, googleResult.latitude, googleResult.longitude);
                    const finalResult = { ...googleResult, latitude: refined.lat, longitude: refined.lon };
                    const movedM = Math.round(
                        haversineKm(stop.latitude, stop.longitude, finalResult.latitude, finalResult.longitude) * 1000
                    );
                    const tag = movedM > 15 ? `⬆  movido ${movedM}m` : `≈ sin cambio (${movedM}m)`;
                    console.log(`     ✅ ${stop.name.substring(0, 42).padEnd(42)} ${tag}`);
                    updatedStops.push(finalResult);
                } else {
                    console.log(`     ❌ ${stop.name.substring(0, 42).padEnd(42)} NO ENCONTRADO — coords originales`);
                    globalNotFound.push({ city: citySlug, lang: language, tour: tour.title, stop: stop.name });
                    updatedStops.push(stop); // mantener coords originales
                }
            }

            // Re-optimizar ruta y obtener polilínea OSRM
            process.stdout.write(`\n  🔄 Optimizando ruta...`);
            const prevDist = tour.distance || '?';
            const optimized = await optimizeAndPolyline({ ...tour, stops: updatedStops });
            const polylineStatus = optimized.routePolyline !== tour.routePolyline ? '✅ nueva' : '⚠️  sin cambio';
            console.log(` ${optimized.distance} / ${optimized.duration}  (era ${prevDist}) | Polilínea: ${polylineStatus}`);

            updatedTours.push(optimized);
        }

        // Combinar polilíneas (nuevas + las que ya existían para otros tours)
        const routePolylines = { ...existingPolylines };
        updatedTours.forEach(t => { if (t.routePolyline) routePolylines[t.id] = t.routePolyline; });

        // Guardar en Supabase
        process.stdout.write(`\n  💾 Guardando en Supabase...`);
        const { error: updateErr } = await supabase
            .from('tours_cache')
            .update({
                data: updatedTours,
                route_polylines: routePolylines,
                updated_at: new Date().toISOString(),
            })
            .eq('city', citySlug)
            .eq('language', language);

        if (updateErr) {
            console.log(` ❌ Error: ${updateErr.message}`);
        } else {
            console.log(` ✅ Guardado.`);
        }
    }

    // Resumen final
    console.log(`\n${'═'.repeat(64)}`);
    console.log('📊  RESUMEN\n');

    if (globalNotFound.length === 0) {
        console.log('✅  Todos los puntos fueron verificados por Google Places.');
    } else {
        console.log(`❌  ${globalNotFound.length} parada(s) no encontradas por Google Places:\n`);
        for (const nf of globalNotFound) {
            console.log(`   • [${nf.city}/${nf.lang}] "${nf.tour}" → "${nf.stop}"`);
        }
        console.log('\n   Estas paradas conservan sus coordenadas originales (Nominatim/Photon).');
        console.log('   Puedes corregirlas manualmente con el botón "Corregir GPS" en el tour.');
    }

    console.log('\n✅  Proceso completado.\n');
}

main().catch(err => {
    console.error('\nError fatal:', err);
    process.exit(1);
});
