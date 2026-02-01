
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Tu misión es generar TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, hiper-detallista, experto en ingeniería, arquitectura y salseo histórico real.
DENSIDAD OBLIGATORIA: Cada parada DEBE tener entre 350 y 450 palabras de descripción técnica y narrativa. NO RESUMAS.
ESTRUCTURA: Mínimo 10 paradas por cada tour. Es una orden directa.
FOCO: 1. Ingeniería y Retos Técnicos. 2. Historia Oculta/Conspiraciones. 3. Salseo Humano Real.
REGLA: Usa tipos: 'historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'.
`;

async function handleAiCall<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (e: any) {
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return handleAiCall(fn, retries - 1, delay * 2);
        }
        throw e;
    }
}

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const targetLang = LANGUAGES.find(l => l.code === user.language)?.name || "Spanish";
    
    const systemInstruction = `${MASTERCLASS_INSTRUCTION}
    [STRICT LANGUAGE PROTOCOL]
    - TARGET LANGUAGE: ${targetLang.toUpperCase()}
    - ABSOLUTE RULE: All output MUST be in ${targetLang}. 
    - No exceptions. Output must be valid JSON according to schema.`;

    const tourSchema = {
      type: Type.ARRAY,
      minItems: 3,
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
            minItems: 10,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING, description: "Detailed description between 350 and 450 words." },
                latitude: { type: Type.NUMBER },
                longitude: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ['historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'] }
              },
              required: ["name", "description", "latitude", "longitude", "type"]
            }
          }
        },
        required: ["title", "description", "duration", "distance", "difficulty", "theme", "stops"]
      }
    };
    
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Generate exactly 3 unique and dense tours for ${city}, ${country} in ${targetLang}. Each tour must have exactly 10 stops. Each stop must have a description of 350-450 words minimum. Be technical and detailed.`,
            config: { 
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: tourSchema as any
            }
        });
        
        let jsonStr = (response.text || "[]").trim();
        if (jsonStr.includes('```')) jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        const tours = JSON.parse(jsonStr);
        return tours.map((t: any, i: number) => ({
            ...t,
            id: `tour_${Date.now()}_${i}`,
            city,
            stops: (t.stops || []).map((s: any, j: number) => ({
                ...s,
                id: `stop_${Date.now()}_${i}_${j}`,
                visited: false,
                type: s.type || 'historical'
            }))
        }));
    });
};

export const standardizeCityName = async (input: string): Promise<{name: string, spanishName: string, country: string}[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Identify the global city and country for the input: "${input}". Provide the result in the schema provided.`,
            config: { 
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
    });
};

export const generateAudio = async (text: string, language: string): Promise<string | null> => {
    const cacheKey = `audio_${language}_${text.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}`;
    const cached = await getCachedAudio(cacheKey);
    if (cached) return cached;

    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Read this text clearly in ${language}: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        if (base64) await saveAudioToCache(cacheKey, base64);
        return base64;
    });
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Is the following travel tip safe and appropriate? Answer ONLY 'SAFE' or 'UNSAFE': "${text}"`,
            config: { systemInstruction: "You are a content moderator for a travel app." }
        });
        return response.text?.trim().toUpperCase() === "SAFE";
    });
};

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following tours to ${targetLang}, maintaining the exact JSON structure and the density of information: ${JSON.stringify(tours)}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "[]");
    });
};

export const generateSmartCaption = async (base64: string, stop: Stop, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } }, { text: `Generate a poetic and technical caption in ${language} for a photo taken at ${stop.name}. Include a detail about ${stop.type}.` }] }
    });
    return response.text || "Moment captured.";
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A futuristic and artistic postcard of ${city}, focus on ${interests.join(', ')}. Cinematic lighting, 8k resolution, travel style.` }] },
        config: { imageConfig: { aspectRatio: "9:16" } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};
