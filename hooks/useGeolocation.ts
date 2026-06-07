import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export type GpsMode = 'active' | 'idle';

const isValidCoord = (lat: number, lng: number): boolean =>
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0);

export const useGeolocation = (mode: GpsMode = 'idle') => {
    const { setUserLocation, setGpsStatus } = useAppStore();

    useEffect(() => {
        let watchId: string | null = null;
        let isSubscribed = true;

        const startWatching = async () => {
            if (mode === 'idle') {
                if (isSubscribed) setGpsStatus('idle');
                return;
            }

            if (isSubscribed) setGpsStatus('loading');
            
            try {
                // Solicitar permisos explícitamente en dispositivos móviles (Android/iOS)
                if (Capacitor.isNativePlatform()) {
                    let permStatus = await Geolocation.checkPermissions();
                    if (permStatus.location !== 'granted') {
                        permStatus = await Geolocation.requestPermissions();
                    }
                    if (permStatus.location !== 'granted') {
                        if (isSubscribed) setGpsStatus('denied');
                        return;
                    }
                }

                let lastUpdate = 0;

                const watchCallback = await Geolocation.watchPosition(
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
                    (pos, err) => {
                        if (err) {
                            console.error('Error watchPosition:', err);
                            // we keep trying if there are minor errors
                            return;
                        }
                        if (pos) {
                            const now = Date.now();
                            const { latitude, longitude } = pos.coords;
                            if (now - lastUpdate > 2000 && isValidCoord(latitude, longitude)) {
                                lastUpdate = now;
                                if (isSubscribed) {
                                    setUserLocation({ lat: latitude, lng: longitude });
                                    setGpsStatus('active');
                                }
                            }
                        }
                    }
                );
                
                if (isSubscribed) {
                    watchId = watchCallback;
                } else if (watchCallback != null) {
                    // if component unmounted while we were awaiting
                    Geolocation.clearWatch({ id: watchCallback });
                }
                
            } catch (error) {
                console.error("Error al iniciar geolocation:", error);
                if (isSubscribed) setGpsStatus('unavailable');
            }
        };

        startWatching();

        return () => {
            isSubscribed = false;
            if (watchId != null) {
                Geolocation.clearWatch({ id: watchId }).catch(console.error);
            }
        };
    }, [mode, setUserLocation, setGpsStatus]);
};

