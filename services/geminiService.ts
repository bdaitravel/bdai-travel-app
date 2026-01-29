
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';

const MASTERCLASS_INSTRUCTION = `
You are Dai, the BDAI engine. Generate HIGH-DENSITY TOURS.
STYLE: Technical expert, cynical, engineering focused, real anecdotes.
IMPORTANT: You MUST ONLY respond in the language explicitly requested.
`;

const LANGUAGE_RULES: Record<string, string> = {
    es: `${MASTERCLASS_INSTRUCTION} OBLIGATORIO: RESPONDE ÚNICAMENTE EN ESPAÑOL.`,
    en: `${MASTERCLASS_INSTRUCTION} OBLIGATORY: RESPOND ONLY IN ENGLISH.`,
    de: `${MASTERCLASS_INSTRUCTION} PFLICHT: ANTWORTEN SIE NUR AUF DEUTSCH.`,
    pt: `${MASTERCLASS_INSTRUCTION} OBRIGATÓRIO: RESPONDA APENAS EM PORTUGUÊS.`,
    it: `${MASTERCLASS_INSTRUCTION} OBBLIGATORIO: RISPONDI SOLO IN ITALIANO.`,
    ru: `${MASTERCLASS_INSTRUCTION} ОБЯЗАТЕЛЬНО: ОТВЕЧАЙТЕ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.`,
    hi: `${MASTERCLASS_INSTRUCTION} अनिवार्य: केवल हिंदी में उत्तर दें।`,
    fr: `${MASTERCLASS_INSTRUCTION} OBLIGATOIRE: RÉPONDEZ UNIQUEMENT EN FRANÇAIS.`,
    ja: `${MASTERCLASS_INSTRUCTION} 必須：必ず日本語だけで回答してください。`,
    zh: `${MASTERCLASS_INSTRUCTION} 强制：仅用中文回答。`,
    ca: `${MASTERCLASS_INSTRUCTION} OBLIGATORI: RESPON ÚNICAMENT EN CATALÀ.`,
    eu: `${MASTERCLASS_INSTRUCTION} NAHITAEZKOA: ERANTZUN BAKARRIK EUSKARAZ.`
};

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identify location for: "${input}". Return JSON array: [{name(EN), spanishName, country}].`,
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
    } catch (e) { return []; }
};

export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLang = userProfile.language || 'es';
  
  const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `Generate 3 THEMATIC HIGH-DENSITY TOURS for ${cityInput}, ${countryInput}. 
      Each tour 8 stops with coordinates. Format JSON. 
      CRITICAL: ALL CONTENT MUST BE IN ${targetLang.toUpperCase()} LANGUAGE.`,
      config: { 
          systemInstruction: LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.en, 
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
  });

  const parsed = JSON.parse(response.text || "[]");
  return parsed.map((t: any, idx: number) => ({
      ...t, id: `tg_${Date.now()}_${idx}`, city: cityInput,
      stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `sg_${Date.now()}_${idx}_${sIdx}`, visited: false }))
  }));
};

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate this JSON to ${targetLang.toUpperCase()}. Keep BDAI technical style: ${JSON.stringify(tours)}`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak naturally in ${language}: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Check if toxic: "${text}". Return JSON {isSafe: boolean}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{"isSafe":true}').isSafe;
    } catch { return true; }
};

/**
 * Fix: Added generateCityPostcard to resolve missing export error.
 * Uses gemini-2.5-flash-image for artistic city postcard generation.
 */
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Create a beautiful, artistic postcard of ${city}. Focus on its ${interests.join(', ')} aspects. Style: cinematic, high quality, vibrant colors.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: "9:16",
                },
            }
        });
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Error generating postcard:", e);
        return null;
    }
};
