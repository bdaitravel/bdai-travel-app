import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tour, Stop, CityInfo } from '../types';

const CACHE_PREFIX = 'bdai_DEBUG_v2_'; 
const MAX_RETRIES = 1; 

// --- 1. CONFIGURACIÓN DEL CLIENTE ---
const getClient = () => {
    // Vite requiere import.meta.env
    const key = import.meta.env.VITE_API_KEY;
    if (!key) return null; 
    return new GoogleGenerativeAI(key);
};

// --- 2. TOUR DE EMERGENCIA QUE MUESTRA EL ERROR ---
const getDebugErrorTour = (city: string, errorMsg: string): Tour[] => {
    return [{
        id: `error-${Date.now()}`,
        city: city,
        // EL TÍTULO TE DIRÁ EL ERROR
        title: `ERROR: ${errorMsg.slice(0, 30)}...`, 
        description: `DETALLE TÉCNICO: ${errorMsg}`,
        duration: "0h",
        distance: "0 km",
        difficulty: "Easy", // Corregido para cumplir con los tipos
        theme: "Error",
        isSponsored: false,
        stops: [{
            id: "err1", 
            name: "Error Técnico", 
            description: errorMsg,
            latitude: 40.416, 
            longitude: -3.703, 
            type: "historical", 
            visited: false, 
            isRichInfo: false
        }]
    }];
};

// --- 3. FUNCIONES PRINCIPALES (CON ARGUMENTOS CORREGIDOS) ---

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    return { transport: "...", bestTime: "...", localDish: "...", costLevel: "$", securityLevel: "...", wifiSpots: [], lingo: [], apps: [] };
};

// Corregido: Ahora acepta los argumentos para que App.tsx no falle
export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
    // 1. Borramos caché para forzar que intente conectar
    const cacheKey = `${CACHE_PREFIX}tours_${cityInput}`;
    localStorage.removeItem(cacheKey);

    // 2. Comprobamos la clave
    const key = import.meta.env.VITE_API_KEY;
    if (!key) {
        return getDebugErrorTour(cityInput, "FALTA CLAVE VITE_API_KEY EN VERCEL");
    }

    const genAI = getClient();
    if (!genAI) return getDebugErrorTour(cityInput, "ERROR AL INICIAR CLIENTE GOOGLE");

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro", // Usamos el modelo PRO
        });

        const prompt = `Create a simple JSON list of 2 walking tours for ${cityInput}. Just the JSON.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text(); 
        
        // Si llegamos aquí, ¡funciona!
        return [{
            id: `success-${Date.now()}`,
            city: cityInput,
            title: `¡ÉXITO! CONEXIÓN LOGRADA`, 
            description: `La IA ha respondido: ${text.slice(0, 50)}...`,
            duration: "2h",
            distance: "3km",
            difficulty: "Moderate", // Corregido: "Moderate" en lugar de "Medium"
            theme: "History",
            stops: [{ id: "s1", name: "Funciona", description: "Todo bien", latitude: 40.4, longitude: -3.7, type: "historical", visited: false }]
        }];

    } catch (e: any) {
        console.error("DEBUG ERROR:", e);
        let msg = e.message || JSON.stringify(e);
        
        if (msg.includes("403")) return getDebugErrorTour(cityInput, "403: API KEY NO VALIDA O RESTRINGIDA");
        if (msg.includes("404")) return getDebugErrorTour(cityInput, "404: MODELO NO ENCONTRADO");
        if (msg.includes("429")) return getDebugErrorTour(cityInput, "429: CUOTA EXCEDIDA (PAGAR)");
        if (msg.includes("503")) return getDebugErrorTour(cityInput, "503: SERVIDOR GOOGLE CAIDO");
        
        return getDebugErrorTour(cityInput, msg);
    }
};

// Corregido: Añadidos los argumentos que espera App.tsx
export const generateStopDetails = async (stopName: string, city: string, language: string) => {
    return { description: "Info unavailable currently.", curiosity: "..." };
};

// Corregido: Añadidos los argumentos
export const generateAudio = async (text: string) => {
    return ""; 
};

// Corregido: Añadidos los argumentos
export const generateImage = async (prompt: string) => {
    return undefined;
};
