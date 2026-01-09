
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES, Stop } from './types';
import { generateToursForCity, generateAudio } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { FlagIcon } from './components/FlagIcon';
import { Onboarding } from './components/Onboarding';
import { CommunityBoard } from './components/CommunityBoard';
import { getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache } from './services/supabaseClient';

const TRANSLATIONS: any = {
  en: { welcome: "Welcome,", explorer: "Explorer", searchPlaceholder: "Search any city...", login: "Start Journey", verify: "Verify Code", tagline: "better destinations by ai", loading: "Consulting archives...", install: "Install App", installDesc: "Add to home screen", navElite: "Elite", navHub: "Hub", navVisa: "Visa", navStore: "Store", navHome: "Home" },
  es: { welcome: "Bienvenido,", explorer: "Explorador", searchPlaceholder: "Busca cualquier ciudad...", login: "Empezar Viaje", verify: "Verificar Código", tagline: "better destinations by ai", loading: "Consultando archivos...", install: "Instalar App", installDesc: "Añade a pantalla de inicio", navElite: "Elite", navHub: "Hub", navVisa: "Visa", navStore: "Tienda", navHome: "Inicio" },
  ca: { welcome: "Benvingut,", explorer: "Explorador", searchPlaceholder: "Cerca qualsevol ciutat...", login: "Començar Viatge", verify: "Verificar Codi", tagline: "better destinations by ai", loading: "Consultant arxius...", install: "Instal·lar App", installDesc: "Afegeix a la pantalla d'inici", navElite: "Elit", navHub: "Hub", navVisa: "Visa", navStore: "Botiga", navHome: "Inici" },
  eu: { welcome: "Ongi etorri,", explorer: "Esploratzaile", searchPlaceholder: "Bilatu edozein hiri...", login: "Bidaiari Ekin", verify: "Kodea Egiaztatu", tagline: "better destinations by ai", loading: "Artxiboak kontsultatzen...", install: "Aplikazioa Instalatu", installDesc: "Gehitu hasierako pantailan", navElite: "Elite", navHub: "Hub", navVisa: "Visa", navStore: "Denda", navHome: "Hasiera" },
  fr: { welcome: "Bienvenue,", explorer: "Explorateur", searchPlaceholder: "Chercher une ville...", login: "Commencer le Voyage", verify: "Vérifier le Code", tagline: "better destinations by ai", loading: "Consultation des archives...", install: "Instalar l'App", installDesc: "Ajouter à l'écran d'accueil", navElite: "Élite", navHub: "Hub", navVisa: "Visa", navStore: "Boutique", navHome: "Accueil" }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Explorer', 
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    return GUEST_PROFILE;
  });

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  
  // Audio State & Refs
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioStartOffsetRef = useRef<number>(0);
  const audioStartTimeRef = useRef<number>(0);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          setUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude});
        },
        err => console.error("GPS Error:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    getGlobalRanking().then(setLeaderboard);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const navigateTo = (newView: AppView) => {
    setView(newView);
    window.scrollTo(0, 0);
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) { setAuthError("Email inválido"); return; }
    setIsLoading(true);
    try {
        const { error } = await sendOtpEmail(email);
        if (error) setAuthError("Error al enviar código");
        else setLoginStep('VERIFY');
    } catch(e) { setAuthError("Error de conexión"); }
    finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
      if (!otpCode) return;
      setIsLoading(true);
      const { data, error } = await verifyOtpCode(email, otpCode);
      if (error) { setAuthError("Código incorrecto"); setIsLoading(false); return; }

      const profile = await getUserProfileByEmail(email);
      const newUser = profile ? { ...profile, isLoggedIn: true } : { ...user, id: data.user?.id || 'new', email: email, isLoggedIn: true };
      setUser(newUser);
      localStorage.setItem('bdai_profile', JSON.stringify(newUser));
      navigateTo(AppView.HOME);
      if (!newUser.interests?.length) setShowOnboarding(true);
      setIsLoading(false);
  };

  const handleCitySelect = async (cityInput: string) => {
    if (!cityInput.trim()) return;
    setSelectedCity(cityInput.trim());
    setView(AppView.CITY_DETAIL);
    setIsLoading(true);
    try {
        const cached = await getCachedTours(cityInput.trim(), user.language);
        if (cached?.length) { setTours(cached); return; }
        const res = await generateToursForCity(cityInput.trim(), user);
        if (Array.isArray(res) && res.length > 0) {
            setTours(res);
            await saveToursToCache(cityInput.trim(), user.language, res);
        }
    } finally { setIsLoading(false); }
  };

  const handleVisit = (stopId: string, milesReward: number) => {
    if (!activeTour) return;
    const stop = activeTour.stops.find(s => s.id === stopId);
    if (stop?.visited) return;

    const updatedMiles = user.miles + milesReward;
    const updatedUser = { 
      ...user, 
      miles: updatedMiles,
      stats: { ...user.stats, photosTaken: milesReward > 50 ? user.stats.photosTaken + 1 : user.stats.photosTaken }
    };
    setUser(updatedUser);
    syncUserProfile(updatedUser);

    const updatedStops = activeTour.stops.map(s => s.id === stopId ? { ...s, visited: true } : s);
    const updatedTour = { ...activeTour, stops: updatedStops };
    setActiveTour(updatedTour);
    setTours(prev => prev.map(t => t.id === activeTour.id ? updatedTour : t));
    
    if (!user.visitedCities.includes(activeTour.city)) {
        const updatedVisited = [...user.visitedCities, activeTour.city];
        const userWithCity = { ...updatedUser, visitedCities: updatedVisited };
        setUser(userWithCity);
        syncUserProfile(userWithCity);
    }
  };

  const stopCurrentAudio = () => {
    if (audioSourceRef.current) {
        try { 
          audioSourceRef.current.onended = null;
          audioSourceRef.current.stop(); 
        } catch(e) {}
        audioSourceRef.current = null;
    }
    setAudioPlayingId(null);
    setAudioLoadingId(null);
    audioBufferRef.current = null;
    audioStartOffsetRef.current = 0;
  };

  const playBuffer = (buffer: AudioBuffer, offset: number = 0, id: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e) {} }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
        const playedTime = ctx.currentTime - audioStartTimeRef.current;
        const totalExpected = buffer.duration - offset;
        if (playedTime >= totalExpected - 0.1) {
            setAudioPlayingId(null);
            audioStartOffsetRef.current = 0;
        }
    };

    audioStartTimeRef.current = ctx.currentTime;
    audioStartOffsetRef.current = offset;
    source.start(0, offset);
    audioSourceRef.current = source;
    setAudioPlayingId(id);
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) { stopCurrentAudio(); return; }
    stopCurrentAudio();
    setAudioLoadingId(id);
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const base64 = await generateAudio(text, user.language);
        if (base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const dataInt16 = new Int16Array(bytes.buffer);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
            audioBufferRef.current = buffer;
            playBuffer(buffer, 0, id);
        }
    } catch(e) { console.error("Audio error:", e); } finally { setAudioLoadingId(null); }
  };

  const handleSkipAudio = (seconds: number) => {
      if (!audioBufferRef.current || !audioContextRef.current || !audioPlayingId) return;
      const ctx = audioContextRef.current;
      const currentOffset = audioStartOffsetRef.current + (ctx.currentTime - audioStartTimeRef.current);
      let newOffset = currentOffset + seconds;
      if (newOffset < 0) newOffset = 0;
      if (newOffset > audioBufferRef.current.duration) { stopCurrentAudio(); return; }
      playBuffer(audioBufferRef.current, newOffset, audioPlayingId);
  };

  return (
    <div className="flex-1 bg-[#020617] flex flex-col relative overflow-hidden text-slate-100 h-screen w-screen font-sans">
      {showOnboarding && <Onboarding language={user.language} onLanguageSelect={(l) => setUser({...user, language: l})} onComplete={(ints) => { 
          const updated = {...user, interests: ints}; setUser(updated); syncUserProfile(updated); setShowOnboarding(false); 
      }} />}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 bg-[#020617] animate-fade-in relative">
              <div className="absolute top-12 flex gap-4 animate-fade-in z-20">
                  {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => setUser({...user, language: l.code})} className={`w-10 h-10 rounded-full border-2 transition-all ${user.language === l.code ? 'border-purple-500 scale-125 shadow-lg shadow-purple-500/30' : 'border-white/10 opacity-40'}`}>
                          <FlagIcon code={l.code} className="w-full h-full object-cover rounded-full" />
                      </button>
                  ))}
              </div>
              <div className="text-center mb-12 flex flex-col items-center relative z-10">
                  <BdaiLogo className="w-40 h-40 mb-4 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
                  <h1 className="text-6xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mt-2">{t('tagline')}</p>
              </div>
              <div className="w-full space-y-4 max-w-xs z-10">
                  {authError && <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 p-3 rounded-2xl">{authError}</p>}
                  {loginStep === 'FORM' ? (
                      <>
                          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-center text-white focus:border-purple-500/50" />
                          <button disabled={isLoading} onClick={handleSendOtp} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                              {isLoading ? "..." : t('login')}
                          </button>
                      </>
                  ) : (
                      <div className="animate-fade-in space-y-4">
                          <input type="text" maxLength={8} placeholder="CÓDIGO" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-center font-black text-2xl text-purple-400" />
                          <button disabled={isLoading} onClick={handleVerifyOtp} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                              {t('verify')}
                          </button>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar z-10 relative bg-[#020617] pb-40">
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe animate-fade-in">
                      <header className="flex justify-between items-center px-8 py-6">
                          <div className="flex items-center gap-2">
                              <BdaiLogo className="w-10 h-10"/>
                              <span className="font-black text-2xl tracking-tighter">bdai</span>
                          </div>
                          <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-xs font-black text-white">
                              <i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}
                          </div>
                      </header>
                      <div className="px-8 mb-4">
                          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                            {t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.firstName || t('explorer')}.</span>
                          </h1>
                          <div className="relative mt-8">
                            <i className="fas fa-search absolute left-6 top-6 text-slate-500"></i>
                            <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 text-white focus:border-purple-500/50 outline-none shadow-2xl" />
                          </div>
                      </div>
                      <TravelServices mode="HOME" language={user.language} onCitySelect={handleCitySelect} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe px-6 animate-fade-in">
                      <header className="flex items-center justify-between mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20">
                          <div className="flex items-center gap-4">
                            <button onClick={() => navigateTo(AppView.HOME)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white truncate max-w-[200px]">{selectedCity}</h2>
                          </div>
                      </header>
                      {isLoading ? (
                          <div className="py-32 text-center text-slate-500 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">{t('loading')}</div>
                      ) : (
                          <div className="space-y-12 pb-24">
                            <div className="space-y-6">
                                {tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); navigateTo(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language} />)}
                            </div>
                            {selectedCity && <CommunityBoard city={selectedCity} language={user.language} user={user} />}
                          </div>
                      )}
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <ActiveTourCard 
                    tour={activeTour} 
                    currentStopIndex={currentStopIndex} 
                    onNext={() => setCurrentStopIndex(p => Math.min(activeTour.stops.length - 1, p + 1))} 
                    onPrev={() => setCurrentStopIndex(p => Math.max(0, p - 1))} 
                    onPlayAudio={handlePlayAudio} 
                    onSkipAudio={handleSkipAudio}
                    audioPlayingId={audioPlayingId} 
                    audioLoadingId={audioLoadingId} 
                    language={user.language} 
                    onBack={() => { stopCurrentAudio(); navigateTo(AppView.CITY_DETAIL); }} 
                    userLocation={userLocation} 
                    onVisit={handleVisit} 
                  />
                )}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language} onCitySelect={handleCitySelect} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={(reward) => setUser({...user, miles: user.miles + reward})} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => navigateTo(AppView.HOME)} isOwnProfile={true} language={user.language} onUpdateUser={setUser} onLogout={() => navigateTo(AppView.LOGIN)} />}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 z-[100] px-8 pb-safe mb-4 pointer-events-none">
                <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center w-full rounded-[3rem] pointer-events-auto shadow-2xl">
                    <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => navigateTo(AppView.LEADERBOARD)} />
                    <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => navigateTo(AppView.TOOLS)} />
                    <button onClick={() => navigateTo(AppView.HOME)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-12 scale-110 shadow-lg rotate-45' : 'bg-white/5'}`}>
                        <div className={view === AppView.HOME ? '-rotate-45' : ''}><BdaiLogo className="w-7 h-7" /></div>
                    </button>
                    <NavButton icon="fa-id-card" label={t('navVisa')} isActive={view === AppView.PROFILE} onClick={() => navigateTo(AppView.PROFILE)} />
                    <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={view === AppView.SHOP} onClick={() => navigateTo(AppView.SHOP)} />
                </nav>
            </div>
          </>
      )}
    </div>
  );
}
