
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Generas Masterclasses de viaje de Alta Densidad Informativa.
REGLA DE ORO DE ESTILO: Escribe como un experto HUMANO brillante, un poco cínico y erudito.
PROHIBICIÓN ABSOLUTA: 
- NUNCA uses formato de terminal, log o consola.
- NUNCA uses textos como "[PROCESANDO...]", "CARGANDO... 100%", "EJECUTANDO TOUR", "OBJETIVO: DESMANTELAR...".
- NUNCA uses mayúsculas sostenidas para párrafos enteros.
- NUNCA uses lenguaje propio de un sistema operativo o inteligencia artificial robótica.

REQUISITOS TÉCNICOS DE CONTENIDO:
1. Genera exactamente 3 tours por ciudad.
2. Cada tour debe tener exactamente 10 paradas (Stops). No menos de 10.
3. Cada parada debe tener una descripción de entre 350 y 450 palabras. Divide esto en 3 o 4 párrafos claros usando doble salto de línea (\\n\\n).
4. El contenido debe ser técnico: ingeniería, historia cruda, anécdotas reales y detalles arquitectónicos que un turista normal no vería.
5. Traduce TODO al idioma solicitado, incluyendo nombres de ciudades y países.
`;

const TOUR_SCHEMA = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            city: { type: Type.STRING, description: "City name FULLY translated." },
            country: { type: Type.STRING, description: "Country name FULLY translated." },
            title: { type: Type.STRING, description: "Technical Tour title." },
            description: { type: Type.STRING, description: "Tour summary (2-3 sentences)." },
            duration: { type: Type.STRING, description: "e.g. '4h 30m'" },
            distance: { type: Type.STRING, description: "e.g. '5.2 km'" },
            theme: { type: Type.STRING },
            stops: {
                type: Type.ARRAY,
                description: "MUST contain exactly 10 stops.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING, description: "Stop name translated." },
                        description: { type: Type.STRING, description: "Masterclass text (350-450 words) with double newlines." },
                        type: { type: Type.STRING, enum: ['historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'] },
                        latitude: { type: Type.NUMBER },
                        longitude: { type: Type.NUMBER },
                        photoSpot: {
                            type: Type.OBJECT,
                            properties: {
                                angle: { type: Type.STRING, description: "Professional photo technical tip." },
                                milesReward: { type: Type.NUMBER },
                                secretLocation: { type: Type.STRING }
                            }
                        }
                    },
                    required: ["id", "name", "description", "latitude", "longitude", "type"]
                }
            }
        },
        required: ["id", "city", "title", "stops"]
    }
};

async function handleAiCall<T>(fn: () => Promise<T>, retries = 3, delay = 1500): Promise<T> {
    try {
        return await fn();
    } catch (e: any) {
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return handleAiCall(fn, retries - 1, delay * 2);
        }
        throw e;
    }
}

export const translateToursBatch = async (tours: Tour[], targetLangCode: string): Promise<Tour[]> => {
    const langName = LANGUAGES.find(l => l.code === targetLangCode)?.name || targetLangCode;
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate this tour data into ${langName}. Keep the erudite style. Data: ${JSON.stringify(tours)}`,
            config: { 
                systemInstruction: "You are a world-class technical translator. Translate EVERYTHING.",
                responseMimeType: "application/json",
                responseSchema: TOUR_SCHEMA
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateAudio = async (text: string, language: string, city: string = ""): Promise<string | null> => {
    const cachedBase64 = await getCachedAudio(text, language);
    if (cachedBase64) return cachedBase64;

    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let voiceName = 'Kore';
        if (language === 'es') {
            const isSpain = city.toLowerCase().includes('spain') || ['madrid', 'barcelona', 'sevilla', 'ainsa', 'logroño'].some(c => city.toLowerCase().includes(c));
            voiceName = isSpain ? 'Kore' : 'Puck';
        } else if (language === 'en') {
            voiceName = 'Zephyr';
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName as any } } },
            },
        });

        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        if (base64) return await saveAudioToCache(text, language, base64, city);
        return null;
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const targetLang = LANGUAGES.find(l => l.code === user.language)?.name || "Spanish";
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Genera 3 tours técnicos de nivel experto para ${city}, ${country}. 
            REGLA DE ORO: Cada tour DEBE tener exactamente 10 paradas. Cada parada DEBE tener descripciones de unas 400 palabras divididas en párrafos.
            IDIOMA: Todo el JSON resultante debe estar en ${targetLang}.`,
            config: { 
                systemInstruction: MASTERCLASS_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: TOUR_SCHEMA,
                temperature: 0.8
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const standardizeCityName = async (input: string) => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Find ALL cities in the world that match the name: "${input}". 
            Include their original name, Spanish translation, and the Country they belong to.
            Example: If searching "Santiago", return Santiago (Chile), Santiago de Compostela (Spain), etc.`,
            config: { 
                tools: [{ googleSearch: {} }], 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "English name" },
                            spanishName: { type: Type.STRING, description: "Spanish name" },
                            country: { type: Type.STRING, description: "Country name" }
                        },
                        required: ["name", "spanishName", "country"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const moderateContent = async (text: string): Promise<boolean> => true;
export const getPrecisionCoordinates = async (s: string[], c: string, co: string) => [];
export const generateSmartCaption = async (b: string, s: Stop, l: string) => "Photo";
export const generateCityPostcard = async (c: string, i: string[]) => null;
