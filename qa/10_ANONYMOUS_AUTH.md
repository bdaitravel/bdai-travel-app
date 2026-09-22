# 👤 Módulo 10 — Login Anónimo, Completar Perfil, Username y Ranking

> **Componentes:** `hooks/useAuth.ts`, `services/supabase/profileService.ts`, `services/supabase/profileSyncQueue.ts`, `services/supabase/rankingService.ts`, `App.tsx`, `views/LoginView.tsx`, `components/ProfileModal.tsx`, `components/ProfileCompletionPrompt.tsx`, `components/LeaderboardLockedView.tsx`, RPCs `upsert_profile_rpc`, `get_next_guest_username`, `set_username_rpc`
> **Rutas:** `/`, `/login`, `/home`, `/leaderboard`, `/profile`, `/admin`
> **Origen:** rechazo de Apple (Guideline 5.1.1(v) — no se puede exigir registro para acceder a contenido no-account-based; Guideline 4/2.1(a) — botón Sign in with Apple; Guideline 2.2 — panel admin expuesto). Ejecutar completo tras cualquier cambio futuro en `useAuth.ts`, el esquema de `profiles` o el flujo de login/vinculación.

---

## A. Acceso de invitado explícito (Guideline 5.1.1(v))

> ⚠️ Cambio de diseño (sep-2026): el alta anónima **ya no es automática ni silenciosa**. En el
> primer arranque sin sesión, `useAuth.ts` navega a `/login`, que muestra "Explorar sin
> registrarte" con el mismo peso visual que Google/Apple — solo al pulsarlo se llama a
> `signInAnonymously()` (`handleContinueAsGuest`). Motivo: el comportamiento automático
> dependía en silencio de que el interruptor "Anonymous Sign-Ins" de Supabase estuviera bien
> guardado (y ya se dio el caso de que no lo estaba) — con el botón explícito, el acceso de
> invitado es una acción visible y comprobable por un revisor, no algo oculto que puede fallar
> sin que se note.

- [ ] 🔴 TC-10-001: Instalación limpia muestra la pantalla de bienvenida con las 3 opciones
  - **Precondición:** Sin sesión previa (borrar storage/datos de la app)
  - **Pasos:** 1. Abrir la app por primera vez
  - **Resultado esperado:** Pantalla de splash breve → `/login` con "Explorar sin registrarte" (igual de visible que el login), y debajo Google/Apple según plataforma
  - **Observaciones:**

- [ ] 🔴 TC-10-001b: "Explorar sin registrarte" entra a `/home` sin pedir ningún dato
  - **Precondición:** Continuación de TC-10-001
  - **Pasos:** 1. Pulsar "Explorar sin registrarte"
  - **Resultado esperado:** Entra directo a `/home`, sin ninguna pantalla intermedia pidiendo email/nombre/etc.
  - **Observaciones:**

- [ ] 🔴 TC-10-002: Se crea una fila real en `profiles` para la sesión anónima
  - **Precondición:** Continuación de TC-10-001b
  - **Pasos:** 1. En Supabase, tabla `profiles` → buscar por el `id` más reciente
  - **Resultado esperado:** Existe una fila con `is_anonymous = true`, `email = null`, `username` con formato `traveler_N`
  - **Observaciones:**

- [ ] 🔴 TC-10-003: Se puede navegar y hacer un tour completo sin registrarse
  - **Precondición:** Sesión anónima activa
  - **Pasos:** 1. Buscar una ciudad → 2. Entrar a un tour → 3. Completar todas las paradas
  - **Resultado esperado:** Ninguna pantalla pide email, Apple ni Google en ningún punto del recorrido
  - **Observaciones:**

- [ ] 🟡 TC-10-004: Fallo de alta anónima no bloquea, solo avisa
  - **Precondición:** Deshabilitar temporalmente "Anonymous Sign-Ins" en Supabase
  - **Pasos:** 1. En `/login`, pulsar "Explorar sin registrarte"
  - **Resultado esperado:** No hay crash ni pantalla en blanco; toast de error, se queda en `/login` para intentar con email/Apple/Google en su lugar
  - **Observaciones:**

- [ ] 🟢 TC-10-001c: Reabrir la app no vuelve a mostrar la elección
  - **Precondición:** Sesión anónima o real ya creada (TC-10-001b o login normal)
  - **Pasos:** 1. Cerrar la app del todo → 2. Volver a abrirla
  - **Resultado esperado:** Entra directo a `/home` con la misma sesión, sin volver a pasar por `/login`
  - **Observaciones:**

