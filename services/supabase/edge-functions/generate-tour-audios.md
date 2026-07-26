# Edge Function: `generate-tour-audios`

**ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT)** para la edge function `generate-tour-audios`. Se dispara vía Database Webhook en `tours_cache` (INSERT + UPDATE) y genera automáticamente el audio (WAV) de todas las paradas de un tour en cuanto pasa a `status: 'READY'` — sin esperar a que un usuario pulse "Play" ni a ejecutar manualmente `scripts/generategcpallaudios.ts`.

## Diseño: delega en `generate-audio-gcp`, no duplica su lógica (jul-2026)

Antes esta función tenía su **propia copia** de toda la síntesis (fragmentación de texto, reintentos, WAV header, auth contra Google) — el mismo código que `generate-audio-gcp`, pegado dos veces. Eso generó exactamente el problema que cabía esperar: al cambiar el método de auth de una, la otra se quedaba desincronizada si no se recordaba tocar las dos.

**Ahora `generate-tour-audios` no sintetiza nada por sí misma**: por cada parada pendiente, invoca la edge function `generate-audio-gcp` (`supabaseClient.functions.invoke('generate-audio-gcp', { body: { text, language, city } })`), exactamente igual que hacen `scripts/generategcpallaudios.ts` y el resto de scripts manuales. Consecuencias:

- **Un único punto de auth contra Google** para todo el sistema de audio: sea cual sea el método que use `generate-audio-gcp` (Service Account hoy), `generate-tour-audios` lo hereda automáticamente sin tener que tocar nada aquí. Si el día de mañana se cambia el auth en `generate-audio-gcp`, esta función no necesita ningún cambio.
- **Un único sitio con la fragmentación de texto + reintentos** (el fix del bug `finishReason: OTHER`), así que no hay riesgo de que un fix se aplique en un fichero y se olvide en el otro.
- Esta función se queda con lo que de verdad le es propio y que ninguna otra pieza resuelve: enterarse de que un tour pasó a `READY` (webhook), trocear en lotes pequeños para no agotar el tiempo/CPU de una invocación, auto-continuarse hasta terminar, y avisar por email si falla del todo.

## Qué hace

1. El webhook `Trigger Audio Generation` se dispara en cualquier INSERT/UPDATE de `tours_cache`. La función filtra internamente: solo actúa si `record.status === 'READY'`.
2. Aplana todas las paradas (`stops`) de todos los tours **no patrocinados** de ese `city` + `language` (los patrocinados nunca llegan a `tours_cache`, el filtro es solo defensivo).
3. Calcula el `text_hash` (SHA-256) de cada descripción — **idéntico algoritmo** al de `generate-audio-gcp` — y consulta `audio_cache` en batch para saber cuántas paradas quedan pendientes (esto decide el tamaño del lote y si hace falta continuar; la propia `generate-audio-gcp` también comprueba caché internamente, así que esto es solo para planificar lotes, no para evitar llamadas).
4. Procesa un **lote pequeño** de paradas pendientes (`STOP_BATCH_SIZE`, por defecto 2) de forma secuencial, invocando `generate-audio-gcp` por cada una.
5. **Auto-continuación**: si tras el lote quedan paradas pendientes y al menos una se generó con éxito, la función se vuelve a invocar a sí misma (con `EdgeRuntime.waitUntil()`, ver detalle técnico abajo) pasando `{ continue: true, city, language }` para procesar el siguiente lote con un presupuesto de tiempo/CPU fresco. Así se evita que una ciudad con muchas paradas (15-25) agote el límite de una sola invocación.
6. **Válvula de seguridad**: si un lote entero falla (0 éxitos) y aún quedan paradas pendientes, la función **no** se reinvoca — registra un error claro y se detiene, para no entrar en un bucle infinito reintentando una parada rota.
7. **Notificación de fallo por email**: en ese caso de válvula de seguridad, además de detenerse, envía un email a `DAISY_EMAIL` (mismo destinatario que `solicitud-tour`) con asunto `⚠️ BDAI — Fallo generando audio: {city}, {language}`, indicando cuántas paradas quedaron sin audio y el comando manual (`npx tsx scripts/generategcpallaudios.ts --city <slug>`) para terminarlo a mano.
8. Es completamente **idempotente**: puede dispararse muchas veces para la misma ciudad/idioma (cada UPDATE de `tours_cache` la reactiva) sin regenerar nada que ya esté en `audio_cache`.

