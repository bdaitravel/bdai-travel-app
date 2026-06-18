/**
 * scripts/reordenar-ruta-tour.ts
 * Macro-script global para recalcular y reordenar el trazado de todos los tours de la Base de Datos,
 * inyectando topografía real (Open-Meteo) y aplicando Regla de Naismith + Asymmetric 2-opt.
 * 
 * Uso:
 *   npx tsx scripts/reordenar-ruta-tour.ts         -> Ejecuta en toda la BD
 *   npx tsx scripts/reordenar-ruta-tour.ts logrono  -> Modo DEBUG (no guarda) para "logrono"
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Faltan credenciales VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const IS_DRY_RUN = process.argv[2] ? true : false;
const TARGET_CITY = process.argv[2] || null;

// ── UTILITIES ─────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calcDuration = (distKm: number, nStops: number): string => {
    const total = Math.round(distKm * 15 + nStops * 7.5 + 20);
    if (total < 60) return `${total} min`;
    const h = Math.floor(total / 60), m = total % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

// ── ELEVATION API ─────────────────────────────────────────────────────────

async function getElevations(stops: any[]): Promise<number[]> {
    if (stops.length === 0) return [];
    const lats = stops.map(s => s.latitude).join(',');
    const lons = stops.map(s => s.longitude).join(',');
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`;
    
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        return data.elevation || stops.map(() => 0);
    } catch(e) {
        console.warn(`  ⚠️ Error Open-Meteo, fallando a 0m:`, e);
        return stops.map(() => 0);
    }
}

// ── ASYMMETRIC ROUTING ALGORITHM ──────────────────────────────────────────

const buildAsymmetricMatrix = (stops: any[], elevations: number[]): number[][] => {
    const n = stops.length;
    const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) {
                m[i][j] = 0;
                continue;
            }
            
            const dist = haversineKm(stops[i].latitude, stops[i].longitude, stops[j].latitude, stops[j].longitude);
            const elevI = elevations[i];
            const elevJ = elevations[j];
            
            // Regla de Naismith: 100m subida equivale a ~800m llano (+8km de coste logico por cada 1km subido).
            // Penalizamos solo la subida, bajada es "gratis" a nivel de penalizacion (coste base dist).
            let climbPenaltyKm = 0;
            if (elevJ > elevI) {
                climbPenaltyKm = ((elevJ - elevI) / 1000) * 8.0; 
            }
            
            m[i][j] = dist + climbPenaltyKm;
        }
    }
    return m;
};

const nearestNeighbor = (stops: any[], m: number[][]): number[] => {
    const n = stops.length;
    let best = [], bestD = Infinity;
    
    // Probar empezar por todos los nodos, y quedarse la ruta con menor coste logico
    for (let start = 0; start < n; start++) {
        const visited = new Set<number>();
        const order: number[] = [];
        let cur = start;
        
        while (order.length < n) {
            if (visited.has(cur)) {
                let minD = Infinity, nxt = -1;
                for (let j = 0; j < n; j++) {
                    if (!visited.has(j) && m[cur][j] < minD) { minD = m[cur][j]; nxt = j; }
                }
                if (nxt === -1) break;
                cur = nxt;
            }
            order.push(cur); 
            visited.add(cur);
            
            let minD = Infinity, nxt = -1;
            for (let j = 0; j < n; j++) {
                if (!visited.has(j) && m[cur][j] < minD) { minD = m[cur][j]; nxt = j; }
            }
            if (nxt === -1) break;
            cur = nxt;
        }
        
        let d = 0; 
        for (let i = 0; i < order.length - 1; i++) d += m[order[i]][order[i + 1]];
        if (d < bestD) { bestD = d; best = [...order]; }
    }
    return best;
};

// Asymmetric 2-opt (porque el coste A->B ya no es igual a B->A debido a las subidas)
const twoOptAsym = (order: number[], m: number[][]): number[] => {
    const n = order.length;
    let improved = true, route = [...order];
    
    while (improved) {
        improved = false;
        for (let i = 0; i < n - 2; i++) {
            for (let j = i + 2; j < n - 1; j++) {
                
                // Coste del tramo actual: (i -> i+1) + (ruta interna inalterada) + (j -> j+1)
                let currentCost = m[route[i]][route[i + 1]] + m[route[j]][route[j + 1]];
                for (let k = i + 1; k < j; k++) {
                    currentCost += m[route[k]][route[k + 1]];
                }
                
                // Coste del nuevo tramo si volteamos la ruta interna:
                // El nodo "i" salta directamente hasta el final del bloque ("j")
                // Luego el bloque se deshace hacia atrás hasta llegar a "i+1"
                // Finalmente desde "i+1" salta hacia adelante al resto del recorrido "j+1"
                let newCost = m[route[i]][route[j]] + m[route[i + 1]][route[j + 1]];
                for (let k = j; k > i + 1; k--) {
                    newCost += m[route[k]][route[k - 1]];
                }
                
                if (newCost < currentCost - 0.001) {
                    route = [...route.slice(0, i + 1), ...route.slice(i + 1, j + 1).reverse(), ...route.slice(j + 1)];
                    improved = true;
                }
            }
        }
    }
    return route;
};

const optimizeStops = (stops: any[], elevations: number[]): any[] => {
    if (stops.length < 3) return stops;
    const m = buildAsymmetricMatrix(stops, elevations);
    let order = nearestNeighbor(stops, m);
    order = twoOptAsym(order, m);
    return order.map(i => stops[i]);
};

// ── POLYLINE ──────────────────────────────────────────────────────────────

const fetchPolyline = async (stops: any[]): Promise<string | undefined> => {
    if (stops.length < 2) return undefined;
    try {
        const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
        const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=polyline`;
        const res = await fetch(url, { headers: { 'User-Agent': 'BDAI-Travel-App/1.0' } });
        if (res.ok) {
            const data = await res.json();
            if (data.code === 'Ok') return data.routes?.[0]?.geometry;
        }
    } catch { }
    return undefined;
};


// ── MAIN SCRIPT ───────────────────────────────────────────────────────────

(async () => {
    console.log(`\n======================================================`);
    console.log(`🧭 ALGORITMO OROGRÁFICO BDAI (Open-Meteo + Naismith)`);
    console.log(`======================================================\n`);
    
    let query = supabase.from('tours_cache').select('*');
    if (TARGET_CITY) {
        console.log(`[!] MODO DRY-RUN ACTIVADO PARA: ${TARGET_CITY}`);
        query = query.ilike('city', `%${TARGET_CITY}%`);
    } else {
        console.log(`[!] MODO PRODUCCIÓN MASIVO. Procesando TODA LA BASE DE DATOS...`);
    }
    
    const { data: records, error } = await query;
    if (error || !records) {
        console.error('❌ Error Supabase:', error);
        return;
    }
    
    console.log(`📦 Encontrados ${records.length} registros (combinaciones idioma/ciudad)`);
    
    for (const record of records) {
        const city = record.city;
        const lang = record.language;
        const tours = record.data;
        
        if (!tours || !Array.isArray(tours) || tours.length === 0) continue;
        console.log(`\n🌐 Procesando: ${city} (${lang}) [${tours.length} tours]...`);
        
        const updatedTours = [];
        const newPolylines: Record<string, string> = {};
        let modifiedSomething = false;
        
        for (const tour of tours) {
            if (!tour.stops || tour.stops.length < 3) {
                updatedTours.push(tour);
                continue;
            }
            
            await sleep(200); // 5 req/s max open-meteo por IP
            const elevations = await getElevations(tour.stops);
            const originalOrder = tour.stops.map((s:any) => s.name);
            
            const optimized = optimizeStops(tour.stops, elevations);
            const optimizedOrder = optimized.map((s:any) => s.name);
            
            // Recalcular distancia y tiempo basados en coordenadas finales
            let distKm = 0;
            for (let i = 0; i < optimized.length - 1; i++) {
                distKm += haversineKm(optimized[i].latitude, optimized[i].longitude, optimized[i + 1].latitude, optimized[i + 1].longitude);
            }
            
            const distance = `${distKm.toFixed(1)} km`;
            const duration = calcDuration(distKm, optimized.length);
            const routePolyline = await fetchPolyline(optimized);
            
            const changedOrder = JSON.stringify(originalOrder) !== JSON.stringify(optimizedOrder);
            if (changedOrder || tour.distance !== distance) modifiedSomething = true;
            
            if (TARGET_CITY) {
                console.log(`\n   🔹 ${tour.title} (Desnivel acumulado de paradas: ${Math.max(...elevations) - Math.min(...elevations)}m)`);
                if (changedOrder) {
                    console.log(`      Orden corregido topográficamente:`);
                    optimized.forEach((s:any, i:number) => {
                        const oldIdx = originalOrder.indexOf(s.name) + 1;
                        console.log(`       ${i+1}. ${s.name} ${oldIdx !== i+1 ? '(antes '+oldIdx+')' : ''}`);
                    });
                }
            } else {
                console.log(`   🔹 ${tour.title} — ${changedOrder ? '🔄 REORDENADO' : '✅ Mantenido'}`);
            }
            
            updatedTours.push({ ...tour, stops: optimized, distance, duration });
            if (routePolyline && tour.id) newPolylines[tour.id] = routePolyline;
        }
        
        if (!IS_DRY_RUN && modifiedSomething) {
            const { error: updErr } = await supabase.from('tours_cache')
                .update({ 
                    data: updatedTours, 
                    route_polylines: Object.keys(newPolylines).length > 0 ? newPolylines : record.route_polylines 
                })
                .eq('city', city).eq('language', lang);
                
            if (updErr) console.error(`   ❌ Error guardando ${city}(${lang}):`, updErr.message);
            else console.log(`   💿 Guardado en BD.`);
        }
    }
    console.log(`\n✅ Proceso Finalizado.`);
})();
