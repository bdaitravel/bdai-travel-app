
import { GoogleGenAI } from "@google/genai";
import { Tour, UserProfile } from '../types';
import { supabase } from './supabaseClient';

const CACHE_KEY = 'tt_local_cache_v7';

export const speakText = (text: string, lang: string = 'es') => {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported");
    return;
  }
  
  // Detener cualquier locución anterior de forma agresiva
  window.speechSynthesis.cancel();
  
  // Pequeño delay para asegurar que el navegador limpie la cola anterior
  setTimeout(() => {
    const cleanText = text.replace(/\[.*?\]/g, '').replace(/[*#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configuración robusta de idioma
    utterance.lang = lang === 'ca' ? 'ca-ES' : lang === 'eu' ? 'eu-ES' : lang;
    utterance.rate = 0.95; // Un poco más lento para mejor claridad
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Eventos para depuración
    utterance.onstart = () => console.log("Audio guía iniciada...");
    utterance.onerror = (e) => console.error("Error en audio guía:", e);

    window.speechSynthesis.speak(utterance);
  }, 100);
};

export const generateToursForCity = async (
  cityInput: string, 
  user: UserProfile, 
  timeAvailable: string,
  intent: string
): Promise<Tour[]> => {
  const cityLower = cityInput.toLowerCase().trim();
  const cacheKey = `${cityLower}_${user.language}_${user.travelerType}_${timeAvailable}_${intent}`;
  const localRegistry = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  
  if (localRegistry[cacheKey]) return localRegistry[cacheKey];

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Registrar búsqueda en Supabase para analíticas
    try {
        await supabase.from('searches').insert({
            city: cityInput,
            user_id: user.id,
            language: user.language,
            traveler_type: user.travelerType
        });
    } catch (sErr) {
        console.warn("Supabase log error:", sErr);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Eres el sistema central de bdai. Genera 2 rutas a pie únicas para ${cityInput}.
      
      CONTEXTO DEL VIAJERO:
      - Idioma: ${user.language}.
      - Estilo: ${user.travelerType}.
      - Tiempo: ${timeAvailable}.
      - Nivel: ${user.walkLevel}.
      
      FORMATO: Array JSON de objetos Tour.
      
      Cada Tour:
      - title, description (300+ caracteres, tono narrativo), duration, distance, theme.
      - weatherAdvice, localVibe.
      - stops: Array de 4-6 puntos con nombre, descripción detallada (400+ caracteres), latitude, longitude, type.
      - openingHours, photoTip, authenticFoodTip, wifiInfo.`,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "[]");
    const tours = data.map((t: any, i: number) => ({
      ...t,
      id: `ai_${cityLower}_${Date.now()}_${i}`,
      city: cityInput,
      difficulty: user.walkLevel === 'Marathoner' ? 'Hard' : (user.walkLevel === 'Lazy' ? 'Easy' : 'Moderate'),
      stops: t.stops.map((s: any, si: number) => ({ ...s, id: `s_${i}_${si}`, visited: false }))
    }));

    localRegistry[cacheKey] = tours;
    localStorage.setItem(CACHE_KEY, JSON.stringify(localRegistry));
    return tours;
  } catch (e) {
    console.error("AI Error:", e);
    return [];
  }
};
