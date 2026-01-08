
import React, { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';

const L = (window as any).L;

interface SchematicMapProps {
  stops: Stop[];
  currentStopIndex: number;
  userLocation?: { lat: number; lng: number } | null;
}

export const SchematicMap: React.FC<SchematicMapProps> = ({ stops, currentStopIndex, userLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const checkInRangeRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || !L) return;
    if (mapInstanceRef.current) return;

    try {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([0, 0], 2);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
    } catch (e) {
        setMapError(true);
    }

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
    if (routeLineRef.current) map.removeLayer(routeLineRef.current);
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (checkInRangeRef.current) map.removeLayer(checkInRangeRef.current);

    const validStops = stops.filter(s => s.latitude && s.longitude && (Math.abs(s.latitude) > 0.1 || Math.abs(s.longitude) > 0.1));
    
    if (validStops.length === 0) {
        if (userLocation && userLocation.lat) map.setView([userLocation.lat, userLocation.lng], 15);
        return; 
    }

    const latLngs = validStops.map(s => [s.latitude, s.longitude]);
    routeLineRef.current = L.polyline(latLngs, {
        color: '#8b5cf6',
        weight: 4,
        opacity: 0.5,
        dashArray: '5, 10',
        lineCap: 'round'
    }).addTo(map);

    const activeStop = stops[currentStopIndex];

    // Check-in validation circle (visual only)
    if (activeStop && !activeStop.visited) {
        checkInRangeRef.current = L.circle([activeStop.latitude, activeStop.longitude], {
            radius: 100,
            color: '#a855f7',
            fillColor: '#a855f7',
            fillOpacity: 0.15,
            weight: 1,
            className: 'animate-pulse'
        }).addTo(map);
    }

    validStops.forEach((stop, idx) => {
        const isActive = idx === currentStopIndex;
        const isVisited = stop.visited;

        const iconHtml = `
            <div class="relative flex items-center justify-center w-full h-full">
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold transition-all
                    ${isActive ? 'bg-purple-600 text-white scale-125 z-50 ring-4 ring-purple-500/20' : 
                      isVisited ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'}
                ">
                    ${isActive ? '<i class="fas fa-person-walking"></i>' : idx + 1}
                </div>
            </div>
        `;

        const icon = L.divIcon({
            className: 'bg-transparent',
            html: iconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });

        const marker = L.marker([stop.latitude, stop.longitude], { icon }).addTo(map);
        markersRef.current.push(marker);
    });

    if (userLocation && userLocation.lat) {
        const userIcon = L.divIcon({
            className: 'bg-transparent',
            html: `
                <div class="relative flex items-center justify-center w-full h-full">
                    <div class="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-2xl relative z-20"></div>
                    <div class="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping z-10"></div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 10000 }).addTo(map);
    }

    if (activeStop && userLocation) {
        const bounds = L.latLngBounds([
            [userLocation.lat, userLocation.lng],
            [activeStop.latitude, activeStop.longitude]
        ]);
        map.fitBounds(bounds, { padding: [100, 100], maxZoom: 17 });
    } else if (activeStop) {
        map.setView([activeStop.latitude, activeStop.longitude], 17);
    }

  }, [stops, currentStopIndex, userLocation]);

  if (mapError) return <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-3xl"><p>Map unavailable</p></div>;

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner border border-slate-200">
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-50" />
        <div className="absolute top-4 right-4 z-[400]">
            <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-2 border bg-white ${userLocation ? 'border-green-200 text-green-700' : 'border-slate-200 text-slate-400'}`}>
                {userLocation ? <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>GPS Activo</> : 'Buscando GPS...'}
            </div>
        </div>
    </div>
  );
};
