
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Tu misión es generar TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, hiper-detallista, experto en ingeniería y anécdotas reales.
NO seas un folleto turístico aburrido. 
Céntrate en:
1. INGENIERÍA: Detalles técnicos de construcción, materiales, retos arquitectónicos.
2. HISTORIA OCULTA: Secretos de estado, conspiraciones, motivos reales tras las construcciones.
3. SALSEO REAL: Errores humanos, crímenes históricos, anécdotas picantes o cínicas.
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

async function callAiWithRetry(fn: () => Promise<any>, retries = 3, delay = 1500) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            console.error(`AI Error (Intento ${i+1}):`, error.message);
            // Si el error es de autenticación, no reintentamos
            if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401') || error.message?.includes('403')) {
                throw new Error("AUTH_ERROR: La API Key de Google es inválida o está bloqueada.");
            }
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
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

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    if (!process.env.API_KEY) throw new Error("MISSING_KEY: No se encontró la API_KEY en Vercel.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Location identification for: "${input}". Provide official names.`,
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
    } catch (e) { 
        return [{ name: input, spanishName: input, country: "" }]; 
    }
};

export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLang = userProfile.language || 'es';
  const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
  
  const prompt = `Genera 3 TOURS únicos para ${cityInput}, ${countryInput}. Cada tour: 10 paradas con latitud/longitud precisas. Descripciones: +300 palabras por parada, densas en ingeniería y secretos. Formato JSON.`;

  const response = await callAiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: { 
          systemInstruction: langRule, 
          responseMimeType: "application/json", 
          maxOutputTokens: 20000
      }
  }));

  const parsed = JSON.parse(response.text || "[]");
  return parsed.map((t: any, idx: number) => ({
      ...t, 
      id: `tour_${Date.now()}_${idx}`, 
      city: cityInput,
      stops: t.stops.map((s: any, sIdx: number) => ({ 
          ...s, 
          id: `s_${Date.now()}_${idx}_${sIdx}`, 
          visited: false,
          photoSpot: s.photoSpot || { angle: "Perspectiva de Ingeniero", milesReward: 50, secretLocation: s.name }
      }))
  }));
};

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
    const response = await callAiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate to ${targetLang} keeping the cynical/expert tone: ${JSON.stringify(tours)}`,
        config: { 
            systemInstruction: langRule, 
            responseMimeType: "application/json"
        }
    }));
    return JSON.parse(response.text || "[]");
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
            contents: { parts: [{ text: `Professional architectural postcard of ${city}. Cinematic lighting. No text.` }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        return part ? `data:image/png;base64,${part.inlineData.data}` : null;
    } catch (e) { return null; }
};