---

## B. Vincular cuenta (Apple/Google) desde una sesión anónima

- [ ] 🔴 TC-10-005: Vincular conserva millas/insignias/tours previos
  - **Precondición:** Sesión anónima con progreso real (al menos un tour completado, millas > 0)
  - **Pasos:** 1. Ir a `/profile` → 2. Pulsar "Vincular con Apple" (iOS) o "Vincular con Google" (resto) → 3. Completar el flujo
  - **Resultado esperado:** Tras volver a la app, `user.isAnonymous` es `false`, el email aparece relleno, y las millas/insignias/tours siguen siendo exactamente los mismos que antes de vincular (mismo `id`, no se crea perfil nuevo)
  - **Observaciones:**

- [ ] 🔴 TC-10-006: Tras vincular, desaparece el banner y el botón de logout vuelve a aparecer
  - **Precondición:** Continuación de TC-10-005
  - **Pasos:** 1. Observar `/profile`
  - **Resultado esperado:** El banner ámbar "progreso guardado solo en este dispositivo" ya no se muestra; el botón "Cerrar Sesión" (arriba y abajo del todo) vuelve a ser visible
  - **Observaciones:**

- [ ] 🔴 TC-10-007: Vincular con una cuenta que ya existe ofrece iniciar sesión con ella
  - **Precondición:** Un Apple ID/cuenta Google que YA tiene un perfil bdai creado (desde otro dispositivo, u otra sesión anónima previa de prueba)
  - **Pasos:** 1. Desde una sesión anónima nueva, pulsar "Vincular" con esa cuenta ya existente → 2. Completar el login en Apple/Google → 3. Al volver a la app, aparece un diálogo de confirmación → 4. Aceptar
  - **Resultado esperado:** Entra con la cuenta real existente, cargando su perfil (millas/insignias/tours de esa cuenta, no los de la sesión anónima que se abandona). Probar en web (recarga completa de página con `?error=...identity_already_exists` en la URL) y en nativo (deep link) por separado — usan rutas de código distintas
  - **Resultado NO esperado / conocido:** el progreso hecho en la sesión anónima de ESTE dispositivo antes de vincular no se fusiona con la cuenta real — se pierde. Es una limitación aceptada, no un bug (ver sección de fusión de progreso, pendiente de diseño)
  - **Observaciones:**

- [ ] 🟡 TC-10-007b: Cancelar el diálogo no inicia sesión con la otra cuenta
  - **Precondición:** Continuación de TC-10-007, en el paso del diálogo de confirmación
  - **Pasos:** 1. Pulsar "Cancelar" en vez de aceptar
  - **Resultado esperado:** Se queda en la sesión anónima actual tal cual estaba, sin iniciar sesión con la cuenta real
  - **Observaciones:**

---

## C. "Completa tu perfil" (+10 millas)

> ⚠️ Bug real encontrado en producción (sep-2026): el disparador original colgaba de `onTourComplete`
> en `TourActiveView.tsx`, que a su vez ponía `visaToShare` para mostrar una pantalla de "Visa oficial"
> a nivel de App — pero `TourCard.tsx` nunca llamaba a `onTourComplete` (el prop ni se desestructuraba),
> así que ese flujo entero era inalcanzable desde el día que se escribió, con o sin tour completado.
> Arreglado: `onTourComplete` ahora se dispara desde el botón "Cerrar" real de la tarjeta de tour
> completado (`handleCloseCompletion` en `TourCard.tsx`), y pone `showProfileCompletion` directamente
> en el store — se quitó `visaToShare`/`VisaShare` a nivel de App por completo (código muerto).

- [ ] 🔴 TC-10-008: El prompt aparece tras el primer tour completado, no antes
  - **Precondición:** Sesión nueva (anónima o real), 0 tours completados
  - **Pasos:** 1. Navegar libremente por `/home`, `/tools`, etc. → 2. Completar el primer tour → 3. En la tarjeta "boarding pass" de tour completado, pulsar "Cerrar" (NO el botón "Compartir")
  - **Resultado esperado:** El prompt de "Completa tu perfil" NO aparece antes de terminar el tour; aparece automáticamente justo al pulsar "Cerrar" en la tarjeta de finalización
  - **Observaciones:**

