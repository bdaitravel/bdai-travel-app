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
        const errorMsg = JSON.stringify(error);
        if (errorMsg.includes("429") || errorMsg.includes("QUOTA") || errorMsg.includes("LIMIT")) {
            if (retries > 0) {
                await new Promise(r => setTimeout(r, delay));
                return handleAiCall(fn, retries - 1, delay * 2);
            }
            throw new QuotaError("Límite de API alcanzado.");
        }
        throw error;
    }
};

export const translateSearchQuery = async (input: string): Promise<{ english: string, detected: string }> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const response = await model.generateContent(`Identify city: "${input}". Return JSON: {"english": "City Name", "detected": "es"}`);
        return JSON.parse(response.response.text() || '{"english": "' + input + '", "detected": "unknown"}');
    });
};

export const normalizeCityWithAI = async (input: string, userLanguage: string): Promise<any[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `Identify all major cities matching "${input}". Return a JSON array: [{"city": "Name", "country": "Country", "countryCode": "XX", "slug": "city_country", "lat": 0.0, "lng": 0.0}]`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
    });
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile, coords?: { lat: number, lng: number }, maxTours: number = 1): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `Eres DAI, una guía de viajes inteligente, sarcástica, elegante y algo elitista. 
        Tu misión es generar ${maxTours} tour para ${city}, ${country} en ${user.language}.

        REGLAS DE ORO (OBLIGATORIAS):
        1. DATOS REALES: Prohibido inventar datos. Usa hechos históricos, geográficos y culturales VERÍDICOS.
        2. NO WIKIPEDIA: Prohibido usar frases genéricas o poner números de referencia como (1) o [2].
        3. PERSONALIDAD: Sé ingeniosa, chismosa y algo cínica. Cuéntame el "lado B" de la historia.
        4. EXTENSIÓN: Cada parada DEBE tener una descripción de exactamente 350 palabras de alta calidad narrativa.
        
        FORMATO JSON: [{"id": 1, "city": "${city}", "title": "Título", "description": "Resumen", "stops": [{"name": "Lugar Real", "description": "350 palabras de chisme histórico real", "latitude": 0, "longitude": 0, "type": "culture", "photoSpot": {"angle": "45deg", "milesReward": 100, "secretLocation": true}}]}]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const tours = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
        return tours.map((t: any) => ({ ...t, city }));
    });
};

const VOICE_MAP: Record<string, string> = {
    es: 'Kore', en: 'Zephyr', fr: 'Charon', de: 'Fenrir', it: 'Puck', pt: 'Charon', ja: 'Puck', zh: 'Puck', ro: 'Kore'
};

export const generateSpeech = async (text: string, language: string, city: string): Promise<string> => {
    const cleanText = (text || "").trim();
    if (!cleanText) return "";
    const cached = await getCachedAudio(cleanText, language);
    if (cached) return cached;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = language === 'es' 
        ? `Actúa como Dai, guía elegante y sarcástica con acento de ESPAÑA (castellano). Di esto: ${cleanText}`
        : `Act as Dai, elegant guide: ${cleanText}`;

    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ["AUDIO" as any],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_MAP[language] || 'Kore' } }
            }
        }
    });
    const base64 = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (base64) saveAudioToCache(cleanText, language, base64, city).catch(() => {});
    return base64;
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const res = await model.generateContent(`Translate to ${targetLanguage}: ${JSON.stringify(tours)}`);
        return JSON.parse(res.response.text() || "[]");
    });
};

export const generateDaiWelcome = async (user: UserProfile) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const res = await model.generateContent(`Welcome ${user.firstName} to bdai in ${user.language}. Be sarcastic.`);
    return res.response.text() || "Welcome.";
};

export const moderateContent = async () => true;

export const generateCityPostcard = async (city: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const res = await model.generateContent(`Postcard of ${city}`);
    const part = res.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
};
