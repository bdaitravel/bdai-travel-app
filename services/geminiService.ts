import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Tour, Stop, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

const CACHE_PREFIX = 'bdai_cache_v53_PRO_'; // Versión nueva PRO para limpiar caché
const MAX_RETRIES = 2; 

// --- 1. CONFIGURACIÓN DEL CLIENTE ---
const getClient = () => {
    // IMPORTANTE: Vite usa import.meta.env. Si usas process.env fallará en Vercel.
    const key = import.meta.env.VITE_API_KEY;
    if (!key) {
        console.error("CRÍTICO: Faltan las llaves (VITE_API_KEY).");
        return null;
    }
    return new GoogleGenerativeAI(key);
};

// --- 2. PLAN DE EMERGENCIA (FALLBACK) ---
const getFallbackTour = (city: string, language: string): Tour[] => {
    const isEs = language.startsWith('es');
    return [{
        id: `fb-${Date.now()}`,
        city: city,
        title: isEs ? `Recorrido Clásico por ${city}` : `${city} Classic Walk`,
        description: isEs 
            ? "Tour básico generado porque la IA está ocupada o restringida en tu zona." 
            : "Basic tour generated because AI is busy or restricted in your region.",
        duration: "1h",
        distance: "2 km",
        difficulty: "Easy",
        theme: "General",
        isSponsored: false,
        stops: [
            {
                id: "s1",
                name: isEs ? "Punto de Inicio" : "Start Point",
                description: isEs ? "Inicio del recorrido." : "Start of the tour.",
                latitude: 40.4168, 
                longitude: -3.7038,
                type: "historical", 
                visited: false,
                isRichInfo: false
            },
            {
                id: "s2",
                name: isEs ? "Plaza Principal" : "Main Square",
                description: "Centro neurálgico.",
                latitude: 40.4154,
                longitude: -3.7074,
                type: "culture", 
                visited: false,
                isRichInfo: false
            }
        ]
    }];
};

// --- 3. UTILIDADES ---
const cleanJson = (text: string) => {
    try {
        let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleaned.startsWith('{') || cleaned.startsWith('[')) return cleaned;
        // Buscar corchetes si hay texto antes
        const first = cleaned.indexOf('[');
        const last = cleaned.lastIndexOf(']');
        if (first !== -1 && last !== -1) return cleaned.substring(first, last + 1);
        return "[]";
    } catch (e) { return "[]"; }
};

const callAiWithRetry = async (apiCallFn: () => Promise<any>): Promise<any> => {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            return await apiCallFn();
        } catch (error: any) {
            attempt++;
            console.error(`🔴 Error IA (Intento ${attempt}):`, error);
            if (attempt >= MAX_RETRIES) throw error;
            await new Promise(r => setTimeout(r, 2000)); // Esperar 2 segundos entre intentos
        }
    }
};

// --- 4. FUNCIONES PRINCIPALES ---

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    const fallback: CityInfo = { 
        transport: "Metro / Taxi", bestTime: "Anytime", localDish: "Local Food", 
        costLevel: "$$", securityLevel: "Normal", wifiSpots: ["Center"], lingo: ["Hola"], apps: ["Maps"] 
    };
    
    const genAI = getClient();
    if (!genAI) return fallback;

    const cacheKey = `city_${city}_${languageCode}_v53`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        // CAMBIO CLAVE: Usamos 'gemini-1.5-pro' porque 'flash' suele fallar en Europa Tier 1
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `Return JSON only. Info for tourist in ${city}. Language: ${languageCode}. Fields: transport, bestTime, localDish, costLevel, securityLevel, wifiSpots (array), lingo (array), apps (array).`;
        
        const result = await callAiWithRetry(() => model.generateContent(prompt));
        const text = result.response.text();
        
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        if (jsonStr.indexOf('{') !== -1) {
             const start = jsonStr.indexOf('{');
             const end = jsonStr.lastIndexOf('}') + 1;
             const data = JSON.parse(jsonStr.substring(start, end));
             localStorage.setItem(cacheKey, JSON.stringify(data));
             return data;
        }
        return fallback;
    } catch (e) {
        return fallback;
    }
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
    const cacheKey = `tours_${cityInput}_${languageCode}_v53`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const staticTours = STATIC_TOURS.filter(t => t.city.toLowerCase().includes(cityInput.toLowerCase()));
    if (staticTours.length > 0) return staticTours;

    const genAI = getClient();
    if (!genAI) return getFallbackTour(cityInput, languageCode);

    try {
        // CAMBIO CLAVE: Usamos 'gemini-1.5-pro' para máxima compatibilidad geográfica
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        });

        const prompt = `
            Act as a tour guide. Create 2 distinct walking tours for ${cityInput}.
            Language: ${languageCode}.
            Strictly return a JSON Array. No markdown.
            Format:
            [
              {
                "title": "Title", "description": "Desc", "duration": "2h", "distance": "3km", "difficulty": "Medium", "theme": "History",
                "stops": [
                    { "name": "Stop Name", "description": "Short description", "latitude": 0.0, "longitude": 0.0, "type": "historical", "curiosity": "Fact" }
                ]
              }
            ]
        `;

        const result = await callAiWithRetry(() => model.generateContent(prompt));
        const cleanText = cleanJson(result.response.text());
        const tours = JSON.parse(cleanText);

        if (!Array.isArray(tours) || tours.length === 0) throw new Error("JSON inválido");

        const finalTours = tours.map((t: any, i: number) => ({
            ...t,
            id: `gen_${i}_${Date.now()}`,
            city: cityInput,
            imageUrl: '',
            stops: t.stops?.map((s: any, si: number) => ({ 
                ...s, 
                id: `s_${i}_${si}`, 
                visited: false,
                type: ["historical", "food", "art", "nature", "photo", "culture"].includes(s.type) ? s.type : "culture"
            })) || []
        }));

        localStorage.setItem(cacheKey, JSON.stringify(finalTours));
        return finalTours;

    } catch (e) {
        console.error("🔴 FALLO GENERACIÓN TOURS:", e);
        return getFallbackTour(cityInput, languageCode);
    }
};

// Funciones auxiliares (necesarias para evitar errores en App.tsx)
export const generateStopDetails = async (stopName: string, city: string, language: string) => {
    return { description: "Info unavailable currently.", curiosity: "..." };
};

export const generateAudio = async (text: string) => {
    return ""; 
};

export const generateImage = async (prompt: string) => {
    return undefined;
};
