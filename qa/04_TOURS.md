# 🗺️ Módulo 04 — Tours & Audio

> **Componentes:** `TourCard.tsx`, `TourActiveView.tsx`, `useAudio.ts`, `routingService.ts`, `geminiService.ts`, Edge Functions (`generate-tours-dai`, `generate-audio-dai`)  
> **Rutas:** `/city/:cityId`, vista modal interna de tour

---

## A. Generación de Tours (Edge Function)

- [ ] 🔴 TC-04-001: Generar ruta de nueva ciudad (On-Demand)
  - **Precondición:** Ciudad de prueba borrada de DB (ej. Logroño)
  - **Pasos:** 1. Buscar "Logroño" → 2. Entrar a `/city/logrono_es`
  - **Resultado esperado:** Inicia "Generating 3 exclusive AI routes...". Se muestra progreso. Tras unos 10-20s, se completa (check verde) y se muestran 3 tours en la UI (Iconic, Cultural, Hidden Gems)
  - **Observaciones:**

- [ ] 🔴 TC-04-002: Re-abrir ciudad con rutas cacheadas
  - **Precondición:** Ciudad ya generada en TC-04-001 (Logroño)
  - **Pasos:** 1. Volver a `/home` → 2. Recargar página → 3. Buscar "Logroño" de nuevo
  - **Resultado esperado:** Carga instantáneamente desde Supabase DB, sin retraso de generación
  - **Observaciones:**

- [ ] 🟡 TC-04-003: Degradación sin Grounding
  - **Precondición:** Modificar Edge Function temporalmente para simular límite de cuota Google Search, o pedir una ciudad muy remota sin datos.
  - **Pasos:** 1. Generar ciudad
  - **Resultado esperado:** La generación funciona creando contenido genérico, indicando (si existe el feedback visual) que se usó fallback
  - **Observaciones:**

---

## B. Vista Tour Activo (TourCard)

- [ ] 🔴 TC-04-004: Iniciar un Tour
  - **Precondición:** Ciudad con tours, en `/city/logrono_es`
  - **Pasos:** 1. Tocar el título o imagen de un tour particular ("Iconic Logrono")
  - **Resultado esperado:** Se despliega a pantalla completa. Se carga el mapa con polilínea de ruta, muestra título, autor (bdai), y botón START TOUR o Let's Explore.
  - **Observaciones:**

- [ ] 🟡 TC-04-005: Visualización de Ruta en Mapa (Leaflet + Routing)
  - **Precondición:** Tour activo abierto
  - **Pasos:** 1. Observar mapa inicial
  - **Resultado esperado:** Polilínea renderizada (roja/turquesa) conectando todos los puntos. Marcadores para las paradas. Zoom auto-ajustado. (Testar que la polilínea no son solo lineas rectas si `getWalkingRoute` funcionó - llama a OSRM).
  - **Observaciones:**

- [ ] 🟢 TC-04-006: Botón Atrás desde Tour Activo
  - **Precondición:** Tour Activo abierto (sin iniciar GPS)
  - **Pasos:** 1. Pulsar `< BACK` o botón de cierre
  - **Resultado esperado:** Se pliega el tour, vuelve a la lista de tours de la ciudad
  - **Observaciones:**

---

## C. Flujo de Navegación del Tour (Steps)

- [ ] 🔴 TC-04-007: Avanzar y retroceder de parada
  - **Precondición:** Tour Activo
  - **Pasos:** 1. Pulsar botón de Siguiente (Next) → 2. Pulsar botón Anterior (Prev)
  - **Resultado esperado:** La tarjeta inferior actualiza título y breve descripción. El mapa hace "flyTo" al marcador correspondiente
  - **Observaciones:**

- [ ] 🟡 TC-04-008: Mostrar "Dai Tip" / Curiosidad
  - **Precondición:** En la primera parada
  - **Pasos:** 1. Pulsar botón amarillo o icono de "Dai Tip"
  - **Resultado esperado:** Muestra un modal/alert con "DAI TIP: [curiosidad histórica/sarcastica]"
  - **Observaciones:**

