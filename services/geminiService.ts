
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, guía local experta. Estilo fluido, profesional y cercano. IDIOMA: Español.",
    en: "PERSONALITY: You are Dai, an expert local guide. Narrative and professional style. LANGUAGE: English.",
    ca: "PERSONALITAT: Ets la Dai, guia local experta. Estil fluid i professional. IDIOMA: Català.",
    eu: "NORTASUNA: Dai zara, tokiko gida aditua. Estilo profesionala. HIZKUNTZA: Euskara.",
    fr: "PERSONNALITÉ: Vous êtes Dai, guide locale experte. Style fluide et technique. LANGUE: Français."
};

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').trim();
};

export const standardizeCityName = async (input: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Normalize this city name to its official full name: "${input}". Return ONLY the name.`,
            config: { temperature: 0 }
        });
        return response.text.trim();
    } catch (e) { return input; }
};

export const getGreetingContext = async (city: string, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const now = new Date();
    const hours = now.getHours();
    const timeOfDay = hours < 12 ? 'morning' : hours < 20 ? 'afternoon' : 'evening';
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are Dai, the travel expert. Generate a short welcoming greeting (max 15 words) for a tour in ${city}. Context: It's ${timeOfDay} and the traveler is starting now. Language: ${language}.`,
            config: { temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } }
        });
        return response.text.trim();
    } catch (e) { return ""; }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile, contextGreeting?: string): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `${langRule}
  CURRENT CONTEXT: ${contextGreeting || 'Starting the tour'}.
  CITY: ${cityInput}. 
  TASK: Create 3 THEMATIC TOURS (Essentials, Architecture & Engineering, and Local Life).
  - Each tour with 12 stops.
  - Each stop description must be a deep, technical essay (minimum 600 words).
  - Include the contextual greeting at the beginning of the first tour's description.
  - Return a JSON ARRAY with title, description, duration, distance, theme, and stops.`;

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
              type: { type: Type.STRING },
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
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            thinkingConfig: { thinkingBudget: 16000 }
        }
    });
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        difficulty: 'Moderate',
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
    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: `Read as a guide: ${cleanText}` }] }], 
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
      contents: `Is this message safe for a travel community? "${text}". Return ONLY "SAFE" or "UNSAFE".`,
    });
    return response.text.trim().toUpperCase() === 'SAFE';
  } catch (error) { return true; }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Artistic travel postcard of ${city} with these vibes: ${interests.join(', ')}.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "9:16" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) { return null; }
};
