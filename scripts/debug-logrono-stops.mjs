// scripts/debug-logrono-stops.mjs
// Diagnóstico de coordenadas para paradas problemáticas de Logroño.
// Solo imprime resultados — NO escribe en Supabase.
// Uso: node scripts/debug-logrono-stops.mjs

const PLACES_API_KEY = 'AIzaSyBytczKNs8oOO7r0sjGcehkW9VHZDVJqrA';

const LOGRONO_CENTER = { lat: 42.46612, lon: -2.43967, radiusKm: 15.6 };

const STOPS_TO_CHECK = [
    { name: 'Concatedral de Santa María de la Redonda', currentLat: 42.466761, currentLon: -2.445519 },
    { name: 'Bodegas Franco-Españolas',                 currentLat: 42.472451, currentLon: -2.446989 },
];

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const searchGooglePlaces = async (query) => {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress,places.types',
            'Referer': 'https://www.bdai.travel/',
        },
        body: JSON.stringify({
            textQuery: query,
            locationBias: {
                circle: {
                    center: { latitude: LOGRONO_CENTER.lat, longitude: LOGRONO_CENTER.lon },
                    radius: Math.round(LOGRONO_CENTER.radiusKm * 1000),
                },
            },
            maxResultCount: 5,
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        console.log(`  ❌ Places API error ${res.status}: ${err}`);
        return null;
    }
    return res.json();
};

const getOSMEntrances = async (lat, lon) => {
    const query = `[out:json][timeout:10];(nwr(around:150,${lat},${lon})["building"];nwr(around:150,${lat},${lon})["historic"];nwr(around:150,${lat},${lon})["tourism"];)->.pois;(node(w.pois)["entrance"~"main|yes|visitor|public"];node(r.pois)["entrance"~"main|yes|visitor|public"];);out body;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });
        if (res.ok) {
            const d = await res.json();
            return d.elements || [];
        }
    } catch (e) { console.log('  OSM error:', e.message); }
    return [];
};

const getOSMEntrancesFallback = async (lat, lon) => {
    const delta = 0.002;
    const query = `[out:json][timeout:10];node["entrance"~"main|yes|visitor|public"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});out body;`;
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
        });
        if (res.ok) {
            const d = await res.json();
            return d.elements || [];
        }
    } catch {}
    return [];
};

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n🔍  Diagnóstico de paradas problemáticas — Logroño\n');
console.log(`📍 Centro ciudad: ${LOGRONO_CENTER.lat}, ${LOGRONO_CENTER.lon} (radio ${LOGRONO_CENTER.radiusKm}km)\n`);

for (const stop of STOPS_TO_CHECK) {
    console.log('═'.repeat(70));
    console.log(`🏛️  ${stop.name}`);
    console.log(`   Actual en DB: ${stop.currentLat}, ${stop.currentLon}`);
    console.log();

    // ─── Places API ───────────────────────────────────────────────────────────
    console.log('  📡 Google Places API:');
    const data = await searchGooglePlaces(`${stop.name}, Logroño, Spain`);
    if (data?.places?.length) {
        data.places.forEach((p, i) => {
            const lat = p.location.latitude;
            const lon = p.location.longitude;
            const distToCenter = haversineKm(lat, lon, LOGRONO_CENTER.lat, LOGRONO_CENTER.lon);
            const distFromCurrent = haversineKm(lat, lon, stop.currentLat, stop.currentLon);
            const marker = i === 0 ? '★' : ' ';
            console.log(`  ${marker} [${i + 1}] "${p.displayName?.text}"`);
            console.log(`       ${lat}, ${lon}`);
            console.log(`       Dirección: ${p.formattedAddress || '—'}`);
            console.log(`       Tipos: ${(p.types || []).join(', ')}`);
            console.log(`       Dist. centro ciudad: ${(distToCenter * 1000).toFixed(0)}m`);
            console.log(`       Dist. desde actual DB: ${(distFromCurrent * 1000).toFixed(0)}m`);
        });
    } else {
        console.log('  (sin resultados)');
    }

    // ─── OSM Entrances cerca de coords actuales ───────────────────────────────
    console.log('\n  🚪 OSM entradas (150m alrededor de coords actuales en DB):');
    const entrances = await getOSMEntrances(stop.currentLat, stop.currentLon);
    if (entrances.length) {
        for (const e of entrances) {
            const dist = haversineKm(e.lat, e.lon, stop.currentLat, stop.currentLon);
            console.log(`     Node ${e.id}: ${e.lat}, ${e.lon} | entrance="${e.tags?.entrance}" | ${(dist * 1000).toFixed(0)}m de actual`);
        }
    } else {
        console.log('     (ninguna encontrada — fallback bbox ±200m)');
        const fb = await getOSMEntrancesFallback(stop.currentLat, stop.currentLon);
        if (fb.length) {
            for (const e of fb) {
                const dist = haversineKm(e.lat, e.lon, stop.currentLat, stop.currentLon);
                console.log(`     Node ${e.id}: ${e.lat}, ${e.lon} | entrance="${e.tags?.entrance}" | ${(dist * 1000).toFixed(0)}m de actual`);
            }
        } else {
            console.log('     (sin entradas OSM en bbox ±200m)');
        }
    }

    // ─── OSM Entrances cerca de primer resultado Places ───────────────────────
    if (data?.places?.length) {
        const first = data.places[0];
        const gpLat = first.location.latitude;
        const gpLon = first.location.longitude;
        if (Math.abs(gpLat - stop.currentLat) > 0.0001 || Math.abs(gpLon - stop.currentLon) > 0.0001) {
            console.log(`\n  🚪 OSM entradas (150m alrededor de 1er resultado Places API: ${gpLat}, ${gpLon}):`);
            const ent2 = await getOSMEntrances(gpLat, gpLon);
            if (ent2.length) {
                for (const e of ent2) {
                    const dist = haversineKm(e.lat, e.lon, gpLat, gpLon);
                    console.log(`     Node ${e.id}: ${e.lat}, ${e.lon} | entrance="${e.tags?.entrance}" | ${(dist * 1000).toFixed(0)}m de Places`);
                }
            } else {
                console.log('     (ninguna encontrada)');
            }
        }
    }

    console.log();
    await new Promise(r => setTimeout(r, 500));
}

console.log('═'.repeat(70));
console.log('\n✅ Diagnóstico completado — sin cambios en Supabase.\n');
