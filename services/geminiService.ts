import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Tour, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

const CACHE_PREFIX = 'bdai_HUNTER_v1_'; 
const MAX_RETRIES = 1; 

// 1. CONFIGURACIÓN
const getClient = () => {
    const key = import.meta.env.VITE_API_KEY;
    if (!key) return null;
    return new GoogleGenerativeAI(key);
};

// 2. EMERGENCIA
const getFallbackTour = (city: string, title: string, desc: string): Tour[] => {
    return [{
        id: `fb-${Date.now()}`,
        city: city,
        title: title,
        description: desc,
        duration: "1h",
        distance: "2 km",
        difficulty: "Easy",
        theme: "General",
        isSponsored: false,
        stops: [{
            id: "s1", name: "Punto de Inicio", description: "Inicio.",
            latitude: 40.416, longitude: -3.703, type: "historical", visited: false, isRichInfo: false
        }]
    }];
};

// 3. LIMPIEZA JSON
const cleanJson = (text: string) => {
    try {
        let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleaned.includes('[')) {
             const start = cleaned.indexOf('[');
             const end = cleaned.lastIndexOf(']') + 1;
             return cleaned.substring(start, end);
        }
        return "[]";
    } catch (e) { return "[]"; }
};

// 4. GENERACIÓN DE TOURS (FUERZA BRUTA)
export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
    const cacheKey = `${CACHE_PREFIX}tours_${cityInput}`;
    localStorage.removeItem(cacheKey);

    const genAI = getClient();
    if (!genAI) return getFallbackTour(cityInput, "ERROR: KEY", "Falta API Key");

    // LISTA DE TODOS LOS MODELOS POSIBLES (El código probará uno por uno)
    const modelsToTry = [
        "gemini-1.5-flash",          // Opción A: El estándar rápido
        "gemini-1.5-pro",            // Opción B: El estándar potente
        "gemini-1.0-pro",            // Opción C: El clásico (muy compatible)
        "gemini-pro",                // Opción D: El nombre genérico antiguo
        "gemini-1.5-flash-8b"        // Opción E: La versión ligera nueva
    ];

    let lastError = "";

    for (const modelName of modelsToTry) {
        try {
            console.log(`🔫 Probando modelo: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
                Create 2 walking tours for ${cityInput}.
                Return ONLY a JSON Array.
                Format: [{ "title": "...", "description": "...", "duration": "2h", "distance": "3km", "difficulty": "Moderate", "theme": "History", "stops": [{ "name": "...", "description": "...", "latitude": 0.0, "longitude": 0.0, "type": "historical", "visited": false }] }]
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            // ¡SI LLEGAMOS AQUÍ, FUNCIONÓ!
            const tours = JSON.parse(cleanJson(text));
            
            // Añadimos al título qué modelo funcionó para que lo sepas
            return tours.map((t: any, i: number) => ({
                ...t,
                id: `ai_${i}_${Date.now()}`,
                city: cityInput,
                // Truco: Ponemos el modelo en el título para confirmar
                title: `${t.title} (${modelName})`, 
                isSponsored: false,
                stops: t.stops.map((s: any, si: number) => ({ ...s, id: `s_${i}_${si}`, visited: false, isRichInfo: false }))
            }));

        } catch (e: any) {
            console.warn(`❌ Falló ${modelName}:`, e.message);
            lastError = e.message || "Error desconocido";
            // Continuamos al siguiente modelo del bucle...
        }
    }

    // Si llegamos aquí, fallaron los 5 modelos
    if (lastError.includes("404")) return getFallbackTour(cityInput, "ERROR 404 FATAL", "Tu cuenta no tiene acceso a NINGÚN modelo Gemini.");
    if (lastError.includes("429")) return getFallbackTour(cityInput, "ERROR 429", "Cuota excedida.");
    
    return getFallbackTour(cityInput, "ERROR TOTAL", lastError.slice(0, 100));
};

// --- RESTO ---
export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    return { transport: "Metro", bestTime: "Any", localDish: "Food", costLevel: "$$", securityLevel: "Safe", wifiSpots: [], lingo: [], apps: [] };
};
export const generateStopDetails = async (stopName: string, city: string, language: string) => ({ description: "...", curiosity: "..." });
export const generateAudio = async (text: string) => "";
export const generateImage = async (prompt: string) => undefined;
