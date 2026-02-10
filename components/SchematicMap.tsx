
import React, { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';
import { getRouteDirections } from '../services/mapsService';

// Fix: Declare google as any to avoid "Cannot find name 'google'" errors
declare const google: any;

const STOP_ICONS: Record<string, string> = { 
    historical: 'fa-fingerprint', 
    food: 'fa-utensils', 
    art: 'fa-palette', 
    nature: 'fa-leaf', 
    photo: 'fa-camera', 
    culture: 'fa-landmark', 
    architecture: 'fa-archway' 
};

export const SchematicMap: React.FC<any> = ({ stops, currentStopIndex, onStopSelect, userLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // Fix: Use any for google maps types to avoid "Cannot find namespace 'google'"
  const googleMap = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const userMarker = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || googleMap.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: stops[0]?.latitude || 0, lng: stops[0]?.longitude || 0 },
      zoom: 16,
      disableDefaultUI: true,
      styles: [
        { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] },
        { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }, { "lightness": 13 }] },
        { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }] },
        { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
        { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#334155" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] }
      ]
    });

    googleMap.current = map;
    directionsRenderer.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#9333ea",
        strokeOpacity: 0.8,
        strokeWeight: 6
      }
    });
  }, [stops]);

  useEffect(() => {
    if (!googleMap.current || stops.length === 0) return;

    // Fetch and render route
    getRouteDirections(stops).then((result) => {
      directionsRenderer.current?.setDirections(result);
    }).catch(console.error);

    // Clear existing markers
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];

    // Add stop markers
    stops.forEach((stop: Stop, idx: number) => {
      const isActive = idx === currentStopIndex;
      const marker = new google.maps.Marker({
        position: { lat: stop.latitude, lng: stop.longitude },
        map: googleMap.current,
        title: stop.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isActive ? 12 : 8,
          fillColor: isActive ? "#9333ea" : "#475569",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        }
      });

      marker.addListener('click', () => onStopSelect(idx));
      markers.current.push(marker);
    });

    // Fit bounds
    if (googleMap.current) {
        const bounds = new google.maps.LatLngBounds();
        stops.forEach(s => bounds.extend({ lat: s.latitude, lng: s.longitude }));
        googleMap.current.fitBounds(bounds);
    }
  }, [stops, currentStopIndex]);

  useEffect(() => {
    if (!googleMap.current || !userLocation) return;
    
    if (userMarker.current) {
        userMarker.current.setPosition(userLocation);
    } else {
        userMarker.current = new google.maps.Marker({
            position: userLocation,
            map: googleMap.current,
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff"
            }
        });
    }
  }, [userLocation]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <i className={`fas ${STOP_ICONS[stops[currentStopIndex]?.type] || 'fa-location-dot'}`}></i>
          </div>
          <div>
              <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest leading-none">Actual</p>
              <p className="text-[10px] font-black uppercase text-white truncate max-w-[120px]">{stops[currentStopIndex]?.name}</p>
          </div>
      </div>
    </div>
  );
};
