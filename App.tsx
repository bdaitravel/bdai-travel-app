
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, standardizeCityName, translateTours } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { FlagIcon } from './components/FlagIcon';
import { Onboarding } from './components/Onboarding';
import { AdminPanel } from './components/AdminPanel';
import { supabase, getUserProfileByEmail, getGlobalRanking, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat, findCityInAnyLanguage } from './services/supabaseClient';

const TRANSLATIONS: any = {
  es: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciudad...", emailPlaceholder: "tu@email.com", userPlaceholder: "usuario", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", authError: "email no válido", codeError: "8 dígitos", selectLang: "idioma", loading: "sincronizando...", navElite: "élite", navHub: "intel", navVisa: "pasaporte", navStore: "tienda", changeEmail: "corregir", sentTo: "enviado a", loadingTour: "generando masterclass...", analyzing: "analizando...", fastSync: "traduciendo caché..." },
  en: { welcome: "bidaer log:", explorer: "explorer", searchPlaceholder: "city...", emailPlaceholder: "your@email.com", userPlaceholder: "username", login: "request access", verify: "validate", tagline: "better destinations by ai", authError: "invalid email", codeError: "8 digits", selectLang: "language", loading: "syncing...", navElite: "elite", navHub: "intel", navVisa: "passport", navStore: "store", changeEmail: "change", sentTo: "sent to", loadingTour: "generating masterclass...", analyzing: "analyzing...", fastSync: "syncing cache..." },
  hi: { welcome: "लॉगिन:", explorer: "खोजकर्ता", searchPlaceholder: "शहर...", emailPlaceholder: "ईमेल", userPlaceholder: "नाम", login: "अनुरोध", verify: "पुष्टि करें", tagline: "better destinations by ai", authError: "अमान्य ईमेल", codeError: "8 अंक", selectLang: "भाषा चुनें", loading: "सिंक हो रहा है...", navElite: "एलीट", navHub: "इंटेल", navVisa: "पासपोर्ट", navStore: "स्टोर", changeEmail: "बदलें", sentTo: "को भेजा गया", loadingTour: "लोड हो रहा है...", analyzing: "विश्लेषण...", fastSync: "कैश सिंक हो रहा है..." },
  ko: { welcome: "로그 bidaer:", explorer: "탐험가", searchPlaceholder: "도시...", emailPlaceholder: "이메일", userPlaceholder: "사용자", login: "액세스 요청", verify: "확인", tagline: "better destinations by ai", authError: "잘못된 이메일", codeError: "8자리 숫자", selectLang: "언어 선택", loading: "동기화 중...", navElite: "엘리트", navHub: "인텔", navVisa: "여권", navStore: "상점", changeEmail: "변경", sentTo: "보낸 곳", loadingTour: "로드 중...", analyzing: "분석 중...", fastSync: "캐시 동기화 중..." },
  tr: { welcome: "log bidaer:", explorer: "gezgin", searchPlaceholder: "şehir...", emailPlaceholder: "e-posta", userPlaceholder: "kullanıcı", login: "erişim iste", verify: "doğrula", tagline: "better destinations by ai", authError: "geçersiz e-posta", codeError: "8 rakam", selectLang: "dil seçin", loading: "senkronize ediliyor...", navElite: "elit", navHub: "istihbarat", navVisa: "pasaport", navStore: "mağaza", changeEmail: "değiştir", sentTo: "gönderildi", loadingTour: "yükleniyor...", analyzing: "analiz ediliyor...", fastSync: "önbellek senkronize ediliyor..." }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
  email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, 
  visitedCities: [], completedTours: [], badges: [], stamps: []
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-purple-500 scale-105' : 'text-slate-500 opacity-40'}`}>
    <i className={`fas ${icon} text-base`}></i>
    <span className="text-[6px] font-black uppercase tracking-widest text-center truncate w-full">{label}</span>
  </button>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [loginStep, setLoginStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchOptions, setSearchOptions] = useState<{name: string, spanishName: string, country: string}[] | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [user, setUser] = useState<UserProfile>(() => {
    try {
        const saved = localStorage.getItem('bdai_profile');
        if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    } catch (e) {}
    return GUEST_PROFILE;
  });

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await getUserProfileByEmail(session.user.email || '');
                const newUser = { 
                    ...(profile || GUEST_PROFILE), 
                    id: session.user.id, 
                    email: session.user.email, 
                    isLoggedIn: true,
                    language: profile?.language || user.language || 'es'
                };
                setUser(newUser as any);
                localStorage.setItem('bdai_profile', JSON.stringify(newUser));
                setView(AppView.HOME);
            }
        } catch (e) {
            console.error("Auth init error:", e);
        } finally {
            setIsVerifyingSession(false);
        }
    };
    checkAuth();
    getGlobalRanking().then(setLeaderboard);
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (err) => console.debug("GPS skip:", err),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const handleCitySearch = async (cityInput: string) => {
    if (!cityInput || !cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));
    const targetLang = user.language || 'es';
    setTours([]);
    setSearchOptions(null);
    
    try {
        if (cityInput.includes(',')) {
            const [cityPart, countryPart] = cityInput.split(',').map(s => s.trim());
            await processCitySelection({ name: cityPart, spanishName: cityPart, country: countryPart });
            return;
        }

        const results = await standardizeCityName(cityInput);
        
        if (results && results.length > 0) {
            setSearchOptions(results);
        } else {
            await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
        }
    } catch (e: any) { 
        console.error("Search error:", e);
        await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" }); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string}) => {
    if (!official || !official.spanishName) return;
    setIsLoading(true); 
    setSearchOptions(null); 
    const targetLang = user.language || 'es';
    setTours([]);

    try {
        setSelectedCity(official.spanishName); 
        
        // 1. Intentar buscar en el idioma solicitado
        const cached = await getCachedTours(official.spanishName, official.country, targetLang);
        if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
            setTours(cached.data); 
            setView(AppView.CITY_DETAIL);
            return;
        }

        // 2. Si no existe en el idioma solicitado, buscar si existe en CUALQUIER otro idioma
        setLoadingMessage(t('fastSync'));
        const existingAnyLang = await findCityInAnyLanguage(official.spanishName, official.country);
        
        if (existingAnyLang && existingAnyLang.data) {
            // Traducir los tours existentes (proceso mucho más rápido que regenerar desde cero)
            const translated = await translateTours(existingAnyLang.data as Tour[], targetLang);
            if (translated && translated.length > 0) {
                setTours(translated);
                await saveToursToCache(official.spanishName, official.country, targetLang, translated);
                setView(AppView.CITY_DETAIL);
                return;
            }
        }

        // 3. Si no existe en absoluto, generar desde cero (lento)
        setLoadingMessage(t('loadingTour'));
        const generated = await generateToursForCity(official.spanishName, official.country, user);
        if (Array.isArray(generated) && generated.length > 0) {
            setTours(generated); 
            await saveToursToCache(official.spanishName, official.country, targetLang, generated);
            setView(AppView.CITY_DETAIL);
        } else {
            alert("No se pudieron generar tours para esta ubicación.");
        }
    } catch (e: any) { 
        console.error("City selection error:", e);
        alert("Error de conexión con el motor de IA."); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleStartTour = (tour: Tour) => {
      if (!tour || !tour.stops || tour.stops.length === 0) {
          alert("Tour no disponible.");
          return;
      }
      setActiveTour(tour);
      setView(AppView.TOUR_ACTIVE);
      setCurrentStopIndex(0);
  };

  const handleLoginRequest = async () => {
      if (!validateEmailFormat(email)) { alert(t('authError')); return; }
      setIsLoading(true);
      try {
          const { error } = await supabase.auth.signInWithOtp({ email });
          if (error) throw error;
          setLoginStep('CODE');
      } catch (e: any) { alert("Error de autenticación: " + e.message); } 
      finally { setIsLoading(false); }
  };

  const handleVerifyCode = async () => {
      if (otpCode.length < 4) { alert(t('codeError')); return; }
      setIsLoading(true);
      const persistentLang = user.language; 
      try {
          const { data: { session }, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'email' });
          if (error) throw error;
          if (session) {
              const profile = await getUserProfileByEmail(email);
              const newUser = { 
                  ...(profile || GUEST_PROFILE), 
                  id: session.user.id, 
                  email, 
                  username: username || 'explorer', 
                  isLoggedIn: true,
                  language: persistentLang 
              };
              setUser(newUser as any);
              localStorage.setItem('bdai_profile', JSON.stringify(newUser));
              await syncUserProfile(newUser as any);
              setShowOnboarding(true);
          }
      } catch (e: any) { alert("Error OTP: " + e.message); } 
      finally { setIsLoading(false); }
  };

  const handleLangChange = (code: string) => {
      const newUser = { ...user, language: code };
      setUser(newUser);
      localStorage.setItem('bdai_profile', JSON.stringify(newUser));
      if (user.isLoggedIn) syncUserProfile(newUser);
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center"><BdaiLogo className="w-16 h-16 animate-pulse" /></div>;

  if (showOnboarding) return <Onboarding language={user.language} onComplete={() => { setShowOnboarding(false); setView(AppView.HOME); }} />;

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div><p className="text-white font-black uppercase text-[9px] tracking-[0.3em] text-center px-8">{loadingMessage}</p></div>}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617] overflow-hidden">
              <div className="text-center animate-fade-in flex flex-col items-center shrink-0 mb-8 mt-[-15dvh]">
                  <BdaiLogo className="w-28 h-28 animate-pulse-logo" />
                  <h1 className="text-5xl font-black lowercase tracking-tighter text-white/95 -mt-2">bdai</h1>
                  <p className="text-[11px] font-black lowercase tracking-tighter text-purple-500/80 mt-1">{t('tagline')}</p>
              </div>
              
              <div className="w-full max-w-[220px] mt-8 space-y-4">
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-2 animate-fade-in">
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/[0.01] border border-white/[0.04] rounded-lg py-2 px-3 text-center text-white outline-none text-[9px] font-medium placeholder-slate-800 focus:border-purple-500/20 transition-all lowercase" placeholder={t('userPlaceholder')} />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/[0.01] border border-white/[0.04] rounded-lg py-2 px-3 text-center text-white outline-none text-[9px] font-medium placeholder-slate-800 focus:border-purple-500/20 transition-all lowercase" placeholder={t('emailPlaceholder')} />
                          <button onClick={handleLoginRequest} className="w-full py-4 bg-white text-slate-950 rounded-lg font-black lowercase text-[11px] tracking-widest shadow-xl mt-3 active:scale-95 transition-all">{t('login')}</button>
                      </div>
                  ) : (
                      <div className="space-y-6 text-center animate-fade-in">
                          <div className="flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                              <p className="text-[8px] font-medium lowercase text-slate-500 tracking-widest mb-1">{t('sentTo')}</p>
                              <div className="flex flex-col items-center gap-2">
                                  <p className="text-[10px] font-black text-white truncate max-w-[180px]">{email}</p>
                                  <button onClick={() => setLoginStep('EMAIL')} className="bg-purple-600/10 text-purple-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-purple-500/20 active:scale-90 transition-all">
                                      <i className="fas fa-edit mr-1"></i> {t('changeEmail')}
                                  </button>
                              </div>
                          </div>
                          <div>
                            <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-transparent border-b border-purple-500/30 py-2 text-center font-black text-3xl text-white outline-none" placeholder="0000" />
                          </div>
                          <button onClick={handleVerifyCode} className="w-full py-4 bg-purple-600 text-white rounded-lg font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">{t('verify')}</button>
                      </div>
                  )}
              </div>

              <div className="absolute bottom-10 left-0 right-0 px-8 flex flex-col items-center gap-4">
                <p className="text-[7px] font-black lowercase tracking-[0.3em] text-slate-700 text-center uppercase">{t('selectLang')}</p>
                <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-[2rem] shadow-2xl backdrop-blur-md">
                    <div className="grid grid-cols-5 gap-x-5 gap-y-4 items-center justify-items-center">
                      {LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => handleLangChange(lang.code)} className="transition-all active:scale-90 relative">
                          <FlagIcon code={lang.code} className={`w-6 h-6 ${user.language === lang.code ? 'ring-2 ring-purple-500 scale-125 z-10' : 'grayscale-[0.8] opacity-40 hover:opacity-100 hover:grayscale-0'}`} />
                          {user.language === lang.code && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full"></div>}
                        </button>
                      ))}
                    </div>
                </div>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-[#020617] ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-32'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe-iphone px-6 max-w-md mx-auto">
                      <header className="flex justify-between items-center py-4"><div className="flex items-center gap-3"><BdaiLogo className="w-8 h-8"/><span className="font-black text-lg tracking-tighter">bdai</span></div><div className="bg-white/10 px-3 py-1.5 rounded-xl text-[8px] font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div></header>
                      <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.username || t('explorer')}.</span></h1>
                      <div className="relative mt-6 flex gap-3">
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySearch(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none font-bold text-xs" />
                          <button onClick={() => handleCitySearch(searchVal)} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg"><i className="fas fa-search text-sm"></i></button>
                      </div>
                      {searchOptions && (
                        <div className="mt-4 space-y-2 bg-slate-900/98 backdrop-blur-2xl p-4 rounded-[2rem] border border-white/10 shadow-2xl animate-fade-in">
                            <p className="text-[7px] font-black text-purple-400 uppercase tracking-widest px-2 mb-2">Selecciona Ubicación Precisa</p>
                            {searchOptions.map((opt, i) => (
                                <button key={i} onClick={() => processCitySelection(opt)} className="w-full p-4 bg-white/5 rounded-2xl flex items-center justify-between transition-all text-left active:bg-purple-600/20 border border-transparent hover:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5">
                                            <i className="fas fa-map-marker-alt text-purple-500 text-xs"></i>
                                        </div>
                                        <div>
                                            <span className="text-white font-black uppercase text-[10px] leading-tight block">{opt.spanishName}</span>
                                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">{opt.country}</span>
                                        </div>
                                    </div>
                                    <i className="fas fa-chevron-right text-[8px] text-slate-700"></i>
                                </button>
                            ))}
                        </div>
                      )}
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={(name: string) => handleCitySearch(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto"><header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button><h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2></header>
                      <div className="space-y-4 pb-12">
                          {tours.length > 0 ? tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => handleStartTour(tour)} language={user.language || 'es'} />) : <div className="text-center py-20 opacity-30 uppercase font-black text-xs tracking-widest">{t('loading')}</div>}
                      </div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />}
                {view === AppView.LEADERBOARD && <div className="max-w-md mx-auto h-full"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language || 'es'} /></div>}
                {view === AppView.TOOLS && <div className="pt-safe-iphone px-6 max-w-md mx-auto"><TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={(name: string) => handleCitySearch(name)} /></div>}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onLogout={() => { supabase.auth.signOut(); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
                {view === AppView.SHOP && <div className="max-w-md mx-auto h-full"><Shop user={user} onPurchase={(reward) => { const nu = {...user, miles: user.miles + reward}; setUser(nu); syncUserProfile(nu); }} /></div>}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-4 flex justify-center pointer-events-none"><nav className="bg-slate-900/98 backdrop-blur-2xl border border-white/10 px-2 py-3 flex justify-around items-center w-full max-w-sm rounded-[2rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg' : 'bg-white/5'}`}><BdaiLogo className="w-5 h-5" /></button>
                      <NavButton icon="fa-id-card" label={t('navVisa')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                      <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                  </nav></div>
            )}
          </div>
      )}
    </div>
  );
}
