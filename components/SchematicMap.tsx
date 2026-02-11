
import React, { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';

const L = (window as any).L;
const STOP_ICONS: Record<string, string> = { 
    historical: 'fa-fingerprint', 
    food: 'fa-utensils', 
    art: 'fa-palette', 
    nature: 'fa-leaf', 
    photo: 'fa-camera', 
    culture: 'fa-landmark', 
    architecture: 'fa-archway' 
};

const TEXTS: any = {
    es: { guide: "Ir a", openInMaps: "GPS", follow: "Seguir", stopFollow: "Libre", focus: "Fijar", dist: "a" },
    en: { guide: "Go to", openInMaps: "GPS", follow: "Follow", stopFollow: "Free", focus: "Fix", dist: "at" }
};

export const SchematicMap: React.FC<any> = ({ stops, currentStopIndex, language = 'es', onStopSelect, userLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const fullPathRef = useRef<any>(null);
  const activeLineRef = useRef<any>(null);
  const geofenceCirclesRef = useRef<any[]>([]);
  
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const tl = TEXTS[language] || TEXTS.es;
  
  // Validar paradas antes de usarlas
  const validStops = (stops || []).filter((s: Stop) => s.latitude !== 0 && s.longitude !== 0 && typeof s.latitude === 'number');
  const currentStop = validStops[currentStopIndex] || validStops[0];

  useEffect(() => {
    if (!mapContainerRef.current || !L || mapInstanceRef.current) return;
    
    const map = L.map(mapContainerRef.current, { 
        zoomControl: false, 
        attributionControl: false, 
        tap: false,
        dragging: true,
        touchZoom: true,
        maxZoom: 19
    }).setView([0, 0], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);
    
    map.on('dragstart', () => setIsAutoFollowing(false));
    mapInstanceRef.current = map;
    
    return () => { 
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Actualizar ubicación del usuario
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L || !userLocation) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    
    if (typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { 
            zIndexOffset: 1000,
            icon: L.divIcon({ 
                className: '', 
                html: `
                    <div class="relative w-8 h-8 flex items-center justify-center">
                        <div class="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-30"></div>
                        <div class="w-4 h-4 bg-purple-400 rounded-full border-2 border-white shadow-lg z-10"></div>
                    </div>
                `, 
                iconSize: [32, 32], 
                iconAnchor: [16, 16] 
            }) 
        }).addTo(map);

        if (activeLineRef.current) map.removeLayer(activeLineRef.current);
        
        if (currentStop) {
            activeLineRef.current = L.polyline([
                [userLocation.lat, userLocation.lng], 
                [currentStop.latitude, currentStop.longitude]
            ], { 
                color: '#a855f7', 
                weight: 4, 
                dashArray: '8, 12', 
                opacity: 0.8,
                lineCap: 'round'
            }).addTo(map);

            if (isAutoFollowing) {
                const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng], [currentStop.latitude, currentStop.longitude]]);
                map.fitBounds(bounds, { padding: [100, 100], maxZoom: 17, animate: true });
            }
        }
    }
  }, [userLocation, currentStop, isAutoFollowing]);

  // Renderizar paradas y ruta
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    // Limpieza
    markersRef.current.forEach(m => map.removeLayer(m));
    geofenceCirclesRef.current.forEach(c => map.removeLayer(c));
    if (fullPathRef.current) map.removeLayer(fullPathRef.current);

    markersRef.current = [];
    geofenceCirclesRef.current = [];

    if (validStops.length > 0) {
        const routeCoordinates = validStops.map((s: any) => [s.latitude, s.longitude]);
        fullPathRef.current = L.polyline(routeCoordinates, {
            color: 'white',
            weight: 2,
            opacity: 0.2,
            dashArray: '1, 10'
        }).addTo(map);

        validStops.forEach((stop: any, idx: number) => {
            const isActive = idx === currentStopIndex;
            
            const circle = L.circle([stop.latitude, stop.longitude], {
                radius: 50,
                color: isActive ? '#9333ea' : '#334155',
                fillColor: isActive ? '#a855f7' : '#1e293b',
                fillOpacity: isActive ? 0.2 : 0.05,
                weight: 1,
                dashArray: '5, 5'
            }).addTo(map);
            geofenceCirclesRef.current.push(circle);

            const marker = L.marker([stop.latitude, stop.longitude], { 
                icon: L.divIcon({ 
                    className: '', 
                    html: `
                        <div class="relative transition-all duration-300 ${isActive ? 'scale-125 z-50' : 'opacity-80'}">
                            <div class="w-10 h-10 rounded-2xl border-2 border-slate-800 shadow-2xl flex items-center justify-center text-[12px] font-black ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-500'}">
                                <i class="fas ${STOP_ICONS[stop.type] || 'fa-location-dot'}"></i>
                            </div>
                            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 ${isActive ? 'bg-purple-600' : 'bg-slate-900'} rotate-45 -z-10"></div>
                        </div>
                    `, 
                    iconSize: [40, 40], 
                    iconAnchor: [20, 40]
                }) 
            }).addTo(map);

            marker.on('click', () => {
                onStopSelect?.(idx);
                setIsAutoFollowing(true);
            });
            
            markersRef.current.push(marker);
        });

        // IMPORTANTE: Ajustar zoom para ver TODAS las paradas
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.2));
    }
  }, [stops, currentStopIndex]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute right-4 bottom-28 z-[450] flex flex-col gap-3">
            <button onClick={() => setIsAutoFollowing(!isAutoFollowing)} className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all border-2 ${isAutoFollowing ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-white/10'}`}><i className={`fas ${isAutoFollowing ? 'fa-location-crosshairs' : 'fa-hand-pointer'} text-lg`}></i></button>
            <button onClick={() => { if (currentStop) mapInstanceRef.current.flyTo([currentStop.latitude, currentStop.longitude], 18); setIsAutoFollowing(false); }} className="w-14 h-14 rounded-2xl bg-slate-900 text-slate-400 border-2 border-white/10 shadow-2xl flex items-center justify-center"><i className="fas fa-bullseye text-lg"></i></button>
        </div>
    </div>
  );
};
