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

// ── MP3 Encoder (carga lazy en primera petición) ────────────────────────
let Mp3Encoder: any = null;
let mp3Available = false;
let mp3Checked = false;

async function ensureMp3Encoder(): Promise<void> {
  if (mp3Checked) return;
  mp3Checked = true;
  try {
    const mod = await import("npm:lamejs@1.2.1");
    Mp3Encoder = mod?.Mp3Encoder || mod?.default?.Mp3Encoder;
    if (Mp3Encoder) {
      // Test rápido: crear un encoder para verificar que MPEGMode existe
      new Mp3Encoder(1, 24000, 64);
      mp3Available = true;
      console.log("✅ lamejs cargado — modo MP3 activo");
    }
  } catch (e: any) {
    console.warn("⚠️ MP3 no disponible, usando WAV:", e?.message || e);
    mp3Available = false;
  }
}

function encodePcmToMp3(pcmData: Uint8Array, sampleRate = 24000, bitrate = 64): Uint8Array {
  const int16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2);
  const encoder = new Mp3Encoder(1, sampleRate, bitrate);
  const maxSamples = 1152;
  const chunks: Int8Array[] = [];
  for (let i = 0; i < int16.length; i += maxSamples) {
    const buf = encoder.encodeBuffer(int16.subarray(i, i + maxSamples));
    if (buf.length > 0) chunks.push(buf);
  }
  const flush = encoder.flush();
  if (flush.length > 0) chunks.push(flush);
  const totalLen = chunks.reduce((a, c) => a + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), offset);
    offset += chunk.length;
  }
  return result;
}

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
    // Intentar cargar MP3 encoder (solo una vez, lazy)
    await ensureMp3Encoder();
    console.log(`Modo encoding: ${mp3Available ? 'MP3 (64kbps)' : 'WAV'}`);

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

    // ACENTO PENINSULAR: anteponemos un prefijo fonético al texto para guiar
    // al modelo TTS hacia entonación castellana de España.
    // El prefijo NO se incluye en el hash (calculado antes) para no invalidar caché.
    const isSpanish = lang === 'es' || lang.startsWith('es-');
    const ttsText = isSpanish
        ? `[Locutora española de España, acento castellano peninsular, entonación de Madrid]\n\n${cleanText}`
        : cleanText;

    const googleReq: any = {
      contents: [{ role: "user", parts: [{ text: ttsText }] }],
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
        'Referer': 'https://app.bdai.travel/' 
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

    const rawPcm = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));

    // 2.5. ENCODING: MP3 si disponible, WAV como fallback seguro
    let audioBuffer: Uint8Array;
    let fileExt: string;
    let contentType: string;

    if (mp3Available) {
      try {
        console.log("Codificando a MP3 (64kbps)...");
        audioBuffer = encodePcmToMp3(rawPcm);
        fileExt = "mp3";
        contentType = "audio/mpeg";
        console.log(`PCM: ${rawPcm.length} bytes → MP3: ${audioBuffer.length} bytes (${Math.round(100 - audioBuffer.length / rawPcm.length * 100)}% reducción)`);
      } catch (encErr: any) {
        console.error("❌ Error en MP3 encoding, usando WAV:", encErr?.message);
        audioBuffer = addWavHeader(rawPcm);
        fileExt = "wav";
        contentType = "audio/wav";
      }
    } else {
      audioBuffer = addWavHeader(rawPcm);
      fileExt = "wav";
      contentType = "audio/wav";
    }

    // 3. STORAGE
    const safeCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${safeCity}/${lang}/${Date.now()}.${fileExt}`;
    console.log(`Subiendo a Storage: ${fileName}...`);

    const { error: uploadError } = await supabaseClient.storage
      .from('audios')
      .upload(fileName, audioBuffer, {
        contentType,
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
