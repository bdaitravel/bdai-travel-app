# Proyecto: BDAI (Better Destinations AI)

## Mandato del Agente Experto (Antigravity)
Como arquitecto senior y consultor estratégico, **debes**:
1. **Dudar y Cuestionar:** Si el usuario propone algo técnicamente inferior o arriesgado (ej. lógica crítica en el cliente), debes señalarlo y proponer la "Best Practice" de industria. El agente puede y debe **cuestionar y mejorar** las reglas de este documento si detecta una solución más profesional, explicando el razonamiento antes de proceder.
2. **Seguridad Total:** Priorizar la protección de API Keys y datos sensibles delegando lógica a Edge Functions.
3. **Escalabilidad y Rigor:** No aceptar soluciones de "solo para un usuario". El código debe ser resiliente y escalable.

**Objetivo:** Desarrollar/mantener Super App de viajes (Tours IA, Shop, eSIM, Gamificación).
**Core Focus:** Geolocalización (Leaflet), UI móvil premium (Capacitor), Generación dinámica (Gemini) como fallback de DB.

## Roles del Agente (Experto Senior 10+ Años en cada área)
**1. Dev Fullstack & Experto en IA**
- Desarrollo integral y diseño de arquitecturas escalables.

**2. Inteligencia Espacial & GIS (Geolocalización)**
- **Capacidades:** Geocoding bidireccional, cálculo de rutas y distancias (Haversine/APIs), análisis de "Geo-fencing" para alertas.
- **Protocolo Core:** *Siempre validar precisión de coordenadas $L (lat, lon)$ antes de procesar datos espaciales. Priorizar la **entrada principal (fachada)** y **números de portal específicos** (ej. "Plaza San Agustín 23") sobre el centroide del edificio.*

**3. Privacidad & Ciberseguridad (Secure by Design)**
- **Capacidades:** Sanitización (detectar prompt injection/código malicioso), identifiación y anonimización de PII, estándares de cifrado.
- **Protocolo Core:** *Ningún dato sensible debe persistir en logs o memorias compartidas sin un proceso de hashing/enmascaramiento previo.*

**4. Data Insights & Analítica**
- **Capacidades:** Interpretación de tendencias y anomalías, resúmenes estadísticos, visualización predictiva y estructuración de datos para gráficos.
- **Enfoque:** Actuar como motor de decisiones basado en datos (integración lógica estilo Pandas/BI para salidas de datos).

## Funcionalidades
**Pública:**
- **Explore:** Buscador tours (Prioriza DB -> Genera vía IA y guarda).
- **Passport:** Historial, niveles, insignias, visados digitales.
- **Shop & Connect:** Marketplace de viajes y planes eSIM.
- **Mecánicas:** Multi-idioma dinámico (10+), Gamificación (Leaderboard, recompensas).

**Privada:**
- **Admin Panel:** Gestión de contenido, tours, usuarios y métricas.

**Backend & Servicios:**
- **Supabase:** Auth, PostgreSQL en tiempo real, Storage.
- **Gemini AI:** Generación de textos (itinerarios, descripciones, traducción) e imágenes.

## Stack de Tecnología
- React + Vite + TypeScript
- CSS: TailwindCSS
- Backend: Supabase
- IA: Google Gemini AI
- Estado Global: Zustand (con persistencia inteligente por entorno)
- Enrutamiento: React Router DOM (HashRouter)
- Mobile Bridge: Capacitor
- Extras: Leaflet (Mapas), Recharts (Gráficos)

## Preferencias y Reglas Core
**Generales & Arquitectura:**
- Idioma UI por defecto: Español.
- Config: Variables en `.env`.
- Infraestructura: Priorizar servicios gratuitos; optimizar batería vs rendimiento (Mobile).
- **Despliegue y CI/CD:** El proyecto (frontend) corre en **Vercel** y se despliega automáticamente subiendo el código a GitHub. La regla absoluta al modificar el código de la app es instruir al usuario para que haga un `git commit` y un `git push` desde su terminal para probar los cambios en el entorno real, ya que es su flujo de trabajo establecido.
- **Gestión de Estado (`zustand`):** El estado global volátil (reproductor de audio, tours activos) debe centralizarse con `zustand`. Evitar estados gigantes en `App.tsx` y el prop-drilling excesivo.
- **Caché por Entorno (Obligatorio):** Cualquier persistencia de estado debe evaluar siempre la plataforma y la naturaleza del dato:
  - **Móvil (Capacitor):** Usar almacenamiento persistente (`localStorage`) para ahorrar cuota de red y batería al viajero.
  - **Web:** Usar almacenamiento efímero (`sessionStorage`) para datos de sesión del usuario (perfil, preferencias). Todos los datos de sesión deben desaparecer al cerrar la pestaña.
  - **⚠️ EXCEPCIÓN CRÍTICA — Estado de Navegación:** `activeTours` y `selectedCityInfo` son estado de navegación, **no estado de sesión**. NO se persisten en ningún storage (ni localStorage ni sessionStorage). La URL es la fuente de verdad para la navegación. Las vistas que los necesitan deben autoabastecerse desde Supabase usando el slug de la URL si el estado en memoria está vacío (ej. recarga, suspensión de pestaña en Chrome mobile). Ver implementación en `CityDetailView.tsx`.

**Diseño (UI/UX):**
- System: TailwindCSS.
- Filosofía: Responsive Web Design (RWD) obligatorio. Diseño Mobile-First pero con adaptabilidad total a Desktop y Tablet (Uso intensivo de CSS Grid, Flexbox y breakpoints md:, lg:, xl:). PROHIBIDO encapsular vistas enteras en contenedores de móvil estilo `max-w-md` si hay espacio disponible.
- Componentes: Alto impacto visual (transiciones fluidas, micro-animaciones, modales).
- Nativo: Adaptabilidad total para Capacitor.

