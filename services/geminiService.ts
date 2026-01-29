
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Tu misión es generar TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, hiper-detallista, experto en ingeniería y anécdotas reales.
NO seas un folleto turístico aburrido. 
Céntrate en:
1. INGENIERÍA: ¿Cómo se sostiene ese puente? ¿Qué materiales usaron?
2. HISTORIA OCULTA: No fechas, sino motivos. ¿Por qué se construyó eso ahí realmente?
3. SALSEO REAL: Conspiraciones, errores de diseño, crímenes o anécdotas humanas.
`;

const LANGUAGE_RULES: Record<string, string> = {
    es: `${MASTERCLASS_INSTRUCTION} RESPONDE SIEMPRE EN ESPAÑOL.`,
    en: `${MASTERCLASS_INSTRUCTION} ALWAYS RESPOND IN ENGLISH.`,
    pt: `${MASTERCLASS_INSTRUCTION} RESPONDA EM PORTUGUÊS.`,
    it: `${MASTERCLASS_INSTRUCTION} RISPONDI IN ITALIANO.`,
    ru: `${MASTERCLASS_INSTRUCTION} ОТВЕЧАЙТЕ НА РУССКОМ.`,
    hi: `${MASTERCLASS_INSTRUCTION} हिंदी में उत्तर दें।`,
    fr: `${MASTERCLASS_INSTRUCTION} RÉPONDEZ EN FRANÇAIS.`,
    de: `${MASTERCLASS_INSTRUCTION} ANTWORTEN SIE AUF DEUTSCH.`,
    ja: `${MASTERCLASS_INSTRUCTION} 日本語で回答してください。`,
    zh: `${MASTERCLASS_INSTRUCTION} 仅用中文回答。`,
    ca: `${MASTERCLASS_INSTRUCTION} RESPON EN CATALÀ.`,
    eu: `${MASTERCLASS_INSTRUCTION} EUSKARAZ ERANTZUN.`
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
 * Motor de estandarización inteligente: Unifica cualquier error ortográfico o idioma
 * al nombre oficial para maximizar hits en caché.
 */
export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identify the EXACT location for this input (could have typos or be in any language): "${input}". 
            Return JSON array. Field "name" must be the international name (English) and "spanishName" the name in Spanish.`,
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
        }));
        return JSON.parse(response.text || "[]");
    } catch (e) { return [{ name: input, spanishName: input, country: "" }]; }
};

/**
 * Generador de Tours "Masterclass": Crea contenido nuevo si no existe.
 */
export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const targetLang = userProfile.language || 'es';
  const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Genera 3 TOURS TEMÁTICOS distintos para ${cityInput}, ${countryInput}. 
  Cada tour debe tener 10 paradas. 
  Formato JSON. 
  Importante: Las descripciones de las paradas deben ser largas, ricas en datos de ingeniería y salseo histórico.
  Asegúrate de incluir coordenadas lat/lng reales para el GPS.`;

  try {
    const response = await callAiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
            systemInstruction: langRule, 
            responseMimeType: "application/json", 
            maxOutputTokens: 20000,
            thinkingConfig: { thinkingBudget: 2000 } // Activamos el razonamiento para tours más inteligentes
        }
    }));
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, 
        id: `tour_${idx}_${Date.now()}`, 
        city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ 
            ...s, 
            id: `s_${idx}_${sIdx}`, 
            visited: false,
            photoSpot: s.photoSpot || { angle: "Vista Panorámica", milesReward: 50, secretLocation: s.name }
        }))
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

/**
 * Traductor Contextual: Traduce tours existentes a nuevos idiomas bajo demanda.
 */
export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate these tours to the target language maintaining the cynical and detailed tone: ${JSON.stringify(tours)}`,
            config: { 
                systemInstruction: langRule, 
                responseMimeType: "application/json", 
                maxOutputTokens: 20000,
                thinkingConfig: { thinkingBudget: 1000 }
            }
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
            contents: { parts: [{ text: `A cinematic postcard of ${city} highlighting its hidden architecture. No text.` }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        return part ? `data:image/png;base64,${part.inlineData.data}` : null;
    } catch (e) { return null; }
};
