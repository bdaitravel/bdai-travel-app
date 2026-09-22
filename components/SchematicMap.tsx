import React, { useEffect, useRef, useState } from 'react';
import type * as LeafletLib from 'leaflet';
import { logger } from '../lib/logger';
import { Stop } from '../types';
import { useAppStore } from '../store/useAppStore';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { Capacitor } from '@capacitor/core';
import { CARTO_TILE_URL, CARTO_ATTRIBUTION } from '../lib/cartoTiles';

const L = (window as Window & { L: typeof LeafletLib }).L;
const STOP_CONFIG: Record<string, { icon: string, color: string }> = {
    // Official categories (matching Insignias exactly)
    history: { icon: 'fa-landmark', color: '#f59e0b' },
    art: { icon: 'fa-palette', color: '#ec4899' },
    food: { icon: 'fa-utensils', color: '#f97316' },
    nature: { icon: 'fa-leaf', color: '#22c55e' },
    photo: { icon: 'fa-camera', color: '#3b82f6' },
    culture: { icon: 'fa-masks-theater', color: '#a855f7' },
    architecture: { icon: 'fa-building', color: '#06b6d4' },
    special: { icon: 'fa-star', color: '#eab308' },
    
    // Aliases to avoid breaking existing generated tours
    historical: { icon: 'fa-landmark', color: '#f59e0b' },
    monument: { icon: 'fa-landmark', color: '#f59e0b' }, // Fallback para "monument" usando el icono de historia
    gastronomy: { icon: 'fa-utensils', color: '#f97316' },
    restaurant: { icon: 'fa-utensils', color: '#f97316' },
    museum: { icon: 'fa-palette', color: '#ec4899' },
    parks: { icon: 'fa-leaf', color: '#22c55e' },
    garden: { icon: 'fa-leaf', color: '#22c55e' },
    theater: { icon: 'fa-masks-theater', color: '#a855f7' },
    religious: { icon: 'fa-building', color: '#06b6d4' },
    church: { icon: 'fa-building', color: '#06b6d4' }
};

// Helper to decode Google Polyline algorithm
const decodePolyline = (str: string, precision: number = 5) => {
    let index = 0, lat = 0, lng = 0, coordinates: [number, number][] = [], shift = 0, result = 0, byte: number | null = null;
    const factor = Math.pow(10, precision);
    while (index < str.length) {
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat;
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
        coordinates.push([lat / factor, lng / factor] as [number, number]);
    }
    return coordinates;
};