**Código (Clean Code):**
- Tipo: TypeScript estricto.
- Calidad: Priorizar código legible, mantenible y sencillo de entender (modular y limpio).
- **Dudas:** Ante cualquier incertidumbre, revisar especificaciones o preguntar al usuario antes de proceder.
- **Dependencias:** Minimizar dependencias. Excepción: si mejora UX/rendimiento >4x (ej. `lamejs`), proponer y esperar aprobación.
- Seguridad: OWASP, sanitización, manejo de secretos.
- Errores: Manejo proactivo con feedback visual en el DOM.

## Estructura de Archivos
- `/components`: UI aislada y reutilizable.
- `/services`: Integraciones API (Supabase, Gemini).
- `/services/gemini`: Lógica específica de IA (config, prompts).
- `/services/supabase/schema_doc.md`: Documentación oficial y actualizada de las tablas de Supabase (SSOT de la Base de Datos).
- `/data`: Datos estáticos, fallbacks, config.
- `/lib`: Utilidades y helpers globales (GIS, Routing, Debounce).

## Decisiones Arquitectónicas (Historial)

### Generación de Tours (geminiService.ts)
- **Sistema de Rigor Universal:** La regla de "No Inventar" y referenciar solo POIs 100% reales es absoluta e independiente del tamaño de la ciudad. No se usan reglas más permisivas para ciudades grandes.
- **Estructura Temática de 2 Niveles (Obligatoria):**
  - **Tour 1 — "Lo Esencial":** Los hitos definitorios de la ciudad: catedral, plaza mayor, calle icónica, puente emblemático, mercado central, calle gastronómica famosa. Lo que hace ÚNICA a esa ciudad.
  - **Tour 2 — "Alma y Curiosidades":** Fusión deliberada de patrimonio vivo (arquitectura civil, miradores, bodegas) y curiosidades puras (placas olvidadas, leyendas urbanas verificadas, detalles que ni los lugareños conocen).
- **Rango de Paradas:** La IA debe hacer TODO LO POSIBLE por llegar al objetivo de **12 paradas por tour**. Mínimo viable absoluto para un tour: **4 paradas**.
- **Lógica de Fusión y Rescate (CRÍTICO):** Para que existan dos tours independientes, cada uno debe lograr al menos **8 paradas validadas**. Si durante la generación o tras la verificación GIS, alguno de los tours se queda por debajo de las 8 paradas, o el total es inferior a 16, **se fusionarán todos los puntos en un ÚNICO tour mixto**. El título del tour fusionado se hereda del primer tour generado por Gemini, o si no es válido, se genera uno con voz y estilo DAI adaptado al idioma del tour. Si el total de paradas validadas cae por debajo de 4, la generación se considerará fallida.
- **Regla Anti-Monte (Perímetro Urbano Caminable):** Está PROHIBIDO incluir senderismo, montes, miradores fuera del casco urbano o cualquier parada que requiera vehículo o elevación significativa. Todos los tours son estrictamente peatonales y urbanos.
- **Coordinadas verificadas:** El campo `coordinatesVerified?: boolean` en la interfaz `Stop` diferencia POIs confirmados geométricamente por Nominatim (solo si hay match 100% o punto cercano <= 30m) de los generados por Gemini sin verificar.
- **Radio máximo:** Todos los POIs deben estar a ≤2km del centro de la ciudad.
- **Modelo IA:** Estandarizado en `gemini-2.5-flash` para texto y `gemini-2.0-flash-preview-image-generation` para imágenes.
- **Regla de oro:** "Truth First, Style Second". El sarcasmo DAI solo se aplica tras confirmar la existencia real del lugar.

### Rendimiento & Estabilidad
- **`haversineKm` hoistada:** Función Haversine disponible en todo el módulo desde la línea ~160 de `geminiService.ts`. Elimina los cálculos inline duplicados que había en `verifyStopCoordinates` y `processTourStops`.
- **Pipeline de verificación GIS en Cascada:** Se asume a **Gemini como el Ground Truth** inicial para las coordenadas, y se busca refinar la precisión usando un sistema de dos niveles:
  1. **Nivel RESCATE (Match exacto/fuzzy por nombre):** Si el nombre de la parada (tras `normalizeForMatch`) coincide **exacta o parcialmente** con el del mapa (Nominatim/Photon), se adopta la coordenada oficial **sin límite de distancia** (dentro del radio de la ciudad). Esto recupera monumentos alucinados por Google.
  2. **Nivel MAGNETO (1km):** Si el nombre NO coincide (ej. calles genéricas), solo se aplica la corrección si el punto oficial está a **<= 1km** del original. 
  3. **Motores:** Nominatim (Estricto con `addressdetails=1`) -> Photon (Fuzzy/ElasticSearch).
  4. **Eliminación (Política Estricta):** Si no hay match por nombre ni punto cercano <= 1km, la parada se **elimina** del tour.
