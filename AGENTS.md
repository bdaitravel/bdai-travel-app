# AGENTS.md — Guía operativa para agentes AI en BDAI

Este fichero documenta los sistemas más complejos del proyecto para que cualquier agente AI pueda operar correctamente sin contexto previo.

---

## Flujo real de creación de tours (proceso manual — vigente desde jul-2026)

**No hay ningún orquestador, worker de IA ni worker de GIS en funcionamiento.** Los tours se crean a mano:

```
Usuario busca ciudad → ¿Existe en tours_cache?
  ├── SÍ → Cargar tours desde caché (fetchCityToursMerged)
  └── NO → INSERT en tour_requests → Webhook Trigger Tour Request → solicitud-tour
           → Email a DAISY_EMAIL → Banner inline en HomeView ("puede tardar 1 min a 1 día")
           → (proceso 100% manual, fuera de Supabase) la compañera de Daisy crea el tour
             a mano y lo sube directamente a `tours_cache` vía Dashboard/SQL, incluyendo
             poner `status: 'READY'`
           → ese UPDATE/INSERT dispara automáticamente dos webhooks en paralelo:
             ├── Trigger Notify Tour Ready → notify-tour-ready → avisa por email a quien lo pidió
             └── Trigger Audio Generation  → generate-tour-audios → genera el audio WAV
                                              de todas las paradas, en el idioma de esa fila
```

El único tramo automatizado del lado de creación de contenido es, por tanto, **la generación de audio tras el `status: 'READY'`** — todo lo demás (redactar paradas, coordenadas, ruta) lo hace una persona a mano. La conversión final WAV → MP3 se sigue haciendo aparte y a mano con `scripts/convertaudiostomp3.ts` cuando se quiera liberar espacio.

El asunto del email de solicitud sigue el formato: `BDAI — Nuevo tour solicitado: {city}, {language}` (secrets: `SMTP_HOSTNAME`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `DAISY_EMAIL`).

### Edge Functions activas — Ficheros SSOT

El código fuente de cada función vive en un fichero `.md` de este repositorio (no en la CLI de Supabase). Para desplegar: copiar el bloque de código del `.md` al Dashboard de Supabase → Edge Functions → Editor. **Nunca usar `supabase functions deploy`**.

| Función desplegada | Fichero SSOT |
|---|---|
| `solicitud-tour` | `services/supabase/edge-functions/solicitud-tour.md` |
| `notify-tour-ready` | `services/supabase/edge-functions/notify-tour-ready.md` |
| `notify-error` | `services/supabase/edge-functions/notify-error.md` |
| `search-city` | `services/supabase/edge-functions/search-city.md` |
| `generate-audio-gcp` | `services/supabase/edge-functions/generate-audio-gcp.md` |
| `generate-tour-audios` | `services/supabase/edge-functions/generate-tour-audios.md` |
| `reorder-city-tours` | `services/supabase/edge-functions/reorder-city-tours.md` (utilidad de uso único bajo demanda, no automática — ver nota al inicio del fichero) |

### Webhooks de Supabase activos (Database Webhooks)

Configurados en Supabase Dashboard → Database → Webhooks:

| Webhook | Tabla | Evento | Función destino |
|---|---|---|---|
| Trigger Tour Request | `tour_requests` | INSERT | `solicitud-tour` |
| Trigger Notify Tour Ready | `tours_cache` | INSERT, UPDATE | `notify-tour-ready` |
| Trigger Audio Generation | `tours_cache` | INSERT, UPDATE | `generate-tour-audios` |
| Trigger Error Log | `error_logs` | INSERT | `notify-error` |

El filtro por `status` lo aplica cada función internamente, no el webhook.

### ⚠️ Pipeline `-02` y anterior — DESACTIVADO, solo referencia histórica