**Detalle técnico importante sobre la auto-continuación**: la reinvocación (paso 5) usa `EdgeRuntime.waitUntil()`, no un `fetch(...)` suelto sin `await`. Un `fetch` disparado y olvidado corre el riesgo de que el runtime de Supabase congele/mate el isolate en cuanto se envía la `Response` al webhook, cancelando esa petición saliente antes de que llegue a completarse. `EdgeRuntime.waitUntil()` es el mecanismo oficial de Supabase Edge Functions para "background tasks": le dice explícitamente al runtime que mantenga viva esa promesa después de responder. Si alguna vez se reescribe esta función, **no eliminar ese `waitUntil`** ni sustituirlo por un `fetch` "fire and forget" simple — es una causa típica de que las auto-continuaciones dejen de dispararse silenciosamente.

## Configuración en el Dashboard de Supabase

- **Nombre de la función**: `generate-tour-audios`
- **Secrets usados** (todos ya existentes, ninguno nuevo que crear): `MY_SERVICE_ROLE_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`), `SUPABASE_URL`, y para el email de fallo (compartidos con `solicitud-tour`/`notify-tour-ready`): `SMTP_HOSTNAME`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `DAISY_EMAIL`. **Ya no necesita `GEMINI_API_KEY` ni `GCP_SERVICE_ACCOUNT`** — esos solo los usa `generate-audio-gcp`, a la que esta función invoca.
- **Webhook**: ver `services/supabase/database-webhooks/trigger-audio-generation.md`

## Código

```typescript
// services/supabase/edge-functions/generate-tour-audios.md
// ESTE ARCHIVO ES LA FUENTE DE LA VERDAD (SSOT) PARA LA EDGE FUNCTION 'generate-tour-audios'
// Se dispara vía Database Webhook en tours_cache (INSERT + UPDATE).
// Cuando status = 'READY', invoca generate-audio-gcp por cada parada pendiente
// de ese city+language, en lotes pequeños, auto-reinvocándose hasta terminar.
// NO sintetiza audio por sí misma (delega en generate-audio-gcp) ni convierte a MP3.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import nodemailer from "https://esm.sh/nodemailer@6.9.13";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

// Paradas procesadas secuencialmente por invocación antes de decidir si continuar.
// Mantenerlo bajo (1-3): cada parada puede tardar 20-40s (TTS + reintentos dentro
// de generate-audio-gcp) y las Edge Functions de Supabase tienen una cuota de
// tiempo/CPU por invocación.
const STOP_BATCH_SIZE = 2;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_KEY  = Deno.env.get('MY_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Mismos secrets SMTP que solicitud-tour / notify-tour-ready — reutilizados aquí
// para avisar por email cuando la generación de audio de una ciudad falla del todo.
const SMTP_HOSTNAME = Deno.env.get('SMTP_HOSTNAME') || '';
const SMTP_PORT     = parseInt(Deno.env.get('SMTP_PORT') || '465');
const SMTP_USER     = Deno.env.get('SMTP_USER') || '';
const SMTP_PASS     = Deno.env.get('SMTP_PASS') || '';
const DAISY_EMAIL   = Deno.env.get('DAISY_EMAIL') || '';

/** Avisa por email (mismo destinatario que las solicitudes de tour) cuando la generación de audio se detiene por fallo. */
async function notifyAudioFailure(city: string, language: string, remaining: number, lastError: string): Promise<void> {
  if (!SMTP_HOSTNAME || !DAISY_EMAIL) {
    console.warn('[generate-tour-audios] SMTP/DAISY_EMAIL no configurados — no se puede notificar el fallo por email.');
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOSTNAME,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      tls: { rejectUnauthorized: true }
    });

    await transporter.sendMail({
      from: `"BDAI System" <${SMTP_USER}>`,
      to: DAISY_EMAIL,
      subject: `⚠️ BDAI — Fallo generando audio: ${city}, ${language}`,
      html: `
        <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; max-width: 600px; border: 1px solid #1e293b;">
          <h2 style="color: #f87171; margin-top: 0; font-size: 20px;">⚠️ Fallo generando audio</h2>
          <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Ciudad:</strong> ${city}</p>
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Idioma:</strong> ${language}</p>
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Paradas sin audio:</strong> ${remaining}</p>
            <p style="margin: 5px 0;"><strong style="color: #94a3b8;">Último error:</strong> ${lastError}</p>
          </div>
          <p style="font-size: 13px; color: #cbd5e1;">
            La generación automática se ha detenido para no reintentar en bucle. Ejecuta manualmente:
            <code style="background:#1e293b; padding: 2px 6px; border-radius: 4px;">npx tsx scripts/generategcpallaudios.ts --city ${city}</code>
          </p>
          <p style="font-size: 11px; color: #475569; margin-top: 20px; border-top: 1px solid #334155; padding-top: 20px;">
            Este es un correo automático del sistema de audio de BDAI.
          </p>
        </div>
      `,
    });
    console.log(`[generate-tour-audios] Email de fallo enviado a ${DAISY_EMAIL} para ${city} [${language}]`);
  } catch (mailErr: any) {
    console.error('[generate-tour-audios] No se pudo enviar el email de fallo:', mailErr.message);
  }
}

// ── Hash idéntico al de generate-audio-gcp / scripts/lib/audioInventory ───
// Se usa solo para planificar el lote (cuántas paradas quedan pendientes),
// no para evitar la llamada: generate-audio-gcp ya comprueba su propia caché.
async function textHash(text: string): Promise<string> {
  const clean = text.replace(/[*_~`]/g, '').trim();
  const msgUint8 = new TextEncoder().encode(clean);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface Stop { id?: string; name: string; description: string; [k: string]: unknown; }
