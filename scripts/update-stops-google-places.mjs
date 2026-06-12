// scripts/update-stops-google-places.mjs
// Re-geocodifica todas las paradas en tours_cache via Google Places API (textsearch),
// recalcula rutas optimizadas (NN + 2-opt + or-opt + OSRM) y guarda en Supabase.
// Uso: node scripts/update-stops-google-places.mjs
//
// LÓGICA DE VERIFICACIÓN (idéntica a tour-worker-gis-02):
//   - Usa Places Text Search (textsearch.json): itera hasta 5 resultados, toma
//     el primero dentro del radio de la ciudad. El parámetro 'location' actúa
//     como sesgo geográfico para que el resultado correcto salga primero.
//   - Nombres con paréntesis ("Alameda de Cervantes (Parque de la Dehesa)"):
//     prueba el nombre principal y luego el alias por separado.
//   - City info desde Nominatim (no desde coords existentes, que pueden estar mal).
//   - Refinamiento OSM: entrada principal para edificios, centroide para parques.

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

// ── Parseo de nombres con paréntesis ─────────────────────────────────────────
// "Alameda de Cervantes (Parque de la Dehesa)" → { main, alias }
const parseStopName = (name) => {
    const match = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (match) return { main: match[1].trim(), alias: match[2].trim() };
    return { main: name, alias: null };
};

// ── City info desde Nominatim (centro real, no desde coords existentes) ───────
const nominatimCache = new Map();
const getCityInfo = async (city, country) => {
    const key = `${city}|${country}`;
    if (nominatimCache.has(key)) return nominatimCache.get(key);

    await sleep(1100); // rate limiter Nominatim
    try {
        const query = encodeURIComponent(`${city}, ${country}`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&addressdetails=1&extratags=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0', 'Accept-Language': 'en' } });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.length) return null;

        // Preferir ciudad/pueblo sobre provincia/región
        let selected = data[0];
        for (const p of ['city', 'town', 'village', 'municipality']) {
            const match = data.find(item => item.addresstype === p || item.type === p);
            if (match) { selected = match; break; }
        }

        const lat = parseFloat(selected.lat);
        const lon = parseFloat(selected.lon);
        const bb  = selected.boundingbox || [];
        const bboxH = bb.length === 4 ? Math.abs(parseFloat(bb[1]) - parseFloat(bb[0])) : 0.05;
        const bboxW = bb.length === 4 ? Math.abs(parseFloat(bb[3]) - parseFloat(bb[2])) : 0.07;
        // Radio basado en el bbox de Nominatim, entre 3 y 20 km
        const radiusKm = Math.max(3, Math.min(20, Math.max(bboxH, bboxW) * 111 * 0.7));

        const info = { lat, lon, radiusKm };
        nominatimCache.set(key, info);
        return info;
    } catch { return null; }
};

// ── Google Places API v1 searchText — itera hasta 5 resultados ───────────────
// locationRestriction (estricto) descarta homónimos de otras ciudades.
// Google Maps posiciona edificios en la entrada principal y parques en su centro.
const searchGoogleTextSearch = async (nameVariant, city, country, cityInfo) => {
    const radiusKm = cityInfo.radiusKm;
    const restrictionRadiusM = Math.round(Math.max(3000, radiusKm * 1000));
    try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.location',
                'Referer': 'https://app.bdai.travel/',
            },
            body: JSON.stringify({
                textQuery: `${nameVariant}, ${city}, ${country}`,
                locationBias: {
                    circle: {
                        center: { latitude: cityInfo.lat, longitude: cityInfo.lon },
                        radius: restrictionRadiusM,
                    },
                },
                maxResultCount: 5,
            }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.places?.length) return null;

        // Normalizar palabras clave de la búsqueda (>2 chars, sin tildes)
        const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
        const queryWords = normalize(nameVariant).split(/\s+/).filter(w => w.length > 2);
        const nameScore = (resultName) => {
            if (!resultName || !queryWords.length) return 0;
            const norm = normalize(resultName);
            return queryWords.filter(w => norm.includes(w)).length / queryWords.length;
        };

        // Elegir el resultado con mejor coincidencia de nombre; distancia al centro como desempate.
        // Evita que homónimos en otros barrios (ej. "Pl. Mayor-Soria Las Casas") ganen al
        // lugar correcto aunque estén dentro del radio.
        let best = null;
        for (const place of data.places) {
            const lat = place.location.latitude;
            const lon = place.location.longitude;
            const dist = haversineKm(lat, lon, cityInfo.lat, cityInfo.lon);
            if (dist > radiusKm) continue;
            const score = nameScore(place.displayName?.text);
            if (!best || score > best.score || (score === best.score && dist < best.dist)) {
                best = { lat, lon, resultName: place.displayName?.text, dist, score };
            }
        }
        return best;
    } catch {}
    return null;
};

