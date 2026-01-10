
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
  onPlayAudio?: (id: string, text: string) => void;
  audioPlayingId?: string | null;
  audioLoadingId?: string | null;
  language?: string;
}

export const SchematicMap: React.FC<SchematicMapProps> = ({ 
    stops, 
    currentStopIndex, 
    userLocation, 
    onPlayAudio, 
    audioPlayingId,
    audioLoadingId,
    language = 'es'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const mainRouteLineRef = useRef<any>(null);
  const navigationLineRef = useRef<any>(null);
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const tl = TEXTS[language] || TEXTS.es;

  const openInExternalMaps = () => {
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
        tap: false // Desactivar tap nativo de Leaflet para mejorar compatibilidad con gestos de Safari
    }).setView([0, 0], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
    }).addTo(map);

    mapInstanceRef.current = map;
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
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 18 });
        }
    }

    validStops.forEach((stop, idx) => {
        const isActive = idx === currentStopIndex;
        const typeIcon = STOP_TYPE_ICONS[stop.type] || 'fa-location-dot';
        const iconHtml = `
            <div class="relative flex items-center justify-center pointer-events-auto">
                <div class="w-10 h-10 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-[11px] font-black
                    ${isActive ? 'bg-purple-600 text-white scale-125 z-[500] ring-4 ring-purple-600/20' : 'bg-slate-900 text-white opacity-40'}
                ">
                    <i class="fas ${typeIcon}"></i>
                </div>
            </div>
        `;
        const marker = L.marker([stop.latitude, stop.longitude], { 
            icon: L.divIcon({ className: '', html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 20] }) 
        }).addTo(map);
        markersRef.current.push(marker);
    });

    if (userLocation) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
                className: '',
                html: '<div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-2xl relative"><div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-50"></div></div>',
                iconSize: [32, 32], iconAnchor: [16, 16]
            }),
            zIndexOffset: 1000
        }).addTo(map);
    }
  }, [stops, currentStopIndex, userLocation, isAutoFollowing]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-200 pointer-events-auto">
        <div ref={mapContainerRef} className="w-full h-full pointer-events-auto" />
        {userLocation && stops[currentStopIndex] && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[450] w-[90%] pointer-events-none">
                <div className="bg-slate-900/98 backdrop-blur-3xl border border-white/10 p-3 rounded-3xl shadow-2xl flex items-center gap-4 pointer-events-auto">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shrink-0">
                        <i className={`fas ${STOP_TYPE_ICONS[stops[currentStopIndex].type] || 'fa-location-arrow'}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-black text-purple-400 uppercase mb-0.5">{tl.guide}</p>
                        <h4 className="text-white font-black text-[10px] truncate uppercase">{stops[currentStopIndex].name}</h4>
                    </div>
                    <button onClick={openInExternalMaps} className="bg-blue-600 text-white h-10 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                        <i className="fas fa-map-location-dot"></i> {tl.openInMaps}
                    </button>
                    {!isAutoFollowing && (
                        <button onClick={() => setIsAutoFollowing(true)} className="bg-white/10 text-white w-10 h-10 rounded-xl flex items-center justify-center"><i className="fas fa-crosshairs"></i></button>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
