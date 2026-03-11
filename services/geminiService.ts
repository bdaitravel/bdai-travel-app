/**
 * BDAI Gemini Service
 * Fixes applied:
 * - Correct model names (gemini-2.0-flash, not gemini-3-flash-preview)
 * - API key via import.meta.env.VITE_GEMINI_API_KEY (not process.env)
 * - Tours generated in PARALLEL — all 3 start at the same time
 * - onTourGenerated callback fires as each tour finishes → progressive UI
 * - VOICE_MAP covers all 20 languages
 * - Audio cache: always await save, log failures clearly
 * - Personalized tour themes based on user interests
 */

import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedAudio, saveAudioToCache } from './supabaseClient';
import { saveAudioOffline, getAudioOffline } from './offlineService';
import { buildPersonalizedThemes } from './gamificationService';

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

// VITE requires VITE_ prefix for env vars exposed to the browser
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// Verified model IDs (as of 2025)
const MODEL_FAST = "gemini-2.0-flash"; // v2;
const MODEL_TTS  = "gemini-2.5-flash-preview-tts";
const MODEL_IMG  = "gemini-2.0-flash-exp";

// ─── RETRY WRAPPER ────────────────────────────────────────────────────────────

const handleAiCall = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const msg = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return handleAiCall(fn, retries - 1, delay * 2);
      }
      throw new QuotaError("DAI está saturado. Por favor, inténtalo en unos segundos.");
    }
    throw error;
  }
};

// ─── CITY SEARCH ──────────────────────────────────────────────────────────────

export const translateSearchQuery = async (input: string): Promise<{ english: string; detected: string }> => {
  return handleAiCall(async () => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Identify the city/location in: "${input}". Return JSON: { "english": "English city name", "detected": "language code" }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { english: { type: Type.STRING }, detected: { type: Type.STRING } },
          required: ["english", "detected"]
        }
      }
    });
    return JSON.parse(response.text || `{"english":"${input}","detected":"unknown"}`);
  });
};

export const normalizeCityWithAI = async (input: string, userLanguage: string): Promise<any[]> => {
  return handleAiCall(async () => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Find all cities/towns globally matching: "${input}".
      For each: official city name, country in ${userLanguage}, country in English, ISO alpha-2 code, slug "city_country" (lowercase, no accents).
      Return JSON array: [{ "city": "", "country": "", "countryEn": "", "countryCode": "", "slug": "" }]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              city:      { type: Type.STRING },
              country:   { type: Type.STRING },
              countryEn: { type: Type.STRING },
              countryCode:{ type: Type.STRING },
              slug:      { type: Type.STRING }
            },
            required: ["city", "country", "countryEn", "countryCode", "slug"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  });
};

// ─── TOUR GENERATION (PARALLEL) ───────────────────────────────────────────────

