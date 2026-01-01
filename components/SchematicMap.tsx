
import React, { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';

// Access Leaflet from global window since it's loaded via CDN
const L = (window as any).L;

interface SchematicMapProps {
  stops: Stop[];
  currentStopIndex: number;
  userLocation?: { lat: number; lng: number } | null;
}

export const SchematicMap: React.FC<SchematicMapProps> = ({ stops, currentStopIndex, userLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const lastStopIndexRef = useRef<number>(-1);
  const [mapError, setMapError] = useState(false);

  // Initialize Map (Only once)
  useEffect(() => {
    if (!mapContainerRef.current || !L || mapInstanceRef.current) return;

    try {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([0, 0], 2);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
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

  // Effect 1: Draw Static Elements (Stops & Route)
  // Only runs when 'stops' or 'currentStopIndex' changes, NOT on userLocation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    // Cleanup stop markers and route
    stopMarkersRef.current.forEach(m => map.removeLayer(m));
    stopMarkersRef.current = [];
    if (routeLineRef.current) map.removeLayer(routeLineRef.current);

    const validStops = stops.filter(s => s.latitude && s.longitude && (Math.abs(s.latitude) > 0.1 || Math.abs(s.longitude) > 0.1));
    if (validStops.length === 0) return;

    // Draw Route
    const latLngs = validStops.map(s => [s.latitude, s.longitude]);
    routeLineRef.current = L.polyline(latLngs, {
        color: '#8b5cf6',
        weight: 5,
        opacity: 0.6,
        dashArray: '1, 10',
        lineCap: 'round'
    }).addTo(map);

    // Draw Stop Markers
    validStops.forEach((stop, idx) => {
        const isActive = idx === currentStopIndex;
        const iconHtml = `
            <div class="relative flex items-center justify-center w-full h-full">
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black transition-all
                    ${isActive ? 'bg-yellow-400 text-yellow-900 scale-125 z-50 ring-4 ring-yellow-400/30' : 
                      stop.visited ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}
                ">
                    ${idx + 1}
                </div>
                ${isActive ? '<div class="absolute -inset-2 bg-yellow-400 rounded-full animate-ping opacity-30"></div>' : ''}
            </div>
        `;

        const marker = L.marker([stop.latitude, stop.longitude], { 
            icon: L.divIcon({ className: 'bg-transparent', html: iconHtml, iconSize: [32, 32], iconAnchor: [16, 16] }) 
        }).addTo(map);
        
        stopMarkersRef.current.push(marker);
    });

    // Auto-fit bounds ONLY if the stop has changed
    if (lastStopIndexRef.current !== currentStopIndex) {
        lastStopIndexRef.current = currentStopIndex;
        const activeStop = validStops[currentStopIndex];
        if (activeStop) {
            // Focus view on the active stop initially
            map.flyTo([activeStop.latitude, activeStop.longitude], 16, { duration: 1 });
        }
    }
  }, [stops, currentStopIndex]);

  // Effect 2: Update User Location Marker (Smooth update)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L || !userLocation?.lat) return;

    if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
            className: 'bg-transparent',
            html: `
                <div class="relative flex items-center justify-center w-full h-full">
                    <div class="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-2xl z-20"></div>
                    <div class="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-pulse z-10"></div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  if (mapError) return <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-3xl text-slate-400">Map Error</div>;

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner border border-slate-200">
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-50" />
        
        <div className="absolute top-4 right-4 z-[400]">
            <div className={`px-3 py-1.5 rounded-full text-[9px] font-black shadow-md flex items-center gap-2 border transition-colors ${userLocation ? 'bg-white border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                {userLocation ? <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> GPS ACTIVO</> : 'BUSCANDO GPS...'}
            </div>
        </div>
        
        <button 
            className="absolute bottom-8 right-4 z-[400] bg-white text-slate-900 p-4 rounded-2xl shadow-2xl active:scale-90 transition-all border border-slate-100"
            onClick={() => {
                const map = mapInstanceRef.current;
                const active = stops[currentStopIndex];
                if (map && userLocation && active) {
                    const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng], [active.latitude, active.longitude]]);
                    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17 });
                }
            }}
        >
            <i className="fas fa-location-crosshairs"></i>
        </button>
    </div>
  );
};
