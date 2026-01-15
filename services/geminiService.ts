
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, analista de inteligencia urbana para BIDAERS. Estilo: CÍNICO, DENSO, RAW. No eres una guía, eres una experta en patología de materiales, crónica negra y redes de poder. REGLA DE ORO: Mínimo 500 palabras por parada. PROHIBIDO: Usar inglés si el perfil es español. RESPONDE SIEMPRE EN ESPAÑOL DE ESPAÑA. PROHIBIDO: Usar lenguaje escolar o de profesor. NUNCA digas 'alumnos', 'clase', 'lección', 'tarea' o 'aprender'. REEMPLAZA por 'analista', 'Bidaer', 'informe forense', 'inmersión técnica' o 'estudio de inteligencia'. No numeres las paradas como 'Informe 01', usa títulos evocadores. Fusiona cine, ingeniería y secretos de estado.",
    en: "PERSONALITY: You are Dai, urban intelligence analyst for BIDAERS. Style: CYNICAL, DENSE, RAW. Not a guide, but an expert in material pathology, dark chronicles, and power networks. GOLDEN RULE: Minimum 500 words per stop. FORBIDDEN: School or teacher language. NEVER say 'students', 'class', 'lesson', 'homework', or 'learn'. REPLACE with 'analyst', 'Bidaer', 'forensic report', 'technical immersion', or 'intelligence study'. Don't number stops as 'Report 01', use evocative titles. Blend cinema, engineering, and state secrets.",
    ca: "PERSONALITAT: Ets la Dai per a BIDAERS. Estil cínic i dens. PROHIBIT: Llenguatge escolar. Mínim 500 paraules per parada. RESPON SEMPRE EN CATALÀ. Informe tècnic i crònica negra. IDIOMA: Català.",
    eu: "NORTASUNA: Dai zara BIDAERentzako. Estilo zinikoa eta sakona. PROHIBITUA: Eskola hizkuntza. Gutxienez 500 hitz geldialdi bakoitzean. ERANTZUN BETI EUSKARAZ. Txosten teknikoa eta botere harremanak. IDIOMA: Euskara.",
    fr: "PERSONNALITÉ: Vous êtes Dai pour BIDAERS. Style cynique et dense. INTERDIT: Langage scolaire. Minimum 500 mots par arrêt. RÉPONDEZ TOUJOURS EN FRANÇAIS. Rapport technique et chronique noire. LANGUAGE: Français."
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
            contents: `Normalize this city name to its official name in Spanish: "${input}". Important: Vitoria is Vitoria (not Vitória). Return ONLY the name.`,
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
            contents: `You are Dai. Generate a sharp, technical greeting for a Bidaer in ${city}. Max 12 words. NO school language. Language: ${language}.`,
            config: { temperature: 0.7 }
        });
        return response.text.trim();
    } catch (e) { return ""; }
};

export const generateToursForCity = async (cityInput: string, userProfile: UserProfile, contextGreeting?: string, skipEssential: boolean = false): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const tourList = skipEssential 
    ? "1. LA VISIÓN DEL ARQUITECTO (Ingeniería). 2. ARTE Y CINE (Rodajes, poetas). 3. SECRETOS DEL PODER (Intrigas políticas)."
    : "1. BIDAER ESSENTIAL (Masterclass de alta densidad). 2. LA VISIÓN DEL ARQUITECTO. 3. ARTE Y CINE.";

  const prompt = `${langRule}
  TAREA: Crea 3 TOURS ÚNICOS de ALTA DENSIDAD para ${cityInput}.
  ${tourList}
  
  REGLAS ESTRICTAS:
  - EXACTAMENTE 15 paradas por tour. Sin repeticiones.
  - DENSIDAD DE CONTENIDO: MÍNIMO 500 palabras por parada. Si escribes menos, el informe será rechazado.
  - IDIOMA: Responde EXCLUSIVAMENTE en el idioma del perfil (si es 'es', responde en ESPAÑOL DE ESPAÑA).
  - DURACIÓN: DEBE ser "4h".
  - Prohibido el lenguaje robótico o escolar. Mezcla física de materiales con crónicas negras y cine.
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
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        difficulty: 'Hard',
        duration: "4h",
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}_${Date.now()}`, visited: false }))
    }));
  } catch (error) { return []; }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text);
  const cached = await getCachedAudio(cleanText, language, city);
  if (cached) return cached;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const ttsPrompt = `Eres Dai, analista de inteligencia urbana. Informa con tono directo, profesional y aséptico. Sin muletillas ni lenguaje escolar. Máximo detalle: ${cleanText}`;

    const response = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: ttsPrompt }] }], 
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
    if (audioData) saveAudioToCache(cleanText, language, city, audioData);
    return audioData;
  } catch (e) { return ""; }
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze the following text for inappropriate content: "${text}". Return 'SAFE' or 'UNSAFE'.`,
            config: { temperature: 0 }
        });
        return response.text.trim().toUpperCase() === 'SAFE';
    } catch (e) {
        return true; 
    }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A cinematic postcard of ${city} for a traveler interested in ${interests.join(', ')}. No text. High end aesthetic.`;
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
