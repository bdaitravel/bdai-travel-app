
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tour, Stop, UserProfile } from '../types';
import { getCachedTours, saveToursToCache, getCachedAudio, saveAudioToCache, normalizeKey } from './supabaseClient';

const LANGUAGE_RULES: Record<string, string> = {
    es: "PERSONALIDAD: Eres Dai, analista senior de BDAI. ESTILO: CÍNICO, NARRATIVO, HIPER-DETALLISTA. ENFOQUE: Historia profunda, salseo histórico (chismes de época), leyendas urbanas y secretos culturales. REGLA CRÍTICA: Cada descripción de parada DEBE ser extensa y profunda, superando las 450 palabras por parada. EVITA términos de ingeniería o arquitectura técnica aburrida; busca el drama humano, los secretos y el misterio. RESPONDE EXCLUSIVAMENTE EN ESPAÑOL DE ESPAÑA.",
    en: "PERSONALITY: You are Dai, senior analyst for BDAI. STYLE: CYNICAL, NARRATIVE, HYPER-DETAILED. FOCUS: Deep history, historical gossip, urban legends, and cultural secrets. CRITICAL RULE: Each stop description MUST exceed 450 words. AVOID boring engineering or technical terms; focus on drama and mystery. RESPOND EXCLUSIVELY IN ENGLISH.",
    ca: "PERSONALITAT: Ets la Dai, analista sènior de BDAI. ESTIL: Cínic i narratiu. ENFOCAMENT: Història profunda, llegendes i secrets culturals. REGLA: Cada descripció ha de superar les 450 paraules. RESPON EXCLUSIVAMENT EN CATALÀ.",
    eu: "NORTASUNA: Dai zara, BDAI-ko analista seniorra. ESTILOA: Zinikoa eta narratiboa. ENFOKEA: Historia sakona, kondairak eta sekretu kulturalak. ARAUA: Deskribapen bakoitzak 450 hitz baino gehiago izan behar ditu. ERANTZUN BAKARRIK EUSKARAZ.",
    fr: "PERSONNALITÉ: Vous êtes Dai, analyste senior de BDAI. STYLE: Cynique et narratif. FOCUS: Histoire profonde, légendes et secrets culturals. RÈGLE: Chaque description doit dépasser 450 mots. RÉPONDEZ EXCLUSIVEMENT EN FRANÇAIS.",
    de: "PERSÖNLICHKEIT: Sie sind Dai, leitender Analyst bei BDAI. STIL: Zynisch, narrativ, hyper-detailliert. FOKUS: Tiefe Geschichte, historischer Klatsch, urbane Legenden und kulturelle Geheimnisse. KRITISCHE REGEL: Jede Stopp-Beschreibung MUSS über 450 Wörter umfassen. VERMEIDEN Sie langweilige Technikbegriffe; konzentrieren Sie sich auf Drama und Geheimnisse. ANTWORTEN SIE AUSSCHLIESSLICH AUF DEUTSCH.",
    ja: "パーソナリティ：あなたはBDAIのシニアアナリスト、Daiです。スタイル：冷笑的、物語的、非常に詳細。フォーカス：深い歴史、歴史的なゴシップ、都市伝説、文化的な秘密。重要なルール：各スポットの説明は450語を超える必要があります。退屈な工学用語は避け、人間ドラマとミステリーに焦点を当ててください。日本語のみで回答してください。",
    zh: "性格：你是 BDAI 的资深分析师 Dai。风格：愤世嫉俗、叙事性强、注重细节。重点：深度历史、历史八卦、都市传说和文化秘密。关键规则：每个站点的描述必须超过450个单词。避免枯燥的工程术语；专注于戏剧性和神秘感。请仅用中文回答。",
    ar: "الشخصية: أنت داي، كبير المحللين في BDAI. الأسلوب: ساخر، سردي، مفصل للغاية. التركيز: التاريخ العميق، القصص التاريخية المشوقة، الأساطير الحضرية والأسرار الثقافية. قاعدة حرجة: يجب أن يتجاوز وصف كل محطة 450 كلمة. تجنب المصطلحات الهندسية المملة؛ ركز على الدراما والغموض. أجب باللغة العربية حصرياً."
};

async function callAiWithRetry(fn: () => Promise<any>, retries = 4, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            const errorMsg = error.message || "";
            const isRetryable = errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('429') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('deadline');
            
            if (isRetryable && i < retries - 1) {
                console.warn(`[BDAI] Reintentando petición pesada (${i + 1}/${retries})...`);
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
            }
            throw error;
        }
    }
}

