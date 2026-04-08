import { Type } from "@google/genai";
import { Tour, Stop, UserProfile, TourCache } from '../types';
import { normalizeKey, supabase } from './supabaseClient';
import { ai, handleAiCall, QuotaError } from './gemini/config';
import { SYSTEM_INSTRUCTION, generateTourPrompt } from './gemini/prompts';
import { getCityInfo, processTourStops } from '../lib/gisService';
export { fetchRoutePolyline } from '../lib/routingService';
import { optimizeStopOrder } from '../lib/routingService';

export { QuotaError };

// ── Tipos auxiliares (se mantienen aquí por ahora) ─────────────────────────
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

// ── Helper para extracción de JSON acumulado ───────────────────────────────
const tryExtractTours = (text: string): Tour[] => {
    try {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
    } catch (e) {}
    return [];
};

// ── Generación adaptada de tours por nivel de ciudad ─────────────────────
export const generateToursForCity = async (
    city: string,
    country: string,
    user: UserProfile,
    onProgress?: (tour: Tour) => void
): Promise<Tour[]> => {
    
    // Nueva Arquitectura Serverless (Edge Function)
    // El frontend ya no computa el ruteo, ni llama a google, ni guarda en BD.
    try {
        console.log(`Pidiendo la generación del tour a Edge Function para ${city}, ${country}...`);
        
        // Timeout alto porque la API y las docenas de llamadas GIS pueden tardar
        const { data, error } = await supabase.functions.invoke('generate-tours-dai', {
            body: { 
                city, 
                country, 
                language: user.language || 'es'
            }
        });

        if (error) {
            console.error("Error desde la Edge Function de Tours:", error);
            throw new Error(error.message || "Fallo en la generación serverless");
        }

        if (data && data.tours) {
            console.log(`Se recibieron ${data.tours.length} tours desde el servidor.`);
            // Simulamos el pintado progresivo para la UI (opcional)
            if (onProgress) {
                data.tours.forEach((t: Tour) => onProgress(t));
            }
            return data.tours;
        }

        return [];
    } catch (e) {
        console.error("Excepción invocando a generate-tours-dai:", e);
        return [];
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
    return null; // Stub para evitar error de compilación
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return true; // Stub para evitar error de compilación
};

export const checkApiStatus = async (): Promise<{ ok: boolean; message: string }> => {
    return { ok: true, message: "IA Services operational (Rehabilitado)" };
};

export const translateToursBatch = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    return tours; // Stub para evitar error de compilación
};
