import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

function addWavHeader(pcmData: Uint8Array): Uint8Array {
  const numChannels = 1;
  const sampleRate = 24000;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const chunkSize = 36 + dataSize;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  view.setUint32(0, 0x52494646, false); view.setUint32(4, chunkSize, true);
  view.setUint32(8, 0x57415645, false); view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true); view.setUint32(36, 0x64617461, false);
  view.setUint32(40, dataSize, true);
  const result = new Uint8Array(44 + dataSize);
  result.set(new Uint8Array(header), 0);
  result.set(pcmData, 44);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  console.log("--- NUEVA PETICIÓN DE AUDIO RECIBIDA ---");
  try {
    // Fix: Usar MY_SERVICE_ROLE_KEY con fallback (bug conocido de Deno donde SUPABASE_SERVICE_ROLE_KEY llega vacío)
    const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!serviceKey) {
      throw new Error("ERROR CRÍTICO: Falta la llave Service Role. Crea el secreto MY_SERVICE_ROLE_KEY.");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      serviceKey,
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { text, language, city } = body;
    console.log("Parámetros:", { city, language, textLength: text?.length });

    if (!text || !language || !city) throw new Error('Parámetros incompletos');

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('ERROR CRÍTICO: Falta GEMINI_API_KEY.');

    const cleanText = text.replace(/[*_~`]/g, '');
    const lang = language.toLowerCase();
    
    // HASH SHA-256 (Robusto para evitar colisiones como la de Logroño/Aldeanueva)
    const msgUint8 = new TextEncoder().encode(cleanText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const textHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 1. INTENTO CACHÉ
    console.log("🔍 Buscando en caché...");
    const { data: cached } = await supabaseClient
      .from('audio_cache')
      .select('url')
      .eq('text_hash', textHash)
      .eq('language', lang)
      .maybeSingle();

    if (cached?.url) {
      console.log("✅ Audio encontrado en caché.");
      return new Response(JSON.stringify({ url: cached.url }), { headers: jsonHeaders });
    }

    // 2. GENERACIÓN GOOGLE (con timeout de 120s para evitar EarlyDrop)
    console.log("🎙️ No está en caché. Llamando a Gemini TTS...");
    const modelName = "gemini-2.5-flash-preview-tts"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const langCodeMap: Record<string, string> = {
      es: "es-ES", en: "en-US", fr: "fr-FR", de: "de-DE",
      it: "it-IT", pt: "pt-PT", nl: "nl-NL", ro: "ro-RO",
      pl: "pl-PL", sv: "sv-SE", da: "da-DK", fi: "fi-FI",
      no: "nb-NO", ru: "ru-RU", zh: "zh-CN", ja: "ja-JP",
      ko: "ko-KR", ar: "ar-XA", hi: "hi-IN", th: "th-TH",
      vi: "vi-VN", ca: "ca-ES", eu: "eu-ES", tr: "tr-TR"
    };
    const googleLangCode = langCodeMap[lang] || lang;
    const targetVoice = "Kore"; // Voz oficial DAI

    const googleReq: any = {
      contents: [{ role: "user", parts: [{ text: cleanText }] }],
      generationConfig: {
         responseModalities: ["AUDIO"],
         speechConfig: { 
            voiceConfig: { prebuiltVoiceConfig: { voiceName: targetVoice } },
            languageCode: googleLangCode
         }
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Referer': 'https://www.bdai.travel/' 
      },
      body: JSON.stringify(googleReq),
      signal: AbortSignal.timeout(120_000) // 120s timeout para evitar cuelgues
    });

    if (!response.ok) {
        const errTxt = await response.text();
        console.error("❌ Error Google API:", response.status, errTxt);
        throw new Error(`Google API respondió con status ${response.status}`);
    }

    const resJson = await response.json();
    const audioBase64 = resJson.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
    
    if (!audioBase64) {
        console.error("Respuesta Google sin audio:", JSON.stringify(resJson));
        throw new Error('No se recibió audio de Google');
    }

    console.log("Audio recibido. Procesando WAV...");
    const rawPcm = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const wavBuffer = addWavHeader(rawPcm);

    // 3. STORAGE
    const safeCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${safeCity}/${lang}/${Date.now()}.wav`;
    console.log(`Subiendo a Storage: ${fileName}...`);

    const { error: uploadError } = await supabaseClient.storage
      .from('audios')
      .upload(fileName, wavBuffer, {
        contentType: 'audio/wav',
        upsert: true
      });

    if (uploadError) {
        console.error("Error subiendo a Storage:", uploadError);
        throw new Error('Fallo al guardar archivo en Storage');
    }

    const { data: pUrl } = supabaseClient.storage.from('audios').getPublicUrl(fileName);
    console.log("Archivo guardado. URL pública generada.");

    // 4. ACTUALIZAR CACHÉ DB
    await supabaseClient.from('audio_cache').upsert({
      text_hash: textHash,
      language: lang,
      url: pUrl.publicUrl,
      city: safeCity,
      text_fragment: cleanText.substring(0, 100)
    });

    console.log("Proceso completado con éxito.");
    return new Response(JSON.stringify({ url: pUrl.publicUrl }), { headers: jsonHeaders });

  } catch (error: any) {
    console.error("ERROR FINAL:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: jsonHeaders, 
      status: 500 
    });
  }
});
