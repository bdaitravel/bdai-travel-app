# 💾 Módulo 09 — Sincronización de Perfil (Android nativo)

> **Componentes:** `hooks/useAuth.ts`, `services/supabase/profileSyncQueue.ts`, `services/supabase/profileService.ts`, `services/storageProvider.ts`, `components/ProfileModal.tsx`, `components/TourCard.tsx`, RPC `upsert_profile_rpc`
> **Rutas:** `/profile`, `/tour/:tourId/stop/:stopIdx`
> **Origen:** módulo añadido tras el fix de pérdida de datos de perfil reportada en Android nativo (edición de perfil desaparecía a las pocas horas). Ejecutar completo después de cualquier cambio futuro en auth, storage o el flujo de guardado de perfil.

---

## A. Push inmediato en cada modificación

- [ ] 🔴 TC-09-001: Editar perfil con red activa se guarda al instante
  - **Precondición:** Usuario logueado, red activa, en `/profile` modo edición
  - **Pasos:** 1. Cambiar nombre/ciudad/bio → 2. Pulsar guardar → 3. Consultar la tabla `profiles` en Supabase (SQL Editor) por email
  - **Resultado esperado:** El modal sale de modo edición al instante (no espera a la red); en pocos segundos la fila en Supabase refleja los cambios
  - **Observaciones:**

- [ ] 🔴 TC-09-001b: La RPC realmente escribe (no solo se aplica sin error)
  - **Precondición:** Ninguna — comprobación directa contra Supabase
  - **Pasos:** 1. En SQL Editor, ejecutar `get_advisors`/una llamada de prueba a `upsert_profile_rpc` con `interests`, `visited_cities` y `completed_tours` no vacíos dentro de una transacción con `ROLLBACK` (ver `AGENTS.md`) → 2. Revisar los logs de la API (`get_logs` servicio `api`/`postgres`) filtrando por `upsert_profile_rpc` buscando códigos `400`/`ERROR`
  - **Resultado esperado:** La llamada de prueba devuelve los tres campos como array correctamente poblados, sin error de tipo (`column "..." is of type text[] but expression is of type jsonb` — bug real detectado ago-2026 que hacía fallar el 100% de los guardados silenciosamente). Repetir esta prueba tras CUALQUIER cambio a `upsert_profile_rpc`
  - **Observaciones:**

- [ ] 🟡 TC-09-002: Cambiar avatar fuera de modo edición sincroniza igual
  - **Precondición:** Usuario logueado, en `/profile` sin pulsar "editar"
  - **Pasos:** 1. Pulsar la foto de perfil y elegir una imagen nueva
  - **Resultado esperado:** El avatar se actualiza en pantalla y en Supabase (`avatar` en `profiles`) sin necesidad de pulsar guardar
  - **Observaciones:**

- [ ] 🟡 TC-09-003: Cambio de idioma se sincroniza
  - **Precondición:** Usuario logueado
  - **Pasos:** 1. Cambiar el idioma de la app desde el selector
  - **Resultado esperado:** `language` se actualiza en Supabase para ese usuario
  - **Observaciones:**

- [ ] 🟡 TC-09-004: Completar un tour sincroniza millas, sellos e insignias
  - **Precondición:** Tour activo a punto de finalizar (última parada con check-in hecho)
  - **Pasos:** 1. Finalizar el tour → 2. Consultar `profiles` en Supabase
  - **Resultado esperado:** `miles`, `stamps`, `completed_tours` y `badges` reflejan el resultado sin recargar la app
  - **Observaciones:**

---

## B. Pull solo en login real (no en `TOKEN_REFRESHED`)

- [ ] 🔴 TC-09-005: Un refresco de token NO sobrescribe el perfil local
  - **Precondición:** Usuario logueado, con una edición reciente ya sincronizada
  - **Pasos:** 1. Editar el perfil (ej. cambiar bio) sin recargar la app → 2. Abrir la consola del navegador (o `chrome://inspect` en el WebView de Android) y forzar `await supabase.auth.refreshSession()` → 3. Observar el perfil en pantalla
  - **Resultado esperado:** El perfil en pantalla sigue mostrando el cambio hecho en el paso 1 (no se recarga desde Supabase ni se pisa nada). Antes del fix, esto disparaba `handleLoginSuccess` y podía revertir cambios no sincronizados
  - **Observaciones:**

- [ ] 🔴 TC-09-006: Cerrar y reabrir la app SÍ recarga el perfil (login real)
  - **Precondición:** Usuario logueado
  - **Pasos:** 1. Editar el perfil desde otra fuente (ej. directamente en Supabase Dashboard, cambiando la ciudad) → 2. Cerrar la app por completo (kill) → 3. Reabrirla
  - **Resultado esperado:** Al reabrir se ve el valor actualizado desde Supabase (confirma que el pull en login/restauración de sesión sigue funcionando)
  - **Observaciones:**

- [ ] 🟡 TC-09-007: Rango/insignia ganados en el login se persisten
  - **Precondición:** Usuario cuyas millas ya superan el umbral de un nuevo rango, pero que no ha vuelto a abrir la app desde entonces (para que el rango en Supabase esté desactualizado)
  - **Pasos:** 1. Cerrar sesión → 2. Volver a iniciar sesión
  - **Resultado esperado:** El nuevo rango/insignia se calcula, se ve en la UI, y además queda guardado en Supabase (columna `rank`/`badges`) — antes del fix se quedaba solo en memoria local
  - **Observaciones:**

