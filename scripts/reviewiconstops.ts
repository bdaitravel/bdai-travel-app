import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Faltan variables: VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Mapeo detallado de cualquier etiqueta antigua genérica a las 8 oficiales de la plataforma
const OFFICIAL_CATEGORIES = new Set([
    'history', 'art', 'food', 'nature', 'photo', 'culture', 'architecture', 'special'
]);

const MAPPING_RULES: Record<string, string> = {
    // History
    'historical': 'history',
    'monument': 'history',
    'archaeology': 'history',
    'castle': 'history',
    'landmark': 'history',
    'ruin': 'history',
    'ruins': 'history',
    // Art
    'museum': 'art',
    'gallery': 'art',
    'painting': 'art',
    'sculpture': 'art',
    // Architecture
    'religious': 'architecture',
    'church': 'architecture',
    'cathedral': 'architecture',
    'mosque': 'architecture',
    'temple': 'architecture',
    'building': 'architecture',
    'bridge': 'architecture',
    'skyscraper': 'architecture',
    // Nature
    'parks': 'nature',
    'park': 'nature',
    'garden': 'nature',
    'river': 'nature',
    'lake': 'nature',
    'forest': 'nature',
    'beach': 'nature',
    // Culture
    'theater': 'culture',
    'theatre': 'culture',
    'music': 'culture',
    'concert': 'culture',
    'opera': 'culture',
    'cinema': 'culture',
    'tradition': 'culture',
    // Food
    'gastronomy': 'food',
    'restaurant': 'food',
    'cafe': 'food',
    'market': 'food',
    // Photo
    'viewpoint': 'photo',
    'panorama': 'photo',
    'scenic': 'photo'
};

const standardizeType = (originalType: string | undefined): string => {
    if (!originalType) return 'special';
    
    // Normalize string
    const t = originalType.toLowerCase().trim();
    
    if (OFFICIAL_CATEGORIES.has(t)) {
        return t; // Ya es correcto
    }

    if (MAPPING_RULES[t]) {
        return MAPPING_RULES[t]; // Usar mapeo conocido
    }

    // Default "catch-all" fallback en caso de una palabra aleatoria no detectada
    return 'special';
};

(async () => {
    console.log('══════════════════════════════════════════════════════════════');
    console.log('  REVISIÓN DE IDENTIFICADORES DE ICONOS EN TOURS EXISTENTES');
    console.log('══════════════════════════════════════════════════════════════\n');

    console.log('⏳ Obteniendo todos los tours de tours_cache...');
    const { data: rows, error } = await db.from('tours_cache').select('city, language, data');

    if (error || !rows) {
        console.error('❌ Error leyendo la base de datos:', error?.message);
        process.exit(1);
    }

    console.log(`✅ Se han encontrado ${rows.length} grupos de tours para analizar.\n`);

    let totalStopsUpdated = 0;
    let rowsUpdated = 0;

    for (const row of rows) {
        if (!row.data || !Array.isArray(row.data)) continue;

        let rowNeedsUpdate = false;
        let stopsChangedInRow = 0;

        // Inspeccionar profundamente las paradas del JSON
        const updatedTours = row.data.map((tour: any) => {
            if (!tour.stops || !Array.isArray(tour.stops)) return tour;

            const updatedStops = tour.stops.map((stop: any) => {
                const oldType = stop.type;
                const newType = standardizeType(oldType);

                if (oldType !== newType) {
                    rowNeedsUpdate = true;
                    stopsChangedInRow++;
                    return { ...stop, type: newType };
                }
                return stop;
            });

            return { ...tour, stops: updatedStops };
        });

        if (rowNeedsUpdate) {
            console.log(`[${row.city} / ${row.language}] 🔄 Actualizando ${stopsChangedInRow} paradas con formato antiguo...`);
            const { error: updateError } = await db
                .from('tours_cache')
                .update({ data: updatedTours })
                .eq('city', row.city)
                .eq('language', row.language);

            if (updateError) {
                console.error(`  ❌ Fallo al actualizar la ciudad ${row.city}:`, updateError.message);
            } else {
                totalStopsUpdated += stopsChangedInRow;
                rowsUpdated++;
            }
        } else {
            console.log(`[${row.city} / ${row.language}] ✨ Todo correcto, sin cambios.`);
        }
    }

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('  REPORTE FINAL');
    console.log(`  Ciudades actualizadas: ${rowsUpdated}`);
    console.log(`  Categorías corregidas (iconos arreglados): ${totalStopsUpdated}`);
    console.log('══════════════════════════════════════════════════════════════\n');
})();
