import { Tour, Stop } from '../types';
import { haversineKm } from './gisService';

// ── Utilidades de navegación y enrutamiento ──────────────────────────────
export const fetchRoutePolyline = async (stops: Stop[]): Promise<string | undefined> => {
    if (!stops || stops.length < 2) return undefined;
    try {
        const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
        const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=polyline`;
        const res = await fetch(url, { signal: (AbortSignal as any).timeout?.(5000) });
        if (res.ok) {
            const data = await res.json();
            if (data.code === 'Ok' && data.routes?.[0]?.geometry) {
                return data.routes[0].geometry;
            }
        }
    } catch (e) {
        console.warn("Global routing fetch failed:", e);
    }
    return undefined;
};

// ── Utilidades de optimización de ruta (9 reglas de pront-calcular-rutas) ─
// Regla 1: Distancia Haversine entre dos puntos en km
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    return haversineKm(lat1, lon1, lat2, lon2);
};

// Regla 1: Construye la matriz NxN de distancias entre todas las paradas
const buildDistanceMatrix = (stops: Stop[]): number[][] => {
    const n = stops.length;
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const d = haversineDistance(stops[i].latitude, stops[i].longitude, stops[j].latitude, stops[j].longitude);
            matrix[i][j] = d;
            matrix[j][i] = d;
        }
    }
    return matrix;
};

// Regla 5: Detecta paradas en el mismo edificio (<30m) que deben ir consecutivas
const groupSameBuilding = (stops: Stop[], distMatrix: number[][]): Map<number, number[]> => {
    const groups = new Map<number, number[]>();
    const assigned = new Set<number>();
    for (let i = 0; i < stops.length; i++) {
        if (assigned.has(i)) continue;
        const group = [i];
        for (let j = i + 1; j < stops.length; j++) {
            if (assigned.has(j)) continue;
            if (distMatrix[i][j] < 0.030) { // < 30 metros
                group.push(j);
                assigned.add(j);
            }
        }
        if (group.length > 1) {
            for (const idx of group) {
                groups.set(idx, group);
                assigned.add(idx);
            }
        }
    }
    return groups;
};

// Regla 6: Agrupa paradas en clusters por proximidad (threshold en km)
const clusterStops = (stops: Stop[], distMatrix: number[][], threshold = 0.150): number[][] => {
    const n = stops.length;
    const visited = new Set<number>();
    const clusters: number[][] = [];

    for (let i = 0; i < n; i++) {
        if (visited.has(i)) continue;
        const cluster = [i];
        visited.add(i);
        // BFS para encontrar paradas conectadas dentro del umbral
        const queue = [i];
        while (queue.length > 0) {
            const current = queue.shift()!;
            for (let j = 0; j < n; j++) {
                if (!visited.has(j) && distMatrix[current][j] <= threshold) {
                    cluster.push(j);
                    visited.add(j);
                    queue.push(j);
                }
            }
        }
        clusters.push(cluster);
    }
    return clusters;
};

// Regla 2: Nearest Neighbor TSP probando TODOS los puntos de inicio
const nearestNeighborTSP = (stops: Stop[], distMatrix: number[][]): number[] => {
    const n = stops.length;
    if (n <= 2) return stops.map((_, i) => i);

    const buildingGroups = groupSameBuilding(stops, distMatrix);
    const clusters = clusterStops(stops, distMatrix);

    let bestOrder: number[] = [];
    let bestDist = Infinity;

    for (let start = 0; start < n; start++) {
        const visited = new Set<number>();
        const order: number[] = [];
        let current = start;

        while (order.length < n) {
            if (visited.has(current)) {
                let minD = Infinity;
                let next = -1;
                for (let j = 0; j < n; j++) {
                    if (!visited.has(j) && distMatrix[current][j] < minD) {
                        minD = distMatrix[current][j];
                        next = j;
                    }
                }
                if (next === -1) break;
                current = next;
            }

            order.push(current);
            visited.add(current);

            const buildingGroup = buildingGroups.get(current);
            if (buildingGroup) {
                for (const buddy of buildingGroup) {
                    if (!visited.has(buddy)) {
                        order.push(buddy);
                        visited.add(buddy);
                    }
                }
            }

            const currentCluster = clusters.find(c => c.includes(current));
            if (currentCluster) {
                const remaining = currentCluster.filter(idx => !visited.has(idx));
                remaining.sort((a, b) => distMatrix[current][a] - distMatrix[current][b]);
                for (const idx of remaining) {
                    if (!visited.has(idx)) {
                        order.push(idx);
                        visited.add(idx);
                        const bg = buildingGroups.get(idx);
                        if (bg) {
                            for (const buddy of bg) {
                                if (!visited.has(buddy)) {
                                    order.push(buddy);
                                    visited.add(buddy);
                                }
                            }
                        }
                    }
                }
            }

            let minD = Infinity;
            let next = -1;
            for (let j = 0; j < n; j++) {
                if (!visited.has(j) && distMatrix[current][j] < minD) {
                    minD = distMatrix[current][j];
                    next = j;
                }
            }
            if (next === -1) break;
            current = next;
        }

        let totalDist = 0;
        for (let i = 0; i < order.length - 1; i++) {
            totalDist += distMatrix[order[i]][order[i + 1]];
        }
        if (totalDist < bestDist) {
            bestDist = totalDist;
            bestOrder = [...order];
        }
    }

    return bestOrder;
};

// Regla 2 (complemento): 2-opt local search para deshacer cruces
const twoOptImprove = (order: number[], distMatrix: number[][]): number[] => {
    const n = order.length;
    if (n < 4) return order;

    let improved = true;
    let route = [...order];

    while (improved) {
        improved = false;
        for (let i = 0; i < n - 2; i++) {
            for (let j = i + 2; j < n; j++) {
                if (j === n - 1 && i === 0) continue; 

                const currentDist = distMatrix[route[i]][route[i + 1]] + distMatrix[route[j]][route[(j + 1) % n]];
                const newDist = distMatrix[route[i]][route[j]] + distMatrix[route[i + 1]][route[(j + 1) % n]];

                if (newDist < currentDist - 0.001) { 
                    const reversed = route.slice(i + 1, j + 1).reverse();
                    route = [...route.slice(0, i + 1), ...reversed, ...route.slice(j + 1)];
                    improved = true;
                }
            }
        }
    }
    return route;
};

const applyFamousLastRule = (order: number[], stops: Stop[], distMatrix: number[][]): number[] => {
    if (order.length < 3) return order;

    let maxReward = 0;
    let famousIdx = -1;
    for (const idx of order) {
        const reward = stops[idx].photoSpot?.milesReward || 0;
        if (reward > maxReward) {
            maxReward = reward;
            famousIdx = idx;
        }
    }

    if (famousIdx === -1 || order[order.length - 1] === famousIdx) return order;

    let currentTotal = 0;
    for (let i = 0; i < order.length - 1; i++) {
        currentTotal += distMatrix[order[i]][order[i + 1]];
    }

    const withoutFamous = order.filter(idx => idx !== famousIdx);
    withoutFamous.push(famousIdx);

    let newTotal = 0;
    for (let i = 0; i < withoutFamous.length - 1; i++) {
        newTotal += distMatrix[withoutFamous[i]][withoutFamous[i + 1]];
    }

    if (newTotal <= currentTotal * 1.20) {
        return withoutFamous;
    }

    return order;
};

export const calculateRouteDistance = (order: number[], distMatrix: number[][]): number => {
    let total = 0;
    for (let i = 0; i < order.length - 1; i++) {
        total += distMatrix[order[i]][order[i + 1]];
    }
    return total;
};

export const calculateDuration = (distanceKm: number, numStops: number): string => {
    const walkingMinutes = distanceKm * 15;       
    const stopMinutes = numStops * 7.5;            
    const photoMargin = 20;                        
    const totalMinutes = Math.round(walkingMinutes + stopMinutes + photoMargin);

    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export const optimizeStopOrder = async (tour: Tour): Promise<Tour> => {
    if (!tour.stops || tour.stops.length < 3) return tour;

    const stops = tour.stops;
    const distMatrix = buildDistanceMatrix(stops);

    let order = nearestNeighborTSP(stops, distMatrix);
    order = twoOptImprove(order, distMatrix);
    order = applyFamousLastRule(order, stops, distMatrix);

    let reorderedStops = order.map(i => stops[i]);

    const mergedStops: Stop[] = [];
    for (let i = 0; i < reorderedStops.length; i++) {
        let current = reorderedStops[i];
        let wasDropped = false;

        for (let j = 0; j < mergedStops.length; j++) {
            let existing = mergedStops[j];
            const dist = haversineKm(current.latitude, current.longitude, existing.latitude, existing.longitude);

            if (dist < 0.015) {
                console.log(`🗺️ DROP: '${current.name}' solapado a ${dist.toFixed(3)}km de '${existing.name}'. Punto excluido del tour para evitar redundancia.`);
                wasDropped = true;
                break;
            }
        }
        if (!wasDropped) {
            mergedStops.push(current);
        }
    }
    reorderedStops = mergedStops;

    // REGLA DE ORO: Recalcular distancia y duración sobre el array FINAL de paradas depuradas
    let finalDistKm = 0;
    for (let i = 0; i < reorderedStops.length - 1; i++) {
        finalDistKm += haversineKm(
            reorderedStops[i].latitude, reorderedStops[i].longitude, 
            reorderedStops[i+1].latitude, reorderedStops[i+1].longitude
        );
    }
    
    const newDistance = `${finalDistKm.toFixed(1)} km`;
    const newDuration = calculateDuration(finalDistKm, reorderedStops.length);

    const routePolyline = await fetchRoutePolyline(reorderedStops);

    console.log(`🗺️ Route optimized: ${tour.title} — ${reorderedStops.length} stops, ${newDistance}, ~${newDuration} (Polyline: ${routePolyline ? 'Yes ✅' : 'No ⚠️'})`);

    return {
        ...tour,
        stops: reorderedStops,
        distance: newDistance,
        duration: newDuration,
        routePolyline: routePolyline || tour.routePolyline
    };
};
