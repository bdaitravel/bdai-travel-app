
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, analista senior de BDAI. ESTILO: CÍNICO, NARRATIVO, HIPER-DETALLISTA. RESPONDE EN ESPAÑOL.",
    en: "PERSONALITY: You are Dai, senior analyst for BDAI. STYLE: CYNICAL, NARRATIVE, HYPER-DETAILED. RESPOND IN ENGLISH.",
    pt: "PERSONALIDADE: Você é Dai, analista sênior da BDAI. ESTILO: CÍNICO, NARRATIVO, DETALHADO. RESPONDA EM PORTUGUÊS.",
    it: "PERSONALITÀ: Sei Dai, analista senior di BDAI. STILE: CINICO, NARRATIVO, DETTAGLIATO. RISPONDI IN ITALIANO.",
    ru: "ЛИЧНОСТЬ: Вы Дай, старший аналитик BDAI. СТИЛЬ: ЦИНИЧНЫЙ, НАРРАТИВНЫЙ. ОТВЕЧАЙТЕ НА РУССКОМ.",
    hi: "व्यक्तित्व: आप दाई हैं, BDAI के वरिष्ठ विश्लेषक। शैली: विस्तृत, कथात्मक। हिंदी में उत्तर दें।",
    fr: "PERSONNALITÉ : Vous êtes Dai, analyste senior. RÉPONDEZ EN FRANÇAIS.",
    de: "PERSÖNLICHKEIT: Du bist Dai, Senior Analyst. ANTWORTEN SIE AUF DEUTSCH.",
    ja: "パーソナリティ：あなたは Dai です。日本語で回答してください。",
    zh: "个性：你是 Dai。仅用中文回答。"
};

async function callAiWithRetry(fn: () => Promise<any>, retries = 4, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const errorMsg = error.message || "";
            const isRetryable = errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('429');
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
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '').replace(/#/g, '').trim();
};

const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
};

/**
 * Nueva versión inteligente: Identifica el nombre oficial en varios idiomas para asegurar el hit en caché.
 */
export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identify location for: "${input}". 
            Return JSON array of possible matches. 
            Crucial: Provide the name in English (name) and the name in Spanish (spanishName).`,
            config: { 
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { 
                            name: { type: Type.STRING, description: "Official name in English" }, 
                            spanishName: { type: Type.STRING, description: "Official name in Spanish" },
                            country: { type: Type.STRING } 
                        },
                        required: ["name", "spanishName", "country"]
                    }
                }
            }
        }));
        return JSON.parse(response.text || "[]");
    } catch (e) { return [{ name: input, spanishName: input, country: "" }]; }
};

export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Genera 3 TOURS para ${cityInput}, ${countryInput}. JSON format. 10 stops per tour.`;
  try {
    const response = await callAiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { systemInstruction: langRule, responseMimeType: "application/json", maxOutputTokens: 20000 }
    }));
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}`, visited: false }))
    }));
  } catch (error) { throw error; }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text);
  if (!cleanText) return "";
  const cacheKey = `audio_${language}_${generateHash(cleanText)}`;
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
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate this to ${targetLang}: ${JSON.stringify(tours)}`,
            config: { systemInstruction: langRule, responseMimeType: "application/json", maxOutputTokens: 20000 }
        }));
        return JSON.parse(response.text || "[]");
    } catch (e) { return tours; }
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Is this safe? "${text}" (SAFE/UNSAFE)`,
            config: { temperature: 0 }
        });
        return response.text?.toUpperCase().includes('SAFE');
    } catch (e) { return true; } 
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `A postcard of ${city}. No text.` }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        return part ? `data:image/png;base64,${part.inlineData.data}` : null;
    } catch (e) { return null; }
};
