# AGENTS.md — Guía operativa para agentes AI en BDAI

Este fichero documenta los sistemas más complejos del proyecto para que cualquier agente AI pueda operar correctamente sin contexto previo.

---

## Pipeline de generación de tours — Serie `-02`

### Visión general

El pipeline `-02` es el sistema de producción para crear walking tours. Funciona en background: el cliente encola un trabajo y el pipeline lo procesa de forma asíncrona en tres fases.

```
Script / Cliente
      │
      ▼
tour-orchestratror-02  (Edge Function — nota: el nombre tiene typo con doble 'r')
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

### Nombre de la edge function del orquestador

**IMPORTANTE**: La función está desplegada en Supabase con un typo: `tour-orchestratror-02` (doble 'r' en "orquestrator"). Cualquier código que la invoque debe usar exactamente ese nombre:

```typescript
// CORRECTO — con typo, así está en Supabase
edge.functions.invoke('tour-orchestratror-02', { body: { city, country, language, slug } });

// INCORRECTO — sin typo, no existe
edge.functions.invoke('tour-orchestrator-02', { ... });
```

### Edge Functions — Ficheros SSOT

El código fuente de cada función vive en un fichero `.md` de este repositorio (no en la CLI de Supabase). Para desplegar: copiar el bloque de código del `.md` al Dashboard de Supabase → Edge Functions → Editor. **Nunca usar `supabase functions deploy`**.

| Función desplegada | Fichero SSOT |
|---|---|
| `tour-orchestratror-02` | `services/supabase/edge-functions/tour-orchestrator-02.md` |
| `tour-worker-ai-02` | `services/supabase/edge-functions/tour-worker-ai-02.md` |
| `tour-worker-gis-02` | `services/supabase/edge-functions/tour-worker-gis-02.md` |
| `solicitud-tour` | `services/supabase/edge-functions/solicitud-tour.md` |
| `notify-tour-ready` | `services/supabase/edge-functions/notify-tour-ready.md` |
| `notify-error` | `services/supabase/edge-functions/notify-error.md` |

### Webhooks de Supabase (Database Webhooks)

Configurados en Supabase Dashboard → Database → Webhooks:

| Webhook | Tabla | Evento | Función destino |
|---|---|---|---|
| Trigger AI Worker 02 | `generation_jobs` | INSERT | `tour-worker-ai-02` |
| Trigger GIS Worker 02 | `generation_jobs` | UPDATE | `tour-worker-gis-02` |
| Trigger Tour Request | `tour_requests` | INSERT | `solicitud-tour` |
| Trigger Notify Tour Ready | `tours_cache` | INSERT, UPDATE | `notify-tour-ready` |

El filtro por `status` lo aplica cada función internamente, no el webhook.

### Flujo de solicitud de tours (actual)

**Antes** (pipeline `-02`): cuando un usuario buscaba una ciudad sin caché, el frontend llamaba a `generateToursForCity()` que invocaba el orquestador `tour-orchestratror-02`, se suscribía a Realtime + polling y esperaba hasta 6.5 minutos a que el pipeline AI+GIS completase la generación.

**Ahora**: cuando un usuario busca una ciudad sin caché, el frontend hace un `INSERT` en la tabla `tour_requests` (ciudad, país, idioma, slug, email del usuario). El Database Webhook `Trigger Tour Request` dispara la Edge Function `solicitud-tour`, que envía el email a `DAISY_EMAIL`. El usuario ve un **banner inline** en la HomeView confirmando la solicitud. **No se genera el tour automáticamente.**

```
Usuario busca ciudad → ¿Existe en tours_cache?
  ├── SÍ → Cargar tours desde caché (igual que antes)
  └── NO → INSERT en tour_requests → Webhook → solicitud-tour → Email a DAISY_EMAIL → Banner inline
