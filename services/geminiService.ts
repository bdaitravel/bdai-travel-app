import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Tour, Stop, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

const CACHE_PREFIX = 'bdai_cache_v50_'; // Cambié la versión para borrar tu caché vieja
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

// --- 2. DATOS DE EMERGENCIA (FALLBACK) MEJORADOS ---
// Esto evita la pantalla en blanco si la IA falla
const getFallbackTour = (city: string, language: string): Tour[] => {
    const isEs = language.startsWith('es');
    return [{
        id: `fb-${Date.now()}`,
        city: city,
        title: isEs ? `Recorrido Clásico por ${city}` : `${city} Classic Walk`,
        description: isEs 
            ? "El sistema de IA está ocupado. Este es un tour básico de ejemplo para que puedas probar la app." 
            : "AI system is busy. This is a fallback tour so you can test the app.",
        duration: "1h",
        distance: "2 km",
        difficulty: "Easy",
        theme: "General",
        isSponsored: false,
        stops: [
            {
                id: "s1",
                name: isEs ? "Punto de Inicio (Demo)" : "Start Point (Demo)",
                description: isEs ? "Aquí comenzaría tu tour si la IA estuviera conectada." : "Your tour would start here.",
                latitude: 40.4168, // Coordenadas genéricas (Madrid) - No importa, el mapa se centrará
                longitude: -3.7038,
                type: "historical",
                visited: false,
                isRichInfo: false,
                curiosity: "..."
            },
            {
                id: "s2",
                name: isEs ? "Plaza Mayor (Ejemplo)" : "Main Square (Example)",
                description: "Ejemplo de parada.",
                latitude: 40.4154,
                longitude: -3.7074,
                type: "cultural",
                visited: false,
                isRichInfo: false,
                curiosity: "..."
            }
        ]
    }];
};

// --- 3. LIMPIEZA DE RESPUESTAS ---
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
            console.error(`🔴 Error IA (Intento ${attempt}):`, error); // ¡MIRA LA CONSOLA!
            if (attempt >= MAX_RETRIES) throw error;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
};

// --- 4. FUNCIONES PRINCIPALES ---

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    // Si la IA falla, devolvemos esto para que no se rompa la UI
    const fallback: CityInfo = { 
        transport: "Metro / Taxi", bestTime: "Anytime", localDish: "Local Food", 
        costLevel: "$$", securityLevel: "Normal", wifiSpots: ["Center"], lingo: ["Hola"], apps: ["Maps"] 
    };
    
    const genAI = getClient();
    if (!genAI) return fallback;

    const cacheKey = `city_${city}_${languageCode}_v50`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Return JSON only. Info for tourist in ${city}. Language: ${languageCode}. Fields: transport, bestTime, localDish, costLevel, securityLevel, wifiSpots (array), lingo (array), apps (array).`;
        
        const result = await callAiWithRetry(() => model.generateContent(prompt));
        const text = result.response.text();
        
        // Limpieza extra agresiva para JSON
        let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
             const data = JSON.parse(jsonStr);
             localStorage.setItem(cacheKey, JSON.stringify(data));
             return data;
        }
        return fallback;
    } catch (e) {
        console.error("Fallo GetCityInfo:", e);
        return fallback;
    }
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
    const cacheKey = `tours_${cityInput}_${languageCode}_v50`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    // Revisar estáticos
    const staticTours = STATIC_TOURS.filter(t => t.city.toLowerCase().includes(cityInput.toLowerCase()));
    if (staticTours.length > 0) return staticTours;

    const genAI = getClient();
    if (!genAI) return getFallbackTour(cityInput, languageCode);

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            // Configuración de seguridad para evitar bloqueos tontos
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

        if (!Array.isArray(tours) || tours.length === 0) throw new Error("JSON inválido o vacío");

        // Enriquecer datos
        const finalTours = tours.map((t: any, i: number) => ({
            ...t,
            id: `gen_${i}_${Date.now()}`,
            city: cityInput,
            imageUrl: '',
            stops: t.stops?.map((s: any, si: number) => ({ ...s, id: `s_${i}_${si}`, visited: false })) || []
        }));

        localStorage.setItem(cacheKey, JSON.stringify(finalTours));
        return finalTours;

    } catch (e) {
        console.error("🔴 FALLÓ LA GENERACIÓN DE TOURS:", e);
        return getFallbackTour(cityInput, languageCode);
    }
};

export const generateStopDetails = async () => { return { description: "Info unavailable", curiosity: "..." }; };
export const generateAudio = async () => { return ""; };
export const generateImage = async () => { return undefined; };
