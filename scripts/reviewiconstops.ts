/**
 * scripts/reviewiconstops.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reclasifica los stop.type (iconos del mapa) de tours_cache con Gemini.
 *
 * FLUJO POR CIUDAD:
 *   1. Elige un idioma de referencia (en > es > primero disponible).
 *   2. Clasifica TODAS sus paradas con gemini-2.5-flash (también las ya
 *      tipadas, para alinearlas con las categorías oficiales: iglesias →
 *      architecture, museos → art, teatros → culture, etc.).
 *   3. Copia los tipos al resto de idiomas de la ciudad (las traducciones
 *      mantienen la estructura exacta: se empareja por id de parada o por
 *      posición tour/parada; si la estructura no cuadra, clasifica ese
 *      idioma directamente con Gemini).
 *   4. Marca cada tour con "iconsReviewedAt" (ISO date) dentro del JSON —
 *      las ciudades donde todos los tours de todos los idiomas ya tienen la
 *      marca se saltan en ejecuciones futuras (usa --force para re-revisar).
 *
 * USO:
 *   npx tsx scripts/reviewiconstops.ts                     # DRY-RUN (no escribe)
 *   npx tsx scripts/reviewiconstops.ts --apply             # escribe en tours_cache
 *   npx tsx scripts/reviewiconstops.ts --city logrono_spain
 *   npx tsx scripts/reviewiconstops.ts --limit 5           # solo 5 ciudades
 *   npx tsx scripts/reviewiconstops.ts --force             # ignora iconsReviewedAt
 *
 * VARIABLES DE ENTORNO (.env.local):
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   + JSON de Service Account GCP (tmp-gdrive-to-m365*.json en el dir padre)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { importPKCS8, SignJWT } from 'jose';
import * as fs from 'fs';
import * as path from 'path';

// ─── Entorno ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Faltan variables: VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2);
const APPLY   = args.includes('--apply');
const FORCE   = args.includes('--force');
const cityArg = args.includes('--city')  ? args[args.indexOf('--city') + 1]  : null;
const limitArg = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;

// ─── Auth GCP (Service Account del directorio padre) ─────────────────────────

const parentDir = path.resolve(process.cwd(), '..');
const gcpJsonFile = fs.readdirSync(parentDir).find(f => f.startsWith('tmp-gdrive-to-m365') && f.endsWith('.json'));
if (!gcpJsonFile) {
    console.error('❌ No se encontró el JSON de la Service Account GCP en el directorio padre.');
    process.exit(1);
}
const sa = JSON.parse(fs.readFileSync(path.join(parentDir, gcpJsonFile), 'utf8'));

let gcpToken = '';
let gcpTokenExp = 0;

async function getToken(): Promise<string> {
    if (gcpToken && Date.now() < gcpTokenExp - 300_000) return gcpToken;
    const privateKey = await importPKCS8(sa.private_key, 'RS256');
    const jwt = await new SignJWT({
        iss: sa.client_email, sub: sa.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/generative-language',
    })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: sa.private_key_id })
        .setIssuedAt().setExpirationTime('1h').sign(privateKey);
    const r = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const data: any = await r.json();
    if (!data.access_token) throw new Error(`Sin access_token GCP: ${JSON.stringify(data)}`);
    gcpToken = data.access_token;
    gcpTokenExp = Date.now() + data.expires_in * 1000;
    return gcpToken;
}

// ─── Clasificación con Gemini ─────────────────────────────────────────────────

const VALID_TYPES = ['history', 'art', 'food', 'nature', 'photo', 'culture', 'architecture', 'special'];
const BATCH_SIZE = 20;

interface StopRef { name: string; desc: string; }

async function classifyBatch(stops: StopRef[]): Promise<string[]> {
    const list = stops.map((s, i) => `${i}. "${s.name}" — ${s.desc.slice(0, 250)}`).join('\n');
    const prompt = `You are classifying tour stops into categories for map icons.
Categories (choose EXACTLY one per stop):
- architecture: churches, cathedrals, bridges, iconic buildings
- history: palaces, castles, walls, towers, ruins, monuments, historic squares/streets
- culture: theaters, music venues, festivals, traditions, universities, stadiums
- food: places to eat or buy food (markets, tapas streets, restaurants, wineries)
- art: museums, galleries, street art
- nature: parks, gardens, rivers, beaches
- photo: viewpoints/spots whose primary value is the view or the photo
- special: ONLY if truly none of the above fits

Stops:
${list}

Return ONLY a JSON array: [{"i": 0, "type": "history"}, ...] with one entry per stop. No other text.`;

    const token = await getToken();
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(120_000),
    });
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j: any = await r.json();
    const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error(`Respuesta Gemini sin texto (finishReason: ${j.candidates?.[0]?.finishReason})`);

    const arr = JSON.parse(text);
    const out: string[] = new Array(stops.length).fill('');
    for (const item of arr) {
        const t = String(item.type || '').toLowerCase();
        if (typeof item.i === 'number' && item.i >= 0 && item.i < stops.length) {
            out[item.i] = VALID_TYPES.includes(t) ? t : 'special';
        }
    }
    if (out.some(t => !t)) throw new Error('Gemini no devolvió tipo para todas las paradas del lote');
    return out;
}

async function classifyBatchWithRetry(stops: StopRef[], maxAttempts = 3): Promise<string[]> {
    let lastErr: any;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await classifyBatch(stops);
        } catch (e: any) {
            lastErr = e;
            console.warn(`    ⚠️ Lote falló (intento ${attempt}/${maxAttempts}): ${e.message}`);
            if (attempt < maxAttempts) await new Promise(r => setTimeout(r, attempt * 3000));
        }
    }
    throw lastErr;
}

/** Clasifica todas las paradas de un array de tours. Devuelve tipos en el mismo orden aplanado. */
async function classifyAllStops(tours: any[]): Promise<string[]> {
    const flat: StopRef[] = tours.flatMap((t: any) => (t.stops || []).map((s: any) => ({
        name: s.name || '(sin nombre)',
        desc: (s.description || '').replace(/\s+/g, ' '),
    })));
    const types: string[] = [];
    for (let i = 0; i < flat.length; i += BATCH_SIZE) {
        types.push(...await classifyBatchWithRetry(flat.slice(i, i + BATCH_SIZE)));
    }
    return types;
}

