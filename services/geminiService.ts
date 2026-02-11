
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
            Each stop needs accurate coordinates, description in ${user.language}, and photoSpot info.`,
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
            contents: `Translate the following tours into the language code: ${targetLanguage}.
            Maintain the exact JSON structure. Translate titles, descriptions, stop names, and photo hints.
            TOURS: ${JSON.stringify(tours)}`,
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
        return JSON.parse(response.text || "[]");
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
 * Moderate user generated content for safety
 */
export const moderateContent = async (content: string): Promise<boolean> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze if the following text is safe, appropriate for a travel app, and non-toxic. 
            Text: "${content}"
            Return ONLY a boolean true if it is safe, false otherwise.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.BOOLEAN
                }
            }
        });
        return JSON.parse(response.text || "false");
    });
};

/**
 * Generate a personalized city postcard image
 */
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    return handleAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: `A beautiful artistic postcard of ${city}. 
                        Style: Hand-painted watercolor mixed with digital minimalism.
                        Include elements related to: ${interests.join(", ")}.
                        No text on the image. Wide angle, high detail.`,
                    },
                ],
            },
            config: {
                imageConfig: {
                    aspectRatio: "9:16",
                },
            },
        });

        // Iterate through parts to find the image part
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    });
};