Hasta jul-2026 existió un pipeline automático de generación de tours con IA (Gemini) + verificación GIS, en dos generaciones (`tour-orchestrator` → `tour-worker-ai` → `tour-worker-gis`, y su sucesor `tour-orchestratror-02` → `tour-worker-ai-02` → `tour-worker-gis-02`). **Ya no se ejecuta nada de esto** — se sustituyó por el proceso manual descrito arriba. Los ficheros SSOT se renombraron localmente con el prefijo `old-` (`old-tour-orchestrator.md`, `old-tour-orchestrator-02.md`, `old-tour-worker-ai.md`, `old-tour-worker-ai-02.md`, `old-tour-worker-gis.md`, `old-tour-worker-gis-02.md`) y sus Database Webhooks correspondientes (`old-trigger-ai-worker.md`, `old-trigger-gis-worker.md`, `old-trigger-ai-worker-02.md`, `old-trigger-gis-worker-02.md`) también, como referencia de lo que hacían. **Ya se borraron en Supabase** (funciones + webhooks + secrets `WEBHOOK_SECRET`/`PLACES_API_KEY`).

### ⚠️ Incidente (jul-2026): `generate-audio-dai` se borró por error — ya corregido

`generate-audio-dai` **no** formaba parte del pipeline `-02` de arriba — era la función que `TourCard.tsx` invoca en vivo (vía `geminiService.ts::generateAudio()`) cada vez que un usuario pulsa ▶️ en una parada sin audio cacheado. Un agente AI la marcó erróneamente como "no usada en vistas activas" sin verificar `TourCard.tsx`, y se borró de Supabase junto con el resto del pipeline muerto, rompiendo momentáneamente ese botón para audio no cacheado.

**Fix aplicado**: `geminiService.ts::generateAudio()` ahora invoca `generate-audio-gcp` en lugar de `generate-audio-dai` — mismo contrato (`{text, language, city}` → `{url}`), función ya activa (la usan los scripts y `generate-tour-audios`), y más fiable (fragmentación de texto + reintentos que `generate-audio-dai` no tenía). `old-generate-audio-dai.md` queda solo como referencia histórica del código antiguo; **no restaurarlo** — `generate-audio-gcp` es ahora el único punto de generación de audio de una parada, tanto para el botón Play del cliente como para los scripts y la automatización.

**Lección para agentes AI**: antes de declarar una función "no usada" y recomendar borrarla, grep por su nombre de export (`generateAudio`, no solo el string del edge function) en **todos** los componentes/vistas, no solo en hooks — `TourCard.tsx` la llamaba directamente y no apareció en una primera pasada superficial.

Se conserva el diseño técnico completo (lógica de scoring de POIs, radios de búsqueda, contrato `city_info`, etc.) en los ficheros `old-*` y en las secciones siguientes de este documento, por si se retoma la generación automática en el futuro. Si eso ocurre, actualizar esta sección para reflejarlo — **no confiar en el diagrama de abajo como estado actual**.

```
Script / Cliente
      │
      ▼
tour-orchestratror-02  (Edge Function — nota: el nombre tenía typo con doble 'r')
      │  INSERT en generation_jobs { status: 'PENDING_AI_02' }
      ▼
[Webhook: Trigger AI Worker 02]  →  tour-worker-ai-02
      │  · Nominatim → coordenadas + bbox + población
      │  · Overpass → POIs históricos/turísticos OSM
      │  · Google Places Nearby → POIs populares con rating
      │  · buildScoredCatalog → merge + dedup + filtros + scoring
      │  · Gemini 2.5 Flash (GCP Service Account + Google Search grounding)
      │  UPDATE generation_jobs { status: 'PENDING_GIS_02', raw_ai_data: [...] }
      ▼
[Webhook: Trigger GIS Worker 02]  →  tour-worker-gis-02
      │  · Verifica coordenadas (Nominatim / Photon / bbox fallback)
      │  · Optimiza ruta TSP (NN + 2-opt + Or-opt)
      │  · Calcula distancia + duración (OSRM polyline)
      │  · Descarta paradas fuera del radio de la ciudad
      │  UPDATE tours_cache { status: 'READY', data: [...] }
      ▼
tours_cache → cliente lee el resultado
```

