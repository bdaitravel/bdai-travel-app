// Comprueba que data/translations.ts tiene TODAS las claves rellenas para los 20 idiomas
// seleccionables (types.ts LANGUAGES) — no solo que existan, sino que ningún idioma se
// quedó atrás cuando se añadió una clave nueva solo a un par de idiomas (es como se coló el
// bug real de "Tours near you" apareciendo en francés/ruso: la clave existía, pero solo en
// en/es, y el resto caía silenciosamente al fallback en inglés).
//
// Uso: npx tsx scripts/checkTranslations.ts
// Sale con código 1 (y falla un CI si se conecta a uno) si detecta algún hueco.

import { translations } from '../data/translations';
import { LANGUAGES } from '../types';

const selectableLangs = LANGUAGES.map(l => l.code);

// sv/da/fi/no existen en translations.ts pero NO están en LANGUAGES (nunca seleccionables
// desde el selector de idioma de la app) — se excluyen a propósito de este chequeo.
const allKeys = new Set<string>();
for (const code of selectableLangs) {
    Object.keys(translations[code] || {}).forEach(k => allKeys.add(k));
}

let hasGaps = false;
for (const code of selectableLangs) {
    const dict = translations[code] || {};
    const missing = [...allKeys].filter(k => !(k in dict));
    if (missing.length > 0) {
        hasGaps = true;
        console.error(`❌ ${code}: faltan ${missing.length} claves — ${missing.join(', ')}`);
    }
}

if (hasGaps) {
    console.error('\nAlgún idioma seleccionable se quedó sin alguna clave que sí existe en otros. Rellénala en data/translations.ts antes de publicar.');
    process.exit(1);
} else {
    console.log(`✅ Las ${selectableLangs.length} idiomas seleccionables tienen las mismas ${allKeys.size} claves. Sin huecos.`);
}
