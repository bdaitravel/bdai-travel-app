
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedTours, saveToursToCache, getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, analista senior de BDAI. ESTILO: CÍNICO, NARRATIVO, HIPER-DETALLISTA. ENFOQUE: Historia profunda, salseo histórico (chismes de época), leyendas urbanas y secretos culturales. REGLA CRÍTICA: Cada descripción de parada DEBE ser extensa y profunda, superando las 450 palabras por parada. EVITA términos de ingeniería o arquitectura técnica aburrida; busca el drama humano, los secretos y el misterio. RESPONDE EXCLUSIVAMENTE EN ESPAÑOL DE ESPAÑA.",
    en: "PERSONALITY: You are Dai, senior analyst for BDAI. STYLE: CYNICAL, NARRATIVE, HYPER-DETAILED. FOCUS: Deep history, historical gossip, urban legends, and cultural secrets. CRITICAL RULE: Each stop description MUST exceed 450 words. AVOID boring engineering or technical terms; focus on drama and mystery. RESPOND EXCLUSIVELY IN ENGLISH.",
    ca: "PERSONALITAT: Ets la Dai, analista sènior de BDAI. ESTIL: CÍNIC, NARRATIU, HIPER-DETALLISTA. ENFOCAMENT: Història profunda, xafarderies històriques, llegendes urbanes i secrets culturals. REGLA CRÍTICA: Cada descripció de parada HA DE ser extensa i profunda, superant les 450 paraules per parada. RESPON EXCLUSIVAMENT EN CATALÀ.",
    eu: "PERTSONALITATEA: Dai zara, BDAIko analista seniorra. ESTILOA: ZINIKOA, NARRATIBOA, HIPER-XEHETASUNA. ENFOKEA: Historia sakona, garaiko esanak, hiri-kondairak eta sekretu kulturalak. ARAU KRITIKOA: Geltoki bakoitzaren deskribapenak luzea eta sakona IZAN BEHAR DU, 450 hitz baino gehiago geltoki bakoitzeko. ERANTZUN BAKARRIK EUSKARAZ.",
    fr: "PERSONNALITÉ : Vous êtes Dai, analyste senior pour BDAI. STYLE : CYNIQUE, NARRATIF, HYPER-DÉTAILLÉ. OBJECTIF : Histoire profonde, potins historiques, légendes urbaines et secrets culturels. RÈGLE CRITIQUE : Chaque description d'arrêt DOIT être longue et détaillée, dépassant 450 mots par arrêt. RÉPONDEZ EXCLUSIVEMENT EN FRANÇAIS.",
    de: "PERSÖNLICHKEIT: Du bist Dai, Senior Analyst bei BDAI. STIL: ZYNISCH, NARRATIV, HYPER-DETAILLIERT. FOKUS: Tiefe Geschichte, historischer Klatsch, urbane Legenden und kulturelle Geheimnisse. KRITISCHE REGEL: Jede Haltestellenbeschreibung MUSS lang und detailliert sein und 450 Wörter pro Haltestelle überschreiten. ANTWORTEN SIE AUSSCHLIESSLICH AUF DEUTSCH.",
    ja: "パーソナリティ：あなたはBDAIのシニアアナリスト、Daiです。スタイル：皮肉屋、叙述的、超詳細。フォーカス：深い歴史、歴史的な噂話、都市伝説、文化的秘密。重要なルール：各スポットの説明は、1スポットあたり450語を超える詳細なものでなければなりません。日本語のみで回答してください。",
    zh: "个性：你是 BDAI 的高级分析师 Dai。风格：愤世嫉俗、叙事性、超详细。重点：深层历史、历史八卦、都市传说和文化秘密。关键规则：每个站点的描述必须详尽深刻，每个站点超过 450 个字。仅用中文回答。",
    ar: "الشخصية: أنت داي، كبير المحللين في BDAI. الأسلوب: ساخر، سردي، فائق التفصيل. التركيز: التاريخ العميق، والقصص التاريخية، والأساطير الحضرية، والأسرار الثقافية. قاعدة حاسمة: يجب أن يكون وصف كل محطة واسعًا وعميقًا، ويتجاوز 450 كلمة لكل محطة. أجب حصريًا باللغة العربية."
};

