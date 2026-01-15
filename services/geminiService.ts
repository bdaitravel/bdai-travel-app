
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, analista de inteligencia urbana para BIDAERS. Estilo: CÍNICO, DENSO, RAW. No eres una guía turística, eres una experta en patología de materiales y redes de poder. REGLA DE ORO LINGÜÍSTICA: RESPONDE EXCLUSIVAMENTE EN ESPAÑOL DE ESPAÑA (CASTELLANO). Usa el tuteo ('tú', 'detente', 'observa'). REGLA DE ORO DE DENSIDAD: MÍNIMO 800 PALABRAS POR PARADA. Debes ser técnica y forense. PROHIBIDO: Usar lenguaje escolar. NUNCA digas 'alumnos', 'clase' o 'aprender'. REEMPLAZA por 'analista', 'Bidaer', 'informe forense'.",
    en: "PERSONALITY: You are Dai, analyst for BIDAERS. Style: CYNICAL, DENSE, RAW. MINIMUM 800 WORDS PER STOP. FORBIDDEN: School or teacher language.",
    ca: "PERSONALITAT: Ets la Dai per a BIDAERS. Estil cínic i dens. MÍNIM 800 PARAULES PER PARADA. RESPON SEMPRE EN CATALÀ.",
    eu: "NORTASUNA: Dai zara BIDAERentzako. Estilo zinikoa eta sakona. GUTXIENEZ 800 HITZ GELDIALDI BAKOITZEAN. ERANTZUN BETI EUSKARAZ.",
    fr: "PERSONNALITÉ: Vous êtes Dai pour BIDAERS. Style cynique et dense. MINIMUM 800 MOTS PAR ARRÊT. RÉPONDEZ TOUJOURS EN FRANÇAIS."
};

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').trim();
};

const generateHash = (str: string) => {
  let hash = 0;
  // Usamos 500 caracteres para garantizar que cada parada tenga un audio único y no choque con otros
  const slice = str.substring(0, 500);
  for (let i = 0; i < slice.length; i++) {
    const char = slice.charCodeAt(i);
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
        return response.text.trim();
    } catch (e) { return input; }
};

export const getGreetingContext = async (city: string, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are Dai. Technical greeting for a Bidaer in ${city}. Max 12 words. Language: ${language}.`,
            config: { temperature: 0.7 }
        });
        return response.text.trim();
    } catch (e) { return ""; }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile, contextGreeting?: string, skipEssential: boolean = false): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `${langRule}
  MISIÓN: Crea 3 TOURS ÚNICOS para ${cityInput}.
  REGLAS:
  - IDIOMA: Si el perfil es 'es', RESPONDE 100% EN CASTELLANO DE ESPAÑA.
  - CANTIDAD: EXACTAMENTE 10 paradas por tour.
  - DENSIDAD: MÍNIMO 800 PALABRAS POR PARADA. No resumas.
  - Devuelve un JSON ARRAY.`;

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
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            maxOutputTokens: 15000
        }
    });
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        difficulty: 'Hard',
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}_${Date.now()}`, visited: false }))
    }));
  } catch (error) { return []; }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text);
  const textHash = generateHash(cleanText);
  // CACHE V12: Purga de errores de colisión. Ahora usamos la columna ID en Supabase.
  const cacheKey = `v12_${language}_${textHash}`;
  const cached = await getCachedAudio(cacheKey, language, city);
  if (cached) return cached;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Instrucción de sistema blindada: FORZAR ACENTO ESPAÑA Y TUTEO
    const systemInstruction = `ERES DAI, ANALISTA FORENSE DE BIDAER. ESTÁS EN ${city.toUpperCase()}.
    REGLA CRÍTICA: LEE EXCLUSIVAMENTE EL TEXTO PROPORCIONADO. 
    PROHIBIDO: ACENTO LATINOAMERICANO O NEUTRO.
    ACENTO OBLIGATORIO: CASTELLANO DE ESPAÑA (MADRILEÑO). 
    TONO: CÍNICO Y PROFESIONAL. 
    LENGUAJE: TUTEO (USA 'TÚ', 'DETENTE', 'OBSERVA').
    VOZ: KORE CON CONFIGURACIÓN DE ESPAÑA.`;

    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: cleanText }] }], 
      config: { 
        systemInstruction: systemInstruction,
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
            voiceConfig: { 
                prebuiltVoiceConfig: { voiceName: 'Kore' } 
            } 
        } 
      }
    });
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (audioData) saveAudioToCache(cacheKey, language, city, audioData);
    return audioData;
  } catch (e) { return ""; }
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze: "${text}". Return JSON {isSafe: boolean}.`,
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
    } catch (e) { return true; }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Cinematic travel postcard of ${city}. High quality, 9:16. No text.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
    } catch (e) { return null; }
};
