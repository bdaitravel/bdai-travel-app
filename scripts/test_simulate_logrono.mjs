import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
const envVars = Object.fromEntries(
    envContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const SERVICE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'];
const jwtPayload = JSON.parse(Buffer.from(SERVICE_KEY.split('.')[1], 'base64').toString());
const SUPABASE_URL = \https://\.supabase.co\;
const SB_HEADERS = { 'apikey': SERVICE_KEY, 'Authorization': \Bearer \\, 'Content-Type': 'application/json' };

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

// OR-OPT OPEN
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

(async () => {
    console.log('Fetching Logroño cache...');
    const searchRes = await fetch(\\/rest/v1/tours_cache?city=eq.logrono_vino_tapas&select=data\, { headers: SB_HEADERS });
    const cached = await searchRes.json();
    if (!cached || !cached[0] || !cached[0].data) {
        console.log('No cache found for logrono_vino_tapas, maybe city slug is different? Let me fetch like.*logrono*');
        const res2 = await fetch(\\/rest/v1/tours_cache?city=like.*logrono*&select=city,data\, { headers: SB_HEADERS });
        const data2 = await res2.json();
        console.log(data2.map(i => i.city));
        
        let foundData = data2[0].data;
        for(let t of data2) {
            if(t.city.includes('vino_tapas')) foundData = t.data;
        }

        const tour = foundData.find(t => t.id.endsWith('_1')) || foundData[1];
        if(!tour) return console.log('No tour 2 found');

        console.log(\\\n--- TOUR: \ ---\);
        const beforeNames = tour.stops.map(s => s.name);
        console.log('ORDEN ACTUAL EN LA BASE DE DATOS:');
        beforeNames.forEach((n,i) => console.log(\ \. \\));

        const optimized = optimizeStops(tour.stops);
        const afterNames = optimized.map(s => s.name);
        console.log('\\nORDEN CORREGIDO (NN + 2opt abierto sin bugs):');
        afterNames.forEach((n,i) => {
            const oldIdx = beforeNames.indexOf(n) + 1;
            console.log(\ \. \ (antes la nº \)\);
        });

    }
})();
