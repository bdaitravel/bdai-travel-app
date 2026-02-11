
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, standardizeCityName, translateToursBatch } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { FlagIcon } from './components/FlagIcon';
import { Onboarding } from './components/Onboarding';
import { AdminPanel } from './components/AdminPanel';
import { supabase, getUserProfileByEmail, getGlobalRanking, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat } from './services/supabaseClient';

const TRANSLATIONS: any = {
  es: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciudad...", emailPlaceholder: "tu@email.com", userPlaceholder: "usuario", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", authError: "email no válido", codeError: "8 dígitos", selectLang: "idioma", loading: "sincronizando...", navElite: "élite", navHub: "intel", navVisa: "pasaporte", navStore: "tienda", changeEmail: "corregir", sentTo: "enviado a", loadingTour: "generando masterclass...", analyzing: "analizando...", fastSync: "traduciendo caché...", apiLimit: "IA Saturada. Reintentando...", retry: "Reintentar", info: "info" },
  en: { welcome: "bidaer log:", explorer: "explorer", searchPlaceholder: "city...", emailPlaceholder: "your@email.com", userPlaceholder: "username", login: "request access", verify: "validate", tagline: "better destinations by ai", authError: "invalid email", codeError: "8 digits", selectLang: "language", loading: "syncing...", navElite: "elite", navHub: "intel", navVisa: "passport", navStore: "store", changeEmail: "correct", sentTo: "sent to", loadingTour: "generating masterclass...", analyzing: "analyzing...", fastSync: "syncing cache...", apiLimit: "AI Saturated. Retrying...", retry: "Retry", info: "info" }
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
        (position) => {
            setUserLocation({ 
                lat: position.coords.latitude, 
                lng: position.coords.longitude 
            });
        },
        (err) => console.debug("GPS access denied:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  useEffect(() => {
    if (tours.length > 0) {
      const translateCurrent = async () => {
        setIsLoading(true);
        setLoadingMessage(t('fastSync'));
        try {
          const translated = await translateToursBatch(tours, user.language);
          setTours(translated);
          if (translated.length > 0 && translated[0].city) {
            setSelectedCity(translated[0].city);
          }
          if (activeTour) {
            const translatedActive = translated.find(t => t.id === activeTour.id);
            if (translatedActive) setActiveTour(translatedActive);
          }
        } catch (e) {
          console.error("Auto-translate error:", e);
        } finally {
          setIsLoading(false);
        }
      };
      translateCurrent();
    }
  }, [user.language]);

  const t = (key: string) => {
    const currentLang = user.language || 'es';
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['es'];
    return dict[key] || TRANSLATIONS['es'][key] || key;
  };

  const validateTourQuality = (tours: Tour[]): boolean => {
    if (!tours || tours.length < 3) return false;
    const firstTour = tours[0];
    if (!firstTour.stops || firstTour.stops.length < 8) return false;
    const hasValidCoords = firstTour.stops.every(s => s.latitude !== 0 && s.longitude !== 0 && s.latitude !== undefined);
    return hasValidCoords;
  };

  const handleCitySearch = async (cityInput: string) => {
    if (!cityInput || !cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));
    setTours([]);
    setSearchOptions(null);

    try {
        // Obligamos a desambiguar SIEMPRE para asegurar que el usuario elige el Logroño correcto
        const results = await standardizeCityName(cityInput);
        if (results && results.length > 0) {
            setSearchOptions(results);
            setIsLoading(false);
            return;
        }
        // Si no hay resultados de IA, intentamos proceso directo por si acaso
        await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
    } catch (e: any) { 
        await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" }); 
    } finally {
        if (!searchOptions) setIsLoading(false);
    }
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string}) => {
    if (!official || !official.spanishName) { setIsLoading(false); return; }
    setIsLoading(true); 
    setSearchOptions(null); 
    setSelectedCity(official.spanishName); 
    setTours([]);

    try {
        // Ahora getCachedTours usa el par ciudad+país, por lo que Logroño España y Logroño Argentina son distintos
        const cached = await getCachedTours(official.spanishName, official.country, user.language);
        if (cached && cached.data.length > 0 && validateTourQuality(cached.data)) {
            setTours(cached.data); 
            if (cached.data[0].city) setSelectedCity(cached.data[0].city);
            setView(AppView.CITY_DETAIL);
            setIsLoading(false);
            return;
        }

        setLoadingMessage(t('loadingTour'));
        const generated = await generateToursForCity(official.spanishName, official.country, user);
        if (generated.length > 0) {
            setTours(generated); 
            if (generated[0].city) setSelectedCity(generated[0].city);
            await saveToursToCache(official.spanishName, official.country, user.language, generated);
            setView(AppView.CITY_DETAIL);
        }
    } catch (e: any) { 
        console.error(e); 
        alert("Dai está saturado. Reintentando...");
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleStartTour = (tour: Tour) => {
      setActiveTour(tour);
      setView(AppView.TOUR_ACTIVE);
      setCurrentStopIndex(0);
  };

  const handleLoginRequest = async () => {
      if (!validateEmailFormat(email)) { alert(t('authError')); return; }
      setIsLoading(true);
      try {
          const { error } = await supabase.auth.signInWithOtp({ email });
          if (error) {
              const errMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
              alert(`Error: ${errMsg}`);
              throw error;
          }
          setLoginStep('CODE');
      } catch (e: any) { 
          console.error("Login request exception:", e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleVerifyCode = async () => {
      if (otpCode.length < 4) { alert(t('codeError')); return; }
      setIsLoading(true);
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
                  language: user.language 
              };
              setUser(newUser as any);
              localStorage.setItem('bdai_profile', JSON.stringify(newUser));
              await syncUserProfile(newUser as any);
              setShowOnboarding(true);
          }
      } catch (e: any) { 
        alert(e.message || 'Error de validación del código.'); 
      } finally { 
        setIsLoading(false); 
      }
  };

  const handleLangChange = (code: string) => {
      setUser(prev => ({ ...prev, language: code }));
      localStorage.setItem('bdai_profile', JSON.stringify({ ...user, language: code }));
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center"><BdaiLogo className="w-20 h-20 animate-pulse" /></div>;
  if (showOnboarding) return <Onboarding key={user.language} language={user.language} onComplete={() => { setShowOnboarding(false); setView(AppView.HOME); }} />;

  return (
    <div className="flex-1 bg-transparent flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-fade-in">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-white font-black uppercase text-[9px] tracking-[0.3em] text-center px-8 mb-4">{loadingMessage}</p>
        </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 relative">
              <div className="text-center animate-fade-in flex flex-col items-center mb-6 mt-[-10dvh]">
                  <BdaiLogo className="w-52 h-52 animate-pulse-logo" />
                  <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 -mt-4">bdai</h1>
                  <p className="text-[12px] font-black lowercase tracking-tighter text-purple-500/80 mt-1">{t('tagline')}</p>
              </div>
              
              <div className="w-full max-w-[240px] mt-4 space-y-4">
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-3 animate-fade-in">
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl py-4 px-5 text-center text-white outline-none text-sm font-bold placeholder-slate-400" placeholder={t('userPlaceholder')} />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl py-4 px-5 text-center text-white outline-none text-sm font-bold placeholder-slate-400" placeholder={t('emailPlaceholder')} />
                          <button onClick={handleLoginRequest} className="w-full py-5 bg-white text-slate-950 rounded-xl font-black lowercase text-[11px] tracking-widest active:scale-95 transition-all shadow-xl">{t('login')}</button>
                      </div>
                  ) : (
                      <div className="space-y-6 text-center animate-fade-in">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('sentTo')} <span className="text-purple-400 lowercase">{email}</span></p>
                          <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-transparent border-b border-purple-500/30 py-2 text-center font-black text-3xl text-white outline-none" placeholder="0000" />
                          <button onClick={handleVerifyCode} className="w-full py-4 bg-purple-600 text-white rounded-lg font-black lowercase text-[11px] tracking-widest active:scale-95 transition-all">{t('verify')}</button>
                          <button onClick={() => setLoginStep('EMAIL')} className="w-full text-[9px] font-black uppercase tracking-widest text-slate-500">{t('changeEmail')}</button>
                      </div>
                  )}
              </div>

              <div className="absolute bottom-10 left-0 right-0 px-8 flex flex-col items-center gap-3">
                <p className="text-[7px] font-black lowercase tracking-[0.3em] text-slate-400 text-center uppercase">{t('selectLang')}</p>
                <div className="w-full max-w-sm overflow-x-auto no-scrollbar">
                    <div className="flex gap-4 items-center justify-start px-4 py-2">
                      {LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => handleLangChange(lang.code)} className="transition-all active:scale-90 relative shrink-0">
                          <FlagIcon code={lang.code} className={`w-8 h-8 ${user.language === lang.code ? 'ring-2 ring-purple-500 scale-125 z-10 shadow-lg' : 'grayscale-[0.8] opacity-40 hover:opacity-100 hover:grayscale-0'}`} />
                        </button>
                      ))}
                    </div>
                </div>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-32'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe-iphone px-6 max-w-md mx-auto">
                      <header className="flex justify-between items-center py-4">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-10 h-10"/><span className="font-black text-xl tracking-tighter">bdai</span></div>
                          <div className="flex items-center gap-3">
                              <button onClick={() => setShowOnboarding(true)} className="bg-white/5 w-8 h-8 rounded-full flex items-center justify-center text-purple-400 border border-white/10 active:scale-90 transition-all">
                                <i className="fas fa-info text-[10px]"></i>
                              </button>
                              <div className="bg-white/10 px-3 py-1.5 rounded-xl text-[8px] font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div>
                          </div>
                      </header>
                      <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.username || t('explorer')}.</span></h1>
                      <div className="relative mt-6 flex gap-3">
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySearch(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-bold text-xs" />
                          <button onClick={() => handleCitySearch(searchVal)} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg"><i className="fas fa-search text-sm"></i></button>
                      </div>
                      
                      {searchOptions && (
                        <div className="mt-4 space-y-3 bg-slate-900 border-2 border-purple-500/50 p-6 rounded-[2.5rem] shadow-2xl animate-fade-in relative z-[1001]">
                            {searchOptions.map((opt, i) => (
                                <button key={i} onClick={() => processCitySelection(opt)} className="w-full p-5 bg-white/5 rounded-[1.5rem] flex items-center justify-between border border-white/5 active:bg-purple-600/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center"><i className="fas fa-map-marker-alt text-purple-500"></i></div>
                                        <div className="text-left"><span className="text-white font-black uppercase text-xs block">{opt.spanishName}</span><span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{opt.country}</span></div>
                                    </div>
                                    <i className="fas fa-chevron-right text-[10px] text-purple-500"></i>
                                </button>
                            ))}
                        </div>
                      )}
                      
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={(name: string) => handleCitySearch(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto">
                      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button><h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2></header>
                      <div className="space-y-4 pb-12">
                          {tours.length > 0 ? tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => handleStartTour(tour)} language={user.language || 'es'} />) : <div className="text-center py-20 opacity-30 uppercase font-black text-xs tracking-widest">Analizando...</div>}
                      </div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />}
                {view === AppView.LEADERBOARD && <div className="max-w-md mx-auto h-full"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language || 'es'} /></div>}
                {view === AppView.TOOLS && <div className="pt-safe-iphone px-6 max-w-md mx-auto"><TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={(name: string) => handleCitySearch(name)} /></div>}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onLogout={() => { supabase.auth.signOut(); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
                {view === AppView.SHOP && <div className="max-w-md mx-auto h-full"><Shop user={user} onPurchase={() => {}} /></div>}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-4 flex justify-center pointer-events-none"><nav className="bg-slate-900/98 backdrop-blur-2xl border border-white/10 px-2 py-3 flex justify-around items-center w-full max-w-sm rounded-[2rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg' : 'bg-white/5'}`}><BdaiLogo className="w-6 h-6" /></button>
                      <NavButton icon="fa-id-card" label={t('navVisa')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                      <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                  </nav></div>
            )}
          </div>
      )}
    </div>
  );
}
