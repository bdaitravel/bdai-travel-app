# Proyecto: BDAI (Better Destinations AI)

## Mandato del Agente Experto (Antigravity)
Como arquitecto senior y consultor estratégico, **debes**:
1. **Dudar y Cuestionar:** Si el usuario propone algo técnicamente inferior o arriesgado (ej. lógica crítica en el cliente), debes señalarlo y proponer la "Best Practice" de industria.
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
- **Gestión de Estado (`zustand`):** El estado global volátil (reproductor de audio, tours activos) debe centralizarse con `zustand`. Evitar estados gigantes en `App.tsx` y el prop-drilling excesivo.
- **Caché por Entorno (Obligatorio):** Cualquier persistencia de estado debe evaluar siempre la plataforma:
  - **Móvil (Capacitor):** Usar almacenamiento persistente (`localStorage`) para ahorrar cuota de red y batería al viajero.
  - **Web:** Usar almacenamiento efímero (`sessionStorage`). Todos los datos de sesión deben desaparecer auto-destruyéndose al cerrar la pestaña.

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
- `/data`: Datos estáticos, fallbacks, config.
- `/lib`: Utilidades y helpers globales (GIS, Routing, Debounce).

## Decisiones Arquitectónicas (Historial)

### Generación de Tours (geminiService.ts)
- **Sistema de Rigor Universal:** La regla de "No Inventar" y referenciar solo POIs 100% reales es absoluta e independiente del tamaño de la ciudad. No se usan reglas más permisivas para ciudades grandes.
- **Deep Retrieval para Volumen de Tours:** La cantidad de tours (1, 2 o 3) no se basa en la población, sino en el patrimonio extraíble. Se instruye a la IA a realizar una búsqueda exhaustiva (Deep Retrieval) en su base de conocimiento con el objetivo de alcanzar 3 tours temáticos (24 paradas). Solo si carece genuinamente de patrimonio real comprobable, reducirá dinámicamente a 2 o 1 tour.
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
  3. **Filtro de radio dinámico**: El radio máximo permitido se calcula según la población: <20k → 3km, <200k → 5km, >200k → 10km.
- **Política de eliminación de Paradas:** Una parada se elimina si: (1) no existe en OSM a nivel global, (2) sus coordenadas no pueden ser verificadas en el municipio correcto, o (3) las coordenadas verificadas superan el radio dinámico desde el centro de la ciudad. Si un tour queda con menos de 3 paradas verificadas, el tour completo se descarta.
- **`Accept-Language: en`** en todas las búsquedas de OSM, asegurando mejor respuesta internacional y menos fallos de geocoding.
- **ErrorBoundary global:** `components/ErrorBoundary.tsx` envuelve toda la app en `index.tsx`. Captura errores de render no manejados y muestra una pantalla de fallback con el botón "Reportar Fallo" pre-relleno con el stack trace, URL, timestamp y user agent.
- **`ReportBugModal`:** Acepta `prefillText?: string` para recibir datos del `ErrorBoundary` automáticamente.
- **GPS validation:** Las coordenadas de `watchPosition` se validan (rango válido, no NaN, no 0,0) antes de actualizar el estado.
- **Flujo de Audio Persistente:** `generateAudio` es secuencial e íntegro. Si el audio no está en caché, se genera con Gemini, se sube obligatoriamente a Supabase Storage y se devuelve la URL pública del bucket. El `AudioManager` consume siempre desde la URL del bucket, garantizando que el audio ya "vive" en la nube antes de sonar por primera vez.
- **AudioContext lifecycle:** El `AudioManager` singleton suspende el `AudioContext` al ir a segundo plano (`visibilitychange`) y lo reanuda al volver. Reduce consumo de batería en iOS/Android.
- **Bloqueo de Concurrencia (tours_cache):** Implementado sistema de bloqueo atómico mediante columna `status` ('GENERATING', 'READY', 'ERROR'). Evita que múltiples clientes disparen Gemini para la misma ciudad. Las pestañas secundarias se suscriben vía Realtime y esperan el estado 'READY' mostrando el mensaje oficial de DAI.
- **Identificadores Deterministas:** Los tours ahora usan un `id` compuesto (`slug_lang_idx`) para asegurar que la rehidratación y deduplicación en la UI sea infalible durante el streaming y post-procesamiento GIS.
- **Optimización de Verificación On-the-fly**: El proceso de refinado geográfico (GIS) y optimización de rutas ya no espera al final del streaming. Se dispara una tarea en segundo plano en cuanto un tour alcanza las 10 paradas. Esto permite ver paradas "Reales" en el Tour 1 mientras el Tour 3 aún se está generando.
- **Shared Rate Limiter (GisService)**: Implementado un limitador de frecuencia global en el módulo `lib/gisService.ts` que garantiza un espaciado de 1.1s entre peticiones a Nominatim, independientemente de cuántos tours se estén procesando en paralelo.
- **Feedback de Precisión Progresivo**: La UI recibe primero la versión Gemini (`Validando...`) y luego se actualiza automáticamente a la versión OSM (`Real`) sin intervención del usuario.
- **`useDebounce` hook:** `lib/useDebounce.ts` sustituye el patrón manual `setTimeout + useRef` en `handleCitySearch`.

