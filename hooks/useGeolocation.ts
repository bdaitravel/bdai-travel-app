import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export type GpsMode = 'active' | 'idle';

const isValidCoord = (lat: number, lng: number): boolean =>
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0);

export const useGeolocation = (mode: GpsMode = 'idle') => {
    const { setUserLocation, setGpsStatus } = useAppStore();

    useEffect(() => {
        if (mode === 'idle') {
            setGpsStatus('idle');
            return;
        }

        if (!navigator.geolocation) {
            setGpsStatus('unavailable');
            return;
        }

        setGpsStatus('loading');
        let lastUpdate = 0;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const now = Date.now();
                const { latitude, longitude } = pos.coords;
                if (now - lastUpdate > 2000 && isValidCoord(latitude, longitude)) {
                    lastUpdate = now;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setGpsStatus('active');
                }
            },
            (err) => {
                if (err.code === 1) setGpsStatus('denied');
                else if (err.code === 2) setGpsStatus('unavailable');
                // code 3 = timeout, seguimos intentando (no cambiamos status)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [mode, setUserLocation, setGpsStatus]);
};
