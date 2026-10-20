# Edge Function: `generate-audio-gcp`

Autenticación: **API Key de Gemini** (`GEMINI_API_KEY`, mismo secreto que ya usa `search-city.md`), vía `?key=` en la URL + cabecera `Referer` fija para esquivar la restricción de HTTP referrer de la key.

**⚠️ Historial — por qué NO se usa Service Account OAuth2 (20-oct-2026):** Esta función usó brevemente un flujo de Service Account (JWT firmado → access token OAuth2 → `Authorization: Bearer`) para evitar las restricciones de referrer de la API Key. Dejó de funcionar con un 403 sistemático; el cuerpo real de la respuesta de Google (visible solo en los logs de la edge function, no en el error que llega al cliente) era:

```json
{"error":{"code":403,"message":"Access to Gemini API is restricted with service accounts. Use authorization keys instead. https://docs.cloud.google.com/docs/authentication/api-keys#api-keys-bound-sa","status":"PERMISSION_DENIED"}}
```

Es decir: Google **prohíbe explícitamente** autenticar contra el Gemini API público (`generativelanguage.googleapis.com`) con un bearer token OAuth2 de Service Account — exige una API Key (opcionalmente una "API key bound to a service account", que es un mecanismo distinto, no un bearer token plano). No es arreglable ajustando roles IAM en el proyecto GCP: es una restricción de la propia API. **No reintroducir el flujo de Service Account/JWT en esta función.**

## Quién la usa

- **Cliente en vivo**: `TourCard.tsx` → `geminiService.ts::generateAudio()` — botón ▶️ cuando una parada no tiene audio cacheado (caso raro, ya que `generate-tour-audios` pre-genera el audio de toda ciudad nueva automáticamente).
- **Script manual**: `scripts/generategcpallaudios.ts` (y `scripts/generateGcpAudiosdia.ts`, `scripts/runCityPipeline.ts`) — todos invocan esta función por su nombre vía Supabase, sin autenticación propia contra Google (la auth vive solo aquí dentro).

## Relación con `generate-tour-audios`

`generate-tour-audios` (el pipeline automático que genera audio en cuanto un tour pasa a `status: 'READY'`, ver `services/supabase/edge-functions/generate-tour-audios.md`) **ya no duplica esta lógica**: por cada parada pendiente invoca esta función (`supabaseClient.functions.invoke('generate-audio-gcp', { body: { text, language, city } })`), exactamente igual que hacen los scripts manuales (`generategcpallaudios.ts`, etc.). Esta es, por tanto, la **única** implementación real de la síntesis de audio + auth contra Google en todo el sistema — cambiar el método de auth aquí lo cambia automáticamente para todos sus llamadores (botón Play, scripts, y el pipeline automático), sin tener que tocar nada más.

## Código

