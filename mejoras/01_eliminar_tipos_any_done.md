# Mejora 01 — Eliminar tipos `any` explícitos

## Qué ganas
TypeScript deja de ser decorativo y pasa a protegerte de verdad. Hoy mismo tienes 53+ usos de `any` que anulan todas las garantías del compilador: un campo renombrado en `UserProfile`, `Tour` o `Stop` puede romper la UI en producción sin que el build lo detecte. Con tipos correctos, cualquier cambio en `types.ts` propaga errores de compilación inmediatamente a todos los componentes afectados — antes de que llegue a Vercel.

**Beneficio concreto:** El `npm run build` empieza a ser un verdadero gate de calidad, no un paso decorativo.

---

## Prompt para el agente

```
Eres un experto en TypeScript trabajando en el proyecto BDAI Travel App (React + Vite + TypeScript estricto).

Tu tarea es eliminar todos los usos de `any` explícitos en los componentes de la carpeta `src/components/` y reemplazarlos con tipos correctos extraídos de `src/types.ts`.

**Contexto del proyecto:**
- `src/types.ts` ya define las interfaces principales: `UserProfile`, `Tour`, `Stop`, `Badge`, `VisaStamp`, `LeaderboardEntry`, `TravelerRank`, `LANGUAGES`.
- Los textos multiidioma de los componentes usan objetos literales indexados por código de idioma (e.g. `{ es: '...', en: '...' }`). Su tipo correcto es `Record<string, string>` o un tipo derivado de `LANGUAGES`.
- El proyecto usa React 18 + TypeScript 5 en modo estricto.

**Archivos a corregir (por orden de impacto):**

1. `src/components/TourCard.tsx`
   - El componente `TourCard` tiene props tipadas como `React.FC<any>`. Crea una interface `TourCardProps` con los campos reales que recibe: `tour: Tour`, `onSelect: (tour: Tour) => void`, `language: string`.
   - El componente `ActiveTourCard` también tiene props `any`. Crea `ActiveTourCardProps` con los campos reales que usa.
   - Los objetos de textos multiidioma (e.g. `const texts = { es: {...}, en: {...} }`) tipar como `Record<string, { ... }>` con la forma exacta de sus propiedades.

2. `src/components/AdminPanel.tsx`
   - Los callbacks de `.forEach((u: any) => ...)` sobre datos de usuarios deben tiparse con la interface `UserProfile` (ya existente en `types.ts`) o con un tipo parcial si solo se usan algunos campos.
   - Cualquier objeto de respuesta de Supabase que esté tipado como `any` debe tiparlo como `UserProfile | null`.

3. `src/components/ProfileModal.tsx`
   - Los datos del formulario de edición de perfil (nombre, apellido, ciudad, país, etc.) tipar como `Partial<UserProfile>`.
   - Los eventos de `window` (e.g. `window.addEventListener`) tipar con `CustomEvent<T>` especificando el tipo del `detail`.

4. `src/components/Leaderboard.tsx`, `src/components/CityCard.tsx`, `src/components/HubDetailModal.tsx`
   - Los objetos de configuración de textos UI tipados como `any` reemplazar por `Record<string, string>`.

**Reglas obligatorias:**
- NO usar `as unknown as X` como atajo. Si el tipo real es complejo, crea una interface intermedia.
- NO cambiar lógica de negocio, solo los tipos.
- Ejecutar `npm run build` al final. El Exit code debe ser 0.
- Si algún `any` es inevitable (e.g. integración con librería externa sin tipos), déjalo con un comentario `// eslint-disable-next-line @typescript-eslint/no-explicit-any` y una línea explicando por qué.
- Respetar todas las reglas del archivo `AGENTS.md` del proyecto.
```
