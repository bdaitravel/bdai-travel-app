
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, analista senior de BDAI. ESTILO: CÍNICO, NARRATIVO, HIPER-DETALLISTA. ENFOQUE: Historia profunda, salseo histórico (chismes de época), leyendas urbanas y secretos culturales. REGLA CRÍTICA: Cada descripción de parada DEBE ser extensa y profunda, superando las 400 palabras. EVITA términos de ingeniería o arquitectura técnica aburrida; busca el drama humano, los secretos y el misterio. RESPONDE EXCLUSIVAMENTE EN ESPAÑOL DE ESPAÑA.",
    en: "PERSONALITY: You are Dai, senior analyst for BDAI. STYLE: CYNICAL, NARRATIVE, HYPER-DETAILED. FOCUS: Deep history, historical gossip, urban legends, and cultural secrets. CRITICAL RULE: Each stop description MUST exceed 400 words. AVOID boring engineering or technical terms; focus on drama and mystery. RESPOND EXCLUSIVELY IN ENGLISH.",
    ca: "PERSONALITAT: Ets la Dai, analista sènior de BDAI. ESTIL: Cínic i narratiu. ENFOCAMENT: Història profunda, llegendes i secrets culturals. REGLA: Cada descripció ha de superar les 400 paraules. RESPON EXCLUSIVAMENT EN CATALÀ.",
    eu: "NORTASUNA: Dai zara, BDAI-ko analista seniorra. ESTILOA: Zinikoa eta narratiboa. ENFOKEA: Historia sakona, kondairak eta sekretu kulturalak. ARAUA: Deskribapen bakoitzak 400 hitz baino gehiago izan behar ditu. ERANTZUN BAKARRIK EUSKARAZ.",
    fr: "PERSONNALITÉ: Vous êtes Dai, analyste senior de BDAI. STYLE: Cynique et narratif. FOCUS: Histoire profonde, légendes et secrets culturels. RÈGLE: Chaque description doit dépasser 400 mots. RÉPONDEZ EXCLUSIVEMENT EN FRANÇAIS."
};

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').replace(/\*/g, '').trim();
};

const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const standardizeCityName = async (input: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Normalize this city name to its official name in Spanish: "${input}". Return ONLY the name.`,
            config: { temperature: 0 }
        });
        return response.text?.trim() || input;
    } catch (e) { return input; }
};

export const getGreetingContext = async (city: string, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are Dai. Technical but stylish greeting for a Bidaer in ${city}. Max 12 words. Respond ONLY in: ${language}.`,
            config: { temperature: 0.7 }
        });
        return response.text?.trim() || "";
    } catch (e) { return ""; }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile, contextGreeting?: string, skipEssential: boolean = false): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const interestsStr = userProfile.interests.length > 0 ? userProfile.interests.join(", ") : "historia y cultura";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Genera 3 TOURS para ${cityInput}. Intereses del usuario: [${interestsStr}]. 
  
  REGLAS OBLIGATORIAS:
  1. PARADAS: Cada tour DEBE tener MÍNIMO 10 paradas (entre 10 y 12). No acepto menos.
  2. TÍTULOS: No uses NUNCA las palabras 'Ruta' o 'Protocolo'. Crea nombres sugerentes sobre el alma de la ciudad.
  3. CONTENIDO: Cada parada es una MASTERCLASS de más de 450 palabras de texto puro.
  4. TEMÁTICA: Olvida la ingeniería y materiales. Céntrate en: Historia real, leyendas locales, anécdotas de personajes históricos, salseo de época y curiosidades culturales. 
  5. ESTILO: Eres Dai, cínica, analítica y apasionada por los secretos históricos.`;

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
        isEssential: { type: Type.BOOLEAN },
        stops: {
          type: Type.ARRAY,
          minItems: 10,
          maxItems: 12,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["historical", "food", "art", "nature", "photo", "culture", "architecture"] },
              photoSpot: {
                type: Type.OBJECT,
                properties: { angle: { type: Type.STRING }, milesReward: { type: Type.NUMBER }, secretLocation: { type: Type.STRING } },
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
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: { 
            systemInstruction: langRule,
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            maxOutputTokens: 60000,
            thinkingConfig: { thinkingBudget: 20000 },
            temperature: 0.8
        }
    });
    
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput, difficulty: 'Moderate',
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}_${Date.now()}`, visited: false }))
    }));
  } catch (error) { 
    console.error("Gemini Tour Generation Error:", error);
    return []; 
  }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text).substring(0, 4000);
  const textHash = generateHash(cleanText);
  const cacheKey = `audio_${language}_${textHash}`;

  const cached = await getCachedAudio(cacheKey);
  if (cached) return cached;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const voicePrompt = language === 'es' 
        ? `Actúa como Dai. Voz madura, culta y con un toque cínico. Lee este relato histórico con ritmo: ${cleanText}`
        : cleanText;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: voicePrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (audioData) await saveAudioToCache(cacheKey, audioData);
    return audioData;
  } catch (e) { return ""; }
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze for safety. Respond ONLY "SAFE" or "UNSAFE". Text: "${text}"`,
            config: { temperature: 0 }
        });
        return response.text?.trim().toUpperCase().includes('SAFE') ?? true;
    } catch (e) { return true; }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Artistic and evocative postcard of ${city}. Focus on its history and soul. Interests: ${interests.join(', ')}. Cinema style, 9:16 vertical.`;
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
    } catch (e) { return null; }
};
