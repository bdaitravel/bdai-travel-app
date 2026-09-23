import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase, getUserProfileByEmail, getUserProfileById, getNextGuestUsername, syncUserProfile, queueProfileSync, flushPendingProfileSync, initProfileSyncQueue, checkBadges, calculateTravelerRank } from '../services/supabaseClient';
import { useAppStore, GUEST_PROFILE } from '../store/useAppStore';
import { toast } from '../components/Toast';
import { hapticSuccess } from '../lib/haptics';
import { UserProfile } from '../types';
import { getLastRoute } from '../lib/lastRouteStorage';
import { translations } from '../data/translations';

// URL de callback para la app nativa Android/iOS
const NATIVE_REDIRECT_URL = 'travel.bdai.app://login-callback';

// Los mensajes de loadingMessage se leen directamente del store en vez de vía useTranslation()
// porque este hook no es un componente — no puede reaccionar a un idioma que cambie mientras
// estos mensajes se muestran (son transitorios, duran segundos).
const authT = (key: string) => {
    const lang = useAppStore.getState().userProfile.language || 'es';
    return (translations[lang] || translations.en)[key] || translations.en[key] || key;
};

// URL de callback para la versión web
const WEB_REDIRECT_URL = typeof window !== 'undefined' ? window.location.origin : '';

const isNative = Capacitor.isNativePlatform();

// Recuerda qué proveedor se intentó vincular justo antes de salir al navegador — en web hay
// una recarga completa de página de por medio (no sobrevive en memoria), así que se usa
// sessionStorage. Se lee al volver para saber con qué proveedor reintentar el login normal si
// Supabase responde "identity_already_exists".
const PENDING_LINK_PROVIDER_KEY = 'bdai_pending_link_provider';

