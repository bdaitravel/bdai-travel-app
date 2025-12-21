
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { Tour, Stop } from '../types';
import { STATIC_TOURS } from '../data/toursData';
import { getCachedTours, saveToursToCache } from './supabaseClient';

// --- CONFIGURATION ---
const CACHE_PREFIX = 'bdai_cache_v72_'; 
const MAX_RETRIES = 3; 

const getClient = () => {
    if (!process.env.API_KEY) {
        console.error("API_KEY not found.");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const callAiWithRetry = async (apiCallFn: () => Promise<any>): Promise<any> => {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            return await apiCallFn();
        } catch (error: any) {
            attempt++;
            const isOverloaded = error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('deadline');
            if (isOverloaded && attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                continue;
            }
            throw error;
        }
    }
};

const getFromCache = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(CACHE_PREFIX + key);
        if (!item) return null;
        return JSON.parse(item).data as T;
    } catch (e) { return null; }
};

const saveToLocalCache = (key: string, data: any) => {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data }));
    } catch (e) { 
        console.warn("Cache save error:", e);
    }
};

const cleanJson = (text: string) => {
  if (!text) return "{}";
  try {
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBracket = cleaned.indexOf('[');
    const firstCurly = cleaned.indexOf('{');
    let start = -1;
    if (firstBracket !== -1 && (firstCurly === -1 || firstBracket < firstCurly)) {
        start = firstBracket;
    } else {
        start = firstCurly;
    }
    const lastBracket = cleaned.lastIndexOf(']');
    const lastCurly = cleaned.lastIndexOf('}');
    let end = Math.max(lastBracket, lastCurly) + 1;
    if (start === -1 || end === 0) return cleaned;
    return cleaned.substring(start, end);
  } catch (e) { 
    return text; 
  }
};

export const LANGUAGE_NAMES: {[key: string]: string} = {
    'es': 'Spanish (Español)', 
    'en': 'English', 
    'ca': 'Catalan (Català)', 
    'eu': 'Basque (Euskera)', 
    'fr': 'French (Français)'
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
  const targetLanguage = LANGUAGE_NAMES[languageCode] || 'Spanish';
  const cacheKey = `tours_gen_v72_${cityInput.toLowerCase()}_${languageCode}`;
  
  const globalCached = await getCachedTours(cityInput, languageCode);
  if (globalCached) {
      saveToLocalCache(cacheKey, globalCached);
      return globalCached;
  }

  const localCached = getFromCache<Tour[]>(cacheKey);
  if (localCached) return localCached;
  
  const staticMatches = STATIC_TOURS.filter(t => t.city.toLowerCase() === cityInput.toLowerCase());
  if (staticMatches.length > 0 && languageCode === 'es') return staticMatches;

  const ai = getClient();
  if (!ai) return [];

  const prompt = `
    SYSTEM INSTRUCTION: You are a native local guide in ${targetLanguage}. 
    STRICT LANGUAGE ENFORCEMENT: All keys and values in the JSON must be exclusively in ${targetLanguage}.
    DO NOT use English words like "Golden Hour", "Hook", or "Tip" inside the values. Translate them to ${targetLanguage}.

    TASK: Generate 2 expert "Free Tour" style walking routes for "${cityInput}".
    The routes should be high-quality, covering historical, cultural, and hidden spots.

    JSON STRUCTURE:
    [
      {
        "title": "Compelling Title in ${targetLanguage}",
        "description": "Cultural intro in ${targetLanguage}",
        "duration": "Duration in ${targetLanguage} (e.g. 3h)",
        "distance": "Distance (e.g. 5 km)",
        "difficulty": "Easy/Moderate/Hard in ${targetLanguage}",
        "theme": "Theme in ${targetLanguage}",
        "stops": [ 
          { 
            "name": "Stop Name (Translated if common)", 
            "description": "[HOOK]...\\n[STORY]...\\n[SECRET]...\\n[SMART_TIP]...", 
            "latitude": float, "longitude": float, 
            "type": "culture",
            "photoSpot": { 
              "angle": "Instructions in ${targetLanguage}", 
              "bestTime": "Time of day in ${targetLanguage}", 
              "instagramHook": "Captions/Hashtags in ${targetLanguage}", 
              "milesReward": 100 
            }
          } 
        ]
      }
    ]
  `;

  try {
    const response = await callAiWithRetry(() => 
        ai.models.generateContent({
            model: "gemini-3-pro-preview", 
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                maxOutputTokens: 15000,
                thinkingConfig: { thinkingBudget: 8000 }
            }
        })
    );
    const jsonText = cleanJson(response.text || "[]");
    const generatedTours = JSON.parse(jsonText);
    
    if (generatedTours.length === 0) return [];

    const processed = generatedTours.map((t: any, idx: number) => ({
        ...t, 
        id: `gen_${cityInput}_${idx}_${Date.now()}`,
        city: cityInput,
        stops: (t.stops || []).map((s: any, sIdx: number) => ({
            ...s,
            id: `s_${idx}_${sIdx}`,
            visited: false,
            imageUrl: `https://images.unsplash.com/photo-1543783232-260a990a1c0${sIdx+1}?auto=format&fit=crop&w=800&q=80`
        }))
    }));

    await saveToursToCache(cityInput, languageCode, processed);
    saveToLocalCache(cacheKey, processed);

    return processed;
  } catch (error) {
    console.error("AI Translation/Generation failed:", error);
    return [];
  }
};

export const generateAudio = async (text: string): Promise<string> => {
  const ai = getClient(); 
  if (!ai || !text) return "";
  const cleanText = text.replace(/\[.*?\]/g, '').trim().substring(0, 1500);
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: cleanText }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } 
      } 
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};
