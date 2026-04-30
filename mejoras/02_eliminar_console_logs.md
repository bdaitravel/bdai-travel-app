# Mejora 02 — Eliminar `console.log` de producción

## Qué ganas
Actualmente `geminiService.ts` y otros archivos tienen ~8+ llamadas `console.log` activas que llegan a producción. Esto tiene tres riesgos reales:

1. **Fuga de datos**: los logs pueden imprimir nombres de ciudades, slugs, respuestas de Gemini o fragmentos de itinerarios que no deberían ser visibles en DevTools del navegador de cualquier usuario.
2. **Ruido en monitorización**: si en el futuro conectas Sentry u otro observability tool, los logs de debug inundan las alertas reales.
3. **Bundle marginalmente más grande**: cada string de log añade bytes al bundle final.

**Beneficio concreto:** Producción queda limpia. En desarrollo sigues viendo todos los logs sin cambiar nada.

---

## Prompt para el agente

```
Eres un experto en TypeScript trabajando en el proyecto BDAI Travel App (React + Vite + TypeScript estricto).

Tu tarea es crear una utilidad de logging condicional y reemplazar todos los `console.log` / `console.warn` de debug dispersos por esta utilidad, de forma que solo se ejecuten en entorno de desarrollo.

**Paso 1 — Crear la utilidad en `src/lib/logger.ts`:**

Crea el archivo `src/lib/logger.ts` con este contenido exacto:

```typescript
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => { if (isDev) console.error(...args); },
};
```

**Paso 2 — Reemplazar usos en los archivos afectados:**

Sustituye `console.log(` y `console.warn(` por `logger.log(` / `logger.warn(` en estos archivos:
- `src/services/geminiService.ts` (~8 ocurrencias de debug de tour generation)
- `src/lib/gisService.ts` (logs de geocoding y rate limiting)
- `src/lib/routingService.ts` (logs de optimización de rutas)
- `src/services/supabase/client.ts` (el silenciado de "Refresh Token Not Found" — este SÍ debe mantenerse en producción como `console.error` normal, no usar logger)
- Cualquier otro archivo en `src/` que tenga `console.log` de naturaleza debug

**Reglas obligatorias:**
- Los `console.error` que sirven para reportar errores reales al usuario o a Sentry NO se cambian. Solo los logs de debug/info.
- Añadir el import `import { logger } from '../lib/logger';` (o la ruta relativa correcta) en cada archivo modificado.
- NO tocar los archivos `.md` de `services/supabase/` (Edge Functions).
- Ejecutar `npm run build` al final. El Exit code debe ser 0.
- Respetar todas las reglas del archivo `AGENTS.md` del proyecto.
```
