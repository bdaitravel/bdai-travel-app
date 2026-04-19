# 🧭 Módulo 03 — Explorar & Búsqueda

> **Componentes:** `HomeView.tsx`, `CityDetailView.tsx`, `TravelServices.tsx`, `useCity.ts`, `routingService.ts`  
> **Rutas:** `/home`, `/city/:cityId`

---

## A. Búsqueda de Ciudades

- [ ] 🔴 TC-03-001: Búsqueda de ciudad soportada (ej. Logroño)
  - **Precondición:** En `/home`
  - **Pasos:** 1. Escribir "Logroño" en el buscador → 2. Pulsar botón Buscar (lupa) o Enter
  - **Resultado esperado:** Navega a `/city/logrono_es`, muestra la vista de detalle de la ciudad
  - **Observaciones:**

- [ ] 🟡 TC-03-002: Búsqueda con nombres alternativos / erratas
  - **Precondición:** En `/home`
  - **Pasos:** 1. Buscar "Logrono", "Madrit", "Sevija"
  - **Resultado esperado:** El sistema de normalización (`removeAccents`) o los alias devuelven el destino correcto (Logroño, Madrid, Sevilla) y navega a su página
  - **Observaciones:**

- [ ] 🟡 TC-03-003: Búsqueda de ciudad NO soportada (ej. Villarrobledo)
  - **Precondición:** En `/home`
  - **Pasos:** 1. Buscar una ciudad pequeña no listada (ej. "Villarrobledo")
  - **Resultado esperado:** Si no tiene tours en DB y no lo resuelve el backend para OnDemand (actualmente deshabilitado/limitado), muestra feedback: "We are expanding! [Ciudad] will be available soon."
  - **Observaciones:**

- [ ] 🟢 TC-03-004: Pulsar Enter en el buscador lanza la búsqueda
  - **Precondición:** En `/home`, cursor en el input
  - **Pasos:** 1. Escribir "Toledo" → 2. Presionar tecla ENTER
  - **Resultado esperado:** Igual que TC-03-001, navega a `/city/toledo_es`
  - **Observaciones:**

---

## B. Navegación por Tarjetas Home

- [ ] 🔴 TC-03-005: Pulsar tarjeta de Top Destination
  - **Precondición:** En `/home`
  - **Pasos:** 1. Hacer scroll a sección de ciudades → 2. Tocar tarjeta de "Madrid"
  - **Resultado esperado:** Redirige a `/city/madrid_es`
  - **Observaciones:**

- [ ] 🟢 TC-03-006: Carruseles horizontales hacen scroll correctly (Touch/Mouse)
  - **Precondición:** En `/home`, sección "VILLAGES DE CHARME" (múltiples tarjetas)
  - **Pasos:** 1. Arrastrar el carrusel horizontalmente
  - **Resultado esperado:** Desplazamiento fluido, no se acciona el click por error al deslizar
  - **Observaciones:**

---

## C. Vista Detalle Ciudad (CityDetailView)

- [ ] 🔴 TC-03-007: Carga de tours de la ciudad
  - **Precondición:** Navegar a `/city/madrid_es`
  - **Pasos:** 1. Observar la sección "Tours"
  - **Resultado esperado:** La app hace fetch (`checkToursStatus`) y si no hay, empieza a generar (barra de progreso). Si hay, muestra la lista de tours
  - **Observaciones:**

- [ ] 🟡 TC-03-008: Botón Volver en vista detalle
  - **Precondición:** En `/city/seville_es`
  - **Pasos:** 1. Tocar el botón de retroceso (flecha izquierda arriba)
  - **Resultado esperado:** Vuelve a `/home` manteniendo la posición anterior (ideal) o al top de la página
  - **Observaciones:**

- [ ] 🟢 TC-03-009: Visualización de información de la ciudad
  - **Precondición:** En `/city/bordeaux_fr`
  - **Pasos:** 1. Verificar cabecera
  - **Resultado esperado:** Imagen de fondo correcta, nombre "Burdeos" (en ES), país "Francia"
  - **Observaciones:**

---

## D. Travel Services (Servicios Externos - UI)

- [ ] 🟢 TC-03-010: Acceso al Hub TravelServices
  - **Precondición:** En `/home`
  - **Pasos:** 1. Tocar el botón `✈️` abajo a la derecha
  - **Resultado esperado:** Se abre el modal `TravelServices` a pantalla completa
  - **Observaciones:**

- [ ] 🟡 TC-03-011: Filtro en TravelServices
  - **Precondición:** En modal `TravelServices`
  - **Pasos:** 1. Usar el `<select>` superior para filtrar por "Francia" o "Castilla y León"
  - **Resultado esperado:** La lista se actualiza para mostrar solo resultados del filtro
  - **Observaciones:**

- [ ] 🟢 TC-03-012: Listado alfabético
  - **Precondición:** En modal `TravelServices` sin filtro
  - **Pasos:** 1. Observar el listado principal
  - **Resultado esperado:** Muestra todos los destinos agrupados/ordenados correctamente (a-z) con flag emojis y contadores (ej: 3 tours)
  - **Observaciones:**
