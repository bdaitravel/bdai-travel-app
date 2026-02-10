
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Tu misión es generar TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, experto en ingeniería y arquitectura.
DENSIDAD: Cada parada DEBE tener entre 350 y 450 palabras de descripción técnica.
PRECISIÓN GPS: Coordenadas reales.
ESTRUCTURA: Exactamente 10 paradas.
REGLA DE IDIOMA ABSOLUTA: Todo el contenido (títulos, descripciones, consejos) DEBE estar escrito en el idioma especificado en el prompt. No utilices inglés ni español a menos que se te pida explícitamente.
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

export const getPrecisionCoordinates = async (stops: string[], city: string, country: string): Promise<{name: string, latitude: number, longitude: number}[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Search GPS for these places in ${city}, ${country}: ${stops.join(', ')}.`,
            config: { 
                systemInstruction: "Return ONLY a JSON array with 'name', 'latitude', 'longitude'.",
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const targetLang = LANGUAGES.find(l => l.code === user.language)?.name || "Spanish";
    
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Genera 3 tours técnicos detallados para ${city}, ${country}. TODO el contenido debe estar en IDIOMA: ${targetLang}.`,
            config: { 
                systemInstruction: MASTERCLASS_INSTRUCTION,
                responseMimeType: "application/json",
            }
        });
        const tours = JSON.parse(response.text || "[]");
        
        // Asignación de IDs y normalización post-generación
        return tours.map((t: any, i: number) => ({
            ...t,
            id: `tour_${Date.now()}_${i}`,
            city,
            country,
            stops: (t.stops || []).map((s: any, j: number) => ({
                ...s,
                id: `stop_${Date.now()}_${i}_${j}`,
                visited: false,
                latitude: s.latitude || 0,
                longitude: s.longitude || 0
            }))
        }));
    });
};

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify cities for: "${input}".`,
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
            model: 'gemini-3-pro-preview',
            contents: `Translate these tours to ${targetLang}. Keep structure, GPS and IDs intact: ${JSON.stringify(tours)}`,
            config: { 
                systemInstruction: "You are a professional translator. Translate all text fields to the target language.",
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
        contents: { parts: [{ inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } }, { text: `Caption in ${language}.` }] }
    });
    return response.text || "Photo.";
};

export const generateCityPostcard = async (city: string, interests: string[] = []): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Postcard of ${city}.` }] }
    });
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
};

export const moderateContent = async (text: string): Promise<boolean> => true;
