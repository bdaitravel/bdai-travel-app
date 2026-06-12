# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

**BDAI — Better Destinations AI** is a multilingual travel super-app (React + Vite + TypeScript) with AI-generated walking tours, gamification, a passport/badge system, and mobile support via Capacitor. The full product mandate and architectural decisions are documented in `AGENTS.md` — read it before touching any feature.

## Commands

```bash
npm run dev          # Vite dev server on port 3000
npm run build        # tsc + vite build (must exit 0 before any PR/push)
npm run lint         # tsc --noEmit only (no ESLint)
npm run preview      # serve production build locally
npm run cap-sync     # build + sync to Capacitor (iOS/Android)
```

**Build is mandatory:** Per `AGENTS.md`, run `npm run build` and verify exit code 0 before declaring any structural change done. Vercel auto-deploys from GitHub.

## Environment Variables

Three vars required in `.env` (all checked with multiple naming conventions in `vite.config.ts`):

```
VITE_GEMINI_API_KEY   # or GEMINI_API_KEY or API_KEY
VITE_SUPABASE_URL     # or SUPABASE_URL
VITE_SUPABASE_ANON_KEY # or SUPABASE_ANON_KEY
```

## Architecture

### Routing

`HashRouter` (required for Capacitor filesystem). Routes are defined in `App.tsx`. Protected routes redirect to `/login`. Navigation state (`activeTours`, `selectedCityInfo`) is **not persisted** — `CityDetailView` self-heals from Supabase using the `:slug` URL param if state is empty (page reload, tab suspension).

### State — Zustand (`store/useAppStore.ts`)

Single store. **Only `userProfile` and `currentStopIndex` are persisted.** Storage is environment-aware: `localStorage` on Capacitor native, `sessionStorage` on web (`storageProvider.ts`). Never call `localStorage.setItem('bdai_profile', ...)` directly — all writes go through `setUserProfile`.

### i18n

Central dictionary at `data/translations.ts` (20 languages). Use `useTranslation()` hook for all translated strings. **Do not add new inline translation objects** to components — extend `translations.ts` instead.

### Backend

All Supabase access goes through `services/supabase/`. The client is in `services/supabase/client.ts` — never instantiate a new `createClient` anywhere else. Heavy write operations (tour generation) use three Edge Functions (`tour-orchestrator`, `tour-worker-ai`, `tour-worker-gis`) documented in `services/supabase/*.md` files.

**⚠️ STRICT RULE FOR AI AGENTS**: **ALWAYS** ask the user for explicit permission BEFORE modifying any data directly in Supabase (whether through scripts, RPCs, or edge functions). Never perform destructive actions or unauthorized inserts/updates without their direct consent.


### Edge Functions

Source of truth is `services/supabase/*.md` files — TypeScript code lives inside markdown code blocks. **No Supabase CLI is used.** To deploy: edit the `.md` file, then instruct the user to copy-paste the code block into the Supabase Dashboard manually. Never propose `supabase functions deploy`.

### AI — Gemini

- Tour generation calls go through `services/geminiService.ts` (orchestrator)
- Persona/prompts live in `services/gemini/prompts.ts`
- Client + retry/quota logic in `services/gemini/config.ts`
- Model IDs are standardised: `gemini-2.5-flash` (text), `gemini-2.0-flash-preview-image-generation` (images), `gemini-2.5-flash-preview-tts` (audio, voice "kore")

### Styling

Tailwind CSS is loaded via **CDN in `index.html`** — there is no `tailwind.config.js` and no PostCSS pipeline. Custom animations (`scan`, `fade-in`, `pulse-logo`) and safe-area utilities (`pb-safe-iphone`) are defined inline in `index.html`. Mobile-first RWD is mandatory; never cap full views with `max-w-md`.

### Key Utilities

| File | Purpose |
|------|---------|
| `lib/gisService.ts` | Nominatim/Photon geocoding, hallucination detection |
| `lib/routingService.ts` | OSRM polylines, TSP route optimisation |
| `lib/logger.ts` | Dev-only logging — use instead of `console.*` |
| `lib/useDebounce.ts` | Generic debounce hook |

### Non-obvious Patterns

- **`tours_cache` is read-only for the client** — writes are exclusive to Edge Functions via `service_role`.
- **`city_info` contract:** The object passed between workers always uses `lon` (not `lng`) and `radiusKm` (not `radius`). Breaking this causes silent GIS verification failures.
- **Audio caching uses SHA-256 hashing** of normalised text to deduplicate across sessions.
- **Grounding (Google Search) is rate-limited** to 1400 req/day in `tour-worker-ai`; above that the system degrades gracefully without grounding.
- **`tryExtractTours()`** is used instead of `response_mime_type: "application/json"` because JSON mode is incompatible with Gemini's Google Search grounding tool.
- **Capacitor `Referer` header**: Edge Function calls to Google APIs include `'Referer': 'https://app.bdai.travel/'` to pass Google Cloud API key restrictions.
