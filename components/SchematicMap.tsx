
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
    es: { guide: "Ir a", openInMaps: "GPS", follow: "Seguir", stopFollow: "Libre", focus: "Fijar", dist: "a", error: "Coordenadas no válidas" },
    en: { guide: "Go to", openInMaps: "GPS", follow: "Follow", stopFollow: "Free", focus: "Fix", dist: "at", error: "Invalid Coordinates" }
};

export const SchematicMap: React.FC<any> = ({ stops, currentStopIndex, language = 'es', onStopSelect, userLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const geofenceCirclesRef = useRef<any[]>([]);
  
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const tl = TEXTS[language] || TEXTS.es;
  const currentStop = stops?.[currentStopIndex];

  // Verificación de si el tour tiene coordenadas válidas
  const hasValidCoords = stops && stops.length > 0 && stops.some((s: any) => s.latitude !== 0 && s.latitude !== undefined);

  useEffect(() => {
    if (!mapContainerRef.current || !L || mapInstanceRef.current) return;
    
    // Si no hay coordenadas válidas, centramos en una vista neutra (o Madrid por defecto)
    const initialCenter = hasValidCoords ? [stops[0].latitude, stops[0].longitude] : [40.4168, -3.7038];

    const map = L.map(mapContainerRef.current, { 
        zoomControl: false, 
        attributionControl: false, 
        tap: false,
        dragging: true,
        touchZoom: true,
        maxZoom: 19
    }).setView(initialCenter, 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);
    
    map.on('dragstart', () => setIsAutoFollowing(false));
    mapInstanceRef.current = map;
    
    return () => { if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L || !userLocation) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { 
        zIndexOffset: 1000,
        icon: L.divIcon({ 
            className: '', 
            html: `
                <div class="relative w-8 h-8 flex items-center justify-center">
                    <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30"></div>
                    <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg z-10"></div>
                </div>
            `, 
            iconSize: [32, 32], 
            iconAnchor: [16, 16] 
        }) 
    }).addTo(map);

    if (polylineRef.current) map.removeLayer(polylineRef.current);
    
    if (currentStop && currentStop.latitude !== 0) {
        polylineRef.current = L.polyline([
            [userLocation.lat, userLocation.lng], 
            [currentStop.latitude, currentStop.longitude]
        ], { 
            color: '#9333ea', 
            weight: 3, 
            dashArray: '5, 10', 
            opacity: 0.5,
            lineCap: 'round'
        }).addTo(map);

        if (isAutoFollowing) {
            const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng], [currentStop.latitude, currentStop.longitude]]);
            map.fitBounds(bounds, { padding: [100, 100], maxZoom: 17, animate: true });
        }
    }
  }, [userLocation, currentStop, isAutoFollowing]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L || !stops) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    geofenceCirclesRef.current.forEach(c => map.removeLayer(c));
    markersRef.current = [];
    geofenceCirclesRef.current = [];

    stops.forEach((stop: any, idx: number) => {
        if (stop.latitude === 0 || stop.latitude === undefined) return;
        
        const isActive = idx === currentStopIndex;
        
        const circle = L.circle([stop.latitude, stop.longitude], {
            radius: 50,
            color: isActive ? '#9333ea' : '#cbd5e1',
            fillColor: isActive ? '#a855f7' : '#f1f5f9',
            fillOpacity: isActive ? 0.1 : 0.05,
            weight: 1,
            dashArray: '5, 5'
        }).addTo(map);
        geofenceCirclesRef.current.push(circle);

        const marker = L.marker([stop.latitude, stop.longitude], { 
            icon: L.divIcon({ 
                className: '', 
                html: `
                    <div class="relative transition-all duration-300 ${isActive ? 'scale-110 z-50' : 'opacity-80'}">
                        <div class="w-10 h-10 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center text-[12px] font-black ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}">
                            <i class="fas ${STOP_ICONS[stop.type] || 'fa-location-dot'}"></i>
                        </div>
                        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 -z-10"></div>
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

    // Si acabamos de cargar y tenemos paradas, centramos el mapa en la primera
    if (markersRef.current.length > 0 && !userLocation) {
        map.setView([stops[0].latitude, stops[0].longitude], 15);
    }
  }, [stops, currentStopIndex]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
        {!hasValidCoords && (
            <div className="absolute inset-0 z-[500] bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                <i className="fas fa-satellite-dish text-white text-3xl mb-3 animate-pulse"></i>
                <p className="text-white font-black uppercase text-[10px] tracking-widest">{tl.error}</p>
                <p className="text-white/60 text-[8px] uppercase mt-2">Usa el Admin Panel para reparar el GPS Pro</p>
            </div>
        )}
        <div className="absolute right-4 bottom-28 z-[450] flex flex-col gap-3">
            <button onClick={() => setIsAutoFollowing(!isAutoFollowing)} className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all border-2 ${isAutoFollowing ? 'bg-purple-600 text-white border-purple-400' : 'bg-white text-slate-600 border-slate-100'}`}><i className={`fas ${isAutoFollowing ? 'fa-location-crosshairs' : 'fa-hand-pointer'} text-lg`}></i></button>
            <button onClick={() => { if (currentStop && currentStop.latitude !== 0) mapInstanceRef.current.flyTo([currentStop.latitude, currentStop.longitude], 18); setIsAutoFollowing(false); }} className="w-14 h-14 rounded-2xl bg-white text-slate-600 border-2 border-slate-100 shadow-2xl flex items-center justify-center"><i className="fas fa-bullseye text-lg"></i></button>
        </div>
    </div>
  );
};
