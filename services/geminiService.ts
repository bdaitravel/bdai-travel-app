
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
 * PASO 2: REPARACIÓN QUIRÚRGICA DE COORDENADAS
 * Toma los nombres de las paradas y busca su ubicación REAL en Google Maps.
 */
export const getPrecisionCoordinates = async (stops: string[], city: string, country: string): Promise<{name: string, latitude: number, longitude: number}[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Busca en Google Maps las coordenadas GPS EXACTAS (latitud y longitud decimal) para estos lugares en ${city}, ${country}: ${stops.join(', ')}. No estimes, extrae los datos reales del buscador.`,
            config: { 
                systemInstruction: "Eres una herramienta de extracción GPS de alta precisión. Devuelve ÚNICAMENTE un array JSON con 'name', 'latitude' y 'longitude'.",
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            latitude: { type: Type.NUMBER },
                            longitude: { type: Type.NUMBER }
                        },
                        required: ["name", "latitude", "longitude"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

/**
 * PASO 1: GENERACIÓN DE NARRATIVA Y ESTRUCTURA
 */
export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const targetLang = LANGUAGES.find(l => l.code === user.language)?.name || "Spanish";
    
    // 1. Generar la narrativa y nombres de paradas
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
                            title: { type: Type.STRING, description: "Título del tour" },
                            description: { type: Type.STRING, description: "Descripción general" },
                            duration: { type: Type.STRING, description: "Ej: 2h 30m" },
                            distance: { type: Type.STRING, description: "Ej: 4.5 km" },
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

    // 2. Corregir coordenadas para cada tour de forma independiente
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
            console.error("Fallo al corregir GPS, usando valores por defecto", e);
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
            contents: `Translate the following tour data to ${targetLang} while keeping the coordinates and JSON keys intact: ${JSON.stringify(tours)}`,
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
                speechConfig: { 
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
                },
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
