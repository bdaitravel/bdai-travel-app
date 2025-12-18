import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Tour, Stop, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

const CACHE_PREFIX = 'bdai_cache_v51_'; // Subimos versión para limpiar caché vieja
const MAX_RETRIES = 2; 

// --- 1. CONFIGURACIÓN DEL CLIENTE ---
const getClient = () => {
    const key = import.meta.env.VITE_API_KEY;
    if (!key) {
        console.error("CRÍTICO: No se encuentra VITE_API_KEY. Revisa Vercel -> Settings -> Env Variables.");
        return null;
    }
    return new GoogleGenerativeAI(key);
};

// --- 2. DATOS DE EMERGENCIA (FALLBACK) ---
const getFallbackTour = (city: string, language: string): Tour[] => {
    const isEs = language.startsWith('es');
    return [{
        id: `fb-${Date.now()}`,
        city: city,
        title: isEs ? `Recorrido Clásico por ${city}` : `${city} Classic Walk`,
        description: isEs 
            ? "El sistema de IA está ocupado. Este es un tour básico de ejemplo." 
            : "AI system is busy. This is a fallback tour example.",
        duration: "1h",
        distance: "2 km",
        difficulty: "Easy",
        theme: "General",
        isSponsored: false,
        stops: [
            {
                id: "s1",
                name: isEs ? "Punto de Inicio" : "Start Point",
                description: isEs ? "Aquí comenzaría tu tour." : "Your tour starts here.",
                latitude: 40.4168, 
                longitude: -3.7038,
                type: "historical", // Corregido
                visited: false,
                isRichInfo: false,
                curiosity: "..."
            },
            {
                id: "s2",
                name: isEs ? "Plaza Central" : "Main Square",
                description: "Ejemplo de parada.",
                latitude: 40.4154,
                longitude: -3.7074,
                type: "culture", // CORREGIDO: "culture" en lugar de "cultural"
                visited: false,
                isRichInfo: false,
                curiosity: "..."
            }
        ]
    }];
};

// --- 3. UTILIDADES ---
const cleanJson = (text: string) => {
    try {
        let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            return cleaned.substring(firstBracket, lastBracket + 1);
        }
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
            await new Promise(r => setTimeout(r, 1000));
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

    const cacheKey = `city_${city}_${languageCode}_v51`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Return JSON only. Info for tourist in ${city}. Language: ${languageCode}. Fields: transport, bestTime, localDish, costLevel, securityLevel, wifiSpots (array), lingo (array), apps (array).`;
        
        const result = await callAiWithRetry(() => model.generateContent(prompt));
        const text = result.response.text();
        
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
             const data = JSON.parse(jsonStr);
             localStorage.setItem(cacheKey, JSON.stringify(data));
             return data;
        }
        return fallback;
    } catch (e) {
        return fallback;
    }
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
    const cacheKey = `tours_${cityInput}_${languageCode}_v51`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const staticTours = STATIC_TOURS.filter(t => t.city.toLowerCase().includes(cityInput.toLowerCase()));
    if (staticTours.length > 0) return staticTours;

    const genAI = getClient();
    if (!genAI) return getFallbackTour(cityInput, languageCode);

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
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
                // Aseguramos que el tipo sea válido o ponemos uno por defecto
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

// --- CORRECCIÓN IMPORTANTE AQUÍ ABAJO ---
// Ahora aceptamos los argumentos aunque no los usemos, para que App.tsx no se queje

export const generateStopDetails = async (stopName: string, city: string, language: string) => {
    // Aceptamos los argumentos (stopName, etc) pero devolvemos un genérico para no gastar tokens
    return { description: "Info unavailable currently.", curiosity: "..." };
};

export const generateAudio = async (text: string) => {
    // Aceptamos 'text' para que no dé error TS2554, pero devolvemos vacío
    return ""; 
};

export const generateImage = async (prompt: string) => {
    return undefined;
};
