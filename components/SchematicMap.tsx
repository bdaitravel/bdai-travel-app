
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
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !L) return;
    if (mapInstanceRef.current) return; // Already initialized

    try {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([0, 0], 2); // Start global, update later

        // Add CartoDB Voyager Tiles (Clean, good for tourism)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Add Zoom Control at bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;
    } catch (e) {
        console.error("Error initializing map:", e);
        setMapError(true);
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Update Map Content (Markers, Route, User Location)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    // 1. Cleanup old layers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (routeLineRef.current) map.removeLayer(routeLineRef.current);
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);

    // 2. Filter Valid Stops
    // Some AI generated coordinates might be 0,0. We filter them.
    const validStops = stops.filter(s => s.latitude && s.longitude && (Math.abs(s.latitude) > 0.1 || Math.abs(s.longitude) > 0.1));
    
    // Fallback: If no valid stops, try to construct fake visualization or just wait
    if (validStops.length === 0) {
        // If we have user location but no stops, center on user
        if (userLocation && userLocation.lat) {
             map.setView([userLocation.lat, userLocation.lng], 15);
        }
        return; 
    }

    // 3. Draw Route Line
    const latLngs = validStops.map(s => [s.latitude, s.longitude]);
    routeLineRef.current = L.polyline(latLngs, {
        color: '#8b5cf6', // purple-500
        weight: 5,
        opacity: 0.7,
        dashArray: '1, 8', // Dotted line style
        lineCap: 'round',
        lineJoin: 'round'
    }).addTo(map);

    // 4. Add Stop Markers
    validStops.forEach((stop, idx) => {
        const isActive = idx === currentStopIndex;
        const isVisited = stop.visited;
        const isBusiness = stop.type === 'business_ad';
        const isPhoto = stop.type === 'photo';

        // Custom HTML Marker using Tailwind classes
        const iconHtml = `
            <div class="relative flex items-center justify-center w-full h-full">
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold transition-transform transform
                    ${isActive ? 'bg-yellow-400 text-yellow-900 scale-125 z-50 ring-4 ring-yellow-400/30' : 
                      isVisited ? 'bg-green-500 text-white' : 
                      isBusiness ? 'bg-blue-600 text-white' : 
                      isPhoto ? 'bg-pink-500 text-white' : 'bg-slate-900 text-white'}
                ">
                    ${isBusiness ? '<i class="fas fa-star text-[10px]"></i>' : isPhoto ? '<i class="fas fa-camera text-[10px]"></i>' : idx + 1}
                </div>
                ${isActive ? '<div class="absolute -inset-2 bg-yellow-400 rounded-full animate-ping opacity-40"></div>' : ''}
            </div>
        `;

        const icon = L.divIcon({
            className: 'bg-transparent',
            html: iconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16], // Center anchor
        });

        const marker = L.marker([stop.latitude, stop.longitude], { icon }).addTo(map);
        
        // Popup
        marker.bindPopup(`
            <div class="text-center">
                <strong class="block text-slate-800 text-sm mb-1">${stop.name}</strong>
                ${stop.type === 'business_ad' ? '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">Sponsored</span>' : ''}
            </div>
        `, { closeButton: false, offset: [0, -10] });

        if (isActive) {
            marker.openPopup();
        }

        markersRef.current.push(marker);
    });

    // 5. User Location Marker
    if (userLocation && userLocation.lat) {
        const userIcon = L.divIcon({
            className: 'bg-transparent',
            html: `
                <div class="relative flex items-center justify-center w-full h-full">
                    <div class="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-2xl relative z-20"></div>
                    <div class="absolute w-24 h-24 bg-blue-500/20 rounded-full animate-ping z-10"></div>
                    <div class="absolute w-12 h-12 bg-blue-500/40 rounded-full z-10"></div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 10000 }).addTo(map);
    }

    // 6. Fit Bounds Logic (Dynamic Focus)
    const activeStop = stops[currentStopIndex];
    const hasActiveStop = activeStop && activeStop.latitude && activeStop.longitude;

    if (userLocation && userLocation.lat && hasActiveStop) {
        // CASE A: Navigation Mode (User + Active Stop)
        // Focus specifically on the relationship between where the user IS and where they are GOING.
        const focusBounds = L.latLngBounds([
            [userLocation.lat, userLocation.lng],
            [activeStop.latitude, activeStop.longitude]
        ]);
        
        map.fitBounds(focusBounds, { 
            padding: [80, 80], // Add generous padding so points aren't at the edge
            maxZoom: 16, 
            animate: true 
        });

    } else if (hasActiveStop && !userLocation) {
        // CASE B: Preview Mode (Just Active Stop)
        // If no GPS, just focus on the stop with a reasonable zoom
        map.setView([activeStop.latitude, activeStop.longitude], 16, { animate: true });

    } else {
        // CASE C: Overview Mode (Whole Route)
        // Fallback to showing the entire tour
        const allBounds = L.latLngBounds(latLngs);
        if (allBounds.isValid()) {
             map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 15 });
        }
    }

  }, [stops, currentStopIndex, userLocation]);

  if (mapError) {
      return (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 rounded-3xl">
              <div className="text-center">
                  <i className="fas fa-map-marked-alt text-4xl mb-2"></i>
                  <p>Map unavailable</p>
              </div>
          </div>
      );
  }

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-inner border border-slate-200">
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-50" />
        
        {/* GPS Status Indicator Overlay */}
        <div className="absolute top-4 right-4 z-[400]">
            <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-2 border transition-colors ${userLocation ? 'bg-white border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                {userLocation ? (
                    <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span>GPS Live</span>
                    </>
                ) : (
                    <>
                        <i className="fas fa-satellite"></i>
                        <span>Searching GPS...</span>
                    </>
                )}
            </div>
        </div>
        
        {/* Helper Re-center Button */}
        {userLocation && (
             <button 
                className="absolute bottom-8 right-4 z-[400] bg-white text-slate-700 p-3 rounded-full shadow-lg hover:bg-slate-50 active:scale-95 transition-all"
                onClick={() => {
                   if (mapInstanceRef.current && stops[currentStopIndex]) {
                       const active = stops[currentStopIndex];
                       const bounds = L.latLngBounds([
                           [userLocation.lat, userLocation.lng],
                           [active.latitude, active.longitude]
                       ]);
                       mapInstanceRef.current.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });
                   }
                }}
             >
                <i className="fas fa-location-arrow"></i>
             </button>
        )}
    </div>
  );
};
