// scripts/reorderLogrono.mjs — Reordena los tours de Logroño usando NN+2opt+Or-opt
// El /trip de OSRM público no soporta foot routing. Se usa algoritmo Haversine local
// más /route para la polilínea visual.
// Ejecutar: node scripts/reorderLogrono.mjs

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const envVars = Object.fromEntries(
    envContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const SERVICE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'];
if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY no encontrado en .env.local');
const jwtPayload = JSON.parse(Buffer.from(SERVICE_KEY.split('.')[1], 'base64').toString());
const SUPABASE_URL = `https://${jwtPayload.ref}.supabase.co`;
const SB_HEADERS = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };

// ── Algoritmos de optimización (portados de lib/routingService.ts) ───────────

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildMatrix = stops => {
    const n = stops.length, m = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
            const d = haversineKm(stops[i].latitude, stops[i].longitude, stops[j].latitude, stops[j].longitude);
            m[i][j] = m[j][i] = d;
        }
    return m;
};

const nearestNeighbor = (stops, m) => {
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
        let d = 0; for (let i = 0; i < order.length - 1; i++) d += m[order[i]][order[i + 1]];
        if (d < bestD) { bestD = d; best = [...order]; }
    }
    return best;
};

const twoOpt = (order, m) => {
    const n = order.length;
    let improved = true, route = [...order];
    while (improved) {
        improved = false;
        for (let i = 0; i < n - 2; i++)
            for (let j = i + 2; j < n; j++) {
                if (j === n - 1 && i === 0) continue;
                const cur = m[route[i]][route[i + 1]] + m[route[j]][route[(j + 1) % n]];
                const nw = m[route[i]][route[j]] + m[route[i + 1]][route[(j + 1) % n]];
                if (nw < cur - 0.001) {
                    route = [...route.slice(0, i + 1), ...route.slice(i + 1, j + 1).reverse(), ...route.slice(j + 1)];
                    improved = true;
                }
            }
    }
    return route;
};

const orOpt = (order, m) => {
    const dist = r => { let d = 0; for (let i = 0; i < r.length - 1; i++) d += m[r[i]][r[i + 1]]; return d; };
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

const optimizeStops = stops => {
    if (stops.length < 3) return stops;
    const m = buildMatrix(stops);
    let order = nearestNeighbor(stops, m);
    order = twoOpt(order, m);
    order = orOpt(order, m);
    return order.map(i => stops[i]);
};

// ── Polilínea visual con OSRM /route (este sí funciona para foot) ────────────
const fetchPolyline = async stops => {
    if (stops.length < 2) return null;
    try {
        const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
        const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=polyline`;
        const res = await fetch(url, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.code === 'Ok' ? data.routes?.[0]?.geometry ?? null : null;
    } catch { return null; }
};

const calcDuration = (distKm, nStops) => {
    const total = Math.round(distKm * 15 + nStops * 7.5 + 20);
    if (total < 60) return `${total} min`;
    const h = Math.floor(total / 60), m = total % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

// ── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n[1/4] Buscando tours de Logroño en ${SUPABASE_URL}...`);
const searchRes = await fetch(`${SUPABASE_URL}/rest/v1/tours_cache?city=like.*logrono*&select=city,language,updated_at`, { headers: SB_HEADERS });
const found = await searchRes.json();

if (!found.length) {
    const allRes = await fetch(`${SUPABASE_URL}/rest/v1/tours_cache?select=city,language,updated_at&order=updated_at.desc&limit=20`, { headers: SB_HEADERS });
    const all = await allRes.json();
    console.log('❌ No encontrado. Tours disponibles:');
    all.forEach(t => console.log(`  · "${t.city}" / "${t.language}"`));
    process.exit(1);
}
console.log(`[1/4] ✅ Encontrado(s):`);
found.forEach(t => console.log(`  · city="${t.city}" language="${t.language}" (${t.updated_at?.slice(0, 10)})`));

for (const row of found) {
    const { city, language } = row;
    console.log(`\n[2/4] Cargando datos: "${city}" / "${language}"...`);
    const [cached] = await (await fetch(`${SUPABASE_URL}/rest/v1/tours_cache?city=eq.${city}&language=eq.${language}&select=data,route_polylines`, { headers: SB_HEADERS })).json();
    if (!cached?.data?.length) { console.warn('  ⚠️ Sin datos, saltando.'); continue; }

    const updatedTours = [];
    const newPolylines = {};

    for (const tour of cached.data) {
        console.log(`\n[3/4] Optimizando "${tour.title}" (${tour.stops.length} paradas)...`);
        const before = tour.stops.map(s => s.name);
        const optimized = optimizeStops(tour.stops);
        const after = optimized.map(s => s.name);

        let distKm = 0;
        for (let i = 0; i < optimized.length - 1; i++)
            distKm += haversineKm(optimized[i].latitude, optimized[i].longitude, optimized[i + 1].latitude, optimized[i + 1].longitude);

        const polyline = await fetchPolyline(optimized);
        const distance = `${distKm.toFixed(1)} km`;
        const duration = calcDuration(distKm, optimized.length);

        const changed = JSON.stringify(before) !== JSON.stringify(after);
        if (changed) {
            console.log(`  ✅ REORDENADO:`);
            optimized.forEach((s, i) => console.log(`     ${i + 1}. ${s.name}${before[i] !== s.name ? '  ← antes era: ' + (before[i] ?? '?') : ''}`));
        } else {
            console.log(`  ℹ️  Sin cambios de orden (ya era óptimo).`);
        }
        console.log(`  ${distance}  ${duration}  Polilínea: ${polyline ? '✅' : '⚠️ sin datos'}`);

        updatedTours.push({ ...tour, stops: optimized, distance, duration });
        if (tour.id && polyline) newPolylines[tour.id] = polyline;
    }

    console.log(`\n[4/4] Guardando en Supabase...`);
    // removed
        // removed
        // removed
    });
    if (updateRes.ok || updateRes.status === 204)
        console.log(`  ✅ Guardado. Recarga la app para ver el nuevo orden.`);
    else
        console.error(`  ❌ Error al guardar: ${updateRes.status} ${await updateRes.text()}`);
}
console.log('\n✅ Script completado.\n');
