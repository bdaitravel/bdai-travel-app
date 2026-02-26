import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

export class QuotaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuotaError";
    }
}

const handleAiCall = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        const errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
        if (errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return handleAiCall(fn, retries - 1, delay * 2);
            }
            throw new QuotaError("Límite excedido. Por favor, usa tu clave API.");
        }
        throw error;
    }
};

export const translateSearchQuery = async (input: string): Promise<{ english: string, detected: string }> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `Identify the city/location: "${input}". Return JSON: { "english": "City Name", "detected": "es" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{"english": "' + input + '", "detected": "unknown"}');
    });
};

export const normalizeCityWithAI = async (input: string, userLanguage: string): Promise<any[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `Identify cities matching "${input}". Return JSON array: [{ "city": "Name", "country": "Country", "countryCode": "XX", "slug": "city_country", "lat": 0.0, "lng": 0.0 }]`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '[]');
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile, coords?: { lat: number, lng: number }, maxTours: number = 1): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: `Eres DAI, una guía de viajes inteligente, sarcástica y algo elitista. Genera ${maxTours} tour para ${city}, ${country} en ${user.language}.
            
            REGLAS:
            1. DATOS REALES Y VERIFICADOS: Prohibido inventar nada.
            2. NO WIKIPEDIA: Prohibido referencias tipo (1) (2).
            3. PERSONALIDAD: Sé ingeniosa y cínica. Cuéntame el chisme histórico real.
            4. EXTENSIÓN: Cada parada DEBE tener exactamente 350 palabras de descripción.
            
            FORMATO JSON: [{"id": 1, "city": "${city}", "title": "Tour", "description": "Resumen", "stops": [{"name": "Lugar Real", "description": "350 palabras", "latitude": 0, "longitude": 0, "type": "culture", "photoSpot": {"angle": "45deg", "milesReward": 100, "secretLocation": true}}]}]`,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text || "[]";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const tours = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        return tours.map((t: any) => ({ ...t, city: city }));
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck', pt: 'Charon', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateSpeech = async (text: string, language: string, city: string): Promise<string> => {
    const cleanText = (text || "").trim();
    if (!cleanText) return "";
    const cachedUrl = await getCachedAudio(cleanText, language);
    if (cachedUrl) {
        const response = await fetch(cachedUrl);
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) { binary += String.fromCharCode(bytes[i]); }
        return btoa(binary);
    }
    const voiceName = VOICE_MAP[language] || 'Kore';
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = language === 'es' ? `Actúa como Dai, guía elegante con acento de España: ${cleanText}` : `Act as Dai: ${cleanText}`;
    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } }
        }
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (base64) saveAudioToCache(cleanText, language, base64, city).catch(e => console.error(e));
    return base64;
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Translate to ${targetLanguage}: ${JSON.stringify(tours)}`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
};

export const generateDaiWelcome = async (user: UserProfile): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Welcome ${user.firstName} in ${user.language}. Be sarcastic.`,
    });
    return response.text || "Welcome.";
};

export const moderateContent = async (text: string): Promise<boolean> => { return true; };

export const generateCityPostcard = async (city: string, interests: string[] = []): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ parts: [{ text: `Postcard of ${city}` }] }]
    });
    const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
};
