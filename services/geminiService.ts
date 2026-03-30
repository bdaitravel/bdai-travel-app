import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

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

// ── Valida coordenadas de una parada contra Nominatim ────────────────────
const verifyStopCoordinates = async (stop: Stop, city: string, country: string): Promise<Stop> => {
    try {
        const cleanName = stop.name.split('-')[0].split('(')[0].trim();
        const query = encodeURIComponent(`${cleanName}, ${city}, ${country}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
            headers: { 'Accept-Language': 'es', 'User-Agent': 'bdai-travel-app/GIS-Check' }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                return {
                    ...stop,
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon),
                    coordinatesVerified: true
                };
            }
        }
    } catch (e) {
        console.warn(`GIS Check failed for ${stop.name}`);
    }
    // Nominatim no encontró el lugar: se devuelven las coords de Gemini sin verificar
    return { ...stop, coordinatesVerified: false };
};

// ── Geocodifica todas las paradas de un tour (concurrente, pool de 4) ────
const processTourStops = async (tour: Tour, city: string, country: string): Promise<Tour> => {
    const stops = tour.stops;
    const CONCURRENCY = 4; // Máximo simultáneo para no saturar Nominatim
    const results: Stop[] = new Array(stops.length);

    // Procesa en batches de CONCURRENCY con 250ms entre batches
    for (let i = 0; i < stops.length; i += CONCURRENCY) {
        const batch = stops.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
            batch.map(stop => verifyStopCoordinates(stop, city, country))
        );
        batchResults.forEach((result, j) => { results[i + j] = result; });
        // Pequeña pausa entre batches para respetar el rate limit de Nominatim
        if (i + CONCURRENCY < stops.length) {
            await new Promise(r => setTimeout(r, 250));
        }
    }

    return { ...tour, stops: results };
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
const optimizeStopOrder = (tour: Tour): Tour => {
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

    // 5. Recalcular distance y duration
    const totalDistKm = calculateRouteDistance(order, distMatrix);
    const newDistance = totalDistKm < 1
        ? `${Math.round(totalDistKm * 1000)}m`
        : `${totalDistKm.toFixed(1)} km`;
    const newDuration = calculateDuration(totalDistKm, reorderedStops.length);

    console.log(`🗺️ Route optimized: ${tour.title} — ${stops.length} stops, ${newDistance}, ~${newDuration}`);

    return {
        ...tour,
        stops: reorderedStops,
        distance: newDistance,
        duration: newDuration
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
    const tier = getCityTier(cityInfo?.population ?? null);

    const coordsAnchor = cityInfo
        ? `The exact center of ${city} is at latitude ${cityInfo.lat.toFixed(6)}, longitude ${cityInfo.lng.toFixed(6)}. ALL stops must be within 2km of this point.`
        : `All stops must be located within the urban area of ${city}, ${country}.`;

    // 2. Reglas de calidad según nivel (la cantidad de tours la decide la IA según contenido)
    const inventionRules = {
        SMALL: `STOP RULES FOR SMALL TOWNS (CRITICAL):
- Include ONLY real, documented, and verifiable places with a proper name.
- DO NOT INVENT street names, bar names, shops, or local monuments.
- If a place cannot be confirmed to exist today, DO NOT include it.
- Quality always beats quantity: fewer real stops are better than more invented ones.`,
        MEDIUM: `STOP RULES FOR MEDIUM CITIES:
- Prioritize real, documented places. Avoid inventing niche bars or unofficial spots.
- If a place name cannot be verified with certainty, replace it with a verified alternative.
- Well-known local spots (markets, plazas, parks, famous bars) are acceptable if they are genuinely famous.`,
        LARGE: `STOP RULES FOR LARGE CITIES:
- You may include a wide range of well-documented points of interest.
- DAI's wit and sarcasm are MANDATORY. But only after verifying the place exists today.
- Even iconic cities have places that closed or changed — do not include them if uncertain.`
    };

    const prompt = `You are generating tours for ${city}, ${country} in ${user.language}.

GEOGRAPHIC ANCHOR (CRITICAL): ${coordsAnchor}

DYNAMIC TOUR COUNT — CONTENT-BASED DECISION (CRITICAL):
First, mentally assess how many truly verifiable, real, documented points of interest exist in ${city}.
Then apply this rule strictly:
- If fewer than 12 real stops exist: generate EXACTLY 1 tour with all of them.
- If 12 to 23 real stops exist: generate EXACTLY 2 tours, splitting stops EQUALLY between them.
- If 24 or more real stops exist: generate EXACTLY 3 tours, splitting stops EQUALLY between them.
DO NOT repeat any stop across tours. DO NOT generate more tours than this rule allows.

THEMES TO USE (pick as many as needed based on stop count above):
1. "Hidden Gems & Dark Secrets"
2. "Historical & Architectural Marvels"
3. "Local Culture, Art & Food"
(If only 1 tour, use the most fitting theme or combine them in the title.)

DAI'S ABSOLUTE COMMANDS:
- You are DAI. You are SARCASTIC, WITTY, and SOPHISTICATED.
- TRUTH FIRST, STYLE SECOND. Before adding any wit or sarcasm, verify the place actually exists and is open TODAY. Your humor is the cherry on top of undeniable truth — not a substitute for it.
- Wikipedia is your enemy. If you sound like an encyclopedia, you fail.
- Tell the secrets, the mysteries, and the dark curiosities.
- Mock the "typical" tourist while revealing the true soul of the city.
- NEVER use citations like [1] or (2). NEVER.
- All facts MUST be 100% real. DO NOT INVENT.

${inventionRules[tier]}

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
4. COORDINATES ARE CRITICAL: Use the geographic anchor above. All stops must be within 2km of the city center. Use realistic offsets (streets, plazas, buildings). 
   - CRITICAL RULE: NEVER use the center of a building (centroid). ALWAYS place the coordinate on the MAIN PEDESTRIAN ENTRANCE (FAÇADE) at street level.
   - EXACT ADDRESS: If a specific building number is known (e.g. "Plaza San Agustín 23"), your coordinates MUST point to that specific doorway.
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
                            tour = await processTourStops(tour, city, country);
                            tour = optimizeStopOrder(tour);
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
                        tour = await processTourStops(tour, city, country);
                        tour = optimizeStopOrder(tour);
                        onProgress(tour);
                        allTours.push(tour);
                    }
                    toursEmitted++;
                }
            }

            if (allTours.length === 0) {
                for (let i = 0; i < finalTours.length; i++) {
                    if (finalTours[i] && finalTours[i].stops?.length > 0) {
                        finalTours[i] = await processTourStops(finalTours[i], city, country);
                        finalTours[i] = optimizeStopOrder(finalTours[i]);
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
            tours = tours.map(t => t?.stops?.length > 0 ? optimizeStopOrder(t) : t);
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

// ── Mapa de voces por idioma para TTS ────────────────────────────────────
const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck',
    pt: 'Charon', ja: 'Puck', zh: 'Puck', ro: 'Kore', ru: 'Charon',
    ar: 'Kore', ko: 'Puck', tr: 'Fenrir', pl: 'Charon', nl: 'Zephyr',
};

// ── Mensaje de bienvenida de DAI al nuevo usuario ─────────────────────────
export const generateDaiWelcome = async (user: UserProfile): Promise<string> => {
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `As DAI, welcome a new user named ${user.firstName || 'Traveler'} in ${user.language}.
            Explain that they are currently rank "ZERO" (the bottom of the food chain) and they need to conquer the world by completing tours to reach "ZENITH".
            Be sarcastic, witty, and elegant. Keep it under 100 words.`,
        });
        return response.text || "Welcome to bdai.";
    });
};

