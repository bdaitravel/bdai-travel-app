import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase, getUserProfileByEmail, getUserProfileById, getNextGuestUsername, syncUserProfile, queueProfileSync, flushPendingProfileSync, initProfileSyncQueue, validateEmailFormat, checkBadges, calculateTravelerRank } from '../services/supabaseClient';
import { useAppStore, GUEST_PROFILE } from '../store/useAppStore';
import { toast } from '../components/Toast';
import { hapticSuccess } from '../lib/haptics';
import { UserProfile } from '../types';
import { getLastRoute } from '../lib/lastRouteStorage';

// URL de callback para la app nativa Android/iOS
const NATIVE_REDIRECT_URL = 'travel.bdai.app://login-callback';

// URL de callback para la versión web
const WEB_REDIRECT_URL = typeof window !== 'undefined' ? window.location.origin : '';

const isNative = Capacitor.isNativePlatform();

export const useAuth = (autoInit: boolean = false) => {
    const { 
        setUserProfile: setUser, 
        setIsLoading, 
        setLoadingMessage,
        setShowOnboarding
    } = useAppStore();
    
    const navigate = useNavigate();
    const location = useLocation();

    const [loginPhase, setLoginPhase] = useState<'EMAIL' | 'OTP'>('EMAIL');
    const [isVerifyingSession, setIsVerifyingSession] = useState(true);
    const [email, setEmail] = useState('');
    const [otpToken, setOtpToken] = useState('');

    const handleLoginSuccess = async (supabaseUser: any) => {
        try {
            // Empujar primero cualquier cambio pendiente de una sesión anterior (app cerrada
            // antes de sincronizar) para que el pull de perfil que sigue no lo pise.
            await flushPendingProfileSync();

            // Sesión anónima (Guideline 5.1.1(v) de Apple: se crea sola al primer arranque, sin
            // email ni ningún dato personal — así el usuario nunca ve una pantalla de registro
            // obligatoria para acceder a los tours).
            const isAnonymous = !!supabaseUser.is_anonymous;

            // Buscar SIEMPRE primero por id (nunca cambia, ni al vincular Apple/Google a una
            // sesión anónima — Supabase mantiene el mismo user.id, solo añade la identidad).
            // Importante: justo tras vincular, el evento SIGNED_IN llega con is_anonymous=false
            // y el email ya relleno — si aquí se buscara por email en vez de por id, no
            // encontraría la fila anónima existente (su email en Supabase aún es null hasta que
            // se sincronice) y se crearía un perfil nuevo vacío, perdiendo millas/medallas/tours.
            let profile = await getUserProfileById(supabaseUser.id);

            if (!profile && !isAnonymous) {
                // Red de seguridad para logins reales (email/Apple/Google): un hipo de red o una
                // propagación lenta del JWT justo tras el login pueden devolver un falso negativo
                // en la búsqueda por id. Tratarlo como alta nueva de forma prematura resetearía
                // el perfil real a los valores por defecto y volvería a mostrar la bienvenida a
                // un usuario existente. (No aplica a anónimas: su id es nuevo de verdad.)
                profile = await getUserProfileByEmail(supabaseUser.email || '');
                if (!profile) {
                    await new Promise(resolve => setTimeout(resolve, 700));
                    profile = await getUserProfileByEmail(supabaseUser.email || '');
                }
            }
            if (profile) {
                const updatedProfile: UserProfile = {
                    ...profile,
                    isLoggedIn: true,
                    isAnonymous,
                    rank: calculateTravelerRank(profile.miles),
                    badges: (() => {
                        const existingIds = new Set((profile.badges || []).map(b => b.id));
                        const newBadges = checkBadges(profile).filter(b => !existingIds.has(b.id));
                        if (newBadges.length > 0) hapticSuccess();
                        return [...(profile.badges || []), ...newBadges];
                    })(),
                    stats: {
                        ...profile.stats,
                        sessionsStarted: (profile.stats?.sessionsStarted || 0) + 1
                    }
                };
                setUser(updatedProfile);
                // Persistir el rango/insignias/sesión recalculados en el login (antes se quedaban solo en local).
                queueProfileSync(updatedProfile);
                if (location.pathname === '/login' || location.pathname === '/') {
                    // Si Android mató el proceso, restaurar la pantalla en la que estaba
                    // (tienda, pasaporte, clasificación, tour...), no solo /home.
                    const savedRoute = await getLastRoute();
                    navigate(savedRoute || '/home');
                }
            } else {
                // Username único garantizado por secuencia en Postgres — reemplaza el
                // 'traveler' fijo de GUEST_PROFILE, que chocaría entre sí en cuanto hubiera
                // más de un usuario nuevo (anónimo o real).
                const defaultUsername = await getNextGuestUsername();
                const newProfile: UserProfile = {
                    ...GUEST_PROFILE,
                    email: supabaseUser.email || '',
                    id: supabaseUser.id,
                    username: defaultUsername,
                    isLoggedIn: true,
                    isAnonymous,
                    stats: { ...GUEST_PROFILE.stats, sessionsStarted: 1 }
                };
                newProfile.rank = calculateTravelerRank(newProfile.miles);
                newProfile.badges = checkBadges(newProfile);
                await syncUserProfile(newProfile);
                setUser(newProfile);
                setShowOnboarding(true);
                if (location.pathname === '/login' || location.pathname === '/') {
                    navigate('/home'); // Usuarios nuevos siempre al home
                }
            }
        } catch (e) {
            console.error("Failed to load profile from Supabase", e);
            toast("Error al cargar tu perfil. Reintenta.", 'error');
        }
    };

    useEffect(() => {
        if (!autoInit) return;

        initProfileSyncQueue();

        // `onAuthStateChange` ya emite un evento `INITIAL_SESSION` con la sesión actual justo
        // al suscribirse, así que no hace falta un `getSession()` manual aparte: antes se
        // duplicaba la consulta del perfil (una desde aquí y otra desde el propio evento) en
        // cada arranque en frío, gastando red/batería por nada.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            // Solo recargar el perfil desde Supabase en un login real. `TOKEN_REFRESHED`
            // ocurre cada ~1h con la sesión activa y, si no se filtra, machaca con el perfil
            // remoto cualquier edición local que aún no se haya sincronizado.
            if (session?.user && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION')) {
                handleLoginSuccess(session.user).finally(() => setIsVerifyingSession(false));
            } else if (_event === 'SIGNED_OUT') {
                setUser(GUEST_PROFILE);
                navigate('/login');
                setIsVerifyingSession(false);
            } else if (_event === 'INITIAL_SESSION' && !session) {
                // Primer arranque real (nunca hubo sesión, ni siquiera anónima, en este
                // dispositivo). En vez de forzar login, se crea sola una sesión anónima
                // (Guideline 5.1.1(v) de Apple): el 'SIGNED_IN' que dispara esto vuelve a
                // entrar por la rama de arriba y llama a handleLoginSuccess con
                // is_anonymous=true. Si falla (ej. sin red, o el proveedor anónimo no está
                // habilitado en Supabase), se cae de vuelta a la pantalla de login manual.
                supabase.auth.signInAnonymously().then(({ error }) => {
                    if (error) {
                        console.error('No se pudo iniciar sesión anónima:', error);
                        setIsVerifyingSession(false);
                    }
                });
            } else {
                setIsVerifyingSession(false);
            }
        });

        // --- DEEP LINK LISTENER (solo en Android/iOS nativo) ---
        // Captura el callback de OAuth/Magic Link y lo procesa dentro de la app
        let deepLinkCleanup: (() => void) | null = null;
        if (isNative) {
            const handleDeepLink = async ({ url }: { url: string }) => {
                // Cerrar el browser in-app si está abierto (viene del flujo Google OAuth)
                try { await Browser.close(); } catch (_) {}

                // Supabase inserta el token en el hash o como query param
                if (url.includes('login-callback')) {
                    // Convertir la URL nativa al formato que Supabase puede procesar
                    // travel.bdai.app://login-callback#access_token=... → https://x#access_token=...
                    const normalized = url
                        .replace('travel.bdai.app://login-callback', window.location.origin)
                        .replace('travel.bdai.app://login-callback', `${window.location.origin}/login`);
                    
                    try {
                        // Para PKCE flow (OAuth Google): exchange code for session
                        const hashOrSearch = url.includes('code=') 
                            ? url.split('?')[1] 
                            : url.split('#')[1];

                        if (hashOrSearch) {
                            const params = new URLSearchParams(hashOrSearch);
                            const code = params.get('code');
                            if (code) {
                                const { error } = await supabase.auth.exchangeCodeForSession(code);
                                if (error) throw error;
                                // onAuthStateChange se dispara y llama a handleLoginSuccess
                                return;
                            }
                            
                            // Para implicit flow (magic link): set session directamente
                            const accessToken = params.get('access_token');
                            const refreshToken = params.get('refresh_token');
                            if (accessToken && refreshToken) {
                                const { error } = await supabase.auth.setSession({ 
                                    access_token: accessToken, 
                                    refresh_token: refreshToken 
                                });
                                if (error) throw error;
                                // onAuthStateChange se dispara y llama a handleLoginSuccess
                                return;
                            }
                        }
                    } catch (e) {
                        console.error('Deep link auth error:', e);
                        toast('Error al completar el login. Reintenta.', 'error');
                    }
                }
            };

            App.addListener('appUrlOpen', handleDeepLink).then(handle => {
                deepLinkCleanup = () => handle.remove();
            });
        }

        return () => {
            subscription.unsubscribe();
            if (deepLinkCleanup) deepLinkCleanup();
        };
    }, []);

    const handleRequestOtp = async () => {
        if (!validateEmailFormat(email)) { toast("Introduce un email válido.", 'error'); return; }
        setIsLoading(true);
        setLoadingMessage("REQUESTING KEY...");
        try {
            const { error } = await supabase.auth.signInWithOtp({ 
                email,
                options: { 
                    // En nativo usamos el deep link para que el enlace del email abra la app
                    // En web usamos la URL normal
                    emailRedirectTo: isNative ? NATIVE_REDIRECT_URL : WEB_REDIRECT_URL
                }
            });
            if (error) throw error;
            setLoginPhase('OTP');
        } catch (e: any) { 
            toast(e.message || "No se pudo enviar el código.", 'error'); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setLoadingMessage("CONNECTING TO GOOGLE...");
        try {
            if (isNative) {
                // En nativo: obtener la URL OAuth sin redirigir automáticamente
                // y abrirla en el InAppBrowser de Capacitor (no en Chrome)
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { 
                        redirectTo: NATIVE_REDIRECT_URL,
                        skipBrowserRedirect: true,  // ← no abre Chrome automáticamente
                    }
                });
                if (error) throw error;
                if (data.url) {
                    setIsLoading(false);
                    // Abrir en el InAppBrowser de Capacitor (se queda dentro de la app).
                    // 'fullscreen' en vez de 'popover': en iPad, 'popover' requiere un ancla
                    // (width/height/sourceView) para su UIPopoverPresentationController — sin
                    // ella el navegador no llega a presentarse y el login se queda colgado.
                    await Browser.open({
                        url: data.url,
                        presentationStyle: 'fullscreen'
                    });
                }
            } else {
                // En web: comportamiento estándar (redirige a Google y vuelve)
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: WEB_REDIRECT_URL }
                });
                if (error) throw error;
            }
        } catch (e: any) {
            toast(e.message || "Error al conectar con Google.", 'error');
            setIsLoading(false);
        }
    };

    // Mismo mecanismo que handleGoogleLogin (proveedor OAuth de Supabase +
    // InAppBrowser de Capacitor + deep link de vuelta) — Apple ya está
    // habilitado como proveedor en Supabase Dashboard (Services ID + clave
    // configurados por el usuario, fuera del alcance de este repositorio).
    const handleAppleLogin = async () => {
        setIsLoading(true);
        setLoadingMessage("CONNECTING TO APPLE...");
        try {
            if (isNative) {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'apple',
                    options: {
                        redirectTo: NATIVE_REDIRECT_URL,
                        skipBrowserRedirect: true,
                    }
                });
                if (error) throw error;
                if (data.url) {
                    setIsLoading(false);
                    // 'fullscreen' por el mismo motivo que en handleGoogleLogin (ver comentario ahí).
                    await Browser.open({
                        url: data.url,
                        presentationStyle: 'fullscreen'
                    });
                }
            } else {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'apple',
                    options: { redirectTo: WEB_REDIRECT_URL }
                });
                if (error) throw error;
            }
        } catch (e: any) {
            toast(e.message || "Error al conectar con Apple.", 'error');
            setIsLoading(false);
        }
    };

    // Sube de categoría la sesión anónima activa a una cuenta real, sin perder el historial:
    // Supabase añade la identidad de Apple/Google a la MISMA fila (mismo user.id), no crea una
    // nueva. Si ese email/Apple ID ya tiene una cuenta en otro dispositivo, Supabase devuelve
    // error (no se puede "fusionar" dos historiales distintos) — se informa al usuario.
    const handleLinkIdentity = async (provider: 'apple' | 'google') => {
        setIsLoading(true);
        setLoadingMessage(`LINKING ${provider.toUpperCase()}...`);
        try {
            const { data, error } = await supabase.auth.linkIdentity({
                provider,
                options: {
                    redirectTo: isNative ? NATIVE_REDIRECT_URL : WEB_REDIRECT_URL,
                    skipBrowserRedirect: true,
                }
            });
            if (error) throw error;
            if (data?.url) {
                if (isNative) {
                    setIsLoading(false);
                    await Browser.open({ url: data.url, presentationStyle: 'fullscreen' });
                } else {
                    window.location.assign(data.url);
                }
            }
        } catch (e: any) {
            toast(e.message || `No se pudo vincular con ${provider}. Puede que ya tengas una cuenta con ese ${provider === 'apple' ? 'Apple ID' : 'email de Google'} — inicia sesión con ella en su lugar.`, 'error');
            setIsLoading(false);
        }
    };

    const handleLinkApple = () => handleLinkIdentity('apple');
    const handleLinkGoogle = () => handleLinkIdentity('google');

    const handleVerifyOtp = async () => {
        if (otpToken.length < 8) return;
        setIsLoading(true);
        setLoadingMessage("DECRYPTING ACCESS...");
        try {
            const { error } = await supabase.auth.verifyOtp({
                email, token: otpToken, type: 'email'
            });
            if (error) throw error;
            // No se toca el perfil aquí: verifyOtp deja la sesión activa, lo que dispara
            // onAuthStateChange('SIGNED_IN') → handleLoginSuccess, que carga/crea el perfil,
            // recalcula rank/badges y navega. Antes esta función duplicaba esa lógica de forma
            // inconsistente (sin recalcular rank/badges) y competía con el propio listener.
        } catch (e: any) {
            toast(e.message || "Código inválido o expirado.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        loginPhase, setLoginPhase,
        email, setEmail,
        otpToken, setOtpToken,
        isVerifyingSession,
        handleRequestOtp, handleGoogleLogin, handleAppleLogin, handleVerifyOtp,
        handleLinkApple, handleLinkGoogle
    };
};
