// scripts/fix-soria-stops.mjs
// Re-geocodifica todas las paradas del tour de Soria usando Google Places API v1,
// aplica refinamiento OSM (entrada principal / centroide de área) y recalcula la ruta.
// Uso: node scripts/fix-soria-stops.mjs
//
// Para nombres con paréntesis ("Alameda de Cervantes (Parque de la Dehesa)"):
//   1. Intenta el nombre principal: "Alameda de Cervantes"
//   2. Si falla, intenta el alias: "Parque de la Dehesa"

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://slldavgsoxunkphqeamx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU1NTY2MSwiZXhwIjoyMDgwMTMxNjYxfQ.rfpnTCt0AuSC1AE2MZgYmU67ARZXWh2__pIf5CoHKTc';
const PLACES_API_KEY   = 'AIzaSyBytczKNs8oOO7r0sjGcehkW9VHZDVJqrA';

const CITY_SLUG = 'soria_spain';

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

// ── Parseo de nombres con paréntesis ─────────────────────────────────────────
// "Alameda de Cervantes (Parque de la Dehesa)" → { main: "Alameda de Cervantes", alias: "Parque de la Dehesa" }
const parseStopName = (name) => {
    const match = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (match) return { main: match[1].trim(), alias: match[2].trim() };
    return { main: name, alias: null };
};

// ── Google Places API v1: searchText con locationBias ────────────────────────
// Devuelve { latitude, longitude } o null si no encuentra nada dentro del radio.
const searchGooglePlaces = async (query, cityInfo) => {
    const radiusM = Math.min(Math.round((cityInfo.radiusKm || 5) * 1000), 50000);
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
                textQuery: query,
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
        const dist = haversineKm(lat, lng, cityInfo.lat, cityInfo.lon);
        if (dist <= (cityInfo.radiusKm || 5) * 1.5) return { lat, lon: lng };
        return null;
    } catch { return null; }
};

// ── Verificación con doble nombre (main → alias) ──────────────────────────────
const verifyWithGooglePlaces = async (stop, city, country, cityInfo) => {
    const { main, alias } = parseStopName(stop.name);
    const namesToTry = alias ? [main, alias] : [main];

    for (const nameVariant of namesToTry) {
        const query = `${nameVariant}, ${city}, ${country}`;
        const result = await searchGooglePlaces(query, cityInfo);
        if (result) {
            const movedFrom = stop.latitude && stop.longitude
                ? Math.round(haversineKm(stop.latitude, stop.longitude, result.lat, result.lon) * 1000)
                : null;
            const label = nameVariant !== stop.name ? ` (via "${nameVariant}")` : '';
            return { result, movedFrom, label };
        }
        await sleep(100);
    }
    return null;
};

// ── OSM: entrada principal de edificio ───────────────────────────────────────
const getOSMEntrance = async (lat, lon) => {
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
                const el = main || d.elements[0];
                return { lat: el.lat, lon: el.lon };
            }
        }
    } catch {}

    const delta = 0.0015;
    const fallback = `[out:json][timeout:8];node["entrance"~"main|yes|visitor|public"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});out body;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(fallback)}`,
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

// ── OSM: centroide de parque / plaza ─────────────────────────────────────────
const getOSMAreaCenter = async (lat, lon) => {
    const delta = 0.002;
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

const isOpenSpace = (stop) =>
    /plaza|platz|plein|piazza|square|markt|march[eé]|mercado|jard[ií]n|jardin|park|parque|jardim|campo|pra[çc]a|cours|esplanade|alameda|dehesa|paseo/i.test(stop.name);

const refineCoordinates = async (stop, lat, lon) => {
    if (isOpenSpace(stop)) {
        const center = await getOSMAreaCenter(lat, lon);
        if (center) {
            console.log(`       🗺️  OSM centroide área (${isOpenSpace(stop) ? 'espacio abierto' : ''})`);
            return { lat: center.lat, lon: center.lon };
        }
    } else {
        const entrance = await getOSMEntrance(lat, lon);
        if (entrance) {
            console.log(`       🚪 OSM entrada principal`);
            return { lat: entrance.lat, lon: entrance.lon };
        }
    }
    return { lat, lon };
};

// ── Optimización de ruta (NN + 2-opt + or-opt + OSRM polyline) ───────────────
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

    let polyline = tour.routePolyline;
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
    } catch {}

    return {
        ...tour,
        stops: optimized,
        distance: `${distKm.toFixed(1)} km`,
        duration: calcRouteDuration(distKm, optimized.length),
        routePolyline: polyline,
    };
};

