import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export const useGeolocation = () => {
    const { setUserLocation } = useAppStore();

    useEffect(() => {
        if (!navigator.geolocation) return;
        let lastUpdate = 0;

        const isValidCoord = (lat: number, lng: number): boolean =>
            isFinite(lat) && isFinite(lng) &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180 &&
            !(lat === 0 && lng === 0);

        const watchId = navigator.geolocation.watchPosition(
            (pos) => { 
                const now = Date.now();
                const { latitude, longitude } = pos.coords;
                if (now - lastUpdate > 2000 && isValidCoord(latitude, longitude)) {
                    lastUpdate = now;
                    setUserLocation({ lat: latitude, lng: longitude }); 
                }
            },
            (err) => {
              if (err.code !== 3) {
                 console.debug(`GPS Info: ${err.message}`);
              }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
        
        return () => navigator.geolocation.clearWatch(watchId);
    }, [setUserLocation]);
};
