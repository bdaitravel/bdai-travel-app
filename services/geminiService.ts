
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { Tour, Stop } from '../types';
import { STATIC_TOURS } from '../data/toursData';

// --- CONFIGURATION ---
const CACHE_PREFIX = 'bdai_cache_v58_'; 
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

// Added missing saveToCache utility function to fix "Cannot find name 'saveToCache'" errors.
const saveToCache = (key: string, data: any) => {
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
    console.error("Error cleaning JSON:", e);
    return text; 
  }
};

export const LANGUAGE_NAMES: {[key: string]: string} = {
    'es': 'Spanish', 'en': 'English', 'ca': 'Catalan', 'eu': 'Basque', 'fr': 'French',
    'de': 'German', 'ar': 'Arabic', 'pt': 'Portuguese', 'zh': 'Chinese (Simplified)', 'ja': 'Japanese'
};

export const translateTourObject = async (tour: Tour, targetLanguage: string): Promise<Tour> => {
    const ai = getClient();
    if (!ai) return tour;

    const cacheKey = `trans_tour_v58_${tour.id}_${targetLanguage}`;
    const cached = getFromCache<Tour>(cacheKey);
    if (cached) return cached;

    const prompt = `
        TASK: Translate this comprehensive Travel Tour to ${targetLanguage}.
        
        IMPORTANT: This is high-quality literary content. Do NOT summarize. Translate EVERY paragraph and sentence of the descriptions.
        
        RULES:
        1. Keep EXACT JSON structure.
        2. Translate: title, description, safetyTip, wifiTip, publicTransport and ALL fields in 'stops' array (including photoSpot details).
        3. Maintain [HOOK], [STORY], [SECRET], [SMART_TIP] tags.
        4. Do NOT truncate. Ensure the output JSON is complete.
        5. Return ONLY the valid JSON.

        DATA TO TRANSLATE:
        ${JSON.stringify(tour)}
    `;

    try {
        const response = await callAiWithRetry(() => 
            ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    maxOutputTokens: 12000,
                    // Added thinkingConfig.thinkingBudget when maxOutputTokens is set, as per coding guidelines.
                    thinkingConfig: { thinkingBudget: 4000 }
                }
            })
        );
        const jsonText = cleanJson(response.text || "");
        const translated = JSON.parse(jsonText);
        saveToCache(cacheKey, translated);
        return { ...tour, ...translated };
    } catch (e) {
        console.error("Translation error", e);
        return tour;
    }
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
  const targetLanguage = LANGUAGE_NAMES[languageCode] || languageCode;
  const cacheKey = `tours_gen_v58_${cityInput}_${languageCode}`;
  
  const cachedData = getFromCache<Tour[]>(cacheKey);
  if (cachedData) return cachedData;
  
  const staticMatches = STATIC_TOURS.filter(t => t.city.toLowerCase() === cityInput.toLowerCase());
  if (staticMatches.length > 0) {
      if (languageCode !== 'es') {
          const translated = await Promise.all(staticMatches.map(t => translateTourObject(t, targetLanguage)));
          saveToCache(cacheKey, translated);
          return translated;
      }
      return staticMatches;
  }

  const ai = getClient();
  if (!ai) return [];

  const prompt = `
    ROLE: World-Class Travel Journalist and Local Expert for "${cityInput}".
    TASK: Generate 2 extremely detailed thematic tours in ${targetLanguage}.
    
    TOUR 1: "The Absolute Essentials & History" (Deep dive into the heart of the city).
    TOUR 2: "Hidden Gems & Secret Spots" (Off-the-beaten-path locations).

    TRANSPORTATION INFO (LOCALIZED):
    - For this city, identify the available ride-sharing apps (Uber, Cabify, Bolt, etc.).
    - Provide a brief overview of the public transport (Metro, Bus, Tram) in ${targetLanguage}.

    STOP REQUIREMENTS (EXTREMELY IMPORTANT):
    - Exactly 10 stops per tour.
    - Description for EACH stop must be at least 150-200 words long.
    - Use the format:
      [HOOK]: A cinematic opening line.
      [STORY]: Deep historical/cultural context.
      [SECRET]: Unknown fact.
      [SMART_TIP]: Professional advice.
    - Include a "photoSpot" object for EACH stop.

    FORMAT (JSON ARRAY):
    [
      {
        "title": "Compelling Title",
        "description": "Rich introduction.",
        "duration": "4h",
        "distance": "6 km",
        "difficulty": "Moderate",
        "theme": "History",
        "transportApps": ["Uber", "Cabify", "Local App"],
        "publicTransport": "Brief localized description of Metro/Bus in ${targetLanguage}.",
        "stops": [ 
          { 
            "name": "Stop Name", 
            "description": "[HOOK]...\\n[STORY]...\\n[SECRET]...\\n[SMART_TIP]...", 
            "latitude": 0.0, "longitude": 0.0, 
            "type": "culture",
            "photoSpot": { "angle": "...", "bestTime": "...", "instagramHook": "...", "milesReward": 100 }
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
                thinkingConfig: { thinkingBudget: 10000 }
            }
        })
    );
    const jsonText = cleanJson(response.text || "[]");
    const generatedTours = JSON.parse(jsonText);
    
    const processed = generatedTours.map((t: any, idx: number) => ({
        ...t, 
        id: `gen_${cityInput}_${idx}_${Date.now()}`,
        city: cityInput,
        stops: (t.stops || []).map((s: any, sIdx: number) => ({
            ...s,
            id: `s_${idx}_${sIdx}`,
            visited: false,
            isRichInfo: true 
        }))
    }));
    saveToCache(cacheKey, processed);
    return processed;
  } catch (error) {
    return [];
  }
};

export const generateStopDetails = async (stopName: string, city: string, languageCode: string) => {
    const ai = getClient();
    if (!ai) return null;
    const targetLanguage = LANGUAGE_NAMES[languageCode] || languageCode;
    const prompt = `
        TASK: Write a 300-word deep dive article about "${stopName}" in ${city}.
        LANGUAGE: ${targetLanguage}.
        USE TAGS: [HOOK], [STORY], [SECRET], [SMART_TIP].
        RETURN JSON: { "description": "...", "curiosity": "...", "photoSpot": { "angle": "...", "bestTime": "...", "instagramHook": "...", "milesReward": 100 } }
    `;
    try {
        const response = await callAiWithRetry(() => 
            ai.models.generateContent({
                model: "gemini-3-pro-preview", 
                contents: prompt,
                config: { responseMimeType: "application/json" }
            })
        );
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return null; }
};

export const generateImage = async (prompt: string): Promise<string | undefined> => {
    const ai = getClient();
    if (!ai) return undefined;
    try {
        const response = await callAiWithRetry(() => 
            ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] } })
        );
        const part = response.candidates?.[0]?.content?.parts.find((p:any) => p.inlineData);
        return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : undefined;
    } catch (e) { return undefined; }
};

export const generateAudio = async (text: string): Promise<string> => {
  const ai = getClient(); 
  if (!ai || !text) return "";
  const cleanText = text.replace(/\[.*?\]/g, '').trim().substring(0, 2000);
  try {
    const response: GenerateContentResponse = await callAiWithRetry(() => 
        ai.models.generateContent({ 
          model: "gemini-2.5-flash-preview-tts", 
          contents: [{ parts: [{ text: cleanText }] }], 
          config: { 
            responseModalities: [Modality.AUDIO], 
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } 
          } 
        })
    );
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};
