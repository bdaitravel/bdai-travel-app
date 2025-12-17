

import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { Tour, Stop, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

// --- CONFIGURATION ---
const CACHE_PREFIX = 'bdai_cache_v45_'; 
const MAX_RETRIES = 3; 

// Initializing GoogleGenAI client by strictly using process.env.API_KEY per guidelines
const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

const callAiWithRetry = async (apiCallFn: () => Promise<any>): Promise<any> => {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            return await apiCallFn();
        } catch (error: any) {
            attempt++;
            console.warn(`AI Call failed (Attempt ${attempt}/${MAX_RETRIES}):`, error);
            const isOverloaded = error.message?.includes('429') || error.message?.includes('503') || error.status === 429 || error.status === 503;
            if (isOverloaded && attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000; 
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
};

// --- CACHING UTILS ---
const MEDIA_DB = 'bdai_media_cache';
const MEDIA_STORE = 'files';

const getMediaCache = async (key: string): Promise<string | undefined> => {
    if (typeof indexedDB === 'undefined') return undefined;
    return new Promise((resolve) => {
        const req = indexedDB.open(MEDIA_DB, 1);
        req.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE);
        };
        req.onsuccess = (e: any) => {
            const db = e.target.result;
            const tx = db.transaction(MEDIA_STORE, 'readonly');
            const get = tx.objectStore(MEDIA_STORE).get(key);
            get.onsuccess = () => resolve(get.result);
            get.onerror = () => resolve(undefined);
        };
        req.onerror = () => resolve(undefined);
    });
};

const setMediaCache = async (key: string, data: string) => {
    if (typeof indexedDB === 'undefined') return;
    const req = indexedDB.open(MEDIA_DB, 1);
    req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE);
    };
    req.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        tx.objectStore(MEDIA_STORE).put(data, key);
    };
};

const getFromCache = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(CACHE_PREFIX + key);
        if (!item) return null;
        return JSON.parse(item).data as T;
    } catch (e) { return null; }
};

const saveToCache = (key: string, data: any) => {
    try {
        try {
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ timestamp: Date.now(), data }));
        } catch (e) {
            console.warn("Cache full, clearing old entries...");
            localStorage.clear(); 
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ timestamp: Date.now(), data }));
        }
    } catch (e) { console.warn("Storage Error"); }
};

const cleanJson = (text: string) => {
  try {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBracket = cleaned.indexOf('[');
    const firstCurly = cleaned.indexOf('{');
    let start = 0;
    let end = cleaned.length;
    if (firstBracket !== -1 && (firstCurly === -1 || firstBracket < firstCurly)) {
        start = firstBracket;
        end = cleaned.lastIndexOf(']') + 1;
    } else if (firstCurly !== -1) {
        start = firstCurly;
        end = cleaned.lastIndexOf('}') + 1;
    }
    return cleaned.substring(start, end);
  } catch (e) { return "[]"; }
};

const CITY_MAPPINGS: {[key: string]: string} = {
    'madrid': 'Madrid', 'barcelona': 'Barcelona', 'valencia': 'Valencia', 'sevilla': 'Seville',
    'bilbao': 'Bilbao', 'san sebastian': 'San Sebastian', 'donostia': 'San Sebastian', 'santiago': 'Santiago de Compostela',
    'londres': 'London', 'paris': 'Paris', 'lisboa': 'Lisbon', 'porto': 'Porto', 'oporto': 'Porto',
    'roma': 'Rome', 'berlin': 'Berlin', 'amsterdam': 'Amsterdam',
    'nueva york': 'New York', 'nyc': 'New York', 'tokio': 'Tokyo', 'kyoto': 'Kyoto',
    'bangkok': 'Bangkok', 'estambul': 'Istanbul', 'buenos aires': 'Buenos Aires',
    'lima': 'Lima', 'santiago de chile': 'Santiago', 'la habana': 'Havana', 'havana': 'Havana',
    'venecia': 'Venice', 'florencia': 'Florence', 'praga': 'Prague', 'budapest': 'Budapest',
    'miami': 'Miami', 'milan': 'Milan', 'sidney': 'Sydney', 'sydney': 'Sydney', 'kuala lumpur': 'Kuala Lumpur',
    'cadiz': 'Cadiz', 'toledo': 'Toledo'
};

const normalizeCityName = (input: string): string => {
    return CITY_MAPPINGS[input.toLowerCase().trim()] || input;
};

const LANGUAGE_NAMES: {[key: string]: string} = {
    'es': 'Spanish', 'en': 'English', 'ca': 'Catalan', 'eu': 'Basque', 'fr': 'French',
    'de': 'German', 'ar': 'Arabic', 'pt': 'Portuguese', 'zh': 'Chinese (Simplified)', 'ja': 'Japanese'
};

