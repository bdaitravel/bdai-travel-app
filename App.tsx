
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
import { FlagIcon } from './components/FlagIcon';
import { supabase, getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache, normalizeKey, validateEmailFormat } from './services/supabaseClient';
import { STATIC_TOURS } from './data/toursData';

const TRANSLATIONS: any = {
  en: { welcome: "Bidaer Log:", explorer: "Explorer", searchPlaceholder: "Target city...", emailPlaceholder: "Credential email", codeLabel: "security code", login: "Send Code", verify: "Access", tagline: "better destinations by ai", authError: "Check email/spam", codeError: "Invalid code", selectLang: "Language", resend: "Resend", checkEmail: "Check inbox", sentTo: "Code sent to:", tryDifferent: "Change email", close: "Close", loading: "Syncing data...", loadingTour: "Dai is deconstructing urban reality...", navElite: "Elite", navHub: "Intel", navVisa: "Passport", navStore: "Store", quotaError: "Dai is exhausted or the server is busy. Retrying automatically...", timeoutError: "Connection timeout. Please try again." },
  es: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciudad objetivo...", emailPlaceholder: "Email de credencial", codeLabel: "código de seguridad", login: "Enviar Código", verify: "Acceder", tagline: "better destinations by ai", authError: "Revisa tu email o SPAM", codeError: "Código no válido", selectLang: "Idioma", resend: "Reenviar", checkEmail: "Revisa tu email", sentTo: "Código enviado a:", tryDifferent: "Cambiar email", close: "Cerrar", loading: "Sincronizando...", loadingTour: "Dai está analizando la ciudad...", navElite: "Élite", navHub: "Intel", navVisa: "Pasaporte", navStore: "Tienda", quotaError: "Dai está exhausta o el servidor está ocupado. Reintentando...", timeoutError: "Tiempo de espera agotado. Inténtalo de nuevo." },
  ca: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciutat objectiu...", emailPlaceholder: "Email de credencial", codeLabel: "codi de seguretat", login: "Enviar Codi", verify: "Accedir", tagline: "better destinations by ai", authError: "Revisa el teu email o SPAM", codeError: "Codi no vàlid", selectLang: "Idioma", resend: "Renvoyer", checkEmail: "Revisa el teu email", sentTo: "Codi enviat a:", tryDifferent: "Canviar email", close: "Tancar", loading: "Carregant...", loadingTour: "La Dai està analitzant la ciutat...", navElite: "Elit", navHub: "Intel", navVisa: "Passaport", navStore: "Botiga", quotaError: "La Dai està esgotada. Reintentant...", timeoutError: "Temps d'espera esgotat." },
  eu: { welcome: "Bidaer Log:", explorer: "Esploratzailea", searchPlaceholder: "Helburu hiria...", emailPlaceholder: "Egiaztapen emaila", codeLabel: "segurtasun kodea", login: "Bidali Kodea", verify: "Sartu", tagline: "better destinations by ai", authError: "Begiratu tu emaila edo SPAMa", codeError: "Kode baliogabea", selectLang: "Hizkuntza", resend: "Berriro bidali", checkEmail: "Begiratu tu emaila", sentTo: "Kodea hona bidali da:", tryDifferent: "Emaila aldatu", close: "Itxi", loading: "Kargatzen...", loadingTour: "Dai hiria aztertzen ari da...", navElite: "Elite", navHub: "Intel", navVisa: "Pasaportea", navStore: "Denda", quotaError: "Dai nekatuta dago. Berriro saiatzen...", timeoutError: "Denbora agortu da." },
  fr: { welcome: "Log Bidaer:", explorer: "Explorateur", searchPlaceholder: "Ville cible...", emailPlaceholder: "Email d'accès", codeLabel: "code de seguridad", login: "Envoyer le Code", verify: "Accéder", tagline: "better destinations by ai", authError: "Vérifiez vos e-mails ou SPAM", codeError: "Code invalide", selectLang: "Langue", resend: "Renvoyer", checkEmail: "Vérifiez vos e-mails", sentTo: "Code envoyé à :", tryDifferent: "Changer d'e-mail", close: "Fermer", loading: "Chargement...", loadingTour: "Dai analyse la ville...", navElite: "Élite", navHub: "Intel", navVisa: "Passeport", navStore: "Boutique", quotaError: "Dai est épuisée. Nouvelle tentative...", timeoutError: "Délai d'attente dépassé." }
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
    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const profile = await getUserProfileByEmail(session.user.email || '');
            const newUser = { ...(profile || user), id: session.user.id, email: session.user.email, isLoggedIn: true };
            setUser(newUser as any);
            setView(AppView.HOME);
            if (!newUser.interests?.length) setShowOnboarding(true);
        }
    };
    checkAuth();
    getGlobalRanking().then(setLeaderboard);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => setUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}));
    }
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language || 'es'] || TRANSLATIONS['es'])[key] || key;

  const handleSendOtp = async () => {
    if (!email || !validateEmailFormat(email) || isLoading) return;
    setAuthError(null);
    setIsLoading(true);
    try {
      const { error } = await sendOtpEmail(email);
      if (error) throw error;
      setLoginStep('CODE');
    } catch (e: any) { 
      setAuthError(e.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6 || isLoading) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await verifyOtpCode(email, otpCode);
      if (error || !data?.user) { 
          setAuthError(error?.message || t('codeError')); 
      } else {
        const profile = await getUserProfileByEmail(email);
        const newUser: UserProfile = { ...(profile || user), id: data.user.id, email, isLoggedIn: true };
        setUser(newUser);
        localStorage.setItem('bdai_profile', JSON.stringify(newUser));
        syncUserProfile(newUser);
        setView(AppView.HOME);
        if (!newUser.interests?.length) setShowOnboarding(true);
      }
    } catch (e: any) { setAuthError(e.message); } 
    finally { setIsLoading(false); }
  };

  const handleCitySelect = async (cityInput: string) => {
    if (!cityInput.trim() || isLoading) return;
    setAuthError(null);
    setIsLoading(true);
    setLoadingMessage(t('loadingTour'));
    
    try {
        const standardizedName = await standardizeCityName(cityInput);
        setSelectedCity(standardizedName);
        setLoadingMessage(`${t('loadingTour')} (${standardizedName})`);

        const dbCached = await getCachedTours(standardizedName, user.language || 'es');
        if (dbCached && dbCached.length > 0) {
            setTours(dbCached);
            setView(AppView.CITY_DETAIL);
            setIsLoading(false);
            return;
        }

        const normInput = normalizeKey(standardizedName);
        const staticMatches = STATIC_TOURS.filter(t => {
            const normCity = normalizeKey(t.city);
            return normCity.includes(normInput) || normInput.includes(normCity);
        });
        
        if (staticMatches.length > 0) {
            setTours(staticMatches);
            setView(AppView.CITY_DETAIL);
            setIsLoading(false);
            return;
        }

        const greeting = await getGreetingContext(standardizedName, user.language || 'es');
        const generated = await generateToursForCity(standardizedName, user, greeting, false);
        
        if (generated && generated.length > 0) {
            setTours(generated);
            await saveToursToCache(standardizedName, user.language || 'es', generated);
            setView(AppView.CITY_DETAIL);
        }
    } catch (e: any) { 
        console.error("City selection error:", e); 
        const isQuota = e.message?.includes("503") || e.message?.includes("429") || e.message?.includes("UNAVAILABLE");
        setAuthError(isQuota ? t('quotaError') : e.message);
    } finally { 
        setIsLoading(false); 
    }
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) { 
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setAudioPlayingId(null);
      return; 
    }
    if (audioSourceRef.current) audioSourceRef.current.stop();
    setAudioLoadingId(id);
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const base64 = await generateAudio(text, user.language || 'es', selectedCity || 'Global');
        if (base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const validLength = Math.floor(bytes.byteLength / 2);
            const dataInt16 = new Int16Array(bytes.buffer, 0, validLength);
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
            const source = ctx.createBufferSource();
            source.buffer = buffer; source.connect(ctx.destination);
            source.onended = () => setAudioPlayingId(null);
            source.start(0); audioSourceRef.current = source;
            setAudioPlayingId(id);
        }
    } catch(e) { 
        console.error("Audio Playback Error:", e);
    } finally { 
        setAudioLoadingId(null); 
    }
  };

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {showOnboarding && <Onboarding language={user.language || 'es'} onLanguageSelect={(c) => setUser(p => ({...p, language: c}))} onComplete={(ints) => { setUser(p => ({...p, interests: ints})); setShowOnboarding(false); syncUserProfile({...user, interests: ints}); }} />}
      
      {isLoading && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6"></div>
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
                  {authError && <div className="text-red-400 text-[9px] font-black uppercase text-center bg-red-500/10 p-5 rounded-3xl mb-4 border border-red-500/20">{authError}</div>}
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-6 animate-fade-in">
                          <div className="space-y-4">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">{t('selectLang')}</p>
                              <div className="flex justify-center gap-4 overflow-x-auto no-scrollbar py-2">
                                  {LANGUAGES.map(lang => (
                                      <button 
                                        key={lang.code} 
                                        onClick={() => setUser(p => ({...p, language: lang.code}))}
                                        className={`w-10 h-10 rounded-2xl overflow-hidden border-2 transition-all flex items-center justify-center bg-white/5 ${user.language === lang.code ? 'border-purple-500 scale-110 shadow-lg' : 'border-white/10 opacity-40'}`}
                                      >
                                          <FlagIcon code={lang.code} className="w-6 h-6 object-cover" />
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div className="space-y-4">
                            <input type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-6 text-center text-white focus:border-purple-500 outline-none transition-all placeholder:text-slate-700 font-bold" />
                            <button disabled={isLoading || !email} onClick={handleSendOtp} className="w-full py-6 bg-white text-slate-950 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                                {t('login')}
                            </button>
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-6 animate-fade-in text-center">
                          <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('sentTo')}</p>
                              <p className="text-xs font-bold text-purple-400">{email}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-inner relative group focus-within:border-purple-500/50">
                            <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} className="w-full bg-transparent border-none outline-none text-center font-black text-4xl text-white tracking-[0.2em]" placeholder="000000" />
                          </div>
                          <button disabled={isLoading || otpCode.length < 6} onClick={handleVerifyOtp} className="w-full py-6 bg-purple-600 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all">
                              {t('verify')}
                          </button>
                          <button onClick={() => setLoginStep('EMAIL')} className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">{t('tryDifferent')}</button>
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
                          {authError && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center animate-shake">{authError}</div>}
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
                  <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={setCurrentStopIndex} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} language={user.language || 'es'} onBack={() => { if(audioSourceRef.current) audioSourceRef.current.stop(); setAudioPlayingId(null); setView(AppView.CITY_DETAIL); }} userLocation={userLocation} onVisit={(id: string, miles: number) => { setUser(p => ({...p, miles: p.miles + miles})); setActiveTour({ ...activeTour, stops: activeTour.stops.map(s => s.id === id ? { ...s, visited: true } : s) }); }} />
                )}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language || 'es'} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={handleCitySelect} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={(reward) => setUser(p => ({...p, miles: p.miles + reward}))} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language || 'es'} onUpdateUser={(u) => { setUser(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); syncUserProfile(u); }} onLogout={() => { localStorage.removeItem('bdai_profile'); setView(AppView.LOGIN); }} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-8 pb-safe-iphone mb-4 pointer-events-none">
                  <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center w-full rounded-[3rem] pointer-events-auto shadow-2xl">
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