interface MapTexts {
    guide: string; follow: string; stopFollow: string; focus: string; dist: string;
    locationPermissionTitle: string; locationPermissionBody: string; goToSettings: string; cancel: string; enableLocationAlert: string;
}
const TEXTS: Record<string, MapTexts> = {
    es: {
        guide: "Ir a", follow: "Seguir", stopFollow: "Libre", focus: "Fijar", dist: "a",
        locationPermissionTitle: "Permisos de Ubicación",
        locationPermissionBody: "Para poder mostrar tu ubicación y validar tu posición en las paradas, necesitamos acceder a tu GPS. Por favor, actívalo en los Ajustes.",
        goToSettings: "Ir a Ajustes", cancel: "Cancelar",
        enableLocationAlert: "Ve a los ajustes de tu navegador para permitir la ubicación."
    },
    en: {
        guide: "Go to", follow: "Follow", stopFollow: "Free", focus: "Fix", dist: "at",
        locationPermissionTitle: "Location Permissions",
        locationPermissionBody: "In order to show your location and validate your position, we need access to your GPS. Please enable it in Settings.",
        goToSettings: "Go to Settings", cancel: "Cancel",
        enableLocationAlert: "Go to your browser settings to allow location."
    },
    fr: {
        guide: "Aller à", follow: "Suivre", stopFollow: "Libre", focus: "Fixer", dist: "à",
        locationPermissionTitle: "Autorisations de localisation",
        locationPermissionBody: "Pour afficher votre position et la valider aux arrêts, nous avons besoin d'accéder à votre GPS. Veuillez l'activer dans les Réglages.",
        goToSettings: "Aller aux Réglages", cancel: "Annuler",
        enableLocationAlert: "Accédez aux réglages de votre navigateur pour autoriser la localisation."
    },
    it: {
        guide: "Vai a", follow: "Segui", stopFollow: "Libero", focus: "Fissa", dist: "a",
        locationPermissionTitle: "Permessi di Localizzazione",
        locationPermissionBody: "Per mostrare la tua posizione e convalidarla alle fermate, dobbiamo accedere al tuo GPS. Attivalo nelle Impostazioni.",
        goToSettings: "Vai alle Impostazioni", cancel: "Annulla",
        enableLocationAlert: "Vai alle impostazioni del browser per consentire la posizione."
    },
    pt: {
        guide: "Ir para", follow: "Seguir", stopFollow: "Livre", focus: "Fixar", dist: "a",
        locationPermissionTitle: "Permissões de Localização",
        locationPermissionBody: "Para mostrar sua localização e validar sua posição nas paradas, precisamos acessar seu GPS. Ative-o nas Configurações.",
        goToSettings: "Ir para Configurações", cancel: "Cancelar",
        enableLocationAlert: "Vá até as configurações do seu navegador para permitir a localização."
    },
    de: {
        guide: "Gehe zu", follow: "Folgen", stopFollow: "Frei", focus: "Fixieren", dist: "bei",
        locationPermissionTitle: "Standortberechtigungen",
        locationPermissionBody: "Um deinen Standort anzuzeigen und an den Stopps zu validieren, benötigen wir Zugriff auf dein GPS. Bitte aktiviere es in den Einstellungen.",
        goToSettings: "Zu den Einstellungen", cancel: "Abbrechen",
        enableLocationAlert: "Gehe zu deinen Browsereinstellungen, um den Standort zu erlauben."
    },
    zh: {
        guide: "前往", follow: "跟随", stopFollow: "自由", focus: "固定", dist: "距",
        locationPermissionTitle: "位置权限",
        locationPermissionBody: "为了显示您的位置并在各站点验证您的位置，我们需要访问您的GPS。请在设置中启用它。",
        goToSettings: "前往设置", cancel: "取消",
        enableLocationAlert: "请前往浏览器设置以允许使用位置信息。"
    },
    ja: {
        guide: "移動", follow: "追従", stopFollow: "自由", focus: "固定", dist: "距離",
        locationPermissionTitle: "位置情報の許可",
        locationPermissionBody: "現在地を表示し、各スポットでの位置を確認するにはGPSへのアクセスが必要です。設定で有効にしてください。",
        goToSettings: "設定を開く", cancel: "キャンセル",
        enableLocationAlert: "ブラウザの設定で位置情報を許可してください。"
    },
    ru: {
        guide: "Перейти", follow: "Следовать", stopFollow: "Свободно", focus: "Закрепить", dist: "у",
        locationPermissionTitle: "Разрешения на геолокацию",
        locationPermissionBody: "Чтобы показать ваше местоположение и подтвердить его на остановках, нам нужен доступ к GPS. Включите его в Настройках.",
        goToSettings: "Перейти в настройки", cancel: "Отмена",
        enableLocationAlert: "Перейдите в настройки браузера, чтобы разрешить геолокацию."
    },
    ar: {
        guide: "الذهاب إلى", follow: "متابعة", stopFollow: "حر", focus: "تثبيت", dist: "عند",
        locationPermissionTitle: "أذونات الموقع",
        locationPermissionBody: "لعرض موقعك والتحقق منه عند المحطات، نحتاج إلى الوصول إلى GPS. يرجى تفعيله من الإعدادات.",
        goToSettings: "الذهاب إلى الإعدادات", cancel: "إلغاء",
        enableLocationAlert: "اذهب إلى إعدادات المتصفح للسماح بالموقع."
    }
};

interface SchematicMapProps {
    stops: Stop[];
    routePolyline?: string;
    currentStopIndex: number;
    language?: string;
    onStopSelect?: (index: number) => void;
    userLocation?: { lat: number; lng: number } | null;
    // Modo Libre: no hay una ruta fija que conectar entre las paradas (son de
    // varios tours sin orden), así que se omite la línea general (fullPathRef)
    // — la guía de "cómo llegar" hasta la parada activa (activeLineRef) no se
    // ve afectada, sigue calculándose igual sea cual sea el modo.
    hideFullPath?: boolean;
}