export const generateToursForCity = async (
  city: string,
  country: string,
  user: UserProfile,
  onTourGenerated?: (tour: Tour) => void
): Promise<Tour[]> => {

  // Use personalized themes if user has interests, otherwise use defaults
  const themes = buildPersonalizedThemes(user.interests || []);

  const generateSingleTour = async (theme: string, index: number): Promise<Tour> => {
    return handleAiCall(async () => {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: `Generate EXACTLY 1 thematic walking tour for ${city}, ${country}.
Language: ${user.language}.
Theme: ${theme}.

DAI RULES (non-negotiable):
- You are DAI: sarcastic, witty, sophisticated. Wikipedia is your enemy.
- Tell secrets, mysteries, dark curiosities. Mock typical tourists.
- NEVER use citations [1] or footnotes. All facts must be 100% real.
- Descriptions: 150-200 words per stop, in ${user.language}.

CATEGORIZATION (critical — wrong category = failure):
- architecture: ALL churches, cathedrals, bridges, iconic buildings
- historical: palaces, castles, ruins, monuments
- culture: ONLY theaters, music venues, festivals
- food: ONLY places where you eat or buy food
- art: ONLY museums, galleries, street art
- nature: ONLY parks, gardens, viewpoints
- photo: ONLY spots whose primary value is the view/photo

OUTPUT: Return ONLY a valid JSON object (not array):
{
  "id": "tour_${index}",
  "city": "${city}",
  "title": "...",
  "description": "...",
  "duration": "...",
  "distance": "...",
  "difficulty": "Easy",
  "theme": "${theme}",
  "stops": [
    {
      "id": "stop_0",
      "name": "...",
      "description": "...",
      "latitude": 0.0,
      "longitude": 0.0,
      "type": "architecture",
      "visited": false,
      "photoSpot": { "angle": "...", "milesReward": 50, "secretLocation": "..." }
    }
  ]
}
MINIMUM 10 STOPS. No markdown, no \`\`\`json, just the raw JSON object.`,
        config: {
          systemInstruction: `You are DAI — elegant, sarcastic, witty AI travel guide.
You HATE boring Wikipedia descriptions. You love dark secrets and city mysteries.
NEVER use citations or footnotes. ALWAYS be accurate.
A Cathedral is ALWAYS 'architecture'. A Palace is ALWAYS 'historical'. Never 'culture' for buildings.`,
        },
      });

      let text = (response.text || "{}");
      // Strip any citations or markdown
      text = text
        .replace(/\[\d+\]/g, '')
        .replace(/【\d+†source】/g, '')
        .replace(/```json|```/g, '')
        .trim();

      const match = text.match(/\{[\s\S]*\}/);
      const tour: Tour = JSON.parse(match ? match[0] : text);
      if (!tour.id) tour.id = `tour_${index}_${Date.now()}`;

      // Fire callback immediately so UI shows this tour right away
      onTourGenerated?.(tour);
      return tour;
    });
  };

  // All 3 tours start generating simultaneously
  // Each fires onTourGenerated as soon as it finishes
  // First typically arrives in ~5-8s instead of waiting 15-20s
  const results = await Promise.allSettled(
    themes.map((theme, i) => generateSingleTour(theme, i))
  );

  const tours = results
    .filter((r): r is PromiseFulfilledResult<Tour> => r.status === 'fulfilled')
    .map(r => r.value);

  if (tours.length === 0) {
    throw new Error("No se pudieron generar los tours. Inténtalo de nuevo.");
  }

  return tours;
};

// ─── AUDIO (20 LANGUAGES) ─────────────────────────────────────────────────────

// Full voice map for all 20 supported languages
// Available Gemini TTS voices: Zephyr, Puck, Charon, Kore, Fenrir, Leda, Orus, Aoede
const VOICE_MAP: Record<string, string> = {
  es: 'Kore',    // Spanish — warm, expressive
  en: 'Zephyr',  // English — clear, confident
  fr: 'Charon',  // French — sophisticated
  de: 'Fenrir',  // German — authoritative
  it: 'Puck',    // Italian — playful
  pt: 'Charon',  // Portuguese — smooth
  ro: 'Kore',    // Romanian — warm
  zh: 'Puck',    // Chinese — neutral
  ja: 'Puck',    // Japanese — neutral
  ru: 'Fenrir',  // Russian — strong
  ar: 'Kore',    // Arabic — warm
  hi: 'Leda',    // Hindi — clear
  ko: 'Puck',    // Korean — neutral
  tr: 'Fenrir',  // Turkish — strong
  pl: 'Charon',  // Polish — smooth
  nl: 'Zephyr',  // Dutch — clear
  ca: 'Kore',    // Catalan — warm (uses Spanish voice)
  eu: 'Kore',    // Basque — warm (uses Spanish voice)
  vi: 'Leda',    // Vietnamese — clear
  th: 'Leda',    // Thai — clear
};