export const useAuth = (autoInit: boolean = false) => {
    const { 
        setUserProfile: setUser, 
        setIsLoading, 
        setLoadingMessage,
        setShowOnboarding
    } = useAppStore();
    
    const navigate = useNavigate();
    const location = useLocation();

    const [isVerifyingSession, setIsVerifyingSession] = useState(true);

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
                // GUEST_PROFILE.language está fijo en 'es' — sin esto, elegir otro idioma en
                // el selector de /login antes de pulsar "Explorar sin registrarte" (o Google/
                // Apple) se perdía y el perfil nuevo se creaba siempre en español. Se lee el
                // estado actual del store directamente (no vía closure/props del hook) porque
                // este listener se registra una sola vez al montar y una selección de idioma
                // hecha DESPUÉS de ese montaje no se reflejaría si se capturase por closure.
                const currentLanguage = useAppStore.getState().userProfile.language || GUEST_PROFILE.language;
                const newProfile: UserProfile = {
                    ...GUEST_PROFILE,
                    language: currentLanguage,
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

    // Cuando "Vincular" (linkIdentity) falla porque esa cuenta de Apple/Google YA es una cuenta
    // real de otro usuario (o del mismo usuario en otro dispositivo), lo correcto no es un
    // simple error — es ofrecer entrar directamente con esa cuenta existente, cargando su
    // perfil real. handleGoogleLogin/handleAppleLogin se referencian aquí aunque se declaren
    // más abajo en este mismo hook: solo se invocan de forma asíncrona (nunca durante el
    // renderizado), así que ya están asignadas para cuando realmente se llaman.
    const resolveIdentityAlreadyExists = async (provider: 'apple' | 'google' | null) => {
        if (!provider) {
            toast('Esa cuenta ya tiene un perfil creado. Vuelve a intentar vincularla e inicia sesión con ella si te lo ofrece.', 'error');
            return;
        }
        const providerLabel = provider === 'apple' ? 'Apple' : 'Google';
        const confirmed = window.confirm(
            `Esa cuenta de ${providerLabel} ya tiene un perfil creado. ¿Quieres iniciar sesión con ella para cargar tus datos? El progreso de este dispositivo que no hayas vinculado antes se perderá.`
        );
        if (!confirmed) return;
        // Cierra la sesión anónima activa ANTES de reintentar el login real — si se deja la
        // sesión anónima viva, el `signInWithOAuth` de abajo podría chocar con el token/estado
        // PKCE que la propia sesión anónima o el intento de "Vincular" fallido dejaron en
        // localStorage, dejando la app colgada en la sesión anónima sin ningún error visible.
        try { await supabase.auth.signOut(); } catch (e) { console.error('No se pudo cerrar la sesión anónima antes de reintentar:', e); }
        if (provider === 'apple') handleAppleLogin(); else handleGoogleLogin();
    };

    useEffect(() => {
        if (!autoInit) return;

        initProfileSyncQueue();

        // Vuelta de un intento de "Vincular" en la versión WEB: Supabase redirige de vuelta a
        // nuestro propio dominio con el error en la URL (query o hash) en vez de lanzar una
        // excepción de JS — aquí no hay deep link nativo que lo capture, hay que mirarlo al cargar.
        if (!isNative && typeof window !== 'undefined') {
            const raw = window.location.search + window.location.hash;
            if (raw.includes('identity_already_exists')) {
                const pendingProvider = sessionStorage.getItem(PENDING_LINK_PROVIDER_KEY) as 'apple' | 'google' | null;
                sessionStorage.removeItem(PENDING_LINK_PROVIDER_KEY);
                // Limpia la URL para no volver a disparar esto en cada recarga/navegación.
                window.history.replaceState(null, '', window.location.pathname);
                resolveIdentityAlreadyExists(pendingProvider);
            }
        }

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
                // dispositivo). Ya no se crea la cuenta anónima sola y en silencio — en vez de
                // eso se muestra /login con Google/Apple y un botón igual de visible de
                // "Explorar sin registrarte" (ver handleContinueAsGuest). Así el acceso de
                // invitado que exige Apple (Guideline 5.1.1(v)) es una acción explícita del
                // usuario y visible para un revisor, no algo que depende en silencio de que un
                // interruptor de Supabase esté bien configurado.
                //
                // Importante: hay que resetear el perfil a GUEST_PROFILE aquí también (igual
                // que en SIGNED_OUT). Si no, un perfil persistido localmente con
                // isLoggedIn:true de una sesión anterior ya inválida (revocada, expirada...)
                // se queda tal cual en el store — y la propia ruta /login usa `isLoggedIn` para
                // decidir si mostrarse o redirigir a /home, así que sin este reset el usuario
                // rebota directo a /home sin ver nunca la pantalla de elección, con un perfil
                // que parece logueado pero no tiene sesión real detrás (cualquier intento de
                // sincronizar falla en silencio, mostrando igualmente el toast de "guardado
                // localmente" porque ese aviso solo mira isLoggedIn, no la sesión real).
                setUser(GUEST_PROFILE);
                navigate('/login');
                setIsVerifyingSession(false);
            } else {
                setIsVerifyingSession(false);
            }
        });

        // --- DEEP LINK LISTENER (solo en Android/iOS nativo) ---
        // Captura el callback de OAuth (Google/Apple) y lo procesa dentro de la app
        let deepLinkCleanup: (() => void) | null = null;
        if (isNative) {
            const handleDeepLink = async ({ url }: { url: string }) => {
                // Cerrar el browser in-app si está abierto (viene del flujo Google OAuth)
                try { await Browser.close(); } catch (_) {}

                // Supabase inserta el token en el hash o como query param
                if (url.includes('login-callback')) {
                    // Vuelta de un "Vincular" fallido porque esa cuenta ya es real (ver el
                    // equivalente web más arriba, para la misma situación sin deep link nativo).
                    if (url.includes('identity_already_exists')) {
                        const pendingProvider = sessionStorage.getItem(PENDING_LINK_PROVIDER_KEY) as 'apple' | 'google' | null;
                        sessionStorage.removeItem(PENDING_LINK_PROVIDER_KEY);
                        resolveIdentityAlreadyExists(pendingProvider);
                        return;
                    }

                    // Convertir la URL nativa al formato que Supabase puede procesar
                    // travel.bdai.app://login-callback#access_token=... → https://x#access_token=...
                    const normalized = url
                        .replace('travel.bdai.app://login-callback', window.location.origin)
                        .replace('travel.bdai.app://login-callback', `${window.location.origin}/login`);

                    try {
                        // El cliente de Supabase usa el flujo 'implicit' por defecto (nunca se
                        // configuró flowType: 'pkce'), así que Google/Apple en nativo devuelven
                        // el token directamente en el fragmento (#access_token=...), no un
                        // 'code='. Hay que comprobar AMBOS casos, no solo PKCE.
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

                            // Flujo implicit (el que realmente usa Google/Apple aquí, y el que
                            // usaba el magic link que ya no existe): la sesión viene completa en
                            // el fragmento, solo hay que dársela al cliente con setSession.
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

            // 'appUrlOpen' solo cubre el caso de la app ya viva en segundo plano. Si Android
            // mató el proceso mientras el usuario estaba en el navegador externo (Custom Tab)
            // eligiendo su cuenta de Google/Apple —muy probable en el flujo de reintento tras
            // "identity_already_exists", que tarda más que un login directo (cerrar navegador +
            // diálogo de confirmación + signOut + reabrir navegador)—, el deep link de vuelta
            // relanza la app desde cero y nunca dispara 'appUrlOpen'. Sin este chequeo, ese
            // arranque en frío se perdía en silencio: la app volvía a /login o a la sesión
            // anónima anterior sin procesar nunca el code de la cuenta real.
            App.getLaunchUrl().then(result => {
                if (result?.url) {
                    handleDeepLink({ url: result.url });
                }
            }).catch(e => console.error('No se pudo leer la URL de arranque:', e));
        }

        return () => {
            subscription.unsubscribe();
            if (deepLinkCleanup) deepLinkCleanup();
        };
    }, []);

    // Disparado a mano desde el botón "Explorar sin registrarte" de /login — antes esto se
    // llamaba solo en el primer arranque sin sesión (ver el efecto de arriba); ahora es una
    // acción explícita del usuario, no algo automático en silencio.
    const handleContinueAsGuest = async (captchaToken?: string) => {
        setIsLoading(true);
        setLoadingMessage(authT('enteringAsGuest'));
        try {
            const { error } = await supabase.auth.signInAnonymously(
                captchaToken ? { options: { captchaToken } } : undefined
            );
            if (error) throw error;
            // onAuthStateChange('SIGNED_IN') dispara handleLoginSuccess, que crea el perfil y navega.
        } catch (e: any) {
            toast(e.message || "No se pudo continuar sin cuenta. Reintenta.", 'error');
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setLoadingMessage(authT('connectingToGoogle'));
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
        setLoadingMessage(authT('connectingToApple'));
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
        setLoadingMessage(`${authT('linkingPrefix')} ${provider.toUpperCase()}...`);
        // Se guarda ANTES de salir al navegador — en web hay una recarga completa de página al
        // volver, así que no sobrevive nada en memoria; sessionStorage sí.
        sessionStorage.setItem(PENDING_LINK_PROVIDER_KEY, provider);
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

    return {
        isVerifyingSession,
        handleGoogleLogin, handleAppleLogin,
        handleLinkApple, handleLinkGoogle, handleContinueAsGuest
    };
};
