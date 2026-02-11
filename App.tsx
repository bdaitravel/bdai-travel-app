
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, standardizeCityName, translateToursBatch } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { Onboarding } from './components/Onboarding';
import { AdminPanel } from './components/AdminPanel';
import { supabase, getUserProfileByEmail, getGlobalRanking, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat } from './services/supabaseClient';

const TRANSLATIONS: any = {
  es: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciudad...", emailPlaceholder: "tu@email.com", userPlaceholder: "usuario", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", authError: "email no válido", codeError: "8 dígitos", selectLang: "idioma", loading: "sincronizando...", navElite: "élite", navHub: "intel", navVisa: "pasaporte", navStore: "tienda", changeEmail: "corregir", sentTo: "enviado a", loadingTour: "generando masterclass...", analyzing: "analizando...", fastSync: "traduciendo caché...", apiLimit: "IA Saturada. Reintentando...", retry: "Reintentar", info: "info", streak: "Día de racha", activeNow: "Exploradores activos", worldExplorer: "Leyenda del mundo", syncing: "sincronizando idioma..." },
  en: { welcome: "bidaer log:", explorer: "explorer", searchPlaceholder: "city...", emailPlaceholder: "your@email.com", userPlaceholder: "username", login: "request access", verify: "validate", tagline: "better destinations by ai", authError: "invalid email", codeError: "8 digits", selectLang: "language", loading: "syncing...", navElite: "elite", navHub: "intel", navVisa: "passport", navStore: "store", changeEmail: "correct", sentTo: "sent to", loadingTour: "generating masterclass...", analyzing: "analyzing...", fastSync: "syncing cache...", apiLimit: "AI Saturated. Retrying...", retry: "Retry", info: "info", streak: "Day streak", activeNow: "Active explorers", worldExplorer: "World Legend", syncing: "syncing language..." },
  fr: { welcome: "log bidaer:", explorer: "explorateur", searchPlaceholder: "ville...", emailPlaceholder: "ton@email.com", userPlaceholder: "utilisateur", login: "demander l'accès", verify: "valider", tagline: "better destinations by ai", authError: "email invalide", codeError: "8 chiffres", selectLang: "langue", loading: "synchronisation...", navElite: "élite", navHub: "intel", navVisa: "passeport", navStore: "boutique", changeEmail: "corriger", sentTo: "envoyé à", loadingTour: "génération masterclass...", analyzing: "analyse...", fastSync: "traduction cache...", apiLimit: "IA Saturée. Réessayer...", retry: "Réessayer", info: "info", streak: "Jours de suite", activeNow: "Explorateurs actifs", worldExplorer: "Légende mondiale", syncing: "langue en cours..." },
  de: { welcome: "bidaer log:", explorer: "entdecker", searchPlaceholder: "stadt...", emailPlaceholder: "deine@email.com", userPlaceholder: "benutzer", login: "zugang anfordern", verify: "bestätigen", tagline: "better destinations by ai", authError: "ungültige e-mail", codeError: "8 ziffern", selectLang: "sprache", loading: "synchronisierung...", navElite: "elite", navHub: "intel", navVisa: "pass", navStore: "shop", changeEmail: "korrigieren", sentTo: "gesendet an", loadingTour: "masterclass generieren...", analyzing: "analysieren...", fastSync: "cache übersetzen...", apiLimit: "KI ausgelastet...", retry: "Wiederholen", info: "info", streak: "Tage in Folge", activeNow: "Aktive Entdecker", worldExplorer: "Weltlegende", syncing: "sprache wird sync..." },
  it: { welcome: "log bidaer:", explorer: "esploratore", searchPlaceholder: "città...", emailPlaceholder: "tua@email.com", userPlaceholder: "utente", login: "richiedi accesso", verify: "conferma", tagline: "better destinations by ai", authError: "email non valida", codeError: "8 cifre", selectLang: "lingua", loading: "sincronizzazione...", navElite: "elite", navHub: "intel", navVisa: "passaporto", navStore: "negozio", changeEmail: "correggi", sentTo: "inviato a", loadingTour: "generazione masterclass...", analyzing: "analisi...", fastSync: "traduzione cache...", apiLimit: "IA satura...", retry: "Riprova", info: "info", streak: "Giorni consecutivi", activeNow: "Esploratori attivi", worldExplorer: "Leggenda mondiale", syncing: "sincro lingua..." },
  pt: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "cidade...", emailPlaceholder: "teu@email.com", userPlaceholder: "usuário", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", authError: "email inválido", codeError: "8 dígitos", selectLang: "idioma", loading: "sincronizando...", navElite: "elite", navHub: "intel", navVisa: "passaporte", navStore: "loja", changeEmail: "corregir", sentTo: "enviado para", loadingTour: "gerando masterclass...", analyzing: "analisando...", fastSync: "traduzindo cache...", apiLimit: "IA Saturada...", retry: "Tentar nuevamente", info: "info", streak: "Dias seguidos", activeNow: "Exploradores activos", worldExplorer: "Lenda mundial", syncing: "sincro idioma..." },
  ro: { welcome: "jurnal bidaer:", explorer: "explorator", searchPlaceholder: "oraș...", emailPlaceholder: "email-ul tău...", userPlaceholder: "utilizator", login: "solicită acces", verify: "validează", tagline: "destinații mai bune prin ia", authError: "email invalid", codeError: "8 cifre", selectLang: "limbă", loading: "sincronizare...", navElite: "elită", navHub: "intel", navVisa: "pașaport", navStore: "magazin", changeEmail: "corectează", sentTo: "trimis la", loadingTour: "generare masterclass...", analyzing: "analiză...", fastSync: "traducere cache...", apiLimit: "IA Saturată. Reîncercați...", retry: "Reîncearcă", info: "info", streak: "Zile consecutive", activeNow: "Exploratori activi", worldExplorer: "Legendă mondială", syncing: "sincronizare limbă..." },
  zh: { welcome: "bidaer 日志:", explorer: "探险家", searchPlaceholder: "城市...", emailPlaceholder: "你的@email.com", userPlaceholder: "用户名", login: "请求访问", verify: "验证", tagline: "better destinations by ai", authError: "电子邮件无效", codeError: "8位数字", selectLang: "语言", loading: "同步中...", navElite: "精英", navHub: "情报", navVisa: "护照", navStore: "商店", changeEmail: "更正", sentTo: "已发送至", loadingTour: "正在生成大师课...", analyzing: "分析中...", fastSync: "翻译缓存...", apiLimit: "AI 饱和。重试中...", retry: "重试", info: "信息", streak: "连续天数", activeNow: "活跃探险家", worldExplorer: "世界传奇", syncing: "语言同步中..." },
  ja: { welcome: "bidaer ログ:", explorer: "探検家", searchPlaceholder: "都市...", emailPlaceholder: "メール...", userPlaceholder: "ユーザー", login: "アクセスリクエスト", verify: "検証", tagline: "better destinations by ai", authError: "無効なメール", codeError: "8桁", selectLang: "言語", loading: "同期中...", navElite: "エリート", navHub: "インテル", navVisa: "パスポート", navStore: "ショップ", changeEmail: "修正", sentTo: "送信先", loadingTour: "マスタークラス生成中...", analyzing: "分析中...", fastSync: "キャッシュ翻訳中...", apiLimit: "AI 飽和。再試行中...", retry: "再試行", info: "情報", streak: "継続日数", activeNow: "活動中の探検家", worldExplorer: "ワールドレジェンド", syncing: "言語同期中..." },
  hi: { welcome: "bidaer लॉग:", explorer: "अन्वेषक", searchPlaceholder: "शहर...", emailPlaceholder: "आपका@email.com", userPlaceholder: "उपयोगकर्ता नाम", login: "पहुंच का अनुरोध करें", verify: "पुष्टि करें", tagline: "beai द्वारा बेहतर गंतव्य", authError: "अमान्य ईमेल", codeError: "8 अंक", selectLang: "भाषा", loading: "सिंक हो रहा है...", navElite: "कुलीन", navHub: "इंटेल", navVisa: "पासपोर्ट", navStore: "स्टोर", changeEmail: "सही करें", sentTo: "को भेजा गया", loadingTour: "मास्टरक्लास बना रहे हैं...", analyzing: "विश्लेषण कर रहे हैं...", fastSync: "कैश सिंक कर रहे हैं...", apiLimit: "IA संतृप्त है...", retry: "पुनः प्रयास करें", info: "जानकारी", streak: "दिनों की लकीर", activeNow: "सक्रिय अन्वेषक", worldExplorer: "विश्व किंवदंती", syncing: "भाषा सिंक हो रही है..." }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
  email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 }, 
  visitedCities: [], completedTours: [], badges: [], stamps: []
};

