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

// ── Calcula el radio de alucinación según la población de la ciudad ──
const getHallucinationRadiusKm = (population: number | null): number => {
    if (!population) return 7;       // Sin datos: radio moderado
    if (population < 20_000) return 3;  // Ciudad pequeña: 3km
    if (population < 200_000) return 5; // Ciudad media: 5km
    return 10;                          // Ciudad grande: 10km
};

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

// ── PASO 1: Verifica si una parada existe en OSM a nivel global ──
// Si no hay ningún resultado global, la parada es una alucinación y debe eliminarse.
const verifyStopExists = async (stopName: string, requestTs: { last: number }): Promise<boolean> => {
    const waitForRateLimit = async () => {
        const elapsed = Date.now() - requestTs.last;
        if (elapsed < 1100) await new Promise(r => setTimeout(r, 1100 - elapsed));
        requestTs.last = Date.now();
    };

    try {
        await waitForRateLimit();

        // Variantes: nombre completo y prefijo antes de paréntesis
        const prefixPart = stopName.split(/\s*[-–(]\s*/)[0].trim();
        const queries = [...new Set([stopName, prefixPart])].filter(q => q.length > 2);

        for (const q of queries) {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=0`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'bdai-travel-app/1.0' },
                signal: (AbortSignal as any).timeout?.(4000)
            }).catch(() => null);

            if (!res?.ok) return true; // Si la API falla, no penalizar — ser conservador

            const data = await res.json();
            if (data && data.length > 0) {
                console.log(`GIS ✅ EXISTE globalmente: '${q}'`);
                return true;
            }
        }

        console.warn(`GIS 🚫 ALUCINACIÓN DETECTADA: '${stopName}' no existe en OSM global. Eliminando.`);
        return false;
    } catch (e) {
        console.warn(`GIS existence check error for '${stopName}':`, e);
        return true; // Conservador: no eliminar si hay error de red
    }
};

// ── PASO 2: Valida y corrige las coordenadas dentro del municipio correcto ──
export const verifyStopCoordinates = async (stop: Stop, city: string, country: string, cityCenter: { lat: number, lng: number } | null, requestTs: { last: number }): Promise<Stop> => {
    // 1. Preparar variantes de nombre para la búsqueda
    const fullName = stop.name;
    const parentheticalMatch = fullName.match(/\(([^)]+)\)/);
    const parentheticalPart = parentheticalMatch ? parentheticalMatch[1].trim() : null;
    const prefixPart = fullName.split(/\s*[-–(]\s*/)[0].trim();

    const queries = [
        fullName,
        parentheticalPart,
        prefixPart
    ].filter((q): q is string => !!q && q.length > 2);

    const waitForRateLimit = async () => {
        const elapsed = Date.now() - requestTs.last;
        if (elapsed < 1100) await new Promise(r => setTimeout(r, 1100 - elapsed));
        requestTs.last = Date.now();
    };

    const normalizedCity = normalizeForMatch(city);

    // Extrae el nombre de municipio de la respuesta address de Nominatim
    const extractMunicipalityFromAddress = (address: any): string => {
        const raw = address?.city || address?.town || address?.village || address?.municipality || address?.county || '';
        return normalizeForMatch(raw);
    };

    try {
        let bestAuthorityLat = 0;
        let bestAuthorityLon = 0;
        let foundMatch = false;

        for (const query of queries) {
            if (foundMatch) break;
            
            const encodedQuery = encodeURIComponent(`${query}, ${city}, ${country}`);
            const queryPho = encodeURIComponent(`${query} ${city}`);

            // A) Nominatim (Prioridad Alta) con validación de municipio
            await waitForRateLimit();
            const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=3&addressdetails=1`;
            const nomRes = await fetch(nomUrl, {
                headers: { 'User-Agent': 'bdai-travel-app/1.0' },
                signal: (AbortSignal as any).timeout?.(4000)
            }).catch(() => null);

            if (nomRes?.ok) {
                const data = await nomRes.json();
                if (data && data.length > 0) {
                    // Iterar resultados para encontrar uno que pertenezca al municipio correcto
                    for (const res of data) {
                        const nLat = parseFloat(res.lat);
                        const nLon = parseFloat(res.lon);
                        const dist = haversineKm(stop.latitude, stop.longitude, nLat, nLon);

                        const osmName = res.display_name.split(',')[0].trim();
                        const isExactNameMatch = normalizeForMatch(query) === normalizeForMatch(osmName);
                        const isFuzzyNameMatch = normalizeForMatch(osmName).includes(normalizeForMatch(query)) || normalizeForMatch(query).includes(normalizeForMatch(osmName));

                        // Validación clave: ¿pertenece al municipio correcto?
                        const resultMunicipality = extractMunicipalityFromAddress(res.address);
                        const isCorrectMunicipality = resultMunicipality.includes(normalizedCity) || 
                                                       normalizedCity.includes(resultMunicipality) ||
                                                       resultMunicipality === '';

                        if (!isCorrectMunicipality) {
                            console.warn(`GIS ⚠️ '${query}' encontrado en '${res.address?.city || res.address?.town}' ≠ ${city}. Descartando resultado.`);
                            continue; // Probar siguiente resultado
                        }

                        // ENDURECIDO: Exact/Fuzzy name match → RESCATE sin límite de distancia
                        //             Sin match de nombre → máximo 500m (antes era 2.5km)
                        if (isExactNameMatch || isFuzzyNameMatch) {
                            console.log(`GIS 🎯 RESCATE via '${query}' para '${stop.name}' en ${city}: ${(dist * 1000).toFixed(1)}m de ajuste.`);
                            bestAuthorityLat = nLat;
                            bestAuthorityLon = nLon;
                            foundMatch = true;
                            break;
                        } else if (dist <= 1.0) {
                            console.log(`GIS 🧲 MAGNETO 1km via '${query}' para '${stop.name}': ${(dist * 1000).toFixed(1)}m de ajuste.`);
                            bestAuthorityLat = nLat;
                            bestAuthorityLon = nLon;
                            foundMatch = true;
                            break;
                        }
                    }
                }
            }

            // B) Photon (Fallback Difuso)
            if (!foundMatch) {
                await waitForRateLimit();
                const phoUrl = `https://photon.komoot.io/api/?q=${queryPho}&limit=3`;
                const phoRes = await fetch(phoUrl, {
                    signal: (AbortSignal as any).timeout?.(4000)
                }).catch(() => null);

                if (phoRes?.ok) {
                    const data = await phoRes.json();
                    if (data && data.features && data.features.length > 0) {
                        for (const feature of data.features) {
                            const coords = feature.geometry.coordinates; // [lon, lat]
                            const pLat = coords[1];
                            const pLon = coords[0];
                            const dist = haversineKm(stop.latitude, stop.longitude, pLat, pLon);
                            
                            const photonName = feature.properties.name || "";
                            const isExactMatch = normalizeForMatch(query) === normalizeForMatch(photonName);
                            const isFuzzyNameMatch = normalizeForMatch(photonName).includes(normalizeForMatch(query)) || normalizeForMatch(query).includes(normalizeForMatch(photonName));

                            // Validación de municipio en Photon
                            const photonCity = normalizeForMatch(feature.properties.city || feature.properties.county || '');
                            const isCorrectMunicipality = photonCity.includes(normalizedCity) || 
                                                           normalizedCity.includes(photonCity) ||
                                                           photonCity === '';

                            if (!isCorrectMunicipality) {
                                console.warn(`GIS ⚠️ Photon: '${photonName}' encontrado en municipio incorrecto. Descartando.`);
                                continue;
                            }

                            // ENDURECIDO: misma lógica que Nominatim
                            if (isExactMatch || isFuzzyNameMatch) {
                                console.log(`GIS 🔮 RESCATE (Photon) via '${query}' para '${stop.name}': ${(dist * 1000).toFixed(1)}m de ajuste.`);
                                bestAuthorityLat = pLat;
                                bestAuthorityLon = pLon;
                                foundMatch = true;
                                break;
                            } else if (dist <= 1.0) {
                                console.log(`GIS 🧲 MAGNETO 1km (Photon) via '${query}' para '${stop.name}': ${(dist * 1000).toFixed(1)}m de ajuste.`);
                                bestAuthorityLat = pLat;
                                bestAuthorityLon = pLon;
                                foundMatch = true;
                                break;
                            }
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

    console.log(`GIS ⚠️ ${stop.name}: No se encontró mejor ubicación en OSM para ${city}. Manteniendo original con baja confianza.`);
    return { ...stop, coordinatesVerified: false };
};

// ── Pipeline completo: Existencia → Geocodificación → Filtro de radio ────
export const processTourStops = async (tour: Tour, city: string, country: string, cityCenter: { lat: number, lng: number, population?: number | null } | null): Promise<Tour> => {
    const stops = tour.stops;
    const results: Stop[] = [];
    const requestTs = { last: 0 };
    const radiusKm = getHallucinationRadiusKm(cityCenter?.population ?? null);

    for (const stop of stops) {
        // PASO 1: ¿El lugar existe en OSM globalmente? Si no → alucinación → saltar.
        const exists = await verifyStopExists(stop.name, requestTs);
        if (!exists) {
            console.warn(`GIS 🚫 '${stop.name}' eliminada: no encontrada en OSM global.`);
            continue;
        }

        // PASO 2: Corregir coordenadas dentro del municipio correcto.
        const verified = await verifyStopCoordinates(stop, city, country, cityCenter, requestTs);

        // PASO 3: Filtro de radio dinámico — eliminar alucinaciones geográficas.
        if (cityCenter) {
            const distToCenterKm = haversineKm(verified.latitude, verified.longitude, cityCenter.lat, cityCenter.lng);
            if (distToCenterKm > radiusKm) {
                console.warn(`GIS 📍 Eliminando '${verified.name}': está a ${distToCenterKm.toFixed(1)}km del centro (máx. ${radiusKm}km para esta ciudad).`);
                continue;
            }
        }

        // Solo se conservan paradas con coordenadas verificadas
        if (verified.coordinatesVerified) {
            results.push(verified);
        } else {
            console.warn(`GIS ⚠️ '${verified.name}': coordenadas no verificadas en ${city}. Descartada.`);
        }
    }

    return { ...tour, stops: results };
};