- [ ] 🔴 TC-04-009: Completar Tour (Botón de Check/Flag)
  - **Precondición:** Llegar a la última parada del tour
  - **Pasos:** 1. Pulsar el botón verde primario final (Finish Tour / Collect Reward)
  - **Resultado esperado:** Confeti 🎉, lanza petición a Edge Function `award-tokens-dai`, añade tour a `completed_tours` del usuario, actualiza tokens del Pasaporte. Redirige o cierra.
  - **Observaciones:**

---

## D. Reproductor de Audio (Edge Function & `useAudio`)

- [ ] 🔴 TC-04-010: Generación y Playback de Audio (Happy Path)
  - **Precondición:** En una parada (Stop 1) sin audio generado aún
  - **Pasos:** 1. Pulsar botón Play (▶️)
  - **Resultado esperado:** Estado pasa a `generating`, muestra `Generating Dai Audio...` animado. Una vez generado e inyectado header WAV, cambia a `playing`, icono pasa a Stop (⏹️) o Pause, se escucha la voz de Dai
  - **Observaciones:**

- [ ] 🔴 TC-04-011: Audio de Caché (Playback Inmediato)
  - **Precondición:** Audio ya generado y guardado en bucket `audio`
  - **Pasos:** 1. Entrar a otra parada ya generada, pulsar Play
  - **Resultado esperado:** Carga instantánea de URL pública (`playing`), sin estado `generating`
  - **Observaciones:**

- [ ] 🟡 TC-04-012: Control de Velocidad (Speed)
  - **Precondición:** Reproductor activo en el tour
  - **Pasos:** 1. Tocar selector de velocidad (`1.0x`) → 2. Cambiar a `1.5x` u otro → 3. Pulsar Play (o hacerlo mientras repoduce)
  - **Resultado esperado:** La velocidad de voz aumenta. El setting se guarda globalmente y persiste entre paradas.
  - **Observaciones:**

- [ ] 🟡 TC-04-013: Fallo de Generación de Audio
  - **Precondición:** Simular fallo de API Key o red caída
  - **Pasos:** 1. Pulsar Play
  - **Resultado esperado:** Muestra alert o toast: "Failed to load audio / Generate error", se restablece estado inicial para permitir reintento
  - **Observaciones:**

- [ ] 🟢 TC-04-014: Avance visual (Barra de progreso) - *Si aplica*
  - **Precondición:** Audio en reproducción
  - **Pasos:** 2. Observar interfaz
  - **Resultado esperado:** El reproductor (Wavesurfer o HTML5 nativo) debe reflejar el avance temporal correctamente.
  - **Observaciones:**

---

## E. GPS Check-in (Mecánica Core)

- [ ] 🔴 TC-04-015: Check-in exitoso en ubicación
  - **Precondición:** En un tour activo. Usar devtools del navegador (Sensors tab) para *Spoof* la ubicación a las coordenadas exactas de la parada 1 del tour (ej: Plaza Mayor).
  - **Pasos:** 1. Tocar el botón 📍 (Check-in) en la tarjeta de la parada
  - **Resultado esperado:** Validado! Pasa a verde, se desbloquea contenido premium/audio o se marca la parada como `visited`. (Otorga la insignia de país si test de pasaporte).
  - **Observaciones:**

- [ ] 🟡 TC-04-016: Check-in fallido (Fuera de rango)
  - **Precondición:** Mockear ubicación GPS en un país diferente
  - **Pasos:** 1. Tocar check-in
  - **Resultado esperado:** Mensaje "You are too far (X km). Move closer to 500m."
  - **Observaciones:**

- [ ] 🟡 TC-04-017: Permisos de localización denegados
  - **Precondición:** Navegador: Revocar permiso de ubicación para localhost/dominio
  - **Pasos:** 1. Tocar check-in
  - **Resultado esperado:** Muestra alert de feedback de UX claro indicando "Location permission required. Check browser settings". No debe crash.
  - **Observaciones:**

- [ ] 🟢 TC-04-018: Indicador de Distancia Dinámico
  - **Precondición:** Con GPS real (o mock) acercándose al punto
  - **Pasos:** 1. Mover coordenadas en Sensor Tools
  - **Resultado esperado:** Al moverse, el texto "Distance: X.XX km" debe actualizarse en tiempo cuasi-real debajo del mapa o panel.
  - **Observaciones:**
