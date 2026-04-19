# 🧪 QA Manifest — BDAI Travel App

> **Versión:** 1.0  
> **Última actualización:** 2026-04-19  
> **Stack:** React + Vite + TypeScript + Supabase + Gemini AI + Capacitor  
> **Idiomas soportados:** 20 (es, en, fr, de, it, pt, ro, zh, ja, ru, ar, hi, ko, tr, pl, nl, ca, eu, vi, th)

---

## 📋 Índice de Módulos QA

Cada módulo es un fichero independiente en este mismo directorio para facilitar la ejecución parcial y el seguimiento granular.

| # | Módulo | Fichero | Cobertura |
|---|--------|---------|-----------|
| 01 | **Autenticación & Sesión** | [01_AUTH.md](01_AUTH.md) | Login OTP, Google OAuth, sesión, logout, GDPR |
| 02 | **Internacionalización (i18n)** | [02_I18N.md](02_I18N.md) | 20 idiomas, traducciones en todos los menús, persistencia |
| 03 | **Explorar & Búsqueda** | [03_EXPLORE.md](03_EXPLORE.md) | Home, buscador de ciudades, destinos, TravelServices |
| 04 | **Tours & Audio** | [04_TOURS.md](04_TOURS.md) | Generación IA, mapa Leaflet, audio TTS, paradas, GPS |
| 05 | **Pasaporte & Gamificación** | [05_PASSPORT.md](05_PASSPORT.md) | Perfil, visados, insignias, rangos, compartir rank |
| 06 | **Intel Hub, Ranking & Tienda** | [06_INTEL.md](06_INTEL.md) | Intel global, leaderboard, shop, comunidad |
| 07 | **Infraestructura & Seguridad** | [07_INFRA.md](07_INFRA.md) | Navegación, estado Zustand, errores, RLS, Capacitor |

---

## 🏷️ Convenciones

### Estados de Test
- `[ ]` — Pendiente
- `[/]` — En progreso
- `[x]` — Superado ✅
- `[!]` — Fallido ❌ (documentar en observaciones)
- `[~]` — No aplica / Bloqueado

### Prioridades
- 🔴 **Crítico** — Bloquea la app o pierde datos
- 🟡 **Alto** — Funcionalidad degradada o UX rota
- 🟢 **Medio** — Cosmético o mejora menor

### Formato de cada test
```
- [ ] 🔴 TC-XX-NNN: Descripción del caso de prueba
  - **Precondición:** Estado necesario antes de ejecutar
  - **Pasos:** 1. Acción → 2. Acción → 3. Verificación
  - **Resultado esperado:** Lo que debería ocurrir
  - **Observaciones:** _(rellenar tras ejecución)_
```

---

## 🔄 Flujo de Ejecución Recomendado

```
01_AUTH → 02_I18N → 03_EXPLORE → 04_TOURS → 05_PASSPORT → 06_INTEL → 07_INFRA
```

> Los módulos dependen del anterior: sin login (01) no se puede probar nada; sin idioma (02) no se verifican traducciones en el resto.

---

## 📊 Resumen de Cobertura

| Módulo | Total Tests | Críticos | Altos | Medios |
|--------|-------------|----------|-------|--------|
| 01_AUTH | 14 | 5 | 5 | 4 |
| 02_I18N | 15 | 3 | 7 | 5 |
| 03_EXPLORE | 12 | 3 | 5 | 4 |
| 04_TOURS | 18 | 6 | 7 | 5 |
| 05_PASSPORT | 16 | 4 | 7 | 5 |
| 06_INTEL | 11 | 2 | 5 | 4 |
| 07_INFRA | 14 | 5 | 5 | 4 |
| **TOTAL** | **100** | **28** | **41** | **31** |
