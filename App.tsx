import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { generateToursForCity, translateSearchQuery, QuotaError, normalizeCityWithAI, fetchRoutePolyline } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices, formatCityName, formatCountryName } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { AdminPanel } from './components/AdminPanel';
import { Onboarding } from './components/Onboarding';
import { VisaShare } from './components/VisaShare';
import { FloatingAudioPlayer } from './components/FloatingAudioPlayer';
import { translations } from './data/translations';
import { CityCommunity } from './components/CityCommunity';
import { toast } from './components/Toast';
import { useDebounce } from './lib/useDebounce';
import { LoginView } from './views/LoginView';
import { HomeView } from './views/HomeView';
import { CityDetailView } from './views/CityDetailView';
import { TourActiveView } from './views/TourActiveView';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

import { useAppStore, GUEST_PROFILE } from './store/useAppStore';

import { 
  supabase, 
  getUserProfileByEmail, 
  getGlobalRanking, 
  syncUserProfile, 
  validateEmailFormat,
  checkIfCityCached,
  calculateTravelerRank,
  checkBadges,
  searchCitiesInCache,
  normalizeKey,
  saveToursToCache,
  getRoutePolylines,
  updateRoutePolyline,
  tryLockCityForGeneration
} from './services/supabaseClient';

const APP_DESC: Record<string, string> = {
  es: "Descubre ciudades con rutas únicas generadas por IA. Sin paradas repetidas, solo experiencias auténticas y gemas ocultas.",
  en: "Discover cities with unique AI-generated tours. No repeated stops, only authentic experiences and hidden gems.",
  fr: "Découvrez des villes avec des itinéraires uniques générés par IA. Aucun arrêt répété, que des expériences authentiques et des joyaux cachés.",
  de: "Entdecke Städte mit einzigartigen KI-generierten Touren. Keine wiederholten Stopps, nur authentische Erlebnisse und verborgene Schätze.",
  it: "Scopri città con percorsi unici generati dall'IA. Nessuna tappa ripetuta, solo esperienze autentiche e gemme nascoste.",
  pt: "Descobre cidades com rotas únicas geradas por IA. Sem paragens repetidas, só experiências autênticas e joias escondidas.",
  ro: "Descoperă orașe cu rute unice generate de IA. Fără opriri repetate, doar experiențe autentice și comori ascunse.",
  ru: "Открывай города с уникальными маршрутами от ИИ. Никаких повторений, только настоящие впечатления и скрытые жемчужины.",
  zh: "发现由AI生成的独特城市路线。没有重复的站点，只有真实的体验和隐藏的宝藏。",
  ja: "AIが生成するユニークな都市ツアーを発見。繰り返しのストップなし、本物の体験と隠れた宝石だけ。",
  ar: "اكتشف المدن بمسارات فريدة تولدها الذكاء الاصطناعي. لا توقفات متكررة، فقط تجارب أصيلة وجواهر خفية.",
  hi: "AI द्वारा जनित अनूठे शहर पर्यटन खोजें। कोई दोहराई गई रुकावट नहीं, केवल प्रामाणिक अनुभव और छिपे हुए रत्न।",
  ko: "AI가 생성한 독특한 도시 투어를 발견하세요. 반복 없는 정류장, 진정한 경험과 숨겨진 보석만.",
  tr: "Yapay zeka tarafından oluşturulan benzersiz şehir turlarını keşfet. Tekrar eden durak yok, sadece otantik deneyimler ve gizli mücevherler.",
  nl: "Ontdek steden met unieke AI-gegenereerde tours. Geen herhaalde stops, alleen authentieke ervaringen en verborgen juweeltjes.",
  pl: "Odkrywaj miasta z unikalnymi trasami generowanymi przez AI. Bez powtarzających się przystanków, tylko autentyczne doświadczenia i ukryte klejnoty.",
  ca: "Descobreix ciutats amb rutes úniques generades per IA. Sense parades repetides, només experiències autèntiques i joies ocultes.",
  eu: "Aurkitu hiriak AAren bidez sortutako bide bereziekin. Ez errepikaturiko geldialdirik, benetako esperientziak eta ezkutuko harribitxiak baino.",
  vi: "Khám phá các thành phố với các tuyến đường độc đáo do AI tạo ra. Không có điểm dừng lặp lại, chỉ có trải nghiệm chân thực và viên ngọc ẩn.",
  th: "ค้นพบเมืองด้วยเส้นทางท่องเที่ยวเฉพาะตัวที่สร้างโดย AI ไม่มีจุดหยุดซ้ำ มีแต่ประสบการณ์แท้จริงและสถานที่ซ่อนเร้น",
};