- **Rate limiting inteligente (Secuencial):** `requestTs` compartido. Solo espera el retraso inter-request necesario para respetar 1 req/s sin bloqueos excesivos (`setTimeout` dinámico).
- **Pipeline GIS en 3 pasos+ (Anti-Alucinación):**
  1. **Existencia Global**: Antes de geocodificar, se busca el nombre de la parada en Nominatim sin ciudad. Si 0 resultados globales → alucinación confirmada → parada eliminada sin gastar más tokens.
  1.5. **Existencia Nominal Local**: Antes de cruzar coordenadas, se comprueba si el nombre (*ej. Palacio de Viana*) existe globalmente pero **NO** en la ciudad destino. Si Nominatim no devuelve resultados estrictos para esa ciudad y tampoco existe similitud en el pre-catálogo Overpass, se elimina por "Alucinación Desplazada". Esto permite usar un MAGNETO más amplio (1km) sin miedo a absorber monumentos incorrectos.
  2. **Geocodificación con validación de municipio**: Se busca en Nominatim y Photon con ciudad y se valida que el campo `address.city/town/village` o `photonCity` coincida con el municipio objetivo. Los resultados de municipios vecinos se descartan.
  3. **Filtro de radio dinámico (Basado en catálogo Overpass):** El radio máximo permitido se calcula a partir de la **dispersión real de los POIs encontrados por Overpass** (`calculateRadiusFromCatalog`): se toma la distancia al POI más lejano del centro + 20% de margen, con un mínimo de 2km y máximo de 15km. Esto evita descartar paradas válidas en ciudades extensas o descentralizadas (ej. Logroño). El radio se calcula en `tour-worker-ai` y se almacena en `city_info.radiusKm` dentro del job, para que `tour-worker-gis` lo consuma directamente sin recalcularlo.
- **Política de eliminación de Paradas:** Una parada se elimina si: (1) no existe en OSM a nivel global, (2) sus coordenadas no pueden ser verificadas en el municipio correcto, o (3) las coordenadas verificadas superan el radio dinámico desde el centro de la ciudad. Si un tour queda con menos de 3 paradas verificadas, el tour completo se descarta.
- **`Accept-Language: en`** en todas las búsquedas de OSM, asegurando mejor respuesta internacional y menos fallos de geocoding.
- **ErrorBoundary global:** `components/ErrorBoundary.tsx` envuelve toda la app en `index.tsx`. Captura errores de render no manejados y muestra una pantalla de fallback con el botón "Reportar Fallo" pre-relleno con el stack trace, URL, timestamp y user agent.
- **`ReportBugModal`:** Acepta `prefillText?: string` para recibir datos del `ErrorBoundary` automáticamente.
- **GPS On-Demand (hooks/useGeolocation.ts):** El GPS solo se activa dentro de tours. El hook acepta `mode: 'active' | 'idle'` (por defecto `'idle'`). `App.tsx` lo invoca con `location.pathname.startsWith('/tour/') ? 'active' : 'idle'`.
  - **`'active'`** (ruta `/tour/*`): `watchPosition` con `enableHighAccuracy: true, maximumAge: 5000`. Chip GPS en streaming para geofencing de paradas en tiempo real. Throttle de 2s.
  - **`'idle'`** (resto de la app): el effect retorna inmediatamente sin registrar ningún listener. El chip GPS permanece completamente apagado.
  - **Motivo:** `userLocation` solo lo consumen `TourActiveView`, `TourCard` y `SchematicMap` — todos dentro de `/tour/`. No existe ningún componente fuera de tours que necesite la posición, por lo que cualquier polling idle es desperdicio puro.
  - **Cambio de modo:** React limpia el `watchId` (`clearWatch`) al salir del tour y no registra nada nuevo hasta volver a entrar.
- **GPS validation:** Las coordenadas se validan (rango válido, no NaN, no 0,0) antes de actualizar el estado.
- **Flujo de Audio Persistente (WAV→MP3):** `generateAudio` es secuencial e íntegro. Se utiliza **hashing SHA-256** sobre el texto completo (normalizado) para identificar los audios de forma unívoca. La Edge Function `generate-audio-dai` usa `MY_SERVICE_ROLE_KEY` (con fallback a `SUPABASE_SERVICE_ROLE_KEY`) para evitar el bug conocido de Deno, y aplica un timeout de 120s a la llamada TTS para prevenir EarlyDrop. Si el audio no está en caché, se genera con Gemini TTS (voz Kore), se sube a Supabase Storage como **WAV** y se devuelve la URL pública del bucket. **Conversión a MP3:** El script `scripts/migrateAudios.ts` (Node.js + lamejs) convierte batch los WAVs a MP3 64kbps mono (~83% reducción), actualiza las URLs en `audio_cache` y elimina los WAVs antiguos. **Nota técnica:** lamejs es incompatible con el runtime Deno de Supabase Edge Functions (variable interna `MPEGMode` no sobrevive la conversión CJS→ESM), por lo que la conversión MP3 se realiza exclusivamente en Node.js.
- **AudioContext lifecycle:** El `AudioManager` singleton suspende el `AudioContext` al ir a segundo plano (`visibilitychange`) y lo reanuda al volver. Reduce consumo de batería en iOS/Android.
- **Caché Offline de Tours (`lib/tourCacheService.ts`):** Sistema en dos capas para permitir tours sin conexión tras una primera visita con red.
  - **Capa 1 — Audio MP3 (`@capacitor/filesystem`):** `getOrCacheAudioUrl(remoteUrl)` comprueba el índice de metadatos (localStorage `bdai_audio_index`) y devuelve la URL local (`Capacitor.convertFileSrc`) si el archivo existe en `Directory.Cache/bdai/audio/`. Si no, devuelve la URL remota y lanza `saveAudioFile` en background (fetch → Blob → base64 → `Filesystem.writeFile`). En web la función es no-op y devuelve la URL original (el navegador gestiona su propia caché HTTP). Solo opera en `Capacitor.isNativePlatform()`.
  - **Capa 2 — Datos de tours (localStorage):** `saveTours(slug, lang, tours)` persiste el JSON completo (paradas, descripciones, polylines) en `bdai_tour_offline_{slug}_{lang}` en `localStorage`. `loadTours(slug, lang)` lo recupera. Native-only; no-op en web para respetar la regla de sessionStorage.
  - **Puntos de guardado:** `useCity.ts:processCitySelection` (carga inicial desde Supabase), `CityDetailView.tsx:rehydrateFromCache` (recarga de vista), `TourActiveView.tsx:rehydrate` (restauración tras Android kill).
  - **Fallback offline:** Los bloques `catch` y `else` de los tres puntos de rehidratación intentan `loadTours` antes de redirigir al home. Permite hacer el tour completo sin red si fue visitado con conexión previamente.
  - **Evicción TTL (15 días):** `evictExpired()` se llama en el `useEffect` de arranque de `App.tsx` junto a `getGlobalRanking`. Elimina archivos MP3 del disco y limpia el índice.
  - **UI de gestión:** `ProfileModal.tsx` muestra el tamaño total de caché de audio (MB, calculado con `getCacheSize()` desde el índice en O(1)) y un botón "Vaciar" que llama a `clearAudioCache()`. El tamaño se inicializa con lazy `useState(() => getCacheSize())` para no bloquear el render.
  - **Lo que NO se cachea:** Tiles del mapa OSM (los carga Leaflet vía CDN; requeriría Service Worker). Las polylines de ruta SÍ se cachean al ir embebidas en el JSON de tours.
  - **`npx cap sync` requerido** tras instalar `@capacitor/filesystem@^6.0.0` para que el plugin quede registrado en los proyectos Android/iOS nativos.