// ─── Helpers de estructura ────────────────────────────────────────────────────

/** Aplica una lista aplanada de tipos a los tours (mismo orden que classifyAllStops). */
function applyTypes(tours: any[], types: string[], reviewedAt: string): { tours: any[]; changed: number } {
    let idx = 0;
    let changed = 0;
    const updated = tours.map((tour: any) => ({
        ...tour,
        iconsReviewedAt: reviewedAt,
        stops: (tour.stops || []).map((stop: any) => {
            const newType = types[idx++];
            if ((stop.type || '') !== newType) changed++;
            return { ...stop, type: newType };
        }),
    }));
    return { tours: updated, changed };
}

/** ¿Coinciden las estructuras (nº tours y nº paradas por tour) entre dos idiomas? */
function sameShape(a: any[], b: any[]): boolean {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((t: any, i: number) => (t.stops?.length || 0) === (b[i].stops?.length || 0));
}

function isReviewed(tours: any[]): boolean {
    return Array.isArray(tours) && tours.length > 0 && tours.every((t: any) => !!t.iconsReviewedAt);
}

// ─── main ─────────────────────────────────────────────────────────────────────

const LANG_PRIORITY = ['en', 'es'];

async function main() {
    console.log('══════════════════════════════════════════════════════════════');
    console.log('  RECLASIFICACIÓN DE ICONOS (stop.type) CON GEMINI');
    if (!APPLY) console.log('  🔍 MODO DRY-RUN — no se escribe en la BD (usa --apply)');
    if (FORCE)  console.log('  🔁 --force: se ignoran las marcas iconsReviewedAt');
    if (cityArg) console.log(`  🎯 Ciudad única: ${cityArg}`);
    console.log('══════════════════════════════════════════════════════════════\n');

    let query = db.from('tours_cache').select('city, language, data').eq('status', 'READY');
    if (cityArg) query = query.eq('city', cityArg);
    const { data: rows, error } = await query;

    if (error || !rows) {
        console.error('❌ Error leyendo tours_cache:', error?.message);
        process.exit(1);
    }

    // Agrupar por ciudad
    const byCity = new Map<string, Array<{ language: string; data: any[] }>>();
    for (const row of rows) {
        if (!Array.isArray(row.data) || row.data.length === 0) continue;
        if (!byCity.has(row.city)) byCity.set(row.city, []);
        byCity.get(row.city)!.push({ language: row.language, data: row.data });
    }

    console.log(`📦 ${byCity.size} ciudades con tours READY.\n`);

    const reviewedAt = new Date().toISOString();
    let citiesDone = 0, citiesSkipped = 0, citiesFailed = 0;
    let totalChanged = 0, totalStops = 0;

    for (const [city, langs] of byCity) {
        if (citiesDone >= limitArg) break;

        // Saltar ciudades ya revisadas (todos los idiomas marcados)
        if (!FORCE && langs.every(l => isReviewed(l.data))) {
            citiesSkipped++;
            continue;
        }

        // Idioma de referencia: en > es > primero
        const ref = LANG_PRIORITY.map(p => langs.find(l => l.language === p)).find(Boolean) || langs[0];
        const refStopCount = ref.data.flatMap((t: any) => t.stops || []).length;
        console.log(`▶ ${city} — ${langs.length} idioma(s) [${langs.map(l => l.language).join(', ')}] | referencia: ${ref.language} (${refStopCount} paradas)`);

        try {
            // 1. Clasificar el idioma de referencia con Gemini
            const refTypes = await classifyAllStops(ref.data);

            // 2. Aplicar a todos los idiomas
            for (const lang of langs) {
                let result: { tours: any[]; changed: number };

                if (lang === ref || sameShape(lang.data, ref.data)) {
                    // Misma estructura → copiar tipos por posición
                    result = applyTypes(lang.data, refTypes, reviewedAt);
                } else {
                    // Estructura distinta → clasificar este idioma directamente
                    console.log(`    ⚠️ ${lang.language}: estructura distinta a ${ref.language}, clasificando directamente...`);
                    const ownTypes = await classifyAllStops(lang.data);
                    result = applyTypes(lang.data, ownTypes, reviewedAt);
                }

                totalChanged += result.changed;
                totalStops += refStopCount;

                if (APPLY) {
                    const { error: updErr } = await db
                        .from('tours_cache')
                        .update({ data: result.tours })
                        .eq('city', city)
                        .eq('language', lang.language);
                    if (updErr) throw new Error(`Update ${city}/${lang.language}: ${updErr.message}`);
                }
                console.log(`    ${APPLY ? '💾' : '🔍'} ${lang.language}: ${result.changed} paradas cambiarían de tipo${APPLY ? ' (guardado)' : ''}`);
            }

            citiesDone++;
        } catch (e: any) {
            citiesFailed++;
            console.error(`    ❌ ${city}: ${e.message} — se continúa con la siguiente ciudad.`);
        }
    }

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('  REPORTE FINAL');
    console.log(`  Ciudades procesadas:  ${citiesDone}`);
    console.log(`  Ciudades saltadas (ya revisadas): ${citiesSkipped}`);
    console.log(`  Ciudades con error:   ${citiesFailed}`);
    console.log(`  Cambios de tipo:      ${totalChanged}`);
    if (!APPLY) console.log('\n  🔍 DRY-RUN: no se escribió nada. Ejecuta con --apply para guardar.');
    console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(e => {
    console.error('\n❌ Error fatal:', e?.message ?? e);
    process.exit(1);
});
