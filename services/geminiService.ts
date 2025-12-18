import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Tour, CityInfo } from '../types';
import { STATIC_TOURS } from '../data/toursData';

const CACHE_PREFIX = 'bdai_FINAL_v2_'; 
const MAX_RETRIES = 1; 

// 1. CONFIGURACIÓN
const getClient = () => {
    const key = import.meta.env.VITE_API_KEY;
    if (!key) return null;
    return new GoogleGenerativeAI(key);
};

// 2. EMERGENCIA (Solo si todo falla)
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
            id: "s1", name: "Punto de Inicio", description: "Inicio del recorrido.",
            latitude: 40.416, longitude: -3.703, type: "historical", visited: false, isRichInfo: false
        }]
    }];
};

// 3. LIMPIEZA INTELIGENTE DE JSON
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

// 4. GENERACIÓN DE TOURS (CON "AUTO-DOWNGRADE")
export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
    // Limpiamos caché para probar de verdad
    const cacheKey = `${CACHE_PREFIX}tours_${cityInput}`;
    localStorage.removeItem(cacheKey);

    const genAI = getClient();
    if (!genAI) return getFallbackTour(cityInput, "ERROR: KEY", "Falta API Key");

    // LISTA DE MODELOS A PROBAR (Del más moderno al más seguro)
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro"];

    for (const modelName of modelsToTry) {
        try {
            console.log(`Intentando conectar con modelo: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
                Create 2 walking tours for ${cityInput}.
                Return ONLY a JSON Array.
                Format: [{ "title": "...", "description": "...", "duration": "2h", "distance": "3km", "difficulty": "Moderate", "theme": "History", "stops": [{ "name": "...", "description": "...", "latitude": 0.0, "longitude": 0.0, "type": "historical", "visited": false }] }]
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            // Si llegamos aquí, este modelo ha funcionado. Procesamos y salimos.
            const tours = JSON.parse(cleanJson(text));
            
            return tours.map((t: any, i: number) => ({
                ...t,
                id: `ai_${i}_${Date.now()}`,
                city: cityInput,
                isSponsored: false,
                stops: t.stops.map((s: any, si: number) => ({ ...s, id: `s_${i}_${si}`, visited: false, isRichInfo: false }))
            }));

        } catch (e: any) {
            console.warn(`Fallo con ${modelName}:`, e.message);
            // Si el error es 404 (Modelo no encontrado), el bucle 'for' continuará con el siguiente modelo ("gemini-pro")
            // Si es el último modelo y sigue fallando, lanzamos error.
            if (modelName === modelsToTry[modelsToTry.length - 1]) {
                let msg = e.message || "Error desconocido";
                if (msg.includes("404")) return getFallbackTour(cityInput, "ERROR 404: NINGÚN MODELO", "Tu cuenta de Google no tiene acceso a Gemini Flash ni Pro.");
                if (msg.includes("429")) return getFallbackTour(cityInput, "ERROR 429: CUOTA", "Has superado el límite gratuito.");
                return getFallbackTour(cityInput, "ERROR TÉCNICO", msg.slice(0,100));
            }
        }
    }
    return getFallbackTour(cityInput, "ERROR DESCONOCIDO", "No se pudo generar.");
};

// --- RESTO DE FUNCIONES ---
export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    return { transport: "Metro", bestTime: "Any", localDish: "Food", costLevel: "$$", securityLevel: "Safe", wifiSpots: [], lingo: [], apps: [] };
};
export const generateStopDetails = async (stopName: string, city: string, language: string) => ({ description: "...", curiosity: "..." });
export const generateAudio = async (text: string) => "";
export const generateImage = async (prompt: string) => undefined;
