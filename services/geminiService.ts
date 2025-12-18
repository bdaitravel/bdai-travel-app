import { GoogleGenerativeAI } from "@google/generative-ai";
import { Tour, Stop, CityInfo } from '../types';

const CACHE_PREFIX = 'bdai_DEBUG_v3_'; 
const MAX_RETRIES = 1; 

// --- 1. CONFIGURACIÓN DEL CLIENTE ---
const getClient = () => {
    const key = import.meta.env.VITE_API_KEY;
    if (!key) return null; 
    return new GoogleGenerativeAI(key);
};

// --- 2. TOUR DE EMERGENCIA (ERROR) ---
const getDebugErrorTour = (city: string, errorMsg: string): Tour[] => {
    return [{
        id: `error-${Date.now()}`,
        city: city,
        title: `ERROR: ${errorMsg.slice(0, 30)}...`, 
        description: `DETALLE TÉCNICO: ${errorMsg}`,
        duration: "0h",
        distance: "0 km",
        difficulty: "Easy",
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

// --- 3. FUNCIONES PRINCIPALES ---

export const getCityInfo = async (city: string, languageCode: string): Promise<CityInfo> => {
    return { transport: "...", bestTime: "...", localDish: "...", costLevel: "$", securityLevel: "...", wifiSpots: [], lingo: [], apps: [] };
};

export const generateToursForCity = async (cityInput: string, languageCode: string): Promise<Tour[]> => {
    // 1. Borramos caché para forzar conexión
    const cacheKey = `${CACHE_PREFIX}tours_${cityInput}`;
    localStorage.removeItem(cacheKey);

    // 2. Verificaciones
    const key = import.meta.env.VITE_API_KEY;
    if (!key) {
        return getDebugErrorTour(cityInput, "FALTA CLAVE VITE_API_KEY");
    }

    const genAI = getClient();
    if (!genAI) return getDebugErrorTour(cityInput, "ERROR CLIENTE GOOGLE");

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro", 
        });

        const prompt = `Create a simple JSON list of 2 walking tours for ${cityInput}. Just the JSON.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text(); 
        
        // --- AQUÍ ESTABA EL ERROR, YA CORREGIDO ---
        return [{
            id: `success-${Date.now()}`,
            city: cityInput,
            title: `¡ÉXITO! CONEXIÓN LOGRADA`, 
            description: `La IA ha respondido: ${text.slice(0, 50)}...`,
            duration: "2h",
            distance: "3km",
            difficulty: "Moderate",
            theme: "History",
            isSponsored: false, // <--- ESTA ES LA LÍNEA QUE FALTABA
            stops: [{ 
                id: "s1", 
                name: "Funciona", 
                description: "Todo bien", 
                latitude: 40.4, 
                longitude: -3.7, 
                type: "historical", 
                visited: false,
                isRichInfo: false 
            }]
        }];

    } catch (e: any) {
        console.error("DEBUG ERROR:", e);
        let msg = e.message || JSON.stringify(e);
        
        if (msg.includes("403")) return getDebugErrorTour(cityInput, "403: API KEY NO VALIDA");
        if (msg.includes("404")) return getDebugErrorTour(cityInput, "404: MODELO NO ENCONTRADO");
        if (msg.includes("429")) return getDebugErrorTour(cityInput, "429: CUOTA EXCEDIDA");
        if (msg.includes("503")) return getDebugErrorTour(cityInput, "503: SERVIDOR CAIDO");
        
        return getDebugErrorTour(cityInput, msg);
    }
};

// --- FUNCIONES AUXILIARES (CON ARGUMENTOS PARA QUE NO FALLE APP.TSX) ---

export const generateStopDetails = async (stopName: string, city: string, language: string) => {
    return { description: "Info unavailable currently.", curiosity: "..." };
};

export const generateAudio = async (text: string) => {
    return ""; 
};

export const generateImage = async (prompt: string) => {
    return undefined;
};
