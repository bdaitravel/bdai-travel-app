# 🛂 Módulo 05 — Pasaporte & Gamificación

> **Componentes:** `ProfileModal.tsx`, `useAppStore.ts (passport/badges)`, `supabaseClient.ts`  
> **Rutas:** `/profile` (Botón "Passport" en NavBar)

---

## A. Visualización de Perfil (ProfileModal)

- [ ] 🔴 TC-05-001: Abrir Pasaporte
  - **Precondición:** Usuario logueado, en Home
  - **Pasos:** 1. Tocar botón central "Passport" en la barra inferior
  - **Resultado esperado:** Se abre `/profile`. Muestra Nombre, Apellido, Avatar (si hay), rango actual y selector de idiomas.
  - **Observaciones:**

- [ ] 🟡 TC-05-002: Actualizar Datos Personales
  - **Precondición:** En `/profile`
  - **Pasos:** 1. Cambiar los campos Name (ej: "Juan") Surname ("Pérez") → 2. Pulsar "Save" / Guardar
  - **Resultado esperado:** Botón muestra spinner breve, luego "Saved!". Al recargar la página, los datos deben persistir
  - **Observaciones:**

- [ ] 🟡 TC-05-003: Subida de Foto de Perfil (Avatar Storage)
  - **Precondición:** En `/profile`
  - **Pasos:** 1. Tocar el avatar ("Upload Photo") → 2. Seleccionar imagen jpeg de prueba (ej: 200kb)
  - **Resultado esperado:** Loader circular. Avatar actualiza a la nueva foto (subida exitosa al bucket `avatars` en Supabase). Al recargar persiste.
  - **Observaciones:**

---

## B. Visados (Países Visitados)

- [ ] 🔴 TC-05-004: Adquisición Nuevo Visado
  - **Precondición:** Usuario con 0 visados (`user_profiles.countries_visited = []`)
  - **Pasos:** 1. Mock de ubicación en GPS → 2. Realizar Check-in GPS en una ciudad de un país nuevo (ej. Francia)
  - **Resultado esperado:** Al hacer check-in se genera un confetti y aviso de "Nuevo país". En el Perfil, bajo "My Visas", aparece el sello circular 🇫🇷 (Francia).
  - **Observaciones:**

- [ ] 🟡 TC-05-005: Listado de Visados
  - **Precondición:** Modificar manualmente en BD el array `countries_visited` del usuario con `["ES", "FR", "IT"]`
  - **Pasos:** 1. Ir a `/profile` → 2. Sección Mis Visados
  - **Resultado esperado:** Se muestran los tres sellos correctamente renderizados sin desbordar (scroll horizontal si sobrepasan la pantalla).
  - **Observaciones:**

---

## C. Insignias (Badges)

- [ ] 🔴 TC-05-006: Visualización de Badges 
  - **Precondición:** Usuario con array `badges_earned` vacío o con insignias
  - **Pasos:** 1. En `/profile`, sección Insignias/Badges
  - **Resultado esperado:** Muestra las insignias desbloqueadas en colores completos y las bloqueadas en escala de grises con candado.
  - **Observaciones:**

- [ ] 🟡 TC-05-007: Desbloqueo de Badge por Primera Ruta
  - **Precondición:** Modificar DB o código temporal para cumplir condición: "Completar 1 tour"
  - **Pasos:** 1. Finalizar un tour completo (ver TC-04-009)
  - **Resultado esperado:** Aparece alert o notificación de "Badge Desbloqueada". En el perfil ya aparece en color.
  - **Observaciones:**

- [ ] 🟡 TC-05-008: Popover/Modal de información de Insignia
  - **Precondición:** En `/profile`, sección Insignias
  - **Pasos:** 1. Tocar cualquier insignia (ej. Explorador Inicial)
  - **Resultado esperado:** Muestra toast o modal pequeño con su título, descripción y requisitos (ej: "Completa 5 tours culturales").
  - **Observaciones:**

---

## D. Rangos y Progresión (Experience)

- [ ] 🔴 TC-05-009: Ascenso de Rango (Rank up)
  - **Precondición:** Usuario en rango "Tourist" (Nivel 1, exp: 90)
  - **Pasos:** 1. Lograr +20 exp (terminar un tour o inyectar exp en base de datos `update_exp_dai`)
  - **Resultado esperado:** Exp sube a 110. Supera el umbral de 100. Animación Rango Up -> "Traveler" (Nivel 2). La barra circular de progreso se recalcula.
  - **Observaciones:**

- [ ] 🟢 TC-05-010: Renderizado correcto de anillo de experiencia
  - **Precondición:** Usuario con datos (ej. Lvl 2, 80/200 exp para nivel 3)
  - **Pasos:** 1. Entrar a `/profile`
  - **Resultado esperado:** El SVG del anillo de experiencia envuelve el avatar al 40% (80/200) de llenado en color dorado/cyan.
  - **Observaciones:**

---

## E. Acciones de Comunidad / Social

- [ ] 🟡 TC-05-011: Compartir Stats (Share Link)
  - **Precondición:** Navegador mobile o con API Web Share habilitada
  - **Pasos:** 1. En `/profile`, tocar botón "Share Passport" o icono en la esquina
  - **Resultado esperado:** Se invoca menú nativo de compartir (`navigator.share`) enviando el texto "I'm a [Rank] in BDAI! Check out my [X] Visas...".
  - **Observaciones:**
