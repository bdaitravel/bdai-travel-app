
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, una guía local experta de élite, apasionada, técnica y culta. IDIOMA: Español de España (Castellano). REGLA CRÍTICA: Usa vocabulario de España. Habla de forma fluida, literaria y natural.",
    en: "PERSONALITY: You are Dai, an elite expert local guide. Narrative, technical, and highly cultured. LANGUAGE: English. Write in a fluid, narrative style with high technical precision.",
    ca: "PERSONALITAT: Ets la Dai, una guia local experta d'elit, apassionada i culta. IDIOMA: Català (estàndard de Catalunya). REGLA CRÍTICA: Has de traduir ABSOLUTAMENT TOT al català, incloent descripcions, noms de llocs si s'escau i detalls tècnics. No deixis res en castellà. Estil fluid i literari.",
    eu: "NORTASUNA: Dai zara, eliteko tokiko gida aditua, sutsua eta jantzia. HIZKUNTZA: Euskara (Batua). KRITIKOA: Itzuli DENA euskarara, batere gaztelaniarik gabe. Mantendu informazio tekniko guztia.",
    fr: "PERSONNALITÉ: Vous êtes Dai, une guide locale experte d'élite, passionnée et cultivée. LANGUE: Français. CRITIQUE: Traduisez ABSOLUMENT TOUT en français. Ne laissez rien en espagnol. Style fluide et technique."
};

