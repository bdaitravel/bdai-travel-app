
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
  const polylineRef = useRef<any>(null);
  const geofenceCirclesRef = useRef<any[]>([]);
  
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const tl = TEXTS[language] || TEXTS.es;
  const currentStop = stops[currentStopIndex];

  // Inicialización del Mapa
  useEffect(() => {
    if (!mapContainerRef.current || !L || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, { 
        zoomControl: false, 
        attributionControl: false, 
        tap: false,
        dragging: true,
        touchZoom: true
    }).setView([0, 0], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
    
    map.on('dragstart', () => setIsAutoFollowing(false));
    mapInstanceRef.current = map;
    
    return () => { if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
  }, []);

  // Sincronización de Ubicación del Usuario
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L || !userLocation) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { 
        zIndexOffset: 1000,
        icon: L.divIcon({ 
            className: '', 
            html: `
                <div class="relative w-10 h-10 flex items-center justify-center">
                    <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                    <div class="absolute inset-2 bg-blue-600 rounded-full border-2 border-white shadow-2xl z-10"></div>
                    <div class="absolute -top-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-blue-600"></div>
                </div>
            `, 
            iconSize: [40, 40], 
            iconAnchor: [20, 20] 
        }) 
    }).addTo(map);

    if (polylineRef.current) map.removeLayer(polylineRef.current);
    
    if (currentStop) {
        polylineRef.current = L.polyline([
            [userLocation.lat, userLocation.lng], 
            [currentStop.latitude, currentStop.longitude]
        ], { 
            color: '#9333ea', 
            weight: 4, 
            dashArray: '1, 12', 
            opacity: 0.6,
            lineCap: 'round',
            smoothFactor: 2
        }).addTo(map);

        if (isAutoFollowing) {
            const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng], [currentStop.latitude, currentStop.longitude]]);
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17, animate: true });
        }
    }
  }, [userLocation, currentStop, isAutoFollowing]);

  // Actualización de Capas de Paradas e Interactividad
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    geofenceCirclesRef.current.forEach(c => map.removeLayer(c));
    markersRef.current = [];
    geofenceCirclesRef.current = [];

    stops.forEach((stop: any, idx: number) => {
        const isActive = idx === currentStopIndex;
        
        const circle = L.circle([stop.latitude, stop.longitude], {
            radius: 40,
            color: isActive ? '#9333ea' : '#cbd5e1',
            fillColor: isActive ? '#a855f7' : '#f1f5f9',
            fillOpacity: isActive ? 0.25 : 0.1,
            weight: 2,
            dashArray: isActive ? '' : '5, 5'
        }).addTo(map);
        geofenceCirclesRef.current.push(circle);

        const marker = L.marker([stop.latitude, stop.longitude], { 
            icon: L.divIcon({ 
                className: '', 
                html: `
                    <div class="relative group cursor-pointer transition-all duration-300 ${isActive ? 'scale-110' : 'hover:scale-110 opacity-80'}">
                        ${isActive ? '<div class="absolute -inset-3 bg-purple-500/30 rounded-full animate-pulse"></div>' : ''}
                        <div class="w-12 h-12 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center text-[14px] font-black ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}">
                            <i class="fas ${STOP_ICONS[stop.type] || 'fa-location-dot'}"></i>
                        </div>
                        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 -z-10 shadow-lg"></div>
                        <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-[8px] px-3 py-1 rounded-full font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 uppercase tracking-widest shadow-xl">
                            ${stop.name}
                        </div>
                    </div>
                `, 
                iconSize: [48, 48], 
                iconAnchor: [24, 24] 
            }) 
        }).addTo(map);

        marker.on('click', () => {
            onStopSelect?.(idx);
            setIsAutoFollowing(true);
            map.flyTo([stop.latitude, stop.longitude], 17, { duration: 1 });
        });
        
        markersRef.current.push(marker);
    });
  }, [stops, currentStopIndex]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-200">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        <div className="absolute right-4 bottom-28 z-[450] flex flex-col gap-3">
            <button 
                onClick={() => setIsAutoFollowing(!isAutoFollowing)}
                className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all border-2 ${isAutoFollowing ? 'bg-purple-600 text-white border-purple-400' : 'bg-white text-slate-600 border-slate-100'}`}
            >
                <i className={`fas ${isAutoFollowing ? 'fa-location-crosshairs' : 'fa-hand-pointer'} text-lg`}></i>
            </button>
            <button 
                onClick={() => {
                    if (currentStop) mapInstanceRef.current.flyTo([currentStop.latitude, currentStop.longitude], 17);
                    setIsAutoFollowing(false);
                }}
                className="w-14 h-14 rounded-2xl bg-white text-slate-600 border-2 border-slate-100 shadow-2xl flex items-center justify-center active:scale-95 transition-all"
            >
                <i className="fas fa-bullseye text-lg"></i>
            </button>
        </div>

        {currentStop && (
            <div className="absolute top-4 left-0 right-0 z-[450] px-4 pointer-events-none">
                <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/10 p-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 pointer-events-auto max-w-sm mx-auto animate-fade-in">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-500 shrink-0">
                        <i className={`fas ${STOP_ICONS[currentStop.type] || 'fa-location-dot'}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.3em] leading-none mb-1">{tl.guide} • {currentStopIndex + 1}</p>
                        <h4 className="text-white font-black text-[12px] truncate uppercase tracking-tight">{currentStop.name}</h4>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}&travelmode=walking`, '_blank')} 
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center active:bg-white/10 transition-colors"
                        >
                            <i className="fas fa-map-location-dot text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
