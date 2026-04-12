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
import { translations } from './data/translations';
import { CityCommunity } from './components/CityCommunity';
import { toast } from './components/Toast';
import { useDebounce } from './lib/useDebounce';

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
        if (location.pathname === '/login') navigate('/home');
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
        if (location.pathname === '/login') navigate('/home');
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
        navigate(`/city/${slug}`);
        setIsLoading(false);
        backfillMissingPolylines(toursWithPolylines, slug, langCode);
        return;
      }

      // NO HAY CACHÉ -> Invocamos la Edge Function a través de geminiService
      setLoadingMessage(forceRefresh ? "DAI IS REWRITING HISTORY..." : t('generating'));

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

  // Subcomponents for Routes
  const LoginView = () => (
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
            placeholder={t('emailPlaceholder')} />
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
            <i className="fab fa-google text-[10px] text-purple-400"></i>google
          </button>
        </div>
      ) : (
        <div className="w-full max-w-[280px] space-y-6 animate-fade-in">
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('enterCode')}</p>
            <p className="text-[10px] font-bold text-purple-400/80 truncate">{email}</p>
          </div>
          <input type="text" maxLength={8} value={otpToken} onChange={e => setOtpToken(e.target.value)} disabled={isLoading}
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

      <div className="absolute bottom-10 left-0 right-0 px-8 flex flex-col items-center">
        <div className="relative group">
          <select value={user.language} onChange={(e) => handleLangChange(e.target.value)} disabled={isLoading}
            className="appearance-none bg-white/5 border border-white/10 rounded-full px-6 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-purple-500/40 transition-all cursor-pointer pr-10">
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">{lang.name}</option>
            ))}
          </select>
          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[7px] text-slate-600 pointer-events-none"></i>
        </div>
      </div>
    </div>
  );

  const HomeView = () => (
    <div className="space-y-6 pt-safe-iphone w-full max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto px-0 sm:px-6 md:px-8 animate-fade-in relative z-10">
      <header className="flex justify-between items-center py-4 px-6">
        <div className="flex items-center gap-3"><BdaiLogo className="w-8 h-8"/><span className="font-black text-xl tracking-tighter lowercase">bdai</span></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowOnboarding(true)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all"><i className="fas fa-question text-[10px]"></i></button>
          <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-2 shadow-lg border border-white/5"><i className="fas fa-coins text-yellow-500"></i>{user.miles.toLocaleString()}</div>
        </div>
      </header>

      <div className="py-10 px-6 text-center flex flex-col items-center">
        <BdaiLogo className="w-32 h-32 mb-6 animate-pulse-logo" />
        <h1 className="text-8xl font-black text-white lowercase tracking-tighter leading-none">bdai</h1>
        <p className="text-[11px] font-medium text-purple-400 mt-2 lowercase opacity-80 mb-4">better destinations by ai</p>
        <p className="text-xs text-slate-400 max-w-[280px] mx-auto mb-10 leading-relaxed font-medium">
          {APP_DESC[user.language] || APP_DESC['en']}
        </p>
        
        <div className="w-full relative">
          <div className="flex gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-bold text-sm shadow-inner flex items-center justify-between">
              <input type="text" value={searchVal} onChange={(e) => handleCitySearch(e.target.value)} 
                placeholder={t('searchPlaceholder')} className="bg-transparent border-none outline-none w-full" />
              {isSearching && <i className="fas fa-spinner fa-spin text-purple-500 text-xs"></i>}
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 transition-transform active:scale-90"><i className="fas fa-search"></i></div>
          </div>

          {searchOptions && searchOptions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-4 space-y-2 bg-[#0a0f1e]/98 backdrop-blur-3xl border border-white/5 p-3 rounded-[2rem] shadow-2xl animate-slide-up z-[1001]">
              {searchOptions.map((opt, i) => (
                <button key={i} onClick={() => processCitySelection(opt, user.language)} 
                  className="w-full p-4 bg-white/[0.03] rounded-xl flex items-center justify-between border border-white/5 active:bg-purple-600/10 transition-all text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {opt.countryCode ? (
                        <img src={`https://flagsapi.com/${opt.countryCode}/flat/64.png`} alt={opt.country} className="w-full h-full object-cover" />
                      ) : (
                        <i className={`fas ${opt.isCached ? 'fa-bolt text-cyan-400' : 'fa-globe text-purple-500'} text-xs`}></i>
                      )}
                    </div>
                    <div className="truncate">
                      <span className="text-white font-black uppercase text-[11px] block">{opt.cityLocal || opt.fullName}</span>
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

      <TravelServices mode="HOME" lang={user.language} onCitySelect={handleTravelServiceSelect} />
    </div>
  );

  const CityDetailView = () => {
    const { slug } = useParams();
    useEffect(() => {
      if (!selectedCityInfo || selectedCityInfo.slug !== slug) {
        // If we land here but info is missing (hard refresh), we should ideally re-fetch.
        // For now, let's keep the existing logic.
      }
    }, [slug]);

    return (
      <div className="pt-safe-iphone w-full max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 animate-fade-in relative z-10">
        <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/80 backdrop-blur-xl z-20">
          <button onClick={() => navigate('/home')} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-90"><i className="fas fa-arrow-left text-xs"></i></button>
          <h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{formatCityName(selectedCityInfo?.city || '', user.language)}</h2>
          {(user.email === 'travelbdai@gmail.com' || user.isAdmin) && (
            <button onClick={() => selectedCityInfo && processCitySelection({ city: selectedCityInfo.city, country: selectedCityInfo.country, countryEn: selectedCityInfo.countryEn, slug: selectedCityInfo.slug }, user.language, true)} 
              className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center active:rotate-180 transition-transform">
              <i className="fas fa-sync-alt text-xs"></i>
            </button>
          )}
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {tours.map((tour, idx) => (
            <TourCard key={`${tour.id}-${idx}`} tour={tour} onSelect={() => { 
                setActiveTour(tour); 
                navigate(`/tour/${tour.id}/stop/0`);
            }} language={user.language} />
          ))}
          {selectedCityInfo?.slug && <CityCommunity citySlug={selectedCityInfo.slug} user={user} />}
        </div>
      </div>
    );
  };

  const TourActiveView = () => {
    const { tourId, stopIdx } = useParams();
    const idx = parseInt(stopIdx || '0', 10);
    
    useEffect(() => {
      if (activeTour && activeTour.id !== tourId) {
        // Handle mismatch if needed
      }
      if (idx !== currentStopIndex) {
          setCurrentStopIndex(idx);
      }
    }, [tourId, idx]);

    if (!activeTour) return <Navigate to="/home" />;

    return (
      <ActiveTourCard 
        tour={activeTour} 
        user={user} 
        currentStopIndex={idx} 
        onNext={() => navigate(`/tour/${tourId}/stop/${idx + 1}`)} 
        onPrev={() => navigate(`/tour/${tourId}/stop/${idx - 1}`)} 
        onJumpTo={(i: number) => navigate(`/tour/${tourId}/stop/${i}`)} 
        onUpdateUser={(u: any) => updateUserAndSync(u)} 
        language={user.language} 
        onBack={() => navigate(`/city/${selectedCityInfo?.slug || ''}`)} 
        userLocation={userLocation} 
        onTourComplete={() => setVisaToShare({ cityName: activeTour.city, miles: activeTour.stops.reduce((acc, s) => acc + (s.photoSpot?.milesReward || 0), 0) })} 
      />
    );
  };

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
            <Route path="/login" element={user.isLoggedIn ? <Navigate to="/home" /> : <LoginView />} />
            <Route path="/home" element={user.isLoggedIn ? <HomeView /> : <Navigate to="/login" />} />
            <Route path="/city/:slug" element={user.isLoggedIn ? <CityDetailView /> : <Navigate to="/login" />} />
            <Route path="/tour/:tourId/stop/:stopIdx" element={user.isLoggedIn ? <TourActiveView /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} /></div> : <Navigate to="/login" />} />
            <Route path="/profile" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login'); setLoginPhase('EMAIL'); }} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
            <Route path="/shop" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><Shop user={user} onPurchase={() => {}} /></div> : <Navigate to="/login" />} />
            <Route path="/tools" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><TravelServices mode="HUB" lang={user.language} onCitySelect={handleTravelServiceSelect} /></div> : <Navigate to="/login" />} />
            <Route path="/admin" element={user.isLoggedIn ? <AdminPanel user={user} onBack={() => navigate('/profile')} /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={user.isLoggedIn ? "/home" : "/login"} />} />
          </Routes>

          {showOnboarding && <Onboarding user={user} language={user.language} onComplete={() => setShowOnboarding(false)} />}
          {visaToShare && <VisaShare user={user} cityName={visaToShare.cityName} milesEarned={visaToShare.miles} onClose={() => setVisaToShare(null)} />}
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