export const generateAudio = async (
  text: string,
  language: string,
  city: string
): Promise<{ buffer?: Uint8Array; url?: string } | null> => {

  const cleanText = (text || "").trim();
  if (!cleanText) return null;

  // Step 1: Check Supabase cache
  try {
    const cachedUrl = await getCachedAudio(cleanText, language);
    if (cachedUrl) {
      console.log(`[Audio] Supabase cache HIT`);
      return { url: cachedUrl };
    }
  } catch (e) {
    console.warn("[Audio] Supabase cache check failed:", e);
  }

  // Step 2: Check local IndexedDB cache (offline)
  try {
    const cacheKey = `${language}_${cleanText.slice(0, 50)}`;
    const localBuffer = await getAudioOffline(cacheKey);
    if (localBuffer) {
      console.log(`[Audio] Local cache HIT`);
      return { buffer: localBuffer };
    }
  } catch (e) {
    console.warn("[Audio] Local cache check failed:", e);
  }

  // Step 3: Generate new audio
  const voiceName = VOICE_MAP[language] || 'Kore';

  let base64 = "";
  try {
    base64 = await handleAiCall(async () => {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const prompt = language === 'es' || language === 'ca' || language === 'eu'
        ? `Actúa como DAI, guía elegante y sarcástica. Di esto de forma natural y divertida: ${cleanText}`
        : `Act as DAI, an elegant and sarcastic travel guide. Say this naturally and engagingly: ${cleanText}`;

      const response = await ai.models.generateContent({
        model: MODEL_TTS,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    });
  } catch (e) {
    console.error("[Audio] Generation failed:", e);
    return null;
  }

  if (!base64) {
    console.warn("[Audio] Empty base64 returned");
    return null;
  }

  // Decode base64 → Uint8Array
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  // Step 4: Save to both caches (Supabase + local)
  try {
    await saveAudioToCache(cleanText, language, bytes, city);
    console.log(`[Audio] Saved to Supabase cache`);
  } catch (e) {
    console.error("[Audio] Supabase save FAILED (audio still plays):", e);
  }

  try {
    const cacheKey = `${language}_${cleanText.slice(0, 50)}`;
    await saveAudioOffline(cacheKey, bytes);
  } catch (e) {
    console.warn("[Audio] Local save failed:", e);
  }

  return { buffer: bytes };
};

// ─── OTHER UTILITIES ──────────────────────────────────────────────────────────

export const generateDaiWelcome = async (user: UserProfile): Promise<string> => {
  return handleAiCall(async () => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `As DAI, welcome ${user.firstName || 'Traveler'} in ${user.language}.
They start at rank ZERO. They must explore cities to reach ZENITH.
Be sarcastic, witty, elegant. Under 80 words.`,
    });
    return response.text || "Welcome to bdai.";
  });
};

export const translateToursBatch = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
  return handleAiCall(async () => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Translate this tour data to ${targetLanguage}. Keep all JSON structure and technical photo advice intact. Return only valid JSON array.\n${JSON.stringify(tours)}`,
      config: { responseMimeType: "application/json" }
    });
    const text = (response.text || "[]").replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  });
};

export const moderateContent = async (text: string): Promise<boolean> => {
  return handleAiCall(async () => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Is this text safe for a travel app? "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { isSafe: { type: Type.BOOLEAN } }
        }
      }
    });
    return JSON.parse(response.text || '{"isSafe":true}').isSafe;
  });
};

export const checkApiStatus = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: "Reply with just the word OK",
    });
    return response.text
      ? { ok: true,  message: "API responding" }
      : { ok: false, message: "Empty response" };
  } catch (e: any) {
    return { ok: false, message: e.message || "API error" };
  }
};

export const generateCityPostcard = async (city: string, _interests: string[]): Promise<string | null> => {
  return handleAiCall(async () => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: MODEL_IMG,
      contents: { parts: [{ text: `Travel postcard of ${city}, cinematic, dark moody aesthetic` }] },
      config: { imageConfig: { aspectRatio: "9:16" } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
  });
};
