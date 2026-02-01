
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

const MASTERCLASS_INSTRUCTION = `
Eres Dai, el motor analítico de BDAI. Tu misión es generar TOURS de "Alta Densidad Informativa".
ESTILO: Cínico, brillante, hiper-detallista, experto en ingeniería, arquitectura y salseo histórico real.
DENSIDAD OBLIGATORIA: Cada parada DEBE tener entre 350 y 450 palabras de descripción técnica y narrativa. NO RESUMAS.
ESTRUCTURA: Mínimo 10 paradas por cada tour. Es una orden directa.
META: Obligatorio incluir título creativo, duración aproximada y distancia total.
REGLA: Usa tipos: 'historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'.
`;

async function handleAiCall<T>(fn: () => Promise<T>, retries = 4, delay = 2000): Promise<T> {
    try {
        return await fn();
    } catch (e: any) {
        const errorMsg = e?.message || "";
        const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota");
        
        if (retries > 0) {
            const waitTime = isQuotaError ? delay * 3 : delay;
            console.warn(`Gemini API Error. Retrying in ${waitTime}ms...`, e);
            await new Promise(res => setTimeout(res, waitTime));
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
    - Output must be a valid JSON array of tour objects.`;

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
                description: { type: Type.STRING },
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
            contents: `Generate exactly 3 unique and dense tours for ${city}, ${country} in ${targetLang}. Metadata is MANDATORY.`,
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
            id: t.id || `tour_${Date.now()}_${i}`,
            city,
            title: t.title || `Masterclass: ${city} Expuesta`,
            duration: t.duration || "3h 30m",
            distance: t.distance || "4.5 km",
            stops: (t.stops || []).map((s: any, j: number) => ({
                ...s,
                id: s.id || `stop_${Date.now()}_${i}_${j}`,
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
            contents: `Identify up to 5 prominent cities worldwide that match or are similar to: "${input}".`,
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

export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const lightTours = tours.map(t => ({
            title: t.title,
            description: t.description,
            duration: t.duration,
            distance: t.distance,
            theme: t.theme,
            stops: t.stops.map(s => ({ name: s.name, description: s.description, type: s.type }))
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following travel data into ${targetLang}. Keep structure. Data: ${JSON.stringify(lightTours)}`,
            config: { responseMimeType: "application/json" }
        });

        const translated = JSON.parse(response.text || "[]");
        
        return translated.map((t: any, i: number) => {
            const original = tours[i];
            return {
                ...original,
                title: t.title || original.title,
                description: t.description || original.description,
                duration: t.duration || original.duration,
                distance: t.distance || original.distance,
                theme: t.theme || original.theme,
                stops: t.stops.map((s: any, j: number) => ({
                    ...original.stops[j],
                    name: s.name || original.stops[j].name,
                    description: s.description || original.stops[j].description,
                    type: s.type || original.stops[j].type
                }))
            };
        });
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
            contents: [{ parts: [{ text: `Read this clearly in ${language}: ${text}` }] }],
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

export const generateSmartCaption = async (base64: string, stop: Stop, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ inlineData: { data: base64.split(',')[1], mimeType: 'image/jpeg' } }, { text: `Technical caption in ${language} for ${stop.name}.` }] }
    });
    return response.text || "Moment captured.";
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Artistic postcard of ${city}.` }] },
        config: { imageConfig: { aspectRatio: "9:16" } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part ? `data:image/png;base64,${part.inlineData.data}` : null;
};

export const moderateContent = async (text: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze if safe: "${text}"`,
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
        return !!result.isSafe;
    });
};
