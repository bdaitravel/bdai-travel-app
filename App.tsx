
import React, { useState, useEffect, useCallback } from 'react';
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
import { AdminPanel } from './components/AdminPanel';
import { supabase, getUserProfileByEmail, getGlobalRanking, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat, deleteCityCache } from './services/supabaseClient';

const UI_STRINGS: Record<string, any> = {
  es: { welcome: "bienvenido, bidaer:", explorer: "explorador", searchPlaceholder: "buscar ciudad...", emailPlaceholder: "tu@email.com", userPlaceholder: "usuario", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", authError: "email no válido", codeError: "incompleto", selectLang: "idioma", sentTo: "enviado a", changeEmail: "corregir", loading: "conectando...", navElite: "élite", navHub: "intel", navVisa: "pasaporte", navStore: "tienda", refreshIntel: "Purgar & Refrescar GPS", analyzing: "Buscando coordenadas reales...", loadingTour: "Dai está investigando la ciudad..." },
  en: { welcome: "welcome, bidaer:", explorer: "explorer", searchPlaceholder: "search city...", emailPlaceholder: "your@email.com", userPlaceholder: "username", login: "request access", verify: "validate", tagline: "better destinations by ai", authError: "invalid email", codeError: "incomplete", selectLang: "language", sentTo: "sent to", changeEmail: "edit", loading: "connecting...", navElite: "elite", navHub: "intel", navVisa: "passport", navStore: "store", refreshIntel: "Purge & Refresh GPS", analyzing: "Searching real coordinates...", loadingTour: "Dai is scouting the city..." },
  zh: { welcome: "欢迎, 探险者:", explorer: "探险者", searchPlaceholder: "搜索城市...", emailPlaceholder: "电子邮件", userPlaceholder: "用户名", login: "请求访问", verify: "验证", tagline: "better destinations by ai", authError: "无效邮件", codeError: "不完整", selectLang: "语言", sentTo: "已发送至", changeEmail: "修改", loading: "连接中...", navElite: "精英", navHub: "情报", navVisa: "护照", navStore: "商店", refreshIntel: "清除缓存" },
  ca: { welcome: "benvingut, bidaer:", explorer: "explorador", searchPlaceholder: "buscar ciutat...", emailPlaceholder: "teu@email.com", userPlaceholder: "usuari", login: "sol·licitar accés", verify: "validar", tagline: "better destinations by ai", authError: "email no vàlid", codeError: "incomplet", selectLang: "idioma", sentTo: "enviat a", changeEmail: "corregir", loading: "connectant...", navElite: "elit", navHub: "intel", navVisa: "passaport", navStore: "botiga", refreshIntel: "Actualitzar GPS" },
  eu: { welcome: "ongi etorri, bidaer:", explorer: "esploratzailea", searchPlaceholder: "bilatu hiria...", emailPlaceholder: "zure@email.com", userPlaceholder: "erabiltzailea", login: "sarbidea eskatu", verify: "balioztatu", tagline: "better destinations by ai", authError: "email okerra", codeError: "osatu gabe", selectLang: "hizkuntza", sentTo: "hona bidalia", changeEmail: "zuzendu", loading: "konektatzen...", navElite: "elite", navHub: "intel", navVisa: "pasaportea", navStore: "denda", refreshIntel: "GPSa Berrezarri" },
  ar: { welcome: "أهلاً بك، بيداير:", explorer: "مستكشف", searchPlaceholder: "بحث عن مدينة...", emailPlaceholder: "بريدك", userPlaceholder: "اسم المستخدم", login: "طلب دخول", verify: "تأكيد", tagline: "better destinations by ai", authError: "بريد خاطئ", codeError: "ناقص", selectLang: "اللغة", sentTo: "أرسل إلى", changeEmail: "تعديل", loading: "جاري الاتصال...", navElite: "نخبة", navHub: "معلومات", navVisa: "جواز سفر", navStore: "متجر", refreshIntel: "تحديث GPS" },
  pt: { welcome: "bem-vindo, bidaer:", explorer: "explorador", searchPlaceholder: "buscar cidade...", emailPlaceholder: "teu@email.com", userPlaceholder: "usuário", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", authError: "email inválido", codeError: "incompleto", selectLang: "idioma", sentTo: "enviado para", changeEmail: "corregir", loading: "conectando...", navElite: "elite", navHub: "intel", navVisa: "passaporte", navStore: "loja", refreshIntel: "Atualizar GPS" },
  fr: { welcome: "bienvenue, bidaer:", explorer: "explorateur", searchPlaceholder: "chercher une ville...", emailPlaceholder: "votre@email.com", userPlaceholder: "nom d'utilisateur", login: "demander l'accès", verify: "valider", tagline: "better destinations by ai", authError: "email invalide", codeError: "incomplet", selectLang: "langue", sentTo: "envoyé à", changeEmail: "modifier", loading: "connexion...", navElite: "élite", navHub: "intel", navVisa: "passeport", navStore: "boutique", refreshIntel: "Mettre à jour GPS" },
  de: { welcome: "willkommen, bidaer:", explorer: "entdecker", searchPlaceholder: "stadt suchen...", emailPlaceholder: "deine@email.com", userPlaceholder: "benutzername", login: "zugang anfordern", verify: "bestätigen", tagline: "better destinations by ai", authError: "ungültige email", codeError: "unvollständig", selectLang: "sprache", sentTo: "gesendet an", changeEmail: "korrigieren", loading: "verbinden...", navElite: "elite", navHub: "intel", navVisa: "reisepass", navStore: "laden", refreshIntel: "GPS aktualisieren" },
  it: { welcome: "benvenuto, bidaer:", explorer: "esploratore", searchPlaceholder: "cerca città...", emailPlaceholder: "tua@email.com", userPlaceholder: "username", login: "richiedi accesso", verify: "conferma", tagline: "better destinations by ai", authError: "email non valida", codeError: "incompleto", selectLang: "lingua", sentTo: "inviato a", changeEmail: "modifica", loading: "connessione...", navElite: "élite", navHub: "intel", navVisa: "passaporto", navStore: "negozio", refreshIntel: "Aggiorna GPS" },
  ja: { welcome: "ようこそ, 探検家:", explorer: "探検家", searchPlaceholder: "都市を検索...", emailPlaceholder: "メールアドレス", userPlaceholder: "ユーザー名", login: "アクセスをリクエスト", verify: "認証", tagline: "better destinations by ai", authError: "無効なメール", codeError: "不完全", selectLang: "言語", sentTo: "送信先", changeEmail: "修正", loading: "接続中...", navElite: "エリート", navHub: "インテル", navVisa: "パスポート", navStore: "ショップ", refreshIntel: "GPS更新" },
  ru: { welcome: "добро пожаловать:", explorer: "исследователь", searchPlaceholder: "поиск города...", emailPlaceholder: "твой@email.com", userPlaceholder: "логин", login: "войти", verify: "подтвердить", tagline: "better destinations by ai", authError: "неверный email", codeError: "неполный", selectLang: "язык", sentTo: "отправлено на", changeEmail: "исправить", loading: "подключение...", navElite: "элита", navHub: "инфо", navVisa: "паспорт", navStore: "магазин", refreshIntel: "Сбросить GPS" },
  hi: { welcome: "स्वागत है, खोजकर्ता:", explorer: "खोजकर्ता", searchPlaceholder: "शहर खोजें...", emailPlaceholder: "आपका ईमेल", userPlaceholder: "यूज़रनेम", login: "पहुंच का अनुरोध", verify: "पुष्टि करें", tagline: "better destinations by ai", authError: "अमान्य ईमेल", codeError: "अपूर्ण", selectLang: "भाषा", sentTo: "को भेजा गया", changeEmail: "सुधारें", loading: "जुड़ रहा है...", navElite: "अभिजात वर्ग", navHub: "इंटेल", navVisa: "पासपोर्ट", navStore: "स्टोर", refreshIntel: "GPS रीफ्रेश करें" },
  ko: { welcome: "환영합니다, 탐험가:", explorer: "탐험가", searchPlaceholder: "도시 검색...", emailPlaceholder: "이메일 주소", userPlaceholder: "사용자 이름", login: "접속 요청", verify: "확인", tagline: "better destinations by ai", authError: "잘못된 이메일", codeError: "미완성", selectLang: "언어", sentTo: "발송 완료", changeEmail: "수정", loading: "연결 중...", navElite: "엘리트", navHub: "정보", navVisa: "여권", navStore: "상점", refreshIntel: "GPS 새로고침" },
  tr: { welcome: "hoş geldiniz, bidaer:", explorer: "gezgin", searchPlaceholder: "şehir ara...", emailPlaceholder: "e-postanız@mail.com", userPlaceholder: "kullanıcı adı", login: "erişim iste", verify: "doğrula", tagline: "better destinations by ai", authError: "geçersiz e-posta", codeError: "eksik", selectLang: "dil", sentTo: "gönderildi:", changeEmail: "düzelt", loading: "bağlanıyor...", navElite: "elit", navHub: "intel", navVisa: "pasaport", navStore: "mağaza", refreshIntel: "GPS Temizle" }
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string, label: string, isActive: boolean, onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 flex-1 transition-all active:scale-90 pointer-events-auto">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-purple-600 text-white shadow-lg' : 'bg-transparent text-slate-500'}`}>
      <i className={`fas ${icon} text-sm`}></i>
    </div>
    <span className={`text-[7px] font-black uppercase tracking-widest ${isActive ? 'text-purple-400' : 'text-slate-600'}`}>{label}</span>
  </button>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
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
        if (saved) {
            const parsed = JSON.parse(saved);
            return { ...parsed, isLoggedIn: !!parsed.id && parsed.id !== 'guest' };
        }
        return { language: 'es', miles: 0, isLoggedIn: false } as any;
    } catch (e) { return { language: 'es', miles: 0, isLoggedIn: false } as any; }
  });

  const t = useCallback((key: string) => {
    const lang = user.language || 'es';
    const dict = UI_STRINGS[lang] || UI_STRINGS['es'];
    return dict[key] || UI_STRINGS['es'][key] || key;
  }, [user.language]);

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            // SI HAY ERROR DE TOKEN (Invalid Refresh Token), LIMPIAMOS TODO
            if (error) {
                console.warn("Auth session error, clearing local state:", error);
                localStorage.removeItem('bdai_profile');
                setUser({ language: user.language || 'es', miles: 0, isLoggedIn: false } as any);
                setView(AppView.LOGIN);
                return;
            }

            const saved = localStorage.getItem('bdai_profile');
            const savedProfile = saved ? JSON.parse(saved) : null;
            
            if (session?.user) {
                const profile = await getUserProfileByEmail(session.user.email || '');
                const newUser = { ...(profile || savedProfile), id: session.user.id, email: session.user.email, isLoggedIn: true, language: profile?.language || savedProfile?.language || user.language || 'es' };
                setUser(newUser as any);
                localStorage.setItem('bdai_profile', JSON.stringify(newUser));
                setView(AppView.HOME);
                if (!newUser.username) setShowOnboarding(true);
            }
        } catch (e) { 
            console.error("Auth init fatal:", e); 
        } finally { 
            setIsVerifyingSession(false); 
        }
    };
    checkAuth();
    getGlobalRanking().then(setLeaderboard);
  }, []);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("GPS Error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  const handleCitySearch = async (cityInput: string, forceRefresh = false) => {
    if (!cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(forceRefresh ? t('analyzing') : t('loadingTour'));
    setSearchOptions(null);
    try {
        if (forceRefresh) {
            // PURGA TOTAL DE LA CIUDAD EN SUPABASE
            addLog(`Purgando caché de ${cityInput}...`);
            await deleteCityCache(cityInput, "");
        }

        const cached = await getCachedTours(cityInput, "", user.language);
        if (cached && !forceRefresh) {
            setTours(cached.data);
            setSelectedCity(cached.cityName || cityInput);
            setView(AppView.CITY_DETAIL);
            setIsLoading(false);
            return;
        }

        const results = await standardizeCityName(cityInput);
        if (results && results.length > 0) {
            setSearchOptions(results);
            setIsLoading(false);
        } else {
            await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" }, forceRefresh);
        }
    } catch (e) { 
        await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" }, forceRefresh); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string}, forceRefresh = false) => {
    setIsLoading(true); 
    setSearchOptions(null);
    setTours([]);
    try {
        if (forceRefresh) {
            await deleteCityCache(official.spanishName, official.country);
        }

        const generated = await generateToursForCity(official.spanishName, official.country, user);
        if (generated.length > 0) {
            setTours(generated); 
            setSelectedCity(generated[0].city);
            await saveToursToCache(official.spanishName, official.country, user.language, generated);
            setView(AppView.CITY_DETAIL);
        }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const addLog = (m: string) => console.log(`[BDAI ADMIN] ${m}`);

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
      if (session?.user) {
          const profile = await getUserProfileByEmail(session.user.email || '');
          const newUser = { ...profile, id: session.user.id, isLoggedIn: true, language: user.language };
          setUser(newUser as any);
          localStorage.setItem('bdai_profile', JSON.stringify(newUser));
          setView(AppView.HOME);
          if (!profile?.username) setShowOnboarding(true);
      }
    } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
  };

  const handleLangChange = (code: string) => {
      const updated = { ...user, language: code };
      setUser(updated);
      localStorage.setItem('bdai_profile', JSON.stringify(updated));
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center"><BdaiLogo className="w-16 h-16 animate-pulse" /></div>;
  if (showOnboarding) return <Onboarding key={user.language} language={user.language} onComplete={() => { setShowOnboarding(false); setView(AppView.HOME); }} />;

  return (
    <div key={user.language} className={`flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden ${user.language === 'ar' ? 'rtl' : 'ltr'}`}>
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-fade-in text-center">
            <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_20px_rgba(168,85,247,0.3)]"></div>
            <p className="text-white font-black uppercase text-[10px] tracking-[0.4em] px-10 mb-4 animate-pulse">{loadingMessage}</p>
        </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617]">
              <div className="text-center animate-fade-in flex flex-col items-center mb-6 mt-[-15dvh]">
                  <BdaiLogo className="w-20 h-20 animate-pulse-logo" />
                  <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 -mt-2">bdai</h1>
                  <p className="text-[10px] font-black lowercase tracking-[0.3em] text-purple-500/80 mt-1 uppercase">{t('tagline')}</p>
              </div>
              
              <div className="w-full max-w-[260px] mt-6 space-y-4">
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-3 animate-fade-in">
                          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none text-sm font-bold placeholder-slate-600 focus:border-purple-500" placeholder={t('userPlaceholder')} />
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none text-sm font-bold placeholder-slate-600 focus:border-purple-500" placeholder={t('emailPlaceholder')} />
                          <button onClick={handleLoginRequest} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-xl">{t('login')}</button>
                      </div>
                  ) : (
                      <div className="space-y-6 text-center animate-fade-in">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('sentTo')} <span className="text-purple-400 lowercase">{email}</span></p>
                          <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-transparent border-b-2 border-purple-500/30 py-2 text-center font-black text-4xl text-white outline-none" placeholder="0000" />
                          <button onClick={handleVerifyCode} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-lg">{t('verify')}</button>
                          <button onClick={() => setLoginStep('EMAIL')} className="w-full text-[9px] font-black uppercase tracking-widest text-slate-500">{t('changeEmail')}</button>
                      </div>
                  )}
              </div>

              <div className="absolute bottom-8 left-0 right-0 px-6 flex flex-col items-center gap-3">
                <p className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em]">{t('selectLang')}</p>
                <div className="bg-white/[0.03] border border-white/10 p-3 rounded-[2rem] shadow-2xl backdrop-blur-md w-full max-w-sm overflow-hidden">
                    <div className="grid grid-cols-8 gap-2 items-center justify-items-center">
                      {LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => handleLangChange(lang.code)} className="transition-all active:scale-90">
                          <FlagIcon code={lang.code} className={`w-4 h-4 ${user.language === lang.code ? 'ring-2 ring-purple-500 scale-125 z-10' : 'grayscale opacity-30 hover:opacity-100 hover:grayscale-0'}`} />
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
                  <div className="space-y-4 pt-safe-iphone px-6 max-w-md mx-auto animate-fade-in">
                      <header className="flex justify-between items-center py-4">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-8 h-8"/><span className="font-black text-lg tracking-tighter">bdai</span></div>
                          <div className="flex items-center gap-3">
                              <button onClick={() => setShowOnboarding(true)} className="bg-white/5 w-8 h-8 rounded-full flex items-center justify-center text-purple-400 border border-white/10 active:scale-90 transition-all"><i className="fas fa-info text-[10px]"></i></button>
                              <div className="bg-white/10 px-3 py-1.5 rounded-xl text-[8px] font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div>
                          </div>
                      </header>
                      <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.username || t('explorer')}.</span></h1>
                      <div className="relative mt-6 flex gap-3">
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySearch(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none font-bold text-xs" />
                          <button onClick={() => handleCitySearch(searchVal)} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-all"><i className="fas fa-search text-sm"></i></button>
                      </div>
                      {searchOptions && (
                        <div className="mt-4 space-y-3 bg-slate-900 border-2 border-purple-500/50 p-6 rounded-[1.5rem] shadow-2xl animate-fade-in relative z-50">
                            {searchOptions.map((opt, i) => (
                                <button key={i} onClick={() => processCitySelection(opt)} className="w-full p-5 bg-white/5 rounded-[1rem] flex items-center justify-between border border-white/5 active:scale-[0.97] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-purple-500 shadow-inner"><i className="fas fa-map-marker-alt"></i></div>
                                        <div className="text-left"><span className="text-white font-black uppercase text-xs block">{opt.spanishName}</span><span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{opt.country}</span></div>
                                    </div>
                                    <i className={`fas fa-chevron-right text-[10px] text-purple-500 ${user.language === 'ar' ? 'rotate-180' : ''}`}></i>
                                </button>
                            ))}
                        </div>
                      )}
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={(name: string) => handleCitySearch(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto animate-fade-in">
                      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20">
                        <button onClick={() => setView(AppView.HOME)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center active:scale-90 transition-all"><i className={`fas ${user.language === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'} text-xs`}></i></button>
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2>
                        <button onClick={() => handleCitySearch(selectedCity || "", true)} className="w-9 h-9 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400 active:rotate-180 transition-all" title={t('refreshIntel')}><i className="fas fa-sync-alt text-xs"></i></button>
                      </header>
                      <div className="space-y-4 pb-12">
                          {tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0); }} language={user.language || 'es'} />)}
                      </div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language || 'es'} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={(name: string) => handleCitySearch(name)} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language || 'es'} onLogout={() => { supabase.auth.signOut(); localStorage.removeItem('bdai_profile'); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={() => {}} />}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-4 flex justify-center pointer-events-none">
                  <nav className="bg-slate-900/98 backdrop-blur-2xl border border-white/10 px-2 py-3 flex justify-around items-center w-full max-w-sm rounded-[3rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                      <button onClick={() => setView(AppView.HOME)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg' : 'bg-white/5 shadow-inner'}`}><BdaiLogo className="w-5 h-5" /></button>
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
