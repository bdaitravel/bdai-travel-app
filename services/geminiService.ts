import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tour, Stop, CityInfo } from '../types';

const CACHE_PREFIX = 'bdai_FINAL_v1_'; 
const MAX_RETRIES = 1; 

// --- 1. CLIENTE ---
const getClient = () => {
    const key = import.meta.env.VITE_API_KEY;
    if (!key) return null; 
    return new GoogleGenerativeAI(key);
};

// --- 2. TOUR DE EMERGENCIA (Para que no se quede en blanco) ---
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
            id: "s1", name: "Punto de Inicio", description: "Inicio del tour.",
            latitude: 40.416, longitude: -3.703, type: "historical", visited: false, isRichInfo: false
        }]
    }];
};

// --- 3. FUNCIONES PRINCIPALES ---

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    // Retorno rápido para que no falle la UI
    return { 
        transport: "Metro / Walk", bestTime: "Spring", localDish: "Tapas", 
        costLevel: "$$", securityLevel: "Safe", wifiSpots: ["Center"], lingo: ["Hola"], apps: ["Maps"] 
    };
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
    // Limpiamos caché para probar de cero
    const cacheKey = `${CACHE_PREFIX}tours_${cityInput}`;
    localStorage.removeItem(cacheKey);

    const key = import.meta.env.VITE_API_KEY;
    if (!key) return getFallbackTour(cityInput, "ERROR: FALTA CLAVE", "Revisa Vercel env vars.");

    const genAI = getClient();
    if (!genAI) return getFallbackTour(cityInput, "ERROR: CLIENTE", "No se pudo iniciar Google AI.");

    try {
        // CAMBIO CLAVE: Usamos 'gemini-1.5-flash' que es el modelo más universal
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Create 2 walking tours for ${cityInput}.
            Return strict JSON array.
            Format: [{ "title": "...", "description": "...", "duration": "2h", "distance": "3km", "difficulty": "Moderate", "theme": "History", "stops": [{ "name": "...", "description": "...", "latitude": 0.0, "longitude": 0.0, "type": "historical", "visited": false }] }]
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Limpiamos el JSON que nos da la IA
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleanText.includes('[')) {
             cleanText = cleanText.substring(cleanText.indexOf('['));
             cleanText = cleanText.substring(0, cleanText.lastIndexOf(']') + 1);
        }

        const tours = JSON.parse(cleanText);

        // Si funciona, devolvemos los tours reales enriquecidos
        return tours.map((t: any, i: number) => ({
            ...t,
            id: `ai_${i}_${Date.now()}`,
            city: cityInput,
            isSponsored: false, // Importante para que no falle TypeScript
            stops: t.stops.map((s: any, si: number) => ({
                 ...s, id: `s_${i}_${si}`, visited: false, isRichInfo: false
            }))
        }));

    } catch (e: any) {
        console.error("ERROR FINAL:", e);
        let msg = e.message || "Error desconocido";
        
        // Diagnóstico preciso en pantalla
        if (msg.includes("404")) return getFallbackTour(cityInput, "ERROR 404: MODELO", "El modelo 'gemini-1.5-flash' no está activo en tu cuenta.");
        if (msg.includes("429")) return getFallbackTour(cityInput, "ERROR 429: CUOTA", "Has superado el límite gratuito de hoy.");
        if (msg.includes("403")) return getFallbackTour(cityInput, "ERROR 403: PERMISO", "Tu API Key tiene restricciones de IP/Dominio.");

        return getFallbackTour(cityInput, "ERROR TÉCNICO", msg.slice(0, 100));
    }
};

// --- AUXILIARES (Para evitar errores de compilación) ---
export const generateStopDetails = async (stopName: string, city: string, language: string) => ({ description: "...", curiosity: "..." });
export const generateAudio = async (text: string) => "";
export const generateImage = async (prompt: string) => undefined;