const getFallbackTour = (city: string, language: string): Tour[] => {
    const isEs = language.startsWith('es');
    return [{
        id: `fb-${Date.now()}`,
        city: city,
        title: isEs ? `Lo Esencial de ${city}` : `${city} Essentials`,
        description: isEs ? `Descubre los puntos clave de ${city} en este tour básico.` : `Discover the key spots of ${city} in this basic tour.`,
        duration: "3h",
        distance: "4.5 km",
        difficulty: "Moderate",
        theme: "History",
        isSponsored: false,
        isRichDescription: true,
        stops: [
            { id: 'fb1', name: isEs ? 'Centro Ciudad' : 'City Center', description: isEs ? '[HOOK] El corazón palpitante.\n[KEY INSIGHT] Un lugar lleno de historia y secretos por descubrir.' : '[HOOK] El corazón palpitante.\n[KEY INSIGHT] Un lugar lleno de historia y secretos por descubrir.', latitude: 0, longitude: 0, type: 'historical', visited: false, isRichInfo: true }
        ]
    }];
};

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    const cacheKey = `city_info_v46_${city.replace(/\s/g, '').toLowerCase()}_${languageCode}`;
    const cachedData = getFromCache<CityInfo>(cacheKey);
    if (cachedData) return cachedData;

    const ai = getClient();
    const targetLanguage = LANGUAGE_NAMES[languageCode] || languageCode;

    // Fallback object follows the updated CityInfo interface
    const fallback: CityInfo = { 
        transport: "Walkable / Metro", 
        bestTime: "Spring/Autumn", 
        localDish: "Local specialty", 
        costLevel: "$$",
        securityLevel: "Safe",
        wifiSpots: ["Public libraries", "Main squares"],
        lingo: ["Hello", "Thank you"],
        apps: ["Uber", "Google Maps"]
    };

    if (!ai) return fallback;

    const prompt = `
        TASK: Provide practical travel intelligence for ${city}.
        LANGUAGE: ${targetLanguage}.
        OUTPUT JSON ONLY:
        {
            "transport": "Primary mode (e.g. 'Metro & Walking').",
            "bestTime": "Best season (e.g. 'May-June').",
            "localDish": "Top dish name.",
            "costLevel": "Budget level (Low/Medium/High).",
            "securityLevel": "Concise summary of city safety (e.g. 'Very High - Safe at night' or 'Moderate - Watch for pickpockets').",
            "wifiSpots": ["Specific location 1", "Specific location 2", "Specific location 3"],
            "lingo": ["Expression 1 - Meaning", "Expression 2 - Meaning", "Expression 3 - Meaning"],
            "apps": ["Name of main Taxi/Ride app", "Name of Transport app"]
        }
    `;

    try {
        const response = await callAiWithRetry(() => 
            ai.models.generateContent({ 
                model: "gemini-3-flash-preview", 
                contents: prompt, 
                config: { responseMimeType: "application/json" } 
            })
        );
        
        const data = JSON.parse(cleanJson(response.text || "{}"));
        if (!data.transport) return fallback;
        saveToCache(cacheKey, data);
        return data;
    } catch (e) {
        return fallback;
    }
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
  const inputCity = cityInput.trim().toLowerCase();
  const englishCityName = normalizeCityName(cityInput);
  
  const cacheKey = `tours_gen_v47_${inputCity}_${languageCode}`;
  const cachedData = getFromCache<Tour[]>(cacheKey);
  if (cachedData) return cachedData;

  const ai = getClient();
  const targetLanguage = LANGUAGE_NAMES[languageCode] || languageCode;
  
  const staticCityTours = STATIC_TOURS.filter(t => 
      t.city.toLowerCase() === englishCityName.toLowerCase() || 
      t.city.toLowerCase() === inputCity ||
      normalizeCityName(t.city).toLowerCase() === inputCity
  );

  if (staticCityTours.length > 0) {
      return staticCityTours; 
  }

  if (!ai) return getFallbackTour(cityInput, languageCode);

  const prompt = `
    ROLE: Elite Storyteller & Travel Expert for bdai app.
    TASK: Create 3 IMMERSIVE Walking Tours for ${cityInput}.
    LANGUAGE: ${targetLanguage}
    
    CRITICAL QUALITY RULES:
    1. EACH TOUR MUST HAVE EXACTLY 8 STOPS. 
    2. Tone: Engaging, witty, focusing on "Secret Spots" and "Unique Perspectives".
    3. NO generic descriptions.
    
    OUTPUT FORMAT (JSON ARRAY):
    [
      {
        "title": "Tour Title",
        "description": "Engaging storytelling hook...",
        "duration": "3.5h",
        "distance": "5.2 km",
        "difficulty": "Moderate",
        "theme": "History", 
        "stops": [ 
            {
                "name": "Stop Name",
                "description": "[HOOK] One punchy sentence. [STORY] Brief summary.",
                "latitude": 0.00,
                "longitude": 0.00,
                "type": "historical",
                "curiosity": "Short witty fact"
            }
        ]
      }
    ]
  `;

  try {
    const response = await callAiWithRetry(() => 
        ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        })
    );
    const tours = JSON.parse(cleanJson(response.text || "[]"));
    
    const enrichedTours = tours.map((t: any, idx: number) => ({
        ...t, 
        id: `gen_${cityInput}_${idx}_${Date.now()}`,
        city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({
            ...s,
            id: `s_${idx}_${sIdx}`,
            visited: false,
            isRichInfo: false 
        }))
    }));

    saveToCache(cacheKey, enrichedTours);
    return enrichedTours;

  } catch (error) {
    return getFallbackTour(cityInput, languageCode);
  }
};

