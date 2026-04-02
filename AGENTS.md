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
- `/data`: Datos estáticos, fallbacks, config.
- `/lib`: Utilidades y helpers globales.

## Decisiones Arquitectónicas (Historial)

### Generación de Tours (geminiService.ts)
- **Sistema de Rigor Universal:** La regla de "No Inventar" y referenciar solo POIs 100% reales es absoluta e independiente del tamaño de la ciudad. No se usan reglas más permisivas para ciudades grandes.
- **Deep Retrieval para Volumen de Tours:** La cantidad de tours (1, 2 o 3) no se basa en la población, sino en el patrimonio extraíble. Se instruye a la IA a realizar una búsqueda exhaustiva (Deep Retrieval) en su base de conocimiento con el objetivo de alcanzar 3 tours temáticos (24 paradas). Solo si carece genuinamente de patrimonio real comprobable, reducirá dinámicamente a 2 o 1 tour.
- **Coordinadas verificadas:** El campo `coordinatesVerified?: boolean` en la interfaz `Stop` diferencia POIs confirmados geométricamente por Nominatim (solo si están a < 500m de la estimación base) de los generados por Gemini sin verificar.
- **Radio máximo:** Todos los POIs deben estar a ≤2km del centro de la ciudad.
- **Modelo IA:** Estandarizado en `gemini-2.5-flash` para texto y `gemini-2.0-flash-preview-image-generation` para imágenes.
- **Regla de oro:** "Truth First, Style Second". El sarcasmo DAI solo se aplica tras confirmar la existencia real del lugar.

### Rendimiento & Estabilidad
- **`haversineKm` hoistada:** Función Haversine disponible en todo el módulo desde la línea ~125 de `geminiService.ts`. Elimina los cálculos inline duplicados que había en `verifyStopCoordinates` y `processTourStops`.
- **Pipeline de verificación GIS (Híbrido - 3 niveles de confianza):** `verifyStopCoordinates` acepta un `requestTs` compartido (rate limiter de 1 req/s) y devuelve siempre una parada (nunca la elimina):
  1. **Nivel 1 (Validado O.S.M.):** Si la distancia entre lo que dice Nominatim y lo que dijo Gemini es <500m, o <2km pero dentro del área de tour (<5km del centro): `coordinatesVerified = true` con coords de Nominatim (más exactas, ej. fachada de edificio).
  2. **Nivel 2 (Homónimo - conservando Gemini):** Si la distancia Gemini ↔ Nominatim diverge (>2km), asumimos que Nominatim ha encontrado un homónimo en el lugar equivocado, por tanto conservamos las coordenadas de Gemini intactas para no desplazar erróneamente el punto en el mapa (pero con `coordinatesVerified = false`).
- **Viewbox Restituido:** Búsqueda acotada con viewbox de `±0.04°` (~4.4km radius), adecuado para cubrir sobradamente el radio de los tours que es de 2km del centro histórico, reduciendo resultados fuera de contexto desde un principio.
- **Rate limiting inteligente y creación secuencial:** `requestTs` compartido entre todas las paradas del tour, se procesa de forma **secuencial**. Solo espera dinámicamente el tiempo necesario para completar el límite de 1100ms reales por petición desde la anterior llamada a la red (evitando `setTimeout(1200)` ciegos).
- **Política de eliminación de Paradas:** Una parada NUNCA se elimina del tour, excepto si las coordenadas resultantes del proceso apuntan a un lugar que está a **>10km** de distancia del centro de la ciudad (alucinación fuera del contexto del casco histórico de 2km).
- **`Accept-Language: en`** en todas las búsquedas de OSM, asegurando mejor respuesta internacional y menos fallos de geocoding.
- **ErrorBoundary global:** `components/ErrorBoundary.tsx` envuelve toda la app en `index.tsx`. Captura errores de render no manejados y muestra una pantalla de fallback con el botón "Reportar Fallo" pre-relleno con el stack trace, URL, timestamp y user agent.
- **`ReportBugModal`:** Acepta `prefillText?: string` para recibir datos del `ErrorBoundary` automáticamente.
- **GPS validation:** Las coordenadas de `watchPosition` se validan (rango válido, no NaN, no 0,0) antes de actualizar el estado.
- **Flujo de Audio Persistente:** `generateAudio` es secuencial e íntegro. Si el audio no está en caché, se genera con Gemini, se sube obligatoriamente a Supabase Storage y se devuelve la URL pública del bucket. El `AudioManager` consume siempre desde la URL del bucket, garantizando que el audio ya "vive" en la nube antes de sonar por primera vez.
- **AudioContext lifecycle:** El `AudioManager` singleton suspende el `AudioContext` al ir a segundo plano (`visibilitychange`) y lo reanuda al volver. Reduce consumo de batería en iOS/Android.
- **`useDebounce` hook:** `lib/useDebounce.ts` sustituye el patrón manual `setTimeout + useRef` en `handleCitySearch`.

### Seguridad & Estado
- **Sin credenciales hardcoded:** `supabaseClient.ts` solo lee de variables de entorno. Si faltan, loga un error claro y no falla silenciosamente.
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
