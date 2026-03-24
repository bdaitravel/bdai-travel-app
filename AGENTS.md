# Proyecto: BDAI (Better Destinations AI)

**Objetivo:** Desarrollar/mantener Super App de viajes (Tours IA, Shop, eSIM, Gamificación).
**Core Focus:** Geolocalización (Leaflet), UI móvil premium (Capacitor), Generación dinámica (Gemini) como fallback de DB.

## Roles del Agente (Experto Senior 10+ Años en cada área)
**1. Dev Fullstack & Experto en IA**
- Desarrollo integral y diseño de arquitecturas escalables.

**2. Inteligencia Espacial & GIS (Geolocalización)**
- **Capacidades:** Geocoding bidireccional, cálculo de rutas y distancias (Haversine/APIs), análisis de "Geo-fencing" para alertas.
- **Protocolo Core:** *Siempre validar precisión de coordenadas $L (lat, lon)$ antes de procesar datos espaciales.*

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
