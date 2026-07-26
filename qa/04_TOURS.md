# 🗺️ Módulo 04 — Tours & Audio

> **Componentes:** `TourCard.tsx`, `TourActiveView.tsx`, `useAudio.ts`, `routingService.ts`, `geminiService.ts`, Edge Functions (`generate-tours-dai`, `generate-audio-dai`)  
> **Rutas:** `/city/:cityId`, vista modal interna de tour

---

## A. Solicitud de Tours para Ciudad No Cacheada

> **IMPORTANTE — flujo cambiado:** la app **ya no genera tours en vivo** al abrir una ciudad sin caché. Desde `hooks/useCity.ts` (`processCitySelection`), si la ciudad no tiene tours en `tours_cache` se hace un `INSERT` en `tour_requests` y se muestra un banner inline en `HomeView.tsx`; el webhook `Trigger Tour Request` dispara la Edge Function `solicitud-tour`, que envía un email a `DAISY_EMAIL` (ver `AGENTS.md`). La generación real ocurre después, de forma asíncrona, vía el pipeline `-02` o el script de pre-seeding `generateEsOnly.ts` — nunca disparada por el cliente.
>
> **Nota sobre `user_email: 'Anónimo'`:** el código tiene un fallback (`user.email || 'Anónimo'`) para cuando no hay email, pero **no es un caso real**: todas las rutas de la app que permiten llegar a este flujo (`/home`) están protegidas y exigen sesión iniciada (OTP o Google), que siempre aporta email. Es defensivo, no un escenario a probar manualmente — no dedicar un TC a forzarlo desde la UI.

- [ ] 🔴 TC-04-001: Solicitar una ciudad sin tours muestra el banner de solicitud
  - **Precondición:** Ciudad de prueba sin filas en `tours_cache` ni `sponsored_tours` (ej. Logroño eliminada previamente de ambas tablas)
  - **Pasos:** 1. En `/home`, buscar "Logroño" → 2. Seleccionar el resultado
  - **Resultado esperado:** NO navega a `/city/logrono_es` ni muestra progreso de generación. Se hace `INSERT` en `tour_requests` (`city`, `country`, `language`, `slug`, `user_email`) y aparece en Home un banner ámbar: "Se ha solicitado la creación de **Logroño**. Este proceso puede tardar entre 1 minuto y 1 día 😉". Si se tiene acceso al buzón de `DAISY_EMAIL`, comprobar además que llega el correo con asunto `BDAI — Nuevo tour solicitado: Logroño, es`
  - **Observaciones:**

- [ ] 🟡 TC-04-001b: Repetir la búsqueda de la misma ciudad solicitada
  - **Precondición:** Continuación de TC-04-001 (ya existe una fila en `tour_requests` para esa ciudad/idioma sin `notified_at`)
  - **Pasos:** 1. Sin recargar, volver a buscar "Logroño" y seleccionarla de nuevo
  - **Resultado esperado:** Se permite un nuevo `INSERT` (no hay restricción de unicidad) y el banner se actualiza mostrando de nuevo el mensaje; no debe haber error ni excepción en consola. Anotar si se considera deseable deduplicar aquí (hoy no se hace a nivel de UI, solo en `notify-tour-ready` a la hora de notificar)
  - **Observaciones:**

- [ ] 🔴 TC-04-002: Re-abrir ciudad con tours ya cacheados (pre-generados)
  - **Precondición:** Ciudad con tours ya presentes en `tours_cache` (generada previamente vía pipeline `-02` / `generateEsOnly.ts`, o cualquier ciudad de producción ya poblada — p. ej. Madrid)
  - **Pasos:** 1. Buscar "Madrid" en `/home` → 2. Seleccionar el resultado
  - **Resultado esperado:** Navega directamente a `/city/madrid_es` cargando los tours desde Supabase (`fetchCityToursMerged`, `hasNormal: true`), sin banner de solicitud ni retraso
  - **Observaciones:**

- [ ] 🟡 TC-04-003: Verificación del pipeline de generación en background (no es un TC de UI)
  - **Precondición:** Acceso a `scripts/generateEsOnly.ts` y a las variables de entorno del pipeline `-02`
  - **Pasos:** 1. Ejecutar `npx tsx scripts/generateEsOnly.ts` con una ciudad de prueba en la lista `cities` → 2. Revisar logs y el estado final en `generation_jobs`/`tours_cache`
  - **Resultado esperado:** El job pasa por `PENDING_AI_02` → `PENDING_GIS_02` → `READY` (o `ERROR`/timeout tras 20 min de polling). Si Google Search grounding está degradado (cuota agotada), el worker AI sigue generando contenido sin grounding en vez de fallar
  - **Observaciones:** Este caso ya no se puede disparar ni observar desde la app — requiere ejecutar el script directamente. Considerar moverlo a un futuro módulo de QA de infraestructura/pipeline si se ejecuta con regularidad

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