export const SchematicMap: React.FC<SchematicMapProps> = ({ stops, routePolyline, currentStopIndex, language = 'es', onStopSelect, userLocation, hideFullPath = false }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<LeafletLib.Map | null>(null);
    const markersRef = useRef<LeafletLib.Marker[]>([]);
    const userMarkerRef = useRef<LeafletLib.Marker | null>(null);
    const fullPathRef = useRef<LeafletLib.Polyline | null>(null);
    const activeLineRef = useRef<LeafletLib.Polyline | null>(null);
    const geofenceCirclesRef = useRef<LeafletLib.Circle[]>([]);
    const lastRoutingRef = useRef<{ lat: number; lng: number; time: number; targetLat: number; targetLng: number } | null>(null);

    const [isAutoFollowing, setIsAutoFollowing] = useState(true);
    const [walkingTime, setWalkingTime] = useState<number | null>(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    // Tapa el mapa hasta que las teselas de la vista inicial terminen de cargar.
    // Se ha visto la primera vez que se entra a un tour con las teselas
    // descuadradas (Leaflet calcula mal el tamaño si el contenedor todavía se
    // está montando/animando) hasta salir y volver a entrar — este overlay
    // evita que se llegue a ver esa vista rota, y el invalidateSize forzado
    // más abajo corrige la causa de raíz en vez de solo taparla.
    const [isMapReady, setIsMapReady] = useState(false);
    const { gpsStatus } = useAppStore();
    const tl = TEXTS[language] || TEXTS.en || TEXTS.es;

    const handleCrosshairClick = () => {
        if (gpsStatus === 'denied' || gpsStatus === 'unavailable') {
            setShowPermissionModal(true);
        } else {
            setIsAutoFollowing(!isAutoFollowing);
        }
    };

    const openNativeSettings = () => {
        if (Capacitor.isNativePlatform()) {
            NativeSettings.open({
                optionAndroid: AndroidSettings.ApplicationDetails,
                optionIOS: IOSSettings.App
            }).catch(console.error);
        } else {
            alert(tl.enableLocationAlert);
        }
        setShowPermissionModal(false);
    };

    // Validar paradas antes de usarlas
    const validStops = React.useMemo(() => {
        return (stops || []).map((s: Stop, originalIndex: number) => ({
            ...s,
            originalIndex,
            isValid: !isNaN(s.latitude) && !isNaN(s.longitude) && s.latitude !== 0 && s.longitude !== 0
        }));
    }, [stops]);
    const currentStop = validStops[currentStopIndex]?.isValid ? validStops[currentStopIndex] : validStops.find(s => s.isValid);

    useEffect(() => {
        if (!mapContainerRef.current || !L || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            // Atribución obligatoria (condición del tier gratuito de CARTO y de la
            // licencia ODbL de OpenStreetMap) — se deja el control nativo de Leaflet
            // sin el prefijo "Leaflet" para que ocupe el mínimo posible cumpliendo
            // el requisito. No quitar ni ocultar por CSS.
            attributionControl: true,
            dragging: true,
            touchZoom: true,
            maxZoom: 19
        }).setView([0, 0], 15);
        map.attributionControl.setPrefix(false);
        // La ficha blanca de la parada (TourCard.tsx) se solapa -mt-6 (24px) sobre
        // la esquina inferior del mapa, tapando casi toda la atribución. Se sube el
        // control lo justo para que quede legible en la posición de reposo; al
        // arrastrar la ficha hacia arriba puede volver a taparse, y eso es aceptable.
        map.attributionControl.getContainer()?.style.setProperty('margin-bottom', '28px');

        const tileLayer = L.tileLayer(CARTO_TILE_URL, {
            maxZoom: 19,
            attribution: CARTO_ATTRIBUTION
        }).addTo(map);
        // 'load' se dispara cuando todas las teselas visibles han terminado de
        // cargar — solo entonces se destapa el mapa (ver isMapReady arriba).
        tileLayer.on('load', () => setIsMapReady(true));
        // Salvaguarda: sin red, alguna tesela puede quedarse colgada sin
        // disparar 'load' ni 'error' nunca — no dejar el spinner para siempre.
        const readyFallback = setTimeout(() => setIsMapReady(true), 5000);

        map.on('dragstart', () => setIsAutoFollowing(false));
        mapInstanceRef.current = map;

        // Fuerza el recálculo de tamaño poco después del montaje: si el
        // contenedor todavía se está animando/montando (transición de entrada
        // de la tarjeta), Leaflet puede pedir las teselas iniciales para un
        // tamaño que no es el definitivo, y quedan descuadradas hasta el
        // siguiente resize real. No depender solo del ResizeObserver de abajo,
        // que no dispara si el tamaño final coincide con el inicial.
        const raf = requestAnimationFrame(() => mapInstanceRef.current?.invalidateSize());
        const settleTimer = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300);

        const resizeObserver = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        });
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(settleTimer);
            clearTimeout(readyFallback);
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

        // Actualizar marcador de usuario si hay ubicación
        if (userLocation?.lat && userLocation?.lng) {
            if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
            } else {
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
            }

            if (currentStop?.latitude && currentStop?.longitude) {
                const dist = map.distance([userLocation.lat, userLocation.lng], [currentStop.latitude, currentStop.longitude]);

                if (dist < 40000) { // Only draw route if within 40km
                    const now = Date.now();
                    let shouldFetchRouting = false;

                    const targetChanged = !lastRoutingRef.current ||
                        lastRoutingRef.current.targetLat !== currentStop.latitude ||
                        lastRoutingRef.current.targetLng !== currentStop.longitude;

                    if (!lastRoutingRef.current || targetChanged) {
                        // Cambiar de parada (Siguiente/Anterior/Saltar) debe recalcular la ruta
                        // ya mismo, sin esperar al debounce de tiempo/distancia — si no, se
                        // queda mostrando la ruta hacia la parada anterior indefinidamente
                        // mientras el usuario no se mueva ni pasen los 15s.
                        shouldFetchRouting = true;
                    } else {
                        const timeElapsed = now - lastRoutingRef.current.time;
                        const distMoved = map.distance([userLocation.lat, userLocation.lng], [lastRoutingRef.current.lat, lastRoutingRef.current.lng]);
                        // Geo-Debounce: Solo recalcular si se ha movido > 25m o han pasado > 15s
                        if (timeElapsed > 15000 || distMoved > 25) {
                            shouldFetchRouting = true;
                        }
                    }

                    if (shouldFetchRouting) {
                        lastRoutingRef.current = { lat: userLocation.lat, lng: userLocation.lng, time: now, targetLat: currentStop.latitude, targetLng: currentStop.longitude };

                        const fetchRouting = async () => {
                            // Prioridad 1: Ruta pública OpenStreetMap
                            const urlPrimary = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${userLocation.lng},${userLocation.lat};${currentStop.longitude},${currentStop.latitude}?overview=full&geometries=polyline`;
                            // Prioridad 2: OSRM Public Server con flag para evitar rutas serpenteantes
                            const urlFallback = `https://router.project-osrm.org/route/v1/foot/${userLocation.lng},${userLocation.lat};${currentStop.longitude},${currentStop.latitude}?overview=full&geometries=polyline&continue_straight=true`;

                            const drawRoute = (data: any) => {
                                const points = decodePolyline(data.routes[0].geometry);
                                setWalkingTime(Math.round(data.routes[0].duration / 60)); // Minutes
                                if (activeLineRef.current) {
                                    activeLineRef.current.setLatLngs(points);
                                } else {
                                    activeLineRef.current = L.polyline(points, {
                                        color: '#9333ea', weight: 6, dashArray: '12, 20', opacity: 0.8, lineCap: 'round', className: 'animate-marching-ants'
                                    }).addTo(map);

                                    if (!document.getElementById('marching-ants-style')) {
                                        const style = document.createElement('style');
                                        style.id = 'marching-ants-style';
                                        style.innerHTML = `@keyframes marching-ants { from { stroke-dashoffset: 64; } to { stroke-dashoffset: 0; } } .animate-marching-ants { animation: marching-ants 1.5s linear infinite; }`;
                                        document.head.appendChild(style);
                                    }
                                }
                            };

                            try {
                                const res = await fetch(urlPrimary, { signal: AbortSignal.timeout(4000) });
                                if (!res.ok) throw new Error("Primary failed");
                                const data = await res.json();
                                if (data.code === 'Ok' && data.routes?.[0]) {
                                    drawRoute(data);
                                    return;
                                }
                                throw new Error("Primary returned bad response");
                            } catch (e) {
                                logger.warn("Primary routing failed, trying fallback...", e);
                                try {
                                    const res2 = await fetch(urlFallback, { signal: AbortSignal.timeout(4000) });
                                    if (!res2.ok) throw new Error("Fallback failed");
                                    const data2 = await res2.json();
                                    if (data2.code === 'Ok' && data2.routes?.[0]) {
                                        drawRoute(data2);
                                        return;
                                    }
                                    throw new Error("Fallback returned bad response");
                                } catch (e2) {
                                    logger.warn("All routing APIs failed. Falling back to straight line.", e2);
                                    const points: [number, number][] = [[userLocation.lat, userLocation.lng], [currentStop.latitude, currentStop.longitude]];
                                    setWalkingTime(null);
                                    if (activeLineRef.current) {
                                        activeLineRef.current.setLatLngs(points);
                                    } else {
                                        activeLineRef.current = L.polyline(points, {
                                            color: '#9333ea', weight: 6, dashArray: '12, 20', opacity: 0.8, lineCap: 'round', className: 'animate-marching-ants'
                                        }).addTo(map);

                                        if (!document.getElementById('marching-ants-style')) {
                                            const style = document.createElement('style');
                                            style.id = 'marching-ants-style';
                                            style.innerHTML = `@keyframes marching-ants { from { stroke-dashoffset: 64; } to { stroke-dashoffset: 0; } } .animate-marching-ants { animation: marching-ants 1.5s linear infinite; }`;
                                            document.head.appendChild(style);
                                        }
                                    }
                                }
                            }
                        };
                        fetchRouting();
                    }
                } else if (activeLineRef.current) {
                    map.removeLayer(activeLineRef.current);
                    activeLineRef.current = null;
                }
            }
        }
    }, [userLocation?.lat, userLocation?.lng, currentStop?.latitude, currentStop?.longitude]);

    // Lógica de seguimiento (Auto-following)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !L || !isAutoFollowing || !currentStop) return;

        // Si el GPS da una ubicación a decenas de km de la parada, no es que el
        // usuario esté "muy lejos caminando" — es alguien mirando/probando el
        // tour sin estar físicamente en la ciudad (o una localización de red
        // imprecisa). Seguir esa posición real haría que el mapa "se fuera" a
        // donde esté de verdad el usuario en vez de mostrar el tour. Por
        // encima de ese umbral se trata igual que si no hubiera GPS: centrar
        // en la parada. Por debajo (paseando de verdad), sigue como siempre.
        const FAR_THRESHOLD_M = 40000; // mismo umbral que usa el cálculo de ruta más abajo
        const hasNearbyLocation = userLocation?.lat && userLocation?.lng &&
            map.distance([userLocation.lat, userLocation.lng], [currentStop.latitude, currentStop.longitude]) <= FAR_THRESHOLD_M;

        if (hasNearbyLocation && userLocation) {
            // Just pan to user location smoothly to avoid zoom stuttering
            map.panTo([userLocation.lat, userLocation.lng], { animate: true });
        } else {
            // Sin ubicación (o demasiado lejos para ser la misma ciudad): centrar en la parada actual
            map.panTo([currentStop.latitude, currentStop.longitude], { animate: true });
        }
    }, [userLocation?.lat, userLocation?.lng, currentStop?.latitude, currentStop?.longitude, isAutoFollowing]);

    // Renderizar paradas y ruta
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !L) return;

        // Limpieza
        markersRef.current.forEach(m => map.removeLayer(m));
        geofenceCirclesRef.current.forEach(c => map.removeLayer(c));
        if (fullPathRef.current) map.removeLayer(fullPathRef.current);

        markersRef.current = [];
        geofenceCirclesRef.current = [];

        if (validStops.length > 0) {
            if (!hideFullPath) {
                let routePoints: [number, number][] = [];
                if (routePolyline) {
                    routePoints = decodePolyline(routePolyline);
                } else {
                    routePoints = validStops.map(s => [s.latitude, s.longitude] as [number, number]);
                }

                fullPathRef.current = L.polyline(routePoints, {
                    color: routePolyline ? '#fcd34d' : 'white', // Ámbar si es real, Blanco si es fallback
                    weight: routePolyline ? 4 : 2,
                    opacity: routePolyline ? 0.6 : 0.2,
                    dashArray: routePolyline ? undefined : '5, 10',
                    lineJoin: 'round'
                }).addTo(map);
            }

            validStops.forEach((stop: any, idx: number) => {
                const stopType = (stop.type || 'architecture').toLowerCase();
                const config = STOP_CONFIG[stopType] || STOP_CONFIG['architecture'] || { icon: 'fa-location-dot', color: '#9333ea' };

                const circle = L.circle([stop.latitude, stop.longitude], {
                    radius: 50,
                    color: '#334155',
                    fillColor: '#1e293b',
                    fillOpacity: 0.05,
                    weight: 1,
                    dashArray: '5, 5'
                }).addTo(map);
                geofenceCirclesRef.current.push(circle);

                const marker = L.marker([stop.latitude, stop.longitude], {
                    icon: L.divIcon({
                        className: '',
                        html: `
                        <div class="relative transition-all duration-300 opacity-80">
                            <div class="w-10 h-10 rounded-2xl border-2 border-slate-800 shadow-2xl flex items-center justify-center text-[12px] font-black" style="background-color: #0f172a; color: ${config.color}">
                                <i class="fas ${config.icon}"></i>
                            </div>
                            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 -z-10" style="background-color: #0f172a"></div>
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
    }, [validStops, routePolyline, hideFullPath]);

    // Update active state of markers
    useEffect(() => {
        if (!L || markersRef.current.length === 0) return;

        validStops.forEach((stop: any, idx: number) => {
            const isActive = idx === currentStopIndex;
            const stopType = (stop.type || 'architecture').toLowerCase();
            const config = STOP_CONFIG[stopType] || STOP_CONFIG['architecture'] || { icon: 'fa-location-dot', color: '#9333ea' };

            const circle = geofenceCirclesRef.current[idx];
            if (circle) {
                circle.setStyle({
                    color: isActive ? config.color : '#334155',
                    fillColor: isActive ? config.color : '#1e293b',
                    fillOpacity: isActive ? 0.2 : 0.05
                });
            }

            const marker = markersRef.current[idx];
            if (marker) {
                marker.setIcon(L.divIcon({
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
                }));
                if (isActive) {
                    marker.setZIndexOffset(1000);
                } else {
                    marker.setZIndexOffset(0);
                }
            }
        });
    }, [currentStopIndex, validStops]);

    // Ajustar zoom inicial a todas las paradas solo cuando cambian las paradas
    useEffect(() => {
        const map = mapInstanceRef.current;
        const activeStops = validStops.filter(s => s.isValid);
        if (!map || !L || activeStops.length === 0) return;

        // Use a small timeout to ensure the map container has its final size
        const timer = setTimeout(() => {
            const group = L.featureGroup(markersRef.current);
            if (group.getLayers().length > 0) {
                map.invalidateSize();
                map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 16 });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [stops]);

    // Volar a la parada cuando cambia el índice si no estamos en auto-following
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
            {!isMapReady && (
                <div className="absolute inset-0 z-[460] flex items-center justify-center bg-slate-950">
                    <i className="fas fa-spinner fa-spin text-purple-400 text-2xl"></i>
                </div>
            )}
            <div className="absolute right-4 bottom-28 z-[450] flex flex-col gap-2">
                <button onClick={() => mapInstanceRef.current?.zoomIn()} className="w-11 h-11 rounded-xl bg-slate-900 text-slate-400 border-2 border-white/10 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"><i className="fas fa-plus text-sm"></i></button>
                <button onClick={() => mapInstanceRef.current?.zoomOut()} className="w-11 h-11 rounded-xl bg-slate-900 text-slate-400 border-2 border-white/10 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"><i className="fas fa-minus text-sm"></i></button>
                <button onClick={handleCrosshairClick} className={`w-11 h-11 rounded-xl shadow-2xl flex items-center justify-center transition-all border-2 ${isAutoFollowing ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-white/10'}`}><i className={`fas ${isAutoFollowing ? 'fa-location-crosshairs' : 'fa-hand-pointer'} text-sm`}></i></button>
                <button onClick={() => { if (currentStop) mapInstanceRef.current?.flyTo([currentStop.latitude, currentStop.longitude], 18); setIsAutoFollowing(false); }} className="w-11 h-11 rounded-xl bg-slate-900 text-slate-400 border-2 border-white/10 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"><i className="fas fa-bullseye text-sm"></i></button>
            </div>
            {walkingTime !== null && isAutoFollowing && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-10 z-[450] bg-purple-600 text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl border-2 border-purple-400 flex items-center gap-2 animate-bounce">
                    <i className="fas fa-person-walking"></i>
                    <span>{walkingTime} min {tl.dist} {currentStop?.name || ''}</span>
                </div>
            )}
            
            {showPermissionModal && (
                <div className="absolute inset-0 z-[500] bg-black/60 backdrop-blur-sm flex justify-center p-6 overflow-y-auto no-scrollbar animate-fade-in text-white font-sans">
                    <div className="bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full my-auto shrink-0 h-fit shadow-2xl border-2 border-white/10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mb-6 border border-purple-500/30">
                            <i className="fas fa-location-slash text-3xl text-purple-400"></i>
                        </div>
                        <h3 className="text-xl font-black mb-2">{tl.locationPermissionTitle}</h3>
                        <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                            {tl.locationPermissionBody}
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={openNativeSettings} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-colors">
                                {tl.goToSettings}
                            </button>
                            <button onClick={() => setShowPermissionModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-colors">
                                {tl.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};