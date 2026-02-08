
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Tu misión es generar TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, experto en ingeniería y arquitectura.
DENSIDAD: Cada parada DEBE tener entre 350 y 450 palabras de descripción técnica.
ESTRUCTURA: Exactamente 10 paradas por cada tour.
IMPORTANTE: Genera metadatos precisos para 'title', 'duration' (ej: "3h 45m") y 'distance' (ej: "5.2 km").
`;

async function handleAiCall<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
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

/**
 * REPARACIÓN QUIRÚRGICA GPS (Google Search Grounding)
 * Extrae coordenadas REALES de Google Maps.
 * MODELO: Gemini 3 Flash (Alta velocidad, bajo coste, precisión vía Search).
 */
export const getPrecisionCoordinates = async (stops: string[], city: string, country: string): Promise<{name: string, latitude: number, longitude: number}[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", 
            contents: `Busca en Google Maps la ubicación EXACTA de estos lugares en ${city}, ${country}: ${stops.join(', ')}. 
            REGLA DE ORO: No inventes, no estimes, no aproximes. 
            Debes usar la herramienta de búsqueda para obtener la latitud y longitud decimal REAL con al menos 6 decimales de precisión directamente de la API de Google Maps o resultados de búsqueda oficiales. 
            Quiero el punto exacto de la entrada o el mirador principal del monumento.`,
            config: { 
                systemInstruction: "Eres un extractor técnico de coordenadas GPS. Tu salida debe ser exclusivamente un JSON válido con 'name', 'latitude' y 'longitude'.",
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Nombre original de la parada" },
                            latitude: { type: Type.NUMBER, description: "Latitud exacta de Google Maps" },
                            longitude: { type: Type.NUMBER, description: "Longitud exacta de Google Maps" }
                        },
                        required: ["name", "latitude", "longitude"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const targetLang = LANGUAGES.find(l => l.code === user.language)?.name || "Spanish";
    
    const rawTours = await handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Genera 3 tours únicos para ${city}, ${country} en ${targetLang}. Céntrate en la historia técnica y la arquitectura.`,
            config: { 
                systemInstruction: MASTERCLASS_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            duration: { type: Type.STRING },
                            distance: { type: Type.STRING },
                            difficulty: { type: Type.STRING, enum: ["Easy", "Moderate", "Hard"] },
                            theme: { type: Type.STRING },
                            stops: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        type: { type: Type.STRING, enum: ['historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'] },
                                        photoSpot: {
                                            type: Type.OBJECT,
                                            properties: {
                                                angle: { type: Type.STRING },
                                                milesReward: { type: Type.NUMBER }
                                            }
                                        }
                                    },
                                    required: ["name", "description", "type"]
                                }
                            }
                        },
                        required: ["title", "description", "duration", "distance", "difficulty", "theme", "stops"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });

    const finalizedTours = [];
    for (const tour of rawTours) {
        const stopNames = tour.stops.map((s: any) => s.name);
        try {
            const realCoords = await getPrecisionCoordinates(stopNames, city, country);
            const correctedStops = tour.stops.map((stop: any) => {
                const coordMatch = realCoords.find((c: any) => 
                    c.name.toLowerCase().includes(stop.name.toLowerCase()) || 
                    stop.name.toLowerCase().includes(c.name.toLowerCase())
                );
                return {
                    ...stop,
                    id: `stop_${Date.now()}_${Math.random()}`,
                    latitude: coordMatch ? coordMatch.latitude : 0,
                    longitude: coordMatch ? coordMatch.longitude : 0,
                    visited: false
                };
            });

            finalizedTours.push({
                ...tour,
                id: `tour_${Date.now()}_${Math.random()}`,
                city,
                country,
                stops: correctedStops
            });
        } catch (e) {
            finalizedTours.push(tour);
        }
    }
    return finalizedTours;
};

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify up to 5 real world cities for: "${input}". Use Google Search to verify existence.`,
            config: { 
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { name: { type: Type.STRING }, spanishName: { type: Type.STRING }, country: { type: Type.STRING } },
                        required: ["name", "spanishName", "country"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Traduce los siguientes tours al idioma ${targetLang}. 
            REGLAS:
            1. Traduce 'title', 'description', 'theme'.
            2. Traduce 'name' y 'description' de cada parada.
            3. TRADUCE 'angle' en 'photoSpot'.
            4. MANTÉN INTACTOS COORDENADAS (latitude/longitude), IDs y valores numéricos.
            
            DATOS: ${JSON.stringify(tours)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateAudio = async (text: string, language: string, city: string = ""): Promise<string | null> => {
    const cachedBase64 = await getCachedAudio(text, language);
    if (cachedBase64) return cachedBase64;
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        if (base64) return await saveAudioToCache(text, language, base64, city);
        return null;
    });
};

export const generateSmartCaption = async (base64: string, stop: Stop, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } }, { text: `Caption for ${stop.name} in ${language}.` }] }
    });
    return response.text || "Photo captured.";
};

export const generateCityPostcard = async (city: string, interests: string[] = []): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `High quality postcard of ${city}.` }] }
    });
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
};

export const moderateContent = async (text: string): Promise<boolean> => true;