---

## Sistema de notificación de tours disponibles

Cuando un tour pasa a `status: 'READY'` en `tours_cache` (hoy siempre por inserción/actualización manual — ver "Flujo real de creación de tours"), el webhook `Trigger Notify Tour Ready` dispara la función `notify-tour-ready`.

**Flujo:**
1. Consulta `tour_requests` donde `slug = record.city` AND `notified_at IS NULL`
2. Deduplica por `user_email` (mismo usuario que pidió la ciudad 2 veces → 1 solo email)
3. Envía email desde `SMTP_USER` con asunto: `✅ Tu tour de {city} ya está disponible`
4. Marca todas las filas con `notified_at = now()` para evitar reenvíos
5. Las filas con `user_email = 'Anónimo'` o sin email se marcan igualmente (sin email enviado)

**Campo necesario en `tour_requests`:**
Para que la base de datos soporte este flujo, se requirió ejecutar este SQL:
```sql
ALTER TABLE tour_requests
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tour_requests_slug_notified
  ON tour_requests (slug, notified_at)
  WHERE notified_at IS NULL;
```

---

## Generación automática de audio (WAV) para tours nuevos

Cuando un tour pasa a `status: 'READY'` en `tours_cache` (hoy siempre por inserción/actualización manual), el webhook `Trigger Audio Generation` dispara la función `generate-tour-audios`, que genera el audio de todas sus paradas **sin intervención manual** — sustituye a tener que ejecutar `scripts/generategcpallaudios.ts` a mano tras cada tanda de tours nuevos.

**Flujo:**
1. Filtra internamente por `record.status === 'READY'` (igual que `notify-tour-ready`)
2. Aplana las paradas de los tours no patrocinados de ese `city` + `language`
3. Consulta `audio_cache` en batch por `text_hash` para saltar lo que ya existe
4. Procesa un lote pequeño (2 paradas) de forma secuencial vía Gemini TTS + Service Account GCP
5. Si quedan pendientes y el lote tuvo éxito, se reinvoca a sí misma (fire-and-forget) para el siguiente lote — así evita agotar la cuota de tiempo/CPU de una única invocación en ciudades con muchas paradas
6. Si un lote entero falla, se detiene (no reintenta infinitamente) y envía un email a `DAISY_EMAIL` avisando del fallo (mismo destinatario que las solicitudes de tour), con el comando manual para terminarlo

**⚠️ Por qué esta función solo genera WAV, nunca MP3**: ya se intentó codificar MP3 (`lamejs`) dentro de una Edge Function y nunca funcionó en producción. La causa más probable es la cuota de **CPU-time** (no de reloj) que imponen las Edge Functions de Supabase — pensadas para trabajo I/O-bound, no para bucles de codificación síncronos e intensivos en CPU como el encoder de `lamejs`. La conversión a MP3 se sigue haciendo aparte con `scripts/convertaudiostomp3.ts` (Node.js, sin esa restricción), ejecutado manualmente cuando se quiera liberar espacio/ancho de banda. Ver la nota técnica completa en `services/supabase/edge-functions/generate-tour-audios.md`.

---


## Scripts de `scripts/` — cuáles siguen vivos

Dado que la creación de tours es manual (ver sección anterior), casi todos los scripts que invocaban al orquestador (`seedTours.ts`, `runCityPipeline.ts`, `seedToursPueblos.ts`, `triggerAiManual.ts`, `triggerToursPipeline.ts`, `updateWorkers.mjs`) están **obsoletos** — no se han renombrado ni borrado (no era el alcance pedido), pero no reflejan el proceso real y no se deben usar como referencia ni ejecutar esperando que funcionen (llaman a edge functions retiradas). `scripts/how-to-scripts` también describe ese flujo antiguo y está desactualizado.