- **Haptic Feedback (`lib/haptics.ts`):** Helper que envuelve `@capacitor/haptics` con `.catch(() => {})` para silenciar errores en web/browser donde la API no existe. Tres funciones: `hapticLight` (ImpactStyle.Light — navegación entre paradas), `hapticHeavy` (ImpactStyle.Heavy — tour completado), `hapticSuccess` (NotificationType.Success — badge desbloqueado). Puntos de disparo: botones Prev/Next/JumpTo en `TourCard.tsx`, inicio de `handleFinishTour`, comparación de badge count antes/después de `checkBadges` en `handleCheckIn`, y detección de `newBadges.length > 0` en `useAuth.ts:handleLoginSuccess`.
- **Bloqueo de Concurrencia (tours_cache):** Implementado sistema de bloqueo atómico mediante columna `status` ('GENERATING', 'READY', 'ERROR'). Evita que múltiples clientes disparen Gemini para la misma ciudad. Las pestañas secundarias se suscriben vía Realtime y esperan el estado 'READY' mostrando el mensaje oficial de DAI. El lock expira automáticamente tras 10 minutos para prevenir bloqueos permanentes por crash del worker.
- **Ejecución Asíncrona Desacoplada (Database Webhooks):** La generación pesada de tours ahora utiliza una arquitectura de cola nativa (`generation_jobs`) dividida en 3 Edge Functions atómicas (ubicadas en `/services/supabase/`):
  1. `tour-orchestrator.md`: Recibe la petición, verifica lock de concurrencia (10 min), encola el trabajo en la BD. Retorna inmediato (`BACKGROUND_QUEUED`).
  2. `tour-worker-ai.md`: Disparada por Webhook de INSERT (`status=PENDING_AI`). Obtiene contexto GIS (Nominatim + Overpass), calcula radio dinámico, llama a Gemini CON grounding, parsea con `tryExtractTours` (robusto ante texto libre), actualiza el job a `PENDING_GIS`.
  3. `tour-worker-gis.md`: Disparada por Webhook de UPDATE (`status=PENDING_GIS`). Ejecuta la validación geográfica estricta, aplica la lógica de fusión (umbral: ambos tours ≥8 paradas Y total ≥16), optimiza rutas OSRM y guarda en `tours_cache` con `status=READY`.
     > **Optimización de ruta en GIS worker:** El endpoint OSRM `/trip` no está disponible en el servidor público `routing.openstreetmap.de` para foot routing (devuelve `NotImplemented`). La optimización de orden de paradas usa Haversine NN+2-opt+Or-opt implementado directamente en la Edge Function. OSRM `/route/v1/` sí está disponible y se usa exclusivamente para obtener la polilínea visual una vez calculado el orden óptimo.
  **Ventaja:** Cada worker tiene sus propios 400s de límite Pro, previniendo fallos por timeout en ciudades muy ricas en POIs.
- **Contrato de datos entre workers (`city_info`):** El objeto `cityInfo` se almacena en `generation_jobs.city_info` por el AI worker y lo consume el GIS worker. Su estructura es siempre: `{ lat, lon, radiusKm, population, bbox: { south, west, north, east } }`. Nunca usar `lng` ni `radius` como claves — solo `lon` y `radiusKm`. Esta consistencia es crítica para evitar bugs de verificación GIS.
- **Parser robusto (`tryExtractTours`):** El AI worker NO usa `response_mime_type: "application/json"` porque es incompatible con Google Search grounding (Gemini lo ignora y devuelve texto libre con markdown). En su lugar, usa `tryExtractTours()` que intenta primero JSON directo, luego extracción de array con regex, con fallback a array vacío.
- **Control de Webhooks:** Los webhooks de la base de datos están documentados en `trigger-ai-worker.md` y `trigger-gis-worker.md`. El Trigger AI Worker apunta a `tour-worker-ai` (INSERT) y el Trigger GIS Worker apunta a `tour-worker-gis` (UPDATE).
- **Identificadores Deterministas:** Los tours usan un `id` compuesto (`slug_lang_idx`) para asegurar que la rehidratación y deduplicación en la UI sea infalible.
- **`useDebounce` hook:** `lib/useDebounce.ts` sustituye el patrón manual `setTimeout + useRef` en `handleCitySearch`.