// ── Generación de audio con caché y tono DAI ──────────────────────────────
export const generateAudio = async (text: string, language: string, city: string): Promise<Uint8Array | null> => {
    const cleanText = (text || "").trim();
    if (!cleanText) return null;

    // Verificar caché antes de llamar a la API
    const cachedUrl = await getCachedAudio(cleanText, language);
    if (cachedUrl) {
        try {
            const response = await fetch(cachedUrl);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                if (buffer.byteLength > 0) return new Uint8Array(buffer);
            }
        } catch (e) {
            console.error("Error loading cached audio:", e);
        }
    }

    // Prompts de narración por idioma para preservar el tono DAI en cada lengua
    const daiAudioPrompts: Record<string, string> = {
        es: `Actúa como Dai, una guía de viajes elegante y sarcástica con acento de España. Di esto de forma natural y con personalidad: ${cleanText}`,
        en: `Act as Dai, an elegant and sarcastic travel guide. Say this in a natural and engaging tone: ${cleanText}`,
        fr: `Joue le rôle de Dai, un guide de voyage élégant et sarcastique. Dis ceci de façon naturelle et engageante : ${cleanText}`,
        de: `Spiel die Rolle von Dai, einem eleganten und sarkastischen Reiseführer. Sag dies auf natürliche und einnehmende Weise: ${cleanText}`,
        it: `Interpreta Dai, una guida turistica elegante e sarcastica. Di questo in modo naturale e coinvolgente: ${cleanText}`,
        pt: `Atua como Dai, um guia de viagens elegante e sarcástico. Diz isto de forma natural e envolvente: ${cleanText}`,
        ro: `Joacă rolul lui Dai, un ghid de călătorie elegant și sarcastic. Spune asta într-un mod natural și captivant: ${cleanText}`,
        ja: `DaiというエレガントでサルカスティックなAI旅行ガイドとして、次の内容を自然に読み上げてください：${cleanText}`,
        zh: `你是Dai，一位优雅而讽刺的旅行导游。请用自然而引人入胜的方式说出以下内容：${cleanText}`,
        ko: `Dai라는 우아하고 풍자적인 여행 가이드로서 다음 내용을 자연스럽고 매력적으로 말해주세요: ${cleanText}`,
    };

    const daiPrompt = daiAudioPrompts[language] || `Act as Dai, an elegant and sarcastic travel guide. Say this in a natural and engaging tone: ${cleanText}`;
    const voiceName = VOICE_MAP[language] || 'Kore';

    const base64 = await handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: daiPrompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName } },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    });

    if (base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        // Guardar en caché en segundo plano — no bloquea la reproducción
        saveAudioToCache(cleanText, language, bytes, city).catch(err => console.error("Cache save failed", err));
        return bytes;
    }

    return null;
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
