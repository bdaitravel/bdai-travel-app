import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const envVars = Object.fromEntries(
    envContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const SERVICE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY']?.replace(/["']/g, '');
const jwtPayload = JSON.parse(Buffer.from(SERVICE_KEY.split('.')[1], 'base64').toString());
const SUPABASE_URL = `https://${jwtPayload.ref}.supabase.co`;
const SB_HEADERS = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };

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

// PURE NN
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

// FIXED 2-OPT OPEN
const twoOpt = (order, m) => {
    const n = order.length;
    let improved = true, route = [...order];
    while (improved) {
        improved = false;
        for (let i = 0; i < n - 2; i++)
            for (let j = i + 2; j < n - 1; j++) { // FIXED TO n - 1 !
                const cur = m[route[i]][route[i + 1]] + m[route[j]][route[j + 1]]; // NO % n
                const nw = m[route[i]][route[j]] + m[route[i + 1]][route[j + 1]];
                if (nw < cur - 0.001) {
                    route = [...route.slice(0, i + 1), ...route.slice(i + 1, j + 1).reverse(), ...route.slice(j + 1)];
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
    return order.map(i => stops[i]);
};

(async () => {
    const searchRes = await fetch(`${SUPABASE_URL}/rest/v1/tours_cache?city=like.*logrono*&select=city,data`, { headers: SB_HEADERS });
    const cached = await searchRes.json();
    
    let foundData = cached[0].data;
    for(let t of cached) {
        if(t.city.includes('vino_tapas')) foundData = t.data;
    }

    const tour = foundData.find(t => t.id.endsWith('_1')) || foundData[1];
    
    const beforeNames = tour.stops.map(s => s.name);
    const optimized = optimizeStops(tour.stops);
    const afterNames = optimized.map(s => s.name);
    
    const results = {
       "title": tour.title,
       "old_order": beforeNames,
       "new_order": afterNames.map(n => ({ name: n, old_index: beforeNames.indexOf(n) + 1 }))
    };
    
    writeFileSync('scripts/logrono_out.json', JSON.stringify(results, null, 2), 'utf8');

})();