**Scripts que siguen siendo relevantes hoy:**

| Script | Para qué sirve ahora |
|---|---|
| `scripts/generategcpallaudios.ts` | Generación manual de audio (WAV) para una ciudad — lo mismo que ahora hace automáticamente `generate-tour-audios`. Sigue siendo útil como respaldo si la generación automática falla (ver notificación de fallo por email) o para forzar una ciudad puntual. |
| `scripts/convertaudiostomp3.ts` | Conversión manual WAV → MP3 de todo el bucket `audios`. Sigue siendo el único método de conversión a MP3 (no es viable dentro de una Edge Function — ver `generate-tour-audios.md`). |
| `scripts/reordenar-ruta-tour.ts` | Reordena las paradas de un tour ya cacheado sin regenerar contenido (equivalente en script a la edge function `reorder-city-tours`). |

---

## Secretos de las Edge Functions

Configurados en Supabase Dashboard → Edge Functions → Secrets (se comparten entre todas las funciones):

| Secret | Descripción | Usado por |
|---|---|---|
| `MY_SERVICE_ROLE_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`) | Service role key de Supabase | Casi todas las funciones activas |
| `SUPABASE_URL` | URL del proyecto (inyectada automáticamente) | Todas |
| `GEMINI_API_KEY` | API key directa de Gemini | `search-city` |
| `GCP_SERVICE_ACCOUNT` | JSON de la cuenta de servicio GCP para autenticar Gemini vía OAuth2 | `generate-audio-gcp` — único punto de auth para todo el sistema de audio, ver nota más abajo |
| `SMTP_HOSTNAME` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Credenciales SMTP para envío de emails | `solicitud-tour`, `notify-tour-ready`, `notify-error`, `generate-tour-audios` |
| `DAISY_EMAIL` | Destinatario de solicitudes de tour y de fallos de generación de audio | `solicitud-tour`, `generate-tour-audios` |
| `SUPPORT_EMAIL` | Destinatario de reportes de error/crash | `notify-error` |
| `RESEND_API_KEY` | Alternativa a SMTP para `notify-error` (ver `trigger-error-log.md`) | `notify-error` |

**Candidatos a borrar** (huérfanos — ninguna función activa los necesita):
- `WEBHOOK_SECRET` — solo lo comprobaban `tour-worker-ai`/`tour-worker-gis`, ya retiradas.
- `PLACES_API_KEY` — solo lo usaban `tour-worker-ai-02`/`tour-worker-gis-02`, ya retiradas. Si `scripts/update-stops-google-places.mjs` sigue en uso, no le afecta: lee su propia copia en `.env.local`, independiente del secret de Supabase.

`GCP_SERVICE_ACCOUNT` **ya no es candidato a borrar**.

### Autenticación de Gemini para audio — un único punto, por diseño (revisado jul-2026)

Tras varias idas y vueltas (Service Account → API key directa → vuelta a Service Account, ver historial en los ficheros `.md` de ambas funciones), se resolvió la duplicación de raíz: **`generate-tour-audios` ya no tiene código de síntesis ni de auth propio** — por cada parada invoca a `generate-audio-gcp` (`supabaseClient.functions.invoke('generate-audio-gcp', ...)`), igual que hacen los scripts manuales (`generategcpallaudios.ts`, etc.). `generate-audio-gcp` usa **Service Account GCP** (`GCP_SERVICE_ACCOUNT`) y es el **único** sitio del sistema donde vive esa lógica.

Ventaja de este diseño: si algún día hay que volver a cambiar el método de auth o la lógica de fragmentación/reintentos, se cambia **una sola vez** en `generate-audio-gcp` y todos sus llamadores (botón Play del cliente, scripts manuales, pipeline automático) lo heredan sin tocar nada más. No duplicar esta lógica entre funciones si se retoca esto en el futuro — es la causa raíz de la desincronización que ya ocurrió una vez.

