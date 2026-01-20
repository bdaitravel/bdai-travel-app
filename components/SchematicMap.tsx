
import React, { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';

const L = (window as any).L;

const STOP_TYPE_ICONS: Record<string, string> = {
    historical: 'fa-building-columns',
    food: 'fa-plate-wheat',
    art: 'fa-palette',
    culture: 'fa-masks-theater',
    nature: 'fa-tree',
    photo: 'fa-camera-retro',
    architecture: 'fa-archway'
};

const STOP_TYPE_HEX: Record<string, string> = {
    historical: '#F59E0B',
    food: '#10B981',
    art: '#6366F1',
    culture: '#3B82F6',
    nature: '#22C55E',
    photo: '#F43F5E',
    architecture: '#475569'
};

const TEXTS: any = {
    en: { guide: "Masterclass at", openInMaps: "GPS Nav" },
    es: { guide: "Masterclass en", openInMaps: "Ir con GPS" },
    ca: { guide: "Masterclass a", openInMaps: "GPS" },
    eu: { guide: "Masterclass-a", openInMaps: "GPS" },
    fr: { guide: "Masterclass à", openInMaps: "GPS" }
};

interface SchematicMapProps {
  stops: Stop[];
  currentStopIndex: number;
  userLocation?: { lat: number; lng: number } | null;
  language?: string;
  onStopSelect?: (index: number) => void;
  onPlayAudio?: (id: string, text: string) => void;
  audioPlayingId?: string | null;
  audioLoadingId?: string | null;
}

export const SchematicMap: React.FC<SchematicMapProps> = ({ 
    stops, 
    currentStopIndex, 
    userLocation, 
    language = 'es',
    onStopSelect,
    onPlayAudio,
    audioPlayingId,
    audioLoadingId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const navigationLineRef = useRef<any>(null);
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const tl = TEXTS[language] || TEXTS.es;

  const currentStop = stops[currentStopIndex];
  const isPlaying = audioPlayingId === currentStop?.id;
  const isLoading = audioLoadingId === currentStop?.id;

  useEffect(() => {
    if (!mapContainerRef.current || !L || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([0, 0], 16);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
    mapInstanceRef.current = map;
    map.on('dragstart', () => setIsAutoFollowing(false));
    return () => { if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (navigationLineRef.current) map.removeLayer(navigationLineRef.current);
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);

    const activeStop = stops[currentStopIndex];

    if (userLocation && activeStop) {
        navigationLineRef.current = L.polyline([
            [userLocation.lat, userLocation.lng],
            [activeStop.latitude, activeStop.longitude]
        ], {
            color: '#7c3aed',
            weight: 6,
            opacity: 0.8,
            dashArray: '12, 20',
            className: 'animate-pulse-line'
        }).addTo(map);
    }

    stops.forEach((stop, idx) => {
        const isActive = idx === currentStopIndex;
        const color = STOP_TYPE_HEX[stop.type] || '#7c3aed';
        const icon = STOP_TYPE_ICONS[stop.type] || 'fa-location-dot';
        
        // Estilo Crystal Pin
        const iconHtml = `
            <div class="relative flex flex-col items-center">
                ${isActive ? `<div class="absolute -inset-6 bg-purple-500 rounded-full animate-ping opacity-10"></div>` : ''}
                <div class="w-16 h-16 rounded-[2rem] flex items-center justify-center text-white transition-all duration-500 ${isActive ? 'scale-125 z-[5000] shadow-[0_20px_40px_rgba(0,0,0,0.5)]' : 'opacity-90 shadow-xl'}"
                     style="background: linear-gradient(135deg, ${color}, ${color}dd); 
                            border: 4px solid white; 
                            box-shadow: inset 0 0 15px rgba(255,255,255,0.4), 0 10px 20px rgba(0,0,0,0.3);">
                    <i class="fas ${icon}" style="font-size: 24px;"></i>
                </div>
                <div class="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-white mt-[-4px] ${isActive ? 'scale-125' : ''}"></div>
                ${stop.visited ? '<div class="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-[11px] text-white z-[5001] shadow-2xl"><i class="fas fa-check"></i></div>' : ''}
            </div>
        `;
        const marker = L.marker([stop.latitude, stop.longitude], { 
            icon: L.divIcon({ className: '', html: iconHtml, iconSize: [64, 80], iconAnchor: [32, 80] }) 
        }).addTo(map);
        marker.on('click', () => onStopSelect && onStopSelect(idx));
        markersRef.current.push(marker);
    });

    if (userLocation) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({
                className: '',
                html: `
                    <div class="relative flex items-center justify-center">
                        <div class="w-12 h-12 bg-blue-600 rounded-full border-4 border-white shadow-2xl z-20 flex items-center justify-center text-white">
                            <i class="fas fa-location-arrow text-base animate-pulse"></i>
                        </div>
                        <div class="absolute w-20 h-20 bg-blue-400/20 rounded-full animate-ping"></div>
                    </div>
                `,
                iconSize: [48, 48], iconAnchor: [24, 24]
            })
        }).addTo(map);
    }

    if (isAutoFollowing && activeStop) {
        if (userLocation) {
            const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng], [activeStop.latitude, activeStop.longitude]]);
            map.fitBounds(bounds, { padding: [120, 120], maxZoom: 17 });
        } else {
            map.setView([activeStop.latitude, activeStop.longitude], 17);
        }
    }
  }, [stops, currentStopIndex, userLocation, isAutoFollowing]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-100">
        <style>{`
            @keyframes dash { to { stroke-dashoffset: -60; } }
            .animate-pulse-line { animation: dash 1.5s linear infinite; }
        `}</style>
        <div ref={mapContainerRef} className="w-full h-full pointer-events-auto" />
        
        {currentStop && (
            <div className="absolute top-4 left-4 right-4 z-[450] flex flex-col gap-3 pointer-events-none">
                <div className="bg-slate-950/98 backdrop-blur-3xl border border-white/10 p-4 rounded-[2.5rem] shadow-2xl flex items-center gap-4 pointer-events-auto">
                    <button onClick={() => onPlayAudio?.(currentStop.id, currentStop.description)} className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isPlaying ? 'bg-red-600' : 'bg-purple-600'} text-white shadow-lg active:scale-90`}>
                        {isLoading ? <i className="fas fa-spinner fa-spin text-lg"></i> : isPlaying ? <i className="fas fa-stop text-lg"></i> : <i className="fas fa-play text-lg ml-1"></i>}
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{tl.guide}</p>
                        <h4 className="text-white font-black text-[13px] truncate uppercase tracking-tight">{currentStop.name}</h4>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}&travelmode=walking`, '_blank')} className="bg-blue-600 text-white h-14 px-5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
                            <i className="fas fa-location-arrow"></i> {tl.openInMaps}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
