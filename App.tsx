
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, standardizeCityName } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { FlagIcon } from './components/FlagIcon';
import { Onboarding } from './components/Onboarding';
import { supabase, getUserProfileByEmail, getGlobalRanking, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat } from './services/supabaseClient';

const TRANSLATIONS: any = {
  es: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciudad...", emailPlaceholder: "email", userPlaceholder: "usuario", login: "Solicitar acceso", verify: "Validar", tagline: "better destinations by ai", authError: "Email no válido", codeError: "8 dígitos requeridos", selectLang: "idioma", loading: "Sincronizando...", navElite: "Élite", navHub: "Intel", navVisa: "Pasaporte", navStore: "Tienda", changeEmail: "Corregir", sentTo: "Enviado a", loadingTour: "Cargando Tour...", analyzing: "Analizando..." },
  en: { welcome: "Bidaer Log:", explorer: "Explorer", searchPlaceholder: "City...", emailPlaceholder: "email", userPlaceholder: "username", login: "Request access", verify: "Validate", tagline: "better destinations by ai", authError: "Invalid email", codeError: "8 digits required", selectLang: "language", loading: "Syncing...", navElite: "Elite", navHub: "Intel", navVisa: "Passport", navStore: "Store", changeEmail: "Change", sentTo: "Sent to", loadingTour: "Loading Tour...", analyzing: "Analyzing..." },
  zh: { welcome: "Bidaer 日志:", explorer: "探险家", searchPlaceholder: "城市...", emailPlaceholder: "电子邮件", userPlaceholder: "用户名", login: "申请访问", verify: "验证", tagline: "better destinations by ai", authError: "无效的电子邮件", codeError: "需要 8 位数字", selectLang: "语言", loading: "同步中...", navElite: "精英", navHub: "情报", navVisa: "护照", navStore: "商店", changeEmail: "更改", sentTo: "发送至", loadingTour: "加载路线...", analyzing: "分析中..." },
  ca: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciutat...", emailPlaceholder: "email", userPlaceholder: "usuari", login: "Sol·licitar accés", verify: "Validar", tagline: "better destinations by ai", authError: "Email no vàlid", codeError: "Falten dades (8)", selectLang: "idioma", loading: "Sincronitzant...", navElite: "Elit", navHub: "Intel", navVisa: "Passaport", navStore: "Botiga", changeEmail: "Corregir", sentTo: "Enviat a", loadingTour: "Carregant Tour...", analyzing: "Analitzant..." },
  eu: { welcome: "Log Bidaer:", explorer: "Esploratzailea", searchPlaceholder: "Hiria...", emailPlaceholder: "emaila", userPlaceholder: "erabiltzailea", login: "Sarbidea eskatu", verify: "Balioztatu", tagline: "better destinations by ai", authError: "Email okerra", codeError: "8 digitu behar dira", selectLang: "hizkuntza", loading: "Sinkronizatzen...", navElite: "Elite", navHub: "Intel", navVisa: "Pasaportea", navStore: "Denda", changeEmail: "Zuzendu", sentTo: "Hona bidalia", loadingTour: "Tourra kargatzen...", analyzing: "Aztertzen..." },
  ar: { welcome: "سجل الدخول:", explorer: "مستكشف", searchPlaceholder: "مدينة...", emailPlaceholder: "البريد الإلكتروني", userPlaceholder: "اسم المستخدم", login: "طلب الدخول", verify: "تحقق", tagline: "better destinations by ai", authError: "بريد غير صالح", codeError: "أدخل 8 أرقام", selectLang: "اللغة", loading: "جاري المزامنة...", navElite: "النخبة", navHub: "معلومات", navVisa: "جواز سفر", navStore: "متجر", changeEmail: "تغيير", sentTo: "أرسلت إلى", loadingTour: "جاري تحميل الجولة...", analyzing: "جاري التحليل..." },
  pt: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Cidade...", emailPlaceholder: "email", userPlaceholder: "usuario", login: "Pedir acesso", verify: "Validar", tagline: "better destinations by ai", authError: "E-mail inválido", codeError: "8 dígitos", selectLang: "idioma", loading: "Sincronizando...", navElite: "Elite", navHub: "Intel", navVisa: "Passaporte", navStore: "Loja", changeEmail: "Corregir", sentTo: "Enviado para", loadingTour: "Carregando...", analyzing: "Analisando..." },
  fr: { welcome: "Log Bidaer:", explorer: "Explorateur", searchPlaceholder: "Ville...", emailPlaceholder: "email", userPlaceholder: "nom", login: "Demander l'accès", verify: "Valider", tagline: "better destinations by ai", authError: "Email invalide", codeError: "8 chiffres requis", selectLang: "langue", loading: "Synchro...", navElite: "Élite", navHub: "Intel", navVisa: "Passeport", navStore: "Boutique", changeEmail: "Modifier", sentTo: "Envoyé à", loadingTour: "Chargement...", analyzing: "Analyse..." },
  de: { welcome: "Bidaer Log:", explorer: "Entdecker", searchPlaceholder: "Stadt...", emailPlaceholder: "E-Mail", userPlaceholder: "Benutzer", login: "Zugang anfordern", verify: "Prüfen", tagline: "better destinations by ai", authError: "Falsche E-Mail", codeError: "8-stelliger Code", selectLang: "Sprache", loading: "Synchronisierung...", navElite: "Elite", navHub: "Intel", navVisa: "Reisepass", navStore: "Shop", changeEmail: "Ändern", sentTo: "Gesendet an", loadingTour: "Lade Tour...", analyzing: "Analyse..." },
  it: { welcome: "Log Bidaer:", explorer: "Esplore", searchPlaceholder: "Città...", emailPlaceholder: "email", userPlaceholder: "utente", login: "Richiedi accesso", verify: "Valida", tagline: "better destinations by ai", authError: "Email non valida", codeError: "8 cifre", selectLang: "lingua", loading: "Sincronizzando...", navElite: "Elite", navHub: "Intel", navVisa: "Passaporto", navStore: "Negozio", changeEmail: "Correggi", sentTo: "Inviato a", loadingTour: "Caricamento...", analyzing: "Analisi..." },
  ja: { welcome: "Bidaer Log:", explorer: "探検家", searchPlaceholder: "都市...", emailPlaceholder: "メール", userPlaceholder: "ユーザー名", login: "アクセスリクエスト", verify: "認証", tagline: "better destinations by ai", authError: "無効なメール", codeError: "8桁が必要", selectLang: "言語", loading: "同期中...", navElite: "エリート", navHub: "インテル", navVisa: "パスポート", navStore: "ストア", changeEmail: "変更", sentTo: "送信先", loadingTour: "読み込み中...", analyzing: "分析中..." },
  ru: { welcome: "Log Bidaer:", explorer: "Исследователь", searchPlaceholder: "Город...", emailPlaceholder: "email", userPlaceholder: "пользователь", login: "Запрос доступа", verify: "Проверить", tagline: "better destinations by ai", authError: "Неверный email", codeError: "8 цифр", selectLang: "язык", loading: "Синхронизация...", navElite: "Элита", navHub: "Интел", navVisa: "Паспорт", navStore: "Магазин", changeEmail: "Исправить", sentTo: "Отправлено", loadingTour: "Загрузка...", analyzing: "Анализ..." }
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
    const saved = localStorage.getItem('bdai_profile');
    if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    return GUEST_PROFILE;
  });

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

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
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (err) => console.error(err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
    if (!cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));
    const targetLang = user.language || 'es';
    const cached = await getCachedTours(cityInput, "", targetLang);
    if (cached) {
        const validTours = (cached.data as Tour[]).filter(tour => tour.stops && tour.stops.length > 0);
        setTours(validTours);
        setSelectedCity(cached.cityName || cityInput);
        setView(AppView.CITY_DETAIL);
        setIsLoading(false);
        return;
    }
    try {
        const results = await standardizeCityName(cityInput);
        if (results && results.length > 0) setSearchOptions(results);
        else await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
    } catch (e: any) { await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" }); } 
    finally { setIsLoading(false); }
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string}) => {
    setIsLoading(true); 
    setSearchOptions(null); 
    const targetLang = user.language || 'es';
    try {
        setSelectedCity(official.spanishName); 
        const cached = await getCachedTours(official.spanishName, official.country, targetLang);
        if (cached && cached.langFound === targetLang) {
            const validTours = (cached.data as Tour[]).filter(tour => tour.stops && tour.stops.length > 0);
            setTours(validTours); 
            setView(AppView.CITY_DETAIL);
            setIsLoading(false); 
            return;
        } 
        setLoadingMessage(t('loadingTour'));
        const generated = await generateToursForCity(official.spanishName, official.country, user);
        const validGenerated = generated.filter(tour => tour.stops && tour.stops.length > 0);
        setTours(validGenerated); 
        if (validGenerated.length > 0) {
            await saveToursToCache(official.spanishName, official.country, targetLang, validGenerated);
        }
        setView(AppView.CITY_DETAIL);
    } catch (e: any) { alert("Error"); } finally { setIsLoading(false); }
  };

  const handleLoginRequest = async () => {
      if (!validateEmailFormat(email)) { alert(t('authError')); return; }
      setIsLoading(true);
      try {
          const { error } = await supabase.auth.signInWithOtp({ email });
          if (error) throw error;
          setLoginStep('CODE');
      } catch (e: any) { alert("Error: " + e.message); } 
      finally { setIsLoading(false); }
  };

  const handleVerifyCode = async () => {
      if (otpCode.length < 8) { alert(t('codeError')); return; }
      setIsLoading(true);
      try {
          const { data: { session }, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'email' });
          if (error) throw error;
          if (session) {
              const profile = await getUserProfileByEmail(email);
              const newUser = profile ? { ...profile, id: session.user.id, isLoggedIn: true } : { ...GUEST_PROFILE, id: session.user.id, email, username: username || 'explorer', isLoggedIn: true };
              setUser(newUser as any);
              localStorage.setItem('bdai_profile', JSON.stringify(newUser));
              setShowOnboarding(true);
          }
      } catch (e: any) { alert("Error: " + e.message); } 
      finally { setIsLoading(false); }
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center"><BdaiLogo className="w-16 h-16 animate-pulse" /></div>;

  if (showOnboarding) return <Onboarding language={user.language} onComplete={() => { setShowOnboarding(false); setView(AppView.HOME); }} />;

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {isLoading && <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div><p className="text-white font-black uppercase text-[9px] tracking-[0.3em] text-center px-8">{loadingMessage}</p></div>}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617] overflow-hidden">
              <div className="text-center mb-10 animate-fade-in flex flex-col items-center shrink-0">
                  <BdaiLogo className="w-28 h-28 animate-pulse-logo" />
                  <h1 className="text-4xl font-black lowercase tracking-tighter text-white/95 -mt-2">bdai</h1>
                  <p className="text-[7px] font-black uppercase tracking-[0.4em] text-purple-500 mt-1 opacity-60">{t('tagline')}</p>
              </div>
              <div className="w-full max-w-[210px] space-y-5">
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-2 animate-fade-in">
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 text-center text-white outline-none text-[10px] font-medium placeholder-slate-700 focus:border-purple-500/30 transition-all" placeholder={t('userPlaceholder')} />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-4 text-center text-white outline-none text-[10px] font-medium placeholder-slate-700 focus:border-purple-500/30 transition-all" placeholder={t('emailPlaceholder')} />
                          <button onClick={handleLoginRequest} className="w-full py-3 bg-white text-slate-950 rounded-xl font-black uppercase text-[8px] tracking-widest shadow-lg mt-2 active:scale-95 transition-all">{t('login')}</button>
                      </div>
                  ) : (
                      <div className="space-y-6 text-center animate-fade-in">
                          <div><p className="text-[6px] font-black uppercase text-slate-600 tracking-widest mb-1">{t('sentTo')}</p><p className="text-[9px] font-bold text-white/40 truncate">{email}</p></div>
                          <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-transparent border-b border-purple-500/20 py-2 text-center font-black text-3xl text-white outline-none" placeholder="0000" />
                          <button onClick={handleVerifyCode} className="w-full py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-[8px] tracking-widest shadow-xl active:scale-95 transition-all">{t('verify')}</button>
                      </div>
                  )}
                  <div className="flex flex-col gap-3 pt-6"><p className="text-[6px] font-black uppercase tracking-[0.4em] text-slate-800 text-center">{t('selectLang')}</p>
                    <div className="flex justify-center gap-3.5 flex-wrap px-2">{LANGUAGES.map(lang => (<button key={lang.code} onClick={() => setUser(prev => ({...prev, language: lang.code}))} className="transition-all active:scale-90"><FlagIcon code={lang.code} className={`w-4 h-4 ${user.language === lang.code ? 'ring-1 ring-purple-500 scale-110' : 'opacity-10 grayscale'}`} /></button>))}</div>
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
                      <div className="relative mt-6 flex gap-3"><input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySearch(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none font-bold text-xs" /><button onClick={() => handleCitySearch(searchVal)} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg"><i className="fas fa-search text-sm"></i></button></div>
                      {searchOptions && (<div className="mt-4 space-y-1 bg-slate-900/95 backdrop-blur-xl p-3 rounded-3xl border border-white/5 shadow-2xl">{searchOptions.map((opt, i) => (<button key={i} onClick={() => processCitySelection(opt)} className="w-full p-3 bg-white/5 rounded-xl flex items-center justify-between transition-all text-left active:bg-purple-600/20"><div><span className="text-white font-black uppercase text-[10px]">{opt.spanishName}</span><br/><span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">{opt.country}</span></div><i className="fas fa-chevron-right text-[8px] text-slate-800"></i></button>))}</div>)}
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={(name) => handleCitySearch(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto"><header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button><h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2></header>
                      <div className="space-y-4 pb-12">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language || 'es'} />)}</div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />}
                {view === AppView.LEADERBOARD && <div className="max-w-md mx-auto h-full"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language || 'es'} /></div>}
                {view === AppView.TOOLS && <div className="pt-safe-iphone px-6 max-w-md mx-auto"><TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={(name) => handleCitySearch(name)} /></div>}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onLogout={() => { supabase.auth.signOut(); setView(AppView.LOGIN); }} />}
                {view === AppView.SHOP && <div className="max-w-md mx-auto h-full"><Shop user={user} onPurchase={(reward) => { const nu = {...user, miles: user.miles + reward}; setUser(nu); syncUserProfile(nu); }} /></div>}
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
