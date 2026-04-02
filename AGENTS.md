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
- **Nominatim concurrente:** `processTourStops` usa un pool de 4 peticiones paralelas con 250ms entre batches (en vez de 600ms secuencial). Reduce el tiempo de ~14s a ~3-4s para 24 paradas.
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

### Navegación & Rutas
- **Caché de Rutas Geoespaciales (Obligatorio):** Para minimizar el consumo de cuotas de APIs de navegación (OSRM/OSM) e incrementar el rendimiento, las rutas entre paradas deben calcularse una sola vez y persistirse en el campo `routePolyline` de la tabla `tours_cache`.
- **Estrategia Fallback:** Si un tour no tiene `routePolyline`, la app lo calculará en el cliente la primera vez e intentará persistirlo en el backend para futuros usuarios.
