
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor de BDAI. Genera TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, experto en ingeniería y anécdotas reales.
1. INGENIERÍA: Detalles técnicos, materiales, retos estructurales.
2. HISTORIA OCULTA: Motivos reales, conspiraciones, secretos.
3. SALSEO REAL: Errores, crímenes, anécdotas humanas crudas.
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
    zh: `${MASTERCLASS_INSTRUCTION} 仅用中文回答.`,
    ca: `${MASTERCLASS_INSTRUCTION} RESPON EN CATALÀ.`,
    eu: `${MASTERCLASS_INSTRUCTION} EUSKARAZ ERANTZUN.`
};

async function callAiWithRetry(fn: () => Promise<any>, retries = 2, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const errorMsg = error.message?.toLowerCase() || "";
            if (errorMsg.includes('429') || errorMsg.includes('503')) {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
            }
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
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
 * FLASH + NO THINKING = COSTE CASI CERO
 */
export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identify location: "${input}". Return JSON array: [{name(EN), spanishName, country}].`,
            config: { 
                temperature: 0,
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 } // No gastar en razonamiento para esto
            }
        });
        const parsed = JSON.parse(response.text || "[]");
        return parsed.length > 0 ? parsed : [{ name: input, spanishName: input, country: "" }];
    } catch (e) { 
        return [{ name: input, spanishName: input, country: "" }]; 
    }
};

/**
 * PRO + THINKING = INVERSIÓN EN CALIDAD (Solo se paga una vez por ciudad)
 */
export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLang = userProfile.language || 'es';
  const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
  
  const prompt = `Genera 3 TOURS TEMÁTICOS de ALTA DENSIDAD para ${cityInput}, ${countryInput}. 
  Usa latitud/longitud precisas. Descripciones de +250 palabras técnicas/curiosidades.
  Formato JSON.`;

  const response = await callAiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: { 
          systemInstruction: langRule, 
          responseMimeType: "application/json", 
          maxOutputTokens: 18000,
          thinkingConfig: { thinkingBudget: 4000 } // Aquí sí invertimos para tener calidad Pro
      }
  }));

  const parsed = JSON.parse(response.text || "[]");
  return parsed.map((t: any, idx: number) => ({
      ...t, 
      id: `tour_pro_${Date.now()}_${idx}`, 
      city: cityInput,
      stops: t.stops.map((s: any, sIdx: number) => ({ 
          ...s, 
          id: `s_pro_${Date.now()}_${idx}_${sIdx}`, 
          visited: false,
          photoSpot: s.photoSpot || { angle: "Perspectiva de Ingeniería", milesReward: 50, secretLocation: s.name }
      }))
  }));
};

/**
 * FLASH + NO THINKING = TRADUCCIÓN BARATA
 */
export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
    const response = await callAiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate to ${targetLang} preserving technical depth: ${JSON.stringify(tours)}`,
        config: { 
            systemInstruction: langRule, 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 } // Traducción mecánica, coste mínimo
        }
    }));
    return JSON.parse(response.text || "[]");
};

/**
 * TTS MODEL = OPTIMIZADO PARA AUDIO (Caché en Supabase habilitada)
 */
export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text);
  if (!cleanText) return "";
  const cacheKey = `v2_audio_${language}_${generateHash(cleanText)}`;
  
  // 1. MIRAR EN CACHÉ (Coste 0)
  const cached = await getCachedAudio(cacheKey);
  if (cached) return cached;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await callAiWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Lee con tono experto y cínico: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    }));
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    
    // 2. GUARDAR EN CACHÉ PARA EL FUTURO
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
            config: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } }
        });
        return response.text?.toUpperCase().includes('SAFE');
    } catch (e) { return true; } 
};

// Generates an artistic postcard using gemini-2.5-flash-image
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `An artistic, high-quality travel postcard for the city of ${city}. 
    Themes to include: ${interests.join(', ')}. 
    Visual style: Cinematic photography, vibrant colors, professional lighting, 8k resolution, capturing the soul of the destination.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "9:16"
                }
            }
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Error generating city postcard:", e);
        return null;
    }
};
