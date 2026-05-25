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

### Webhooks de Supabase (Database Webhooks)

Configurados en Supabase Dashboard → Database → Webhooks:

| Webhook | Tabla | Evento | Función destino |
|---|---|---|---|
| Trigger AI Worker 02 | `generation_jobs` | INSERT | `tour-worker-ai-02` |
| Trigger GIS Worker 02 | `generation_jobs` | UPDATE | `tour-worker-gis-02` |

El filtro por `status` lo aplica cada función internamente, no el webhook.

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

## Normas para agentes AI

- **Nunca modificar datos en Supabase** (tours_cache, generation_jobs, users) sin confirmación explícita del usuario.
- **Para desplegar edge functions**: editar el fichero `.md` correspondiente y pedir al usuario que haga el copy-paste en el Dashboard. Nunca proponer `supabase functions deploy`.
- **API keys**: usar siempre `VITE_GEMINI_API_KEY_02` en scripts, nunca `VITE_GEMINI_API_KEY`.
- **Nombre del orquestador**: `tour-orchestratror-02` (con doble 'r'). No corregir el typo — así está desplegado.
- **El contrato `city_info`** entre workers usa `lon` (no `lng`) y `radiusKm` (no `radius`). Romper esto causa fallos silenciosos en el GIS worker.