**Ojo**: el método de auth **no** arregla el bug de Gemini TTS por longitud de texto (`finishReason: OTHER`) — es un problema del modelo, no de la autenticación. Por eso `generate-audio-gcp` conserva la fragmentación de texto (máx. 800 chars) + reintentos.

**En scripts locales de traducción** (no de audio): `scripts/lib/gcpAuth.ts` sigue usando el flujo de Service Account (`GCP_SERVICE_ACCOUNT` local) para llamadas de texto (traducción), independiente de todo lo anterior. Para llamadas de texto directas con API key, usar siempre `VITE_GEMINI_API_KEY_02`, nunca `VITE_GEMINI_API_KEY` (está truncada/restringida).

---

## Lógica de selección de POIs en `tour-worker-ai-02` (⚠️ histórico — pipeline retirado)

> Esta sección documenta cómo funcionaba el worker de IA cuando el pipeline `-02` estaba activo (ver más arriba). Hoy los tours los redacta a mano la compañera de Daisy, así que nada de esto se ejecuta — se conserva como referencia de criterio (qué hace "bueno" a un POI, radios usados, etc.) por si es útil para el proceso manual o para una futura reactivación. Código en `old-tour-worker-ai-02.md`.

### Fuentes de datos (en paralelo)

1. **Overpass API** — POIs históricos/turísticos de OpenStreetMap (tags: `historic`, `tourism`, `amenity`, `leisure`, `building`)
2. **Google Places Nearby Search** — POIs populares ordenados por `POPULARITY` con rating y número de reseñas

### Radio de búsqueda dinámico por tamaño de ciudad

```
Google Places radius:
  < 5.000 hab  →  800m
  < 50.000     →  1.500m
  < 500.000    →  2.000m
  ≥ 500.000    →  3.000m
  (sin dato)   →  1.800m

Walking cap (distancia máxima al centro para incluir un POI):
  < 5.000 hab  →  1,5km
  < 50.000     →  2,5km
  < 500.000    →  3,5km
  ≥ 500.000    →  5,0km
  (sin dato)   →  2,5km (fallback por diagonal del bbox)
```

### Filtros de calidad

Se aplican tras el merge Google + OSM:

- **Negocios comerciales**: bodegas de turismo enológico, restaurantes/bares sin `tourist_attraction` → eliminados
- **Iglesias genéricas**: `place_of_worship` sin Wikipedia/Wikidata y sin rating ≥ 4.4 con ≥150 reseñas → eliminadas
- **Parques genéricos**: `park`/`garden` sin Wikipedia ni heritage y sin rating ≥ 4.3 con ≥200 reseñas → eliminados
- **Museos pequeños**: `tourism=museum` sin Wikipedia y sin rating ≥ 4.2 con ≥100 reseñas → eliminados

### Fallback para pueblos pequeños

Si los filtros estrictos dejan < 6 POIs, se hace un segundo pase relajado que solo mantiene el filtro de negocios comerciales y distancia. Esto garantiza que aldeas con pocos POIs turísticos reconocidos (Aldeanueva de Ebro, Viana…) sí reciben un catálogo mínimo con su iglesia, ermitas y plaza mayor.

### Fórmula de scoring

```
score = rating × log10(reviews + 10)
      + 3  (si tiene Wikipedia/Wikidata)
      + 2  (si tags.historic es un tipo real — no 'yes'/'no'/'building')
      + 2  (si tags.heritage existe)

Reglas especiales:
  - Sin rating ni Wikipedia → score = 1
  - Puente/puerta/muralla/acueducto histórico con Wikipedia → score ≥ 14 (garantía Tour 1)
  - Monumento/estatua/escultura sin Wikipedia → score ≤ 3 (presencia, no destino)
```