### Anti-Alucinación v2 (Estrategia de 3 Capas)
- **Capa 1 — Grounding con Google Search:** La llamada REST a Gemini 2.5 Flash incluye `"tools": [{"google_search": {}}]`, permitiendo a la IA buscar en Google en tiempo real para verificar nombres y coordenadas antes de generar cada parada.
  - **Límite Capa Gratuita:** 1.500 requests/día gratis. El sistema bloquea el grounding a 1.400 req/día (margen de seguridad de 100). Si se alcanza el límite, la generación continúa **SIN grounding** (degradación graciosa) y se envía un email de alerta.
  - **Coste Fuera de Capa Gratuita:** $35 por cada 1.000 requests adicionales. El bloqueo automático impide que se incurra en costes no autorizados.
  - **Alerta Automática:** Al alcanzar el límite, se intenta notificar vía el secreto `SUPPORT_EMAIL` (y opcionalmente `ALERT_WEBHOOK_URL`). Se persiste un registro en `tours_cache` con `city='__system_alert__'` para auditoría.
  - **Configuración Requerida:** Crear el secreto `SUPPORT_EMAIL` en Supabase con la dirección de soporte de la aplicación. Opcionalmente, crear `ALERT_WEBHOOK_URL` para integración con servicios de notificación (Slack, Discord, etc.).
- **Capa 2 — Pre-catálogo Overpass API:** Antes de llamar a Gemini, la Edge Function consulta la Overpass API de OpenStreetMap con el bounding box de la ciudad. Obtiene un catálogo de POIs reales (monumentos, iglesias, atracciones turísticas) con coordenadas verificadas. Este catálogo se inyecta en el prompt como sección `VERIFIED POI CATALOG` para que Gemini priorice POIs reales sobre su conocimiento interno.
- **Capa 3 — GIS Endurecido:** Filtro 1.5 de Existencia Nominal en Ciudad implementado. La tolerancia MAGNETO se mantiene en 1km debido a esta protección temprana contra alucinaciones desplazadas. Política estricta: toda parada sin verificación GIS se elimina. Cross-reference contra catálogo Overpass como paso central de comprobación.
- **getCityInfo con población real:** La Edge Function ahora extrae la población de `extratags.population` de Nominatim (igual que el cliente) en vez de usar un valor hardcodeado de 100.000. Esto corrige el cálculo del radio dinámico de permisividad.
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
   - Los tours (`tours_cache`) son de Solo Lectura (`SELECT`) para el cliente para evitar inyecciones maliciosas de datos.
   - **Migración a Backend Completada:** La lógica pesada de generación (Llamadas a Gemini, Validación GIS y Optimización de rutas) se ha trasladado con éxito a la Edge Function central `generate-tours-dai`. El cliente ya no escribe en caché ni maneja bloqueos (locks).
   - **Manejo de Secretos y RLS en Servidor:** Debido a un bug del entorno Deno en Supabase donde `SUPABASE_SERVICE_ROLE_KEY` a veces llega vacío, se utiliza la variable personalizada `MY_SERVICE_ROLE_KEY` en las Edge Functions para inicializar el cliente y saltarse el RLS al hacer `upsert` de la DB.
   - **Bypass de Google Cloud Referrer:** Dado que las Edge Functions no envían un HTTP Referer por defecto, las llamadas a `generativelanguage.googleapis.com` tienen hardcodeado el header `'Referer': 'https://www.bdai.travel/'` para pasar de forma segura las restricciones de Google Cloud asociadas a la API Key.
