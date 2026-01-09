
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, una guía local experta de España, apasionada y culta. IDIOMA: Español de España (Castellano). REGLA CRÍTICA: Usa vocabulario de España (ej: 'coche' no 'carro', 'aparcar' no 'estacionar', 'ordenador' no 'computadora'). Prohibido usar palabras técnicas de estructura como 'CAPA', 'LAYER', 'NIVEL'. Habla de forma fluida, literaria y natural.",
    en: "PERSONALITY: You are Dai, an expert local guide. LANGUAGE: English. CRITICAL RULE: Never mention structural metadata like 'LAYER' or 'SECTION'. Write in a fluid, narrative style.",
};

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    // Filtro avanzado para eliminar cualquier residuo de estructuración de IA
    return text
        .replace(/(CAPA|LAYER|NIVEL|ETAPA|SECCIÓN|PUNTO|STEP|FASE|ESTADIO)\s*\d+[:.-]?/gi, '')
        .replace(/^\d+\.\s*/gm, '') // Elimina números al inicio de línea
        .replace(/\*\*/g, '')
        .replace(/###/g, '')
        .replace(/#/g, '')
        .replace(/^- /g, '')
        .trim();
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[] | 'QUOTA'> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const prompt = `${langRule}
  CIUDAD: ${cityInput}. 
  OBJETIVO: Crea un tour de 12 a 15 paradas que formen una RUTA PEATONAL LINEAL Y NO CIRCULAR.
  REGLA DE RUTA: El punto de inicio y el punto final deben estar geográficamente alejados. La ruta debe atravesar la ciudad en una dirección lógica (ej: de Norte a Sur o de Este a Oeste). NO vuelvas al punto de partida.
  CONTENIDO: Cada parada debe ser EXTENSA (mínimo 350 palabras) y detallada. Incluye: 
  - Análisis arquitectónico profundo (estilo, materiales, anécdotas del constructor).
  - Contexto histórico político y social del lugar.
  - Curiosidades ocultas o leyendas que no aparecen en las guías estándar.
  INSTRUCCIONES: Las coordenadas GPS deben ser extremadamente precisas.
  PHOTO SPOT: Define un ángulo 'instagrameable' poético para cada lugar.`;

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
        stops: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ['historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'] },
              photoSpot: {
                type: Type.OBJECT,
                properties: { 
                  angle: { type: Type.STRING }, 
                  milesReward: { type: Type.NUMBER }, 
                  secretLocation: { type: Type.STRING } 
                },
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
  const cleanText = cleanDescriptionText(text);
  const cached = await getCachedAudio(cleanText, language);
  if (cached) return cached;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Instrucción específica para forzar el acento de España
    const audioPrompt = language === 'es' 
        ? `Léeme este texto con un acento español de España (peninsular) claro, natural y profesional: ${cleanText}`
        : cleanText;

    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: audioPrompt }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
            voiceConfig: { 
                prebuiltVoiceConfig: { voiceName: 'Kore' } 
            } 
        } 
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (audioData) saveAudioToCache(cleanText, language, audioData);
    return audioData;
  } catch (e) { return ""; }
};

export const moderateContent = async (text: string): Promise<boolean> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Safe check: "${text}". Reply JSON: {"safe": boolean}`,
            config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(response.text || '{"safe": false}');
        return !!parsed.safe;
    } catch (error) { return true; }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Vertical travel poster of ${city} highlighting ${interests.join(', ')}. No text, highly detailed.` }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return null;
    } catch (error) { return null; }
};
