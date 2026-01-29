
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
import { AdminPanel } from './components/AdminPanel';
import { CommunityBoard } from './components/CommunityBoard';
import { supabase, getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat } from './services/supabaseClient';

const TRANSLATIONS: any = {
  en: { welcome: "Bidaer Log:", explorer: "Explorer", searchPlaceholder: "Target city...", emailPlaceholder: "Email address", login: "Send Code", verify: "Authenticate", tagline: "better destinations by ai", authError: "Check email/spam", codeError: "Invalid code", selectLang: "Select Language", loading: "Syncing...", loadingTour: "Dai is deconstructing reality...", analyzing: "Locating city...", generating: "Generating tours...", translating: "Translating...", navElite: "Elite", navHub: "Intel", navVisa: "Passport", navStore: "Store", apiError: "AI AUTH ERROR: Check your API_KEY.", quotaError: "Dai is tired. Wait a bit.", genError: "Sync error. Try again." },
  es: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciudad objetivo...", emailPlaceholder: "Email", login: "Enviar Código", verify: "Acceder", tagline: "better destinations by ai", authError: "Revisa tu email o SPAM", codeError: "Código no válido", selectLang: "Idioma", loading: "Sincronizando...", loadingTour: "Dai está analizando la ciudad...", analyzing: "Localizando ciudad...", generating: "Generando tours...", translating: "Traduciendo...", navElite: "Élite", navHub: "Intel", navVisa: "Pasaporte", navStore: "Tienda", apiError: "ERROR DE IA: Revisa tu API_KEY.", quotaError: "Dai está saturada. Espera unos minutos.", genError: "Error de sincronización. Reintenta." },
  pt: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Cidade alvo...", emailPlaceholder: "Email", login: "Enviar Código", verify: "Autenticar", tagline: "better destinations by ai", authError: "Verifique o email", codeError: "Código inválido", selectLang: "Idioma", loading: "Sincronizando...", loadingTour: "Dai está gerando...", analyzing: "Localizando cidade...", generating: "Gerando tours...", translating: "Traduzindo...", navElite: "Elite", navHub: "Intel", navVisa: "Passaporte", navStore: "Loja", apiError: "Erro de IA.", quotaError: "Dai cansada. Espere.", genError: "Erro de sincronização." },
  it: { welcome: "Log Bidaer:", explorer: "Esploratore", searchPlaceholder: "Città obiettivo...", emailPlaceholder: "Email", login: "Invia Codice", verify: "Autentica", tagline: "better destinations by ai", authError: "Controlla email", codeError: "Codice non valido", selectLang: "Lingua", loading: "Sincronizzazione...", loadingTour: "Dai sta analizzando...", analyzing: "Localizzazione città...", generating: "Generazione tour...", translating: "Traduzione...", navElite: "Elite", navHub: "Intel", navVisa: "Passaporto", navStore: "Negozio", apiError: "Errore IA.", quotaError: "Dai è stanca. Aspetta.", genError: "Errore di sincronizzazione." },
  ca: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciutat objectiu...", emailPlaceholder: "Email", login: "Enviar Codi", verify: "Accedir", tagline: "better destinations by ai", authError: "Revisa l'email", codeError: "Codi no vàlid", selectLang: "Idioma", loading: "Sincronitzant...", loadingTour: "Dai està analitzant...", analyzing: "Localitzant ciutat...", generating: "Generant tours...", translating: "Traduint...", navElite: "Elit", navHub: "Intel", navVisa: "Passaport", navStore: "Botiga", apiError: "Error d'IA.", quotaError: "Dai està saturada.", genError: "Error de sincronització." },
  eu: { welcome: "Log Bidaer:", explorer: "Esploratzailea", searchPlaceholder: "Helmuga...", emailPlaceholder: "Emaila", login: "Kodea Bidali", verify: "Sartu", tagline: "better destinations by ai", authError: "Egiaztatu emaila", codeError: "Kode okerra", selectLang: "Hizkuntza", loading: "Sinkronizatzen...", loadingTour: "Dai aztertzen ari da...", analyzing: "Hiria kokatzen...", generating: "Tourrak sortzen...", translating: "Itzultzen...", navElite: "Elite", navHub: "Intel", navVisa: "Pasaportea", navStore: "Denda", apiError: "IA errorea.", quotaError: "Dai nekatuta dago.", genError: "Sinkronizazio errorea." }
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
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [loginStep, setLoginStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchOptions, setSearchOptions] = useState<{name: string, spanishName: string, country: string}[] | null>(null);
  
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    return GUEST_PROFILE;
  });

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const profile = await getUserProfileByEmail(session.user.email || '');
            const newUser = { ...(profile || user), id: session.user.id, email: session.user.email, isLoggedIn: true };
            setUser(newUser as any); setView(AppView.HOME);
        }
        setIsVerifyingSession(false);
    };
    checkAuth();
    getGlobalRanking().then(setLeaderboard);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            null, { enableHighAccuracy: true }
        );
    }
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language || 'es'] || TRANSLATIONS['es'])[key] || key;

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
    syncUserProfile(updatedUser);
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string}) => {
    setIsLoading(true); 
    setSearchOptions(null); 
    setLoadingMessage(t('loadingTour'));
    const targetLang = user.language || 'es';
    
    try {
        setSelectedCity(official.spanishName); 
        setSelectedCountry(official.country);

        // Usamos ciudad + país para discriminar en la caché
        const cached = await getCachedTours(official.spanishName, official.country, targetLang);
        
        if (cached) {
            if (cached.langFound === targetLang) {
                setTours(cached.data); setView(AppView.CITY_DETAIL);
                setIsLoading(false); return;
            } else {
                setLoadingMessage(t('translating'));
                const translated = await translateTours(cached.data, targetLang);
                setTours(translated);
                await saveToursToCache(official.spanishName, official.country, targetLang, translated);
                setView(AppView.CITY_DETAIL);
                setIsLoading(false); return;
            }
        }

        setLoadingMessage(t('generating'));
        const generated = await generateToursForCity(official.spanishName, official.country, user);
        
        if (!generated || generated.length === 0) throw new Error("GEN_FAILED");

        setTours(generated); 
        await saveToursToCache(official.spanishName, official.country, targetLang, generated);
        setView(AppView.CITY_DETAIL);
    } catch (e: any) { 
        console.error("Critical Flow Error:", e);
        if (e.message === 'AUTH_ERROR') setAuthError(t('apiError'));
        else if (e.message === 'QUOTA_EXCEEDED') setAuthError(t('quotaError'));
        else setAuthError(t('genError'));
    } finally { setIsLoading(false); }
  };

  const handleCitySelect = async (cityInput: string) => {
    if (!cityInput.trim() || isLoading) return;
    setAuthError(null);
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));

    try {
        const results = await standardizeCityName(cityInput);
        if (results && results.length > 0) {
            if (results.length === 1) await processCitySelection(results[0]);
            else { setSearchOptions(results); setIsLoading(false); }
        } else await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
    } catch (e: any) {
        if (e.message === 'AUTH_ERROR') { setAuthError(t('apiError')); setIsLoading(false); }
        else await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
    }
  };

  const handleSendOtp = async () => {
    if (!email || !validateEmailFormat(email) || isLoading) return;
    setIsLoading(true); setAuthError(null);
    try { const { error } = await sendOtpEmail(email); if (error) throw error; setLoginStep('CODE'); } 
    catch (e: any) { setAuthError(e.message); } finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6 || isLoading) return;
    setIsLoading(true); setAuthError(null);
    try {
      const { data, error } = await verifyOtpCode(email, otpCode);
      if (error || !data?.user) throw error;
      const profile = await getUserProfileByEmail(email);
      handleUpdateUser({ ...(profile || user), id: data.user.id, email, isLoggedIn: true });
      setView(AppView.HOME);
    } catch (e: any) { setAuthError(e.message); } finally { setIsLoading(false); }
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-10"><BdaiLogo className="w-24 h-24 mb-6 animate-pulse" /><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{t('loading')}</p></div>;

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-10"><div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6"></div><p className="text-white font-black uppercase text-[10px] tracking-[0.4em] text-center">{loadingMessage || t('loading')}</p></div>}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-between p-8 py-safe-iphone relative bg-[#020617]">
              <div className="text-center pt-12">
                  <BdaiLogo className="w-24 h-24 mx-auto mb-6" />
                  <h1 className="text-4xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mt-2">{t('tagline')}</p>
              </div>

              <div className="w-full max-w-sm space-y-12">
                  <div className="flex flex-col gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 text-center">{t('selectLang')}</p>
                    <div className="flex justify-center gap-6 overflow-x-auto no-scrollbar py-2">
                        {LANGUAGES.map(lang => (
                            <button key={lang.code} onClick={() => handleUpdateUser({...user, language: lang.code})} className="flex flex-col items-center gap-2 group transition-all">
                                <FlagIcon code={lang.code} className={`w-10 h-10 transition-all ${user.language === lang.code ? 'border-purple-500 ring-4 ring-purple-500/20 scale-110' : 'opacity-40 grayscale group-hover:opacity-80'}`} />
                                <span className={`text-[7px] font-black uppercase tracking-widest ${user.language === lang.code ? 'text-white' : 'text-slate-600'}`}>{lang.name}</span>
                            </button>
                        ))}
                    </div>
                  </div>
                  
                  <div className="w-full space-y-4 max-w-xs mx-auto">
                      {authError && <div className="text-red-400 text-[8px] font-black uppercase text-center bg-red-500/10 p-3 rounded-2xl border border-red-500/20">{authError}</div>}
                      {loginStep === 'EMAIL' ? (
                          <div className="space-y-4">
                              <input type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl py-5 px-6 text-center text-white focus:border-purple-500 outline-none font-bold placeholder:opacity-20 transition-all" />
                              <button onClick={handleSendOtp} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95">{t('login')}</button>
                          </div>
                      ) : (
                          <div className="space-y-6 text-center animate-fade-in">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">Check <span className="text-purple-400">{email}</span></p>
                              <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-white/5 border border-purple-500/30 rounded-3xl py-6 text-center font-black text-3xl text-white tracking-widest outline-none" placeholder="000000" />
                              <button onClick={handleVerifyOtp} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">{t('verify')}</button>
                          </div>
                      )}
                  </div>
              </div>
              <div className="pb-8 text-center opacity-30"><span className="text-[7px] font-bold text-white uppercase tracking-widest">© 2025 BDAI INTEL CORE</span></div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-[#020617] ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-40'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe-iphone px-8 animate-fade-in">
                      <header className="flex justify-between items-center py-6">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-10 h-10"/><span className="font-black text-2xl tracking-tighter">bdai</span></div>
                          <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div>
                      </header>
                      
                      {authError && <div className="text-red-400 text-[10px] font-black uppercase text-center bg-red-500/10 p-4 rounded-3xl border border-red-500/20 mb-6">{authError}</div>}

                      <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.firstName || t('explorer')}.</span></h1>
                      
                      <div className="relative mt-8 flex gap-3">
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/10 rounded-[2rem] py-5 px-8 text-white focus:border-purple-500 outline-none font-bold" />
                          <button onClick={() => handleCitySelect(searchVal)} className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-all"><i className="fas fa-search"></i></button>
                      </div>

                      {searchOptions && (
                          <div className="mt-6 space-y-2 animate-fade-in bg-white/5 p-4 rounded-[2rem] border border-white/5">
                              {searchOptions.map((opt: any, i: number) => (
                                  <button key={i} onClick={() => processCitySelection(opt)} className="w-full p-4 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-between active:bg-purple-600 transition-all text-left"><div><span className="text-white font-black uppercase text-[11px]">{opt.spanishName}</span><br/><span className="text-[8px] text-slate-500 font-bold uppercase">{opt.country}</span></div><i className="fas fa-chevron-right text-[10px] text-slate-700"></i></button>
                              ))}
                          </div>
                      )}
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={(name) => handleCitySelect(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 animate-fade-in">
                      <header className="flex items-center gap-4 mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left"></i></button><h2 className="text-2xl font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity} <span className="text-slate-500 text-[10px] ml-2 tracking-widest">{selectedCountry}</span></h2></header>
                      <div className="space-y-4 pb-12">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language || 'es'} />)}</div>
                      <CommunityBoard city={selectedCity} language={user.language || 'es'} user={user} />
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={handleUpdateUser} language={user.language || 'es'} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language || 'es'} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={(name) => handleCitySelect(name)} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={(reward) => handleUpdateUser({...user, miles: user.miles + reward})} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language || 'es'} onUpdateUser={handleUpdateUser} onLogout={() => { localStorage.removeItem('bdai_profile'); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>
            
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-8 pb-safe-iphone mb-4 pointer-events-none">
                  <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center w-full rounded-[2.5rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110' : 'bg-white/5'}`}><BdaiLogo className="w-6 h-6" /></button>
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
