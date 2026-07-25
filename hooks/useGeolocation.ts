import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { calculateDistanceMeters } from '../lib/geoUtils';

export type GpsMode = 'active' | 'idle';

type AccuracyTier = 'coarse' | 'precise';

// Cerca de una parada hace falta precisión real para validar el check-in (≤50m). Lejos,
// precisión de red/Wi-Fi (fused location provider del SO) es suficiente y consume mucha
// menos batería que mantener el GPS de alta precisión despierto todo el tour.
const NEAR_THRESHOLD_M = 150;
const FAR_THRESHOLD_M = 200; // histéresis: evita alternar de tier justo en el borde

const COARSE_OPTIONS = { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 };
const PRECISE_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 };

const isValidCoord = (lat: number, lng: number): boolean =>
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0);

export const useGeolocation = (mode: GpsMode = 'idle') => {
    const { setUserLocation, setGpsStatus, currentTour, currentStopIndex } = useAppStore();

    // Refs para que el callback del watch (creado una vez por el efecto) siempre lea la
    // parada activa más reciente sin tener que recrear el watch cada vez que cambia.
    const currentTourRef = useRef(currentTour);
    const currentStopIndexRef = useRef(currentStopIndex);
    currentTourRef.current = currentTour;
    currentStopIndexRef.current = currentStopIndex;

    useEffect(() => {
        let watchId: string | null = null;
        let isSubscribed = true;
        let tier: AccuracyTier = 'coarse';
        let lastUpdate = 0;
        let appStateCleanup: (() => void) | null = null;

        const clearCurrentWatch = () => {
            if (watchId != null) {
                Geolocation.clearWatch({ id: watchId }).catch(() => {});
                watchId = null;
            }
        };

        const startWatch = async (nextTier: AccuracyTier) => {
            if (!isSubscribed) return;
            clearCurrentWatch();
            tier = nextTier;
            try {
                const id = await Geolocation.watchPosition(
                    nextTier === 'precise' ? PRECISE_OPTIONS : COARSE_OPTIONS,
                    handlePosition
                );
                if (isSubscribed) {
                    watchId = id;
                } else if (id != null) {
                    Geolocation.clearWatch({ id }).catch(() => {});
                }
            } catch (error) {
                console.error('Error al iniciar geolocation:', error);
                if (isSubscribed) setGpsStatus('unavailable');
            }
        };

        function handlePosition(pos: any, err: any) {
            if (err) {
                console.error('Error watchPosition:', err);
                return;
            }
            if (!pos) return;
            const { latitude, longitude } = pos.coords;
            if (!isValidCoord(latitude, longitude)) return;

            const now = Date.now();
            if (now - lastUpdate > 2000) {
                lastUpdate = now;
                if (isSubscribed) {
                    setUserLocation({ lat: latitude, lng: longitude });
                    setGpsStatus('active');
                }
            }

            // Decidir si hace falta subir/bajar de nivel de precisión según la distancia
            // a la parada activa (Capacitor no permite cambiar opciones de un watch en marcha,
            // así que cambiar de nivel implica parar el actual y arrancar uno nuevo).
            const stop = currentTourRef.current?.stops?.[currentStopIndexRef.current];
            const distance = stop ? calculateDistanceMeters(latitude, longitude, stop.latitude, stop.longitude) : null;

            let desiredTier: AccuracyTier = tier;
            if (distance === null) {
                desiredTier = 'coarse';
            } else if (distance <= NEAR_THRESHOLD_M) {
                desiredTier = 'precise';
            } else if (distance > FAR_THRESHOLD_M) {
                desiredTier = 'coarse';
            }
            // Entre 150 y 200m se mantiene el nivel actual (histéresis, evita parpadeo).

            if (desiredTier !== tier) {
                startWatch(desiredTier);
            }
        }

        const start = async () => {
            if (mode === 'idle') {
                if (isSubscribed) setGpsStatus('idle');
                return;
            }

            if (isSubscribed) setGpsStatus('loading');

            try {
                if (Capacitor.isNativePlatform()) {
                    // Solicitar permisos explícitamente en dispositivos móviles (Android/iOS)
                    let permStatus = await Geolocation.checkPermissions();
                    if (permStatus.location !== 'granted') {
                        permStatus = await Geolocation.requestPermissions();
                    }
                    if (permStatus.location !== 'granted') {
                        if (isSubscribed) setGpsStatus('denied');
                        return;
                    }

                    // Apagar el GPS mientras la app no está visible (pantalla apagada,
                    // app minimizada) y reanudar en el nivel bajo al volver — evita mantener
                    // el chip despierto sin que el usuario esté mirando la pantalla.
                    const handle = await App.addListener('appStateChange', ({ isActive }) => {
                        if (!isSubscribed) return;
                        if (isActive) {
                            startWatch('coarse');
                        } else {
                            clearCurrentWatch();
                        }
                    });
                    appStateCleanup = () => handle.remove();
                }

                await startWatch('coarse');
            } catch (error) {
                console.error("Error al iniciar geolocation:", error);
                if (isSubscribed) setGpsStatus('unavailable');
            }
        };

        start();

        return () => {
            isSubscribed = false;
            clearCurrentWatch();
            if (appStateCleanup) appStateCleanup();
        };
    }, [mode, setUserLocation, setGpsStatus]);
};
