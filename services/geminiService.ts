// 1. IMPORTAMOS LA LIBRERÍA QUE SÍ TIENES INSTALADA (@google/generative-ai)
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Tour, Stop, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

const CACHE_PREFIX = 'bdai_fix_v60_'; // Cambiamos nombre para forzar limpieza
const MAX_RETRIES = 2; 

// --- 2. CONFIGURACIÓN DEL CLIENTE (CORREGIDA) ---
const getClient = () => {
    // IMPORTANTE: Usamos import.meta.env para Vite. 
    // Si usas process.env aquí, la clave será undefined y fallará siempre.
    const key = import.meta.env.VITE_API_KEY;
    
    if (!key) {
        console.error("🔴 CRÍTICO: No se detecta la API KEY. Revisa Vercel.");
        return null;
    }
    return new GoogleGenerativeAI(key);
};

// --- 3. TOUR DE EMERGENCIA (PLAN B) ---
const getFallbackTour = (city: string, language: string): Tour[] => {
    const isEs = language.startsWith('es');
    return [{
        id: `fb-${Date.now()}`,
        city: city,
        title: isEs ? `Recorrido Clásico por ${city}` : `${city} Classic Walk`,
        description: isEs 
            ? "Tour básico de ejemplo (IA no conectada)." 
            : "Basic fallback tour (AI not connected).",
        duration: "1h",
        distance: "2 km",
        difficulty: "Easy",
        theme: "General",
        isSponsored: false,
        stops: [
            {
                id: "s1",
                name: "Punto de Inicio",
                description: "Inicio del tour.",
                latitude: 40.4168, 
                longitude: -3.7038,
                type: "historical", 
                visited: false,
                isRichInfo: false
            }
        ]
    }];
};

// --- 4. UTILIDADES ---
const cleanJson = (text: string) => {
    try {
        let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const first = cleaned.indexOf('[');
        const last = cleaned.lastIndexOf(']');
        if (first !== -1 && last !== -1) return cleaned.substring(first, last + 1);
        
        const firstObj = cleaned.indexOf('{');
        const lastObj = cleaned.lastIndexOf('}');
        if (firstObj !== -1 && lastObj !== -1) return cleaned.substring(firstObj, lastObj + 1);
        
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
            await new Promise(r => setTimeout(r, 1500));
        }
    }
};

// --- 5. FUNCIONES PRINCIPALES ---

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    const fallback: CityInfo = { 
        transport: "Metro / Walk", bestTime: "Spring", localDish: "Local Dish", 
        costLevel: "$$", securityLevel: "Standard", wifiSpots: ["Center"], lingo: ["Hola"], apps: ["Maps"] 
    };
    
    const genAI = getClient();
    if (!genAI) return fallback;

    const cacheKey = `${CACHE_PREFIX}city_${city}_${languageCode}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        // Usamos gemini-1.5-flash que es rápido y estable en la librería oficial
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Return JSON only. Info for tourist in ${city}. Language: ${languageCode}. Fields: transport, bestTime, localDish, costLevel, securityLevel, wifiSpots (array), lingo (array), apps (array).`;
        
        const result = await callAiWithRetry(() => model.generateContent(prompt));
        const text = result.response.text();
        const data = JSON.parse(cleanJson(text));
        
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

    // Revisar tours estáticos
    const staticTours = STATIC_TOURS.filter(t => t.city.toLowerCase().includes(cityInput.toLowerCase()));
    if (staticTours.length > 0) return staticTours;

    const genAI = getClient();
    if (!genAI) return getFallbackTour(cityInput, languageCode);

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", // Modelo oficial
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
                // Validamos el tipo para evitar errores de TypeScript
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

// 6. FUNCIONES VACÍAS (Para evitar errores de compilación)
export const generateStopDetails = async (stopName: string, city: string, language: string) => {
    return { description: "Info unavailable currently.", curiosity: "..." };
};

export const generateAudio = async (text: string) => { return ""; };
export const generateImage = async (prompt: string) => { return undefined; };