### Anti-Alucinación v2 (Estrategia de 3 Capas)
- **Capa 1 — Grounding con Google Search:** La llamada REST a Gemini 2.5 Flash incluye `"tools": [{"google_search": {}}]`, permitiendo a la IA buscar en Google en tiempo real para verificar nombres y coordenadas antes de generar cada parada.
  - **Límite Capa Gratuita:** 1.500 requests/día gratis. El sistema bloquea el grounding a 1.400 req/día (margen de seguridad de 100). Si se alcanza el límite, la generación continúa **SIN grounding** (degradación graciosa) y se envía un email de alerta.
  - **Coste Fuera de Capa Gratuita:** $35 por cada 1.000 requests adicionales. El bloqueo automático impide que se incurra en costes no autorizados.
  - **Alerta Automática:** Al alcanzar el límite, se intenta notificar vía el secreto `SUPPORT_EMAIL` (y opcionalmente `ALERT_WEBHOOK_URL`). Se persiste un registro en `tours_cache` con `city='__system_alert__'` para auditoría.
  - **Configuración Requerida:** Crear el secreto `SUPPORT_EMAIL` en Supabase con la dirección de soporte de la aplicación. Opcionalmente, crear `ALERT_WEBHOOK_URL` para integración con servicios de notificación (Slack, Discord, etc.).
- **Capa 2 — Pre-catálogo Overpass API (Enriquecido):** Antes de llamar a Gemini, la Edge Function consulta la Overpass API con el bounding box dinámico de la ciudad. Query expandida con 10+ categorías: `historic`, `tourism` (attraction, museum, gallery, viewpoint, artwork, wine_cellar), `amenity` (place_of_worship, marketplace, theatre, arts_centre), `man_made=bridge`, `leisure` (park, garden), `building` (cathedral, church, mosque, synagogue, palace, castle). Los POIs se agrupan geográficamente en zonas de ~200m (`clusterCatalogByProximity` — BFS connectivity clustering) y se inyectan al prompt organizados por `ZONE — Central Zone`, `ZONE — North Quarter`, etc.
- **Capa 3 — GIS Endurecido:** Filtro 1.5 de Existencia Nominal en Ciudad implementado. La tolerancia MAGNETO se mantiene en 1km debido a esta protección temprana contra alucinaciones desplazadas. Política estricta: toda parada sin verificación GIS se elimina. Cross-reference contra catálogo Overpass como paso central de comprobación.
- **getCityInfo con población real:** La Edge Function extrae la población de `extratags.population` de Nominatim en vez de usar un valor hardcodeado. Esto corrige el cálculo del radio dinámico de permisividad.
- **Grounding Metadata Logging:** Se loguean las búsquedas de Google Search realizadas por Gemini (`groundingMetadata.webSearchQueries`) para auditar la calidad del grounding.

### Identidad y Voz de DAI
- **Persona Femenina y Primera Persona:** DAI es femenina y habla estrictamente en **primera persona del singular** ("yo", "me he dado cuenta", "te recomiendo"). Toda la concordancia gramatical debe usar adjetivos femeninos ("estoy convencida").
- **Prohibición de "Guía":** Está **estrictamente prohibido** que la IA utilice la palabra "guía" o "guide" para referirse a sí misma. Nunca se menciona a sí misma ni en tercera persona ni por nombre ('DAI', 'La Guía', 'tu guía'). Ella interactúa simplemente compartiendo sus vivencias de forma humana y cínica, asumiendo su rol sin etiquetarlo.
- **Dialecto Español Peninsular (Acento TTS):** Dado que Gemini TTS usa LLMs para deducir la entonación, cuando se solicitan tours en español, el prompt de generación de texto *fuerza* la inserción de modismos exclusivos de España ("vosotros", "fijaos", "guay", "chulo"). Esto manipula al modelo TTS para que la voz adoptada abandone el deje latinoamericano y hable con un estricto acento de España.
- **Voz Oficial "Kore":** Se utiliza exclusivamente la voz **"kore"** del modelo `gemini-2.5-flash-preview-tts` para todas las generaciones de audio. La configuración está centralizada en la Edge Function `generate-audio-dai`.
- **Interacción Cultural Adaptativa:** DAI se dirige al usuario en **segunda persona**, pero adaptando la forma (tú/usted, informal/formal) según el idioma y el contexto cultural de la ciudad visitada. El objetivo es mantener el tono sofisticado y sarcástico sin perder la resonancia cultural.
- **Coherencia Gramatical:** Esta regla es obligatoria para todos los idiomas soportados donde el género gramatical sea aplicable.

