
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedTours, saveToursToCache, getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, analista senior de BDAI. ESTILO: CÍNICO, NARRATIVO, NARRACIÓN HUMANA CONTINUA. ENFOQUE: Historia profunda, salseo histórico (chismes de época), leyendas urbanas y secretos culturales. REGLA CRÍTICA: Cada descripción de parada DEBE ser extensa y profunda, superando las 450 palabras. RESPONDE EXCLUSIVAMENTE EN ESPAÑOL DE ESPAÑA.",
    en: "PERSONALITY: You are Dai, senior analyst for BDAI. STYLE: CYNICAL, NARRATIVE, CONTINUOUS HUMAN NARRATION. FOCUS: Deep history, historical gossip, and cultural secrets. CRITICAL RULE: Each stop description MUST exceed 450 words. RESPOND EXCLUSIVELY IN ENGLISH.",
    ca: "PERSONALITAT: Ets la Dai, analista sènior de BDAI. ESTIL: CÍNIC, NARRATIU, NARRACIÓ HUMANA CONTINUA. ENFOCAMENT: Història profunda, xafarderies històriques i secrets culturals. REGLA CRÍTICA: Cada descripció de parada HA DE ser extensa i profunda. RESPON EXCLUSIVAMENTE EN CATALÀ.",
};

const extractJson = (text: string): string => {
    if (!text) return "[]";
    let cleaned = text.trim();
    if (cleaned.includes("```json")) {
        cleaned = cleaned.split("```json")[1].split("```")[0];
    } else if (cleaned.includes("```")) {
        cleaned = cleaned.split("```")[1].split("```")[0];
    }
    
    const firstBracket = Math.min(
        cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('['),
        cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{')
    );
    const lastBracket = Math.max(
        cleaned.lastIndexOf(']'),
        cleaned.lastIndexOf('}')
    );

    if (firstBracket !== Infinity && lastBracket !== -1) {
        return cleaned.substring(firstBracket, lastBracket + 1);
    }
    return cleaned;
};

async function callAiWithRetry(fn: () => Promise<any>, retries = 4, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const errorMsg = error.message || "";
            const isRetryable = errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('429') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('deadline');
            if (isRetryable && i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
            }
            throw error;
        }
    }
}

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text
        .replace(/\*\*/g, '')
        .replace(/###/g, '')
        .replace(/##/g, '')
        .replace(/#/g, '')
        .replace(/\*/g, '')
        .replace(/_/g, '')
        .replace(/`/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/\n\n/g, '. ')
        .replace(/\n/g, ' ')
        .replace(/\s\s+/g, ' ')
        .trim();
};

const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
  }
  return Math.abs(hash).toString(36);
};

export const standardizeCityName = async (input: string): Promise<{name: string, country: string}[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identify the intended city from: "${input}". Return JSON array.`,
            config: { temperature: 0, responseMimeType: "application/json" }
        }));
        return JSON.parse(extractJson(response.text || "[]"));
    } catch (e) { return [{ name: input, country: "" }]; }
};

export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile, contextGreeting?: string, skipEssential: boolean = false): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const interestsStr = userProfile.interests.join(", ") || "historia y cultura";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Genera 3 TOURS para ${cityInput}, ${countryInput}. Intereses: [${interestsStr}]. 10 paradas. 450 palabras/parada. JSON estricto.`;

  try {
    const response = await callAiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
            systemInstruction: langRule,
            responseMimeType: "application/json", 
            maxOutputTokens: 60000, 
            temperature: 0.8
        }
    }));
    const parsed = JSON.parse(extractJson(response.text || "[]"));
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ 
            ...s, id: `s_${idx}_${sIdx}_${Date.now()}`, visited: false,
            photoSpot: { ...s.photoSpot, milesReward: 50 } 
        }))
    }));
  } catch (error) { throw error; }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text);
  if (!cleanText || cleanText.length < 3) return "";
  
  const textHash = generateHash(cleanText);
  const cacheKey = `audio_${language}_${textHash}`;
  const cached = await getCachedAudio(cacheKey);
  if (cached) return cached;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await callAiWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    }));
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (audioData) saveAudioToCache(cacheKey, audioData).catch(console.error);
    return audioData;
  } catch (e) { return ""; }
};

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
    const prompt = `Translate exactly this JSON array of tours to ${targetLang}. Keep the long descriptions (450+ words). JSON strictly. TOURS: ${JSON.stringify(tours)}`;
    
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: langRule,
                responseMimeType: "application/json",
                maxOutputTokens: 60000
            }
        }));
        return JSON.parse(extractJson(response.text || "[]"));
    } catch (e) {
        console.error("Translation error:", e);
        return tours;
    }
};

export const getGreetingContext = async (city: string, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = LANGUAGE_RULES[language] || LANGUAGE_RULES.es;
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Genera un saludo breve y cínico sobre ${city}.`,
            config: { systemInstruction: langRule, temperature: 0.8 }
        }));
        return response.text || "";
    } catch (e) { return ""; }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Postcard of ${city}, ${interests.join(', ')}. Cinema style, detailed.`;
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        }));
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return null;
    } catch (e) { return null; }
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze safety: "${text}". Reply only 'safe' or 'unsafe'.`,
            config: { temperature: 0 }
        }));
        return response.text?.toLowerCase().includes('safe');
    } catch (e) { return true; } 
};
