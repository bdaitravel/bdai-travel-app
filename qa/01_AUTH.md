# 🔐 Módulo 01 — Autenticación & Sesión

> **Componentes:** `LoginView.tsx`, `useAuth.ts`, `supabaseClient.ts`, `useAppStore.ts`  
> **Rutas:** `/login`, `/` (redirect)

---

## A. Login con OTP (Email + Código)

- [ ] 🔴 TC-01-001: Login exitoso con email válido + código OTP
  - **Precondición:** Usuario no logueado
  - **Pasos:** 1. Navegar a `/login` → 2. Escribir email válido → 3. Pulsar "SOLICITAR CÓDIGO" → 4. Introducir código OTP de 8 dígitos recibido por email → 5. Pulsar "VERIFICAR"
  - **Resultado esperado:** Redirige a `/home`, se muestra el barra de navegación inferior, el perfil del usuario se carga desde Supabase
  - **Observaciones:**

- [ ] 🟡 TC-01-002: Error al enviar OTP con email vacío
  - **Precondición:** Pantalla de login en fase EMAIL
  - **Pasos:** 1. Dejar el campo email vacío → 2. Pulsar "SOLICITAR CÓDIGO"
  - **Resultado esperado:** Se muestra un toast de error, no se hace la petición a Supabase
  - **Observaciones:**

- [ ] 🟡 TC-01-003: Error al enviar OTP con email mal formado
  - **Precondición:** Pantalla de login en fase EMAIL
  - **Pasos:** 1. Escribir "noesEmail" → 2. Pulsar "SOLICITAR CÓDIGO"
  - **Resultado esperado:** Se muestra feedback visual de error (toast), no se cambia de fase
  - **Observaciones:**

- [ ] 🟡 TC-01-004: Código OTP incorrecto
  - **Precondición:** Fase OTP activa (se ha solicitado código)
  - **Pasos:** 1. Escribir código de 8 dígitos incorrecto → 2. Pulsar "VERIFICAR"
  - **Resultado esperado:** Se muestra toast con error, permanece en la pantalla de OTP
  - **Observaciones:**

- [ ] 🟢 TC-01-005: Botón "ATRÁS" en fase OTP vuelve a fase EMAIL
  - **Precondición:** Fase OTP activa
  - **Pasos:** 1. Pulsar "ATRÁS"
  - **Resultado esperado:** Se vuelve a la fase EMAIL, el campo de email conserva el valor anterior
  - **Observaciones:**

- [ ] 🟢 TC-01-006: Botón VERIFICAR deshabilitado con menos de 8 dígitos
  - **Precondición:** Fase OTP activa
  - **Pasos:** 1. Escribir 5 dígitos → 2. Observar botón "VERIFICAR"
  - **Resultado esperado:** Botón con `opacity-30`, no es clicable (`disabled`)
  - **Observaciones:**

---

## B. Login con Google OAuth

- [ ] 🔴 TC-01-007: Login con Google exitoso
  - **Precondición:** Usuario no logueado, cuenta Google válida
  - **Pasos:** 1. En pantalla de login → 2. Pulsar botón "google" → 3. Completar flujo OAuth de Google
  - **Resultado esperado:** Se redirige a `/home`, perfil cargado, sesión activa
  - **Observaciones:**

- [ ] 🟡 TC-01-008: Cancelar flujo de Google
  - **Precondición:** Pantalla de login
  - **Pasos:** 1. Pulsar "google" → 2. Cerrar la ventana emergente de Google sin completar
  - **Resultado esperado:** Se permanece en `/login`, no hay crash ni pantalla en blanco
  - **Observaciones:**

---

## C. Gestión de Sesión

- [ ] 🔴 TC-01-009: Sesión persiste tras recargar
  - **Precondición:** Usuario logueado en `/home`
  - **Pasos:** 1. Recargar la página (F5) → 2. Observar pantalla
  - **Resultado esperado:** Se muestra el logo con animación pulse durante la verificación y luego se redirige a `/home` automáticamente sin pasar por login
  - **Observaciones:**

- [ ] 🔴 TC-01-010: Acceso a ruta protegida sin sesión redirige a login
  - **Precondición:** No hay sesión activa (borrar storage)
  - **Pasos:** 1. Navegar directamente a `/#/home` → 2. Observar
  - **Resultado esperado:** Se redirige automáticamente a `/login`
  - **Observaciones:**

- [ ] 🟢 TC-01-011: Verificar pantalla de splash mientras se comprueba sesión
  - **Precondición:** Sesión activa, recargar página
  - **Pasos:** 1. Recargar → 2. Observar la pantalla intermedia
  - **Resultado esperado:** Se muestra el `BdaiLogo` con `animate-pulse` sobre fondo `#020617`
  - **Observaciones:**

- [ ] 🔴 TC-01-021: Sesión sobrevive a que Android mate el proceso en segundo plano (APK)
  - **Precondición:** APK instalada, usuario logueado y en mitad de un tour (`/tour/:tourId/stop/:stopIdx`)
  - **Pasos:** 1. Minimizar la app → 2. Forzar el reciclado del proceso (activar "No conservar actividades" en Opciones de desarrollador de Android, o simplemente esperar con otras apps pesadas abiertas) → 3. Volver a abrir la app desde el selector de recientes
  - **Resultado esperado:** La app recupera la sesión sin pedir login de nuevo y sin pasar por la ventana de bienvenida; si estaba en un tour, `TourActiveView` se autorehidrata en la misma parada (ver `qa/09_PROFILE_SYNC.md`). No debe verse una pantalla de login ni de bienvenida de por medio
  - **Observaciones:**