### Seguridad & Estado
- **Sin credenciales hardcoded:** `supabaseClient.ts` solo lee de variables de entorno. Si faltan, loga un error claro y no falla silenciosamente.
- **Row-Level Security (RLS) Estricto:** 
   - Las tablas de configuración y contraseñas (`secrets`) son innacesibles para el cliente.
   - **Objetivo Arquitectónico Restrictivo:** Los perfiles (`profiles`) están securizados para lectura/escritura de forma exclusiva para su usuario propietario (`auth.uid() = id`).
   - **Acceso Público Controlado:** Se utiliza la vista `public_profiles` para exponer únicamente datos no sensibles (`username`, `miles`, `rank`, `avatar`) en rankings y comunidad, protegiendo PII como el email o flags de admin.
   - **Caché Protegida:** 
       - Los tours (`tours_cache`) son de **Solo Lectura** (`SELECT`) para el cliente. La escritura es exclusiva de las Edge Functions vía `service_role`.
       - La tabla `audio_cache` tiene RLS activado: lectura pública e inserción restringida a usuarios autenticados.
   - **Logs de Error:** `error_logs` permite `INSERT` público (anónimo) para telemetría de fallos, pero solo los administradores tienen permisos de `SELECT`. Ver arquitectura completa en la sección "Reporting de Errores & Telemetría".
   - **Migración a Cola Nativa Completada:** La lógica pesada de generación se ha desacoplado en tres funciones: `tour-orchestrator`, `tour-worker-ai` y `tour-worker-gis`. Utilizan la tabla `generation_jobs` como cola de mensajes. El cliente ya no escribe en caché ni maneja bloqueos (locks).
   - **Manejo de Secretos y RLS en Servidor:** Debido a un bug del entorno Deno en Supabase donde `SUPABASE_SERVICE_ROLE_KEY` a veces llega vacío, se utiliza la variable personalizada `MY_SERVICE_ROLE_KEY` en las Edge Functions para inicializar el cliente y saltarse el RLS al hacer `upsert` de la DB.
   - **Bypass de Google Cloud Referrer:** Dado que las Edge Functions no envían un HTTP Referer por defecto, las llamadas a `generativelanguage.googleapis.com` tienen hardcodeado el header `'Referer': 'https://www.bdai.travel/'` para pasar de forma segura las restricciones de Google Cloud asociadas a la API Key.
   - **Reporting de Errores Mejorado:** La tabla `tours_cache` incluye la columna `error_message`. Cuando una generación falla en los workers (AI o GIS), se guarda el mensaje de error específico. La UI (`geminiService.ts`) detecta el estado `ERROR` vía Realtime y propaga este mensaje al usuario para un feedback inmediato y accionable.
- **Zustand como fuente única de verdad:** Se eliminaron todas las escrituras directas a `localStorage.setItem('bdai_profile', ...)` de `App.tsx`. El perfil persiste vía `storageProvider` (localStorage en Capacitor, sessionStorage en web). `activeTours` y `selectedCityInfo` son estado de navegación volátil y NO se persisten en ningún storage.
- **Toast en vez de alert():** Todos los errores de UI usan `toast()` del componente `Toast.tsx`. Compatible con Capacitor.
- **Flujo de Autenticación Dual (Web/Nativo):** Para solucionar problemas de redirección en Android (donde Supabase abría Chrome en lugar de volver a la app), se implementó un flujo híbrido en `useAuth.ts`:
   - **Nativo (Android/iOS):** Usa `@capacitor/browser` con `skipBrowserRedirect: true`. El login de Google se abre en un InAppBrowser. Los enlaces (OTP/OAuth) redirigen al custom scheme `travel.bdai.app://login-callback`. Un listener (`App.addListener('appUrlOpen')`) intercepta el deep link, procesa el token y cierra el browser, manteniendo al usuario 100% dentro de la app.
   - **Web:** Mantiene el flujo estándar redirigiendo a `window.location.origin`.
   - **Requisito de Infraestructura:** El AndroidManifest debe incluir el `intent-filter` para el scheme `travel.bdai.app`, y Supabase Dashboard debe tener `travel.bdai.app://**` en las Redirect URLs permitidas.
- **Restauración de Estado del Tour en Android (Sprint 1):** Cuando Android mata el proceso de la app (background, bloqueo de pantalla, presión de memoria), el usuario volvía al menú principal en lugar de al tour. Fix implementado en 3 ficheros coordinados:
   - **`TourActiveView.tsx`:** En lugar de redirigir inmediatamente a `/home` cuando `currentTour` es null, muestra un spinner y consulta `tours_cache` en Supabase usando el `tourId` de la URL. Parsea el ID (formato `slug_lang_tourIdx`) para extraer `city` y `language`. Restaura `activeTours`, `currentTour` y `currentStopIndex`. Solo redirige al home si la consulta falla.
   - **`App.tsx`:** Guarda la ruta activa (`/tour/:id/stop/:idx`) en `localStorage` (`bdai_last_tour_route` + `bdai_last_tour_route_ts`) mientras el usuario está en un tour. La limpia cuando navega al home o login.
   - **`hooks/useAuth.ts`:** En `handleLoginSuccess`, antes de navegar a `/home`, comprueba si existe una ruta guardada con TTL válido (24h). Si existe, navega directamente allí. `TourActiveView` se encarga de rehidratar el estado desde Supabase. Los usuarios nuevos (onboarding) siempre van a `/home`.

### Reporting de Errores & Telemetría

- **Fuente única de verdad:** Toda la lógica de inserción de errores en la base de datos está centralizada en `services/errorService.ts`. Ningún componente debe importar `supabase` directamente para reportar errores.
  - `submitBugReport({ description, language, userEmail? })` — reporte manual iniciado por el usuario. Enriquece automáticamente con `url` y `userAgent`.
  - `logAutoError({ error, componentStack?, language? })` — captura automática desde `ErrorBoundary`. Se llama en `componentDidCatch` sin intervención del usuario.