interface Tour { id?: string; isSponsored?: boolean; stops: Stop[]; [k: string]: unknown; }

/** Delega la síntesis de una parada en generate-audio-gcp. Lanza si falla o no devuelve URL. */
async function generateStopAudio(supabaseClient: any, stop: Stop, lang: string, citySlug: string): Promise<void> {
  const { data, error } = await supabaseClient.functions.invoke('generate-audio-gcp', {
    body: { text: stop.description, language: lang, city: citySlug },
  });
  if (error) throw new Error(error.message || JSON.stringify(error));
  if (!data?.url) throw new Error('generate-audio-gcp no devolvió URL de audio.');
}

/**
 * Dispara la siguiente ronda sin bloquear la respuesta HTTP al webhook.
 * IMPORTANTE: no basta con "fetch(...) sin await" — el runtime de Supabase Edge
 * Functions puede congelar/matar el isolate en cuanto se envía la Response,
 * cancelando cualquier promesa aún no resuelta. Hay que registrar explícitamente
 * la promesa con `EdgeRuntime.waitUntil()` para que el runtime la mantenga viva
 * en segundo plano tras responder (mecanismo oficial de "background tasks").
 */
function scheduleContinuation(city: string, language: string): void {
  const p = fetch(`${SUPABASE_URL}/functions/v1/generate-tour-audios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ continue: true, city, language }),
  }).catch(e => console.error('⚠️ No se pudo programar la continuación:', e.message));

  // @ts-ignore — EdgeRuntime es un global inyectado por el runtime de Supabase, no por Deno estándar.
  if (typeof EdgeRuntime !== 'undefined') {
    // @ts-ignore
    EdgeRuntime.waitUntil(p);
  } else {
    // Fallback local (no debería darse en producción, solo si se ejecuta fuera del Edge Runtime).
    p.catch(() => {});
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!SERVICE_KEY) throw new Error('ERROR CRÍTICO: Falta la llave Service Role.');

    const supabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const body = await req.json();

    let citySlug: string;
    let language: string;
    let tours: Tour[] | null = null;

    if (body?.continue) {
      // ── Continuación de un lote anterior ────────────────────────────────
      citySlug = body.city;
      language = body.language;
      console.log(`[generate-tour-audios] Continuación: ${citySlug} [${language}]`);
    } else {
      // ── Llamada real del Database Webhook ───────────────────────────────
      const record = body?.record;
      if (!record) return new Response('No record in payload', { status: 400, headers: jsonHeaders });

      if (record.status !== 'READY') {
        return new Response('Not READY, skipping.', { status: 200, headers: jsonHeaders });
      }

      citySlug = record.city;
      language = record.language;
      tours = record.data;
      console.log(`[generate-tour-audios] Tour READY: ${citySlug} [${language}]`);
    }

    // En continuaciones no viaja el payload completo (para no arrastrar JSON grande) — se relee.
    if (!tours) {
      const { data: row, error } = await supabaseClient
        .from('tours_cache')
        .select('data')
        .eq('city', citySlug)
        .eq('language', language)
        .maybeSingle();
      if (error || !row?.data) {
        return new Response('Tour no encontrado en tours_cache.', { status: 200, headers: jsonHeaders });
      }
      tours = row.data;
    }

    const stops = tours!
      .filter(t => !t.isSponsored)
      .flatMap(t => t.stops)
      .filter(s => s.description?.trim());

    if (stops.length === 0) {
      return new Response('Sin paradas con descripción.', { status: 200, headers: jsonHeaders });
    }

    // ── Comprobar qué ya está en caché (para planificar el lote) ──────────
    const stopsWithHash = await Promise.all(stops.map(async s => ({ stop: s, hash: await textHash(s.description) })));
    const { data: existing } = await supabaseClient
      .from('audio_cache')
      .select('text_hash')
      .eq('language', language)
      .in('text_hash', stopsWithHash.map(s => s.hash));

    const cachedSet = new Set<string>(existing?.map((e: any) => e.text_hash) ?? []);
    const pending = stopsWithHash.filter(s => !cachedSet.has(s.hash));

    if (pending.length === 0) {
      console.log(`[generate-tour-audios] ${citySlug} [${language}]: todos los audios ya existían.`);
      return new Response(JSON.stringify({ ok: true, done: true, pending: 0 }), { headers: jsonHeaders });
    }

    // ── Procesar un lote pequeño, secuencial, delegando en generate-audio-gcp ─
    const batch = pending.slice(0, STOP_BATCH_SIZE);
    let okCount = 0;
    let failCount = 0;
    let lastError = '';

    for (const { stop } of batch) {
      try {
        await generateStopAudio(supabaseClient, stop, language, citySlug);
        okCount++;
        console.log(`[generate-tour-audios]   ✅ ${citySlug} [${language}] — ${stop.name}`);
      } catch (e: any) {
        failCount++;
        lastError = e.message;
        console.error(`[generate-tour-audios]   ❌ ${citySlug} [${language}] — ${stop.name}: ${e.message}`);
      }
    }

    const remaining = pending.length - okCount;

    if (remaining > 0) {
      if (okCount > 0) {
        console.log(`[generate-tour-audios] Lote OK (${okCount}/${batch.length}). Quedan ${remaining}. Continuando...`);
        scheduleContinuation(citySlug, language);
      } else {
        console.error(`[generate-tour-audios] ⛔ Lote entero falló (0/${batch.length} OK). Deteniendo auto-generación para ${citySlug} [${language}]. Quedan ${remaining} paradas sin audio — revisar logs y usar 'npx tsx scripts/generategcpallaudios.ts --city ${citySlug}' manualmente.`);
        await notifyAudioFailure(citySlug, language, remaining, lastError);
      }
    } else {
      console.log(`[generate-tour-audios] 🎉 ${citySlug} [${language}] completado. Todas las paradas tienen audio WAV.`);
    }

    return new Response(JSON.stringify({ ok: true, done: remaining === 0, batchOk: okCount, batchFailed: failCount, remaining }), { headers: jsonHeaders });

  } catch (error: any) {
    console.error("[generate-tour-audios] ERROR FINAL:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: jsonHeaders, status: 500 });
  }
});
```
