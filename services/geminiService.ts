
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor de BDAI. Genera TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, experto en ingeniería y anécdotas reales.
1. INGENIERÍA: Detalles técnicos, materiales, retos estructurales.
2. HISTORIA OCULTA: Motivos reales, conspiraciones, secretos.
3. SALSEO REAL: Errores, crímenes, anécdotas humanas crudas.
No uses un lenguaje aburrido de guía turística. Sé directo, técnico y un poco mordaz.
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

/**
 * Lógica de reintento mejorada para evitar bloqueos
 */
async function callAiWithRetry(fn: () => Promise<any>, retries = 3, delay = 1500) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fn();
            if (!res) throw new Error("Respuesta vacía de la IA");
            return res;
        } catch (error: any) {
            console.warn(`Intento ${i + 1} fallido:`, error.message);
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identifica esta ubicación y devuelve JSON: "${input}".`,
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

/**
 * GENERACIÓN DE TOURS: Usamos FLASH para máxima velocidad y evitar errores de cuota Pro
 */
export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLang = userProfile.language || 'es';
  const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
  
  const prompt = `Genera 3 TOURS únicos para ${cityInput}, ${countryInput}. 
  Cada tour debe tener 8 paradas con coordenadas precisas y descripciones técnicas de 200 palabras cada una.`;

  const response = await callAiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', // CAMBIO A FLASH: Más estable y rápido
      contents: prompt,
      config: { 
          systemInstruction: langRule, 
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      theme: { type: Type.STRING },
                      distance: { type: Type.STRING },
                      stops: {
                          type: Type.ARRAY,
                          items: {
                              type: Type.OBJECT,
                              properties: {
                                  name: { type: Type.STRING },
                                  description: { type: Type.STRING },
                                  latitude: { type: Type.NUMBER },
                                  longitude: { type: Type.NUMBER },
                                  type: { type: Type.STRING }
                              },
                              required: ["name", "description", "latitude", "longitude", "type"]
                          }
                      }
                  },
                  required: ["title", "description", "stops"]
              }
          }
      }
  }));

  const parsed = JSON.parse(response.text || "[]");
  return parsed.map((t: any, idx: number) => ({
      ...t, 
      id: `tour_gen_${Date.now()}_${idx}`, 
      city: cityInput,
      stops: t.stops.map((s: any, sIdx: number) => ({ 
          ...s, 
          id: `s_gen_${Date.now()}_${idx}_${sIdx}`, 
          visited: false,
          photoSpot: { angle: "Perspectiva Técnica", milesReward: 50, secretLocation: s.name }
      }))
  }));
};

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = `Traduce este contenido al idioma con código "${targetLang}". Mantén el tono cínico y técnico.`;
    const response = await callAiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: JSON.stringify(tours),
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
  const cacheKey = `v3_audio_${language}_${generateHash(cleanText)}`;
  
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
            contents: `¿Es seguro este mensaje? "${text}" (RESPONDE SOLO: SAFE o UNSAFE)`,
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
            contents: { parts: [{ text: `Cinematic photography of ${city}. 8k, professional lighting.` }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        return part ? `data:image/png;base64,${part.inlineData.data}` : null;
    } catch (e) { return null; }
};
