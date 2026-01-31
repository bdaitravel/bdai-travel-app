
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
import { Onboarding } from './components/Onboarding';
import { supabase, getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat } from './services/supabaseClient';

const TRANSLATIONS: any = {
  en: { welcome: "Bidaer Log:", explorer: "Explorer", searchPlaceholder: "Target city...", emailPlaceholder: "Email address", login: "Send Code", verify: "Authenticate", tagline: "better destinations by ai", authError: "Check email/spam", codeError: "Invalid code", selectLang: "Select Language", loading: "Syncing...", loadingTour: "Dai is deconstructing reality...", analyzing: "Locating city...", generating: "Generating tours...", translating: "Translating...", navElite: "Elite", navHub: "Intel", navVisa: "Passport", navStore: "Store", genError: "Sync error. Try again.", disambig: "Select location:" },
  es: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciudad objetivo...", emailPlaceholder: "Email", login: "Enviar Código", verify: "Acceder", tagline: "better destinations by ai", authError: "Revisa tu email o SPAM", codeError: "Código no válido", selectLang: "Selecciona Idioma", loading: "Sincronizando...", loadingTour: "Dai está analizando la ciudad...", analyzing: "Localizando ciudad...", generating: "Generando tours...", translating: "Traduciendo...", navElite: "Élite", navHub: "Intel", navVisa: "Pasaporte", navStore: "Tienda", genError: "Error de sincronización.", disambig: "Selecciona ubicación:" },
  hi: { welcome: "बीडायर लॉग:", explorer: "खोजकर्ता", searchPlaceholder: "लक्ष्य शहर...", emailPlaceholder: "ईमेल", login: "कोड भेजें", verify: "प्रमाणित करें", tagline: "better destinations by ai", authError: "ईमेल जांचें", codeError: "अमान्य कोड", selectLang: "भाषा चुनें", loading: "सिंक हो रहा है...", loadingTour: "दाई विश्लेषण कर रहा है...", analyzing: "ढूंढ रहा है...", generating: "उत्पन्न कर रहा है...", translating: "अनुवाद...", navElite: "एलिट", navHub: "इंटेल", navVisa: "पासपोर्ट", navStore: "स्टोर", genError: "त्रुटि।", disambig: "स्थान चुनें:" },
  ca: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciutat objectiu...", emailPlaceholder: "Email", login: "Enviar Codi", verify: "Accedir", tagline: "better destinations by ai", authError: "Revisa l'email", codeError: "Codi incorrecte", selectLang: "Selecciona Idioma", loading: "Sincronitzant...", loadingTour: "Dai analitza la ciutat...", analyzing: "Localitzant...", generating: "Generant...", translating: "Traduint...", navElite: "Èlit", navHub: "Intel", navVisa: "Passaport", navStore: "Botiga", genError: "Error de sincronització.", disambig: "Selecciona lloc:" },
  eu: { welcome: "Bidaer Loga:", explorer: "Esploratzailea", searchPlaceholder: "Helburu hiria...", emailPlaceholder: "Emaila", login: "Kodea Bidali", verify: "Sartu", tagline: "better destinations by ai", authError: "Emaila rebisatu", codeError: "Kode okerra", selectLang: "Hautatu Hizkuntza", loading: "Sinkronizatzen...", loadingTour: "Dai hiria aztertzen...", analyzing: "Kokatzen...", generating: "Sortzen...", translating: "Itzultzen...", navElite: "Elitea", navHub: "Intel", navVisa: "Pasaportea", navStore: "Denda", genError: "Errorea.", disambig: "Hautatu tokia:" }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
  email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, 
  visitedCities: [], completedTours: [], badges: []
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 min-w-[60px] ${isActive ? 'text-purple-500 scale-110' : 'text-slate-500 opacity-50'}`}>
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[7px] font-black uppercase tracking-widest text-center">{label}</span>
  </button>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [loginStep, setLoginStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('bdai_onboarding_v3') !== 'seen');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
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
            if (profile) {
              const newUser = { ...profile, id: session.user.id, isLoggedIn: true };
              setUser(newUser as any);
              localStorage.setItem('bdai_profile', JSON.stringify(newUser));
            }
            setView(AppView.HOME);
        }
        setIsVerifyingSession(false);
    };
    checkAuth();
    getGlobalRanking().then(setLeaderboard);
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            null, { enableHighAccuracy: true }
        );
    }
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const handleCitySelect = async (cityInput: string) => {
    if (!cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));
    try {
        const results = await standardizeCityName(cityInput);
        if (results && results.length > 0) {
            setSearchOptions(results);
            setIsLoading(false);
        } else {
            await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
        }
    } catch (e: any) { await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" }); }
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string}) => {
    setIsLoading(true); 
    setSearchOptions(null); 
    setLoadingMessage(t('loadingTour'));
    const targetLang = user.language || 'es';
    try {
        setSelectedCity(official.spanishName); 
        setSelectedCountry(official.country);
        const cached = await getCachedTours(official.spanishName, official.country, targetLang);
        if (cached && cached.langFound === targetLang) {
            setTours(cached.data); 
            setView(AppView.CITY_DETAIL);
            setIsLoading(false); 
            return;
        } 
        setLoadingMessage(t('generating'));
        const generated = await generateToursForCity(official.spanishName, official.country, user);
        setTours(generated); 
        await saveToursToCache(official.spanishName, official.country, targetLang, generated);
        setView(AppView.CITY_DETAIL);
    } catch (e: any) { alert(t('genError')); } finally { setIsLoading(false); }
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center"><BdaiLogo className="w-24 h-24 mb-6 animate-pulse" /></div>;

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {showOnboarding && <Onboarding language={user.language} onComplete={() => { localStorage.setItem('bdai_onboarding_v3', 'seen'); setShowOnboarding(false); }} />}
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-10"><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div><p className="text-white font-black uppercase text-[10px] tracking-[0.4em] text-center">{loadingMessage}</p></div>}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-between p-8 py-safe-iphone relative bg-[#020617] overflow-y-auto no-scrollbar">
              <div className="text-center pt-8 shrink-0">
                  <BdaiLogo className="w-32 h-32 mx-auto mb-4" />
                  <h1 className="text-4xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-500 mt-2">{t('tagline')}</p>
              </div>
              <div className="w-full max-w-sm space-y-10 py-8">
                  <div className="flex flex-col gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 text-center">{t('selectLang')}</p>
                    <div className="flex justify-start gap-4 overflow-x-auto no-scrollbar py-4 px-4 mask-fade-edges">
                        {LANGUAGES.map(lang => (
                            <button key={lang.code} onClick={() => setUser({...user, language: lang.code})} className="flex flex-col items-center gap-2 shrink-0 transition-transform active:scale-90">
                                <FlagIcon code={lang.code} className={`w-11 h-11 ${user.language === lang.code ? 'ring-4 ring-purple-500/40 opacity-100' : 'opacity-40 grayscale'}`} />
                                <span className={`text-[8px] font-black uppercase tracking-widest ${user.language === lang.code ? 'text-white' : 'text-slate-600'}`}>{lang.name}</span>
                            </button>
                        ))}
                    </div>
                  </div>
                  <div className="w-full space-y-4 max-w-xs mx-auto">
                      {loginStep === 'EMAIL' ? (
                          <div className="space-y-4">
                              <input type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-center text-white outline-none" />
                              <button onClick={() => { if (!validateEmailFormat(email)) alert(t('authError')); else setLoginStep('CODE'); }} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px]">Acceder</button>
                          </div>
                      ) : (
                          <div className="space-y-6 text-center animate-fade-in">
                              <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-white/5 border border-purple-500/30 rounded-3xl py-4 text-center font-black text-3xl text-white outline-none" placeholder="000000" />
                              <button onClick={() => setView(AppView.HOME)} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Verificar</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-[#020617] ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-32'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe-iphone px-6 animate-fade-in">
                      <header className="flex justify-between items-center py-4">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-10 h-10"/><span className="font-black text-2xl tracking-tighter">bdai</span></div>
                          <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div>
                      </header>
                      <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.firstName || t('explorer')}.</span></h1>
                      <div className="relative mt-8 flex gap-3">
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-bold" />
                          <button onClick={() => handleCitySelect(searchVal)} className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-all"><i className="fas fa-search"></i></button>
                      </div>
                      {searchOptions && (
                          <div className="mt-6 space-y-2 animate-fade-in bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                              <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2 text-center">{t('disambig')}</p>
                              {searchOptions.map((opt, i) => (
                                  <button key={i} onClick={() => processCitySelection(opt)} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between transition-all text-left">
                                    <div>
                                        <span className="text-white font-black uppercase text-[12px]">{opt.spanishName}</span>
                                        <br/><span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{opt.country}</span>
                                    </div>
                                    <i className="fas fa-chevron-right text-[10px] text-slate-700"></i>
                                  </button>
                              ))}
                          </div>
                      )}
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={(name) => handleCitySelect(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 animate-fade-in">
                      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left"></i></button><h2 className="text-2xl font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity} <span className="text-slate-500 text-[10px] ml-2 tracking-widest">{selectedCountry}</span></h2></header>
                      <div className="space-y-4 pb-12">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language || 'es'} />)}</div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u) => { setUser(u); syncUserProfile(u); }} language={user.language || 'es'} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language || 'es'} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={(name) => handleCitySelect(name)} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => { setUser(u); syncUserProfile(u); }} language={user.language || 'es'} onLogout={() => setView(AppView.LOGIN)} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-4 flex justify-center pointer-events-none">
                  <nav className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 px-4 py-3 flex justify-between items-center w-full max-w-md rounded-[2rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-[0_0_20px_rgba(147,51,234,0.5)]' : 'bg-white/5'}`}><BdaiLogo className="w-6 h-6" /></button>
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