- [ ] 🟡 TC-01-022: Reabrir la app tras varias horas en segundo plano no fuerza login
  - **Precondición:** Usuario logueado, app en segundo plano varias horas (tiempo suficiente para que el access token expire)
  - **Pasos:** 1. Reabrir la app
  - **Resultado esperado:** El SDK refresca el token automáticamente en segundo plano; el usuario sigue dentro de la app sin ver `/login` ni la ventana de bienvenida
  - **Observaciones:**

---

## D. Logout

- [ ] 🔴 TC-01-012: Logout desde el perfil
  - **Precondición:** Usuario logueado, en `/profile`
  - **Pasos:** 1. Pulsar botón "CERRAR SESIÓN" (rojo) → 2. Observar
  - **Resultado esperado:** Se limpia la sesión de Supabase, se redirige a `/login`, el botón de navegación ya no aparece
  - **Observaciones:**

---

## E. GDPR — Eliminación de Cuenta

- [ ] 🟡 TC-01-013: Flujo completo de eliminación de cuenta
  - **Precondición:** Usuario logueado, en `/profile`
  - **Pasos:** 1. Scroll hasta el fondo → 2. Pulsar "Eliminar Cuenta (GDPR)" → 3. Observar modal de confirmación con calavera → 4. Esperar countdown de 5s → 5. Escribir email que NO coincide → 6. Verificar que botón dice "El email no coincide" → 7. Reescribir email correcto → 8. Pulsar "Eliminar permanentemente"
  - **Resultado esperado:** Se elimina perfil de Supabase, se cierra sesión, se redirige a `/login`
  - **Observaciones:**

- [ ] 🟢 TC-01-014: Cancelar eliminación de cuenta
  - **Precondición:** Modal de eliminación abierto
  - **Pasos:** 1. Pulsar "Cancelar"
  - **Resultado esperado:** Se cierra el modal, se permanece en el perfil sin cambios
  - **Observaciones:**

---

## F. Ventana de Bienvenida (Onboarding)

> Componente: `components/Onboarding.tsx` · Se activa desde `hooks/useAuth.ts` (`handleLoginSuccess`, solo en la rama de creación de perfil nuevo) o manualmente desde el botón "?" en `HomeView.tsx`.

- [ ] 🔴 TC-01-015: La bienvenida solo aparece la primera vez (alta de usuario)
  - **Precondición:** Email sin perfil previo en `profiles`
  - **Pasos:** 1. Completar login (OTP o Google) por primera vez con ese email
  - **Resultado esperado:** Se muestra la ventana de bienvenida completa (7 pasos)
  - **Observaciones:**

- [ ] 🔴 TC-01-016: La bienvenida NO reaparece en logins posteriores
  - **Precondición:** Usuario ya existente (con perfil en `profiles`), que ya vio la bienvenida antes
  - **Pasos:** 1. Cerrar sesión → 2. Volver a iniciar sesión con el mismo email → 3. Repetir 3-4 veces
  - **Resultado esperado:** Nunca vuelve a aparecer automáticamente, en ninguno de los intentos
  - **Observaciones:**

- [ ] 🔴 TC-01-017: La bienvenida NO reaparece tras un refresco de token
  - **Precondición:** Usuario logueado con la app abierta durante >1h (o forzar `await supabase.auth.refreshSession()` desde la consola)
  - **Pasos:** 1. Dejar la sesión activa el tiempo suficiente para un `TOKEN_REFRESHED` (o forzarlo manualmente) → 2. Observar la app
  - **Resultado esperado:** No aparece la bienvenida ni se recarga el perfil (ver también `qa/09_PROFILE_SYNC.md` TC-09-005)
  - **Observaciones:**

- [ ] 🟡 TC-01-018: Botón "?" reabre la bienvenida bajo demanda
  - **Precondición:** Usuario logueado en `/home`
  - **Pasos:** 1. Pulsar el icono "?" de la cabecera
  - **Resultado esperado:** Se abre la ventana de bienvenida completa desde el paso 1
  - **Observaciones:**

- [ ] 🟡 TC-01-019: Botón "X" cierra la bienvenida sin completar los pasos
  - **Precondición:** Ventana de bienvenida abierta (desde alta nueva o desde el botón "?"), en cualquier paso intermedio (ej. paso 3 de 7)
  - **Pasos:** 1. Pulsar la "X" en la esquina superior derecha de la tarjeta
  - **Resultado esperado:** La ventana se cierra inmediatamente sin necesidad de pulsar "Siguiente" hasta el final; el usuario vuelve a `/home` con normalidad
  - **Observaciones:**

- [ ] 🟢 TC-01-020: Navegación manual entre pasos con los puntos indicadores
  - **Precondición:** Ventana de bienvenida abierta
  - **Pasos:** 1. Pulsar directamente uno de los puntos de progreso (no el primero ni el actual)
  - **Resultado esperado:** Salta directamente a ese paso sin recorrer los intermedios
  - **Observaciones:**
