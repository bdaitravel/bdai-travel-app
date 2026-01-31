
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Tu misión es generar TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, hiper-detallista, experto en ingeniería y anécdotas reales. No eres un folleto turístico. 
FOCO: 1. Ingeniería y Retos Técnicos. 2. Historia Oculta/Conspiraciones. 3. Salseo Humano Real.
DENSIDAD: Necesitamos descripciones ricas y técnicas (aprox 200-250 palabras por parada). Sé denso, técnico y brillante.
`;

const LANGUAGE_RULES: Record<string, string> = {
    es: `${MASTERCLASS_INSTRUCTION} RESPONDE SIEMPRE EN ESPAÑOL.`,
    en: `${MASTERCLASS_INSTRUCTION} ALWAYS RESPOND IN ENGLISH.`,
    pt: `${MASTERCLASS_INSTRUCTION} RESPONDA EM PORTUGUÊS.`,
    it: `${MASTERCLASS_INSTRUCTION} RISPONDI IN ITALIANO.`,
    fr: `${MASTERCLASS_INSTRUCTION} RÉPONDEZ EN FRANÇAIS.`,
    de: `${MASTERCLASS_INSTRUCTION} ANTWORTEN SIE AUF DEUTSCH.`,
    ca: `${MASTERCLASS_INSTRUCTION} RESPON EN CATALÀ.`,
    eu: `${MASTERCLASS_INSTRUCTION} EUSKARAZ ERANTZUN.`
};

async function handleAiCall(fn: () => Promise<any>) {
    try {
        if (!process.env.API_KEY) throw new Error("MISSING_KEY");
        return await fn();
    } catch (error: any) {
        console.error("AI Service Error:", error.message);
        if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('API_KEY_INVALID')) {
            throw new Error("AUTH_ERROR");
        }
        if (error.message?.includes('429')) {
            throw new Error("QUOTA_EXCEEDED");
        }
        throw error;
    }
}

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '').replace(/#/g, '').trim();
};

const generateHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    return Math.abs(hash).toString(36);
};

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identify location accurately: "${input}". Return a JSON array of objects with 'name' (local), 'spanishName', and 'country'. Limit to 5 results.`,
            config: { 
                temperature: 0,
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

export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const targetLang = userProfile.language || 'es';
    const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
    
    const prompt = `Genera exactamente 3 TOURS diferentes para ${cityInput}, ${countryInput}. 
    Cada tour DEBE tener exactamente 10 paradas. 
    Descripciones: Muy densas en ingeniería e historia oculta. 
    Formato: Devuelve un array JSON de objetos Tour con: title, description, duration, distance, theme, difficulty y un array de 10 'stops' (name, description, latitude, longitude, type).`;

    return handleAiCall(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: prompt,
            config: { 
                systemInstruction: langRule, 
                responseMimeType: "application/json",
                maxOutputTokens: 15000, 
                temperature: 0.7
            }
        });

        const text = response.text || "[]";
        let parsed = [];
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse error - Data too long or malformed:", text.substring(0, 100) + "...");
            throw new Error("GENERATION_ERROR");
        }

        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("EMPTY_RESPONSE");

        return parsed.map((t: any, idx: number) => ({
            ...t, 
            id: `tour_${Date.now()}_${idx}`, 
            city: cityInput,
            stops: (t.stops || []).map((s: any, sIdx: number) => ({ 
                ...s, 
                id: `s_${Date.now()}_${idx}_${sIdx}`, 
                visited: false,
                photoSpot: { angle: "Vista de Arquitecto", milesReward: 50, secretLocation: s.name }
            }))
        }));
    });
};

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
    
    const translatedTours: Tour[] = [];
    for (const tour of tours) {
        const result = await handleAiCall(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Translate this specific tour to ${targetLang}. Maintain the expert/cynical tone. Return only the JSON object: ${JSON.stringify(tour)}`,
                config: { 
                    systemInstruction: langRule, 
                    responseMimeType: "application/json"
                }
            });
            return JSON.parse(response.text || "null");
        });
        if (result) translatedTours.push(result);
    }
    return translatedTours;
};

export const generateSmartCaption = async (imageB64: string, stop: Stop, language: string = 'es'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = `Eres un Social Media Manager experto en viajes de lujo y tecnología.
    OBJETIVO: Crear un "caption" de Instagram viral basado en la foto del usuario y los datos de la parada: ${stop.name}.
    ESTILO: Inteligente, un poco cínico, fascinante. Mezcla datos de ingeniería con estilo de vida nómada.
    RESTRICCIÓN: Máximo 200 caracteres. Incluye 3 hashtags técnicos y ubicación.
    IDIOMA: Responde en ${language}.`;

    return handleAiCall(async () => {
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageB64.split(',')[1] || imageB64,
            },
        };
        const textPart = { text: `Analiza esta foto tomada en ${stop.name}. El contexto es: ${stop.description}. Genera el caption perfecto.` };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [imagePart, textPart] },
            config: { systemInstruction: langRule }
        });

        return response.text || "";
    });
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
    const cleanText = cleanDescriptionText(text);
    if (!cleanText) return "";
    const cacheKey = `audio_${language}_${generateHash(cleanText)}`;
    const cached = await getCachedAudio(cacheKey);
    if (cached) return cached;
    
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say clearly and with expert tone: ${cleanText}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
        if (audioData) saveAudioToCache(cacheKey, audioData).catch(console.error);
        return audioData;
    });
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `A cinematic, high-quality, artistic travel postcard for ${city}. Atmospheric style. No text.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    });
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Safe for travel community? "${text}" (SAFE/UNSAFE)`,
            config: { temperature: 0 }
        });
        return response.text?.toUpperCase().includes('SAFE');
    } catch (e) { return true; } 
};
