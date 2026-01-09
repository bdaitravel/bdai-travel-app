
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "IDIOMA: Español de ESPAÑA. TONO: Eres Dai, una guía exploradora entusiasta y experta. Habla siempre en primera persona del singular.",
    en: "LANGUAGE: British English. TONE: You are Dai, an enthusiastic and expert explorer guide. Always speak in the first person singular.",
    ca: "IDIOMA: Català. TONO: Ets la Dai, una guia entusiasta.",
    eu: "IDIOMA: Euskara. TONO: Dai zara, gida aditua.",
    fr: "LANGUE: Français. TON: Tu es Dai, exploratrice experte."
};

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').replace(/^- /g, '').replace(/^\d+\. /g, '').trim();
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[] | 'QUOTA'> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const prompt = `PERSONALIDAD: Eres Dai, la guía IA de la aplicación bdai.
  LUGAR: ${cityInput}. 
  TAREA: Crea un tour de 12 paradas lineales. 
  ESTILO: Narración envolvente, experta y cercana. 
  TRADUCCIÓN NATIVA: ${langRule}. 
  DENSIDAD: 300 palabras por parada. 
  SECRETO: Cada parada DEBE incluir un 'secretLocation' titulado como "Secreto de Dai" que contenga un dato exclusivo que tú, como IA experta, conoces.`;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        duration: { type: Type.STRING },
        distance: { type: Type.STRING },
        difficulty: { type: Type.STRING, enum: ["Easy", "Moderate", "Hard"] },
        theme: { type: Type.STRING },
        stops: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ['historical', 'food', 'art', 'nature', 'photo', 'culture'] },
              photoSpot: {
                type: Type.OBJECT,
                properties: { 
                  angle: { type: Type.STRING }, 
                  bestTime: { type: Type.STRING }, 
                  instagramHook: { type: Type.STRING }, 
                  milesReward: { type: Type.NUMBER }, 
                  secretLocation: { type: Type.STRING, description: "El Secreto de Dai para esta parada." } 
                },
                required: ["angle", "bestTime", "instagramHook", "milesReward", "secretLocation"]
              }
            },
            required: ["name", "description", "latitude", "longitude", "type", "photoSpot"]
          }
        }
      },
      required: ["title", "description", "duration", "distance", "difficulty", "theme", "stops"]
    }
  };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: responseSchema }
    });
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}`, visited: false }))
    }));
  } catch (error) { return []; }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  const cached = await getCachedAudio(text, language);
  if (cached) return cached;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Instrucción de voz fija: Kore para español, presentándose como Dai
    const speechPrompt = `Soy Dai, tu guía IA. Lee esto con tono aventurero y experto: ${text.substring(0, 2000)}`;
    
    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: speechPrompt }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: 'Kore' } // Voz oficial de Dai para español
          } 
        } 
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (audioData) {
        await saveAudioToCache(text, language, audioData);
    }
    return audioData;
  } catch (e) { 
    console.error("Audio generation failed:", e);
    return ""; 
  }
};

export const moderateContent = async (content: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse the following user content for safety: "${content}". Return JSON {isSafe: boolean}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { isSafe: { type: Type.BOOLEAN } },
          required: ["isSafe"]
        }
      }
    });
    const result = JSON.parse(response.text || '{"isSafe": true}');
    return result.isSafe;
  } catch (error) { return true; }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Vertical cinematic travel postcard of ${city}. Themes: ${interests.join(', ')}. 9:16, high quality, no text.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "9:16" } }
    });
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) { return null; }
};
