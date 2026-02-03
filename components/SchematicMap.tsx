
import React, { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';

const L = (window as any).L;
const STOP_ICONS: Record<string, string> = { historical: 'fa-fingerprint', food: 'fa-utensils', art: 'fa-palette', nature: 'fa-leaf', photo: 'fa-camera', culture: 'fa-landmark', architecture: 'fa-archway' };
const TEXTS: any = {
    es: { guide: "Caminando a", openInMaps: "GPS", follow: "Seguir", stopFollow: "Libre", focus: "Centrar" },
    en: { guide: "Walking to", openInMaps: "GPS", follow: "Follow", stopFollow: "Free", focus: "Focus" }
};

export const SchematicMap: React.FC<any> = ({ stops, currentStopIndex, language = 'es', onStopSelect, onPlayAudio, audioPlayingId, audioLoadingId, userLocation }) => {
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

  // Actualización de Ubicación de Usuario y Línea de Ruta
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L || !userLocation) return;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { 
        icon: L.divIcon({ 
            className: '', 
            html: `
                <div class="relative w-8 h-8 flex items-center justify-center">
                    <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-40"></div>
                    <div class="absolute inset-2 bg-blue-600 rounded-full border-2 border-white shadow-xl"></div>
                    <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
                </div>
            `, 
            iconSize: [32, 32], 
            iconAnchor: [16, 16] 
        }) 
    }).addTo(map);

    if (polylineRef.current) map.removeLayer(polylineRef.current);
    if (currentStop) {
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
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, animate: true });
        }
    }
  }, [userLocation, currentStop, isAutoFollowing]);

  // Dibujado de Paradas y Geofencing Visual
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    geofenceCirclesRef.current.forEach(c => map.removeLayer(c));
    markersRef.current = [];
    geofenceCirclesRef.current = [];

    stops.forEach((stop: any, idx: number) => {
        const isActive = idx === currentStopIndex;
        
        // Círculo de proximidad (Geofence Visual)
        const circle = L.circle([stop.latitude, stop.longitude], {
            radius: 50,
            color: isActive ? '#9333ea' : '#475569',
            fillColor: isActive ? '#a855f7' : '#94a3b8',
            fillOpacity: isActive ? 0.2 : 0.05,
            weight: 1,
            dashArray: isActive ? '5, 5' : ''
        }).addTo(map);
        geofenceCirclesRef.current.push(circle);

        // Marcador de Parada
        const marker = L.marker([stop.latitude, stop.longitude], { 
            icon: L.divIcon({ 
                className: '', 
                html: `
                    <div class="relative group cursor-pointer transition-all duration-500 ${isActive ? 'scale-125 z-[5000]' : 'scale-100 opacity-70'}">
                        ${isActive ? '<div class="absolute -inset-2 bg-purple-500/20 rounded-full animate-pulse"></div>' : ''}
                        <div class="w-10 h-10 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center text-[12px] font-black ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}">
                            <i class="fas ${STOP_ICONS[stop.type] || 'fa-location-dot'}"></i>
                        </div>
                        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 -z-10 shadow-lg"></div>
                        <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[7px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 uppercase">
                            ${stop.name}
                        </div>
                    </div>
                `, 
                iconSize: [40, 40], 
                iconAnchor: [20, 20] 
            }) 
        }).addTo(map);

        marker.on('click', () => {
            onStopSelect?.(idx);
            setIsAutoFollowing(true);
        });
        markersRef.current.push(marker);
    });
  }, [stops, currentStopIndex]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Controles del Mapa */}
        <div className="absolute right-4 bottom-24 z-[450] flex flex-col gap-2">
            <button 
                onClick={() => setIsAutoFollowing(!isAutoFollowing)}
                className={`w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all border ${isAutoFollowing ? 'bg-purple-600 text-white border-purple-500' : 'bg-white text-slate-600 border-slate-200'}`}
            >
                <i className={`fas ${isAutoFollowing ? 'fa-location-crosshairs' : 'fa-hand-pointer'} text-sm`}></i>
            </button>
            <button 
                onClick={() => {
                    if (currentStop) mapInstanceRef.current.setView([currentStop.latitude, currentStop.longitude], 17);
                    setIsAutoFollowing(false);
                }}
                className="w-12 h-12 rounded-2xl bg-white text-slate-600 border border-slate-200 shadow-2xl flex items-center justify-center active:bg-slate-50"
            >
                <i className="fas fa-bullseye text-sm"></i>
            </button>
        </div>

        {currentStop && (
            <div className="absolute top-4 left-0 right-0 z-[450] px-4 pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-[2.5rem] shadow-2xl flex items-center gap-4 pointer-events-auto max-w-md mx-auto">
                    <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-black text-purple-400 uppercase tracking-[0.3em] mb-1">{tl.guide} {currentStopIndex + 1}</p>
                        <h4 className="text-white font-black text-[11px] truncate uppercase leading-none">{currentStop.name}</h4>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}&travelmode=walking`, '_blank')} 
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center text-xs"
                        >
                            <i className="fas fa-map-location-dot"></i>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