- [ ] 🟡 TC-10-008b: También aparece si se comparte antes de cerrar
  - **Precondición:** Continuación de TC-10-008
  - **Pasos:** 1. En la tarjeta de tour completado, pulsar "Compartir" → 2. Cerrar la pantalla de Visa que se abre → 3. Pulsar "Cerrar" en la tarjeta de finalización que queda debajo
  - **Resultado esperado:** El prompt aparece igual tras el "Cerrar" final, independientemente de si se compartió antes o no
  - **Observaciones:**

- [ ] 🟡 TC-10-009: Rellenar el prompt da +10 millas y guarda los campos
  - **Precondición:** Prompt visible
  - **Pasos:** 1. Rellenar fecha de nacimiento, ciudad, país, sexo → 2. Pulsar "Guardar y recibir +10 millas"
  - **Resultado esperado:** Las millas del perfil suben +10; en Supabase, `birthday`/`age`/`city`/`country`/`gender`/`profile_completed_at` quedan rellenos
  - **Observaciones:**

- [ ] 🟡 TC-10-010: Saltar el prompt no vuelve a interrumpir, pero deja un indicador pasivo
  - **Precondición:** Prompt visible
  - **Pasos:** 1. Pulsar la X → 2. Completar un segundo tour
  - **Resultado esperado:** El prompt NO vuelve a aparecer tras el segundo tour; en la barra de navegación, el icono de Perfil muestra un punto morado discreto
  - **Observaciones:**

- [ ] 🟢 TC-10-011: El indicador pasivo desaparece al completar los datos manualmente
  - **Precondición:** Continuación de TC-10-010 (prompt saltado, punto visible)
  - **Pasos:** 1. Entrar a `/profile` → 2. Editar y guardar ciudad + fecha de nacimiento
  - **Resultado esperado:** El punto del icono de Perfil desaparece
  - **Observaciones:**

---

## D. Username único, autogenerado y bloqueable

- [ ] 🔴 TC-10-012: Dos altas nuevas seguidas nunca chocan de username
  - **Precondición:** Ninguna
  - **Pasos:** 1. Crear dos sesiones anónimas nuevas (dos instalaciones/dispositivos, o borrar datos entre medias) → 2. Comparar sus `username` en Supabase
  - **Resultado esperado:** Cada una tiene un `traveler_N` distinto y correlativo, nunca el mismo número
  - **Observaciones:**

- [ ] 🔴 TC-10-013: Cambiar a un username ya existente lo rechaza y sugiere uno nuevo
  - **Precondición:** Dos perfiles de prueba, A y B, con usernames distintos conocidos
  - **Pasos:** 1. Como A, entrar a `/profile` → editar → cambiar el username al mismo que tiene B → 2. Guardar
  - **Resultado esperado:** No se guarda nada; toast avisando que el nombre ya está en uso y sugiriendo uno nuevo (`traveler_N`) en el propio campo; hay que pulsar guardar de nuevo para confirmarlo
  - **Observaciones:**

- [ ] 🟡 TC-10-014: El username queda bloqueado tras el primer guardado
  - **Precondición:** Perfil recién creado, username aún no bloqueado
  - **Pasos:** 1. Entrar a `/profile` → editar (cambiando o no el username) → guardar → 2. Volver a entrar en modo edición
  - **Resultado esperado:** El campo de username ya no es editable (aparece con icono de candado); el resto de campos (nombre, apellidos, ciudad, etc.) sí se pueden seguir editando
  - **Observaciones:**

---

## E. Ranking Global reservado a cuentas vinculadas

- [ ] 🔴 TC-10-015: Anónimo no ve el ranking, ve la pantalla de vincular
  - **Precondición:** Sesión anónima
  - **Pasos:** 1. Pulsar la pestaña de Ranking en la barra de navegación
  - **Resultado esperado:** Se muestra `LeaderboardLockedView` (trofeo + texto + botón Vincular Apple/Google), no la clasificación
  - **Observaciones:**

- [ ] 🔴 TC-10-016: Tras vincular, sí aparece en el Ranking Global
  - **Precondición:** Continuación de TC-10-005 (ya vinculado)
  - **Pasos:** 1. Pulsar la pestaña de Ranking
  - **Resultado esperado:** Se muestra la clasificación normal; el propio usuario aparece en la lista si sus millas lo sitúan en el top 50
  - **Observaciones:**

