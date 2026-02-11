
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile, LANGUAGES } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';

/**
 * Helper to handle AI API calls with centralized error handling
 */
const handleAiCall = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw error;
    }
};

/**
 * Standardize city name using search grounding
 */
export const standardizeCityName = async (input: string) => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Find ALL cities in the world that match the name or search query: "${input}". 
            IMPORTANT: The input might be in Hindi, Chinese, Arabic or other scripts. Handle Unicode correctly.
            Include their original name, Spanish translation, and the Country they belong to.
            Example: If searching "Santiago", return Santiago (Chile), Santiago de Compostela (Spain), etc.`,
            config: { 
                tools: [{ googleSearch: {} }], 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "English name" },
                            spanishName: { type: Type.STRING, description: "Spanish name" },
                            country: { type: Type.STRING, description: "Country name" }
                        },
                        required: ["name", "spanishName", "country"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

/**
 * Generate 3 diverse walking tours for a specific city
 */
export const generateToursForCity = async (city: string, country: string, user: UserProfile): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Generate 3 diverse and interesting walking tours for ${city}, ${country}.
            User language: ${user.language}. User Rank: ${user.rank}.
            One tour MUST be 'Essential' (id starts with 'ess_').
            Return the response in JSON format following the Tour interface structure.
            Include 5-10 stops for the essential tour, 4-6 for others.
            Each stop needs accurate coordinates, description in ${user.language}, and photoSpot info (angle, secretLocation).`,
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
                            duration: { type: Type.STRING },
                            distance: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                            theme: { type: Type.STRING },
                            isEssential: { type: Type.BOOLEAN },
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
                                        type: { type: Type.STRING },
                                        visited: { type: Type.BOOLEAN },
                                        photoSpot: {
                                            type: Type.OBJECT,
                                            properties: {
                                                angle: { type: Type.STRING },
                                                milesReward: { type: Type.NUMBER },
                                                secretLocation: { type: Type.STRING }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        required: ["id", "city", "title", "description", "stops"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    });
};

/**
 * Translate a batch of tours to a target language
 */
export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following travel tours data into the language code: ${targetLanguage}.
            IMPORTANT: YOU MUST TRANSLATE ALL TEXT CONTENT including:
            - titles
            - descriptions
            - themes
            - stop names
            - stop descriptions
            - photoSpot.angle (Dai Tip Angle)
            - photoSpot.secretLocation (Dai Tip Detail)
            
            Keep the exact same JSON structure. Do not change IDs or numeric coordinates.
            DATA TO TRANSLATE: ${JSON.stringify(tours)}`,
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
                            duration: { type: Type.STRING },
                            distance: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                            theme: { type: Type.STRING },
                            isEssential: { type: Type.BOOLEAN },
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
                                        type: { type: Type.STRING },
                                        visited: { type: Type.BOOLEAN },
                                        photoSpot: {
                                            type: Type.OBJECT,
                                            properties: {
                                                angle: { type: Type.STRING },
                                                milesReward: { type: Type.NUMBER },
                                                secretLocation: { type: Type.STRING }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const result = JSON.parse(response.text || "[]");
        return result.length > 0 ? result : tours; // Fallback to original if translation fails
    });
};

/**
 * Generate audio (TTS) for a given text
 */
export const generateAudio = async (text: string, language: string, city: string): Promise<string> => {
    // Check cache first
    const cached = await getCachedAudio(text, language);
    if (cached) return cached;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say in ${language}: ${text}` }] }],
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
        // Cache the generated audio for future use
        await saveAudioToCache(text, language, base64, city);
        return base64;
    }
    return "";
};

/**
 * Moderate content for a community board to ensure it is appropriate
 */
export const moderateContent = async (text: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze the following text for offensive, inappropriate, or toxic content. 
            Reply only with "SAFE" if it is acceptable for a family-friendly travel community, and "UNSAFE" otherwise.
            Text: "${text}"`,
        });
        const result = response.text?.trim().toUpperCase();
        return result === "SAFE";
    });
};

/**
 * Generate an AI postcard image for a specific city and user interests
 */
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `A stunning digital painting of ${city} for a travel postcard. The design should subtly incorporate elements of ${interests.join(", ")}. Artistic, high-quality, vibrant colors, NO TEXT on the image.`;
        
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

        // Find the image part in the response
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    });
};