### Decisión de número de tours

```
≥ 24 POIs de calidad → 3 tours (Esencial + Rincones + Historia Profunda)
≥ 14 POIs          → 2 tours (Esencial + Rincones)
< 14 POIs          → 1 tour  (Esencial combinado)
```

Los POIs se dividen en Tier 1 (top 40%), Tier 2 (siguiente 35%), Tier 3 (resto) y se pasan como catálogo coordinado al prompt de Gemini.

---

## Tours patrocinados (`sponsored_tours`)

### ⚠️ DESACTIVADO (ago-2026): carga comentada, no borrada

A día de hoy el sistema **no está operativo en la práctica**: los dos municipios que tienen filas en `sponsored_tours` llevan paradas de negocio **inventadas**, sin contrato comercial real detrás. Mostrarlas con el badge "Patrocinado" (obligatorio por LSSI art. 20/DSA, ver más abajo) sería una comunicación comercial falsa — no hay patrocinador real al que atribuírsela — así que se ha desactivado la visualización mientras no haya patrocinadores reales.

**Qué se tocó**: en `services/supabase/toursService.ts`, `fetchCityToursMerged()` ya no llama a `getSponsoredTours()` — la línea está comentada y sustituida por un array vacío. `getSponsoredTours()`, la tabla `sponsored_tours`, `sponsored_events`, la RLS y toda la UI condicionada a `isSponsored` (badge, acento amarillo, botón "Beneficio", etc., descritos más abajo) **se dejan intactos sin tocar**, solo dejan de recibir datos.

**Para reactivarlo** el día que haya un contrato real: descomentar esa única línea en `fetchCityToursMerged()`. No hace falta tocar nada más — el resto del sistema (tabla, RLS, analítica, UI) sigue funcionando tal cual está documentado en el resto de esta sección.

### Concepto

Un tour patrocinado es un conjunto de **paradas de negocios locales** (cafeterías, restaurantes, tiendas) creado a mano por contrato comercial. No tiene ruta, ni duración/distancia, ni audio: el usuario pulsa una parada, el mapa le indica cómo llegar, hace check-in GPS (≤50m, misma mecánica que el tour normal) y eso desbloquea el **Beneficio** del local.

### Tabla `sponsored_tours` — ciclo de vida independiente

**Nunca guardar tours patrocinados en `tours_cache`**: cualquier re-subida manual (o, si algún día se reactiva, del pipeline `-02`) sobreescribe `data` completo de esa fila y los borraría. Viven en su propia tabla (SQL en `scripts/create_sponsored_tours.sql`):

| Campo | Uso |
|---|---|
| `city_slug` + `language` | PK. `city_slug` usa el **mismo slug** que `tours_cache.city` (salida de `normalizeKey`) — así se unen ambas fuentes por la misma clave. |
| `data` | JSONB `Tour[]`, cada tour con `isSponsored: true`. |
| `active` | Interruptor: `false` oculta sin borrar (fin de contrato). |
| `starts_at` / `ends_at` | Vigencia del contrato. La RLS solo expone filas activas y en vigencia. |
| `sponsor_name` | Nombre comercial para facturación/auditoría. |

RLS: SELECT público filtrado por `active` + vigencia; **sin políticas de escritura** (solo `service_role` desde Dashboard/scripts).

### Convención de IDs

`{slug}_{lang}_sp{n}` (tour) y `{slug}_{lang}_sp{n}_stop{m}` (parada). El sufijo `sp` no es decorativo: `parseTourId()` en `TourActiveView` parsea `slug_lang_idx` y con `sp0` obtiene `NaN`, por eso la rehidratación busca el tour **por id exacto** en el array fusionado antes de caer al índice.

### Carga unificada — un solo punto de entrada