const AUDIO_PROMPTS: Record<string, string> = {
    es: "Léeme este texto con un acento español de España (peninsular) claro y natural: ",
    en: "Read this text with a professional and clear English accent: ",
    ca: "Llegeix aquest text amb un accent català natural i clar: ",
    eu: "Irakurri testu hau euskarazko ahoskera argi eta naturalarekin: ",
    fr: "Lisez ce texte avec un accent français clair et naturel : "
};

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text
        .replace(/(CAPA|LAYER|NIVEL|ETAPA|SECCIÓN|PUNTO|STEP|FASE|ESTADIO|PARADA|STOP|STATION)\s*\d+[:.-]?/gi, '')
        .replace(/^\d+[\.\)\-]\s*/gm, '') // Elimina numeración al inicio de líneas
        .replace(/\*\*/g, '')
        .replace(/###/g, '')
        .replace(/#/g, '')
        .replace(/^- /g, '')
        .trim();
};

/**
 * Estandariza el nombre de la ciudad usando IA para evitar duplicados en caché 
 * (ej: "Mexico DF", "CDMX", "Mexico" -> "Ciudad de México")
 */
export const standardizeCityName = async (input: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Act as a geographical database expert. Standardize the following city name to its official full name in Spanish. 
            Example: "DF" -> "Ciudad de México", "NY" -> "Nueva York", "BCN" -> "Barcelona".
            Return ONLY the name of the city, nothing else.
            INPUT: "${input}"`,
            config: { temperature: 0 }
        });
        return response.text.trim();
    } catch (e) {
        return input;
    }
};

export const translateTours = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    if (targetLanguage === 'es' || !tours.length) return tours;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personality = LANGUAGE_RULES[targetLanguage] || LANGUAGE_RULES.es;
    
    const toursToTranslate = tours.map(t => ({
        title: t.title,
        description: t.description,
        theme: t.theme,
        duration: t.duration,
        distance: t.distance,
        stops: t.stops.map(s => ({
            name: s.name,
            description: s.description,
            photoSpot: s.photoSpot ? {
                angle: s.photoSpot.angle,
                bestTime: s.photoSpot.bestTime,
                instagramHook: s.photoSpot.instagramHook,
                secretLocation: s.photoSpot.secretLocation
            } : null
        }))
    }));

    const prompt = `Act as an elite expert multilingual tour guide named Dai. 
    SYSTEM INSTRUCTION: ${personality}
    TASK: Translate the following tours into ${targetLanguage}. Maintain high technical and literary precision.
    Return EXACTLY a JSON array.

    DATA: ${JSON.stringify(toursToTranslate)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.1 }
        });
        const translatedData = JSON.parse(response.text || "[]");
        return tours.map((original, idx) => {
            const translated = Array.isArray(translatedData) ? translatedData[idx] : translatedData;
            if (!translated) return original;
            return {
                ...original,
                title: translated.title || original.title,
                description: translated.description || original.description,
                theme: translated.theme || original.theme,
                stops: original.stops.map((s, sIdx) => {
                    const tStop = translated.stops?.[sIdx];
                    return {
                        ...s,
                        name: tStop?.name || s.name,
                        description: tStop?.description || s.description,
                        photoSpot: s.photoSpot ? {
                            ...s.photoSpot,
                            angle: tStop?.photoSpot?.angle || s.photoSpot.angle,
                            bestTime: tStop?.photoSpot?.bestTime || s.photoSpot.bestTime,
                            instagramHook: tStop?.photoSpot?.instagramHook || s.photoSpot.instagramHook,
                            secretLocation: tStop?.photoSpot?.secretLocation || s.photoSpot.secretLocation
                        } : s.photoSpot
                    };
                })
            };
        });
    } catch (error) { return tours; }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const prompt = `${langRule}
  CIUDAD: ${cityInput}. 
  OBJETIVO: Crea una colección de 3 TOURS TEMÁTICOS únicos (Esenciales, Arquitectura/Ingeniería, y Secretos/Vida Local).
  
  REGLA DE ORO "MASTERCLASS DE ÉLITE": 
  - Cada tour debe tener entre 12 y 15 paradas obligatoriamente.
  - CADA PARADA DEBE TENER UNA DESCRIPCIÓN DE MÍNIMO 1000 PALABRAS (ENSAYO EXTENSO).
  - El contenido debe ser un análisis técnico profundo: detalles de estereotomía, física de cargas, cimentación, geología urbana, mecánica de fluidos, secretos de archivo y anécdotas de alta cultura.
  - PROHIBICIÓN ABSOLUTA: No enumeres las paradas en el título (ej: "1. Plaza" es INCORRECTO, "Plaza Mayor: Ingeniería del Ladrillo" es CORRECTO).
  - PROHIBICIÓN ABSOLUTA: No uses listas de puntos o bullets. Todo debe ser texto narrativo denso y literario.
  - Devuelve un ARRAY JSON con 3 elementos.`;

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
                properties: { angle: { type: Type.STRING }, bestTime: { type: Type.STRING }, instagramHook: { type: Type.STRING }, milesReward: { type: Type.NUMBER }, secretLocation: { type: Type.STRING } },
                required: ["angle", "bestTime", "instagramHook", "milesReward", "secretLocation"]
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
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, 
        id: `tour_${idx}_${Date.now()}`, 
        city: cityInput,
        difficulty: (['Easy', 'Moderate', 'Hard'] as const)[idx % 3],
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}_${Date.now()}`, visited: false }))
    }));
  } catch (error) { return []; }
};

export const generateAudio = async (text: string, language: string = 'es'): Promise<string> => {
  const cleanText = cleanDescriptionText(text);
  const cached = await getCachedAudio(cleanText, language);
  if (cached) return cached;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const instruction = AUDIO_PROMPTS[language] || AUDIO_PROMPTS.es;
    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: `${instruction}${cleanText}` }] }], 
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } }
    });
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (audioData) saveAudioToCache(cleanText, language, audioData);
    return audioData;
  } catch (e) { return ""; }
};

export const moderateContent = async (text: string): Promise<boolean> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Moderación de contenido. ¿Es este mensaje seguro y apropiado para una comunidad de viajes? Responde solo con un JSON que indique si es seguro.
      Mensaje: "${text}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN }
          },
          required: ['isSafe']
        }
      }
    });
    const result = JSON.parse(response.text || '{"isSafe": false}');
    return result.isSafe;
  } catch (error) {
    console.error("Moderation error:", error);
    return false;
  }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Create a beautiful, high-quality travel postcard of ${city}. 
  The style should be artistic and vibrant, reflecting these interests: ${interests.join(', ')}. 
  Do not include any text or watermarks in the image.`;

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

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64Data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Postcard generation error:", error);
    return null;
  }
};