---

## C. Cola offline y reintentos

- [ ] 🔴 TC-09-008: Guardar sin red encola el cambio y avisa
  - **Precondición:** Usuario logueado, en `/profile` modo edición
  - **Pasos:** 1. Activar modo avión → 2. Cambiar un campo y guardar → 3. Observar la app unos segundos
  - **Resultado esperado:** El modal sale de modo edición igualmente (guardado local optimista); tras agotar los reintentos aparece un toast: *"Cambios guardados en el dispositivo. Se sincronizarán cuando haya conexión."*
  - **Observaciones:**

- [ ] 🔴 TC-09-009: Recuperar conexión sincroniza automáticamente
  - **Precondición:** Continuación de TC-09-008 (cambio pendiente en cola)
  - **Pasos:** 1. Desactivar modo avión → 2. Esperar unos segundos
  - **Resultado esperado:** Aparece el toast *"Perfil sincronizado ✓"*; el cambio aparece en Supabase
  - **Observaciones:**

- [ ] 🔴 TC-09-010: Cambio pendiente sobrevive a cerrar la app (Android nativo)
  - **Precondición:** APK instalada en dispositivo/emulador Android
  - **Pasos:** 1. Poner el móvil en modo avión → 2. Editar y guardar el perfil → 3. Matar la app completamente (no solo minimizar) desde el gestor de apps recientes → 4. Reabrir la app todavía en modo avión → 5. Desactivar el modo avión
  - **Resultado esperado:** El cambio no se pierde: al reabrir con conexión, se sincroniza automáticamente y se refleja en Supabase. Esto confirma que la cola persiste en `@capacitor/preferences` y no en el `localStorage` volátil del WebView
  - **Observaciones:**

- [ ] 🟡 TC-09-011: Volver a primer plano intenta sincronizar
  - **Precondición:** Cambio pendiente en cola (por fallo de red momentáneo)
  - **Pasos:** 1. Minimizar la app → 2. Reactivar red → 3. Volver a abrir la app (primer plano)
  - **Resultado esperado:** Se dispara un intento de sincronización al reanudar, sin esperar a la siguiente edición
  - **Observaciones:**

---

## D. Login por OTP tras la simplificación de `handleVerifyOtp`

- [ ] 🔴 TC-09-012: Login OTP completo sigue funcionando
  - **Precondición:** Usuario existente no logueado
  - **Pasos:** 1. Solicitar código OTP → 2. Introducirlo → 3. Observar
  - **Resultado esperado:** Navega a `/home`, el perfil carga correctamente con sus datos (millas, insignias, etc.) — la navegación y carga de perfil ahora dependen de que `onAuthStateChange('SIGNED_IN')` dispare `handleLoginSuccess`, ya no hay lógica duplicada en `handleVerifyOtp`
  - **Observaciones:**

- [ ] 🟡 TC-09-013: Alta de usuario nuevo por OTP crea el perfil correctamente
  - **Precondición:** Email sin perfil previo en `profiles`
  - **Pasos:** 1. Completar login OTP con ese email por primera vez
  - **Resultado esperado:** Se crea la fila en `profiles`, se muestra el onboarding, navega a `/home`
  - **Observaciones:**

---

## E. Seguridad de la RPC `upsert_profile_rpc`

- [ ] 🔴 TC-09-014: No se puede sobrescribir el perfil de otro usuario
  - **Precondición:** Dos cuentas de prueba A y B, con sesión de A disponible (token/anon key del cliente)
  - **Pasos:** 1. Autenticado como A, invocar `supabase.rpc('upsert_profile_rpc', { p_payload: { id: <uuid de B>, email: <email de B>, ...resto de campos } })` desde la consola del navegador
  - **Resultado esperado:** La llamada lanza un error (`No autorizado...`, código `42501`) y la fila de B **no** se modifica. Antes del fix esto sobrescribía silenciosamente el perfil de B
  - **Observaciones:**

- [ ] 🔴 TC-09-015: `anon` (sin sesión) no puede invocar la RPC
  - **Precondición:** Cliente Supabase sin sesión iniciada (anon key pura)
  - **Pasos:** 1. Invocar `supabase.rpc('upsert_profile_rpc', { p_payload: {...} })` sin haber hecho login
  - **Resultado esperado:** Error de autorización o "permission denied for function" (se revocó `EXECUTE` a `anon`)
  - **Observaciones:**

---

## F. Build y advisors

- [ ] 🔴 TC-09-016: Build limpio tras cualquier cambio en este módulo
  - **Pasos:** `npm run build`
  - **Resultado esperado:** Exit code 0, sin errores de TypeScript
  - **Observaciones:**

- [ ] 🟡 TC-09-017: Sin nuevos avisos de seguridad en la RPC
  - **Pasos:** Ejecutar `get_advisors` (tipo `security`) sobre el proyecto de Supabase
  - **Resultado esperado:** `upsert_profile_rpc` ya no aparece en `anon_security_definer_function_executable`; solo queda el aviso informativo genérico de `authenticated_security_definer_function_executable` (esperado, cubierto por el chequeo interno de `auth.uid()`)
  - **Observaciones:**