- [ ] 🟡 TC-10-017: Los perfiles anónimos no ensucian el ranking de otros
  - **Precondición:** Al menos un perfil anónimo con muchas millas de prueba
  - **Pasos:** 1. Como un usuario ya vinculado, abrir el Ranking Global
  - **Resultado esperado:** Ningún `traveler_N` anónimo aparece en la lista, sin importar sus millas
  - **Observaciones:**

---

## F. Panel Admin (Guideline 2.2)

- [ ] 🔴 TC-10-018: `/admin` no accesible a usuarios no-admin
  - **Precondición:** Usuario logueado (anónimo o real) sin `is_admin = true` y con email distinto de `travelbdai@gmail.com`
  - **Pasos:** 1. Navegar manualmente a `/admin` (barra de direcciones en web, o forzar la ruta)
  - **Resultado esperado:** Redirige a `/home`, no se renderiza `AdminPanel`
  - **Observaciones:**

- [ ] 🟢 TC-10-019: `/admin` sigue accesible para la cuenta admin real
  - **Precondición:** Usuario logueado con email `travelbdai@gmail.com` o `is_admin = true`
  - **Pasos:** 1. Entrar a `/profile` → pulsar el botón ADMIN → 2. Navegar directamente a `/admin`
  - **Resultado esperado:** Ambas vías funcionan con normalidad
  - **Observaciones:**

---

## G. GDPR — Eliminar cuenta (perfil anónimo)

- [ ] 🔴 TC-10-020: Eliminar cuenta anónima no afecta a otros perfiles anónimos
  - **Precondición:** Al menos dos perfiles anónimos de prueba
  - **Pasos:** 1. Como el primero, ir a `/profile` → Eliminar Cuenta → escribir "ELIMINAR" (o "DELETE" en inglés) → confirmar
  - **Resultado esperado:** Solo se borra la fila de ese `id`; el resto de perfiles anónimos siguen intactos en Supabase (antes del fix, borraba por `email`, y con `email` vacío en todos los anónimos habría borrado a todos a la vez)
  - **Observaciones:**

- [ ] 🟢 TC-10-021: Texto de confirmación coherente con el idioma
  - **Precondición:** Perfil anónimo con `language: 'en'`
  - **Pasos:** 1. Abrir el modal de eliminar cuenta
  - **Resultado esperado:** Pide escribir "DELETE" (no "ELIMINAR") — instrucción y palabra a escribir coinciden en inglés
  - **Observaciones:**

---

## H. Apple Sign In (Guideline 4 / 2.1(a))

- [ ] 🔴 TC-10-022: Botón oficial en `/login` (solo alcanzable si falla el alta anónima, ver TC-10-004)
  - **Precondición:** iOS, pantalla de login visible
  - **Pasos:** 1. Observar el botón de login social
  - **Resultado esperado:** Fondo negro, logo real de Apple + texto "Sign in with Apple" (no el icono morado de Font Awesome de antes)
  - **Observaciones:**

- [ ] 🔴 TC-10-023: El flujo de Apple no se queda colgado en iPad
  - **Precondición:** iPad (simulador o físico), pantalla de login o botón "Vincular con Apple" en perfil/ranking
  - **Pasos:** 1. Pulsar el botón → 2. Observar
  - **Resultado esperado:** El navegador in-app se abre a pantalla completa y carga la página de Apple con normalidad (antes: con `presentationStyle: 'popover'` sin ancla, no llegaba a presentarse en iPad)
  - **Observaciones:**

---

## I. Regresión rápida sobre módulos existentes afectados

> Estos casos de `01_AUTH.md` / `09_PROFILE_SYNC.md` cambian de comportamiento a propósito con este módulo — no son bugs, pero hay que releerlos con el nuevo contexto:

- **TC-01-010** ("Acceso a ruta protegida sin sesión redirige a login"): ya NO aplica tal cual — sin sesión, la app crea una anónima y entra a `/home` en vez de mostrar `/login` (ver TC-10-001).
- **TC-01-012** (Logout desde el perfil): el botón de logout ahora está oculto para perfiles anónimos (no hay a qué "volver"); sigue igual para cuentas reales/vinculadas.
- **TC-01-015** (la bienvenida solo aparece la primera vez): ahora también aplica al alta anónima, no solo a OTP/Google — verificar que un alta anónima nueva también muestra el Onboarding de 7 pasos.
- **TC-09-001 / TC-09-001b** (consultar `profiles` por email): para perfiles anónimos hay que buscar por `id`, no por `email` (que es `null`).
