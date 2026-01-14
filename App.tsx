
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, generateAudio, standardizeCityName, getGreetingContext } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { FlagIcon } from './components/FlagIcon';
import { Onboarding } from './components/Onboarding';
import { CommunityBoard } from './components/CommunityBoard';
import { getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache, normalizeKey } from './services/supabaseClient';

const TRANSLATIONS: any = {
  en: { welcome: "Welcome,", explorer: "Explorer", searchPlaceholder: "Search any city...", emailPlaceholder: "Email", codePlaceholder: "8 digits code", login: "Start Journey", verify: "Verify", tagline: "better destinations by ai", navElite: "Elite", navHub: "Hub", navVisa: "Visa", navStore: "Store", authError: "Error", codeError: "Invalid", selectLang: "Language", resend: "Resend", installTitle: "Install bdai", installDesc: "Use it as a real app", installBtn: "Install", installIosStep1: "1. Tap the 'Share' icon below", installIosStep2: "2. Scroll down and tap 'Add to Home Screen'", installIosStep3: "Note: If you don't see it, tap 'Open in Safari' first.", close: "Close" },
  es: { welcome: "Bienvenido,", explorer: "Explorador", searchPlaceholder: "Busca cualquier ciudad...", emailPlaceholder: "Email", codePlaceholder: "código 8 dígitos", login: "Empezar Viaje", verify: "Verificar", tagline: "better destinations by ai", navElite: "Elite", navHub: "Hub", navVisa: "Visa", navStore: "Tienda", authError: "Error", codeError: "Inválido", selectLang: "Idioma", resend: "Reenviar", installTitle: "Instalar bdai", installDesc: "Usa bdai como una app real", installBtn: "Instalar", installIosStep1: "1. Pulsa el icono 'Compartir' de abajo", installIosStep2: "2. Busca 'Añadir a pantalla de inicio'", installIosStep3: "Nota: Si no lo ves, pulsa primero 'Abrir en Safari'.", close: "Cerrar" },
  ca: { welcome: "Benvingut,", explorer: "Explorador", searchPlaceholder: "Cerca una ciutat...", emailPlaceholder: "Email", codePlaceholder: "codi 8 dígits", login: "Començar", verify: "Verificar", tagline: "better destinations by ai", navElite: "Elite", navHub: "Hub", navVisa: "Visa", navStore: "Botiga", selectLang: "Idioma", resend: "Tornar a enviar", installTitle: "Instal·lar bdai", installDesc: "Com una app real", installBtn: "Instal·lar", installIosStep1: "1. Prem el botó 'Compartir'", installIosStep2: "2. Cerca 'Afegir a pantalla d'inici'", installIosStep3: "Nota: Si no ho veus, prem 'Obrir a Safari' primer.", close: "Tancar" }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 
  email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, birthday: '2000-01-01', 
  visitedCities: [], completedTours: [], savedIntel: [], stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, 
  badges: [], joinDate: new Date().toLocaleDateString(), passportNumber: 'XP-TEMP-BDAI', city: '', country: ''
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-purple-500 scale-110' : 'text-slate-500 opacity-50'}`}>
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [loginStep, setLoginStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  
  // PWA States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [user, setUser] = useState<UserProfile>(() => {
    try {
        const saved = localStorage.getItem('bdai_profile');
        if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    } catch (e) {}
    return GUEST_PROFILE;
  });

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isLoggedIn && parsed.id !== 'guest') {
          setUser(parsed);
          setView(AppView.HOME);
        }
      } catch (e) {}
    }

    // PWA Logic
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!checkStandalone);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!checkStandalone) setShowInstallBanner(true);
    });

    // Detect iOS and suggest install
    if (!checkStandalone && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      setTimeout(() => setShowInstallBanner(true), 2000);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        err => console.error("GPS Error:", err)
      );
    }
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstallBanner(false);
      setDeferredPrompt(null);
    } else {
      // It's iOS or browser without prompt support
      setShowIosGuide(true);
    }
  };

  const unlockAudio = async () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
  };

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const handleLanguageSelect = (code: string) => {
    setUser(prev => ({ ...prev, language: code }));
  };

  const handleSendOtp = async () => {
    await unlockAudio();
    if (!email || isLoading) return;
    setAuthError(null);
    setIsLoading(true);
    try {
      const { error } = await sendOtpEmail(email);
      if (error) setAuthError(t('authError'));
      else setLoginStep('VERIFY');
    } catch (e) { setAuthError(t('authError')); } 
    finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
      await unlockAudio();
      if (!otpCode || isLoading) return;
      setAuthError(null);
      setIsLoading(true);
      try {
          const { data, error } = await verifyOtpCode(email, otpCode);
          if (error || !data?.user) { 
            setAuthError(t('codeError')); 
            setIsLoading(false); 
            return; 
          }
          const profile = await getUserProfileByEmail(email);
          const newUser: UserProfile = profile ? { ...profile, isLoggedIn: true } : { ...user, id: data.user.id, email: email, isLoggedIn: true, language: user.language };
          setUser(newUser);
          localStorage.setItem('bdai_profile', JSON.stringify(newUser));
          setView(AppView.HOME);
          if (!newUser.interests?.length) setShowOnboarding(true);
      } catch (e) { setAuthError(t('authError')); } 
      finally { setIsLoading(false); }
  };

  const handleCitySelect = async (cityInput: string) => {
    await unlockAudio();
    if (!cityInput.trim()) return;
    setIsLoading(true);
    
    const standardizedName = await standardizeCityName(cityInput);
    setSelectedCity(standardizedName);
    setView(AppView.CITY_DETAIL);

    try {
        let finalTours = await getCachedTours(standardizedName, user.language) || [];
        if (finalTours.length === 0) {
            const greeting = await getGreetingContext(standardizedName, user.language);
            const generated = await generateToursForCity(standardizedName, user, greeting);
            if (generated.length > 0) {
                finalTours = generated;
                await saveToursToCache(standardizedName, user.language, generated);
            }
        }
        setTours(finalTours);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handlePlayAudio = async (id: string, text: string) => {
    await unlockAudio();
    if (audioPlayingId === id) { 
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setAudioPlayingId(null);
      return; 
    }
    if (audioSourceRef.current) audioSourceRef.current.stop();
    setAudioLoadingId(id);
    try {
        const ctx = audioContextRef.current!;
        const base64 = await generateAudio(text, user.language);
        if (base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setAudioPlayingId(null);
            source.start(0);
            audioSourceRef.current = source;
            setAudioPlayingId(id);
        }
    } catch(e) { console.error(e); } finally { setAudioLoadingId(null); }
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('bdai_profile', JSON.stringify(updated));
    syncUserProfile(updated);
  };

  return (
    <div className="flex-1 bg-[#020617] flex flex-col relative overflow-hidden text-slate-100 h-[100dvh] w-full font-sans">
      {showOnboarding && <Onboarding language={user.language} onLanguageSelect={handleLanguageSelect} onComplete={(ints) => { const updated = {...user, interests: ints}; handleUpdateUser(updated); setShowOnboarding(false); }} />}

      {/* Guía Visual para iOS */}
      {showIosGuide && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
              <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 text-slate-900 shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-xl uppercase tracking-tighter">Instrucciones iOS</h3>
                    <button onClick={() => setShowIosGuide(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
                  </div>
                  <div className="space-y-6">
                      <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-black">1</div>
                          <p className="text-sm font-medium">{t('installIosStep1')}</p>
                      </div>
                      <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-black">2</div>
                          <p className="text-sm font-medium">{t('installIosStep2')}</p>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                          <p className="text-[11px] font-black text-amber-700 leading-tight">
                              <i className="fas fa-exclamation-triangle mr-2"></i>
                              {t('installIosStep3')}
                          </p>
                      </div>
                  </div>
                  <button onClick={() => setShowIosGuide(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">{t('close')}</button>
              </div>
          </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-between p-10 bg-[#020617] py-safe-iphone">
              <div className="w-full flex flex-col items-center gap-3 animate-fade-in">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">{t('selectLang')}</p>
                  <div className="flex gap-3">
                      {LANGUAGES.map(lang => (
                          <button key={lang.code} onClick={() => handleLanguageSelect(lang.code)} className={`w-8 h-8 rounded-full overflow-hidden border transition-all active:scale-90 ${user.language === lang.code ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/20' : 'border-white/10 opacity-30'}`}>
                              <FlagIcon code={lang.code} className="w-full h-full object-cover scale-150" />
                          </button>
                      ))}
                  </div>
              </div>

              <div className="text-center flex flex-col items-center">
                  <div className="w-32 h-32 mb-4 bg-purple-600/10 rounded-[2rem] flex items-center justify-center border border-purple-500/20 shadow-2xl relative">
                     <div className="absolute inset-0 bg-purple-500/5 blur-3xl animate-pulse"></div>
                     <BdaiLogo className="w-20 h-20 relative z-10" />
                  </div>
                  <h1 className="text-5xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-purple-400 text-[8px] font-black uppercase tracking-[0.4em] mt-1">{t('tagline')}</p>
              </div>

              <div className="w-full space-y-4 max-w-xs z-10 mb-8">
                  {authError && <p className="text-red-500 text-[9px] font-black uppercase text-center bg-red-500/10 p-3 rounded-2xl border border-red-500/10">{authError}</p>}
                  {loginStep === 'FORM' ? (
                      <div className="space-y-4 animate-slide-up">
                          <input type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-center text-white focus:border-purple-500/50 text-base" />
                          <button disabled={isLoading} onClick={handleSendOtp} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                              {isLoading ? <i className="fas fa-spinner fa-spin"></i> : t('login')}
                          </button>
                      </div>
                  ) : (
                      <div className="animate-fade-in space-y-4">
                          <input type="text" inputMode="numeric" maxLength={8} placeholder={t('codePlaceholder')} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-center font-black text-xl text-purple-400 tracking-[0.2em] focus:border-purple-500/50" />
                          <div className="space-y-3">
                            <button disabled={isLoading} onClick={handleVerifyOtp} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                                {isLoading ? <i className="fas fa-spinner fa-spin text-lg"></i> : t('verify')}
                            </button>
                            <button onClick={() => setLoginStep('FORM')} className="w-full text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">
                                {t('resend')}
                            </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-[#020617] ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-40'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe-iphone">
                      <header className="flex justify-between items-center px-8 py-6">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-10 h-10"/><span className="font-black text-2xl tracking-tighter">bdai</span></div>
                          <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-xs font-black text-white"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div>
                      </header>

                      {showInstallBanner && !isStandalone && (
                        <div className="mx-8 mb-6 p-4 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center justify-between gap-4 animate-slide-up-banner">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-600/20"><i className="fas fa-mobile-screen-button text-sm"></i></div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-white tracking-tighter">{t('installTitle')}</h4>
                                    <p className="text-[7px] font-bold text-slate-400 uppercase leading-none mt-1">{t('installDesc')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleInstallClick} className="bg-white text-slate-950 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-90 transition-transform">
                                    {t('installBtn')}
                                </button>
                                <button onClick={() => setShowInstallBanner(false)} className="w-8 h-8 rounded-lg bg-white/5 text-slate-500 flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
                            </div>
                        </div>
                      )}

                      <div className="px-8 mb-4">
                          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.firstName || t('explorer')}.</span></h1>
                          <div className="relative mt-8">
                            <i className="fas fa-search absolute left-6 top-6 text-slate-500"></i>
                            <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 pl-16 pr-8 text-white focus:border-purple-500/50 outline-none" />
                          </div>
                      </div>
                      <TravelServices mode="HOME" language={user.language} onCitySelect={handleCitySelect} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 animate-fade-in">
                      <header className="flex items-center justify-between mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20">
                          <div className="flex items-center gap-4">
                            <button onClick={() => setView(AppView.HOME)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white truncate max-w-[200px]">{selectedCity}</h2>
                          </div>
                      </header>
                      {isLoading ? (
                          <div className="py-32 flex flex-col items-center justify-center gap-6">
                              <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                              <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">{t('loading')}</p>
                          </div>
                      ) : (
                          <div className="space-y-12 pb-24">
                            <div className="space-y-6">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language} />)}</div>
                            {selectedCity && <CommunityBoard city={selectedCity} language={user.language} user={user} />}
                          </div>
                      )}
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={setCurrentStopIndex} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} language={user.language} onBack={() => { if(audioSourceRef.current) audioSourceRef.current.stop(); setAudioPlayingId(null); setView(AppView.CITY_DETAIL); }} userLocation={userLocation} onVisit={(id: string, miles: number) => { const updated = { ...user, miles: user.miles + miles }; handleUpdateUser(updated); setActiveTour({ ...activeTour, stops: activeTour.stops.map(s => s.id === id ? { ...s, visited: true } : s) }); }} />
                )}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language} onCitySelect={handleCitySelect} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={(reward) => handleUpdateUser({...user, miles: user.miles + reward})} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language} onUpdateUser={handleUpdateUser} onLogout={() => { localStorage.removeItem('bdai_profile'); setView(AppView.LOGIN); }} />}
            </div>
            
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-8 pb-safe-iphone mb-4 pointer-events-none">
                  <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center w-full rounded-[3rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-12 scale-110 shadow-lg rotate-45' : 'bg-white/5'}`}>
                          <div className={view === AppView.HOME ? '-rotate-45' : ''}><BdaiLogo className="w-7 h-7" /></div>
                      </button>
                      <NavButton icon="fa-id-card" label={t('navVisa')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                      <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                  </nav>
              </div>
            )}
          </div>
      )}
    </div>
  );
}
