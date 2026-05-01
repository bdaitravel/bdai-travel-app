# Mejora 06 — Búsqueda de ciudad en dos fases (instantánea + IA)

## Qué ganas

Ahora mismo al escribir una ciudad en el buscador pasan tres cosas malas: (1) el usuario espera entre 5 y 20 segundos sin ver nada porque la llamada a Gemini bloquea toda la UI, (2) ciudades que ya están en caché aparecen marcadas como tal pero tarde, cuando el usuario ya se ha impacientado, y (3) nombres que existen en varios países (ej. "Logroño", "Valencia", "Santiago") devuelven múltiples resultados de la IA, multiplicando el tiempo de espera.

La solución es una búsqueda en dos fases solapadas: una fase **instantánea** (<100ms) que consulta directamente `tours_cache` en Supabase y muestra resultados ya conocidos, y una fase **IA** que refina y amplía en segundo plano mientras el usuario ya puede interactuar. El usuario ve resultados en menos de medio segundo y la IA enriquece la lista sin bloquearlo.

**Beneficio concreto:** Cero segundos de pantalla en blanco. Las ciudades ya generadas aparecen de inmediato. La llamada a Gemini pasa de ser un bloqueante a un enriquecedor silencioso.

---

## Prompt para el agente

```
Eres un experto en React + TypeScript trabajando en el proyecto BDAI Travel App.

Tu tarea es refactorizar el sistema de búsqueda de ciudad en `hooks/useCity.ts` para que sea en dos fases solapadas, eliminando los 5-20 segundos de espera actual.

**Contexto del problema:**
- La función `handleCitySearch` actualmente llama a `normalizeCityWithAI()` (Gemini) en cada búsqueda con debounce de 1s.
- Gemini tarda entre 5 y 20 segundos y bloquea la UI — el usuario no ve nada hasta que la IA responde.
- Ciudades que ya existen en `tours_cache` de Supabase aparecen tarde, cuando el usuario ya está frustrado.
- La tabla `tours_cache` tiene columna `city` (slug tipo `logrono_spain`) con `status='READY'`, y la tabla `cities` puede existir con datos adicionales.
- La función `checkIfCityCached(city, slug, language)` ya existe en `services/supabase/toursService.ts`.
- Lee `AGENTS.md` completo antes de empezar para respetar todas las reglas del proyecto.

**Arquitectura de dos fases a implementar:**

FASE 1 — Supabase instantánea (disparar en cada keyup, sin debounce o con debounce de 150ms):
- Consultar `tours_cache` buscando ciudades cuyo slug contenga las letras escritas: `.ilike('city', '%<término>%').eq('status', 'READY')`
- También buscar en la tabla `cities` si existe con un campo `name` o `display_name`.
- Convertir los slugs de vuelta a nombres legibles (ej. `logrono_spain` → "Logroño, España") usando una función `slugToDisplayName()` a crear en `lib/`.
- Mostrar estos resultados inmediatamente como `searchOptions` con `isCached: true`.

FASE 2 — Gemini en paralelo (con debounce de 1000ms, como ahora):
- Llamar a `normalizeCityWithAI()` igual que ahora.
- Cuando responda, fusionar sus resultados con los de Fase 1: los resultados de caché van primero, los nuevos de IA se añaden a continuación deduplicando por slug.
- Indicar visualmente qué resultados son de caché (ya generados) y cuáles son nuevos.

**Implementación concreta:**

1. En `hooks/useCity.ts`, sustituye el único `doSearch` debounced por dos funciones:
   - `doLocalSearch(val)` — sin debounce o debounce 150ms, consulta Supabase, actualiza `searchOptions` inmediatamente.
   - `doAiSearch(val)` — debounce 1000ms, llama a Gemini, fusiona con los resultados locales ya visibles.
   
2. En `handleCitySearch`, dispara ambas en orden:
   ```typescript
   const handleCitySearch = (val: string) => {
     setSearchVal(val);
     if (val.length < 2) { setSearchOptions(null); return; }
     setIsSearching(true);
     doLocalSearch(val);   // responde en <100ms
     doAiSearch(val);      // enriquece en 5-20s
   };
   ```

3. Crea `lib/slugToDisplayName.ts` con una función que convierta slugs de `tours_cache` a nombres legibles:
   - Separar por `_`, eliminar el último segmento si es un país conocido en inglés, capitalizar las palabras.
   - Ejemplo: `logrono_spain` → `{ city: "Logroño", country: "Spain", countryCode: "ES" }`
   - Necesitas una tabla de mapeo `COUNTRY_SLUG_TO_NAME` con al menos los países europeos más comunes.
   - El objeto devuelto debe ser compatible con el formato que ya consume `HomeView.tsx` en `searchOptions`.

4. La fusión de resultados debe deduplicar por slug para que una ciudad de caché no aparezca dos veces si también la devuelve Gemini. Los resultados de caché siempre aparecen primero.

5. El estado `isSearching` solo se pone a `false` cuando AMBAS fases han terminado (o cuando la Fase 1 termina si la IA aún no ha respondido — en ese caso mostrar un spinner sutil de "buscando más resultados...").

**Reglas obligatorias:**
- NO modificar `processCitySelection` ni la lógica de selección — solo la búsqueda.
- NO añadir dependencias nuevas.
- El campo `isCached` en los resultados de la Fase 1 debe respetar el idioma del usuario (llamar a `checkIfCityCached(city, slug, user.language || 'es')`).
- Ejecutar `npm run build` al final. El Exit code debe ser 0.
- Respetar todas las reglas de `AGENTS.md`.
- Si la tabla `cities` no existe en Supabase, omitir esa parte silenciosamente (usar solo `tours_cache`).
```
