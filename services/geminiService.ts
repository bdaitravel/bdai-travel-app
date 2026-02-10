
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';
import { geocodeStops } from './mapsService';

const BDAI_SYSTEM_INSTRUCTION = `
Eres bdai, el motor de inteligencia de viajes. Tu perfil: Experto en ingeniería, historia oculta y arquitectura.
MISIÓN: Generar tours de ALTA DENSIDAD informativa (mínimo 300 palabras por parada).
ESTRUCTURA: Exactamente 10 paradas. Solo nombres de lugares reales.
TONO: Narrativo, técnico y fascinante.
`;

async function safeAiCall<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    try {
        return await fn();
    } catch (e) {
        if (retries > 0) {
            console.warn(`bdai retry: ${retries} left. Error:`, e);
            await new Promise(r => setTimeout(r, 2000));
            return safeAiCall(fn, retries - 1);
        }
        throw e;
    }
}

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const targetLangName = LANGUAGES.find(l => l.code === user.language)?.name || "Spanish";
    
    return safeAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Crea 3 tours temáticos maestros para ${city}, ${country} en idioma ${targetLangName}. 10 paradas por tour.`,
            config: { 
                systemInstruction: BDAI_SYSTEM_INSTRUCTION,
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
                                        type: { type: Type.STRING, enum: ['historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'] }
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

        const rawTours = JSON.parse(response.text || "[]");
        
        // Use mapsService to ensure precision coordinates for ALL tours/stops
        const processedTours = await Promise.all(rawTours.map(async (t: any, i: number) => {
          const validStops = await geocodeStops(t.stops, city);
          return {
            ...t,
            id: `tour_${Date.now()}_${i}`,
            city,
            country,
            stops: validStops.map((s, j) => ({ ...s, id: s.id || `stop_${Date.now()}_${i}_${j}`, visited: false }))
          } as Tour;
        }));

        return processedTours;
    });
};

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    return safeAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analiza la búsqueda del usuario: "${input}". Valida si es una ciudad real. Devuelve el nombre oficial y país.`,
            config: { 
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { 
                            name: { type: Type.STRING }, 
                            spanishName: { type: Type.STRING }, 
                            country: { type: Type.STRING } 
                        },
                        required: ["name", "spanishName", "country"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateAudio = async (text: string, language: string, city: string = ""): Promise<string | null> => {
    const cached = await getCachedAudio(text, language);
    if (cached) return cached;

    return safeAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { 
                    voiceConfig: { 
                        prebuiltVoiceConfig: { voiceName: 'Kore' } 
                    } 
                },
            },
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        if (base64) await saveAudioToCache(text, language, base64, city);
        return base64;
    });
};

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    return safeAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Traduce estos tours íntegramente al ${targetLang}. Mantén los IDs y la estructura técnica. Texto: ${JSON.stringify(tours)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `¿Es este comentario de viaje apropiado para un foro público? Responde solo con booleano. Texto: "${text}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { isAppropriate: { type: Type.BOOLEAN } },
                required: ["isAppropriate"]
            }
        }
    });
    const result = JSON.parse(response.text || '{"isAppropriate": false}');
    return result.isAppropriate;
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return safeAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Create a stunning travel postcard illustration for ${city} showcasing landmarks and activities related to: ${interests.join(', ')}. Vibran colors, cinematic lighting, vertical composition.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "9:16"
                }
            }
        });
        
        let imageUrl = null;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
        return imageUrl;
    });
};
