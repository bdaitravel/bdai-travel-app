# ⚙️ Módulo 07 — Infraestructura & Seguridad

> **Componentes:** `App.tsx`, `useAppStore.ts` (Zustand), `supabaseClient.ts` (Edge Functions, RLS), Capacitor Core
> **Rutas:** N/A (Métricas Globales)

---

## A. Row Level Security (RLS) en Supabase

- [ ] 🔴 TC-07-001: Modificación de Usuarios Ajenos Denegada
  - **Precondición:** Tomar Token JWT (`sb-...-auth-token`) de un User A de `localStorage`.
  - **Pasos:** 1. Con Bruno (o Postman), intentar hacer un `PATCH` o `UPDATE` a la tabla `user_profiles` cambiando el uuid (id) por el de User B (otro uuid que sepamos existe en la base de datos de pruebas).
  - **Resultado esperado:** Código 403 Forbidden o respuesta vacía / 0 filas afectadas (RLS policy lo rechaza).
  - **Observaciones:**

- [ ] 🔴 TC-07-002: Inserción directa en Tours Denegada (Client-Side)
  - **Precondición:** Desde consola DevTools, instanciar cliente supabase con anon key.
  - **Pasos:** 1. Ejecutar: `await supabase.from('tours').insert({ id: 'falso', title: 'test', ... })`
  - **Resultado esperado:** Error RLS `violates row-level security policy for table "tours"`. (Las inserciones deben venir SÓLO de la Edge Function asegurada).
  - **Observaciones:**

- [ ] 🔴 TC-07-003: Subida directa de Archivos a Bucket `audio` Restringida
  - **Precondición:** Cliente JS normal intentando subir a `storage.objects` bucket `audio`
  - **Pasos:** 1. Enviar blob.
  - **Resultado esperado:** `new row violates row-level security policy`. Sólo servicio o select es permitido por usuario normal.
  - **Observaciones:**

---

## B. Persistencia Zustand (State Management)

- [ ] 🔴 TC-07-004: Estado de Tours Activos y UI
  - **Precondición:** Entrar en un tour (`/city/madrid_es`), avanzar a la parada N° 2. Reproducir audio (dejar la configuración en velocidad 1.5x).
  - **Pasos:** 1. Minimizar navegador móvil (poner en background) -> 2. Volver a maximizar / refrescar.
  - **Resultado esperado:** La UI debe cargar instantáneamente en la Parada N° 2. El reproductor mantiene el estado anterior y `speed: 1.5x`.
  - **Observaciones:**

- [ ] 🟡 TC-07-005: Estado Offline (Degradación Graciosa)
  - **Precondición:** Apagar WiFi/Datos (modo offline) con la app abierta.
  - **Pasos:** 1. Recargar página o navegar a una ciudad nueva no cacheada en `zustand`.
  - **Resultado esperado:** Se bloquean acciones externas e indica estado offline sin romper/crashear la UI actual.
  - **Observaciones:**

---

## C. Compilación y Despliegue (Build Check)

- [ ] 🔴 TC-07-006: Compilación Libre de Errores de TypeScript
  - **Precondición:** Todos los cambios recientes guardados.
  - **Pasos:** 1. Ejecutar en terminal: `npm run build` o `tsc -b && vite build`
  - **Resultado esperado:** Compilación terminal pasa en ✔ Verde. Cero errores de TS "any", types incompatibles, o imports rotos. Si no, **No pasar a producción**.
  - **Observaciones:**

- [ ] 🟡 TC-07-007: Capacitor Sync (Entorno Mobile)
  - **Precondición:** Entorno preparado (`npm run build` hecho)
  - **Pasos:** 1. `npx cap sync`
  - **Resultado esperado:** Inyecta código web actualizado sin fallar plugins natives de geolocalización.
  - **Observaciones:**

---

## D. Estabilidad UI en Factores de Forma (Mobile-First)

- [ ] 🟡 TC-07-008: Barra de navegación inferior vs Safe-Areas
  - **Precondición:** DevTools > Toggle Device (iPhone 14 / Pro con Notch/Isla)
  - **Pasos:** 1. Navegar por Home y Profile
  - **Resultado esperado:** La NavBar no se oculta tras la barra "home" nativa del iOS, y el encabezado esquiva el Notch. (Contiene safe-area en CSS).
  - **Observaciones:**

- [ ] 🟢 TC-07-009: Resize Screen Responsiveness
  - **Precondición:** Navegador desktop (Chrome/Firefox)
  - **Pasos:** 1. Cargar App → 2. Ensanchar brutalmente a formato 16:9 1080p y reducir a teléfono estrecho (320px ancho).
  - **Resultado esperado:** Los contenedores principales usan 'max-w-md mx-auto', dejando bandas negras/borrosas a los lados, sin que los botones ocupen 2 metros de pantalla, respetando el "app-feel".
  - **Observaciones:**
