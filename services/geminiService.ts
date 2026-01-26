
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, analista senior de BDAI. ESTILO: CÍNICO, NARRATIVO, HIPER-DETALLISTA. ENFOQUE: Historia profunda, salseo histórico (chismes de época), leyendas urbanas y secretos culturales. REGLA CRÍTICA: Cada descripción de parada DEBE ser extensa y profunda, superando las 450 palabras por parada. EVITA términos de ingeniería o arquitectura técnica aburrida; busca el drama humano, los secretos y el misterio. RESPONDE EXCLUSIVAMENTE EN ESPAÑOL DE ESPAÑA.",
    en: "PERSONALITY: You are Dai, senior analyst for BDAI. STYLE: CYNICAL, NARRATIVE, HYPER-DETAILED. FOCUS: Deep history, historical gossip, urban legends, and cultural secrets. CRITICAL RULE: Each stop description MUST exceed 450 words. AVOID boring engineering or technical terms; focus on drama and mystery. RESPOND EXCLUSIVELY IN ENGLISH.",
    ca: "PERSONALITAT: Ets la Dai, analista sènior de BDAI. ESTIL: Cínic i narratiu. ENFOCAMENT: Història profunda, llegendes i secrets culturals. REGLA: Cada descripció ha de superar les 450 paraules. RESPON EXCLUSIVAMENT EN CATALÀ.",
    eu: "NORTASUNA: Dai zara, BDAI-ko analista seniorra. ESTILOA: Zinikoa eta narratiboa. ENFOKEA: Historia sakona, kondairak eta sekretu kulturalak. ARAUA: Deskribapen bakoitzak 450 hitz baino gehiago izan behar ditu. ERANTZUN BAKARRIK EUSKARAZ.",
    fr: "PERSONNALITÉ: Vous êtes Dai, analyste senior de BDAI. STYLE: Cynique et narratif. FOCUS: Histoire profonde, légendes et secrets culturels. RÈGLE: Chaque description doit dépasser 450 mots. RÉPONDEZ EXCLUSIVEMENT EN FRANÇAIS."
};

async function callAiWithRetry(fn: () => Promise<any>, retries = 4, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const errorMsg = error.message || "";
            const isRetryable = errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('429') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('deadline');
            
            if (isRetryable && i < retries - 1) {
                console.warn(`[BDAI] Reintentando petición pesada (${i + 1}/${retries})...`);
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
            }
            throw error;
        }
    }
}

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').replace(/\*/g, '').trim();
};

const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
  }
  return Math.abs(hash).toString(36);
};

/**
 * Normaliza nombres de ciudades reconociendo idiomas regionales y nombres de países.
 * Si el usuario pone un país (ej. "Guatemala"), lo resuelve a la capital ("Ciudad de Guatemala").
 */
export const standardizeCityName = async (input: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identify the specific city intended by: "${input}". 
            RULES:
            1. If the input is a COUNTRY name, return the name of its CAPITAL city in Spanish.
            2. If the name is in another language (Basque, Catalan, English, etc.), translate it to its official name in Spanish.
            EXAMPLES:
            - "guatemala" -> "Ciudad de Guatemala"
            - "lekeitio" -> "Lequeitio"
            - "donostia" -> "San Sebastián"
            - "mexico" -> "Ciudad de México"
            - "london" -> "Londres"
            Return ONLY the city name in Spanish, capitalized. No extra text.`,
            config: { temperature: 0 }
        }));
        return response.text?.trim().replace(/\.$/, "") || input;
    } catch (e) { 
        return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase(); 
    }
};

export const getGreetingContext = async (city: string, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Greeting for ${city} in ${language}. Max 10 words.`,
            config: { temperature: 0.7 }
        }));
        return response.text?.trim() || "";
    } catch (e) { return ""; }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile, contextGreeting?: string, skipEssential: boolean = false): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const interestsStr = userProfile.interests.join(", ") || "historia y cultura";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Genera exactamente 3 TOURS para ${cityInput}. 
  Intereses del usuario: [${interestsStr}].
  REGLAS CRÍTICAS:
  1. PARADAS: Exactamente 10 paradas por cada tour.
  2. DESCRIPCIÓN: Cada parada DEBE tener un texto de al menos 450 palabras.
  3. TEMÁTICA: Salseo histórico, secretos, leyendas urbanas y drama humano.
  4. FORMATO: JSON estricto.`;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        duration: { type: Type.STRING },
        distance: { type: Type.STRING },
        theme: { type: Type.STRING },
        isEssential: { type: Type.BOOLEAN },
        stops: {
          type: Type.ARRAY,
          minItems: 10,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["historical", "food", "art", "nature", "photo", "culture", "architecture"] },
              photoSpot: {
                type: Type.OBJECT,
                properties: { angle: { type: Type.STRING }, milesReward: { type: Type.NUMBER }, secretLocation: { type: Type.STRING } },
                required: ["angle", "milesReward", "secretLocation"]
              }
            },
            required: ["name", "description", "latitude", "longitude", "type", "photoSpot"]
          }
        }
      },
      required: ["title", "description", "duration", "distance", "theme", "stops"]
    }
  };

  try {
    const response = await callAiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
            systemInstruction: langRule,
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            maxOutputTokens: 40000, 
            temperature: 0.8
        }
    }));
    
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput, difficulty: 'Moderate',
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}_${Date.now()}`, visited: false }))
    }));
  } catch (error) { throw error; }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text).substring(0, 4000);
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

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Appropriate? "${text}". Return SAFE or UNSAFE.`,
            config: { temperature: 0 }
        }));
        return response.text?.trim().toUpperCase() === "SAFE";
    } catch (e) { return true; }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Vertical travel postcard of ${city}, focus on ${interests.join(', ')}. No text.`;
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
