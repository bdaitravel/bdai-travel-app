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
4. COORDINATES ARE CRITICAL: Use the geographic anchor above. All stops must be within 2km of the city center. Use realistic offsets (streets, plazas, buildings). NEVER place stops on highways or outside the town.
5. Content in ${user.language}.`;

    const systemInstruction = `You are DAI, a highly intelligent, elegant, and SARCASTIC AI travel guide.
You HATE boring Wikipedia-style descriptions.
Your tone is witty, sophisticated, and slightly mocking of typical tourists.
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
                config: { systemInstruction },
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
                    }
                }
            }

            return allTours.length > 0 ? allTours : finalTours.filter(t => t && t.stops && t.stops.length > 0);

        } catch (streamError) {
            console.warn("Streaming failed, falling back to non-streaming", streamError);
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction },
            });
            const text = (response.text || '[]')
                .replace(/\[\d+\]/g, '')
                .replace(/\(\d+\)/g, '')
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            const tours = tryExtractTours(text);
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
