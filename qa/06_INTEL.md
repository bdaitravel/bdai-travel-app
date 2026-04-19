# 🧠 Módulo 06 — Intel Hub, Ranking & Tienda

> **Componentes:** `Leaderboard.tsx`, `Shop.tsx`, `TravelServices.tsx (Intel)`, `geminiService.ts (On-Demand Intel)`  
> **Rutas:** Modal `Leaderboard`, Modal `Shop`, `/home` (Hub)

---

## A. Leaderboard (Ranking Global)

- [ ] 🔴 TC-06-001: Apertura de Leaderboard
  - **Precondición:** Usuario logueado (ej. Rango "Tourist")
  - **Pasos:** 1. Desde la barra de navegación (NavBar), tocar icono "elite" 👑
  - **Resultado esperado:** Se abre el modal a pantalla completa con pestañas "Global", "Country" y "Badges".
  - **Observaciones:**

- [ ] 🔴 TC-06-002: Tarjeta Personal en Leaderboard (You/Tú)
  - **Precondición:** En `Leaderboard`
  - **Pasos:** 1. Observar la parte superior fija de la pantalla
  - **Resultado esperado:** Aparece la tarjeta del usuario en un marco dorado/distintivo, mostrando ranking exacto, exp y nivel. Su posición debe coincidir con la lista general (si está en el top 50).
  - **Observaciones:**

- [ ] 🟡 TC-06-003: Carga de Datos Globales
  - **Precondición:** En `Leaderboard`
  - **Pasos:** 1. Desplazarse por la lista en la pestaña "Global"
  - **Resultado esperado:** Muestra otros perfiles ordenados descendentemente por experiencia. Si no hay más de 50, muestra todos. Iconos de top 1, 2, 3 dorados/plateados/bronce.
  - **Observaciones:**

- [ ] 🟢 TC-06-004: Cambio de Pestañas (Sub-Rankings) - Si está implementado
  - **Precondición:** En `Leaderboard`
  - **Pasos:** 1. Cambiar a "Country" → 2. Cambiar a "Badges"
  - **Resultado esperado:** "Country" filtra jugadores con tu misma nacionalidad o similar. "Badges" ordena por cantidad de insignias.
  - **Observaciones:**

---

## B. Intel Hub (Análisis Dinámico IA)

- [ ] 🔴 TC-06-005: Generación de Intel en Home
  - **Precondición:** En `/home` con idioma `FR` seleccionado.
  - **Pasos:** 1. Tocar botón central "Intel" (👁️) en NavBar
  - **Resultado esperado:** Se abre modal de Insights. Se genera un "Dai Insight" rápido vía Gemini sobre "tendencias turísticas" u "ocultos" de un país/ciudad top (en Francés).
  - **Observaciones:**

- [ ] 🟡 TC-06-006: Intel de Contexto (Vista Ciudad)
  - **Precondición:** Dentro de `/city/madrid_es`
  - **Pasos:** 1. Tocar el botón de "Intel" en la ciudad (si aplica, o en panel inferior)
  - **Resultado esperado:** Muestra información en tiempo real útil (ej. Clima, Hora punta, Evento local principal) generada mediante la base de datos de Gemini o RAG (si configurado).
  - **Observaciones:**

---

## C. Tienda / Mercado (En Construcción)

- [ ] 🟢 TC-06-007: Visualización Pantalla Construcción
  - **Precondición:** Usuario logueado
  - **Pasos:** 1. Tocar botón "tienda" (🛍️ o token coin) en barra de navegación inferior
  - **Resultado esperado:** Navega/Abre `Shop.tsx`. Muestra mensaje "bdai pazaryeri" (si idioma TR, o equivalente). Gráfico/SVG indicando "Under Construction" y un mensaje de "DAI is working hard...".
  - **Observaciones:**

- [ ] 🟡 TC-06-008: Mostrar Tokens del Usuario
  - **Precondición:** Modificar DB saldo tokens usuario a 50 (o terminar un tour TC-04-009)
  - **Pasos:** 1. Entrar a la Tienda
  - **Resultado esperado:** Arriba/Izquierda debe mostrar "Your tokens: 50 🪙". Aunque no se pueda comprar nada.
  - **Observaciones:**
