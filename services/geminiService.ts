
import { GoogleGenAI, Modality, GenerateContentResponse, Type } from "@google/genai";
import { Tour, Stop } from '../types';
import { STATIC_TOURS } from '../data/toursData';

const CACHE_PREFIX = 'bdai_cache_v71_'; 

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

const getFromCache = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(CACHE_PREFIX + key);
        if (!item) return null;
        return JSON.parse(item).data as T;
    } catch (e) { return null; }
};

const saveToCache = (key: string, data: any) => {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data }));
    } catch (e) {}
};

export const LANGUAGE_NAMES: {[key: string]: string} = {
    'es': 'Spanish', 'en': 'English', 'ca': 'Catalan', 'eu': 'Basque', 'fr': 'French',
    'de': 'German', 'ar': 'Arabic', 'zh': 'Chinese', 'ja': 'Japanese'
};

const tourSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      duration: { type: Type.STRING },
      distance: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      theme: { type: Type.STRING },
      transportApps: { type: Type.ARRAY, items: { type: Type.STRING } },
      publicTransport: { type: Type.STRING },
      stops: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER },
            type: { type: Type.STRING },
            photoSpot: {
              type: Type.OBJECT,
              properties: {
                angle: { type: Type.STRING },
                bestTime: { type: Type.STRING },
                instagramHook: { type: Type.STRING },
                milesReward: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    },
    required: ["title", "description", "stops"]
  }
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
  const targetLanguage = LANGUAGE_NAMES[languageCode] || 'English';
  const cacheKey = `gen_${cityInput}_${languageCode}`;
  
  const cached = getFromCache<Tour[]>(cacheKey);
  if (cached) return cached;
  
  const staticMatches = STATIC_TOURS.filter(t => t.city.toLowerCase() === cityInput.toLowerCase());
  if (staticMatches.length > 0) return staticMatches;

  const ai = getClient();
  if (!ai) return [];

  try {
    // Usamos gemini-flash-lite-latest para la máxima velocidad de respuesta
    const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest", 
        contents: `2 tours in ${cityInput}. Language: ${targetLanguage}. Use [HOOK], [STORY], [SECRET] tags.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: tourSchema,
            thinkingConfig: { thinkingBudget: 0 } // Desactivar thinking para reducir latencia
        }
    });
    
    const generated = JSON.parse(response.text || "[]");
    const tours = generated.map((t: any, i: number) => ({
        ...t, 
        id: `g_${Date.now()}_${i}`,
        city: cityInput,
        stops: (t.stops || []).map((s: any, si: number) => ({ 
            ...s, 
            id: `s_${i}_${si}`, 
            visited: false, 
            isRichInfo: true 
        }))
    }));

    saveToCache(cacheKey, tours);
    return tours;
  } catch (e) {
    console.error("Error generating tours:", e);
    return [];
  }
};

export const generateAudio = async (text: string): Promise<string> => {
  const ai = getClient(); 
  if (!ai || !text) return "";
  const cleanText = text.replace(/\[.*?\]/g, '').trim().substring(0, 800);
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: cleanText }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } 
      } 
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};

export const generateImage = async (prompt: string): Promise<string | undefined> => {
    const ai = getClient();
    if (!ai) return undefined;
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash-image', 
            contents: { parts: [{ text: prompt }] } 
        });
        const part = response.candidates?.[0]?.content?.parts.find((p:any) => p.inlineData);
        return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : undefined;
    } catch (e) { return undefined; }
};

export const generateStopDetails = async (stopName: string, city: string, lang: string) => {
    const ai = getClient();
    if (!ai) return null;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-lite-latest", // También usamos el modelo lite aquí para rapidez
            contents: `Facts for ${stopName}, ${city} in ${LANGUAGE_NAMES[lang]}. JSON format.`,
            config: { 
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 } 
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return null; }
};