const LangCircle: React.FC<{ code: string; isActive: boolean; onClick: () => void }> = ({ code, isActive, onClick }) => (
    <button onClick={onClick} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-90 shrink-0 shadow-lg ${isActive ? 'bg-purple-600 border-purple-400 text-white font-black scale-110' : 'bg-white/5 border-white/10 text-slate-500 font-bold hover:bg-white/10'}`}>
        <span className="text-[9px] tracking-tighter uppercase">{code}</span>
    </button>
);

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
  const [isSyncingLang, setIsSyncingLang] = useState(false);
  const [searchOptions, setSearchOptions] = useState<{name: string, spanishName: string, country: string}[] | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [user, setUser] = useState<UserProfile>(() => {
    try {
        const saved = localStorage.getItem('bdai_profile');
        if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    } catch (e) {}
    return GUEST_PROFILE;
  });

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const t = (key: string) => {
    const currentLang = user.language || 'es';
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['en'] || TRANSLATIONS['es'];
    return dict[key] || TRANSLATIONS['en'][key] || key;
  };

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await getUserProfileByEmail(session.user.email || '');
                const newUser = { 
                    ...(profile || GUEST_PROFILE), 
                    id: session.user.id, 
                    email: session.user.email, 
                    isLoggedIn: true,
                    language: profile?.language || user.language || 'es'
                };
                setUser(newUser as any);
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

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  // EFECTO DE TRADUCCIÓN GLOBAL
  useEffect(() => {
    if (tours.length > 0) {
      const translateCurrent = async () => {
        setIsLoading(true);
        setLoadingMessage(t('fastSync'));
        try {
          const translated = await translateToursBatch(tours, user.language);
          if (translated && translated.length > 0) {
              setTours(translated);
              if (translated[0].city) {
                setSelectedCity(translated[0].city);
              }
              // CRÍTICO: Si hay un tour activo, actualizarlo con la versión traducida
              if (activeTour) {
                const translatedActive = translated.find(tr => tr.id === activeTour.id);
                if (translatedActive) setActiveTour(translatedActive);
              }
          }
        } catch (e) {
          console.error("Auto-translate error:", e);
        } finally {
          setIsLoading(false);
        }
      };
      translateCurrent();
    }
  }, [user.language]);

  const handleCitySearch = async (cityInput: string) => {
    if (!cityInput || !cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));
    try {
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
        setIsLoading(false);
    }
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string}) => {
    setIsLoading(true); 
    setSearchOptions(null); 
    setSelectedCity(official.spanishName); 
    try {
        const cached = await getCachedTours(official.spanishName, official.country, user.language);
        if (cached && cached.data.length > 0) {
            setTours(cached.data); 
            setView(AppView.CITY_DETAIL);
            return;
        }
        setLoadingMessage(t('loadingTour'));
        const generated = await generateToursForCity(official.spanishName, official.country, user);
        if (generated.length > 0) {
            setTours(generated); 
            await saveToursToCache(official.spanishName, official.country, user.language, generated);
            setView(AppView.CITY_DETAIL);
        }
    } catch (e: any) { 
        alert(t('apiLimit'));
    } finally { 
        setIsLoading(false); 
    }
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
      } catch (e: any) { 
          alert(`Error: ${e.message}`);
      } finally {
          setIsLoading(false);
      }
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
                  language: user.language 
              };
              setUser(newUser as any);
              localStorage.setItem('bdai_profile', JSON.stringify(newUser));
              await syncUserProfile(newUser as any);
              setShowOnboarding(true);
          }
      } catch (e: any) { 
        alert(e.message); 
      } finally { 
        setIsLoading(false); 
      }
  };

  const handleLangChange = (code: string) => {
      setIsSyncingLang(true);
      const updatedUser = { ...user, language: code };
      setUser(updatedUser);
      localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
      if (user.isLoggedIn) syncUserProfile(updatedUser);
      setTimeout(() => setIsSyncingLang(false), 700);
  };

  const currentMayor = useMemo(() => leaderboard[0] || null, [leaderboard]);

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center"><BdaiLogo className="w-20 h-20 animate-pulse" /></div>;
  if (showOnboarding) return <Onboarding key={user.language} language={user.language} onComplete={() => { setShowOnboarding(false); setView(AppView.HOME); }} />;

  return (
    <div className="flex-1 bg-transparent flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {(isLoading || isSyncingLang) && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-fade-in">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-white font-black uppercase text-[9px] tracking-[0.3em] text-center px-8 mb-4">{isSyncingLang ? t('syncing') : loadingMessage}</p>
        </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 relative">
              <div className="text-center animate-fade-in flex flex-col items-center mb-6 mt-[-10dvh]">
                  <BdaiLogo className="w-52 h-52 animate-pulse-logo" />
                  <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 -mt-4">bdai</h1>
                  <p className="text-[12px] font-black lowercase tracking-tighter text-purple-500/80 mt-1">{t('tagline')}</p>
              </div>
              
              <div className="w-full max-w-[240px] mt-4 space-y-2.5">
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-2.5 animate-fade-in">
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-5 text-center text-white outline-none text-[9px] font-bold placeholder-slate-400" placeholder={t('userPlaceholder')} />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl py-2 px-5 text-center text-white outline-none text-[9px] font-bold placeholder-slate-400" placeholder={t('emailPlaceholder')} />
                          <button onClick={handleLoginRequest} className="w-full py-3 bg-white text-slate-950 rounded-xl font-black lowercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl">{t('login')}</button>
                      </div>
                  ) : (
                      <div className="space-y-6 text-center animate-fade-in">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('sentTo')} <span className="text-purple-400 lowercase">{email}</span></p>
                          <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-transparent border-b border-purple-500/30 py-2 text-center font-black text-3xl text-white outline-none" placeholder="0000" />
                          <button onClick={handleVerifyCode} className="w-full py-4 bg-purple-600 text-white rounded-lg font-black lowercase text-[11px] tracking-widest active:scale-95 transition-all">{t('verify')}</button>
                          <button onClick={() => setLoginStep('EMAIL')} className="w-full text-[9px] font-black uppercase tracking-widest text-slate-500">{t('changeEmail')}</button>
                      </div>
                  )}
              </div>

              <div className="absolute bottom-10 left-0 right-0 px-8 flex flex-col items-center gap-3">
                <p className="text-[6px] font-black lowercase tracking-[0.3em] text-slate-400 text-center uppercase">{t('selectLang')}</p>
                <div className="w-full max-w-sm overflow-x-auto no-scrollbar">
                    <div className="flex gap-4 items-center justify-start px-4 py-2">
                      {LANGUAGES.map(lang => (
                        <LangCircle key={lang.code} code={lang.name} isActive={user.language === lang.code} onClick={() => handleLangChange(lang.code)} />
                      ))}
                    </div>
                </div>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-32'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe-iphone px-6 max-w-md mx-auto">
                      <header className="flex justify-between items-center py-4">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-10 h-10"/><span className="font-black text-xl tracking-tighter">bdai</span></div>
                          <div className="flex items-center gap-3">
                              <div className="bg-purple-600/10 border border-purple-500/20 px-3 py-1.5 rounded-xl text-[7px] font-black text-purple-400 uppercase tracking-widest"><i className="fas fa-fire mr-1 text-orange-500"></i> {user.stats.streakDays} {t('streak')}</div>
                              <div className="bg-white/10 px-3 py-1.5 rounded-xl text-[8px] font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div>
                          </div>
                      </header>
                      <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.username || t('explorer')}.</span></h1>
                      
                      <div className="relative mt-6 flex gap-3">
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySearch(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-bold text-xs" />
                          <button onClick={() => handleCitySearch(searchVal)} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg"><i className="fas fa-search text-sm"></i></button>
                      </div>
                      
                      {searchOptions && (
                        <div className="mt-4 space-y-3 bg-slate-900 border-2 border-purple-500/50 p-6 rounded-[2.5rem] shadow-2xl animate-fade-in relative z-[1001]">
                            {searchOptions.map((opt, i) => (
                                <button key={i} onClick={() => processCitySelection(opt)} className="w-full p-5 bg-white/5 rounded-[1.5rem] flex items-center justify-between border border-white/5 active:bg-purple-600/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center"><i className="fas fa-map-marker-alt text-purple-500"></i></div>
                                        <div className="text-left"><span className="text-white font-black uppercase text-xs block">{opt.spanishName}</span><span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{opt.country}</span></div>
                                    </div>
                                    <i className="fas fa-chevron-right text-[10px] text-purple-500"></i>
                                </button>
                            ))}
                        </div>
                      )}
                      
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={(name: string) => handleCitySearch(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto">
                      <header className="flex items-center gap-4 mb-4 py-4 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button><h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2></header>
                      
                      {currentMayor && (
                          <div className="bg-gradient-to-r from-purple-900/40 to-slate-900 p-5 rounded-[2rem] border border-purple-500/20 mb-6 flex items-center justify-between animate-fade-in">
                              <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <img src={currentMayor.avatar} className="w-10 h-10 rounded-xl border border-purple-400" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[8px] text-slate-950 border border-slate-900 font-black"><i className="fas fa-crown"></i></div>
                                  </div>
                                  <div className="text-left">
                                      <p className="text-[7px] font-black text-purple-400 uppercase tracking-widest">{t('worldExplorer')}</p>
                                      <p className="text-[11px] font-black text-white uppercase truncate">@{currentMayor.username}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-sm font-black text-white">{currentMayor.miles.toLocaleString()}</p>
                                  <p className="text-[6px] font-black text-slate-500 uppercase">millas</p>
                              </div>
                          </div>
                      )}

                      <div className="space-y-4 pb-12">
                          {tours.length > 0 ? tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => handleStartTour(tour)} language={user.language || 'es'} />) : <div className="text-center py-20 opacity-30 uppercase font-black text-xs tracking-widest">{t('analyzing')}</div>}
                      </div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />}
                {view === AppView.LEADERBOARD && <div className="max-w-md mx-auto h-full"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language || 'es'} /></div>}
                {view === AppView.TOOLS && <div className="pt-safe-iphone px-6 max-w-md mx-auto"><TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={(name: string) => handleCitySearch(name)} /></div>}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onLogout={() => { supabase.auth.signOut(); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
                {view === AppView.SHOP && <div className="max-w-md mx-auto h-full"><Shop user={user} onPurchase={() => {}} /></div>}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-4 flex justify-center pointer-events-none"><nav className="bg-slate-900/98 backdrop-blur-2xl border border-white/10 px-2 py-3 flex justify-around items-center w-full max-w-sm rounded-[2rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg' : 'bg-white/5'}`}><BdaiLogo className="w-6 h-6" /></button>
                      <NavButton icon="fa-id-card" label={t('navVisa')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                      <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                  </nav></div>
            )}
          </div>
      )}
    </div>
  );
}
