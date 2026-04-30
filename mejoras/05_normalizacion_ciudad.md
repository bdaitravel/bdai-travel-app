# Mejora 05 — Centralizar la normalización de nombres de ciudad

## Qué ganas
La lógica para convertir un nombre de ciudad en un slug/clave (`"San Sebastián"` → `"san_sebastian"`) existe hoy en al menos dos lugares: el frontend (`src/lib/`) y las Edge Functions (`services/supabase/*.md`). Cuando hay dos implementaciones de la misma lógica, tarde o temprano divergen: un cambio en una no se replica en la otra, y aparecen bugs donde el frontend busca una clave que el backend guardó con un formato diferente. Estos bugs son especialmente difíciles de diagnosticar porque el dato parece correcto visualmente.

**Beneficio concreto:** Un único punto de verdad. Cambiar la normalización una vez lo arregla en toda la app. Elimina la clase de bugs más silenciosa del proyecto: los cache misses invisibles por clave mal formada.

---

## Prompt para el agente

```
Eres un experto en TypeScript trabajando en el proyecto BDAI Travel App (React + Vite + TypeScript estricto).

Tu tarea es auditar y centralizar la función de normalización de nombres de ciudad (slug generation) en el frontend, y documentar el contrato para que las Edge Functions usen la misma lógica.

**Contexto:**
- En el frontend existe una función `normalizeKey()` o similar en `src/lib/` que convierte nombres de ciudad a slugs para usarlos como claves de caché en Supabase (`tours_cache.city`).
- Las Edge Functions en `services/supabase/*.md` también realizan esta normalización, pero pueden tener una implementación ligeramente diferente.
- El campo `city` en `tours_cache` es la Primary Key junto con `language`. Si frontend y backend generan slugs distintos para la misma ciudad, se producen cache misses invisibles.

**Pasos:**

1. **Auditoría:** Lee los siguientes archivos y extrae TODAS las implementaciones de normalización de nombre de ciudad que encuentres:
   - `src/lib/gisService.ts`
   - `src/services/geminiService.ts`
   - `src/services/supabase/toursService.ts`
   - `src/hooks/useCity.ts`
   - Los ficheros `.md` de `services/supabase/` (tour-orchestrator, tour-worker-ai, tour-worker-gis)

2. **Identifica la versión canónica:** La función más completa (que maneja acentos, ñ, espacios, caracteres especiales) se convierte en la implementación oficial. Si hay diferencias entre versiones, la más estricta gana.

3. **Centraliza en `src/lib/normalizeCity.ts`:**
   Crea este archivo con la función canónica:
   ```typescript
   /**
    * Convierte un nombre de ciudad a slug para usar como clave de caché.
    * CONTRATO: Esta es la única implementación autorizada. Las Edge Functions
    * deben replicar exactamente esta lógica (ver services/supabase/README-normalization.md).
    */
   export function normalizeCity(city: string): string {
     // Implementación canónica aquí
   }
   ```

4. **Reemplaza todos los usos en el frontend** por `import { normalizeCity } from '../lib/normalizeCity'` (o la ruta relativa correcta). Elimina las implementaciones duplicadas.

5. **Crea `services/supabase/README-normalizacion.md`** con el contrato exacto de la función (pasos de transformación en pseudocódigo) para que cualquier modificación futura de las Edge Functions sepa exactamente qué debe replicar.

**Reglas obligatorias:**
- NO cambiar el output de la función si ya hay datos en `tours_cache` — esto rompería todas las claves existentes. Solo unificar las implementaciones que ya existen sin alterar el resultado.
- Si las implementaciones producen outputs distintos para el mismo input, reportarlo al usuario antes de proceder y pedir instrucción.
- Ejecutar `npm run build` al final. El Exit code debe ser 0.
- Respetar todas las reglas del archivo `AGENTS.md` del proyecto.
```