```typescript
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

// ── NOTA: La edge function siempre genera WAV. ────────────────────────────
// MP3 encoding (lamejs) falla en el runtime de Deno/Supabase Edge Functions.
// La conversión WAV → MP3 se delega al script migrateAudios.ts en Node.js,
// donde @breezystack/lamejs funciona correctamente.
// Beneficio: esta función es más rápida (sin cold-start de lamejs, sin encoding).

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

// ── Fragmentación de texto ────────────────────────────────────────────────
// Gemini TTS falla de forma intermitente (finishReason: "OTHER", sin audio) y
// la probabilidad de fallo crece con la longitud del texto: con ~1150+ chars
// falla casi siempre. No es un límite duro (textos de 1647 chars a veces
// funcionan) ni depende del contenido. Mitigación: fragmentar a máx. 800 chars
// por párrafos/frases, sintetizar cada fragmento con reintentos y concatenar.
function splitTextIntoChunks(text: string, maxLength = 800): string[] {
  const paragraphs = text.split('\n');
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmedP = paragraph.trim();
    if (!trimmedP) continue;

    if ((currentChunk ? currentChunk.length + 1 : 0) + trimmedP.length <= maxLength) {
      currentChunk = currentChunk ? `${currentChunk}\n${trimmedP}` : trimmedP;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }

      if (trimmedP.length > maxLength) {
        const sentences = trimmedP.split(/(?<=\.\s+)/);
        for (const sentence of sentences) {
          const trimmedS = sentence.trim();
          if (!trimmedS) continue;

          if ((currentChunk ? currentChunk.length + 1 : 0) + trimmedS.length <= maxLength) {
            currentChunk = currentChunk ? `${currentChunk} ${trimmedS}` : trimmedS;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            currentChunk = trimmedS;
          }
        }
      } else {
        currentChunk = trimmedP;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// ── Síntesis de un fragmento con reintentos ───────────────────────────────
async function synthesizeChunk(apiUrl: string, ttsChunkText: string, googleLangCode: string, targetVoice: string): Promise<Uint8Array> {
  const googleReq: any = {
    contents: [{ role: "user", parts: [{ text: ttsChunkText }] }],
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
      // La API Key va embebida en apiUrl (?key=...). Este Referer esquiva la
      // restricción de HTTP referrer configurada en la key de Google Cloud.
      'Referer': 'https://app.bdai.travel/'
    },
    body: JSON.stringify(googleReq),
    signal: AbortSignal.timeout(120_000)
  });

  if (!response.ok) {
      // Incluir el cuerpo real de la respuesta de Google en el error lanzado:
      // sin esto, el status code (p.ej. 403) llega al cliente/email de alerta
      // sin el motivo real (p.ej. "PERMISSION_DENIED: ..."), obligando a bucear
      // en los logs de la edge function para diagnosticar cualquier fallo.
      const errTxt = await response.text();
      console.error("❌ Error Google API:", response.status, errTxt);
      throw new Error(`Google API status ${response.status}: ${errTxt.slice(0, 300)}`);
  }

  const resJson = await response.json();
  const audioBase64 = resJson.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

  if (!audioBase64) {
      const finishReason = resJson.candidates?.[0]?.finishReason || 'desconocido';
      console.error(`Respuesta Google sin audio (finishReason: ${finishReason})`);
      throw new Error(`No se recibió audio de Google (finishReason: ${finishReason})`);
  }

  return Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
}

async function synthesizeChunkWithRetry(apiUrl: string, ttsChunkText: string, googleLangCode: string, targetVoice: string, maxAttempts = 3): Promise<Uint8Array> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await synthesizeChunk(apiUrl, ttsChunkText, googleLangCode, targetVoice);
    } catch (err: any) {
      lastError = err;
      console.warn(`⚠️ Fragmento falló (intento ${attempt}/${maxAttempts}): ${err.message}`);
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }
  throw lastError;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  console.log("--- NUEVA PETICIÓN DE AUDIO RECIBIDA ---");
  try {
    const serviceKey = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!serviceKey) {
      throw new Error("ERROR CRÍTICO: Falta la llave Service Role.");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      serviceKey,
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { text, language, city } = body;

    if (!text || !language || !city) throw new Error('Parámetros incompletos');

    const cleanText = text.replace(/[*_~`]/g, '');
    const lang = language.toLowerCase();
    
    const msgUint8 = new TextEncoder().encode(cleanText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const textHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

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

    console.log("🎙️ No está en caché. Llamando a Gemini TTS...");

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('ERROR CRÍTICO: Falta GEMINI_API_KEY en los secretos de la edge function.');

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
    const targetVoice = "Kore"; 

    const isSpanish = lang === 'es' || lang.startsWith('es-');

    // Fragmentar el texto y sintetizar cada fragmento con reintentos.
    // El prefijo de voz para español se aplica a CADA fragmento para que el
    // acento no cambie a mitad del audio.
    const textChunks = splitTextIntoChunks(cleanText, 800);
    console.log(`📄 Texto de ${cleanText.length} chars fragmentado en ${textChunks.length} bloque(s).`);

    const pcmChunks: Uint8Array[] = [];
    for (const chunk of textChunks) {
      const ttsChunkText = isSpanish
          ? `[Locutora española de España, acento castellano peninsular, entonación de Madrid]\n\n${chunk}`
          : chunk;
      const chunkPcm = await synthesizeChunkWithRetry(apiUrl, ttsChunkText, googleLangCode, targetVoice);
      pcmChunks.push(chunkPcm);
    }

    // Concatenar todos los fragmentos de PCM en un único buffer
    const totalPcmLength = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const rawPcm = new Uint8Array(totalPcmLength);
    let pcmOffset = 0;
    for (const chunk of pcmChunks) {
      rawPcm.set(chunk, pcmOffset);
      pcmOffset += chunk.length;
    }

    // Siempre WAV — la conversión a MP3 la hace migrateAudios.ts en Node.js
    const audioBuffer = addWavHeader(rawPcm);
    const fileExt = "wav";
    const contentType = "audio/wav";

    const safeCity = city.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${safeCity}/${lang}/${Date.now()}.${fileExt}`;

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
```