```

El asunto del email sigue el formato: `BDAI — Nuevo tour solicitado: {city}, {language}`

**Secrets necesarios para `solicitud-tour`**: `SMTP_HOSTNAME`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `DAISY_EMAIL`

**Nota**: el pipeline de generación `-02` sigue existiendo y funcional para uso desde scripts (ej: `generateEsOnly.ts`), pero ya no se dispara desde el frontend.

---

## Sistema de notificación de tours disponibles

Cuando un tour pasa a `status: 'READY'` en `tours_cache` (por pipeline automático **o por inserción manual**), el webhook `Trigger Notify Tour Ready` dispara la función `notify-tour-ready`.

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


## Script de pre-seeding: `generateEsOnly.ts`

Ubicación: `scripts/generateEsOnly.ts`

Llama al orquestador por cada ciudad de la lista y hace polling hasta obtener `READY` (o `ERROR`). Es el único script de producción para generar tours en batch.

```bash
cd bdai-travel-app
npx tsx scripts/generateEsOnly.ts
```

**Variables de entorno necesarias** (en `.env.local`):

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Leer `tours_cache` (service_role) |
| `VITE_SUPABASE_ANON_KEY` | Invocar edge functions (anon key) |

El script usa dos clientes: uno con `service_role` para leer `tours_cache` y uno con `anon_key` para invocar edge functions (que requieren autenticación de cliente).

**Ciclo de polling**: cada 15 segundos, máximo 80 intentos (20 minutos). Si el pipeline no termina en ese tiempo, marca la ciudad como timeout.

**Lista de ciudades** — editar la constante `cities` al final del fichero para cambiar qué ciudades se generan.

---

## Secretos de las Edge Functions

Configurados en Supabase Dashboard → Edge Functions → Secrets (se comparten entre todas las funciones):

| Secret | Descripción |
|---|---|
| `MY_SERVICE_ROLE_KEY` | Service role key de Supabase (alternativa a la inyectada automáticamente) |
| `SUPABASE_URL` | URL del proyecto (inyectada automáticamente por Supabase) |
| `GCP_SERVICE_ACCOUNT` | JSON completo de la cuenta de servicio GCP para autenticar Gemini via OAuth2 |
| `PLACES_API_KEY` | Google Places API key (New API v1) para búsqueda de POIs populares |

### Autenticación de Gemini (GCP Service Account)

`tour-worker-ai-02` **no usa API key directa** de Gemini. Usa un Service Account de GCP que genera tokens OAuth2 mediante JWT firmado con RS256. Esto permite usar Google Search grounding (que requiere facturación GCP) y evita los límites por quota de API key.

El flujo en la función:
1. Lee `GCP_SERVICE_ACCOUNT` (JSON del service account)
2. Firma un JWT con `jose` (npm:jose@5.2.0)
3. Intercambia el JWT por un access token en `oauth2.googleapis.com/token`
4. Usa el token como `Authorization: Bearer <token>` en las llamadas a Gemini
5. Cachea el token 5 minutos antes de su expiración

**En scripts locales** (`scripts/lib/gcpAuth.ts` hace lo mismo pero con `VITE_GEMINI_API_KEY_02` para llamadas directas desde Node). Usar siempre `VITE_GEMINI_API_KEY_02`, nunca `VITE_GEMINI_API_KEY` (está truncada/restringida).

---

## Lógica de selección de POIs en `tour-worker-ai-02`

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

### Concepto

Un tour patrocinado es un conjunto de **paradas de negocios locales** (cafeterías, restaurantes, tiendas) creado a mano por contrato comercial. No tiene ruta, ni duración/distancia, ni audio: el usuario pulsa una parada, el mapa le indica cómo llegar, hace check-in GPS (≤50m, misma mecánica que el tour normal) y eso desbloquea el **Beneficio** del local.

### Tabla `sponsored_tours` — ciclo de vida independiente

**Nunca guardar tours patrocinados en `tours_cache`**: el pipeline `-02` sobreescribe `data` completo en cada regeneración y los borraría. Viven en su propia tabla (SQL en `scripts/create_sponsored_tours.sql`):

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
- **Nombre del orquestador**: `tour-orchestratror-02` (con doble 'r'). No corregir el typo — así está desplegado.
- **El contrato `city_info`** entre workers usa `lon` (no `lng`) y `radiusKm` (no `radius`). Romper esto causa fallos silenciosos en el GIS worker.
