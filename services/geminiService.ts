import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Tour, Stop, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

const CACHE_PREFIX = 'bdai_v55_'; // Cambiamos prefijo para limpiar caché corrupta
const MAX_RETRIES = 2;

// 1. CLIENTE GOOGLE (CORREGIDO PARA VITE)
const getClient = () => {
    // ¡ESTO ES LO QUE FALLABA! Usamos import.meta.env
    const key = import.meta.env.VITE_API_KEY;
    if (!key) {
        console.error("CRÍTICO: No se encuentra VITE_API_KEY.");
        return null;
    }
    return new GoogleGenerativeAI(key);
};

// 2. TOUR DE EMERGENCIA (Si falla la IA)
const getFallbackTour = (city: string, language: string): Tour[] => {
    const isEs = language.startsWith('es');
    return [{
        id: `fb-${Date.now()}`,
        city: city,
        title: isEs ? `Recorrido Clásico por ${city}` : `${city} Classic Walk`,
        description: isEs 
            ? "Tour básico generado automáticamente." 
            : "Basic tour automatically generated.",
        duration: "1h",
        distance: "2 km",
        difficulty: "Easy",
        theme: "General",
        isSponsored: false,
        stops: [
            {
                id: "s1",
                name: "Punto de Inicio",
                description: "Inicio del recorrido.",
                latitude: 40.4168, 
                longitude: -3.7038,
                type: "historical", 
                visited: false,
                isRichInfo: false
            }
        ]
    }];
};

// 3. LIMPIEZA DE JSON (Para que no rompa la app)
const cleanJson = (text: string) => {
    try {
        let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstSquare = cleaned.indexOf('[');
        const firstCurly = cleaned.indexOf('{');
        
        if (firstSquare === -1 && firstCurly === -1) return "[]";
        
        // Si empieza por corchete, es un array (Tours)
        if (firstSquare !== -1 && (firstCurly === -1 || firstSquare < firstCurly)) {
             const lastSquare = cleaned.lastIndexOf(']');
             return cleaned.substring(firstSquare, lastSquare + 1);
        }
        // Si empieza por llave, es un objeto (City Info)
        if (firstCurly !== -1) {
             const lastCurly = cleaned.lastIndexOf('}');
             return cleaned.substring(firstCurly, lastCurly + 1);
        }
        return cleaned;
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
            await new Promise(r => setTimeout(r, 2000));
        }
    }
};

// 4. FUNCIONES PRINCIPALES

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    const fallback: CityInfo = { 
        transport: "Metro / Walk", bestTime: "Anytime", localDish: "Local Dish", 
        costLevel: "$$", securityLevel: "Standard", wifiSpots: ["Center"], lingo: ["Hola"], apps: ["Maps"] 
    };
    
    const genAI = getClient();
    if (!genAI) return fallback;

    const cacheKey = `${CACHE_PREFIX}city_${city}_${languageCode}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        // Usamos el modelo PRO que ya habilitaste en Google Cloud
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `Return JSON only. Info for tourist in ${city}. Language: ${languageCode}. Fields: transport, bestTime, localDish, costLevel, securityLevel, wifiSpots (array), lingo (array), apps (array).`;
        
        const result = await callAiWithRetry(() => model.generateContent(prompt));
        const data = JSON.parse(cleanJson(result.response.text()));
        
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    } catch (e) {
        return fallback;
    }
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
    const cacheKey = `${CACHE_PREFIX}tours_${cityInput}_${languageCode}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const staticTours = STATIC_TOURS.filter(t => t.city.toLowerCase().includes(cityInput.toLowerCase()));
    if (staticTours.length > 0) return staticTours;

    const genAI = getClient();
    if (!genAI) return getFallbackTour(cityInput, languageCode);

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro", // Modelo estable
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
        const tours = JSON.parse(cleanJson(result.response.text()));

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

export const generateStopDetails = async (stopName: string, city: string, language: string) => {
    return { description: "Info unavailable currently.", curiosity: "..." };
};

export const generateAudio = async (text: string) => { return ""; };
export const generateImage = async (prompt: string) => { return undefined; };
