import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES, APP_BADGES } from './types';
import { generateToursForCity, normalizeCityWithAI } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop';
import { TravelServices, formatCityName } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo';
import { AdminPanel } from './components/AdminPanel';
import { Onboarding } from './components/Onboarding';
import { VisaShare } from './components/VisaShare';
import { LegalModal } from './components/LegalModal';
import { Community } from './components/Community';
import { ToastContainer } from './components/ToastSystem';
import { translations } from './data/translations';
import { showToast, handleGeminiError, handleSupabaseError, initGlobalErrorHandler } from './services/errorService';
import { isOnline, onConnectivityChange, saveTourOffline, getOfflineTours } from './services/offlineService';
import { calculateTravelerRank, checkBadges } from './services/gamificationService';
import {
  supabase,
  getUserProfileByEmail,
  getGlobalRanking,
  syncUserProfile,
  validateEmailFormat,
  normalizeKey,
} from './services/supabaseClient';

declare global {
  interface Window {
    aistudio: { hasSelectedApiKey: () => Promise<boolean>; openSelectKey: () => Promise<void>; };
  }
}

const GUEST_PROFILE: UserProfile = {
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler',
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  email: '', language: 'es', miles: 0, rank: 'ZERO',
  culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0,
  interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25,
  stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 },
  visitedCities: [], completedTours: [], badges: [], stamps: [], capturedMoments: []
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-purple-500 scale-105' : 'text-slate-500 opacity-40'}`}>
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[7px] font-black uppercase tracking-widest text-center truncate w-full">{label}</span>
  </button>
);

