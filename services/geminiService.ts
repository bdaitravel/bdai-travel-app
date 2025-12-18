import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tour, Stop, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

// --- CONFIGURATION ---
const CACHE_PREFIX = 'bdai_cache_v45_'; 
const MAX_RETRIES = 3; 

// CONFIGURACIÓN CLAVE: Inicializar la IA correctamente para Vite
const getClient = () => {
    // IMPORTANTE: En Vite se usa import.meta.env, no process.env
    const key = import.meta.env.VITE_API_KEY;
    if (!key) {
        console.warn("Falta VITE_API_KEY. La app usará datos de fallback.");
        return null;
    }
    return new GoogleGenerativeAI(key);
};

const callAiWithRetry = async (apiCallFn: () => Promise<any>): Promise<any> => {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            return await apiCallFn();
        } catch (error: any) {
            attempt++;
            console.warn(`AI Call failed (Attempt ${attempt}/${MAX_RETRIES}):`, error);
            const isOverloaded = error.message?.includes('429') || error.message?.includes('503');
            if (isOverloaded && attempt < MAX_RETRIES) {
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
    } catch (e) {
        console.warn("Cache full, clearing old entries...");
        localStorage.clear(); 
    }
};

const cleanJson = (text: string) => {
  try {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Buscar el primer corchete o llave para asegurar JSON válido
    const firstBracket = cleaned.indexOf('[');
    const firstCurly = cleaned.indexOf('{');
    
    if (firstBracket === -1 && firstCurly === -1) return "[]";

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
    'londres': 'London', 'paris': 'Paris', 'roma': 'Rome', 'berlin': 'Berlin',
    'nueva york': 'New York', 'tokio': 'Tokyo'
};

const normalizeCityName = (input: string): string => {
    return CITY_MAPPINGS[input.toLowerCase().trim()] || input;
};

const LANGUAGE_NAMES: {[key: string]: string} = {
    'es': 'Spanish', 'en': 'English', 'fr': 'French', 'de': 'German', 'it': 'Italian', 'pt': 'Portuguese'
};

const getFallbackTour = (city: string, language: string): Tour[] => {
    const isEs = language.startsWith('es');
    return [{
        id: `fb-${Date.now()}`,
        city: city,
        title: isEs ? `Lo Esencial de ${city}` : `${city} Essentials`,
        description: isEs ? "Tour básico generado automáticamente." : "Basic automatically generated tour.",
        duration: "2h",
        distance: "3 km",
        difficulty: "Easy",
        theme: "General",
        isSponsored: false,
        stops: []
    }];
};

// --- API FUNCTIONS ---

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    const cacheKey = `city_info_v47_${city.replace(/\s/g, '').toLowerCase()}_${languageCode}`;
    const cachedData = getFromCache<CityInfo>(cacheKey);
    if (cachedData) return cachedData;

    const targetLanguage = LANGUAGE_NAMES[languageCode] || languageCode;
    const fallback: CityInfo = { 
        transport: "Metro / Walk", bestTime: "Spring", localDish: "Local Food", 
        costLevel: "$$", securityLevel: "Standard", wifiSpots: [], lingo: [], apps: [] 
    };

    const genAI = getClient();
    if (!genAI) return fallback;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", // Usamos el modelo estable
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
        TASK: Provide travel intelligence for ${city}.
        LANGUAGE: ${targetLanguage}.
        OUTPUT JSON:
        {
            "transport": "Primary mode",
            "bestTime": "Best season",
            "localDish": "Top dish",
            "costLevel": "Low/Medium/High",
            "securityLevel": "Safety summary",
            "wifiSpots": ["Spot 1", "Spot 2"],
            "lingo": ["Phrase 1 - Meaning", "Phrase 2 - Meaning"],
            "apps": ["App 1", "App 2"]
        }
    `;

    try {
        const result = await callAiWithRetry(() => model.generateContent(prompt));
        const data = JSON.parse(cleanJson(result.response.text()));
        if (!data.transport) return fallback;
        saveToCache(cacheKey, data);
        return data;
    } catch (e) {
        console.error("Error getting city info:", e);
        return fallback;
    }
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
  const inputCity = cityInput.trim().toLowerCase();
  const cacheKey = `tours_gen_v47_${inputCity}_${languageCode}`;
  
  const cachedData = getFromCache<Tour[]>(cacheKey);
  if (cachedData) return cachedData;

  const targetLanguage = LANGUAGE_NAMES[languageCode] || languageCode;
  
  // Revisar tours estáticos primero
  const staticCityTours = STATIC_TOURS.filter(t => t.city.toLowerCase().includes(inputCity));
  if (staticCityTours.length > 0) return staticCityTours;

  const genAI = getClient();
  if (!genAI) return getFallbackTour(cityInput, languageCode);

  const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Modelo rápido y estable
      generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    ROLE: Expert Tour Guide.
    TASK: Create 3 Walking Tours for ${cityInput}.
    LANGUAGE: ${targetLanguage}
    RETURN JSON ARRAY ONLY:
    [
      {
        "title": "Tour Title",
        "description": "Short engaging description",
        "duration": "2h",
        "distance": "3km",
        "difficulty": "Easy",
        "theme": "History", 
        "stops": [ 
            {
                "name": "Stop Name",
                "description": "[HOOK] Hook sentence. [STORY] Brief story.",
                "latitude": 0.0,
                "longitude": 0.0,
                "type": "historical",
                "curiosity": "Fun fact"
            }
        ]
      }
    ]
  `;

  try {
    const result = await callAiWithRetry(() => model.generateContent(prompt));
    const tours = JSON.parse(cleanJson(result.response.text()));
    
    if (!Array.isArray(tours) || tours.length === 0) throw new Error("Invalid format");
    
    const enrichedTours = tours.map((t: any, idx: number) => ({
        ...t, 
        id: `gen_${idx}_${Date.now()}`,
        city: cityInput,
        imageUrl: '',
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
    console.error("Tour Generation Failed:", error);
    return getFallbackTour(cityInput, languageCode);
  }
};

export const generateStopDetails = async (stopName: string, city: string, languageCode: string) => {
    const genAI = getClient();
    if (!genAI) return { description: "Info unavailable", curiosity: "..." };

    const targetLanguage = LANGUAGE_NAMES[languageCode] || languageCode;
    const cacheKey = `stop_rich_v47_${stopName.replace(/\s/g, '')}_${languageCode}`;
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro", // Modelo Pro para mejores descripciones
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
        TASK: Detailed guide for "${stopName}" in ${city}.
        LANGUAGE: ${targetLanguage}.
        OUTPUT JSON:
        {
            "description": "[HOOK]... [STORY]...",
            "curiosity": "Fun fact",
            "photoShot": {
                "angle": "Photo advice",
                "bestTime": "Best time",
                "instagramHook": "Caption",
                "milesReward": 100
            }
        }
    `;

    try {
        const result = await callAiWithRetry(() => model.generateContent(prompt));
        const data = JSON.parse(cleanJson(result.response.text()));
        saveToCache(cacheKey, data);
        return data;
    } catch (e) {
        return { description: "Content unavailable currently.", curiosity: "Try again later." };
    }
};

// NOTA: Audio y Generación de Imagen simplificados para evitar errores de compilación
// hasta que la librería experimental sea estable.
export const generateAudio = async (text: string): Promise<string> => {
    console.warn("Audio generation requires backend or specialized service currently.");
    return ""; 
};

export const generateImage = async (prompt: string): Promise<string | undefined> => {
    return undefined;
};