async function callAiWithRetry(fn: () => Promise<any>, retries = 4, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const errorMsg = error.message || "";
            const isRetryable = errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('429') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('deadline');
            if (isRetryable && i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
            }
            throw error;
        }
    }
}

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text
        .replace(/\*\*/g, '')
        .replace(/###/g, '')
        .replace(/##/g, '')
        .replace(/#/g, '')
        .replace(/\*/g, '')
        .replace(/_/g, '')
        .replace(/`/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/\n\n/g, '. ')
        .replace(/\n/g, ' ')
        .replace(/\s\s+/g, ' ')
        .trim();
};

const generateHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
  }
  return Math.abs(hash).toString(36);
};

export const standardizeCityName = async (input: string): Promise<{name: string, country: string}[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Identify the intended city from: "${input}". REGLAS: 1. Tolerante a erratas. 2. País = Capital. 3. Ambiguo = Opciones. 4. Devuelve en español.`,
            config: { 
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            country: { type: Type.STRING }
                        },
                        required: ["name", "country"]
                    }
                }
            }
        }));
        return JSON.parse(response.text || "[]");
    } catch (e) { return [{ name: input, country: "" }]; }
};

export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile, contextGreeting?: string, skipEssential: boolean = false): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const interestsStr = userProfile.interests.join(", ") || "historia y cultura";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Genera 3 TOURS para ${cityInput}, ${countryInput}. Intereses: [${interestsStr}]. 10 paradas. 450 palabras/parada. JSON estricto.`;

  try {
    const response = await callAiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
            systemInstruction: langRule,
            responseMimeType: "application/json", 
            maxOutputTokens: 40000, 
            temperature: 0.8
        }
    }));
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput,
        stops: t.stops.map((s: any, sIdx: number) => ({ 
            ...s, 
            id: `s_${idx}_${sIdx}_${Date.now()}`, 
            visited: false,
            photoSpot: { ...s.photoSpot, milesReward: 50 } 
        }))
    }));
  } catch (error) { throw error; }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text);
  if (!cleanText) return "";
  
  const textHash = generateHash(cleanText);
  const cacheKey = `audio_${language}_${textHash}`;
  const cached = await getCachedAudio(cacheKey);
  if (cached) return cached;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await callAiWithRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    }));
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    if (audioData) saveAudioToCache(cacheKey, audioData).catch(console.error);
    return audioData;
  } catch (e) { return ""; }
};

export const moderateContent = async (text: string): Promise<boolean> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze text safety. TEXT: "${text}"`,
            config: { temperature: 0 }
        }));
        return response.text?.toLowerCase().includes('safe');
    } catch (e) { return true; } 
};

// Fix: Implemented getGreetingContext to provide a cynical AI-driven introduction to a city.
export const getGreetingContext = async (city: string, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = LANGUAGE_RULES[language] || LANGUAGE_RULES.es;
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Genera un saludo breve (máximo 30 paraulas) y cínico sobre llegar a la ciudad de ${city}.`,
            config: { 
                systemInstruction: langRule,
                temperature: 0.8
            }
        }));
        return response.text || "";
    } catch (e) { return ""; }
};

// Fix: Implemented translateTours to allow mass translation of cached intelligence into other supported languages.
export const translateTours = async (tours: Tour[], targetLang: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langRule = LANGUAGE_RULES[targetLang] || LANGUAGE_RULES.es;
    const prompt = `Translate the following array of tours into ${targetLang}. Preserve the JSON structure exactly. Ensure stop descriptions remain long and detailed (over 450 words) as per the system instruction. TOURS: ${JSON.stringify(tours)}`;
    
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: langRule,
                responseMimeType: "application/json"
            }
        }));
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Translation error:", e);
        return tours;
    }
};

// Fix: Implemented generateCityPostcard using the gemini-2.5-flash-image model for visual content generation.
export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A cinematic, hyper-detailed digital art postcard of ${city} highlighting interests like ${interests.join(', ')}. Style: Noir Travel Illustration, vibrant colors, wide angle.`;
    
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "9:16"
                }
            }
        }));
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Postcard generation error:", e);
        return null;
    }
};