const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-purple-500 scale-105' : 'text-slate-500 opacity-40'}`}
  >
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[7px] font-black uppercase tracking-widest text-center truncate w-full">{label}</span>
  </button>
);

export default function App() {
  const { 
    userProfile: user, setUserProfile: setUser,
    activeTours: tours, setActiveTours: setTours,
    currentTour: activeTour, setCurrentTour: setActiveTour,
    currentStopIndex, setCurrentStopIndex,
    userLocation, setUserLocation,
    selectedCityInfo, setSelectedCityInfo
  } = useAppStore();

  const navigate = useNavigate();
  const location = useLocation();
  
  const navigateTo = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('bdai-stop-audio'));
    setIsLoading(false);
    setVisaToShare(null);
  }, [location.pathname]);

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [visaToShare, setVisaToShare] = useState<{ cityName: string, miles: number } | null>(null);

  const t = useCallback((key: string) => {
    const lang = user.language || 'es';
    const dict = translations[lang] || translations['en'];
    return dict[key] || translations['en'][key] || key;
  }, [user.language]);

  useEffect(() => {
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
    getGlobalRanking().then(setLeaderboard);
    return () => { subscription.unsubscribe(); };
  }, []);

  const handleLoginSuccess = async (supabaseUser: any) => {
    try {
      const profile = await getUserProfileByEmail(supabaseUser.email || '');
      if (profile) {
        // ✅ NUNCA sobreescribir datos existentes al hacer login
        // Solo actualizar rank (calculado), sessionsStarted y isLoggedIn
        const updatedProfile: UserProfile = {
            ...profile,
            isLoggedIn: true,
            rank: calculateTravelerRank(profile.miles),
            badges: (() => {
              const existingIds = new Set((profile.badges || []).map((b: any) => b.id));
              const newBadges = checkBadges(profile).filter((b: any) => !existingIds.has(b.id));
              return [...(profile.badges || []), ...newBadges];
            })(),
            stats: { 
              ...profile.stats, 
              sessionsStarted: (profile.stats?.sessionsStarted || 0) + 1 
            }
        };
        // Zustand persiste via storageProvider (localStorage en móvil, sessionStorage en web)
        setUser(updatedProfile);
        // ✅ Solo redirigir si estamos en la landing o login, si no, mantener la ruta actual
        if (location.pathname === '/login' || location.pathname === '/') {
            navigate('/home');
        }
      } else {
        // Usuario nuevo — crear perfil desde cero
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
    if (!navigator.geolocation) return;
    let lastUpdate = 0;

    // A4: Helper de validación de coordenadas GPS
    const isValidCoord = (lat: number, lng: number): boolean =>
      isFinite(lat) && isFinite(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !(lat === 0 && lng === 0); // Evita el Atlántico (0,0) que indica GPS roto

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
          // Silently handle geolocation errors to prevent console spam and UI freezing
          if (err.code !== 3) {
             console.debug(`GPS Info: ${err.message}`);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleRequestOtp = async () => {
    if (isLoading) return; 
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
    } catch (e: any) { toast(e.message || "No se pudo enviar el código.", 'error'); } finally { setIsLoading(false); }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
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
    } finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (isLoading) return; 
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
          // Zustand persiste automáticamente via storageProvider
          setUser({ ...profile, isLoggedIn: true });
        } else {
          const newProfile = { ...GUEST_PROFILE, email, id: data.user.id, isLoggedIn: true };
          await syncUserProfile(newProfile);
          setUser(newProfile);
        }
        navigate('/home');
      }
    } catch (e: any) { toast(e.message || "Código inválido o expirado.", 'error'); } finally { setIsLoading(false); }
  };

  const processCitySelection = async (selection: any, langCode: string, forceRefresh = false) => {
    setIsLoading(true); 
    setSearchOptions(null); 
    setSearchVal(''); 

    const cleanName = selection.name?.split(',')[0].trim() || selection.city;
    const slug = (selection.slug || normalizeKey(cleanName, selection.countryEn || selection.country))
      .replace(/-/g, '_').toLowerCase();

    /**
     * Estrategia fallback de polylines (Opción B):
     * Si tours vienen de caché sin polyline, las calculamos en background
     * y las persistimos en Supabase para futuros usuarios. Fire-and-forget.
     */
    const backfillMissingPolylines = (tours: Tour[], citySlug: string, lang: string): void => {
      const toursMissingPolyline = tours.filter(t => !t.routePolyline && t.stops?.length >= 2);
      if (toursMissingPolyline.length === 0) return;

      console.log(`🔄 Backfilling ${toursMissingPolyline.length} tour(s) without polyline for ${citySlug}...`);

      // Sin await — corre silenciosamente en segundo plano
      (async () => {
        for (const tour of toursMissingPolyline) {
          try {
            const polyline = await fetchRoutePolyline(tour.stops);
            if (polyline && tour.id) {
              await updateRoutePolyline(citySlug, lang, tour.id, polyline);
              console.log(`✅ Polyline backfilled for tour: ${tour.title}`);
            }
          } catch (e) {
            console.warn(`⚠️ Backfill failed for ${tour.title} (non-critical):`, e);
          }
        }
      })();
    };
      
    setSelectedCityInfo({
      city: cleanName,
      country: selection.country,
      countryEn: selection.countryEn || selection.country,
      slug: slug
    });

    try {
      setTours([]);
      setLoadingMessage(forceRefresh ? "DAI IS REWRITING HISTORY..." : t('syncing')); // Use a more neutral message first

      if (forceRefresh) {
        setLoadingMessage("PURGING OLD DATA...");
        await supabase.from('tours_cache').delete()
          .eq('city', slug).eq('language', langCode.toLowerCase());
      }

      // INTENTO DE CACHÉ DESDE DB
      const { data: existing } = await supabase
        .from('tours_cache')
        .select('data, route_polylines')
        .eq('city', slug)
        .eq('language', langCode.toLowerCase())
        .maybeSingle();

      if (existing && existing.data && existing.data.length > 0) {
        const savedPolylines: Record<string, string> = existing.route_polylines || {};
        const toursWithPolylines = (existing.data as Tour[]).map(tour => ({
          ...tour,
          routePolyline: savedPolylines[tour.id] ?? tour.routePolyline
        }));
        
        setTours(toursWithPolylines);
        // Pre-fill selectedCityInfo just in case (already done above but to be safe)
        navigate(`/city/${slug}`);
        setIsLoading(false);
        backfillMissingPolylines(toursWithPolylines, slug, langCode);
        return;
      }

      // NO HAY CACHÉ -> Invocamos la Edge Function a través de geminiService
      setLoadingMessage(t('generating')); // NOW show generating message

      const generated = await generateToursForCity(
        cleanName,
        selection.countryEn || selection.country,
        { ...user, language: langCode } as UserProfile,
        (tour) => {
          // Ya no emitiremos updates progresivos desde backend de momento, 
          // pero conservamos el handler por seguridad.
          setTours(prev => {
            const existingIdx = prev.findIndex(t => t.id === tour.id);
            if (existingIdx !== -1) {
              const updated = [...prev];
              updated[existingIdx] = tour;
              return updated;
            }
            return [...prev, tour];
          });
        }
      );

      if (generated && generated.length > 0) {
        setTours(generated);
        navigate(`/city/${slug}`);
        setIsLoading(false);
      } else {
        toast(t('noToursFound'), 'info');
        navigate('/home');
        setIsLoading(false);
      }

    } catch (e) {
      console.error("Selection error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTravelServiceSelect = (name: string, country?: string) => {
    if (country) {
      const slug = normalizeKey(name, country);
      processCitySelection({
        city: name,
        name: name,
        country: country,
        countryEn: country,
        slug: slug
      }, user.language);
    } else {
      handleCitySearch(name);
    }
  };

  const doSearch = useDebounce(async (val: string) => {
    if (val.length < 2) { setSearchOptions(null); setIsSearching(false); return; }
    try {
      const aiResults = await normalizeCityWithAI(val, user.language);
      const results = await Promise.all(aiResults.map(async (res) => {
        const slug = res.slug.replace(/-/g, '_').toLowerCase();
        const isCached = await checkIfCityCached(res.city, slug);
        return {
          name: res.city,
          city: res.city,
          cityLocal: res.cityLocal,
          country: res.country,
          countryEn: res.countryEn,
          countryCode: res.countryCode,
          slug,
          isCached,
          fullName: res.cityLocal || res.city
        };
      }));
      setSearchOptions(results);
    } catch (e) {
      console.error("Search protocol error:", e);
    } finally {
      setIsSearching(false);
    }
  }, 1000);

  const handleCitySearch = (val: string) => {
    setSearchVal(val);
    if (val.length < 2) { setSearchOptions(null); return; }
    setIsSearching(true);
    doSearch(val);
  };

  const handleLangChange = (code: string) => {
    setIsSyncingLang(code !== user.language);
    const updatedUser = { ...user, language: code };
    // Zustand persiste automáticamente via storageProvider
    setUser(updatedUser);
    if (user.isLoggedIn) syncUserProfile(updatedUser);
    setTours([]);
    setTimeout(() => setIsSyncingLang(false), 500);
  };

  const updateUserAndSync = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    if (updatedUser.isLoggedIn) syncUserProfile(updatedUser);
  };

  if (isVerifyingSession) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center">
        <BdaiLogo className="w-16 h-16 animate-pulse" />
      </div>
    );
  }




  const isTourActive = location.pathname.startsWith('/tour/');
  const isAdminView = location.pathname === '/admin';
  const showNav = user.isLoggedIn && !isTourActive && !isAdminView;

  return (
    <div className="flex-1 bg-transparent flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {(isLoading || isSyncingLang) && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-fade-in">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-black uppercase text-[10px] tracking-[0.4em] text-center animate-pulse">
            {isSyncingLang ? "translating interface..." : (loadingMessage || "syncing...")}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col relative h-full">
        <div className={`flex-1 overflow-y-auto no-scrollbar relative ${isTourActive ? 'pb-0' : 'pb-36'}`}>
          <Routes>
            <Route path="/login" element={user.isLoggedIn ? <Navigate to="/home" /> : <LoginView loginPhase={loginPhase} email={email} setEmail={setEmail} isLoading={isLoading} t={t} handleRequestOtp={handleRequestOtp} handleGoogleLogin={handleGoogleLogin} otpToken={otpToken} setOtpToken={setOtpToken} setLoginPhase={setLoginPhase} handleVerifyOtp={handleVerifyOtp} handleLangChange={handleLangChange} user={user} />} />
            <Route path="/home" element={user.isLoggedIn ? <HomeView user={user} setShowOnboarding={setShowOnboarding} searchVal={searchVal} handleCitySearch={handleCitySearch} isSearching={isSearching} searchOptions={searchOptions} processCitySelection={processCitySelection} handleTravelServiceSelect={handleTravelServiceSelect} t={t} appDesc={APP_DESC} /> : <Navigate to="/login" />} />
            <Route path="/city/:slug" element={user.isLoggedIn ? <CityDetailView slug={selectedCityInfo?.slug || ''} selectedCityInfo={selectedCityInfo} user={user} navigate={navigate} processCitySelection={processCitySelection} tours={tours} setActiveTour={setActiveTour} /> : <Navigate to="/login" />} />
            <Route path="/tour/:tourId/stop/:stopIdx" element={user.isLoggedIn ? <TourActiveView activeTour={activeTour} user={user} currentStopIndex={currentStopIndex} setCurrentStopIndex={setCurrentStopIndex} navigate={navigate} updateUserAndSync={updateUserAndSync} setVisaToShare={setVisaToShare} userLocation={userLocation} selectedCitySlug={selectedCityInfo?.slug || ''} /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} /></div> : <Navigate to="/login" />} />
            <Route path="/profile" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login'); setLoginPhase('EMAIL'); }} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
            <Route path="/profile/visa/:cityName" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login'); setLoginPhase('EMAIL'); }} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
            <Route path="/profile/badge/:badgeId" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login'); setLoginPhase('EMAIL'); }} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
            <Route path="/shop" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><Shop user={user} onPurchase={() => {}} /></div> : <Navigate to="/login" />} />
            <Route path="/tools" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><TravelServices mode="HUB" lang={user.language} onCitySelect={handleTravelServiceSelect} /></div> : <Navigate to="/login" />} />
            <Route path="/admin" element={user.isLoggedIn ? <AdminPanel user={user} onBack={() => navigate('/profile')} /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={user.isLoggedIn ? "/home" : "/login"} />} />
          </Routes>

          {showOnboarding && <Onboarding user={user} language={user.language} onComplete={() => setShowOnboarding(false)} />}
          {visaToShare && <VisaShare user={user} cityName={visaToShare.cityName} milesEarned={visaToShare.miles} onClose={() => setVisaToShare(null)} />}
          <FloatingAudioPlayer />
        </div>

        {showNav && (
          <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-6 flex justify-center pointer-events-none">
            <nav className="bg-[#0a0f1e]/90 backdrop-blur-2xl border border-white/5 px-2 py-4 flex justify-around items-center w-full max-w-sm md:max-w-lg lg:max-w-2xl rounded-[2.5rem] pointer-events-auto shadow-2xl">
              <NavButton icon="fa-trophy" label={t('navElite')} isActive={location.pathname === '/leaderboard'} onClick={() => navigate('/leaderboard')} />
              <NavButton icon="fa-compass" label={t('navHub')} isActive={location.pathname === '/tools'} onClick={() => navigate('/tools')} />
              <button onClick={() => navigate('/home')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${location.pathname === '/home' || location.pathname === '/' ? 'bg-purple-600 -mt-10 scale-110 shadow-lg shadow-purple-500/40' : 'bg-white/5 border border-white/5'}`}><BdaiLogo className="w-7 h-7" /></button>
              <NavButton icon="fa-id-card" label={t('navVisa')} isActive={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
              <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={location.pathname === '/shop'} onClick={() => navigate('/shop')} />
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

