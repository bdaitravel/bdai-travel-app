import React, { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type * as LeafletLib from 'leaflet';
import { BdaiLogo } from './BdaiLogo';
import { CARTO_TILE_URL, CARTO_ATTRIBUTION } from '../lib/cartoTiles';
import { getCityLocationsWithTours, getTourCountsByCity, CityLocation } from '../services/supabase/toursService';
import { haversineKm } from '../lib/gisService';
import { getOneShotLocation } from '../lib/geoUtils';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';

const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const L = (window as Window & { L: typeof LeafletLib }).L;
const RADIUS_KM = 20;

// Mismo patrón visual que los marcadores de parada en SchematicMap.tsx
// (círculo + cuadrado rotado a modo de "pico" de chincheta), aplicado aquí
// con el logo de bdai en vez de un icono de categoría.
const buildPinIcon = (): LeafletLib.DivIcon => {
    const logoSvg = renderToStaticMarkup(<BdaiLogo className="w-5 h-5" />);
    return L.divIcon({
        className: '',
        html: `
            <div style="position:relative; width:40px; height:48px;">
                <div style="position:absolute; top:0; left:2px; width:36px; height:36px; border-radius:9999px; background:#9333ea; border:2px solid white; box-shadow:0 4px 12px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center;">
                    ${logoSvg}
                </div>
                <div style="position:absolute; bottom:4px; left:50%; transform:translateX(-50%) rotate(45deg); width:12px; height:12px; background:#9333ea; z-index:-1;"></div>
            </div>
        `,
        iconSize: [40, 48],
        iconAnchor: [20, 46],
        popupAnchor: [0, -40],
    });
};

interface CityDiscoveryMapProps {
    // Se pasa el objeto CityLocation completo (no name/country sueltos) para
    // que quien navegue use el slug real de city_locations — reconstruirlo a
    // partir de name+country falla quan el país no se pudo derivar del slug
    // original (ver AGENTS.md).
    onCitySelect: (city: CityLocation) => void;
}

export const CityDiscoveryMap: React.FC<CityDiscoveryMapProps> = ({ onCitySelect }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<LeafletLib.Map | null>(null);
    const { t } = useTranslation();
    const { userProfile } = useAppStore();

    const [isLoading, setIsLoading] = useState(true);
    const [hasLocation, setHasLocation] = useState(true);
    const [nearbyCount, setNearbyCount] = useState<number | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || !L || mapInstanceRef.current) return;
        let cancelled = false;

        const init = async () => {
            const [cities, userLoc, tourCounts] = await Promise.all([
                getCityLocationsWithTours(),
                getOneShotLocation(10000),
                getTourCountsByCity(userProfile.language),
            ]);
            if (cancelled || !mapContainerRef.current) return;

            const map = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: true,
            }).setView([40.4168, -3.7038], 6); // fallback: centro de España
            map.attributionControl.setPrefix(false);
            // El contenedor del mapa tiene rounded-[2rem] + overflow-hidden (línea del
            // return más abajo); la esquina inferior derecha, donde Leaflet ancla la
            // atribución por defecto, cae justo donde el borde redondeado recorta el
            // contenido — se pierde parte del texto (ej. la "S" de "FOSSGIS"). Se
            // desplaza lo justo para quedar dentro de la zona recta visible.
            const attrEl = map.attributionControl.getContainer();
            if (attrEl) {
                attrEl.style.setProperty('margin-right', '14px');
                attrEl.style.setProperty('margin-bottom', '8px');
            }
            L.tileLayer(CARTO_TILE_URL, { maxZoom: 19, attribution: CARTO_ATTRIBUTION }).addTo(map);

            const icon = buildPinIcon();
            const goLabel = t('discoverGoButton');

            // Se pintan SIEMPRE los pines de todas las ciudades (no solo las cercanas):
            // la gracia de poder alejar el zoom es ver el resto de tours ya cargados,
            // no un mapa vacío fuera del radio inicial. El radio de 20km solo decide
            // el encuadre con el que arranca el mapa, no qué se pinta.
            //
            // Al pulsar un pin se abre un popup con el nombre, el nº de tours y un
            // botón "Ir" — la navegación real solo ocurre al pulsar ese botón, no al
            // tocar el pin (evita saltar a la ciudad sin querer).
            cities.forEach((city) => {
                const count = tourCounts[city.slug] ?? 0;
                const countText = t('discoverTourCount').replace('{n}', String(count));
                const marker = L.marker([city.lat, city.lng], { icon }).addTo(map);
                marker.bindPopup(
                    `<div class="bdai-popup-title">${escapeHtml(city.name)}</div>
                     <div class="bdai-popup-count">${escapeHtml(countText)}</div>
                     <button class="bdai-popup-go">${escapeHtml(goLabel)}</button>`,
                    { className: 'bdai-popup', closeButton: true, maxWidth: 220 }
                );
                marker.on('popupopen', (e) => {
                    const btn = e.popup.getElement()?.querySelector<HTMLButtonElement>('.bdai-popup-go');
                    btn?.addEventListener('click', () => {
                        map.closePopup();
                        onCitySelect(city);
                    }, { once: true });
                });
            });

            if (userLoc) {
                setHasLocation(true);
                L.circleMarker([userLoc.lat, userLoc.lng], {
                    radius: 7, color: '#fff', weight: 2, fillColor: '#9333ea', fillOpacity: 1,
                }).addTo(map);

                const nearbyCities = cities.filter(
                    (c) => haversineKm(userLoc.lat, userLoc.lng, c.lat, c.lng) <= RADIUS_KM
                );
                setNearbyCount(nearbyCities.length);

                // Sin círculo dibujado (a petición): el encuadre inicial se ajusta
                // directamente a tu posición + las ciudades dentro del radio.
                if (nearbyCities.length > 0) {
                    const bounds = L.latLngBounds([
                        [userLoc.lat, userLoc.lng],
                        ...nearbyCities.map((c) => [c.lat, c.lng] as [number, number]),
                    ]);
                    map.fitBounds(bounds, { padding: [32, 32] });
                } else {
                    map.setView([userLoc.lat, userLoc.lng], 10);
                }
            } else {
                setHasLocation(false);
                setNearbyCount(cities.length);
                if (cities.length > 0) {
                    const bounds = L.latLngBounds(cities.map((c) => [c.lat, c.lng] as [number, number]));
                    map.fitBounds(bounds, { padding: [32, 32] });
                }
            }

            mapInstanceRef.current = map;
            setIsLoading(false);
        };

        init();

        return () => {
            cancelled = true;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="h-full flex flex-col gap-4 pt-safe-iphone pb-32 px-6 animate-fade-in">
            <header>
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                    {t('discoverNearbyTitle')}
                </h3>
                {!hasLocation && (
                    <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.4em] mt-2">
                        {t('discoverEnableLocation')}
                    </p>
                )}
            </header>

            <div className="relative flex-1 min-h-[420px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
                <div ref={mapContainerRef} className="w-full h-full" />

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                        <i className="fas fa-spinner fa-spin text-purple-400 text-2xl"></i>
                    </div>
                )}

                {!isLoading && (
                    <div className="absolute right-4 bottom-9 z-[450] flex flex-col gap-2">
                        <button
                            onClick={() => mapInstanceRef.current?.zoomIn()}
                            className="w-10 h-10 rounded-xl bg-slate-900 text-slate-300 border-2 border-white/10 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <i className="fas fa-plus text-xs"></i>
                        </button>
                        <button
                            onClick={() => mapInstanceRef.current?.zoomOut()}
                            className="w-10 h-10 rounded-xl bg-slate-900 text-slate-300 border-2 border-white/10 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <i className="fas fa-minus text-xs"></i>
                        </button>
                    </div>
                )}
            </div>

            {!isLoading && nearbyCount === 0 && hasLocation && (
                <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {t('discoverNoResults')}
                </p>
            )}
        </div>
    );
};