export const cleanDescriptionText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\*\*/g, '').replace(/###/g, '').replace(/#/g, '').replace(/\*/g, '').trim();
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
            contents: `Identify the intended city from: "${input}". 
            REGLAS:
            1. Sé extremadamente tolerante a erratas, falta de letras o idiomas.
            2. Si el nombre es un PAÍS, elige su CAPITAL.
            3. Si el nombre es AMBIGUO (existe en varios países), devuelve las opciones más importantes (máximo 5).
            4. Devuelve los nombres en ESPAÑOL.`,
            config: { 
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Nombre de la ciudad en español" },
                            country: { type: Type.STRING, description: "Nombre del país en español" }
                        },
                        required: ["name", "country"]
                    }
                }
            }
        }));
        const parsed = JSON.parse(response.text || "[]");
        return parsed.length > 0 ? parsed : [{ name: input, country: "" }];
    } catch (e) { 
        return [{ name: input, country: "" }]; 
    }
};

export const translateTours = async (tours: Tour[], targetLanguage: string): Promise<Tour[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Traduce este array de tours al idioma "${targetLanguage}".
    REGLAS:
    1. Mantén la personalidad de Dai: Cínica, detallista y narrativa.
    2. NO cambies coordenadas (lat/lng), IDs ni tipos.
    3. Traduce todos los campos de texto: title, description, name, theme, angle, secretLocation.
    4. Devuelve exactamente el mismo formato JSON.`;

    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `${prompt}\n\nDATA: ${JSON.stringify(tours)}`,
            config: { 
                temperature: 0.3,
                responseMimeType: "application/json"
            }
        }));
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Translation error:", e);
        return tours; // Fallback al original si falla
    }
};

export const getGreetingContext = async (city: string, language: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Greeting for ${city} in ${language}. Max 10 words.`,
            config: { temperature: 0.7 }
        }));
        return response.text?.trim() || "";
    } catch (e) { return ""; }
};

export const generateToursForCity = async (cityInput: string, countryInput: string, userProfile: UserProfile, contextGreeting?: string, skipEssential: boolean = false): Promise<Tour[]> => {
  const langRule = LANGUAGE_RULES[userProfile.language] || LANGUAGE_RULES.es;
  const interestsStr = userProfile.interests.join(", ") || "historia y cultura";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Genera exactamente 3 TOURS para la ciudad de ${cityInput} en el país de ${countryInput}. 
  Intereses del usuario: [${interestsStr}].
  REGLAS CRÍTICAS:
  1. UBICACIÓN: Asegúrate de que todas las paradas existan realmente en ${cityInput}, ${countryInput}. No mezcles con otras ciudades del mismo nombre en otros países.
  2. PARADAS: Exactamente 10 paradas por cada tour.
  3. DESCRIPCIÓN: Cada parada DEBE tener un texto de al menos 450 palabras.
  4. TEMÁTICA: Salseo histórico, secretos, leyendas urbanas y drama humano.
  5. FORMATO: JSON estricto.`;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        duration: { type: Type.STRING },
        distance: { type: Type.STRING },
        theme: { type: Type.STRING },
        isEssential: { type: Type.BOOLEAN },
        stops: {
          type: Type.ARRAY,
          minItems: 10,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              type: { type: Type.STRING, enum: ["historical", "food", "art", "nature", "photo", "culture", "architecture"] },
              photoSpot: {
                type: Type.OBJECT,
                properties: { angle: { type: Type.STRING }, milesReward: { type: Type.NUMBER }, secretLocation: { type: Type.STRING } },
                required: ["angle", "milesReward", "secretLocation"]
              }
            },
            required: ["name", "description", "latitude", "longitude", "type", "photoSpot"]
          }
        }
      },
      required: ["title", "description", "duration", "distance", "theme", "stops"]
    }
  };

  try {
    const response = await callAiWithRetry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: { 
            systemInstruction: langRule,
            responseMimeType: "application/json", 
            responseSchema: responseSchema,
            maxOutputTokens: 40000, 
            temperature: 0.8
        }
    }));
    
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((t: any, idx: number) => ({
        ...t, id: `tour_${idx}_${Date.now()}`, city: cityInput, difficulty: 'Moderate',
        stops: t.stops.map((s: any, sIdx: number) => ({ ...s, id: `s_${idx}_${sIdx}_${Date.now()}`, visited: false }))
    }));
  } catch (error) { throw error; }
};

export const generateAudio = async (text: string, language: string = 'es', city: string = 'global'): Promise<string> => {
  const cleanText = cleanDescriptionText(text).substring(0, 4000);
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
            contents: `Appropriate? "${text}". Return SAFE or UNSAFE.`,
            config: { temperature: 0 }
        }));
        return response.text?.trim().toUpperCase() === "SAFE";
    } catch (e) { return true; }
};

export const generateCityPostcard = async (city: string, interests: string[]): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Vertical travel postcard of ${city}, focus on ${interests.join(', ')}. No text.`;
    try {
        const response = await callAiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "9:16" } }
        }));
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return null;
    } catch (e) { return null; }
};
