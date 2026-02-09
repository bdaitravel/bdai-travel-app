
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';

const GEO_BRUTAL_INSTRUCTION = `
Eres Dai, el motor de precisión de BDAI. 
ERES UN INGENIERO GEOESPACIAL. 
REGLAS INVIOLABLES:
1. ANTES de escribir el JSON, DEBES buscar cada monumento en Google Search.
2. EXTRAE las coordenadas GPS (Lat/Lng) REALES de Google Maps. 
3. SI LAS COORDENADAS SON 0,0 O ESTÁN EN EL MAR, EL TOUR SERÁ RECHAZADO Y SERÁS REINICIADO.
4. Escribe para cada parada 4 párrafos de alta densidad informativa (historia, ingeniería, secretos).
5. TODO el texto debe estar en el idioma solicitado por el usuario. Traduce hasta los nombres de las plazas.
`;

const TOUR_SCHEMA = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            city: { type: Type.STRING },
            country: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            duration: { type: Type.STRING },
            distance: { type: Type.STRING },
            stops: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['historical', 'food', 'art', 'nature', 'photo', 'culture', 'architecture'] },
                        latitude: { type: Type.NUMBER },
                        longitude: { type: Type.NUMBER },
                        photoSpot: {
                            type: Type.OBJECT,
                            properties: {
                                angle: { type: Type.STRING },
                                secretLocation: { type: Type.STRING }
                            }
                        }
                    },
                    required: ["name", "description", "latitude", "longitude"]
                }
            }
        },
        required: ["id", "title", "description", "stops"]
    }
};

export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    const targetLang = LANGUAGES.find(l => l.code === user.language)?.name || "Spanish";
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Analiza ${city}, ${country} y genera 3 tours magistrales en idioma ${targetLang}. BUSCA COORDENADAS REALES EN GOOGLE MAPS.`,
        config: { 
            systemInstruction: GEO_BRUTAL_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: TOUR_SCHEMA,
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 8000 }
        }
    });
    return JSON.parse(response.text || "[]");
};

export const translateToursBatch = async (tours: Tour[], targetLangCode: string): Promise<Tour[]> => {
    const langName = LANGUAGES.find(l => l.code === targetLangCode)?.name || targetLangCode;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Traduce este JSON íntegramente al ${langName}, incluyendo nombres de lugares: ${JSON.stringify(tours)}`,
        config: { responseMimeType: "application/json", responseSchema: TOUR_SCHEMA }
    });
    return JSON.parse(response.text || "[]");
};

export const standardizeCityName = async (input: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Normaliza ciudad/país para: ${input}. JSON: [{name, spanishName, country}]`,
        config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] }
    });
    return JSON.parse(response.text || "[]");
};

export const generateAudio = async (text: string, language: string, city: string = ""): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
};

// Implemented moderateContent using gemini-3-flash-preview for safety checks
export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze the following travel tip for toxicity or inappropriate content. Return exactly 'SAFE' or 'TOXIC'. Text: ${text}`,
        });
        return response.text?.trim().toUpperCase() === 'SAFE';
    } catch (e) {
        return true; // Fallback to safe if API call fails
    }
};

// Implemented generateCityPostcard using gemini-2.5-flash-image for visual content
export const generateCityPostcard = async (city: string, interests: any): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const interestsText = Array.isArray(interests) ? interests.join(", ") : 'travel and culture';
    const prompt = `Create a high-quality, artistic travel postcard for ${city} showcasing landmarks. Style: Cinematic photography. Context: ${interestsText}. No text on the image.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: "9:16" }
            }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.error("Postcard generation failed:", e);
    }
    return null;
};
