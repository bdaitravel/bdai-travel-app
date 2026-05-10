import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase, getUserProfileByEmail, syncUserProfile, validateEmailFormat, checkBadges, calculateTravelerRank } from '../services/supabaseClient';
import { useAppStore, GUEST_PROFILE } from '../store/useAppStore';
import { toast } from '../components/Toast';
import { UserProfile } from '../types';

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
            const profile = await getUserProfileByEmail(supabaseUser.email || '');
            if (profile) {
                const updatedProfile: UserProfile = {
                    ...profile,
                    isLoggedIn: true,
                    rank: calculateTravelerRank(profile.miles),
                    badges: (() => {
                        const existingIds = new Set((profile.badges || []).map(b => b.id));
                        const newBadges = checkBadges(profile).filter(b => !existingIds.has(b.id));
                        return [...(profile.badges || []), ...newBadges];
                    })(),
                    stats: { 
                        ...profile.stats, 
                        sessionsStarted: (profile.stats?.sessionsStarted || 0) + 1 
                    }
                };
                setUser(updatedProfile);
                if (location.pathname === '/login' || location.pathname === '/') {
                    navigate('/home');
                }
            } else {
                const newProfile: UserProfile = { 
                    ...GUEST_PROFILE, 
                    email: supabaseUser.email || '', 
                    id: supabaseUser.id, 
                    isLoggedIn: true, 
                    stats: { ...GUEST_PROFILE.stats, sessionsStarted: 1 } 
                };
                newProfile.rank = calculateTravelerRank(newProfile.miles);
                newProfile.badges = checkBadges(newProfile);
                await syncUserProfile(newProfile);
                setUser(newProfile);
                setShowOnboarding(true);
                if (location.pathname === '/login' || location.pathname === '/') {
                    navigate('/home');
                }
            }
        } catch (e) {
            console.error("Failed to load profile from Supabase", e);
            toast("Error al cargar tu perfil. Reintenta.", 'error');
        }
    };

    useEffect(() => {
        if (!autoInit) return;

        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    handleLoginSuccess(session.user);
                }
            } catch (e) { console.error("Auth init error", e); } 
            finally { setIsVerifyingSession(false); }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (session?.user) {
                handleLoginSuccess(session.user);
            } else if (_event === 'SIGNED_OUT') {
                setUser(GUEST_PROFILE);
                navigate('/login');
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

        checkAuth();
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
                    // Abrir en el InAppBrowser de Capacitor (se queda dentro de la app)
                    await Browser.open({ 
                        url: data.url,
                        presentationStyle: 'popover'
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

    const handleVerifyOtp = async () => {
        if (otpToken.length < 8) return;
        setIsLoading(true);
        setLoadingMessage("DECRYPTING ACCESS...");
        try {
            const { data, error } = await supabase.auth.verifyOtp({ 
                email, token: otpToken, type: 'email' 
            });
            if (error) throw error;
            if (data.user) {
                const profile = await getUserProfileByEmail(email);
                if (profile) {
                    setUser({ ...profile, isLoggedIn: true });
                } else {
                    const newProfile = { ...GUEST_PROFILE, email, id: data.user.id, isLoggedIn: true };
                    await syncUserProfile(newProfile);
                    setUser(newProfile);
                }
                navigate('/home');
            }
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
        handleRequestOtp, handleGoogleLogin, handleVerifyOtp
    };
};