- **Zustand como fuente única de verdad:** Se eliminaron todas las escrituras directas a `localStorage.setItem('bdai_profile', ...)` de `App.tsx`. El perfil persiste vía `storageProvider` (localStorage en Capacitor, sessionStorage en web).
- **Toast en vez de alert():** Todos los errores de UI usan `toast()` del componente `Toast.tsx`. Compatible con Capacitor.

### Navegación & Rutas (Opción B — Columna Dedicada)
- **Arquitectura elegida:** Columna `route_polylines jsonb` separada en `tours_cache` (NO embebida en el objeto `data`). Permite actualizaciones quirúrgicas O(1) sin reescribir el blob completo de ~30KB por fila.
- **Schema:** `tours_cache.route_polylines = { "[tour-id]": "encoded_polyline_string", ... }`. Clave = `tour.id`, valor = Google Encoded Polyline Format (OSRM).
- **RPC `upsert_tour_polyline`:** Función SQL `SECURITY DEFINER` que usa `jsonb_set` para actualizar una sola clave del mapa sin leer ni reescribir el resto. Accesible por `anon` y `authenticated`.
- **Flujo de escritura (tours nuevos):** `generateToursForCity` → `optimizeStopOrder` genera `routePolyline` via OSRM → `saveToursToCache` extrae automáticamente las polylines de los tours y las persiste en `route_polylines` por separado.
- **Flujo de lectura (caché hit):** `select('data, route_polylines')` + rehidratación en cliente: `tour.routePolyline = savedPolylines[tour.id] ?? tour.routePolyline`.
- **Estrategia Backfill Progresivo:** Si tours cargados desde caché carecen de polyline (los 1412 existentes), `backfillMissingPolylines()` lanza un proceso fire-and-forget en background: calcula con OSRM → llama a `updateRoutePolyline` (vía RPC) → silencioso, no bloquea UI. Los tours se enriquecen progresivamente con cada visita de usuario.
- **Bug corregido:** `optimizeStopOrder` usaba `newDistance` y `newDuration` como variables no declaradas. Corregido: se derivan correctamente de `calculateRouteDistance` y `calculateDuration`.
- **`fetchRoutePolyline` exportada:** Necesaria para el backfill desde `App.tsx`.
- **`SchematicMap` sin cambios:** Ya consume `routePolyline` — ámbar si real, blanca si fallback.

### Arquitectura Modular Funcional
- **Desacoplamiento de IA y GIS**: Se ha subdividido el antiguo `geminiService.ts` (Monolito) en capas especializadas:
  - `lib/gisService.ts`: Lógica pura de mapas y geocoding (Nominatim/Photon).
  - `lib/routingService.ts`: Algoritmos de optimización (TSP, 2-opt) y polilíneas.
  - `services/gemini/config.ts`: Cliente de IA y gestión de cuotas/errores.
  - `services/gemini/prompts.ts`: Definición de la Identidad de DAI y plantillas de prompts.
  - `services/geminiService.ts`: Orquestador que coordina las capas anteriores.
- **Razón**: Permite testear algoritmos de rutas sin llamadas a IA, facilita el cambio de modelo de LLM y mejora drásticamente la legibilidad.

## Restricciones de Entorno y Despliegue (IMPORTANTE)
- **Despliegue de Supabase:** El terminal del Agente NO tiene permisos de escritura/deploy en Supabase. Todos los cambios en Edge Functions, SQL o Storage deben ser proporcionados al usuario en forma de código e instrucciones para que él los ejecute manualmente (vía Web Dashboard o su terminal local).
- **Pruebas de Backend:** Evitar el uso de herramientas de modificación directa de DB/Estructura desde el terminal del Agente. Las propuestas de cambio deben ser validadas por el usuario primero.
- **Flujo de Trabajo:** Proporcionar comandos listos para copiar y pegar (ej. `supabase functions deploy ...`) para facilitar la tarea al usuario.

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

