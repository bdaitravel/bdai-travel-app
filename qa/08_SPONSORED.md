# 💛 Módulo 08 — Tours Patrocinados

> **Componentes:** `TourCard.tsx` (card + `ActiveTourCard`), `CityDetailView.tsx`, `TourActiveView.tsx`, `toursService.ts` (`fetchCityToursMerged`, `getSponsoredTours`, `logSponsoredEvent`)
> **Tablas:** `sponsored_tours` (contenido), `sponsored_events` (analítica)
> **Rutas:** `/city/:slug`, `/tour/:tourId/stop/:idx`
> **Dato de prueba:** Agoncillo (`agoncillo_spain`, es) — tour `agoncillo_spain_es_sp0`, parada "Bar Ejemplo 1" en Plaza del Castillo 17 (42.446557, -2.291210)

---

## A. Visibilidad y separación (CityDetailView)

- [ ] 🔴 TC-08-001: Sección patrocinada solo en municipios con tour patrocinado
  - **Precondición:** Agoncillo con fila en `sponsored_tours`; otra ciudad (ej. Logroño) sin ella
  - **Pasos:** 1. Abrir `/city/agoncillo_spain` → 2. Abrir `/city/logrono_spain`
  - **Resultado esperado:** En Agoncillo aparece la línea amarilla (#f6c604) con etiqueta "PATROCINADO" y la card debajo. En Logroño NO se renderiza ni línea ni sección
  - **Observaciones:**

- [ ] 🔴 TC-08-002: Badge "Patrocinado" visible en la card (requisito legal)
  - **Precondición:** En `/city/agoncillo_spain`
  - **Pasos:** 1. Observar la card bajo la línea amarilla
  - **Resultado esperado:** Chip amarillo "PATROCINADO" siempre visible (no solo el color: texto explícito). Título en blanco; en hover, título y acentos pasan a amarillo #f6c604 (no morado)
  - **Observaciones:**

- [ ] 🔴 TC-08-003: Card sin duración ni distancia
  - **Precondición:** Card patrocinada visible
  - **Pasos:** 1. Observar la fila inferior de la card
  - **Resultado esperado:** No aparecen "Duración" ni "Distancia"; aparece "Paradas: 1". El botón "Lanzar" funciona
  - **Observaciones:**

- [ ] 🟡 TC-08-004: Tour normal NO afectado (regresión)
  - **Precondición:** Ciudad con tours normales (Agoncillo tiene ambos)
  - **Pasos:** 1. Observar la card del tour normal → 2. Abrirlo → 3. Probar audio, velocidad, "Consejo Dai", check-in
  - **Resultado esperado:** Todo idéntico a antes: acentos morados, duración/distancia, "Parada N", audio y velocidad visibles, modal Consejo Dai con cámara. Cero cambios
  - **Observaciones:**

- [ ] 🟡 TC-08-005: Vigencia e interruptor `active`
  - **Precondición:** Acceso al SQL Editor
  - **Pasos:** 1. `UPDATE sponsored_tours SET active = false WHERE city_slug = 'agoncillo_spain';` → 2. Recargar `/city/agoncillo_spain` → 3. Restaurar `active = true`
  - **Resultado esperado:** Con `active = false` la sección patrocinada desaparece (la RLS ya no expone la fila). Al restaurar, vuelve. Repetir con `ends_at = now() - interval '1 day'` → mismo efecto (restaurar a NULL después)
  - **Observaciones:**

---

## B. Vista activa del tour patrocinado

- [ ] 🔴 TC-08-006: Sin ruta, sin audio, solo nombre del local
  - **Precondición:** Lanzar el tour patrocinado de Agoncillo
  - **Pasos:** 1. Observar cabecera → 2. Observar mapa → 3. Buscar botón de audio/velocidad
  - **Resultado esperado:** Cabecera muestra solo "BAR EJEMPLO 1" (sin "Parada 1"). Mapa con pin del local, sin polyline de ruta entre paradas. NO existen botón play de audio ni selector de velocidad
  - **Observaciones:**

- [ ] 🔴 TC-08-007: Descripción de la parada visible
  - **Precondición:** Tour patrocinado abierto en la parada
  - **Pasos:** 1. Hacer scroll bajo el mapa
  - **Resultado esperado:** Se lee "El pintxo estrella del Bar Ejemplo 1 es ..." (texto de `stops[0].description`)
  - **Observaciones:**

- [ ] 🟡 TC-08-008: Rehidratación tras recarga (sufijo sp)
  - **Precondición:** Dentro del tour patrocinado (`/tour/agoncillo_spain_es_sp0/stop/0`)
  - **Pasos:** 1. Recargar la página (F5) → 2. En Android: cambiar de app y volver tras minutos
  - **Resultado esperado:** El tour patrocinado se recupera correctamente (búsqueda por id exacto en el array fusionado). NO carga por error el tour normal índice 0 ni redirige a home
  - **Observaciones:**

---

## C. Check-in GPS y Beneficio (mecánica core)

- [ ] 🔴 TC-08-009: Beneficio bloqueado SIN check-in previo
  - **Precondición:** Tour patrocinado abierto, GPS lejos del local (o spoofeado a otra ciudad con DevTools → Sensors)
  - **Pasos:** 1. Observar el botón "Beneficio" → 2. Pulsarlo
  - **Resultado esperado:** Botón oscuro con icono de candado 🔒. Al pulsar NO se abre el modal; aparece toast "Haz check-in GPS en el local para desbloquear el beneficio"
  - **Observaciones:**

- [ ] 🔴 TC-08-010: Check-in fuera de rango rechazado
  - **Precondición:** GPS spoofeado a >50m del local (ej. 42.4500, -2.2950)
  - **Pasos:** 1. Pulsar "Check-in GPS"
  - **Resultado esperado:** Toast "GPS Incierto: Xm". La parada NO se marca verificada, el Beneficio sigue con candado. Misma mecánica que el tour normal
  - **Observaciones:**

- [ ] 🔴 TC-08-011: Check-in en rango desbloquea el Beneficio
  - **Precondición:** GPS spoofeado a las coordenadas del local (42.446557, -2.291210)
  - **Pasos:** 1. Pulsar "Check-in GPS" → 2. Observar botón "Beneficio" → 3. Pulsarlo
  - **Resultado esperado:** Check-in pasa a "Verificada" (verde) y suma millas. El botón "Beneficio" cambia a amarillo con icono de diamante 💎. Al pulsar se abre el modal con diamante amarillo, título "BENEFICIO" y el texto "El beneficio es ..." (de `business.benefit`)
  - **Observaciones:**

- [ ] 🟡 TC-08-012: El desbloqueo es por parada, no global
  - **Precondición:** Tour patrocinado con ≥2 paradas (añadir temporalmente una segunda en el SQL, o marcar como N/A si solo hay una)
  - **Pasos:** 1. Check-in en parada A → 2. Navegar a parada B → 3. Pulsar "Beneficio" en B
  - **Resultado esperado:** El beneficio de B sigue bloqueado: cada parada exige su propio check-in (`claimedStops` por id de parada)
  - **Observaciones:**

---

## D. Analítica (`sponsored_events`)

- [ ] 🔴 TC-08-013: Evento `check_in` registrado
  - **Precondición:** TC-08-011 ejecutado; acceso al SQL Editor
  - **Pasos:** 1. `SELECT * FROM sponsored_events WHERE event_type = 'check_in' ORDER BY created_at DESC LIMIT 5;`
  - **Resultado esperado:** Fila nueva con `city_slug = 'agoncillo_spain'`, `tour_id = 'agoncillo_spain_es_sp0'`, `stop_id = '...sp0_stop0'`, `user_email` del usuario logueado (o 'anonymous')
  - **Observaciones:**

- [ ] 🔴 TC-08-014: Evento `benefit_open` registrado
  - **Precondición:** Modal del beneficio abierto en TC-08-011
  - **Pasos:** 1. `SELECT * FROM sponsored_events WHERE event_type = 'benefit_open' ORDER BY created_at DESC LIMIT 5;`
  - **Resultado esperado:** Fila nueva por cada apertura del modal. La query de "personas únicas" del script `create_sponsored_events.sql` devuelve 1 persona aunque haya varias aperturas
  - **Observaciones:**

- [ ] 🟡 TC-08-015: Check-in de tour NORMAL no genera eventos
  - **Precondición:** Tour normal activo con GPS en rango
  - **Pasos:** 1. Hacer check-in en una parada normal → 2. Consultar `sponsored_events`
  - **Resultado esperado:** Ninguna fila nueva: la analítica solo se dispara con `isSponsored`
  - **Observaciones:**

- [ ] 🟡 TC-08-016: El fallo de analítica no rompe la UX
  - **Precondición:** DevTools → Network → bloquear requests a `sponsored_events` (o modo offline tras cargar el tour)
  - **Pasos:** 1. Hacer check-in → 2. Abrir beneficio
  - **Resultado esperado:** Check-in y modal funcionan con normalidad (el log es fire-and-forget); solo un warn en consola
  - **Observaciones:**

---

## E. Seguridad (RLS)

- [ ] 🔴 TC-08-017: Cliente no puede escribir en `sponsored_tours`
  - **Precondición:** Consola del navegador en la app (sesión anon/authenticated)
  - **Pasos:** 1. Ejecutar por consola un `supabase.from('sponsored_tours').insert({...})` y un `.update({active:false})`
  - **Resultado esperado:** Ambos rechazados por RLS (error 42501 / new row violates row-level security)
  - **Observaciones:**

- [ ] 🔴 TC-08-018: Cliente no puede leer `sponsored_events`
  - **Precondición:** Consola del navegador en la app
  - **Pasos:** 1. `supabase.from('sponsored_events').select('*')`
  - **Resultado esperado:** 0 filas (sin política SELECT). Los emails de otros usuarios no son extraíbles desde el cliente
  - **Observaciones:**
