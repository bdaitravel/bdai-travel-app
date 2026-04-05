import { Tour, Stop } from '../types';

// ── Utilitario Haversine (hoistado para uso en toda la verificación GIS) ──
export const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Helper para comparar nombres (sin tildes, minúsculas, trim)
export const normalizeForMatch = (s: string) => 
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// ── Obtiene metadatos geográficos reales de la ciudad (Ground Truth) ──
export const getCityInfo = async (city: string, country: string): Promise<any> => {
    try {
        const query = encodeURIComponent(`${city}, ${country}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1&extratags=1`, {
            headers: { 'Accept-Language': 'en', 'User-Agent': 'bdai-travel-app/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            const population = data[0].extratags?.population
                ? parseInt(data[0].extratags.population, 10)
                : null;
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                population
            };
        }
    } catch (e) {
        console.warn('Nominatim city lookup failed:', e);
    }
    return null;
};

// ── Valida coordenadas de una parada contra Nominatim y Photon con umbral de 30m + Rescate por Nombre ──
export const verifyStopCoordinates = async (stop: Stop, city: string, country: string, cityCenter: { lat: number, lng: number } | null, requestTs: { last: number }): Promise<Stop> => {
    // 1. Preparar variantes de nombre para la búsqueda
    const fullName = stop.name;
    const parentheticalMatch = fullName.match(/\(([^)]+)\)/);
    const parentheticalPart = parentheticalMatch ? parentheticalMatch[1].trim() : null;
    const prefixPart = fullName.split(/\s*[-–(]\s*/)[0].trim();

    // Filtro de palabras irrelevantes para búsquedas más limpias
    const queries = [
        fullName, // Capa 1: Intento completo
        parentheticalPart, // Capa 2: Contenido entre paréntesis (Suele ser el nombre real en OSM)
        prefixPart // Capa 3: Prefijo antes del paréntesis
    ].filter((q): q is string => !!q && q.length > 2);

    const waitForRateLimit = async () => {
        const elapsed = Date.now() - requestTs.last;
        if (elapsed < 1100) await new Promise(r => setTimeout(r, 1100 - elapsed));
        requestTs.last = Date.now();
    };

    try {
        let bestAuthorityLat = 0;
        let bestAuthorityLon = 0;
        let foundMatch = false;

        for (const query of queries) {
            if (foundMatch) break;
            
            const encodedQuery = encodeURIComponent(`${query}, ${city}, ${country}`);
            const queryPho = encodeURIComponent(`${query} ${city}`);

            // A) Nominatim (Prioridad Alta)
            await waitForRateLimit();
            const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&addressdetails=1`;
            const nomRes = await fetch(nomUrl, { signal: (AbortSignal as any).timeout?.(4000) }).catch(() => null);

            if (nomRes?.ok) {
                const data = await nomRes.json();
                if (data && data.length > 0) {
                    const res = data[0];
                    const nLat = parseFloat(res.lat);
                    const nLon = parseFloat(res.lon);
                    const dist = haversineKm(stop.latitude, stop.longitude, nLat, nLon);

                    const osmName = res.display_name.split(',')[0].trim();
                    const isExactMatch = normalizeForMatch(query) === normalizeForMatch(osmName);

                    if (isExactMatch || dist <= 0.04) { // Umbral 40m para rescate
                        console.log(`GIS 🎯 RESCATE via '${query}' para '${stop.name}': ${(dist * 1000).toFixed(1)}m de ajuste.`);
                        bestAuthorityLat = nLat;
                        bestAuthorityLon = nLon;
                        foundMatch = true;
                        continue;
                    }
                }
            }

            // B) Photon (Fallback Difuso)
            if (!foundMatch) {
                await waitForRateLimit();
                const phoUrl = `https://photon.komoot.io/api/?q=${queryPho}&limit=1`;
                const phoRes = await fetch(phoUrl, { signal: (AbortSignal as any).timeout?.(4000) }).catch(() => null);

                if (phoRes?.ok) {
                    const data = await phoRes.json();
                    if (data && data.features && data.features.length > 0) {
                        const feature = data.features[0];
                        const coords = feature.geometry.coordinates; // [lon, lat]
                        const pLat = coords[1];
                        const pLon = coords[0];
                        const dist = haversineKm(stop.latitude, stop.longitude, pLat, pLon);
                        
                        const photonName = feature.properties.name || "";
                        const isExactMatch = normalizeForMatch(query) === normalizeForMatch(photonName);

                        if (isExactMatch || dist <= 0.04) {
                            console.log(`GIS 🔮 RESCATE (Photon) via '${query}' para '${stop.name}': ${(dist * 1000).toFixed(1)}m de ajuste.`);
                            bestAuthorityLat = pLat;
                            bestAuthorityLon = pLon;
                            foundMatch = true;
                        }
                    }
                }
            }
        }

        if (foundMatch) {
            return { ...stop, latitude: bestAuthorityLat, longitude: bestAuthorityLon, coordinatesVerified: true };
        }

    } catch (e) {
        console.warn(`GIS Refinement error for '${stop.name}':`, e);
    }

    console.log(`GIS ⚠️ ${stop.name}: No se encontró mejor ubicación en OSM. Manteniendo original.`);
    return { ...stop, coordinatesVerified: false };
};

// ── Geocodifica todas las paradas de un tour (secuencial) ────
export const processTourStops = async (tour: Tour, city: string, country: string, cityCenter: { lat: number, lng: number } | null): Promise<Tour> => {
    const stops = tour.stops;
    const results: Stop[] = [];
    const requestTs = { last: 0 };

    for (const stop of stops) {
        const verified = await verifyStopCoordinates(stop, city, country, cityCenter, requestTs);

        // Conservamos la parada a menos que sea una alucinación geográfica (> 10km)
        if (cityCenter) {
            const distToCenterKm = haversineKm(verified.latitude, verified.longitude, cityCenter.lat, cityCenter.lng);
            if (distToCenterKm > 10) {
                console.warn(`GIS: Eliminando '${verified.name}' por estar a ${distToCenterKm.toFixed(1)}km del centro de ${city}. Alucinación catastrófica.`);
                continue;
            }
        }
        results.push(verified);
    }

    return { ...tour, stops: results };
};
