
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

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
    ca: `${MASTERCLASS_INSTRUCTION} RESPON SEMPRE EN CATALÀ.`,
    eu: `${MASTERCLASS_INSTRUCTION} ERANTZUN BETI EUSKARAZ.`
};

async function callAiWithRetry(fn: () => Promise<any>, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fn();
            return res;
        } catch (error: any) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '').replace(/#/g, '').trim();
};

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Search global locations for: "${input}". 
            If ambiguous (e.g. Cordoba), list major ones. 
            Return JSON array: [{name(EN), spanishName, country}].`,
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
        return []; 
    }
};

export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLang = userProfile.language || 'es';
  const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
  
  const prompt = `Genera 3 TOURS TEMÁTICOS de ALTA DENSIDAD para ${cityInput}, ${countryInput}. 
  Cada tour debe tener 8 paradas con coordenadas precisas. Formato JSON. 
  RESPONDE OBLIGATORIAMENTE EN EL IDIOMA: ${targetLang}.`;

  const response = await callAiWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
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
          photoSpot: { angle: "Vista de Ingeniería", milesReward: 50, secretLocation: s.name }
      }))
  }));
};

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = `Traduce este contenido JSON al idioma con código "${targetLang}". Mantén el estilo técnico y cínico de BDAI. No cambies la estructura JSON.`;
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
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { 
    console.error("Audio Generation Error:", e);
    return ""; 
  }
};

/**
 * Moderates content to ensure it is appropriate for the travel community board.
 */
export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze if this message is inappropriate, toxic, or offensive for a travel community board: "${text}". 
            Return JSON: { "isSafe": boolean }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSafe: { type: Type.BOOLEAN }
                    },
                    required: ["isSafe"]
                }
            }
        });
        const result = JSON.parse(response.text || '{"isSafe": true}');
        return result.isSafe;
    } catch (e) {
        console.error("Content Moderation Error:", e);
        return true; // Default to safe if error occurs to avoid blocking user interaction unnecessarily
    }
};

/**
 * Generates an artistic postcard for a city based on user interests.
 */
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const prompt = `A highly detailed, cinematic travel postcard for the city of ${city}. 
        Incorporate themes from these interests: ${interests.join(', ')}. 
        Style: Professional travel photography, vibrant and saturated colors, golden hour lighting, 9:16 portrait aspect ratio. 
        The image should capture an iconic landmark or the unique atmosphere of the city.`;

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

        // The model returns image parts, iterate to find the inlineData part
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Postcard Generation Error:", e);
        return null;
    }
};
