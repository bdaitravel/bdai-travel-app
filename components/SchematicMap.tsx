
import React, { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';

const L = (window as any).L;

const STOP_TYPE_ICONS: Record<string, string> = {
    historical: 'fa-landmark',
    food: 'fa-utensils',
    art: 'fa-palette',
    nature: 'fa-leaf',
    photo: 'fa-camera',
    culture: 'fa-users',
    architecture: 'fa-archway'
};

const TEXTS: any = {
    en: { guide: "Walking to stop", recenter: "Recenter", openInMaps: "GPS Nav" },
    es: { guide: "Caminando a la parada", recenter: "Recentrar", openInMaps: "Ir con GPS" },
    ca: { guide: "Caminant a la parada", recenter: "Recentrar", openInMaps: "Anar amb GPS" },
    eu: { guide: "Geldialdirantz oinez", recenter: "Berriz zentratu", openInMaps: "GPSarekin joan" },
    fr: { guide: "Marche vers l'arrêt", recenter: "Recentrer", openInMaps: "Nav GPS" }
};

interface SchematicMapProps {
  stops: Stop[];
  currentStopIndex: number;
  userLocation?: { lat: number; lng: number } | null;
  language?: string;
  onStopSelect?: (index: number) => void;
}

export const SchematicMap: React.FC<SchematicMapProps> = ({ 
    stops, 
    currentStopIndex, 
    userLocation, 
    language = 'es',
    onStopSelect
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const mainRouteLineRef = useRef<any>(null);
  const navigationLineRef = useRef<any>(null);
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const tl = TEXTS[language] || TEXTS.es;

  const openInExternalMaps = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const stop = stops[currentStopIndex];
      if (!stop) return;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}&travelmode=walking`;
      window.open(url, '_blank');
  };

  useEffect(() => {
    if (!mapContainerRef.current || !L || mapInstanceRef.current) return;
    
    const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        tap: false
    }).setView([0, 0], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
    }).addTo(map);

    mapInstanceRef.current = map;
    
    setTimeout(() => { map.invalidateSize(); }, 300);

    map.on('dragstart', () => setIsAutoFollowing(false));
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (mainRouteLineRef.current) map.removeLayer(mainRouteLineRef.current);
    if (navigationLineRef.current) map.removeLayer(navigationLineRef.current);
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);

    const validStops = stops.filter(s => s.latitude && s.longitude);
    const activeStop = stops[currentStopIndex];

    const allCoords = validStops.map(s => [s.latitude, s.longitude]);
    mainRouteLineRef.current = L.polyline(allCoords, {
        color: '#94a3b8', weight: 4, opacity: 0.2, dashArray: '10, 15'
    }).addTo(map);

    if (userLocation && activeStop) {
        navigationLineRef.current = L.polyline([
            [userLocation.lat, userLocation.lng],
            [activeStop.latitude, activeStop.longitude]
        ], {
            color: '#7c3aed', weight: 6, opacity: 0.8, dashArray: '1, 15', lineCap: 'round'
        }).addTo(map);
        if (isAutoFollowing) {
            const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng], [activeStop.latitude, activeStop.longitude]]);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
        }
    }

    validStops.forEach((stop, idx) => {
        const isActive = idx === currentStopIndex;
        const typeIcon = STOP_TYPE_ICONS[stop.type] || 'fa-location-dot';
        const iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
                <div class="w-10 h-10 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-[11px] font-black
                    ${isActive ? 'bg-purple-600 text-white scale-125 z-[5000]' : 'bg-slate-900 text-white opacity-50'}
                ">
                    <i class="fas ${typeIcon}"></i>
                </div>
            </div>
        `;
        const marker = L.marker([stop.latitude, stop.longitude], { 
            icon: L.divIcon({ className: '', html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 20] }) 
        }).addTo(map);

        marker.on('click', () => {
            if (onStopSelect) onStopSelect(idx);
        });

        markersRef.current.push(marker);
    });

    if (userLocation) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
                className: '',
                html: '<div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-xl"></div>',
                iconSize: [32, 32], iconAnchor: [16, 16]
            })
        }).addTo(map);
    }
  }, [stops, currentStopIndex, userLocation, isAutoFollowing]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-200">
        <div ref={mapContainerRef} className="w-full h-full pointer-events-auto" />
        
        {/* Capa de Control GPS - Siempre arriba del mapa */}
        {userLocation && stops[currentStopIndex] && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[450] w-[90%] pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white shrink-0">
                        <i className={`fas ${STOP_TYPE_ICONS[stops[currentStopIndex].type] || 'fa-location-arrow'} text-xs`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-black text-purple-400 uppercase mb-0.5">{tl.guide}</p>
                        <h4 className="text-white font-black text-[10px] truncate uppercase">{stops[currentStopIndex].name}</h4>
                    </div>
                    <button 
                        onClick={openInExternalMaps} 
                        className="bg-blue-600 text-white h-8 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                    >
                        <i className="fas fa-map-location-dot"></i> {tl.openInMaps}
                    </button>
                    {!isAutoFollowing && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsAutoFollowing(true); }} 
                            className="bg-white/10 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                        >
                            <i className="fas fa-crosshairs text-xs"></i>
                        </button>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