- **Tabla exclusiva:** `error_logs` (PostgreSQL). **La tabla `bug_reports` no existe.** El schema de `error_logs` es: `id`, `error_message`, `context`, `user_email` (default `'anonymous'`), `language`, `url`, `created_at`. RLS: INSERT público (anon), SELECT solo admin.
- **Dos flujos de captura:**
  1. **Manual:** Usuario pulsa "Reportar Error" en `ProfileModal` → `ReportBugModal` (con `userEmail` pasado como prop) → `errorService.submitBugReport()`. Tras el INSERT exitoso, muestra mensaje de agradecimiento y se cierra sola en 3 segundos. Si el INSERT falla, muestra error inline.
  2. **Automático (sin acción del usuario):** `ErrorBoundary.componentDidCatch` llama a `errorService.logAutoError()` de forma silenciosa. El prefijo `[AUTO]` en `error_message` distingue estos registros de los manuales.
- **Notificación por email:** Database Webhook (`trigger-error-log`) → Edge Function `notify-error` → Resend API → `support@bdai.travel`.
  - Secrets requeridos en Supabase: `RESEND_API_KEY` y `SUPPORT_EMAIL` (valor: `support@bdai.travel`).
  - El asunto distingue el tipo: `🔴 Crash automático` vs `🐛 Reporte de usuario`.
  - Documentación del webhook: `services/supabase/database-webhooks/trigger-error-log.md`.
  - Código de la Edge Function: `services/supabase/edge-functions/notify-error.md`.
- **`ReportBugModal` acepta `userEmail?: string`** para identificar al usuario en los reportes del perfil. El `ErrorBoundary` no tiene acceso al perfil, por lo que envía `anonymous`.

### Navegación & Rutas (Opción B — Columna Dedicada)
- **Arquitectura elegida:** Columna `route_polylines jsonb` separada en `tours_cache` (NO embebida en el objeto `data`). Permite actualizaciones quirúrgicas O(1) sin reescribir el blob completo de ~30KB por fila.
- **Schema:** `tours_cache.route_polylines = { "[tour-id]": "encoded_polyline_string", ... }`.
- **Columnas tours_cache:** `city` (PK), `language` (PK), `status`, `data` (jsonb), `route_polylines` (jsonb), `error_message` (text), `updated_at`.
- **RPC `upsert_tour_polyline`:** Función SQL `SECURITY DEFINER` que usa `jsonb_set` para actualizar una sola clave del mapa sin leer ni reescribir el resto. Accesible por `anon` y `authenticated`.
- **Flujo de escritura (tours nuevos):** Workers GIS generan `routePolyline` via OSRM → se persisten en `route_polylines` por separado.
- **Flujo de lectura (caché hit):** `select('data, route_polylines')` + rehidratación: `tour.routePolyline = savedPolylines[tour.id] ?? tour.routePolyline`. Esto ocurre tanto en `useCity.ts` (flujo normal) como en `CityDetailView.tsx` (rehidratación por pérdida de estado).
- **Estrategia Backfill Progresivo:** Si tours cargados desde caché carecen de polyline, `backfillMissingPolylines()` lanza un proceso fire-and-forget en background: calcula con OSRM → llama a `updateRoutePolyline` (vía RPC) → silencioso, no bloquea UI.
- **`fetchRoutePolyline` exportada:** Necesaria para el backfill desde `App.tsx`.
- **RouteMode (3 modos de ruta):** `lib/routingService.ts` expone `optimizeStopOrder(tour, mode?: RouteMode)` con tres modos: `open` (NN+2-opt+Or-opt abierto, por defecto), `circular` (2-opt y Or-opt incluyen el coste de regreso al inicio; OSRM usa `/route` con polilínea), `centripetal` (fija la parada más lejana del centroide como inicio y la más cercana como fin, optimiza el tramo intermedio con 2-opt/Or-opt de extremos fijos). El `TourCard` expone un toggle de 3 pills (Lineal/Circular/Al centro) antes de lanzar el tour; al cambiar se recalcula el orden y la polilínea en cliente sin modificar el caché.
- **`SchematicMap` sin cambios:** Ya consume `routePolyline` — ámbar si real, blanca si fallback.
- **URL como fuente de verdad de navegación:** `CityDetailView` usa el parámetro `:slug` de React Router como fuente primaria. Si `activeTours` está vacío al montar (pérdida de estado en mobile), la vista lanza automáticamente una query a `tours_cache` y rehidrata el estado sin redirigir al usuario. Solo redirige a `/home` si no existe caché para ese slug.

### Arquitectura Modular Funcional
- **Desacoplamiento de IA y GIS**: Se ha subdividido el antiguo `geminiService.ts` (Monolito) en capas especializadas:
  - `lib/gisService.ts`: Lógica pura de mapas y geocoding (Nominatim/Photon).
  - `lib/routingService.ts`: Algoritmos de optimización (TSP, 2-opt) y polilíneas.
  - `services/gemini/config.ts`: Cliente de IA y gestión de cuotas/errores.
  - `services/gemini/prompts.ts`: Definición de la Identidad de DAI y plantillas de prompts.
  - `services/geminiService.ts`: Orquestador que coordina las capas anteriores.
- **Razón**: Permite testear algoritmos de rutas sin llamadas a IA, facilita el cambio de modelo de LLM y mejora drásticamente la legibilidad.

### Ficheros de Infraestructura Core (OBLIGATORIO — No Eliminar)

