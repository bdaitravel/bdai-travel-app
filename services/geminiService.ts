import { Type } from "@google/genai";
import { Tour, Stop, UserProfile, TourCache } from '../types';
import { normalizeKey, supabase } from './supabaseClient';
import { ai, handleAiCall, QuotaError } from './gemini/config';
import { SYSTEM_INSTRUCTION, generateTourPrompt } from './gemini/prompts';
import { getCityInfo, processTourStops } from '../lib/gisService';
export { fetchRoutePolyline } from '../lib/routingService';
import { optimizeStopOrder } from '../lib/routingService';

export { QuotaError };

// ── Tipos auxiliares ───────────────────────────────────────────────────────
type CityTier = 'SMALL' | 'MEDIUM' | 'LARGE';

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
- CRITICAL: If the city name exists in multiple countries, return ALL of them.
- Return between 1 and 5 results, most famous/relevant first.
- NEVER return only 1 result if the name exists in multiple places.

For each result return:
- "cityEn": Official city name in ENGLISH ONLY.
- "cityLocal": City name translated to "${userLanguage}".
- "country": Country name in "${userLanguage}".
- "countryEn": Country name in ENGLISH ONLY.
- "countryCode": 2-letter ISO country code in UPPERCASE.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            cityEn: { type: Type.STRING },
                            cityLocal: { type: Type.STRING },
                            country: { type: Type.STRING },
                            countryEn: { type: Type.STRING },
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

// ── Helper: leer tours desde caché de Supabase ────────────────────────────
const fetchToursFromCache = async (slug: string, lang: string): Promise<Tour[] | null> => {
    const { data } = await supabase
        .from('tours_cache')
        .select('data, status, route_polylines, error_message')
        .eq('city', slug)
        .eq('language', lang)
        .maybeSingle();

    if (!data) return null;

    if (data.status === 'READY' && data.data?.length > 0) {
        const savedPolylines: Record<string, string> = data.route_polylines || {};
        return (data.data as Tour[]).map((tour: Tour) => ({
            ...tour,
            routePolyline: savedPolylines[tour.id] ?? tour.routePolyline
        }));
    }

    if (data.status === 'ERROR') {
        throw new Error(data.error_message || 'Fallo en la generación en segundo plano.');
    }

    return null; // GENERATING o sin datos aún — seguir esperando
};

// ── Generación de tours vía Edge Function + Realtime + polling de rescate ──
export const generateToursForCity = async (
    city: string,
    country: string,
    user: UserProfile,
    onProgress?: (tour: Tour) => void
): Promise<Tour[]> => {
    
    try {
        console.log(`Pidiendo la generación del tour a Edge Function para ${city}, ${country}...`);
        
        const lang = user.language || 'es';
        const slug = normalizeKey(city, country);

        // Disparo al orquestador (devuelve al instante BACKGROUND_QUEUED)
        const { data, error } = await supabase.functions.invoke('tour-orchestrator', {
            body: { city, country, language: lang, slug }
        });

        if (error) {
            console.error("Error desde la Edge Function de Tours:", error);
            throw new Error(error.message || "Fallo en la generación serverless");
        }

        // Caché devuelta directamente (caso raro: orquestador respondió con tours)
        if (data && data.tours) {
            console.log(`Tours recibidos directamente (CACHED): ${data.tours.length}`);
            if (onProgress) data.tours.forEach((t: Tour) => onProgress(t));
            return data.tours;
        }

        // Modo asíncrono: orquestador confirmó encolado o ya estaba generando
        if (data && (data.status === "BACKGROUND_QUEUED" || data.status === "GENERATING")) {
            console.log("Generación en segundo plano confirmada. Iniciando Realtime + polling...");

            return new Promise((resolve, reject) => {
                let resolved = false;

                const resolveOnce = (tours: Tour[]) => {
                    if (resolved) return;
                    resolved = true;
                    clearTimeout(timeoutId);
                    clearInterval(pollId);
                    supabase.removeChannel(channel);
                    if (onProgress) tours.forEach((t: Tour) => onProgress(t));
                    resolve(tours);
                };

                const rejectOnce = (err: Error) => {
                    if (resolved) return;
                    resolved = true;
                    clearTimeout(timeoutId);
                    clearInterval(pollId);
                    supabase.removeChannel(channel);
                    reject(err);
                };

                // Timeout máximo de seguridad (6.5 minutos)
                const timeoutId = setTimeout(() => {
                    rejectOnce(new Error("Timeout: la generación tardó demasiado."));
                }, 390000);

                // ── SUSCRIPCIÓN REALTIME ──────────────────────────────────
                const channel = supabase.channel(`city-generation-${slug}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'tours_cache',
                            filter: `city=eq.${slug}`
                        },
                        (payload: any) => {
                            const newStatus = payload.new.status;
                            console.log(`[Realtime] tours_cache status=${newStatus}`);

                            if (newStatus === 'READY') {
                                const tours = payload.new.data as Tour[];
                                const savedPolylines: Record<string, string> = payload.new.route_polylines || {};
                                const toursWithPolylines = (tours || []).map((t: Tour) => ({
                                    ...t,
                                    routePolyline: savedPolylines[t.id] ?? t.routePolyline
                                }));
                                resolveOnce(toursWithPolylines);
                            } else if (newStatus === 'ERROR') {
                                const errorMsg = payload.new.error_message || "Fallo en la generación.";
                                rejectOnce(new Error(errorMsg));
                            }
                        }
                    )
                    .subscribe();

                // ── POLLING DE RESCATE ────────────────────────────────────
                // Se ejecuta inmediatamente (rescata el caso en que el pipeline
                // ya terminó antes de que se estableciera la suscripción Realtime)
                // y luego cada 5 segundos como red de seguridad.
                const poll = async () => {
                    if (resolved) return;
                    try {
                        console.log(`[Poll] Comprobando tours_cache para ${slug}...`);
                        const tours = await fetchToursFromCache(slug, lang);
                        if (tours) resolveOnce(tours);
                    } catch (e: any) {
                        rejectOnce(e);
                    }
                };

                // Primera comprobación inmediata tras suscribirse
                poll();

                // Polling cada 5 segundos como red de seguridad
                const pollId = setInterval(poll, 5000);
            });
        }

        return [];
    } catch (e) {
        console.error("Excepción invocando a tour-orchestrator:", e);
        throw e;
    }
};

// ── Generación de Audio interactivo (Edge Function) ────────────────────────
export const generateAudio = async (text: string, language: string, city: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase.functions.invoke('generate-audio-dai', {
            body: { text, language, city }
        });
        if (error) throw error;
        return data?.url || null;
    } catch (e) {
        console.error("Error generating audio:", e);
        return null;
    }
};

export const generateCityPostcard = async (city: string, country: string): Promise<string | null> => {
    return null;
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return true;
};

export const checkApiStatus = async (): Promise<{ ok: boolean; message: string }> => {
    return { ok: true, message: "IA Services operational" };
};

export const translateToursBatch = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    return tours;
};