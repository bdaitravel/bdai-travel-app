
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES, Stop } from './types';
import { generateToursForCity, generateAudio, translateTours, standardizeCityName } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { FlagIcon } from './components/FlagIcon';
import { Onboarding } from './components/Onboarding';
import { CommunityBoard } from './components/CommunityBoard';
import { STATIC_TOURS } from './data/toursData';
import { getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache, normalizeKey } from './services/supabaseClient';

const TRANSLATIONS: any = {
  en: { 
    welcome: "Welcome,", explorer: "Explorer", searchPlaceholder: "Search any city...", login: "Start Journey", verify: "Verify Code", tagline: "better destinations by ai", 
    loading: "Consulting archives...", standardizing: "Analyzing location...", translating: "Translating historical files...", navElite: "Elite", navHub: "Hub", navVisa: "Visa", navStore: "Store", navHome: "Home", authError: "Connection error", 
    codeError: "Incorrect code", pwaTitle: "Install bdai", pwaDesc: "For a better experience and to save space:", pwaStep: "Tap Share and 'Add to Home Screen'", pwaClose: "OK" 
  },
  es: { 
    welcome: "Bienvenido,", explorer: "Explorador", searchPlaceholder: "Busca cualquier ciudad...", login: "Empezar Viaje", verify: "Verificar Código", tagline: "better destinations by ai", 
    loading: "Consultando archivos...", standardizing: "Analizando ubicación...", translating: "Traduciendo archivos históricos...", navElite: "Elite", navHub: "Hub", navVisa: "Visa", navStore: "Tienda", navHome: "Inicio", authError: "Error de conexión", 
    codeError: "Código incorrecto", pwaTitle: "Instalar bdai", pwaDesc: "Para una mejor experiencia y no consumir espacio:", pwaStep: "Pulsa Compartir y 'Añadir a pantalla de inicio'", pwaClose: "Vale" 
  },
  ca: { 
    welcome: "Benvingut,", explorer: "Explorador", searchPlaceholder: "Cerca qualsevol ciutat...", login: "Començar Viatge", verify: "Verificar Codi", tagline: "better destinations by ai", 
    loading: "Consultant arxius...", standardizing: "Analitzant ubicació...", translating: "Traduint arxius històrics...", navElite: "Elit", navHub: "Hub", navVisa: "Visat", navStore: "Botiga", navHome: "Inici", authError: "Error de connexió", 
    codeError: "Codi incorrecte", pwaTitle: "Instal·lar bdai", pwaDesc: "Per a una millor experiència i no consumir espai:", pwaStep: "Prem Compartir i 'Afegir a la pantalla d'inici'", pwaClose: "D'acord" 
  },
  eu: { 
    welcome: "Ongi etorri,", explorer: "Esploratzailea", searchPlaceholder: "Bilatu edozein hiri...", login: "Bidaia Hasi", verify: "Egiaztatu Kodea", tagline: "better destinations by ai", 
    loading: "Artxiboak kontsultatzen...", standardizing: "Kokapena aztertzen...", translating: "Artxibo historikoak itzultzen...", navElite: "Elite", navHub: "Hub", navVisa: "Visa", navStore: "Denda", navHome: "Hasiera", authError: "Konexio errorea", 
    codeError: "Kode okerra", pwaTitle: "Instalatu bdai", pwaDesc: "Esperientzia hobea izateko eta espaziorik ez kontsumitzeko:", pwaStep: "Sakatu Partekatu eta 'Gehitu hasierako pantailan'", pwaClose: "Ados" 
  },
  fr: { 
    welcome: "Bienvenue,", explorer: "Explorateur", searchPlaceholder: "Recherchez une ville...", login: "Commencer le Voyage", verify: "Vérifier le Code", tagline: "better destinations by ai", 
    loading: "Consultation des archives...", standardizing: "Analyse du lieu...", translating: "Traduction des fichiers historiques...", navElite: "Élite", navHub: "Hub", navVisa: "Visa", navStore: "Boutique", navHome: "Accueil", authError: "Erreur de connexion", 
    codeError: "Code incorrect", pwaTitle: "Installer bdai", pwaDesc: "Pour une meilleure expérience et économiser de l'espace :", pwaStep: "Appuyez sur Partager et 'Ajouter à l'écran d'accueil'", pwaClose: "D'accord" 
  }
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
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isStandardizing, setIsStandardizing] = useState(false);
  
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

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone) {
      setTimeout(() => setShowPwaPrompt(true), 3000);
    }

    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => setUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        err => console.error("GPS Error:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    getGlobalRanking().then(setLeaderboard);
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); }
  }, []);

  const unlockAudio = async () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }
  };

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const handleSendOtp = async () => {
    await unlockAudio();
    if (!email || isLoading) return;
    setAuthError(null);
    setIsLoading(true);
    try {
      const { error } = await sendOtpEmail(email);
      if (error) setAuthError(t('authError'));
      else setLoginStep('VERIFY');
    } catch (e) {
      setAuthError(t('authError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
      await unlockAudio();
      if (!otpCode || isLoading) return;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
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
          const newUser: UserProfile = profile ? 
            { ...profile, isLoggedIn: true } : 
            { ...user, id: data.user.id, email: email, isLoggedIn: true, language: user.language || 'es' };
          
          setUser(newUser);
          localStorage.setItem('bdai_profile', JSON.stringify(newUser));

          setTimeout(() => {
              setView(AppView.HOME);
              if (!newUser.interests?.length) setShowOnboarding(true);
              setIsLoading(false);
          }, 800);
      } catch (e) { 
        setAuthError(t('authError')); 
        setIsLoading(false); 
      }
  };

  const handleCitySelect = async (cityInput: string) => {
    await unlockAudio();
    if (!cityInput.trim()) return;
    
    setIsLoading(true);
    setIsStandardizing(true);
    
    // 1. Estandarizar nombre de la ciudad vía IA para unificar el caché
    const standardizedName = await standardizeCityName(cityInput);
    const normalizedSearch = normalizeKey(standardizedName);
    
    setSelectedCity(standardizedName);
    setView(AppView.CITY_DETAIL);
    setIsStandardizing(false);
    setIsTranslating(false);

    try {
        // 2. Intentar cargar tours del idioma del usuario de Supabase usando el nombre estandarizado
        let finalTours = await getCachedTours(standardizedName, user.language) || [];
        
        // 3. Si no hay en el idioma actual y NO es español, buscar en Español para traducir
        if (finalTours.length === 0 && user.language !== 'es') {
            const spanishTours = await getCachedTours(standardizedName, 'es');
            if (spanishTours?.length) {
                setIsTranslating(true);
                finalTours = await translateTours(spanishTours, user.language);
                if (finalTours.length > 0) {
                    await saveToursToCache(standardizedName, user.language, finalTours);
                }
                setIsTranslating(false);
            }
        }

        // 4. Si sigue vacío, buscar en tours estáticos
        if (finalTours.length === 0) {
            const matchingStatic = STATIC_TOURS.filter(t => normalizeKey(t.city) === normalizedSearch);
            if (matchingStatic.length > 0) {
                if (user.language !== 'es') {
                    setIsTranslating(true);
                    finalTours = await translateTours(matchingStatic, user.language);
                    if (finalTours.length > 0) {
                        await saveToursToCache(standardizedName, user.language, finalTours);
                    }
                    setIsTranslating(false);
                } else {
                    finalTours = matchingStatic;
                    await saveToursToCache(standardizedName, 'es', finalTours);
                }
            }
        }

        // 5. Si después de todo NO hay nada, generar 3 tours temáticos nuevos
        if (finalTours.length === 0) {
            const generated = await generateToursForCity(standardizedName, user);
            if (generated.length > 0) {
                finalTours = generated;
                await saveToursToCache(standardizedName, user.language, generated);
                
                // Si el idioma no es español, guardamos una versión en español para caché global
                if (user.language !== 'es') {
                    setIsTranslating(true);
                    const spanishCopy = await translateTours(generated, 'es');
                    await saveToursToCache(standardizedName, 'es', spanishCopy);
                    setIsTranslating(false);
                }
            }
        }

        setTours(finalTours);
    } catch (e) {
        console.error("Fatal Error in City Select:", e);
    } finally { 
        setIsLoading(false); 
        setIsTranslating(false);
        setIsStandardizing(false);
    }
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
    } catch(e) { console.error("Audio error:", e); } finally { setAudioLoadingId(null); }
  };

  const handleStopSwitch = (idx: number) => {
      unlockAudio();
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setAudioPlayingId(null);
      setCurrentStopIndex(idx);
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('bdai_profile', JSON.stringify(updated));
    syncUserProfile(updated);
  };

  return (
    <div className="flex-1 bg-[#020617] flex flex-col relative overflow-hidden text-slate-100 h-[100dvh] w-full font-sans" onClick={() => unlockAudio()}>
      {showOnboarding && <Onboarding language={user.language} onLanguageSelect={(l) => setUser({...user, language: l})} onComplete={(ints) => { 
          const updated = {...user, interests: ints}; setUser(updated); syncUserProfile(updated); setShowOnboarding(false); 
      }} />}

      {showPwaPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-[10000] p-4 pb-safe-iphone animate-slide-up-banner">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-[2.5rem] p-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shrink-0 shadow-lg">
                  b
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-black text-[11px] uppercase tracking-widest truncate">{t('pwaTitle')}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{t('pwaDesc')}</p>
                  <p className="text-[8px] text-purple-400 font-black uppercase mt-2 flex items-center gap-1">
                    <i className="fas fa-arrow-up-from-bracket text-[10px]"></i> {t('pwaStep')}
                  </p>
                </div>
            </div>
            <button onClick={() => setShowPwaPrompt(false)} className="bg-white/10 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">{t('pwaClose')}</button>
          </div>
        </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 bg-[#020617] animate-fade-in relative pt-safe-iphone">
              <div className="absolute top-12 flex gap-4 animate-fade-in z-20">
                  {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => setUser({...user, language: l.code})} className={`w-10 h-10 rounded-full border-2 transition-all ${user.language === l.code ? 'border-purple-500 scale-125 shadow-lg shadow-purple-500/30' : 'border-white/10 opacity-40'}`}>
                          <FlagIcon code={l.code} className="w-full h-full object-cover rounded-full" />
                      </button>
                  ))}
              </div>
              <div className="text-center mb-12 flex flex-col items-center relative z-10">
                  <div className="w-40 h-40 mb-4 bg-purple-600/10 rounded-full flex items-center justify-center border border-purple-500/20 shadow-2xl">
                     <BdaiLogo className="w-24 h-24 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                  </div>
                  <h1 className="text-6xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mt-2">{t('tagline')}</p>
              </div>
              <div className="w-full space-y-4 max-w-xs z-10">
                  {authError && <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 p-3 rounded-2xl animate-shake">{authError}</p>}
                  {loginStep === 'FORM' ? (
                      <>
                          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-center text-white focus:border-purple-500/50" />
                          <button disabled={isLoading} onClick={handleSendOtp} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                              {isLoading ? <i className="fas fa-spinner fa-spin"></i> : t('login')}
                          </button>
                      </>
                  ) : (
                      <div className="animate-fade-in space-y-4">
                          <input type="text" inputMode="numeric" maxLength={8} placeholder="CÓDIGO" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-center font-black text-2xl text-purple-400 tracking-widest" />
                          <button disabled={isLoading} onClick={handleVerifyOtp} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                              {isLoading ? <i className="fas fa-spinner fa-spin text-xl"></i> : t('verify')}
                          </button>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-[#020617] ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-40'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe-iphone animate-fade-in">
                      <header className="flex justify-between items-center px-8 py-6">
                          <div className="flex items-center gap-3">
                              <BdaiLogo className="w-10 h-10"/>
                              <span className="font-black text-2xl tracking-tighter">bdai</span>
                          </div>
                          <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-xs font-black text-white">
                              <i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}
                          </div>
                      </header>
                      <div className="px-8 mb-4">
                          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">
                            {t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.firstName || t('explorer')}.</span>
                          </h1>
                          <div className="relative mt-8">
                            <i className="fas fa-search absolute left-6 top-6 text-slate-500"></i>
                            <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 pl-16 pr-8 text-white focus:border-purple-500/50 outline-none shadow-2xl" />
                          </div>
                      </div>
                      <TravelServices mode="HOME" language={user.language} onCitySelect={handleCitySelect} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 animate-fade-in">
                      <header className="flex items-center justify-between mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20">
                          <div className="flex items-center gap-4">
                            <button onClick={() => { setView(AppView.HOME); unlockAudio(); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white truncate max-w-[200px]">{selectedCity}</h2>
                          </div>
                      </header>
                      {isLoading ? (
                          <div className="py-32 flex flex-col items-center justify-center gap-6">
                              <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                              <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">
                                {isStandardizing ? t('standardizing') : isTranslating ? t('translating') : t('loading')}
                              </p>
                          </div>
                      ) : (
                          <div className="space-y-12 pb-24">
                            <div className="space-y-6">
                                {tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0); unlockAudio();}} language={user.language} />)}
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
                    onNext={() => handleStopSwitch(Math.min(activeTour.stops.length - 1, currentStopIndex + 1))} 
                    onPrev={() => handleStopSwitch(Math.max(0, currentStopIndex - 1))} 
                    onJumpTo={handleStopSwitch}
                    onPlayAudio={handlePlayAudio} 
                    audioPlayingId={audioPlayingId} 
                    audioLoadingId={audioLoadingId} 
                    language={user.language} 
                    onBack={() => { if(audioSourceRef.current) audioSourceRef.current.stop(); setAudioPlayingId(null); setView(AppView.CITY_DETAIL); unlockAudio(); }} 
                    userLocation={userLocation} 
                    onVisit={(id: string, miles: number) => {
                      const stop = activeTour.stops.find(s => s.id === id);
                      if (stop?.visited) return;
                      const updated = { ...user, miles: user.miles + miles };
                      handleUpdateUser(updated);
                      setActiveTour({ ...activeTour, stops: activeTour.stops.map(s => s.id === id ? { ...s, visited: true } : s) });
                    }} 
                  />
                )}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => unlockAudio()} language={user.language} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language} onCitySelect={handleCitySelect} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={(reward) => handleUpdateUser({...user, miles: user.miles + reward})} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => { setView(AppView.HOME); unlockAudio(); }} isOwnProfile={true} language={user.language} onUpdateUser={handleUpdateUser} onLogout={() => { localStorage.removeItem('bdai_profile'); setView(AppView.LOGIN); }} />}
            </div>
            
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-8 pb-safe-iphone mb-4 pointer-events-none">
                  <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center w-full rounded-[3rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => { setView(AppView.LEADERBOARD); unlockAudio(); }} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => { setView(AppView.TOOLS); unlockAudio(); }} />
                      <button onClick={() => { setView(AppView.HOME); unlockAudio(); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-12 scale-110 shadow-lg rotate-45' : 'bg-white/5'}`}>
                          <div className={view === AppView.HOME ? '-rotate-45' : ''}><BdaiLogo className="w-7 h-7" /></div>
                      </button>
                      <NavButton icon="fa-id-card" label={t('navVisa')} isActive={view === AppView.PROFILE} onClick={() => { setView(AppView.PROFILE); unlockAudio(); }} />
                      <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={view === AppView.SHOP} onClick={() => { setView(AppView.SHOP); unlockAudio(); }} />
                  </nav>
              </div>
            )}
          </div>
      )}
    </div>
  );
}
