import React, { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';

const L = (window as any).L;
const STOP_CONFIG: Record<string, { icon: string, color: string }> = { 
    historical: { icon: 'fa-landmark', color: '#FF3B30' }, 
    history: { icon: 'fa-landmark', color: '#FF3B30' },
    monument: { icon: 'fa-monument', color: '#FF3B30' },
    food: { icon: 'fa-utensils', color: '#FF9500' }, 
    gastronomy: { icon: 'fa-utensils', color: '#FF9500' },
    restaurant: { icon: 'fa-utensils', color: '#FF9500' },
    art: { icon: 'fa-palette', color: '#FF2D55' },
    museum: { icon: 'fa-building-columns', color: '#FF2D55' },
    nature: { icon: 'fa-leaf', color: '#34C759' }, 
    parks: { icon: 'fa-leaf', color: '#34C759' },
    garden: { icon: 'fa-leaf', color: '#34C759' },
    photo: { icon: 'fa-camera', color: '#007AFF' }, 
    culture: { icon: 'fa-masks-theater', color: '#AF52DE' },
    theater: { icon: 'fa-masks-theater', color: '#AF52DE' },
    architecture: { icon: 'fa-archway', color: '#5856D6' },
    religious: { icon: 'fa-church', color: '#5856D6' },
    church: { icon: 'fa-church', color: '#5856D6' }
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
  
  // FIX 1 + FIX 3: parsear coordenadas (comas→puntos) y preservar índice original
  const validStops = (stops || []).map((s: any, originalIndex: number) => {
    const lat = typeof s.latitude === 'string' ? parseFloat(s.latitude.replace(',', '.')) : s.latitude;
    const lng = typeof s.longitude === 'string' ? parseFloat(s.longitude.replace(',', '.')) : s.longitude;
    return {
      ...s,
      latitude: lat,
      longitude: lng,
      originalIndex,
      isValid: !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
    };
  });

  const currentStop = validStops[currentStopIndex]?.isValid 
    ? validStops[currentStopIndex] 
    : validStops.find((s: any) => s.isValid);

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
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);
    
    map.on('dragstart', () => setIsAutoFollowing(false));
    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
        }
    });
    resizeObserver.observe(mapContainerRef.current);
    
    return () => { 
        resizeObserver.disconnect();
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Actualizar ubicación del usuario y seguimiento
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    if (userLocation) {
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
        
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { 
            zIndexOffset: 1000,
            icon: L.divIcon({ 
                className: '', 
                html: `
                    <div class="relative w-10 h-10 flex items-center justify-center">
                        <div class="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-40"></div>
                        <div class="w-6 h-6 bg-purple-600 rounded-full border-4 border-white shadow-2xl z-10 flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                    </div>
                `, 
                iconSize: [40, 40], 
                iconAnchor: [20, 20] 
            }) 
        }).addTo(map);

        if (activeLineRef.current) map.removeLayer(activeLineRef.current);
        
        if (currentStop) {
            const dist = map.distance([userLocation.lat, userLocation.lng], [currentStop.latitude, currentStop.longitude]);
            if (dist < 50000) {
                activeLineRef.current = L.polyline([
                    [userLocation.lat, userLocation.lng], 
                    [currentStop.latitude, currentStop.longitude]
                ], { 
                    color: '#9333ea', 
                    weight: 5, 
                    dashArray: '10, 15', 
                    opacity: 0.9,
                    lineCap: 'round'
                }).addTo(map);
            }
        }
    }

    if (isAutoFollowing && currentStop) {
        if (userLocation) {
            const dist = map.distance([userLocation.lat, userLocation.lng], [currentStop.latitude, currentStop.longitude]);
            if (dist < 50000) {
                const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng], [currentStop.latitude, currentStop.longitude]]);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, animate: true });
            } else {
                map.flyTo([currentStop.latitude, currentStop.longitude], 16, { animate: true });
            }
        } else {
            map.flyTo([currentStop.latitude, currentStop.longitude], 16, { animate: true });
        }
    }
  }, [userLocation, currentStop, isAutoFollowing]);

  // Renderizar paradas y ruta
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    geofenceCirclesRef.current.forEach(c => map.removeLayer(c));
    if (fullPathRef.current) map.removeLayer(fullPathRef.current);

    markersRef.current = [];
    geofenceCirclesRef.current = [];

    const activeStops = validStops.filter((s: any) => s.isValid);

    if (activeStops.length > 0) {
        const routeCoordinates = activeStops.map((s: any) => [s.latitude, s.longitude]);
        fullPathRef.current = L.polyline(routeCoordinates, {
            color: 'white',
            weight: 2,
            opacity: 0.2,
            dashArray: '1, 10'
        }).addTo(map);

        // FIX 3: iterar sobre TODOS los stops (incluso inválidos) pero solo renderizar los válidos
        // así los índices de marcadores coinciden siempre con los índices de la UI
        validStops.forEach((stop: any, idx: number) => {
            if (!stop.isValid) {
                markersRef.current.push(null); // placeholder para mantener índice
                geofenceCirclesRef.current.push(null);
                return;
            }

            const isActive = idx === currentStopIndex;
            const stopType = (stop.type || 'architecture').toLowerCase();
            const config = STOP_CONFIG[stopType] || STOP_CONFIG['architecture'] || { icon: 'fa-location-dot', color: '#9333ea' };
            
            const circle = L.circle([stop.latitude, stop.longitude], {
                radius: 50,
                color: isActive ? config.color : '#334155',
                fillColor: isActive ? config.color : '#1e293b',
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
                            <div class="w-10 h-10 rounded-2xl border-2 border-slate-800 shadow-2xl flex items-center justify-center text-[12px] font-black" style="background-color: ${isActive ? config.color : '#0f172a'}; color: ${isActive ? 'white' : config.color}">
                                <i class="fas ${config.icon}"></i>
                            </div>
                            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 -z-10" style="background-color: ${isActive ? config.color : '#0f172a'}"></div>
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
    }
  }, [stops, currentStopIndex]);

  // FIX 2: maxZoom: 16 al ajustar vista inicial — evita zoom extremo en pueblos pequeños
  useEffect(() => {
    const map = mapInstanceRef.current;
    const activeStops = validStops.filter((s: any) => s.isValid);
    if (!map || !L || activeStops.length === 0) return;
    
    const group = L.featureGroup(markersRef.current.filter(Boolean));
    if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 16 });
    }
  }, [stops]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L || !currentStop) return;
    
    if (!isAutoFollowing) {
        map.flyTo([currentStop.latitude, currentStop.longitude], 16, { animate: true });
    }
  }, [currentStopIndex]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute right-4 bottom-28 z-[450] flex flex-col gap-3">
            <button 
                onClick={() => setIsAutoFollowing(!isAutoFollowing)} 
                className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all border-2 ${isAutoFollowing ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-white/10'}`}
            >
                <i className={`fas ${isAutoFollowing ? 'fa-location-crosshairs' : 'fa-hand-pointer'} text-lg`}></i>
            </button>
            <button 
                onClick={() => { 
                    if (currentStop) mapInstanceRef.current.flyTo([currentStop.latitude, currentStop.longitude], 18); 
                    setIsAutoFollowing(false); 
                }} 
                className="w-14 h-14 rounded-2xl bg-slate-900 text-slate-400 border-2 border-white/10 shadow-2xl flex items-center justify-center"
            >
                <i className="fas fa-bullseye text-lg"></i>
            </button>
        </div>
    </div>
  );
};
