import React, { useEffect, useRef } from 'react';
import type * as LeafletLib from 'leaflet';
import { CARTO_TILE_URL, CARTO_ATTRIBUTION } from '../lib/cartoTiles';

const L = (window as Window & { L: typeof LeafletLib }).L;

interface MapThumbnailProps {
    stops: { latitude: number; longitude: number }[];
    className?: string;
}

/**
 * Vista previa estática (no interactiva) del mapa con las paradas, usada en
 * la tarjeta de Modo Libre — mismas teselas/key/atribución de CARTO que el
 * resto de la app (lib/cartoTiles.ts), sin repetir esa configuración.
 * `pointerEvents: 'none'` en el contenedor: es solo una miniatura dentro de
 * una tarjeta que ya es pulsable entera (TourCard.tsx), no debe capturar el
 * toque ni permitir arrastrar/hacer zoom por separado.
 */
export const MapThumbnail: React.FC<MapThumbnailProps> = ({ stops, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !L) return;
        const valid = stops.filter(
            s => !isNaN(s.latitude) && !isNaN(s.longitude) && !(s.latitude === 0 && s.longitude === 0)
        );
        if (valid.length === 0) return;

        const map = L.map(containerRef.current, {
            zoomControl: false,
            attributionControl: true,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
        });
        map.attributionControl.setPrefix(false);
        const attrEl = map.attributionControl.getContainer();
        if (attrEl) {
            attrEl.style.setProperty('margin-right', '8px');
            attrEl.style.setProperty('margin-bottom', '4px');
            attrEl.style.setProperty('font-size', '7px');
        }
        L.tileLayer(CARTO_TILE_URL, { maxZoom: 19, attribution: CARTO_ATTRIBUTION }).addTo(map);

        valid.forEach(s => {
            L.circleMarker([s.latitude, s.longitude], {
                radius: 5, color: '#fff', weight: 1.5, fillColor: '#9333ea', fillOpacity: 1,
            }).addTo(map);
        });

        const bounds = L.latLngBounds(valid.map(s => [s.latitude, s.longitude] as [number, number]));

        // Estas tarjetas suelen montarse dentro de una rejilla desplazable —
        // el contenedor puede no tener aún su tamaño final en este mismo tick
        // (se ha visto alguna vez el mapa cargado pero sin ningún punto
        // visible, porque fitBounds calculó el encuadre contra un tamaño de
        // 0 o incorrecto). Se recalcula el tamaño real y SOLO ENTONCES se
        // encuadra, en vez de hacerlo en el mismo instante en que se crea.
        const fitToStops = () => {
            map.invalidateSize();
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
        };
        const raf = requestAnimationFrame(fitToStops);
        const settleTimer = setTimeout(fitToStops, 300);

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(settleTimer);
            map.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={containerRef} style={{ pointerEvents: 'none' }} className={className} />;
};
