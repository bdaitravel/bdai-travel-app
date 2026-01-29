
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, standardizeCityName, translateTours } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { Onboarding } from './components/Onboarding';
import { FlagIcon } from './components/FlagIcon';
import { AdminPanel } from './components/AdminPanel';
import { CommunityBoard } from './components/CommunityBoard';
import { supabase, getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat, normalizeKey } from './services/supabaseClient';

const TRANSLATIONS: any = {
  en: { welcome: "Bidaer Log:", explorer: "Explorer", searchPlaceholder: "Target city...", emailPlaceholder: "Email address", login: "Send Access Code", verify: "Authenticate", tagline: "better destinations by ai", authError: "Check email/spam", codeError: "Invalid code", selectLang: "System Language", loading: "Syncing...", loadingTour: "Dai is deconstructing reality...", analyzing: "Standardizing...", generating: "Generating tours...", translating: "Translating...", navElite: "Elite", navHub: "Intel", navVisa: "Passport", navStore: "Store", sendingTo: "Transmitting code to:" },
  es: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciudad objetivo...", emailPlaceholder: "Email", login: "Enviar Código", verify: "Acceder", tagline: "better destinations by ai", authError: "Revisa tu email o SPAM", codeError: "Código no válido", selectLang: "Idioma del Sistema", loading: "Sincronizando...", loadingTour: "Dai está analizando la ciudad...", analyzing: "Estandarizando...", generating: "Generando tours...", translating: "Traduciendo...", navElite: "Élite", navHub: "Intel", navVisa: "Pasaporte", navStore: "Tienda", sendingTo: "Enviando código a:" },
  pt: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Cidade alvo...", emailPlaceholder: "E-mail", login: "Enviar Código", verify: "Acessar", tagline: "better destinations by ai", authError: "Verifique seu e-mail", codeError: "Código inválido", selectLang: "Idioma do Sistema", loading: "Sincronizando...", loadingTour: "Dai está analisando...", navElite: "Elite", navHub: "Intel", navVisa: "Passaporte", navStore: "Loja", sendingTo: "Enviando para:" },
  it: { welcome: "Log Bidaer:", explorer: "Esploratore", searchPlaceholder: "Città obiettivo...", emailPlaceholder: "Email", login: "Invia Codice", verify: "Accedi", tagline: "better destinations by ai", authError: "Controlla email", codeError: "Codice errato", selectLang: "Lingua del Sistema", loading: "Sincronizzazione...", loadingTour: "Dai sta analizzando...", navElite: "Elite", navHub: "Intel", navVisa: "Passaporto", navStore: "Negozio", sendingTo: "Invio a:" },
  ru: { welcome: "Log Bidaer:", explorer: "Исследователь", searchPlaceholder: "Город...", emailPlaceholder: "Email", login: "Код", verify: "Вход", tagline: "better destinations by ai", authError: "Проверьте почту", codeError: "Ошибка", selectLang: "Язык системы", loading: "Синхронизация...", loadingTour: "Анализ...", navElite: "Элита", navHub: "Интел", navVisa: "Паспорт", navStore: "Магазин", sendingTo: "Отправка на:" },
  hi: { welcome: "Bidaer Log:", explorer: "खोजकर्ता", searchPlaceholder: "शहर खोजें...", emailPlaceholder: "ईमेल", login: "कोड भेजें", verify: "पहुंच", tagline: "better destinations by ai", authError: "ईमेल जांचें", codeError: "अमान्य कोड", selectLang: "सिस्टम की भाषा", loading: "सिंक हो रहा है...", navElite: "एलीट", navHub: "इंटेल", navVisa: "पासपोर्ट", navStore: "स्टور", sendingTo: "कोड भेजा जा रहा है:" },
  fr: { welcome: "Log Bidaer:", explorer: "Explorateur", searchPlaceholder: "Ville...", emailPlaceholder: "Email", login: "Code", verify: "Accès", tagline: "better destinations by ai", authError: "Vérifiez vos emails", selectLang: "Langue du système", loading: "Sync...", navElite: "Élite", navHub: "Intel", navVisa: "Passeport", navStore: "Boutique", sendingTo: "Envoi à:" },
  de: { welcome: "Log Bidaer:", explorer: "Entdecker", searchPlaceholder: "Stadt...", emailPlaceholder: "Email", login: "Code", verify: "Zugang", tagline: "better destinations by ai", authError: "Email prüfen", selectLang: "Systemsprache", loading: "Sync...", navElite: "Elite", navHub: "Intel", navVisa: "Pass", navStore: "Shop", sendingTo: "Sende an:" },
  ca: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciutat...", emailPlaceholder: "Email", login: "Codi", verify: "Accedir", tagline: "better destinations by ai", authError: "Revisa l'email", selectLang: "Idioma del Sistema", loading: "Sincronitzant...", navElite: "Elit", navHub: "Intel", navVisa: "Passaport", navStore: "Botiga", sendingTo: "Enviant a:" },
  eu: { welcome: "Log Bidaer:", explorer: "Esploratzailea", searchPlaceholder: "Hiria...", emailPlaceholder: "Emaila", login: "Kodea", verify: "Sartu", tagline: "better destinations by ai", authError: "Emaila ikusi", selectLang: "Sistemaren Hizkuntza", loading: "Sinkronizatzen...", navElite: "Elite", navHub: "Intel", navVisa: "Pasaportea", navStore: "Denda", sendingTo: "Bidaltzen hona:" }
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
  const [searchOptions, setSearchOptions] = useState<{name: string, country: string}[] | null>(null);
  
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    return GUEST_PROFILE;
  });

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
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
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language || 'es'] || TRANSLATIONS['es'])[key] || key;

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
    syncUserProfile(updatedUser);
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

  const handleCitySelect = async (cityInput: string) => {
    if (!cityInput.trim() || isLoading) return;
    setIsLoading(true); setLoadingMessage(t('analyzing'));
    try {
        const dbCached = await getCachedTours(cityInput, "", user.language || 'es');
        if (dbCached && dbCached.length > 0) {
            setSelectedCity(cityInput); setTours(dbCached); setView(AppView.CITY_DETAIL); setIsLoading(false); return;
        }
        const results = await standardizeCityName(cityInput);
        if (results.length === 1) { 
            const generated = await generateToursForCity(results[0].name, results[0].country, user);
            setTours(generated); await saveToursToCache(results[0].name, results[0].country, user.language || 'es', generated);
            setSelectedCity(results[0].name); setView(AppView.CITY_DETAIL);
        } else { setSearchOptions(results); }
    } catch (e: any) { setAuthError(e.message); } finally { setIsLoading(false); }
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-10"><BdaiLogo className="w-24 h-24 mb-6 animate-pulse" /><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{t('loading')}</p></div>;

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-10"><div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6"></div><p className="text-white font-black uppercase text-[10px] tracking-[0.4em]">{loadingMessage || t('loading')}</p></div>}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-between p-8 py-safe-iphone relative bg-[#020617]">
              <div className="text-center pt-12">
                  <BdaiLogo className="w-24 h-24 mx-auto mb-6" />
                  <h1 className="text-4xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mt-2">{t('tagline')}</p>
              </div>

              <div className="w-full max-w-sm space-y-12">
                  {/* SELECTOR DE IDIOMA MINIMALISTA - BANDERAS MINI */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-[1px] flex-1 bg-white/10"></div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('selectLang')}</span>
                        <div className="h-[1px] flex-1 bg-white/10"></div>
                      </div>
                      <div className="flex overflow-x-auto no-scrollbar gap-3 px-2 py-2">
                        {LANGUAGES.map(lang => (
                            <button 
                                key={lang.code}
                                onClick={() => handleUpdateUser({...user, language: lang.code})} 
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${user.language === lang.code ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 grayscale opacity-60'}`}
                            >
                                <FlagIcon code={lang.code} className="w-5 h-5" />
                                <span className="text-[9px] font-black uppercase whitespace-nowrap">{lang.code}</span>
                            </button>
                        ))}
                      </div>
                  </div>
                  
                  <div className="w-full space-y-4 max-w-xs mx-auto">
                      {authError && <div className="text-red-400 text-[8px] font-black uppercase text-center bg-red-500/10 p-3 rounded-2xl border border-red-500/20">{authError}</div>}
                      {loginStep === 'EMAIL' ? (
                          <div className="space-y-4">
                              <input type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl py-5 px-6 text-center text-white focus:border-purple-500 outline-none font-bold placeholder:opacity-20 transition-all" />
                              <button onClick={handleSendOtp} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95">{t('login')}</button>
                          </div>
                      ) : (
                          <div className="space-y-6 text-center animate-fade-in">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('sendingTo')} <br/><span className="text-purple-400 lowercase">{email}</span></p>
                              <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-white/5 border border-purple-500/30 rounded-3xl py-6 text-center font-black text-3xl text-white tracking-widest outline-none" placeholder="000000" />
                              <button onClick={handleVerifyOtp} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">{t('verify')}</button>
                          </div>
                      )}
                  </div>
              </div>
              <div className="pb-8 text-center"><span className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">© 2025 BDAI INTEL CORE</span></div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-[#020617] ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-40'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe-iphone px-8">
                      <header className="flex justify-between items-center py-6">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-10 h-10"/><span className="font-black text-2xl">bdai</span></div>
                          <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div>
                      </header>
                      <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.firstName || t('explorer')}.</span></h1>
                      <div className="relative mt-8"><i className="fas fa-search absolute left-6 top-6 text-slate-500"></i><input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 pl-16 pr-8 text-white focus:border-purple-500 outline-none font-bold" /></div>
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={(name) => handleCitySelect(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 animate-fade-in">
                      <header className="flex items-center gap-4 mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left"></i></button><h2 className="text-3xl font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2></header>
                      <div className="space-y-6 pb-12">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language || 'es'} />)}</div>
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
                  <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center w-full rounded-[3rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-12 scale-110 rotate-45' : 'bg-white/5'}`}><BdaiLogo className="w-7 h-7" /></button>
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