// ── cityInfo desde coordenadas conocidas de Soria ────────────────────────────
// Centro histórico de Soria: Plaza Mayor / Concatedral de San Pedro
const SORIA_CITY_INFO = {
    lat: 41.7653,
    lon: -2.4686,
    radiusKm: 8,
    city: 'Soria',
    country: 'Spain',
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🗺️  Fix Soria — Re-geocodificación via Google Places API v1');
    console.log('═'.repeat(64));
    console.log(`   Centro: ${SORIA_CITY_INFO.lat}, ${SORIA_CITY_INFO.lon} | Radio: ${SORIA_CITY_INFO.radiusKm} km\n`);

    const { data: rows, error } = await supabase
        .from('tours_cache')
        .select('*')
        .eq('city', CITY_SLUG)
        .eq('status', 'READY');

    if (error) { console.error('Error leyendo tours_cache:', error); process.exit(1); }
    if (!rows?.length) { console.log(`No hay filas READY para ${CITY_SLUG}.`); return; }

    console.log(`Idiomas encontrados: ${rows.map(r => r.language).join(', ')}\n`);

    const notFound = [];

    for (const row of rows) {
        const tours    = row.data || [];
        const language = row.language;

        console.log(`${'─'.repeat(64)}`);
        console.log(`🌐 Idioma: ${language} | Tours: ${tours.length}`);

        const existingPolylines = row.route_polylines || {};
        const updatedTours = [];

        for (const tour of tours) {
            const stops = tour.stops || [];
            console.log(`\n  📍 "${tour.title}" — ${stops.length} paradas`);

            const updatedStops = [];

            for (const stop of stops) {
                await sleep(200); // cuota Google Places

                const found = await verifyWithGooglePlaces(stop, SORIA_CITY_INFO.city, SORIA_CITY_INFO.country, SORIA_CITY_INFO);

                if (found) {
                    const refined = await refineCoordinates(stop, found.result.lat, found.result.lon);
                    const finalLat = refined.lat;
                    const finalLon = refined.lon;
                    const movedM = found.movedFrom ?? Math.round(haversineKm(stop.latitude || 0, stop.longitude || 0, finalLat, finalLon) * 1000);
                    const tag = movedM > 15 ? `⬆  movido ${movedM}m` : `≈ sin cambio (${movedM}m)`;
                    console.log(`     ✅ ${stop.name.substring(0, 38).padEnd(38)}${found.label}  ${tag}`);
                    updatedStops.push({ ...stop, latitude: finalLat, longitude: finalLon });
                } else {
                    console.log(`     ❌ ${stop.name.substring(0, 38).padEnd(38)} NO ENCONTRADO — coords originales`);
                    notFound.push({ lang: language, tour: tour.title, stop: stop.name });
                    updatedStops.push(stop);
                }
            }

            process.stdout.write(`\n  🔄 Optimizando ruta...`);
            const prevDist = tour.distance || '?';
            const optimized = await optimizeAndPolyline({ ...tour, stops: updatedStops });
            const polylineOk = optimized.routePolyline ? '✅ polilínea' : '⚠️  sin polilínea';
            console.log(` ${optimized.distance} / ${optimized.duration}  (era ${prevDist}) | ${polylineOk}`);

            updatedTours.push(optimized);
        }

        // Combinar polilíneas
        const routePolylines = { ...existingPolylines };
        updatedTours.forEach(t => { if (t.routePolyline) routePolylines[t.id] = t.routePolyline; });

        process.stdout.write(`\n  💾 Guardando en Supabase...`);
        const { error: updateErr } = await supabase
            .from('tours_cache')
            .update({
                data: updatedTours,
                route_polylines: routePolylines,
                updated_at: new Date().toISOString(),
            })
            .eq('city', CITY_SLUG)
            .eq('language', language);

        console.log(updateErr ? ` ❌ Error: ${updateErr.message}` : ' ✅ Guardado.');
    }

    console.log(`\n${'═'.repeat(64)}`);
    console.log('📊  RESUMEN\n');
    if (notFound.length === 0) {
        console.log('✅  Todas las paradas verificadas por Google Places.');
    } else {
        console.log(`❌  ${notFound.length} parada(s) no encontradas:\n`);
        for (const nf of notFound) {
            console.log(`   • [${nf.lang}] "${nf.tour}" → "${nf.stop}"`);
        }
    }
    console.log('\n✅  Proceso completado.\n');
}

main().catch(err => { console.error('\nError fatal:', err); process.exit(1); });
