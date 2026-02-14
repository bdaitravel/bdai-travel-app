
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Tour } from '../types';
import { saveAudioToCache, getCachedAudio } from './supabaseClient';

const aiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates tourist tours for a specified city using Gemini.
 */
export const generateTours = async (city: string): Promise<Tour[]> => {
  const ai = aiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera 3 tours turísticos para la ciudad de ${city}. 
    Cada tour debe tener entre 3 y 5 paradas. 
    Responde estrictamente en formato JSON siguiendo este esquema:
    Array de objetos con: id (string), city (string), title (string), description (string), stops (array de objetos con id, name, description, latitude, longitude, type).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            city: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            stops: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER },
                  type: { type: Type.STRING }
                },
                required: ["id", "name", "description", "latitude", "longitude"]
              }
            }
          },
          required: ["id", "city", "title", "description", "stops"]
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Error parsing AI response", e);
    return [];
  }
};

/**
 * Transforms text to speech using Gemini 2.5 Flash TTS.
 */
export const generateAudio = async (text: string, lang: string, city: string): Promise<string | null> => {
  const cached = await getCachedAudio(text, lang);
  if (cached) return cached;

  const ai = aiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Narrate clearly in ${lang}: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64) {
      await saveAudioToCache(text, lang, base64, city);
      return base64;
    }
  } catch (e) {
    console.error("TTS Error", e);
  }
  return null;
};

/**
 * Checks content for toxicity and appropriateness.
 */
export const moderateContent = async (text: string): Promise<boolean> => {
  const ai = aiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze if the following text is appropriate for a family-friendly travel community board. Respond with 'TRUE' if it is safe and appropriate, or 'FALSE' if it contains hate speech, violence, explicit content, or severe toxicity.
      Text: "${text}"`,
    });
    const result = response.text?.trim().toUpperCase();
    return result === 'TRUE';
  } catch (e) {
    return true; // Default to allowing if API fails
  }
};

/**
 * Generates an artistic postcard image for a city.
 */
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
  const ai = aiClient();
  try {
    const prompt = `A high-quality, vibrant cinematic postcard of ${city} specifically highlighting ${interests.join(', ')}. No text, focus on scenery and atmosphere.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "9:16" }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Postcard generation error", e);
  }
  return null;
};

/**
 * Translates a set of tours into another language.
 */
export const translateToursBatch = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
  const ai = aiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following array of tour objects to ${targetLang}. Keep all numerical values, IDs, and coordinates exactly the same. Return valid JSON only.
      Tours: ${JSON.stringify(tours)}`,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Batch translation error", e);
    return tours;
  }
};