// ── Verificación principal con doble nombre (main → alias) ────────────────────
const verifyWithGooglePlaces = async (stop, city, country, cityInfo) => {
    const { main, alias } = parseStopName(stop.name);
    const namesToTry = alias ? [main, alias] : [main];

    for (const nameVariant of namesToTry) {
        const result = await searchGoogleTextSearch(nameVariant, city, country, cityInfo);
        if (result) {
            const label = nameVariant !== stop.name ? ` (via "${nameVariant}")` : '';
            const movedFrom = (stop.latitude && stop.longitude)
                ? Math.round(haversineKm(stop.latitude, stop.longitude, result.lat, result.lon) * 1000)
                : null;
            return { result, label, movedFrom };
        }
        await sleep(100);
    }
    return null;
};

// ── OSM: entrada principal de edificio ───────────────────────────────────────
const isOpenSpaceStop = (stop) =>
    /plaza|platz|plein|piazza|square|markt|march[eé]|mercado|jard[ií]n|jardin|park|parque|jardim|campo|pra[çc]a|cours|esplanade|alameda|dehesa|paseo/i.test(stop.name);

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

const refineCoordinates = async (stop, lat, lon) => {
    if (isOpenSpaceStop(stop)) {
        const center = await getOSMAreaCenter(lat, lon);
        if (center) {
            console.log(`       🗺️  OSM centroide área`);
            return { lat: center.lat, lon: center.lon };
        }
    } else {
        const entrance = await getOSMEntrance(lat, lon);
        if (entrance) {
            console.log(`       🚪 OSM entrada principal`);
            return { lat: entrance.lat, lon: entrance.lon };
        }
        const snap = await snapToNearestStreet(lat, lon);
        if (snap) {
            console.log(`       🧲 snap acera OSRM`);
            return { lat: snap.lat, lon: snap.lon };
        }
    }
    return { lat, lon };
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

// ── Route optimization (NN + 2-opt + or-opt + OSRM polyline) ─────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🗺️  BDAI — Re-geocodificación global via Google Places Text Search');
    console.log('═'.repeat(64));

    const { data: rows, error } = await supabase
        .from('tours_cache')
        .select('*')
        .eq('status', 'READY');

    if (error) { console.error('Error leyendo tours_cache:', error); process.exit(1); }
    if (!rows.length) { console.log('No hay filas con status=READY.'); return; }

    const totalStops = rows.reduce((s, r) =>
        s + (r.data || []).reduce((ss, t) => ss + (t.stops?.length || 0), 0), 0);
    console.log(`\nFilas: ${rows.length} | Paradas totales: ${totalStops}\n`);

    const globalNotFound = [];

    for (const row of rows) {
        const tours    = row.data || [];
        const citySlug = row.city;
        const language = row.language;
        const refTour  = tours[0] || {};
        const city     = refTour.city    || citySlug.split('_')[0];
        const country  = refTour.country || citySlug.split('_').slice(1).join(' ');

        console.log(`\n${'─'.repeat(64)}`);
        console.log(`🏙️  ${citySlug} (${language}) — "${city}", "${country}"`);

        // City center desde Nominatim (fuente de verdad, no desde coords existentes)
        const cityInfo = await getCityInfo(city, country);
        if (!cityInfo) {
            console.log(`   ⚠️  Nominatim no devolvió city info. Saltando.`);
            continue;
        }
        console.log(`   Centro: ${cityInfo.lat.toFixed(5)}, ${cityInfo.lon.toFixed(5)} | Radio: ${cityInfo.radiusKm.toFixed(1)} km`);

        const existingPolylines = row.route_polylines || {};
        const updatedTours = [];

        for (const tour of tours) {
            const stops = tour.stops || [];
            console.log(`\n  📍 "${tour.title}" — ${stops.length} paradas`);

            const updatedStops = [];

            for (const stop of stops) {
                await sleep(200); // cuota Google Places

                const found = await verifyWithGooglePlaces(stop, city, country, cityInfo);

                if (found) {
                    const refined = await refineCoordinates(stop, found.result.lat, found.result.lon);
                    const finalLat = refined.lat;
                    const finalLon = refined.lon;
                    const movedM = found.movedFrom ??
                        Math.round(haversineKm(stop.latitude || 0, stop.longitude || 0, finalLat, finalLon) * 1000);
                    const tag = movedM > 15 ? `⬆  ${movedM}m` : `≈ ok (${movedM}m)`;
                    console.log(`     ✅ ${stop.name.substring(0, 40).padEnd(40)}${found.label}  ${tag}`);
                    updatedStops.push({ ...stop, latitude: finalLat, longitude: finalLon });
                } else {
                    console.log(`     ❌ ${stop.name.substring(0, 40).padEnd(40)} NO ENCONTRADO — coords originales`);
                    globalNotFound.push({ city: citySlug, lang: language, stop: stop.name });
                    updatedStops.push(stop);
                }
            }

            process.stdout.write(`\n  🔄 Optimizando ruta...`);
            const prevDist = tour.distance || '?';
            const optimized = await optimizeAndPolyline({ ...tour, stops: updatedStops });
            const polylineOk = optimized.routePolyline ? '✅' : '⚠️ sin polilínea';
            console.log(` ${optimized.distance} / ${optimized.duration}  (era ${prevDist}) | ${polylineOk}`);
            updatedTours.push(optimized);
        }

        const routePolylines = { ...existingPolylines };
        updatedTours.forEach(t => { if (t.routePolyline) routePolylines[t.id] = t.routePolyline; });

        process.stdout.write(`\n  💾 Guardando...`);
        const { error: updateErr } = await supabase
            .from('tours_cache')
            .update({ data: updatedTours, route_polylines: routePolylines, updated_at: new Date().toISOString() })
            .eq('city', citySlug)
            .eq('language', language);
        console.log(updateErr ? ` ❌ ${updateErr.message}` : ' ✅');
    }

    console.log(`\n${'═'.repeat(64)}`);
    console.log('📊  RESUMEN\n');
    if (globalNotFound.length === 0) {
        console.log('✅  Todas las paradas verificadas por Google Places.');
    } else {
        console.log(`⚠️  ${globalNotFound.length} parada(s) sin verificar (coords originales conservadas):\n`);
        const byCityLang = {};
        for (const nf of globalNotFound) {
            const k = `${nf.city}/${nf.lang}`;
            if (!byCityLang[k]) byCityLang[k] = [];
            byCityLang[k].push(nf.stop);
        }
        for (const [k, stops] of Object.entries(byCityLang)) {
            console.log(`   [${k}]`);
            for (const s of stops) console.log(`     • ${s}`);
        }
    }
    console.log('\n✅  Proceso completado.\n');
}

main().catch(err => { console.error('\nError fatal:', err); process.exit(1); });
