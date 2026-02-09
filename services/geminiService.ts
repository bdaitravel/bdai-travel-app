
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Generas TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, experto en ingeniería.
DENSIDAD: 350-450 palabras por parada. 10 paradas por tour.
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

export const translateToursBatch = async (tours: Tour[], targetLangCode: string): Promise<Tour[]> => {
    const langName = LANGUAGES.find(l => l.code === targetLangCode)?.name || targetLangCode;
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate this technical tour data to ${langName}. 
            Maintain the cynicism and high-density technical style of Dai. 
            Keep all technical terms, IDs, and coordinates intact.
            Data: ${JSON.stringify(tours)}`,
            config: { 
                systemInstruction: "You are a world-class technical translator for a travel engineering app. Return only the translated JSON.",
                responseMimeType: "application/json" 
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
        
        let voiceName = 'Kore'; // Voz por defecto
        let instruction = "Habla con autoridad técnica y claridad.";

        if (language === 'es') {
            // Lógica de acento basada en la ubicación de la ciudad
            const isSpain = city.toLowerCase().includes('spain') || 
                            ['madrid', 'barcelona', 'sevilla', 'valencia', 'malaga', 'bilbao'].some(c => city.toLowerCase().includes(c));
            
            if (isSpain) {
                voiceName = 'Kore';
                instruction = "Usa acento de España (castellano peninsular), voz experta.";
            } else {
                voiceName = 'Puck';
                instruction = "Usa español neutro latinoamericano, cálido, sin ceceo peninsular.";
            }
        } else if (language === 'en') {
            voiceName = 'Zephyr';
            instruction = "Use a professional, native English voice.";
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `${instruction} Texto: ${text}` }] }],
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
            model: "gemini-3-pro-preview",
            contents: `Generate 3 technical tours for ${city}, ${country} in ${targetLang}.`,
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
                            theme: { type: Type.STRING },
                            stops: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        type: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const standardizeCityName = async (input: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Normalize city: ${input}`,
        config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
};

export const moderateContent = async (text: string): Promise<boolean> => true;
export const getPrecisionCoordinates = async (s: string[], c: string, co: string) => [];
export const generateSmartCaption = async (b: string, s: Stop, l: string) => "Photo";
export const generateCityPostcard = async (c: string, i: string[]) => null;
