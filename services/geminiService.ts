
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
ESTRUCTURA OBLIGATORIA:
- Escribe párrafos fluidos y literarios, con un toque técnico profesional.
- Usa exactamente 3 o 4 párrafos por cada parada, separados SIEMPRE por doble salto de línea (\\n\\n).
- Cada parada debe contener entre 350 y 450 palabras de datos reales, ingeniería oculta y contexto histórico crudo.
- TODO el contenido (título, paradas, consejos de foto) DEBE estar en el idioma solicitado.
- CRÍTICO: Los nombres de ciudades y países también deben traducirse al idioma destino si existe una versión común (p.ej. London -> Londres).
`;

const TOUR_SCHEMA = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            city: { type: Type.STRING, description: "City name translated to target language." },
            country: { type: Type.STRING, description: "Country name translated to target language." },
            title: { type: Type.STRING, description: "Tour title translated to target language." },
            description: { type: Type.STRING, description: "Tour summary translated to target language." },
            duration: { type: Type.STRING },
            distance: { type: Type.STRING },
            theme: { type: Type.STRING },
            stops: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING, description: "Stop name translated to target language." },
                        description: { type: Type.STRING, description: "400-word masterclass description in target language." },
                        type: { type: Type.STRING },
                        latitude: { type: Type.NUMBER },
                        longitude: { type: Type.NUMBER },
                        photoSpot: {
                            type: Type.OBJECT,
                            properties: {
                                angle: { type: Type.STRING, description: "Technical photo advice translated to target language." },
                                milesReward: { type: Type.NUMBER },
                                secretLocation: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
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
            contents: `Translate the following tour data into ${langName}. 
            CRITICAL: You MUST translate every field including:
            - The "city" and "country" names.
            - The Tour "title" and "description".
            - Each stop's "name" and "description".
            - The "photoSpot.angle" (Dai Tip).
            
            Keep the expert, cynical, and technical style of the original content. 
            Data: ${JSON.stringify(tours)}`,
            config: { 
                systemInstruction: "You are a world-class technical translator specializing in travel and architecture. Translate EVERYTHING into the target language. City and country names must be translated too.",
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
            const isSpain = city.toLowerCase().includes('spain') || 
                            ['madrid', 'barcelona', 'sevilla', 'valencia', 'malaga', 'bilbao', 'ainsa'].some(c => city.toLowerCase().includes(c));
            voiceName = isSpain ? 'Kore' : 'Puck';
        } else if (language === 'en') {
            voiceName = 'Zephyr';
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { 
                    voiceConfig: { 
                        prebuiltVoiceConfig: { voiceName: voiceName as any } 
                    } 
                },
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
            model: "gemini-3-flash-preview",
            contents: `Generate 3 expert-level technical tours for ${city}, ${country}. 
            CRITICAL: All output including titles, stop names, masterclass descriptions, and photo advice MUST be in ${targetLang}. 
            The city name "${city}" and country name "${country}" MUST also be translated to ${targetLang} in the JSON result.`,
            config: { 
                systemInstruction: MASTERCLASS_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: TOUR_SCHEMA
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const standardizeCityName = async (input: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Normalize city name and country for: ${input}. Return JSON array with name, spanishName, country.`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
};

export const moderateContent = async (text: string): Promise<boolean> => true;
export const getPrecisionCoordinates = async (s: string[], c: string, co: string) => [];
export const generateSmartCaption = async (b: string, s: Stop, l: string) => "Photo";
export const generateCityPostcard = async (c: string, i: string[]) => null;
