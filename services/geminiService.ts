import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { supabase, getCachedAudio, normalizeKey } from './supabaseClient';

// ── Singleton: una sola instancia para todo el módulo ──────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ── Tipos auxiliares ───────────────────────────────────────────────────────
type CityTier = 'SMALL' | 'MEDIUM' | 'LARGE';

interface CityInfo {
    lat: number;
    lng: number;
    population: number | null;
}

// ── Clases de error propias ────────────────────────────────────────────────
export class QuotaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuotaError";
    }
}

// ── Wrapper con reintentos y backoff exponencial ───────────────────────────
const handleAiCall = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return handleAiCall(fn, retries - 1, delay * 2);
            }
            throw new QuotaError("Límite excedido. Por favor, usa tu clave API.");
        }
        throw error;
    }
};

// ── Traduce o normaliza la búsqueda del usuario ───────────────────────────
export const translateSearchQuery = async (input: string): Promise<{ english: string, detected: string }> => {
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Identify the city/location in this query: "${input}". Translate the city name to English. 
            Return JSON object: { "english": "English Name", "detected": "Detected Language Code" }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        english: { type: Type.STRING },
                        detected: { type: Type.STRING }
                    },
                    required: ["english", "detected"]
                }
            }
        });
        return JSON.parse(response.text || '{"english": "' + input + '", "detected": "unknown"}');
    });
};

// ── Normaliza el nombre de ciudad con IA ──────────────────────────────────
export const normalizeCityWithAI = async (input: string, userLanguage: string): Promise<any[]> => {
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user typed: "${input}" in language "${userLanguage}" and is looking for a city or town to visit.

RULES:
- Correct any typos (e.g. "florensia" → Florence, "barcelon" → Barcelona, "madri" → Madrid).
- Recognize city/town names in ANY language and translate to English internally.
  Examples: "Londres"=London UK, "Florencia"=Florence Italy, "Londra"=London UK, "Nueva York"=New York USA, "倫敦"=London UK, "لندن"=London UK
- CRITICAL: If the city name exists in multiple countries, return ALL of them.
  Example: "Logrono" → Logroño Spain, Logroño Ecuador, Logroño Argentina (all 3!)
  Example: "London" → London UK, London Ontario Canada, London Ohio USA
  Example: "Florence" → Florence Italy, Florence Alabama USA, Florence South Carolina USA
  Example: "Santiago" → Santiago Chile, Santiago de Compostela Spain
  Example: "Victoria" → Victoria Canada, Victoria Australia, Victoria Seychelles
- Return between 1 and 5 results, most famous/relevant first.
- NEVER return only 1 result if the name exists in multiple places.

For each result return:
- "cityEn": Official city name in ENGLISH ONLY. Never use accents or local language names.
- "cityLocal": City name translated to "${userLanguage}". If no translation exists, use English.
- "country": Country name in "${userLanguage}".
- "countryEn": Country name in ENGLISH ONLY (e.g. "Italy", "United Kingdom", "United States").
- "countryCode": 2-letter ISO country code in UPPERCASE (e.g. "IT", "GB", "US", "ES").

CRITICAL: cityEn and countryEn MUST always be in English. Never use Spanish, French, or any other language for these two fields.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            cityEn:      { type: Type.STRING },
                            cityLocal:   { type: Type.STRING },
                            country:     { type: Type.STRING },
                            countryEn:   { type: Type.STRING },
                            countryCode: { type: Type.STRING },
                        },
                        required: ["cityEn", "cityLocal", "country", "countryEn", "countryCode"]
                    }
                }
            }
        });

        const raw = JSON.parse(response.text || '[]');
        return raw.map((r: any) => ({
            city: r.cityEn,
            cityLocal: r.cityLocal || r.cityEn,
            country: r.country,
            countryEn: r.countryEn,
            countryCode: r.countryCode,
            slug: normalizeKey(r.cityEn, r.countryEn),
            fullName: r.cityLocal || r.cityEn
        }));
    });
};

