# Database Webhook: Trigger Audio Generation

**Misión**: En cuanto un tour pasa a `READY` en `tours_cache` (pipeline automático, script de pre-seeding o inserción manual), dispara la generación automática de audio (WAV) para todas sus paradas — sin esperar a que un usuario pulse "Play" ni a lanzar manualmente `scripts/generategcpallaudios.ts`.

## Configuración en el Dashboard de Supabase

- **Name**: `Trigger Audio Generation`
- **Table**: `tours_cache`
- **Events**: `Insert`, `Update`
- **Type**: `Webhook`
- **Method**: `POST`
- **URL**: `https://slldavgsoxunkphqeamx.supabase.co/functions/v1/generate-tour-audios`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <TU_ANON_KEY>`

## Funcionamiento

El webhook se dispara en cualquier INSERT o UPDATE sobre `tours_cache`. La edge function `generate-tour-audios` filtra internamente y solo actúa cuando `record.status === 'READY'`. Esto cubre:

- ✅ Tours creados por el pipeline automático (`tour-worker-gis-02`)
- ✅ Tours generados por `scripts/generateEsOnly.ts` / `runCityPipeline.ts`
- ✅ Tours creados o actualizados **manualmente** desde el Dashboard de Supabase

Es idempotente: si se dispara varias veces para la misma ciudad/idioma, solo genera lo que falte en `audio_cache` (consulta por `text_hash`).

## Flujo de eventos

1. `tours_cache` recibe un upsert con `status: 'READY'`
2. Este webhook se dispara automáticamente
3. `generate-tour-audios` aplana las paradas de los tours no patrocinados de ese `city` + `language`
4. Genera un **lote pequeño** (por defecto 2 paradas) de audio WAV vía Gemini TTS + Service Account GCP, subiendo a `audios/<ciudad>/<idioma>/<timestamp>.wav` y registrando en `audio_cache`
5. Si quedan paradas pendientes y el lote tuvo al menos un éxito, la función se **reinvoca a sí misma** (fire-and-forget) para procesar el siguiente lote, hasta terminar
6. Si un lote entero falla, se detiene y **envía un email a `DAISY_EMAIL`** avisando del fallo (mismo destinatario que las solicitudes de tour), con el comando manual para terminarlo
7. **No genera MP3** — eso se sigue haciendo con `scripts/convertaudiostomp3.ts` de forma manual/periódica (ver la nota técnica en `generate-tour-audios.md` sobre por qué la codificación MP3 no es viable dentro de una Edge Function)

## Secrets necesarios (todos ya existentes, ninguno nuevo)

- `GCP_SERVICE_ACCOUNT`, `MY_SERVICE_ROLE_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`), `SUPABASE_URL` — compartidos con `generate-audio-gcp`
- `SMTP_HOSTNAME`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `DAISY_EMAIL` — compartidos con `solicitud-tour` / `notify-tour-ready`, usados solo si falla un lote entero

## Payload de ejemplo (desde el webhook)

```json
{
  "type": "UPDATE",
  "record": {
    "city": "logrono_spain",
    "language": "es",
    "status": "READY",
    "data": [ { "id": "...", "stops": [ { "name": "...", "description": "..." } ] } ]
  }
}
```

## Payload de ejemplo (auto-continuación, generado por la propia función)

```json
{
  "continue": true,
  "city": "logrono_spain",
  "language": "es"
}
```
