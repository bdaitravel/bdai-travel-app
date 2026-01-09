
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
  onSkipAudio?: (seconds: number) => void;
  audioPlayingId?: string | null;
  audioLoadingId?: string | null;
  language?: string;
}

export const SchematicMap: React.FC<SchematicMapProps> = ({ 
    stops, 
    currentStopIndex, 
    userLocation, 
    onPlayAudio, 
    onSkipAudio,
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
      // Detectar si es iOS para usar Apple Maps o Google Maps por defecto
      const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}&travelmode=walking`;
      window.open(url, '_blank');
  };

  useEffect(() => {
    if (!mapContainerRef.current || !L || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
    }).setView([0, 0], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
    }).addTo(map);

    mapInstanceRef.current = map;
    map.on('dragstart', () => setIsAutoFollowing(false));

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
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

    // 1. Ruta completa (estática)
    const allCoords = validStops.map(s => [s.latitude, s.longitude]);
    mainRouteLineRef.current = L.polyline(allCoords, {
        color: '#94a3b8', weight: 4, opacity: 0.2, dashArray: '10, 15'
    }).addTo(map);

    // 2. Línea de Navegación "Andante" (Animada)
    if (userLocation && activeStop) {
        navigationLineRef.current = L.polyline([
            [userLocation.lat, userLocation.lng],
            [activeStop.latitude, activeStop.longitude]
        ], {
            color: '#7c3aed', weight: 6, opacity: 0.8, dashArray: '1, 15', lineCap: 'round', className: 'nav-line-walking'
        }).addTo(map);

        if (isAutoFollowing) {
            const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng], [activeStop.latitude, activeStop.longitude]]);
            map.fitBounds(bounds, { padding: [100, 100], maxZoom: 18 });
        }
    }

    // 3. Marcadores
    validStops.forEach((stop, idx) => {
        const isActive = idx === currentStopIndex;
        const isPlaying = audioPlayingId === stop.id;
        const isLoading = audioLoadingId === stop.id;
        const typeIcon = STOP_TYPE_ICONS[stop.type] || 'fa-location-dot';
        
        const iconHtml = `
            <div class="relative flex items-center justify-center">
                <div class="w-10 h-10 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-[11px] font-black transition-all
                    ${isActive ? 'bg-purple-600 text-white scale-125 z-[500] shadow-purple-500/50 ring-4 ring-purple-600/20' : 'bg-slate-900 text-white opacity-40'}
                    ${isPlaying ? 'animate-pulse' : ''}
                ">
                    <i class="fas ${typeIcon}"></i>
                </div>
            </div>
        `;
        const marker = L.marker([stop.latitude, stop.longitude], { 
            icon: L.divIcon({ className: '', html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 20] }) 
        }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.className = 'p-4 flex flex-col items-center gap-3 min-w-[210px]';
        popupContent.innerHTML = `
            <h5 class="font-black text-[12px] uppercase text-slate-900 text-center leading-tight mb-2">${stop.name}</h5>
            <div class="flex items-center justify-center gap-3">
                <button id="p-back-${stop.id}" class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center active:bg-slate-200"><i class="fas fa-rotate-left"></i></button>
                <button id="p-play-${stop.id}" class="w-14 h-14 rounded-2xl ${isPlaying ? 'bg-red-600' : 'bg-purple-600'} text-white flex items-center justify-center shadow-lg">
                    <i class="fas ${isLoading ? 'fa-spinner fa-spin' : isPlaying ? 'fa-stop' : 'fa-play'}"></i>
                </button>
                <button id="p-forward-${stop.id}" class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center active:bg-slate-200"><i class="fas fa-rotate-right"></i></button>
            </div>
        `;

        marker.bindPopup(popupContent, { closeButton: false, offset: [0, -10] });
        marker.on('popupopen', () => {
            document.getElementById(`p-play-${stop.id}`)?.addEventListener('click', () => onPlayAudio?.(stop.id, stop.description));
            document.getElementById(`p-back-${stop.id}`)?.addEventListener('click', () => onSkipAudio?.(-10));
            document.getElementById(`p-forward-${stop.id}`)?.addEventListener('click', () => onSkipAudio?.(10));
        });

        markersRef.current.push(marker);
    });

    if (userLocation) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
                className: '',
                html: '<div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-2xl relative"><div class="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-50"></div><div class="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-blue-600"></div></div>',
                iconSize: [32, 32], iconAnchor: [16, 16]
            }),
            zIndexOffset: 1000
        }).addTo(map);
    }

  }, [stops, currentStopIndex, userLocation, isAutoFollowing, audioPlayingId, audioLoadingId]);

  const currentStop = stops[currentStopIndex];
  const isPlayingActive = audioPlayingId === currentStop?.id;
  const isLoadingActive = audioLoadingId === currentStop?.id;

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-200">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Panel Superior de Navegación Refinado */}
        {userLocation && currentStop && (
            <div className="absolute top-6 left-4 right-4 z-[450] pointer-events-none">
                <div className="bg-slate-900/98 backdrop-blur-3xl border border-white/10 p-4 rounded-[2.5rem] shadow-2xl flex flex-col gap-4 animate-slide-up">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                            <i className={`fas ${STOP_TYPE_ICONS[currentStop.type] || 'fa-location-arrow'}`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-black text-purple-400 uppercase tracking-[0.2em] mb-0.5">{tl.guide}</p>
                            <h4 className="text-white font-black text-xs truncate uppercase tracking-tighter">{currentStop.name}</h4>
                        </div>
                        
                        {/* Botón de Google Maps para no perderse nunca */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); openInExternalMaps(); }}
                            className="bg-blue-600 text-white h-11 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest pointer-events-auto active:scale-90 transition-all flex items-center gap-2 shadow-xl shadow-blue-900/40"
                        >
                            <i className="fas fa-map-location-dot text-xs"></i>
                            {tl.openInMaps}
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        {/* Mandos de Audio integrados */}
                        <div className="flex items-center gap-1.5">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSkipAudio?.(-10); }}
                                className="w-9 h-9 rounded-xl bg-white/5 text-white/50 flex items-center justify-center active:scale-90 pointer-events-auto"
                            >
                                <i className="fas fa-rotate-left text-[11px]"></i>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onPlayAudio?.(currentStop.id, currentStop.description); }}
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 pointer-events-auto transition-all ${isPlayingActive ? 'bg-red-600' : 'bg-white text-slate-950'}`}
                            >
                                {isLoadingActive ? <i className="fas fa-spinner fa-spin text-xs"></i> : isPlayingActive ? <i className="fas fa-stop text-xs"></i> : <i className="fas fa-play text-xs translate-x-0.5"></i>}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSkipAudio?.(10); }}
                                className="w-9 h-9 rounded-xl bg-white/5 text-white/50 flex items-center justify-center active:scale-90 pointer-events-auto"
                            >
                                <i className="fas fa-rotate-right text-[11px]"></i>
                            </button>
                        </div>

                        {!isAutoFollowing && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsAutoFollowing(true); }}
                                className="bg-white/10 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest pointer-events-auto active:scale-95 transition-all"
                            >
                                {tl.recenter}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        <style>{`
            .nav-line-walking { 
                animation: walking-dash 20s linear infinite; 
                stroke-linecap: round;
                filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.4));
            }
            @keyframes walking-dash {
                to { stroke-dashoffset: -500; }
            }
            .leaflet-popup-content-wrapper { border-radius: 2rem; padding: 4px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.05); }
        `}</style>
    </div>
  );
};