#### `services/gemini/config.ts` — Cliente Gemini con reintentos
- **Qué hace:** Singleton `GoogleGenAI`, clase `QuotaError` y wrapper `handleAiCall` con backoff exponencial (3 reintentos, 2 s → 4 s → 8 s).
- **Por qué es necesario:** La generación de tours (`tour-orchestrator`, `tour-worker-ai`) ocurre vía Edge Functions sin pasar por este fichero. Pero `geminiService.ts` sigue usando Gemini directamente **desde el cliente** para dos llamadas ligeras que no justifican una Edge Function:
  1. `translateSearchQuery()` — detecta el idioma y traduce el término de búsqueda a inglés.
  2. `normalizeCityWithAI()` — desambigua ciudades homónimas (ej. "Valencia" → España vs Venezuela) y corrige typos en tiempo real mientras el usuario escribe.
- **Si se elimina:** el buscador de ciudades rompe completamente; los usuarios no pueden buscar en su idioma ni encontrar ciudades con nombres ambiguos.

#### `services/supabase/client.ts` — Singleton del cliente Supabase
- **Qué hace:** Inicializa `createClient` con las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) y exporta `supabase`. Incluye un fallback mock para entornos sin credenciales.
- **Por qué es necesario:** Es el único punto de creación del cliente. **Toda** la app accede a Supabase a través de este singleton (via `supabaseClient.ts` que re-exporta `supabase` de aquí). `errorService.ts` también lo importa directamente. Instanciar un segundo cliente rompería la política RLS y el manejo de sesión.
- **Tipado (`UntypedDatabase`):** Como el proyecto no usa `supabase gen types`, se define un tipo placeholder `UntypedDatabase` con `Tables/Views/Functions` como `Record<string, any/unknown>`. Esto satisface el constraint `GenericSchema` de supabase-js 2.49+ sin colapsar a `never`. El campo `Relationships: never[]` en Tables y Views es **obligatorio** — sin él, `Schema` colapsa a `never` y todas las queries devuelven `never` en vez de `Record<string, any>`.
- **Boundary casts:** Las queries devuelven `Record<string, any>[]`. Cada punto de consumo usa `data as TypedInterface[]` para tipar los datos al entrar en la app. Las llamadas `.rpc()` requieren que los args extiendan `Record<string, unknown>` (no `any`), lo que es compatible con todos los payloads actuales.
- **Si se elimina:** toda la app pierde acceso a auth, datos, storage y Edge Functions.

## Restricciones de Entorno y Despliegue (IMPORTANTE)
- **Flujo de Trabajo de Edge Functions (SSOT):** La ÚNICA fuente de la verdad para el código de las Edge Functions son los archivos con extensión **`.md`** ubicados en **`services/supabase/`**. 
  - **Convención de Nombres en esta carpeta:** Los ficheros aquí siempre usan guiones medios (`-`) y extensión `.md` (ej. `generate-audio-dai.md`, `tour-orchestrator.md`). Para estas funciones, no existen versiones `.txt` ni nombres con guiones bajos (`_`).
  - **Resto del proyecto:** Fuera de esta carpeta, se pueden usar `.txt` o `_` según se hayan creado originalmente.
  - Está estrictamente prohibido usar la estructura CLI de Supabase (`supabase/functions/`) para evitar el síndrome de "Split Brain".
- **Despliegue de Supabase:** El usuario no utiliza el CLI de Supabase para despliegues. Cuando el Agente deba modificar una Edge Function, modificará directamente el archivo `.md` local correspondiente asegurando que el código TypeScript quede dentro de un bloque de código markdown (` ```typescript `). 
- **Acción requerida del usuario:** Tras modificar el archivo `.md`, el Agente indicará al usuario que debe abrir ese archivo, copiar el bloque de código y pegarlo manualmente en el Web Dashboard de Supabase. Nunca se propondrán comandos `supabase functions deploy`.
- **Pruebas de Backend:** Evitar el uso de herramientas de modificación directa de DB/Estructura desde el terminal del Agente. Las propuestas de cambio en SQL o reglas RLS deben ser validadas por el usuario y aplicadas manualmente en el Dashboard.

### Protocolo Obligatorio de Verificación (BUILD CHECK)
- **Mandato:** Antes de dar por finalizada cualquier tarea que modifique la estructura del código (`App.tsx`, `store/`, `types.ts`, `routing`), el AGENTE **DEBE** ejecutar localmente el comando `npm run build`.
- **Objetivo:** Detectar errores de TypeScript, importaciones faltantes o cierres de etiquetas JSX inválidos que el linter del IDE pueda pasar por alto pero que rompan el despliegue en Vercel.
- **Criterio de Éxito:** Una respuesta "TODO OK" del Agente solo es válida si el `Exit code` de `npm run build` ha sido `0` en la última ejecución.

### Migración a React Router DOM
- **Motivo:** Sustitución del sistema manual basado en estados (`AppView`) por un sistema de enrutamiento estándar de la industria.
- **Estrategia:** Uso de `HashRouter` para asegurar compatibilidad total con el sistema de archivos de Capacitor en iOS/Android.
- **Beneficios:** Soporte nativo para el botón "atrás", deep-linking a paradas específicas de tours (`/tour/:id/stop/:idx`) y mejor gestión del ciclo de vida de los componentes.
- **Estado:** `AppView` y `currentView` eliminados de Zustand; navegación centralizada en `App.tsx` con hooks `useNavigate` y `useLocation`.
- **⚠️ PITFALL DETECTADO:** Al refactorizar vistas dentro de `App.tsx`, evitar anidar declaraciones de funciones (`const View = () => ...`) dentro de bloques de `return (...)` de JSX. Esto causa fallos críticos de compilación en producción (Vercel) aunque el hot-reload local pueda parecer funcionar.
- **⚠️ IMPORTANTE:** Siempre verificar que `React, { useState, useEffect, useCallback }` estén importados si se usan en el archivo principal tras una limpieza de código o refactorización.