- [ ] 🔴 TC-04-007b: La línea de ruta se recalcula al cambiar de parada sin moverse
  - **Precondición:** Tour activo, GPS activo, usuario físicamente quieto (sin desplazarse)
  - **Pasos:** 1. Anotar la ruta morada (marching ants) trazada hacia la parada actual → 2. Pulsar "Siguiente" sin moverse del sitio → 3. Esperar y observar el mapa (no hace falta esperar 15s)
  - **Resultado esperado:** La línea de ruta se recalcula prácticamente al instante hacia la NUEVA parada (el marcador de destino ya lo hacía; la línea antes se quedaba apuntando a la parada anterior hasta que pasaban 15s o el usuario se movía >25m — bug corregido en `SchematicMap.tsx`)
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

- [ ] 🟡 TC-04-014b: Controles en pantalla de bloqueo / notificación (Media Session)
  - **Precondición:** Audio de una parada en reproducción (APK Android o navegador compatible)
  - **Pasos:** 1. Bloquear la pantalla o minimizar la app → 2. Observar la notificación multimedia / pantalla de bloqueo
  - **Resultado esperado:** Aparecen controles nativos con el nombre de la parada como título, la ciudad como subtítulo y el logo de bdai como imagen; el botón de pausa/play funciona desde ahí
  - **Observaciones:**

- [ ] 🟢 TC-04-014c: Pausar y reanudar desde los controles nativos mantiene la posición
  - **Precondición:** Audio en reproducción, controles nativos visibles
  - **Pasos:** 1. Pulsar pausa desde la notificación/pantalla de bloqueo → 2. Esperar unos segundos → 3. Pulsar play desde el mismo control
  - **Resultado esperado:** El audio se reanuda desde el punto donde se pausó, no desde el principio
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

---

## F. GPS por Niveles de Precisión (Ahorro de Batería)

> Componente: `hooks/useGeolocation.ts`. Lejos de la parada activa (>200m) usa precisión de red (`enableHighAccuracy: false`, bajo consumo); a <150m escalona a GPS de precisión real para validar el check-in de ≤50m. Se pausa por completo al pasar la app a segundo plano.

- [ ] 🔴 TC-04-019: El check-in sigue funcionando igual que antes (±50m)
  - **Precondición:** Tour activo, spoofear ubicación a las coordenadas exactas de una parada
  - **Pasos:** 1. Tocar check-in
  - **Resultado esperado:** Se valida igual que siempre — el cambio de niveles de precisión no debe alterar el umbral de validación, solo cuándo se pide precisión alta
  - **Observaciones:**

- [ ] 🟡 TC-04-020: Transición a precisión alta al acercarse a una parada
  - **Precondición:** Tour activo, spoofear ubicación a >500m de la parada actual
  - **Pasos:** 1. Mover progresivamente las coordenadas (Sensors tab) hasta cruzar los ~150m de la parada activa
  - **Resultado esperado:** El indicador de distancia se sigue actualizando en todo momento (aunque más lento/menos preciso mientras está lejos); al cruzar el umbral, el check-in se vuelve validable con normalidad
  - **Observaciones:**

- [ ] 🟢 TC-04-021: Vuelta a bajo consumo al alejarse tras el check-in
  - **Precondición:** Check-in ya hecho en la parada actual, siguiente parada a más de 200m
  - **Pasos:** 1. Avanzar a la siguiente parada → 2. Alejar las coordenadas mockeadas más de 200m
  - **Resultado esperado:** No debe haber ningún error ni bloqueo; el comportamiento de la app es transparente para el usuario (esto se verifica principalmente revisando que no haya excepciones en consola, ya que el ahorro de batería no es visible en la UI)
  - **Observaciones:**

- [ ] 🔴 TC-04-022: GPS se detiene al minimizar la app durante un tour (APK)
  - **Precondición:** APK instalada, tour activo con GPS en marcha
  - **Pasos:** 1. Minimizar la app (botón Home) → 2. Comprobar en los ajustes de batería/ubicación de Android que la app deja de reportar uso de GPS activo → 3. Reabrir la app
  - **Resultado esperado:** El GPS se detiene mientras está en segundo plano y se reanuda automáticamente (en modo bajo consumo) al volver a primer plano, sin necesidad de recargar el tour
  - **Observaciones:**
