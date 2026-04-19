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