`fetchCityToursMerged(slug, lang)` en `services/supabase/toursService.ts` es la **única** vía de carga de tours de ciudad: hace en paralelo la query original a `tours_cache` y `getSponsoredTours()` (con fallback de idioma a `es`), y devuelve `{ tours, hasNormal }` con los patrocinados al final. La usan los tres puntos de carga: `useCity.processCitySelection`, `CityDetailView` (rehidratación) y `TourActiveView` (rehidratación). La copia offline (`tourCacheService.saveTours`) persiste el array ya fusionado, así que el modo offline funciona sin código extra.

`hasNormal` preserva la regla original: ciudad sin tours normales → flujo de solicitud + email, aunque tenga patrocinados.

### Reglas de UI (todas detrás de `tour.isSponsored`)

- **Acento amarillo corporativo `#f6c604`** (el del logo) en lugar del morado: borde hover, chip, título hover, "Lanzar" y botón play de la card. Separador amarillo con etiqueta `sponsoredSection` (traducida en los 24 idiomas de `data/translations.ts`) que **solo se renderiza si el municipio tiene patrocinados**.
- **Badge "Patrocinado" obligatorio** en la card (requisito legal LSSI art. 20 / DSA: la comunicación comercial debe identificarse explícitamente — el color solo no basta).
- Card sin duración/distancia: muestra nº de paradas.
- Vista activa: sin botón de audio ni selector de velocidad; cabecera solo con el nombre del local (sin "Parada N").
- Botón **"Beneficio"** (icono `fa-gem`) sustituye a "Consejo Dai": bloqueado (candado + toast `benefitLocked`) hasta hacer check-in GPS en esa parada; el texto vive en `Stop.business.benefit`.
- Check-in GPS y gamificación (millas, puntos) idénticos al tour normal.

### Tipado

`Tour.isSponsored?: boolean` y `Stop.business?: { type: 'cafe'|'restaurant'|'shop'; address?: string; benefit?: string }`. **No tocar la unión `Stop.type`** (alimenta iconos y puntos): la parada de un bar sigue siendo `type: 'food'`.

### Analítica (`sponsored_events`)

Tabla INSERT-only para el cliente (SQL en `scripts/create_sponsored_events.sql`; sin SELECT para proteger emails). `logSponsoredEvent()` en `toursService.ts` registra fire-and-forget:

- `check_in` — al verificar el check-in GPS en una parada patrocinada
- `benefit_open` — al abrir el modal del beneficio

Métricas (personas únicas = `COUNT(DISTINCT user_email)`, pulsaciones = `COUNT(*)`) se consultan desde el SQL Editor con las queries incluidas en el script.

### Regla de oro

**El tour normal no se toca.** Cualquier cambio de este sistema debe ser aditivo: ramas condicionales detrás de `isSponsored`, funciones nuevas en lugar de modificar las existentes, y las clases/textos de la rama normal deben quedar byte a byte como estaban. QA del módulo: `qa/08_SPONSORED.md`.

---

## Normas para agentes AI

- **Nunca modificar datos en Supabase** (tours_cache, generation_jobs, users) sin confirmación explícita del usuario.
- **Para desplegar edge functions**: editar el fichero `.md` correspondiente y pedir al usuario que haga el copy-paste en el Dashboard. Nunca proponer `supabase functions deploy`.
- **API keys**: usar siempre `VITE_GEMINI_API_KEY_02` en scripts, nunca `VITE_GEMINI_API_KEY`.
- **El pipeline de orquestador/workers de IA-GIS está retirado** (ver "Flujo real de creación de tours"). No asumir que `tour-orchestratror-02`/`tour-worker-ai-02`/`tour-worker-gis-02` reciben tráfico ni que el contrato `city_info` (`lon`/`radiusKm`) importa hoy — son referencia histórica en los ficheros `old-*`, no estado actual.
- **QA de regresión obligatorio antes de cerrar cualquier cambio**: usar `qa/QA_Manifest.md` como índice para identificar qué módulo(s) de `qa/*.md` cubren los ficheros tocados. Sobre esos módulos: (1) listar los TC 🔴 afectados; (2) verificar los que se puedan comprobar sin hardware real — levantando la app con el skill `run`, revisando lógica/build/RLS — y reportar el resultado; (3) avisar explícitamente al usuario de los TC que solo se pueden validar manualmente (GPS spoofing, APK/dispositivo físico, recepción de emails reales) para que los ejecute él. Si el comportamiento cambia a propósito, **actualizar el `.md` correspondiente en el mismo cambio, no después** — un TC describiendo un flujo que ya no existe es peor que no tener TC, porque genera falsos positivos/negativos en las rondas de QA manual (ya ocurrió con la sección A de `qa/04_TOURS.md`, que describía la generación síncrona de tours mucho después de haberse sustituido por el flujo de `tour_requests`).

