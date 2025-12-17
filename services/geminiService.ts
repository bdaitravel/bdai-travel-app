
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { Tour, Stop, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

const CACHE_PREFIX = 'techtravel_v50_';
const MAX_RETRIES = 3; 

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
            if (attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000; 
                await new Promise(resolve => setTimeout(resolve, delay));
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

const saveToCache = (key: string, data: any) => {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) { localStorage.clear(); }
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

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    const cacheKey = `city_info_${city.toLowerCase()}_${languageCode}`;
    const cachedData = getFromCache<CityInfo>(cacheKey);
    if (cachedData) return cachedData;

    const ai = getClient();
    if (!ai) return { transport: "Walk", bestTime: "Spring", localDish: "Pizza", costLevel: "$$", securityLevel: "High", wifiSpots: [], lingo: [], apps: [] };

    const prompt = `Provide practical travel intel for ${city} in language code ${languageCode}. JSON format: {transport, bestTime, localDish, costLevel, securityLevel, wifiSpots:[], lingo:[], apps:[]}`;
    try {
        const response = await ai.models.generateContent({ 
            model: "gemini-3-flash-preview", 
            contents: prompt, 
            config: { responseMimeType: "application/json" } 
        });
        const data = JSON.parse(cleanJson(response.text || "{}"));
        saveToCache(cacheKey, data);
        return data;
    } catch (e) { return { transport: "Walk", bestTime: "Spring", localDish: "Pizza", costLevel: "$$", securityLevel: "High", wifiSpots: [], lingo: [], apps: [] }; }
};

// Added interests parameter to personalize tours
export const generateToursForCity = async (city: string, languageCode: string, interests: string[] = []): Promise<Tour[]> => {
  const cacheKey = `tours_${city.toLowerCase()}_${languageCode}_${interests.join('_')}`;
  const cachedData = getFromCache<Tour[]>(cacheKey);
  if (cachedData) return cachedData;

  const ai = getClient();
  const staticTours = STATIC_TOURS.filter(t => t.city.toLowerCase() === city.toLowerCase());
  
  if (!ai) return staticTours.length > 0 ? staticTours : [];

  const interestContext = interests.length > 0 ? `Adapta los tours a los siguientes intereses del usuario: ${interests.join(', ')}.` : '';
  const prompt = `
    Eres el mejor guía de FREE TOURS de ${city}. Tienes un estilo DIVERTIDO, CARISMÁTICO y lleno de CHISMES históricos.
    ${interestContext}
    Crea 3 tours a pie por ${city} en idioma ${languageCode}.
    Cada parada debe tener:
    - Un [HOOK]: algo que llame la atención.
    - Una [STORY]: la historia contada con gracia y detalles únicos.
    - Un [GOSSIP]: un chisme local, secreto o leyenda urbana picante.
    
    Responde estrictamente en JSON con este formato:
    [{
        "id": "t1",
        "city": "${city}",
        "title": "Título con gancho",
        "description": "Intro divertida",
        "duration": "2.5h",
        "distance": "3km",
        "difficulty": "Easy",
        "theme": "History",
        "stops": [{
            "name": "Nombre parada",
            "description": "[HOOK]... [STORY]...",
            "latitude": 0.0,
            "longitude": 0.0,
            "type": "historical",
            "curiosity": "Dato loco",
            "gossip": "Chisme o secreto local"
        }]
    }]
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    const tours = JSON.parse(cleanJson(response.text || "[]"));
    const finalTours = tours.map((t: any) => ({ ...t, stops: t.stops.map((s: any) => ({ ...s, visited: false, isRichInfo: true })) }));
    saveToCache(cacheKey, finalTours);
    return finalTours;
  } catch (error) {
    return staticTours;
  }
};

export const generateStopDetails = async (stopName: string, city: string, languageCode: string) => {
    const ai = getClient();
    if (!ai) return {};
    const prompt = `Da detalles ENTRETENIDOS y ÚNICOS sobre ${stopName} en ${city}. Idioma: ${languageCode}. JSON: {description: "con [HOOK] y [STORY]", curiosity: "dato loco", gossip: "chisme o secreto"}`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) { return {}; }
};

export const generateAudio = async (text: string): Promise<string> => {
  const ai = getClient(); 
  if (!ai) return "";
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text: text.substring(0, 1000) }] }], 
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } } 
      } 
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) { return ""; }
};

// Implemented generateImage for CityCard
export const generateImage = async (prompt: string): Promise<string | null> => {
    const ai = getClient();
    if (!ai) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Image generation failed", e);
        return null;
    }
};
