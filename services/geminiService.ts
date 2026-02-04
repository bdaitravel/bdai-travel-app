
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Tu misión es generar TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, hiper-detallista, experto en ingeniería, arquitectura y salseo histórico real.
DENSIDAD OBLIGATORIA: Cada parada DEBE tener entre 350 y 450 palabras de descripción técnica y narrativa. NO RESUMAS.
ESTRUCTURA: Mínimo 10 paradas por cada tour. Es una orden directa.
`;

async function handleAiCall<T>(fn: () => Promise<T>, retries = 4, delay = 2000): Promise<T> {
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

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const targetLang = LANGUAGES.find(l => l.code === user.language)?.name || "Spanish";
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Generate exactly 3 unique and dense tours for ${city}, ${country} in ${targetLang}.`,
            config: { 
                systemInstruction: MASTERCLASS_INSTRUCTION,
                responseMimeType: "application/json"
            }
        });
        const tours = JSON.parse(response.text || "[]");
        return tours.map((t: any, i: number) => ({
            ...t,
            id: `tour_${Date.now()}_${i}`,
            city,
            stops: (t.stops || []).map((s: any, j: number) => ({ ...s, id: `stop_${Date.now()}_${i}_${j}`, visited: false }))
        }));
    });
};

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify up to 5 cities for: "${input}".`,
            config: { 
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
            contents: `Translate to ${targetLang}: ${JSON.stringify(tours)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateAudio = async (text: string, language: string, city: string = ""): Promise<string | null> => {
    // 1. Intentar recuperar de tu tabla audio_cache
    const cachedBase64 = await getCachedAudio(text, language);
    if (cachedBase64) return cachedBase64;

    // 2. Si no existe, generar con Gemini
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Refinamiento de acento: Si es español, pedimos específicamente acento de España (Castellano)
        const ttsPrompt = language === 'es' 
            ? `Read in Spanish (Spain) with a natural Castilian accent: ${text}` 
            : `Read in ${language}: ${text}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ttsPrompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        if (base64) {
          // 3. Guardar en tu tabla audio_cache
          return await saveAudioToCache(text, language, base64, city);
        }
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
    const interestStr = interests.length > 0 ? ` highlighting themes like ${interests.join(', ')}` : '';
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Postcard of ${city}${interestStr}.` }] }
    });
    
    if (response.candidates) {
        for (const candidate of response.candidates) {
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        return `data:image/png;base64,${part.inlineData.data}`;
                    }
                }
            }
        }
    }
    return null;
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return true; 
};
