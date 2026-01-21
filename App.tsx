
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, generateAudio, standardizeCityName, getGreetingContext } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { Onboarding } from './components/Onboarding';
import { supabase, getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache, normalizeKey, validateEmailFormat } from './services/supabaseClient';

const TRANSLATIONS: any = {
  en: { welcome: "Welcome,", explorer: "Explorer", searchPlaceholder: "Search any city...", emailPlaceholder: "Your email", codeLabel: "Security Code", login: "Get Code", verify: "Enter", tagline: "Better Destinations by AI", authError: "Check email/spam", codeError: "Invalid code", selectLang: "Language", checkEmail: "Check inbox", sentTo: "Code sent to:", tryDifferent: "Change email", loading: "Syncing...", loadingTour: "Synchronizing destination...", navElite: "Elite", navHub: "Hub", navVisa: "Passport", navStore: "Shop" },
  es: { welcome: "Bienvenido,", explorer: "Explorador", searchPlaceholder: "Busca cualquier ciudad...", emailPlaceholder: "Tu email", codeLabel: "Código de Seguridad", login: "Enviar Código", verify: "Entrar", tagline: "Better Destinations by AI", authError: "Revisa tu email o SPAM", codeError: "Código no válido", selectLang: "Idioma", checkEmail: "Revisa tu email", sentTo: "Código enviado a:", tryDifferent: "Cambiar email", loading: "Cargando...", loadingTour: "Sincronizando destino...", navElite: "Élite", navHub: "Mundo", navVisa: "Visa", navStore: "Tienda" },
  ca: { welcome: "Benvingut,", explorer: "Explorador", searchPlaceholder: "Cerca qualsevol ciutat...", emailPlaceholder: "El teu email", codeLabel: "Codi de Seguretat", login: "Enviar Codi", verify: "Entrar", tagline: "Better Destinations by AI", authError: "Revisa el teu email o SPAM", codeError: "Codi no vàlid", selectLang: "Idioma", checkEmail: "Revisa el teu email", sentTo: "Codi enviat a:", tryDifferent: "Canviar email", loading: "Carregant...", loadingTour: "Sincronitzant destí...", navElite: "Elit", navHub: "Món", navVisa: "Visa", navStore: "Botiga" },
  eu: { welcome: "Ongi etorri,", explorer: "Esploratzailea", searchPlaceholder: "Bilatu edozein hiri...", emailPlaceholder: "Zure emaila", codeLabel: "Segurtasun Kodea", login: "Bidali Kodea", verify: "Sartu", tagline: "Better Destinations by AI", authError: "Begiratu zure emaila", codeError: "Kode baliogabea", selectLang: "Hizkuntza", checkEmail: "Begiratu emaila", sentTo: "Kodea hona bidali da:", tryDifferent: "Aldatu emaila", loading: "Sinkronizatzen...", loadingTour: "Helmuga prestatzen...", navElite: "Elite", navHub: "Mundua", navVisa: "Visa", navStore: "Denda" },
  fr: { welcome: "Bienvenue,", explorer: "Explorateur", searchPlaceholder: "Rechercher une ville...", emailPlaceholder: "Votre e-mail", codeLabel: "Code de Securité", login: "Envoyer le Code", verify: "Entrer", tagline: "Better Destinations by AI", authError: "Vérifiez vos emails", codeError: "Code invalide", selectLang: "Langue", checkEmail: "Vérifiez vos emails", sentTo: "Code envoyé à :", tryDifferent: "Modifier l'email", loading: "Sync...", loadingTour: "Synchronisation...", navElite: "Élite", navHub: "Monde", navVisa: "Visa", navStore: "Boutique" }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
  email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, 
  visitedCities: [], completedTours: [], badges: []
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-purple-500 scale-110' : 'text-slate-500 opacity-50'}`}>
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [loginStep, setLoginStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    return GUEST_PROFILE;
  });

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await getUserProfileByEmail(session.user.email || '');
          const newUser = { ...(profile || user), id: session.user.id, email: session.user.email, isLoggedIn: true };
          updateUserState(newUser as UserProfile);
          setView(AppView.HOME);
          if (!newUser.interests?.length) setShowOnboarding(true);
        }
      } catch (e) { handleLogoutAction(); }
    };
    initializeAuth();
    getGlobalRanking().then(setLeaderboard);
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(pos => setUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}));
    }
  }, []);

  const updateUserState = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem('bdai_profile', JSON.stringify(newUser));
  };

  const handleLogoutAction = async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    localStorage.removeItem('bdai_profile');
    setUser(GUEST_PROFILE);
    setView(AppView.LOGIN);
    setLoginStep('EMAIL');
  };

  const t = (key: string) => (TRANSLATIONS[user.language || 'es'] || TRANSLATIONS['es'])[key] || key;

  const handleSendOtp = async () => {
    if (!email || !validateEmailFormat(email) || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('loading'));
    try { 
        const { error } = await sendOtpEmail(email); 
        if (error) throw error;
        setLoginStep('CODE'); 
    } catch (e: any) { setAuthError(e.message); } 
    finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 8 || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('loading'));
    try {
      const { data, error } = await verifyOtpCode(email, otpCode);
      if (data?.user) {
        const profile = await getUserProfileByEmail(email);
        const newUser: UserProfile = { ...(profile || user), id: data.user.id, email, isLoggedIn: true };
        updateUserState(newUser);
        syncUserProfile(newUser);
        setView(AppView.HOME);
        if (!newUser.interests?.length) setShowOnboarding(true);
      } else { throw error; }
    } catch (e: any) { setAuthError(t('codeError')); } 
    finally { setIsLoading(false); }
  };

  const handleCitySelect = async (cityInput: string) => {
    if (!cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('loadingTour'));
    
    try {
        console.debug("City Select Init:", cityInput);
        
        // Estandarización 1: Normalización directa para búsqueda rápida
        const fastNorm = normalizeKey(cityInput);
        const fastCached = await getCachedTours(fastNorm, user.language || 'es');
        
        if (fastCached && fastCached.length > 0) {
            console.debug("Fast Cache Hit!");
            setSelectedCity(cityInput);
            setTours(fastCached);
            setView(AppView.CITY_DETAIL);
            return;
        }

        // Estandarización 2: IA para unificar nombres
        const standardizedName = await standardizeCityName(cityInput);
        console.debug("Standardized Name:", standardizedName);
        
        const dbCached = await getCachedTours(standardizedName, user.language || 'es');
        
        if (dbCached && dbCached.length > 0) {
            console.debug("IA Cache Hit!");
            setSelectedCity(standardizedName);
            setTours(dbCached);
            setView(AppView.CITY_DETAIL);
            return;
        }

        console.debug("Cache Miss. Generating new tours...");
        const greeting = await getGreetingContext(standardizedName, user.language || 'es');
        const generated = await generateToursForCity(standardizedName, user, greeting, false);
        
        if (generated.length > 0) {
            setTours(generated);
            // Guardamos con el nombre estandarizado para futuras consultas
            await saveToursToCache(standardizedName, user.language || 'es', generated);
            setSelectedCity(standardizedName);
            setView(AppView.CITY_DETAIL);
        }
    } catch (e) { 
        console.error("City Select Error:", e);
    } finally { 
        setIsLoading(false); 
    }
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) { 
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e){}
        audioSourceRef.current = null;
      }
      setAudioPlayingId(null);
      return; 
    }

    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e){}
      audioSourceRef.current = null;
    }
    
    setAudioLoadingId(id);
    setAudioPlayingId(null);

    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        
        const base64 = await generateAudio(text, user.language || 'es', selectedCity || 'Global');
        if (base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            
            const samplesCount = bytes.byteLength / 2;
            const buffer = ctx.createBuffer(1, samplesCount, 24000);
            const channelData = buffer.getChannelData(0);
            const dataView = new DataView(bytes.buffer);
            
            for (let i = 0; i < samplesCount; i++) {
                channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
            }
            
            const source = ctx.createBufferSource();
            source.buffer = buffer; 
            source.connect(ctx.destination);
            
            source.onended = () => {
              setAudioPlayingId(currentId => currentId === id ? null : currentId);
            };
            
            source.start(0); 
            audioSourceRef.current = source;
            setAudioPlayingId(id);
        }
    } catch(e) { 
        console.error("Audio Playback Error:", e);
        setAudioPlayingId(null);
    } finally { 
        setAudioLoadingId(null); 
    }
  };

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {showOnboarding && <Onboarding language={user.language || 'es'} onLanguageSelect={(c) => updateUserState({...user, language: c})} onComplete={(ints) => { updateUserState({...user, interests: ints}); setShowOnboarding(false); syncUserProfile({...user, interests: ints}); }} />}
      {isLoading && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(147,51,234,0.3)]"></div>
              <p className="text-white font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">{loadingMessage || t('loading')}</p>
          </div>
      )}
      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-between p-10 py-safe-iphone relative">
              <div className="text-center flex flex-col items-center pt-24">
                  <div className="w-24 h-24 mb-8 bg-purple-600/10 rounded-[2.5rem] flex items-center justify-center border border-purple-500/20 shadow-2xl">
                     <BdaiLogo className="w-16 h-16" />
                  </div>
                  <h1 className="text-5xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] mt-3">{t('tagline')}</p>
              </div>
              <div className="w-full space-y-8 max-w-xs z-10 mb-12">
                  {authError && <div className="text-red-400 text-[9px] font-black uppercase text-center bg-red-500/10 p-4 rounded-2xl mb-4">{authError}</div>}
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-6 animate-fade-in">
                          <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar py-2">
                              {LANGUAGES.map(lang => (
                                  <button 
                                    key={lang.code} 
                                    onClick={() => updateUserState({...user, language: lang.code})} 
                                    className={`w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center font-black text-[10px] ${user.language === lang.code ? 'border-purple-500 bg-purple-600 text-white scale-110 shadow-lg' : 'border-white/10 bg-white/5 text-white/40'}`}
                                  >
                                      {lang.code.toUpperCase()}
                                  </button>
                              ))}
                          </div>
                          <input type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-6 text-center text-white focus:border-purple-500 outline-none font-bold" />
                          <button disabled={isLoading || !email} onClick={handleSendOtp} className="w-full py-6 bg-white text-slate-950 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">{t('login')}</button>
                      </div>
                  ) : (
                      <div className="space-y-6 animate-fade-in text-center">
                          <div className="mb-6 p-6 bg-white/5 border border-white/10 rounded-[2rem] shadow-inner">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{t('sentTo')}</p>
                            <p className="text-sm font-black text-purple-400 break-all">{email}</p>
                          </div>
                          <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} className="w-full bg-white/5 border-white/10 outline-none rounded-3xl py-8 text-center font-black text-4xl text-white tracking-[0.3em] shadow-inner" placeholder="00000000" />
                          <button disabled={isLoading || otpCode.length < 8} onClick={handleVerifyOtp} className="w-full py-6 bg-purple-600 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all">{t('verify')}</button>
                          <button onClick={() => setLoginStep('EMAIL')} className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors mt-4">{t('tryDifferent')}</button>
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
                      <div className="px-8 mb-4">
                          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.firstName || t('explorer')}.</span></h1>
                          <div className="relative mt-8">
                            <i className="fas fa-search absolute left-6 top-6 text-slate-500"></i>
                            <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 pl-16 pr-8 text-white focus:border-purple-500/50 outline-none transition-all font-bold" />
                          </div>
                      </div>
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={handleCitySelect} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 animate-fade-in">
                      <header className="flex items-center justify-between mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20">
                          <div className="flex items-center gap-4">
                            <button onClick={() => setView(AppView.HOME)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-90 transition-transform"><i className="fas fa-arrow-left"></i></button>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-white truncate max-w-[200px]">{selectedCity}</h2>
                          </div>
                      </header>
                      <div className="space-y-6 pb-24">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language || 'es'} />)}</div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={setCurrentStopIndex} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} language={user.language || 'es'} onBack={() => { if(audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e){} setAudioPlayingId(null); setView(AppView.CITY_DETAIL); }} userLocation={userLocation} onVisit={(id: string, miles: number) => { updateUserState({...user, miles: user.miles + miles}); setActiveTour({ ...activeTour, stops: activeTour.stops.map(s => s.id === id ? { ...s, visited: true } : s) }); }} />
                )}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language || 'es'} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={handleCitySelect} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={(reward) => updateUserState({...user, miles: user.miles + reward})} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language || 'es'} onUpdateUser={(u) => { updateUserState(u); syncUserProfile(u); }} onLogout={handleLogoutAction} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-8 pb-safe-iphone mb-4 pointer-events-none">
                  <nav className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center w-full rounded-[3rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${view === AppView.HOME ? 'bg-purple-600 -mt-12 scale-110 rotate-45 shadow-purple-600/40' : 'bg-white/5'}`}>
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