### Modo de trabajo: operatividad, batería y seguridad

BDAI es una app móvil (Capacitor/Android e iOS) además de web. Al tocar cualquier código que corra en el dispositivo, actuar como experto en apps móviles centrado en **operatividad, ahorro de batería y seguridad** — pensar varias opciones y elegir la óptima, no la más rápida de escribir.

- **Diagnosticar con evidencia antes de implementar**: leer el código real (no asumir por el nombre de una función) y, si aplica, consultar la base de datos de Supabase directamente (RLS, grants, contenido de una función RPC) en vez de teorizar sobre la causa de un bug.
- **Revisar el impacto en batería** de cualquier uso de GPS/red/sensores: preferir baja precisión cuando sea suficiente (ver `hooks/useGeolocation.ts` — GPS por niveles de precisión según distancia a la parada activa), apagar sensores cuando la app pasa a segundo plano (`@capacitor/app`, evento `appStateChange`), evitar polling cuando un enfoque por eventos es viable.
- **Revisar seguridad de cualquier RPC/endpoint tocado** (RLS, `SECURITY DEFINER`, permisos `anon`/`authenticated`) aunque no sea lo que se pidió explícitamente. Ya apareció una vulnerabilidad crítica real así: `upsert_profile_rpc` estaba `SECURITY DEFINER`, sin comprobar `auth.uid()` y con `EXECUTE` concedido a `anon` — cualquiera podía sobrescribir el perfil de otro usuario.
- **Almacenamiento nativo**: en Android, el `localStorage` del WebView puede ser purgado por el sistema bajo presión de memoria/almacenamiento. Para cualquier dato que deba sobrevivir entre sesiones (perfil, cola de sincronización, sesión de Supabase Auth), usar `@capacitor/preferences` en nativo en vez de `localStorage`/`sessionStorage` — ver `services/storageProvider.ts` y `services/supabase/client.ts`.
- **Ante decisiones de arquitectura con trade-offs reales** (batería vs. precisión, permisos nativos invasivos, riesgo de revisión en Play Store/App Store), explicar el trade-off y preguntar antes de implementar, no decidir unilateralmente.
- **`CREATE OR REPLACE FUNCTION` sin error no significa que la función funcione**: Postgres no valida completamente el cuerpo de una función `plpgsql` hasta su primera ejecución real (tipos de columna, etc. se comprueban en tiempo de llamada, no de creación). Ya se coló así un bug real: `upsert_profile_rpc` llevaba tiempo fallando el 100% de las veces porque casteaba `interests`/`visited_cities`/`completed_tours` (columnas `text[]` nativas) a `jsonb`, y la migración se aplicó sin ningún error visible. **Tras modificar cualquier función que escriba datos, hacer una llamada de prueba real** (p. ej. `BEGIN; SET LOCAL "request.jwt.claims" = '...'; SET LOCAL ROLE authenticated; SELECT la_funcion(...); ROLLBACK;` para simular el contexto de un usuario autenticado sin persistir cambios) y comprobar el resultado, no solo que la migración se aplicó.