export const generateStopDetails = async (stopName: string, city: string, languageCode: string) => {
    const ai = getClient();
    if (!ai) return { description: "Info unavailable" };

    const targetLanguage = LANGUAGE_NAMES[languageCode] || languageCode;
    const cacheKey = `stop_deep_dive_v3_${stopName.replace(/\s/g, '')}_${languageCode}`;
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;

    const prompt = `
        ROLE: Expert Local Guide and Historian.
        TASK: Provide a DEEP, RICH, and UNIQUE description for "${stopName}" in ${city}.
        LANGUAGE: ${targetLanguage}.
        
        GOAL: I want info that IS NOT in standard travel guides.
        - Talk about urban legends or myths.
        - Describe hidden architectural details (like a small carving or a bullet hole from a specific battle).
        - Mention the best sensory experience (e.g. "close your eyes and listen to the echo" or "the specific smell of the nearby bakery").
        - Mention a specific time of day when something unique happens.
        
        STRUCTURE (MANDATORY LABELS):
        - [HOOK]: One mysterious or punchy opening sentence.
        - [STORY]: 3 detailed paragraphs of narrative. Be extremely informative and immersive.
        - [SECRET]: A "did you know" that only locals know.
        - [SMART_TIP]: A tactical tip for the traveler (e.g. "enter through the side gate to avoid the line").
        - [QUEST]: A small challenge (e.g. "find the stone frog on the facade").
        
        OUTPUT JSON ONLY:
        {
            "description": "[HOOK] ... \\n [STORY] ... \\n [SECRET] ... \\n [SMART_TIP] ... \\n [QUEST] ...",
            "curiosity": "One mind-blowing witty fact",
            "photoShot": {
                "angle": "Pro photography tip (e.g. 'Align the tower with the archway from the second balcony')",
                "bestTime": "Precise time for best lighting",
                "instagramHook": "A clever, non-cliché caption with emojis",
                "milesReward": 150
            }
        }
    `;

    try {
        const response = await callAiWithRetry(() => 
            ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    thinkingConfig: { thinkingBudget: 4000 } 
                }
            })
        );
        const data = JSON.parse(cleanJson(response.text || "{}"));
        saveToCache(cacheKey, data);
        return data;
    } catch (e) {
        return { description: "[HOOK] A world of secrets. [STORY] This place has survived centuries of transformation, holding stories of both glory and shadow. Look closely at the walls to see the layers of history." };
    }
};

export const generateImage = async (prompt: string): Promise<string | undefined> => {
    const ai = getClient();
    if (!ai) return undefined;
    const cacheKey = `img_gen_v45_${prompt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)}`;
    try {
        const cached = await getMediaCache(cacheKey); if (cached) return cached;
        const safePrompt = `High quality travel photography of ${prompt}, cinematic, sunny day, sharp focus`;
        const response = await callAiWithRetry(() => 
            ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: safePrompt }] } })
        );
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) { const img = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; setMediaCache(cacheKey, img); return img; }
        }
        return undefined;
    } catch (e) { return undefined; }
};

export const generateAudio = async (text: string): Promise<string> => {
  if (!text) return "";
  const ai = getClient(); 
  if (!ai) return "";
  const spokenText = text.replace(/\[.*?\]/g, '').replace(/[*_#`]/g, '').trim().substring(0, 3000); 
  const cacheKey = `audio_v45_${spokenText.substring(0, 40)}`;
  const cachedAudio = await getMediaCache(cacheKey); 
  if (cachedAudio) return cachedAudio;
  try {
    const response: GenerateContentResponse = await callAiWithRetry(() => 
        ai.models.generateContent({ 
          model: "gemini-2.5-flash-preview-tts", 
          contents: [{ parts: [{ text: spokenText }] }], 
          config: { 
            responseModalities: [Modality.AUDIO], 
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } 
          } 
        })
    );
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) { setMediaCache(cacheKey, audioData); return audioData; }
    return "";
  } catch (e) { return ""; }
};
