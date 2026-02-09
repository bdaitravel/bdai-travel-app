
import React, { useState, useEffect, useMemo } from 'react';
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
import { PartnerProgram } from './components/PartnerProgram';
import { supabase, getUserProfileByEmail, getGlobalRanking, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat } from './services/supabaseClient';

const TRANSLATIONS: any = {
  es: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciudad...", emailPlaceholder: "tu@email.com", userPlaceholder: "usuario", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", authError: "email no válido", codeError: "8 dígitos", selectLang: "idioma", loading: "sincronizando...", navElite: "élite", navHub: "intel", navVisa: "pasaporte", navStore: "tienda", navEarn: "gana", changeEmail: "corregir", sentTo: "enviado a", loadingTour: "generando masterclass...", analyzing: "analizando...", fastSync: "traduciendo caché...", apiLimit: "IA Saturada. Reintentando...", retry: "Reintentar", info: "info" },
  en: { welcome: "bidaer log:", explorer: "explorer", searchPlaceholder: "city...", emailPlaceholder: "your@email.com", userPlaceholder: "username", login: "request access", verify: "validate", tagline: "better destinations by ai", authError: "invalid email", codeError: "8 digits", selectLang: "language", loading: "syncing...", navElite: "elite", navHub: "intel", navVisa: "passport", navStore: "store", navEarn: "earn", changeEmail: "change", sentTo: "sent to", loadingTour: "generating masterclass...", analyzing: "analyzing...", fastSync: "syncing cache...", apiLimit: "AI Saturated. Retrying...", retry: "Retry", info: "info" },
  zh: { welcome: "bidaer 日志:", explorer: "探险家", searchPlaceholder: "城市...", emailPlaceholder: "你的@email.com", userPlaceholder: "用户名", login: "请求访问", verify: "验证", tagline: "better destinations by ai", authError: "无效的电子邮件", codeError: "8位代码", selectLang: "语言", loading: "同步中...", navElite: "精英", navHub: "情报", navVisa: "护照", navStore: "商店", navEarn: "赚取", changeEmail: "更改", sentTo: "已发送至" },
  pt: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "cidade...", emailPlaceholder: "seu@email.com", userPlaceholder: "usuário", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", authError: "email inválido", codeError: "8 dígitos", selectLang: "idioma", loading: "sincronizando...", navElite: "elite", navHub: "intel", navVisa: "passaporte", navStore: "loja", navEarn: "ganhar" },
  fr: { welcome: "log bidaer:", explorer: "explorateur", searchPlaceholder: "ville...", emailPlaceholder: "votre@email.com", userPlaceholder: "nom d'utilisateur", login: "demander l'accès", verify: "valider", tagline: "better destinations by ai", authError: "email invalide", codeError: "8 chiffres", selectLang: "langue", loading: "synchronisation...", navElite: "élite", navHub: "intel", navVisa: "passeport", navStore: "boutique", navEarn: "gagner" },
  de: { welcome: "bidaer log:", explorer: "entdecker", searchPlaceholder: "stadt...", emailPlaceholder: "deine@email.com", userPlaceholder: "benutzername", login: "zugang anfordern", verify: "bestätigen", tagline: "better destinations by ai", authError: "ungültige e-mail", codeError: "8 ziffern", selectLang: "sprache", loading: "synchronisierung...", navElite: "elite", navHub: "intel", navVisa: "reisepass", navStore: "shop", navEarn: "verdienen" },
  it: { welcome: "log bidaer:", explorer: "esploratore", searchPlaceholder: "città...", emailPlaceholder: "tua@email.com", userPlaceholder: "nome utente", login: "richiedi accesso", verify: "valida", tagline: "better destinations by ai", authError: "email non valida", codeError: "8 cifre", selectLang: "lingua", loading: "sincronizzazione...", navElite: "élite", navHub: "intel", navVisa: "passaporto", navStore: "negozio", navEarn: "guadagna" },
  ja: { welcome: "bidaer ログ:", explorer: "探検家", searchPlaceholder: "都市...", emailPlaceholder: "メールアドレス", userPlaceholder: "ユーザー名", login: "アクセスをリクエスト", verify: "確認", tagline: "better destinations by ai", authError: "無効なメール", codeError: "8桁のコード", selectLang: "言語", loading: "同期中...", navElite: "エリート", navHub: "インテル", navVisa: "パスポート", navStore: "ショップ", navEarn: "稼ぐ" },
  ru: { welcome: "bidaer лог:", explorer: "исследователь", searchPlaceholder: "город...", emailPlaceholder: "ваш@email.com", userPlaceholder: "имя пользователя", login: "запросить доступ", verify: "подтвердить", tagline: "better destinations by ai", authError: "неверный email", codeError: "8 цифр", selectLang: "язык", loading: "синхронизация...", navElite: "элита", navHub: "интел", navVisa: "паспорт", navStore: "магазин", navEarn: "заработать" },
  ar: { welcome: "سجل بيداير:", explorer: "مستكشف", searchPlaceholder: "مدينة...", emailPlaceholder: "بريدك@الإلكتروني", userPlaceholder: "اسم المستخدم", login: "طلب الدخول", verify: "تحقق", tagline: "better destinations by ai", authError: "بريد غير صالح", codeError: "8 أرقام", selectLang: "اللغة", loading: "مزامنة...", navElite: "النخبة", navHub: "استخبارات", navVisa: "جواز السفر", navStore: "متجر", navEarn: "كسب" },
  ca: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciutat...", emailPlaceholder: "teu@email.com", userPlaceholder: "usuari", login: "sol·licitar accés", verify: "validar", tagline: "better destinations by ai", authError: "email no vàlid", codeError: "8 dígits", selectLang: "idioma", loading: "sincronitzant...", navElite: "elit", navHub: "intel", navVisa: "passaport", navStore: "botiga", navEarn: "guanya" },
  eu: { welcome: "bidaer log:", explorer: "esploratzailea", searchPlaceholder: "hiria...", emailPlaceholder: "zure@email.com", userPlaceholder: "erabiltzailea", login: "sarbidea eskatu", verify: "egiaztatu", tagline: "better destinations by ai", authError: "email okerra", codeError: "8 digitu", selectLang: "hizkuntza", loading: "sinkronizatzen...", navElite: "elitea", navHub: "intel", navVisa: "pasaportea", navStore: "denda", navEarn: "irabazi" },
  tr: { welcome: "bidaer günlüğü:", explorer: "gezgin", searchPlaceholder: "şehir...", emailPlaceholder: "eposta@adresiniz.com", userPlaceholder: "kullanıcı adı", login: "erişim iste", verify: "doğrula", tagline: "better destinations by ai", authError: "geçersiz eposta", codeError: "8 haneli", selectLang: "dil", loading: "eşitleniyor...", navElite: "elit", navHub: "istihbarat", navVisa: "pasaport", navStore: "mağaza", navEarn: "kazan" },
  hi: { welcome: "bidaer लॉग:", explorer: "खोजकर्ता", searchPlaceholder: "शहर...", emailPlaceholder: "आपका@email.com", userPlaceholder: "उपयोगकर्ता", login: "पहुँच का अनुरोध", verify: "सत्यापित", tagline: "better destinations by ai", authError: "अमान्य ईमेल", codeError: "8 अंक", selectLang: "भाषा", loading: "सिंक हो रहा है...", navElite: "अभिजात वर्ग", navHub: "इंटेल", navVisa: "पासपोर्ट", navStore: "स्टोर", navEarn: "कमाएं" },
  ko: { welcome: "bidaer 로그:", explorer: "탐험가", searchPlaceholder: "도시...", emailPlaceholder: "이메일 주소", userPlaceholder: "사용자 이름", login: "액세스 요청", verify: "확인", tagline: "better destinations by ai", authError: "유효하지 않은 이메일", codeError: "8자리 코드", selectLang: "언어", loading: "동기화 중...", navElite: "엘리트", navHub: "인텔", navVisa: "여권", navStore: "상점", navEarn: "적립" }
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

  const [currentLanguage, setCurrentLanguage] = useState<string>(user.language || 'es');

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await getUserProfileByEmail(session.user.email || '');
                const lang = profile?.language || user.language || 'es';
                const newUser = { 
                    ...(profile || GUEST_PROFILE), 
                    id: session.user.id, 
                    email: session.user.email, 
                    isLoggedIn: true,
                    language: lang
                };
                setUser(newUser as any);
                setCurrentLanguage(newUser.language);
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
        (err) => console.debug("GPS skip:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  const t = useMemo(() => (key: string) => {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS['es'];
    return dict[key] || TRANSLATIONS['es'][key] || key;
  }, [currentLanguage]);

  const handleCitySearch = async (cityInput: string) => {
    if (!cityInput || !cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));
    setTours([]);
    setSearchOptions(null);

    try {
        const cached = await getCachedTours(cityInput, "", currentLanguage);
        if (cached && cached.data.length > 0) {
            await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
            return;
        }
        const results = await standardizeCityName(cityInput);
        if (results && results.length > 0) {
            setSearchOptions(results);
            setIsLoading(false);
            return;
        }
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
        const cached = await getCachedTours(official.spanishName, official.country, currentLanguage);
        if (cached && cached.data.length > 0) {
            setTours(cached.data); 
            setView(AppView.CITY_DETAIL);
            setIsLoading(false);
            return;
        }
        setLoadingMessage(t('loadingTour'));
        const generated = await generateToursForCity(official.spanishName, official.country, user);
        if (generated.length > 0) {
            setTours(generated); 
            await saveToursToCache(official.spanishName, official.country, currentLanguage, generated);
            setView(AppView.CITY_DETAIL);
        }
    } catch (e: any) { console.error(e); } finally { setIsLoading(false); }
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
          if (error) throw error;
          setLoginStep('CODE');
      } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
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
                  language: currentLanguage 
              };
              setUser(newUser as any);
              localStorage.setItem('bdai_profile', JSON.stringify(newUser));
              await syncUserProfile(newUser as any);
              setShowOnboarding(true);
          }
      } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleLangChange = (code: string) => {
      setCurrentLanguage(code);
      setUser(prev => {
          const next = { ...prev, language: code };
          localStorage.setItem('bdai_profile', JSON.stringify(next));
          return next;
      });
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center"><BdaiLogo className="w-16 h-16 animate-pulse" /></div>;
  if (showOnboarding) return <Onboarding key={currentLanguage} language={currentLanguage} onComplete={() => { setShowOnboarding(false); setView(AppView.HOME); }} />;

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-fade-in">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-white font-black uppercase text-[9px] tracking-[0.3em] text-center px-8 mb-4">{loadingMessage}</p>
        </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617]">
              <div className="text-center animate-fade-in flex flex-col items-center mb-6 mt-[-10dvh]">
                  <BdaiLogo className="w-24 h-24 animate-pulse-logo" />
                  <h1 className="text-5xl font-black lowercase tracking-tighter text-white/95 -mt-2">bdai</h1>
                  <p className="text-[11px] font-black lowercase tracking-tighter text-purple-500/80 mt-1">{t('tagline')}</p>
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
                      </div>
                  )}
              </div>

              <div className="absolute bottom-10 left-0 right-0 px-8 flex flex-col items-center gap-3">
                <p className="text-[7px] font-black lowercase tracking-[0.3em] text-slate-700 text-center uppercase">{t('selectLang')}</p>
                <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-[2rem] shadow-2xl backdrop-blur-md">
                    <div className="grid grid-cols-5 gap-x-5 gap-y-4 items-center justify-items-center">
                      {LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => handleLangChange(lang.code)} className="transition-all active:scale-90 relative">
                          <FlagIcon code={lang.code} className={`w-6 h-6 ${currentLanguage === lang.code ? 'ring-2 ring-purple-500 scale-125 z-10 shadow-lg' : 'grayscale-[0.8] opacity-40 hover:opacity-100 hover:grayscale-0'}`} />
                        </button>
                      ))}
                    </div>
                </div>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative bg-[#020617] ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-32'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe-iphone px-6 max-w-md mx-auto">
                      <header className="flex justify-between items-center py-4">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-8 h-8"/><span className="font-black text-lg tracking-tighter">bdai</span></div>
                          <div className="flex items-center gap-3">
                              <button onClick={() => setShowOnboarding(true)} className="bg-white/5 w-8 h-8 rounded-full flex items-center justify-center text-purple-400 border border-white/10 active:scale-90 transition-all">
                                <i className="fas fa-info text-[10px]"></i>
                              </button>
                              <div className="bg-white/10 px-3 py-1.5 rounded-xl text-[8px] font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div>
                          </div>
                      </header>
                      <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.username || t('explorer')}.</span></h1>
                      <div className="relative mt-6 flex gap-3">
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySearch(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none font-bold text-xs" />
                          <button onClick={() => handleCitySearch(searchVal)} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg"><i className="fas fa-search text-sm"></i></button>
                      </div>
                      <TravelServices mode="HOME" language={currentLanguage} onCitySelect={(name: string) => handleCitySearch(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto">
                      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button><h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2></header>
                      <div className="space-y-4 pb-12">
                          {tours.length > 0 ? tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => handleStartTour(tour)} language={currentLanguage} />) : <div className="text-center py-20 opacity-30 uppercase font-black text-xs tracking-widest">Analizando...</div>}
                      </div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => { setUser(u); setCurrentLanguage(u.language); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={currentLanguage} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />}
                {view === AppView.LEADERBOARD && <div className="max-w-md mx-auto h-full"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={currentLanguage} /></div>}
                {view === AppView.TOOLS && <div className="pt-safe-iphone px-6 max-w-md mx-auto"><TravelServices mode="HUB" language={currentLanguage} onCitySelect={(name: string) => handleCitySearch(name)} /></div>}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => { setUser(u); setCurrentLanguage(u.language); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={currentLanguage} onLogout={() => { supabase.auth.signOut(); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
                {view === AppView.SHOP && <div className="max-w-md mx-auto h-full"><Shop user={user} onPurchase={() => {}} /></div>}
                {view === AppView.PARTNER && <div className="max-w-md mx-auto h-full"><PartnerProgram language={currentLanguage} onBack={() => setView(AppView.HOME)} /></div>}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-4 flex justify-center pointer-events-none"><nav className="bg-slate-900/98 backdrop-blur-2xl border border-white/10 px-1 py-3 flex justify-around items-center w-full max-w-lg rounded-[2.5rem] pointer-events-auto shadow-2xl overflow-x-auto no-scrollbar">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg' : 'bg-white/5'}`}><BdaiLogo className="w-5 h-5" /></button>
                      <NavButton icon="fa-handshake" label={t('navEarn')} isActive={view === AppView.PARTNER} onClick={() => setView(AppView.PARTNER)} />
                      <NavButton icon="fa-id-card" label={t('navVisa')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                      <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                  </nav></div>
            )}
          </div>
      )}
    </div>
  );
}
