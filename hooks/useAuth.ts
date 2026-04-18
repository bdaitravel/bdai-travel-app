import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, getUserProfileByEmail, syncUserProfile, validateEmailFormat, checkBadges, calculateTravelerRank } from '../services/supabaseClient';
import { useAppStore, GUEST_PROFILE } from '../store/useAppStore';
import { toast } from '../components/Toast';
import { UserProfile } from '../types';

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

        checkAuth();
        return () => { subscription.unsubscribe(); };
    }, []);

    const handleRequestOtp = async () => {
        if (!validateEmailFormat(email)) { toast("Introduce un email válido.", 'error'); return; }
        setIsLoading(true);
        setLoadingMessage("REQUESTING KEY...");
        try {
            const { error } = await supabase.auth.signInWithOtp({ 
                email,
                options: { emailRedirectTo: window.location.origin }
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
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin, skipBrowserRedirect: true }
            });
            if (error) throw error;
            if (data?.url) window.open(data.url, '_blank', 'width=500,height=600');
        } catch (e: any) {
            toast(e.message || "Error al conectar con Google.", 'error');
        } finally { 
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