// ── Obtiene coords + población via Nominatim ──────────────────────────────
const getCityInfo = async (city: string, country: string): Promise<CityInfo | null> => {
    try {
        const query = encodeURIComponent(`${city}, ${country}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1&extratags=1`, {
            headers: { 'Accept-Language': 'en', 'User-Agent': 'bdai-travel-app/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            const population = data[0].extratags?.population
                ? parseInt(data[0].extratags.population, 10)
                : null;
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                population
            };
        }
    } catch (e) {
        console.warn('Nominatim city lookup failed:', e);
    }
    return null;
};

// ── Clasifica la localidad en 3 niveles ───────────────────────────────────
const getCityTier = (population: number | null): CityTier => {
    if (population === null) return 'MEDIUM'; // Sin datos → asumimos tamaño medio
    if (population < 10_000) return 'SMALL';
    if (population < 200_000) return 'MEDIUM';
    return 'LARGE';
};

// ── Valida coordenadas de una parada contra Nominatim con Pipeline Híbrido ──
const verifyStopCoordinates = async (stop: Stop, city: string, country: string, cityCenter: {lat: number, lng: number} | null): Promise<Stop> => {
    try {
        let cleanName = stop.name.split('-')[0].split('(')[0].split(/ y | e | \/ /i)[0].trim();
        const query = encodeURIComponent(`${cleanName}, ${city}, ${country}`);
        
        const headers = { 'Accept-Language': 'es', 'User-Agent': 'bdai-app-' + Math.floor(Math.random()*10000) };

        // Fase 1: Anclaje al Centro Real. Búsqueda muy estricta a ~4km a la redonda del centro urbano.
        let data: any[] = [];
        if (cityCenter) {
            const viewbox = `${cityCenter.lng - 0.04},${cityCenter.lat + 0.04},${cityCenter.lng + 0.04},${cityCenter.lat - 0.04}`;
            const boundedUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&viewbox=${viewbox}&bounded=1`;
            const boundedRes = await fetch(boundedUrl, { headers });
            if (boundedRes.ok) data = await boundedRes.json();
            else if (boundedRes.status === 429) console.error("!!! NOMINATIM BANNED (429) - Slow down !!!");
        }

        // Fase 2: Búsqueda Libre. Si no aparece en la caja estricta, probamos libremente en la ciudad.
        if (data.length === 0) {
            await new Promise(r => setTimeout(r, 1100)); // Obligatorio esperar 1s antes de otro hit
            const freeUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
            const freeRes = await fetch(freeUrl, { headers });
            if (freeRes.ok) data = await freeRes.json();
            else if (freeRes.status === 429) console.error("!!! NOMINATIM BANNED (429) !!!");
        }
        
        if (data && data.length > 0) {
            const nomLat = parseFloat(data[0].lat);
            const nomLon = parseFloat(data[0].lon);
            
            // Validación de control: Evita que Nominatim asigne París, Texas, si se buscó París, Francia.
            let distToCenterKm = 0;
            if (cityCenter) {
                // Como `haversineDistance` se declara más abajo, usamos lógica in-line por hoisting seguro o lo llamamos si está disponible
                const R = 6371;
                const dLat = (nomLat - cityCenter.lat) * Math.PI / 180;
                const dLon = (nomLon - cityCenter.lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(cityCenter.lat * Math.PI / 180) * Math.cos(nomLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
                distToCenterKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            }
            
            // Si está a < 15km del centro de la ciudad, confiamos en Nominatim por encima de Gemini
            if (!cityCenter || distToCenterKm <= 15) {
                return {
                    ...stop,
                    latitude: nomLat,
                    longitude: nomLon,
                    coordinatesVerified: true
                };
            } else {
                console.warn(`GIS: Nominatim encontró ${stop.name} pero a ${distToCenterKm.toFixed(1)}km del centro de ${city}. Desviación extrema.`);
            }
        } else {
             console.warn(`GIS: Nominatim NO pudo encontrar ${stop.name} en OpenStreetMap. Posible alucinación o calle sin número.`);
        }
    } catch (e) {
        console.warn(`GIS Check failed for ${stop.name}`);
    }
    // Fallback: Nos quedamos con las de Gemini sin verificar
    return { ...stop, coordinatesVerified: false };
};

// ── Geocodifica todas las paradas de un tour (concurrente, pool de 4) ────
const processTourStops = async (tour: Tour, city: string, country: string, cityCenter: {lat: number, lng: number} | null): Promise<Tour> => {
    const stops = tour.stops;
    const CONCURRENCY = 1; // Nominatim RESTRICTS to 1 request per second max. Violating this triggers 429 HTTP errors and IP bans.
    const results: Stop[] = [];

    // Procesa secuencialmente para respetar Nominatim
    for (let i = 0; i < stops.length; i += CONCURRENCY) {
        const batch = stops.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
            batch.map(stop => verifyStopCoordinates(stop, city, country, cityCenter))
        );
        for (const res of batchResults) {
            if (cityCenter) {
                const R = 6371;
                const dLat = (res.latitude - cityCenter.lat) * Math.PI / 180;
                const dLon = (res.longitude - cityCenter.lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(cityCenter.lat * Math.PI / 180) * Math.cos(res.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
                const distToCenterKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                if (distToCenterKm > 15) {
                    console.warn(`GIS: Eliminando '${res.name}' por estar a ${distToCenterKm.toFixed(1)}km del centro de ${city}. Alucinación o desvío catastrófico de Nominatim.`);
                    continue; // Skip
                }
            }
            results.push(res);
        }
        if (i + CONCURRENCY < stops.length) {
            await new Promise(r => setTimeout(r, 1200)); // Esperar >1000ms
        }
    }

    return { ...tour, stops: results };
};

// ── Utilidades de navegación y enrutamiento ──────────────────────────────
export const fetchRoutePolyline = async (stops: Stop[]): Promise<string | undefined> => {
    if (!stops || stops.length < 2) return undefined;
    try {
        const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
        const url = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coords}?overview=full&geometries=polyline`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

    // Regla 5 + 6: pre-calcular agrupaciones
    const buildingGroups = groupSameBuilding(stops, distMatrix);
    const clusters = clusterStops(stops, distMatrix);

    let bestOrder: number[] = [];
    let bestDist = Infinity;

    // Probar cada parada como punto de inicio
    for (let start = 0; start < n; start++) {
        const visited = new Set<number>();
        const order: number[] = [];
        let current = start;

        while (order.length < n) {
            if (visited.has(current)) {
                // Buscar siguiente no visitado más cercano
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

            // Regla 5: si current tiene compañeros de edificio, añadirlos todos
            const buildingGroup = buildingGroups.get(current);
            if (buildingGroup) {
                for (const buddy of buildingGroup) {
                    if (!visited.has(buddy)) {
                        order.push(buddy);
                        visited.add(buddy);
                    }
                }
            }

            // Regla 6: si quedan paradas del mismo cluster, priorizarlas
            const currentCluster = clusters.find(c => c.includes(current));
            if (currentCluster) {
                const remaining = currentCluster.filter(idx => !visited.has(idx));
                // Ordenar remaining por distancia al current
                remaining.sort((a, b) => distMatrix[current][a] - distMatrix[current][b]);
                for (const idx of remaining) {
                    if (!visited.has(idx)) {
                        order.push(idx);
                        visited.add(idx);
                        // También respetar regla 5 para estos
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

            // Siguiente: vecino más cercano no visitado
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

        // Calcular distancia total de esta ruta
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
                if (j === n - 1 && i === 0) continue; // Evitar invertir toda la ruta

                const currentDist = distMatrix[route[i]][route[i + 1]] + distMatrix[route[j]][route[(j + 1) % n]];
                const newDist = distMatrix[route[i]][route[j]] + distMatrix[route[i + 1]][route[(j + 1) % n]];

                if (newDist < currentDist - 0.001) { // Umbral para evitar ruido flotante
                    // Invertir el segmento entre i+1 y j
                    const reversed = route.slice(i + 1, j + 1).reverse();
                    route = [...route.slice(0, i + 1), ...reversed, ...route.slice(j + 1)];
                    improved = true;
                }
            }
        }
    }
    return route;
};

// Regla 3: Mueve la parada más famosa (mayor milesReward) al final si desvío ≤ 20%
const applyFamousLastRule = (order: number[], stops: Stop[], distMatrix: number[][]): number[] => {
    if (order.length < 3) return order;

    // Encontrar la parada con mayor milesReward
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

    // Calcular distancia actual
    let currentTotal = 0;
    for (let i = 0; i < order.length - 1; i++) {
        currentTotal += distMatrix[order[i]][order[i + 1]];
    }

    // Construir ruta alternativa con famousIdx al final
    const withoutFamous = order.filter(idx => idx !== famousIdx);
    withoutFamous.push(famousIdx);

    let newTotal = 0;
    for (let i = 0; i < withoutFamous.length - 1; i++) {
        newTotal += distMatrix[withoutFamous[i]][withoutFamous[i + 1]];
    }

    // Solo aplicar si el desvío no supera el 20%
    if (newTotal <= currentTotal * 1.20) {
        return withoutFamous;
    }

    return order;
};

// Regla 8: Calcula distancia total de la ruta en km
const calculateRouteDistance = (order: number[], distMatrix: number[][]): number => {
    let total = 0;
    for (let i = 0; i < order.length - 1; i++) {
        total += distMatrix[order[i]][order[i + 1]];
    }
    return total;
};

// Regla 8: Calcula duración estimada del tour
const calculateDuration = (distanceKm: number, numStops: number): string => {
    const walkingMinutes = distanceKm * 15;       // 15 min/km ritmo turístico
    const stopMinutes = numStops * 7.5;            // 7.5 min promedio por parada
    const photoMargin = 20;                        // 20 min margen para fotos
    const totalMinutes = Math.round(walkingMinutes + stopMinutes + photoMargin);

    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

// Orquestador: aplica todo el pipeline de optimización a un tour (reglas 7, 8, 9)
const optimizeStopOrder = async (tour: Tour): Promise<Tour> => {
    if (!tour.stops || tour.stops.length < 3) return tour;

    const stops = tour.stops;
    const distMatrix = buildDistanceMatrix(stops);

    // 1. Nearest Neighbor TSP con clusters y agrupación de edificios
    let order = nearestNeighborTSP(stops, distMatrix);

    // 2. 2-opt para deshacer cruces
    order = twoOptImprove(order, distMatrix);

    // 3. Regla de oro: parada famosa al final (si coste ≤ 20%)
    order = applyFamousLastRule(order, stops, distMatrix);

    // 4. Reordenar stops según el nuevo orden
    const reorderedStops = order.map(i => stops[i]);

    // 5. Recalcular distance y duration con las funciones de cálculo del módulo
    const totalDistKm = calculateRouteDistance(order, distMatrix);
    const newDistance = `${totalDistKm.toFixed(1)} km`;
    const newDuration = calculateDuration(totalDistKm, reorderedStops.length);

    // 6. Obtener la Polyline real desde OSRM para persistir en caché (Opción B)
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

// ── Generación adaptada de tours por nivel de ciudad ─────────────────────
export const generateToursForCity = async (
    city: string,
    country: string,
    user: UserProfile,
    onProgress?: (tour: Tour) => void
): Promise<Tour[]> => {

    // 1. Datos geográficos reales para anclar la generación
    const cityInfo = await getCityInfo(city, country);
    // Eliminar el sistema de tiers basado en población. Usamos una directiva universal.
    // getCityTier y population ya no limitan agresivamente a la IA
    const coordsAnchor = cityInfo
        ? `The exact center of ${city} is at latitude ${cityInfo.lat.toFixed(6)}, longitude ${cityInfo.lng.toFixed(6)}. ALL stops must be within 2km of this point.`
        : `All stops must be located within the urban area of ${city}, ${country}.`;

    const prompt = `You are generating tours for ${city}, ${country} in ${user.language}.

GEOGRAPHIC ANCHOR (CRITICAL): ${coordsAnchor}

UNIVERSAL RIGOR & NO-INVENTION RULE:
- Find the PERFECT BALANCE: Do not discard obscure but real places, but absolutely NEVER HALLUCINATE non-existent ones (e.g., if it can't be found on the internet, DO NOT invent it).
- ALL places MUST be 100% real, verifiable, documented, and existing today.
- NEVER invent street names, bars, monuments, or hidden spots. 
- GEOGRAPHIC STRICTNESS: ALL places MUST realistically exist physically inside the borders of ${city}, ${country}. Do NOT borrow or import real places from other cities or distant towns under any circumstance. If you run out of real places in ${city}, simply stop. 

DEEP RETRIEVAL FOR DYNAMIC TOUR COUNT (CRITICAL):
Your PRIMARY GOAL is to generate exactly 3 thematic tours (up to 36 stops total, max 12 stops per tour). 
To achieve this, you MUST perform a DEEP RETRIEVAL of your knowledge base for ${city} and its specific regional heritage. Search exhaustively for:
- Historic civil & religious architecture
- Traditional local markets and plazas
- Authentic cultural, artistic, or gastronomic hot-spots specific to this region
- Iconic local viewpoints or parks
- Verified hidden local gems and specific building numbers

ONLY if the city genuinely lacks the real, verifiable heritage to reach 24-36 valid stops without inventing, you should gracefully degrade:
- If fewer than 12 truly real stops exist: generate EXACTLY 1 tour (up to 12 stops).
- If 12 to 23 truly real stops exist: generate EXACTLY 2 tours (up to 12 stops each).
- If 24 or more real stops exist: generate EXACTLY 3 tours (up to 12 stops each).
DO NOT repeat any stop across tours. DO NOT generate more tours than what you can fill entirely with VERIFIABLE places.

THEMES TO USE (pick as many as needed based on stop count above):
1. "Hidden Gems & Dark Secrets"
2. "Historical & Architectural Marvels"
3. "Local Traditions, Art, Food & Authentic Culture" (Focus on the true regional heritage, gastronomy, and art that make this place unique worldwide).
(If only 1 tour, use the most fitting theme or combine them in the title.)

DAI'S ABSOLUTE COMMANDS:
- You are DAI. You are SARCASTIC, WITTY, and SOPHISTICATED.
- TRUTH FIRST, STYLE SECOND. Before adding any wit or sarcasm, verify the place actually exists and is open TODAY. Your humor is the cherry on top of undeniable truth — not a substitute for it.
- NEVER INVENT A NAME OR A STOP. It is strictly forbidden to hallucinate buildings, bars, or castles. If Wikipedia or Google Maps doesn't know it, YOU MUST NOT INCLUDE IT.
- Wikipedia is your enemy. If you sound like an encyclopedia, you fail.
- Tell the secrets, the mysteries, and the dark curiosities.
- Mock the "typical" tourist while revealing the true soul of the city.
- NEVER use citations like [1] or (2). NEVER.

STRICT CATEGORIZATION RULES (CRITICAL):
- 'architecture': MUST be used for ALL churches, cathedrals, bridges, iconic buildings, and skyscrapers.
- 'historical': MUST be used for palaces, castles, ruins, and monuments.
- 'culture': ONLY for theaters, music venues, festivals, or intangible traditions.
- 'food': ONLY for places where you eat or buy food.
- 'art': ONLY for museums, galleries, or street art.
- 'nature': ONLY for parks, gardens, or viewpoints.
- 'photo': ONLY for spots whose primary value is the view/photo.

FORMAT RULES:
1. Return ONLY a valid JSON array.
2. Tour object: { "id", "city": "${city}", "title", "description", "duration", "distance", "theme", "stops": [] }
3. Each stop: { "id", "name", "description" (150-200 words), "latitude" (NUMBER, e.g. 40.4168), "longitude" (NUMBER, e.g. -3.7038), "type", "photoSpot": { "angle", "milesReward": 50, "secretLocation" } }
4. COORDINATES ARE CRITICAL: Use the geographic anchor above. All stops must be strictly within the boundaries of ${city}.
   - CRITICAL RULE: NEVER use a random location. Your coordinates should map to the MAIN ENTRANCE.
5. Content in ${user.language}.`;

    const systemInstruction = `You are DAI, a highly intelligent, elegant, and SARCASTIC AI travel guide.
You HATE boring Wikipedia-style descriptions.
Your tone is witty, sophisticated, and slightly mocking of typical tourists.

DAI STYLE REFERENCE (CRITICAL):
"La Redonda es a Logroño lo que las perlas a un buen collar: el centro de todas las miradas. Se llama así porque se levantó sobre una iglesia románica circular, aunque de redonda ahora solo tiene el nombre y quizás las ganas de dar vueltas por su interior. Lo más espectacular son sus torres gemelas, un alarde de barroco que te hace sentir pequeño, como debe ser. Por dentro, el silencio es majestuoso. Busca el cuadro atribuido a Miguel Ángel; si es verdad o no, es irrelevante, lo que importa es la elegancia de la leyenda. Es un espacio que respira historia y donde la piedra parece haber absorbido los susurros de siglos de peregrinos. Un lugar idóneo para practicar la humildad o simplemente para admirar cómo se construía cuando no había prisa por terminar antes del próximo trimestre fiscal."

You love sharing the dark secrets, mysteries, and curiosities of cities.
You NEVER use citations, footnotes, or references.
You are real, accurate, but never boring.
TRUTH BEFORE STYLE: Always confirm a place exists before describing it. Wit is meaningless without accuracy.
CATEGORIZATION IS CRITICAL: A Cathedral or Church is ALWAYS 'architecture'. A Palace is ALWAYS 'historical'. NEVER use 'culture' for buildings.
GEOGRAPHIC ACCURACY IS CRITICAL: Every stop must be physically inside the city. Place stops within 2km radius of the provided center. Never place stops in neighboring towns or wrong locations.`;

    return handleAiCall(async () => {
        const allTours: Tour[] = [];
        let accumulated = '';
        let toursEmitted = 0;

        try {
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { 
                    systemInstruction,
                    temperature: 0.7,
                    topP: 1,
                    topK: 1
                },
            });

            for await (const chunk of stream) {
                const chunkText = chunk.text || '';
                accumulated += chunkText;

                if (onProgress && toursEmitted < 3) {
                    const parsed = tryExtractTours(accumulated);
                    while (parsed.length > toursEmitted) {
                        let tour = parsed[toursEmitted];
                        if (tour && tour.stops && tour.stops.length > 0) {
                            tour = await processTourStops(tour, city, country, cityInfo);
                            tour = await optimizeStopOrder(tour);
                            onProgress(tour);
                            allTours.push(tour);
                        }
                        toursEmitted++;
                    }
                }
            }

            const finalText = accumulated
                .replace(/\[\d+\]/g, '')
                .replace(/\(\d+\)/g, '')
                .replace(/【\d+†source】/g, '')
                .replace(/\[source\]/g, '')
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            const finalTours = tryExtractTours(finalText);

            if (onProgress) {
                while (toursEmitted < finalTours.length) {
                    let tour = finalTours[toursEmitted];
                    if (tour && tour.stops && tour.stops.length > 0) {
                        tour = await processTourStops(tour, city, country, cityInfo);
                        tour = await optimizeStopOrder(tour);
                        onProgress(tour);
                        allTours.push(tour);
                    }
                    toursEmitted++;
                }
            }

            if (allTours.length === 0) {
                for (let i = 0; i < finalTours.length; i++) {
                    if (finalTours[i] && finalTours[i].stops?.length > 0) {
                        finalTours[i] = await processTourStops(finalTours[i], city, country, cityInfo);
                        finalTours[i] = await optimizeStopOrder(finalTours[i]);
                    }
                }
            }

            return allTours.length > 0 ? allTours : finalTours.filter(t => t && t.stops && t.stops.length > 0);

        } catch (streamError) {
            console.warn("Streaming failed, falling back to non-streaming", streamError);
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { 
                    systemInstruction,
                    temperature: 0.7,
                    topP: 1,
                    topK: 1
                },
            });
            const text = (response.text || '[]')
                .replace(/\[\d+\]/g, '')
                .replace(/\(\d+\)/g, '')
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            let tours = tryExtractTours(text);
            tours = await Promise.all(tours.map(async t => t?.stops?.length > 0 ? await optimizeStopOrder(t) : t));
            if (onProgress) tours.forEach(t => { if (t?.stops?.length > 0) onProgress(t); });
            return tours.filter(t => t && t.stops && t.stops.length > 0);
        }
    });
};

// ── Extracción robusta de tours del JSON parcial/streaming ────────────────
const tryExtractTours = (text: string): Tour[] => {
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const firstBracket = cleanText.indexOf('[');
    const lastBracket = cleanText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
    }

    try {
        const parsed = JSON.parse(cleanText);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {
        // Expected during streaming, silently fallback to regex extraction
    }

    const tours: Tour[] = [];
    try {
        const tourMatches = text.matchAll(/\{[^{}]*"stops"\s*:\s*\[[^\]]*(?:\{[^{}]*\}[^\]]*)*\][^{}]*\}/gs);
        for (const match of tourMatches) {
            try {
                const tour = JSON.parse(match[0]);
                if (tour && tour.stops) tours.push(tour);
            } catch {}
        }
    } catch {}

    return tours;
};

// ── Mapa de voces por idioma para TTS (Inutilizado en cliente, movido a Edge Function) ─────
const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck'
};

// ── Generación de audio con caché y tono DAI (Proxy a Edge Function) ──
export const generateAudio = async (text: string, language: string, city: string): Promise<string | null> => {
    const cleanText = (text || "").trim();
    if (!cleanText) return null;

    try {
        // 1. Invocamos la Edge Function (Seguridad Nivel Experto)
        // La función centraliza: Generación Gemini -> Compresión -> Storage -> DB Cache
        const { data, error } = await supabase.functions.invoke('generate-audio-dai', {
            body: { text, language, city }
        });

        if (error || !data?.url) {
            console.error("Edge Function error:", error);
            return null;
        }

        return data.url;
    } catch (e) {
        console.error("Error calling generate-audio-dai:", e);
        return null;
    }
};

// ── Traducción batch de tours completos ───────────────────────────────────
export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate to ${targetLanguage}: ${JSON.stringify(tours)}. Keep technical photo advice.`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

// ── Moderación básica de contenido ────────────────────────────────────────
export const moderateContent = async (text: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Is this text safe? "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { isSafe: { type: Type.BOOLEAN } }
                }
            }
        });
        return JSON.parse(response.text || '{"isSafe": false}').isSafe;
    });
};

// ── Status de la API ──────────────────────────────────────────────────────
export const checkApiStatus = async (): Promise<{ ok: boolean, message: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Say 'OK'",
        });
        if (response.text) return { ok: true, message: "API is responding" };
        return { ok: false, message: "Empty response" };
    } catch (e: any) {
        return { ok: false, message: e.message || "Error connecting to API" };
    }
};

// ── Generación de postal/imagen de ciudad ─────────────────────────────────
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-preview-image-generation',
            contents: { parts: [{ text: `Postcard of ${city}` }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                imageConfig: { aspectRatio: "9:16" }
            }
        });
        const parts = response.candidates?.[0]?.content?.parts;
        const part = parts?.find((p: any) => p.inlineData);
        return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
};
