
import React, { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';

const L = (window as any).L;

const TEXTS: any = {
    en: { guide: "Walking to stop", recenter: "Recenter", openInMaps: "GPS Nav" },
    es: { guide: "Caminando a la parada", recenter: "Recentrar", openInMaps: "Ir con GPS" },
    ca: { guide: "Caminant a la parada", recenter: "Recentrar", openInMaps: "Anar amb GPS" },
    eu: { guide: "Geldialdirantz oinez", recenter: "Berriz zentratu", openInMaps: "GPSarekin joan" },
    fr: { guide: "Marche vers l'arrêt", recenter: "Recentrer", openInMaps: "Nav GPS" },
    de: { guide: "Weg zum Stopp", recenter: "Zentrieren", openInMaps: "Navi" },
    ja: { guide: "目的地へ徒歩", recenter: "中心に戻る", openInMaps: "地図で開く" },
    zh: { guide: "步行至站点", recenter: "重置中心", openInMaps: "导航" },
    ar: { guide: "المشي إلى المحطة", recenter: "توسيط", openInMaps: "توجيه" }
};

export const SchematicMap: React.FC<any> = ({ stops, currentStopIndex, language = 'es', onStopSelect, onPlayAudio, audioPlayingId, audioLoadingId }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const tl = TEXTS[language] || TEXTS.es;

  const currentStop = stops[currentStopIndex];
  const isPlaying = audioPlayingId === currentStop?.id;
  const isLoading = audioLoadingId === currentStop?.id;

  useEffect(() => {
    if (!mapContainerRef.current || !L || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false, tap: false }).setView([0, 0], 15);
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
    const validStops = stops.filter((s:any) => s.latitude && s.longitude);
    validStops.forEach((stop: any, idx: number) => {
        const isActive = idx === currentStopIndex;
        const iconHtml = `<div class="w-10 h-10 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-[11px] font-black ${isActive ? 'bg-purple-600 text-white scale-125 z-[5000]' : 'bg-slate-900 text-white opacity-50'}"><i class="fas fa-location-dot"></i></div>`;
        const marker = L.marker([stop.latitude, stop.longitude], { icon: L.divIcon({ className: '', html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 20] }) }).addTo(map);
        marker.on('click', () => onStopSelect?.(idx));
        markersRef.current.push(marker);
        if (isActive && isAutoFollowing) map.setView([stop.latitude, stop.longitude], 17);
    });
  }, [stops, currentStopIndex, isAutoFollowing]);

  return (
    <div className="w-full h-full relative overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full pointer-events-auto" />
        {currentStop && (
            <div className="absolute top-[env(safe-area-inset-top,20px)] left-0 right-0 z-[450] flex justify-center p-4 pointer-events-none">
                <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-[2rem] shadow-2xl flex items-center gap-3 pointer-events-auto w-full max-w-sm">
                    <button onClick={() => onPlayAudio?.(currentStop.id, currentStop.description)} className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPlaying ? 'bg-red-600' : 'bg-purple-600'} text-white`}>
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : isPlaying ? <i className="fas fa-stop"></i> : <i className="fas fa-play ml-0.5"></i>}
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-[7px] font-black text-purple-400 uppercase tracking-widest">{tl.guide}</p>
                        <h4 className="text-white font-black text-[10px] truncate uppercase leading-none">{currentStop.name}</h4>
                    </div>
                    <button onClick={() => { const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.latitude},${currentStop.longitude}&travelmode=walking`; window.open(url, '_blank'); }} className="bg-blue-600 text-white h-10 px-3 rounded-2xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                        <i className="fas fa-map-location-dot"></i> {tl.openInMaps}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