// Init global error handler once
initGlobalErrorHandler();

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [showCommunity, setShowCommunity] = useState(false);
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  // Restore last city on mount so it never disappears
  useEffect(() => {
    try {
      const savedCity  = localStorage.getItem('bdai_last_city');
      const savedTours = localStorage.getItem('bdai_last_tours');
      if (savedCity)  { const c = JSON.parse(savedCity);  setSelectedCity(c.name); setSelectedCountry(c.country); setSelectedCountryEn(c.countryEn); setSelectedCitySlug(c.slug); }
      if (savedTours) { setTours(JSON.parse(savedTours)); }
    } catch (_) {}
  }, []);

  const [online, setOnline] = useState(isOnline());
  useEffect(() => onConnectivityChange(setOnline), []);

  const navigateTo = useCallback((newView: AppView, pushState = true) => {
    if (pushState) window.history.pushState({ view: newView }, '', '');
    setView(newView);
  }, []);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      setVisaToShare(null);
      setIsLoading(false);
      window.dispatchEvent(new CustomEvent('bdai-stop-audio'));
      setView(e.state?.view || AppView.HOME);
    };
    window.addEventListener('popstate', handlePopState);
    if (!window.history.state?.view) window.history.replaceState({ view: AppView.LOGIN }, '', '');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [loginPhase, setLoginPhase] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncingLang, setIsSyncingLang] = useState(false);
  const [searchOptions, setSearchOptions] = useState<any[] | null>(null);
  const [user, setUser] = useState<UserProfile>(GUEST_PROFILE);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [visaToShare, setVisaToShare] = useState<{ cityName: string; miles: number } | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCountryEn, setSelectedCountryEn] = useState<string | null>(null);
  const [selectedCitySlug, setSelectedCitySlug] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  const t = useCallback((key: string) => {
    const lang = user.language || 'es';
    const dict = translations[lang] || translations['en'];
    return dict[key] || translations['en']?.[key] || key;
  }, [user.language]);

  // ─── AUTH ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
          }
        }
        if (session?.user) {
          handleLoginSuccess(session.user);
        } else {
          const saved = localStorage.getItem('bdai_profile');
          if (saved) {
            try { setUser(prev => ({ ...prev, language: JSON.parse(saved).language || 'es' })); } catch {}
          }
        }
      } catch (e) { console.error("Auth init:", e); } finally { setIsVerifyingSession(false); }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) { handleLoginSuccess(session.user); }
      else if (_event === 'SIGNED_OUT') { setUser(GUEST_PROFILE); navigateTo(AppView.LOGIN); }
    });

    checkAuth();
    getGlobalRanking().then(setLeaderboard).catch(() => {});
    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = async (supabaseUser: any) => {
    try {
      const profile = await getUserProfileByEmail(supabaseUser.email || '');
      if (profile) {
        const badgeIds = checkBadges(profile);
        const resolvedBadges = APP_BADGES.filter(b => badgeIds.includes(b.id));
        const updated = {
          ...profile,
          rank: calculateTravelerRank(profile.miles),
          badges: resolvedBadges,
          stats: { ...profile.stats, sessionsStarted: (profile.stats?.sessionsStarted || 0) + 1 }
        };
        setUser({ ...updated, isLoggedIn: true });
        localStorage.setItem('bdai_profile', JSON.stringify({ ...updated, isLoggedIn: true }));
        if (updated.stats.sessionsStarted <= 1) setShowOnboarding(true);
      } else {
        const newProfile = {
          ...GUEST_PROFILE,
          email: supabaseUser.email || '',
          id: supabaseUser.id,
          isLoggedIn: true,
          stats: { ...GUEST_PROFILE.stats, sessionsStarted: 1 }
        };
        newProfile.rank = calculateTravelerRank(0);
        await syncUserProfile(newProfile);
        setUser(newProfile);
        setShowOnboarding(true);
      }
      if (viewRef.current === AppView.LOGIN) navigateTo(AppView.HOME);
    } catch (e) { handleSupabaseError(e, 'login'); }
  };

  // ─── GPS ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => { if (err.code !== 3) console.debug(`GPS: ${err.message}`); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  const handleRequestOtp = async () => {
    if (isLoading) return;
    if (!validateEmailFormat(email)) { showToast.warning('Email inválido', 'Introduce un email válido.'); return; }
    setIsLoading(true); setLoadingMessage("SOLICITANDO CLAVE...");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: "https://www.bdai.travel" } });
      if (error) throw error;
      setLoginPhase('OTP');
      showToast.success('Código enviado 📬', `Revisa ${email}`);
    } catch (e: any) { handleSupabaseError(e, 'otp-request'); } finally { setIsLoading(false); }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true); setLoadingMessage("CONECTANDO CON GOOGLE...");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: "https://www.bdai.travel" }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) { handleSupabaseError(e, 'google-login'); setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (isLoading || otpToken.length < 8) return;
    setIsLoading(true); setLoadingMessage("VERIFICANDO...");
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otpToken, type: 'email' });
      if (error) throw error;
      if (!data.user) showToast.error('Código incorrecto', 'Inténtalo de nuevo.');
      // onAuthStateChange will handle the rest
    } catch (e: any) { handleSupabaseError(e, 'otp-verify'); } finally { setIsLoading(false); }
  };

  // ─── CITY SELECTION ───────────────────────────────────────────────────────

  const processCitySelection = async (selection: any, langCode: string, forceRefresh = false) => {
    setIsLoading(true); setSearchOptions(null); setSearchVal('');
    const cleanName = selection.name?.split(',')[0].trim() || selection.city;
    setSelectedCity(cleanName);
    setSelectedCountry(selection.country);
    setSelectedCountryEn(selection.countryEn || selection.country);
    const slug = normalizeKey(cleanName, selection.countryEn || selection.country);
    setSelectedCitySlug(slug);
    // Persist city so it survives tab changes and back navigation
    try {
      localStorage.setItem('bdai_last_city', JSON.stringify({
        name: cleanName, country: selection.country,
        countryEn: selection.countryEn || selection.country,
        countryCode: selection.countryCode, slug
      }));
    } catch (_) {}

    try {
      if (forceRefresh) {
        setLoadingMessage("DAI REESCRIBIENDO HISTORIA...");
        await supabase.from('tours_cache').delete().eq('city', slug).eq('language', langCode.toLowerCase());
      } else {
        setTours([]);
        // Check Supabase cache first
        const { data: cached, error } = await supabase
          .from('tours_cache').select('data')
          .eq('city', slug).eq('language', langCode.toLowerCase())
          .maybeSingle();

        if (!error && cached?.data?.length > 0) {
          setTours(cached.data);
          navigateTo(AppView.CITY_DETAIL);
          setIsLoading(false);
          // Also save offline
          saveTourOffline(slug, langCode, cleanName, selection.country, cached.data).catch(() => {});
          return;
        }

        // Check offline cache
        const offlineTours = await getOfflineTours(slug, langCode);
        if (offlineTours && offlineTours.length > 0) {
          setTours(offlineTours);
          navigateTo(AppView.CITY_DETAIL);
          setIsLoading(false);
          if (!online) showToast.info('Modo offline 📡', 'Mostrando tours guardados.');
          return;
        }
      }

      if (!online) {
        showToast.warning('Sin conexión', 'No hay tours guardados para esta ciudad.');
        setIsLoading(false);
        return;
      }

      setTours([]);
      setLoadingMessage("DAI PREPARANDO TU AVENTURA...");
      let firstArrived = false;

      const generated = await generateToursForCity(
        cleanName,
        selection.countryEn || selection.country,
        { ...user, language: langCode } as UserProfile,
        (tour) => {
          setTours(prev => [...prev, tour]);
          if (!firstArrived) {
            firstArrived = true;
            setIsLoading(false);
            // Navigate silently — no message, no "listo"
            if (viewRef.current === AppView.HOME || forceRefresh) navigateTo(AppView.CITY_DETAIL);
          }
        }
      );

      if (generated.length > 0) {
        // Save to localStorage for instant restore
        try { localStorage.setItem('bdai_last_tours', JSON.stringify(generated)); } catch (_) {}
        // Save to Supabase cache
        supabase.from('tours_cache').upsert(
          { city: slug, language: langCode.toLowerCase(), data: generated },
          { onConflict: 'city,language' }
        ).catch((e: any) => handleSupabaseError(e, 'tours-cache-save'));
        // Save offline
        saveTourOffline(slug, langCode, cleanName, selection.country, generated).catch(() => {});
      } else {
        showToast.error('Sin resultados', t('errorGeneratingTours') || 'No se pudieron generar los tours.');
      }
    } catch (e: any) {
      handleGeminiError(e, () => processCitySelection(selection, langCode, forceRefresh));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitySearch = async (val: string) => {
    setSearchVal(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.length < 3) { setSearchOptions(null); return; }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const aiResults = await normalizeCityWithAI(val, user.language);
        setSearchOptions(aiResults.map((r: any) => ({
          name: r.city, city: r.city, country: r.country,
          countryEn: r.countryEn, countryCode: r.countryCode,
          slug: normalizeKey(r.city, r.countryEn || r.country),
          fullName: r.city
        })));
      } catch (e) {
        handleGeminiError(e);
      } finally { setIsSearching(false); }
    }, 600);
  };

  const handleLangChange = (code: string) => {
    setIsSyncingLang(code !== user.language);
    const updated = { ...user, language: code };
    setUser(updated);
    localStorage.setItem('bdai_profile', JSON.stringify(updated));
    if (user.isLoggedIn) syncUserProfile(updated).catch(() => {});
    setTours([]);
    setTimeout(() => setIsSyncingLang(false), 500);
  };

  const updateUserAndSync = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('bdai_profile', JSON.stringify(updated));
    if (updated.isLoggedIn) syncUserProfile(updated).catch(e => handleSupabaseError(e, 'profile-sync'));
  };

  if (isVerifyingSession) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center">
        <BdaiLogo className="w-16 h-16 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-transparent flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">

      {/* Toast notifications */}
      <ToastContainer />

      {/* Offline banner */}
      {!online && (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-yellow-500/90 backdrop-blur-sm py-2 px-4 flex items-center justify-center gap-2">
          <i className="fas fa-wifi-slash text-yellow-900 text-xs"></i>
          <span className="text-yellow-900 font-black text-[9px] uppercase tracking-widest">Modo offline — mostrando contenido guardado</span>
        </div>
      )}

      {/* Loading overlay */}
      {(isLoading || isSyncingLang) && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-fade-in">
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/40 animate-pulse mb-6 border-4 border-white/20">
            <i className="fas fa-brain text-3xl text-white"></i>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></div>
            <p className="text-white font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">
              {isSyncingLang ? "traduciendo interfaz..." : (loadingMessage || "sincronizando...")}
            </p>
          </div>
        </div>
      )}

      {/* Legal modal */}
      {showLegal && <LegalModal user={user} onClose={() => setShowLegal(false)} language={user.language} />}

      {view === AppView.LOGIN ? (
        <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617]">
          <div className="text-center flex flex-col items-center mb-10 mt-[-15dvh] animate-fade-in">
            <BdaiLogo className="w-32 h-32 mb-4 animate-pulse-logo" />
            <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 leading-none">bdai</h1>
            <p className="text-[10px] font-medium text-purple-400 mt-2 lowercase opacity-80">better destinations by ai</p>
          </div>

          {loginPhase === 'EMAIL' ? (
            <div className="w-full max-w-[280px] space-y-4 animate-fade-in">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading}
                className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-center text-white outline-none text-sm font-medium placeholder-slate-700 shadow-inner focus:border-purple-500/50 transition-all"
                placeholder={t('emailPlaceholder')} onKeyDown={e => e.key === 'Enter' && handleRequestOtp()} />
              <button onClick={handleRequestOtp} disabled={isLoading}
                className="w-full h-14 bg-white text-slate-950 rounded-2xl font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
                {t('requestAccess')}
              </button>
              <div className="flex items-center gap-4 py-1">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">{t('socialAccess')}</span>
                <div className="h-px bg-white/5 flex-1"></div>
              </div>
              <button onClick={handleGoogleLogin} disabled={isLoading}
                className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-2xl font-black lowercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <i className="fab fa-google text-[10px] text-purple-400"></i> google
              </button>
              <button onClick={() => setShowLegal(true)}
                className="w-full text-center text-[9px] text-slate-600 hover:text-slate-400 transition-colors mt-2">
                Términos · Privacidad · GDPR
              </button>
            </div>
          ) : (
            <div className="w-full max-w-[280px] space-y-6 animate-fade-in">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('enterCode')}</p>
                <p className="text-[10px] font-bold text-purple-400/80 truncate">{email}</p>
              </div>
              <input type="text" maxLength={8} value={otpToken} onChange={e => setOtpToken(e.target.value)}
                disabled={isLoading} onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-center text-white outline-none text-2xl font-black tracking-[0.5em] shadow-inner focus:border-purple-500/50 transition-all"
                placeholder="00000000" />
              <div className="flex gap-2">
                <button onClick={() => setLoginPhase('EMAIL')} disabled={isLoading}
                  className="flex-1 h-14 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black lowercase text-[10px] tracking-widest disabled:opacity-50">
                  {t('back')}
                </button>
                <button onClick={handleVerifyOtp} disabled={otpToken.length < 8 || isLoading}
                  className="flex-[2] h-14 bg-purple-600 text-white rounded-2xl font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30">
                  {t('verifyCode')}
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-10 left-0 right-0 px-8 flex flex-col items-center gap-3">
            <div className="relative">
              <select value={user.language} onChange={e => handleLangChange(e.target.value)} disabled={isLoading}
                className="appearance-none bg-white/5 border border-white/10 rounded-full px-6 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-pointer pr-10">
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">{lang.flag} {lang.name}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[7px] text-slate-600 pointer-events-none"></i>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative h-full">
          <div className={`flex-1 overflow-y-auto no-scrollbar relative ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-36'}`}>

            {/* ── HOME ─────────────────────────────────────────────────────── */}
            {view === AppView.HOME && (
              <div className="space-y-6 pt-safe-iphone max-w-md mx-auto animate-fade-in">
                <header className="flex justify-between items-center py-4 px-6">
                  <div className="flex items-center gap-3">
                    <BdaiLogo className="w-8 h-8" />
                    <span className="font-black text-xl tracking-tighter lowercase">bdai</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowOnboarding(true)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                      <i className="fas fa-question text-[10px]"></i>
                    </button>
                    <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-2 border border-white/5">
                      <i className="fas fa-coins text-yellow-500"></i>{user.miles.toLocaleString()}
                    </div>
                  </div>
                </header>

                <div className="py-10 px-6 text-center flex flex-col items-center">
                  <BdaiLogo className="w-32 h-32 mb-6 animate-pulse-logo" />
                  <h1 className="text-8xl font-black text-white lowercase tracking-tighter leading-none">bdai</h1>
                  <p className="text-[11px] font-medium text-purple-400 mt-2 lowercase opacity-80 mb-10">better destinations by ai</p>

                  <div className="w-full relative">
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 flex items-center justify-between shadow-inner focus-within:border-purple-500/40 transition-all">
                        <input type="text" value={searchVal} onChange={e => handleCitySearch(e.target.value)}
                          placeholder={t('searchPlaceholder')}
                          onKeyDown={e => { if (e.key === 'Escape') setSearchOptions(null); }}
                          className="bg-transparent border-none outline-none w-full text-white font-bold text-sm" />
                        {isSearching && <i className="fas fa-spinner fa-spin text-purple-500 text-xs"></i>}
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                        <i className="fas fa-search"></i>
                      </div>
                    </div>

                    {searchOptions && searchOptions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-4 space-y-2 bg-[#0a0f1e]/98 backdrop-blur-3xl border border-white/5 p-3 rounded-[2rem] shadow-2xl animate-slide-up z-[1001]">
                        {searchOptions.map((opt, i) => (
                          <button key={i} onClick={() => processCitySelection(opt, user.language)}
                            className="w-full p-4 bg-white/[0.03] rounded-xl flex items-center justify-between border border-white/5 active:bg-purple-600/10 transition-all text-left">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                {opt.countryCode
                                  ? <img src={`https://flagsapi.com/${opt.countryCode}/flat/64.png`} alt={opt.country} className="w-full h-full object-cover" />
                                  : <i className="fas fa-globe text-slate-500 text-xs"></i>}
                              </div>
                              <div className="truncate">
                                <span className="text-white font-black uppercase text-[11px] block">{opt.fullName}</span>
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{opt.country}</span>
                              </div>
                            </div>
                            <i className="fas fa-chevron-right text-[9px] text-purple-500/40"></i>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <TravelServices mode="HOME" lang={user.language}
                  onCitySelect={(name: string, country?: string) => processCitySelection({ name, city: name, country, countryEn: country }, user.language)} />
              </div>
            )}

            {/* ── CITY DETAIL ──────────────────────────────────────────────── */}
            {view === AppView.CITY_DETAIL && (
              <div className="pt-safe-iphone px-6 max-w-md mx-auto animate-fade-in">
                <header className="flex items-center gap-4 mb-6 py-4 sticky top-0 bg-[#020617]/80 backdrop-blur-xl z-20">
                  <button onClick={() => navigateTo(AppView.HOME)} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-90">
                    <i className="fas fa-arrow-left text-xs"></i>
                  </button>
                  <h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{formatCityName(selectedCity, user.language)}</h2>
                  <button onClick={() => processCitySelection({ city: selectedCity, country: selectedCountry, countryEn: selectedCountryEn, slug: selectedCitySlug }, user.language, true)}
                    className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center active:rotate-180 transition-transform">
                    <i className="fas fa-sync-alt text-xs"></i>
                  </button>
                </header>

                {/* Tours / Community tab switcher */}
                <div className="flex gap-2 mb-6">
                  <button onClick={() => setShowCommunity(false)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showCommunity ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                    <i className="fas fa-map-marked-alt mr-2"></i>Tours
                  </button>
                  <button onClick={() => setShowCommunity(true)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showCommunity ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                    <i className="fas fa-users mr-2"></i>Community
                  </button>
                </div>

                {showCommunity ? (
                  <Community user={user} language={user.language} />
                ) : (
                <div className="space-y-6 pb-12">
                  {tours.map(tour => (
                    <div key={tour.id} className="animate-fade-in">
                      <TourCard tour={tour}
                        onSelect={() => { setActiveTour(tour); navigateTo(AppView.TOUR_ACTIVE); setCurrentStopIndex(0); }}
                        language={user.language} />
                    </div>
                  ))}
                  {tours.length < 3 && Array.from({ length: 3 - tours.length }).map((_, i) => (
                    <div key={`sk-${i}`} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 animate-pulse">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-white/5 rounded-full w-3/4"></div>
                          <div className="h-2 bg-white/5 rounded-full w-1/2"></div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-2 bg-white/5 rounded-full"></div>
                        <div className="h-2 bg-white/5 rounded-full w-5/6"></div>
                        <div className="h-2 bg-white/5 rounded-full w-4/6"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></div>
                        <span className="text-[9px] font-black text-purple-500/60 uppercase tracking-widest">DAI explorando...</span>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {/* ── TOUR ACTIVE ───────────────────────────────────────────────── */}
            {view === AppView.TOUR_ACTIVE && activeTour && (
              <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex}
                onNext={() => setCurrentStopIndex(i => i + 1)}
                onPrev={() => setCurrentStopIndex(i => i - 1)}
                onJumpTo={(i: number) => setCurrentStopIndex(i)}
                onUpdateUser={(u: any) => updateUserAndSync(u)}
                language={user.language}
                onBack={() => navigateTo(AppView.CITY_DETAIL)}
                userLocation={userLocation}
                onTourComplete={() => setVisaToShare({
                  cityName: activeTour.city,
                  miles: activeTour.stops.reduce((acc, s) => acc + (s.photoSpot?.milesReward || 0), 0)
                })} />
            )}

            {/* ── OTHER VIEWS ───────────────────────────────────────────────── */}
            {showOnboarding && <Onboarding user={user} language={user.language} onComplete={() => setShowOnboarding(false)} />}
            {visaToShare && <VisaShare user={user} cityName={visaToShare.cityName} milesEarned={visaToShare.miles} onClose={() => setVisaToShare(null)} />}
            {view === AppView.LEADERBOARD  && <div className="max-w-md mx-auto h-full"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} /></div>}
            {view === AppView.PROFILE      && <ProfileModal user={user} onClose={() => navigateTo(AppView.HOME)} onUpdateUser={updateUserAndSync} language={user.language} onLogout={() => { supabase.auth.signOut(); navigateTo(AppView.LOGIN); setLoginPhase('EMAIL'); }} onOpenAdmin={() => navigateTo(AppView.ADMIN)} onLangChange={handleLangChange} />}
            {view === AppView.SHOP         && <div className="max-w-md mx-auto h-full"><Shop user={user} onPurchase={() => {}} /></div>}
            {view === AppView.TOOLS        && <div className="max-w-md mx-auto h-full"><TravelServices mode="HUB" lang={user.language} onCitySelect={(name: string) => handleCitySearch(name)} /></div>}
            {view === AppView.ADMIN        && <AdminPanel user={user} onBack={() => navigateTo(AppView.PROFILE)} />}
          </div>

          {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
          {view !== AppView.TOUR_ACTIVE && view !== AppView.ADMIN && (
            <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-6 flex justify-center pointer-events-none">
              <nav className="bg-[#0a0f1e]/90 backdrop-blur-2xl border border-white/5 px-2 py-4 flex justify-around items-center w-full max-w-sm rounded-[2.5rem] pointer-events-auto shadow-2xl">
                <NavButton icon="fa-trophy"     label={t('navElite')}  isActive={view === AppView.LEADERBOARD} onClick={() => navigateTo(AppView.LEADERBOARD)} />
                <NavButton icon="fa-store"      label={t('navShop') || 'shop'} isActive={view === AppView.SHOP} onClick={() => navigateTo(AppView.SHOP)} />
                <button onClick={() => navigateTo(AppView.HOME)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg shadow-purple-500/40' : 'bg-white/5 border border-white/5'}`}>
                  <BdaiLogo className="w-7 h-7" />
                </button>
                <NavButton icon="fa-id-card"    label={t('navVisa')}   isActive={view === AppView.PROFILE}     onClick={() => navigateTo(AppView.PROFILE)} />
                <NavButton icon="fa-compass"    label={t('navHub')}    isActive={view === AppView.TOOLS}       onClick={() => navigateTo(AppView.TOOLS)} />
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

