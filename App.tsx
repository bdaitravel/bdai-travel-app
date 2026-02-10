
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
import { Onboarding } from './components/Onboarding';
import { supabase, getUserProfileByEmail, getGlobalRanking, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat, searchCitiesInCache } from './services/supabaseClient';

const TAGLINE = "better destinations by ai";

const TRANSLATIONS: any = {
  es: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciudad...", emailPlaceholder: "registra tu email", userPlaceholder: "elige un nombre de usuario", login: "solicitar acceso", verify: "validar", tagline: TAGLINE, authError: "email no válido", codeError: "8 dígitos", selectLang: "idioma", loading: "sincronizando...", navElite: "élite", navHub: "destinos", navVisa: "pasaporte", navStore: "tienda", changeEmail: "corregir", sentTo: "enviado a", loadingTour: "generando masterclass...", analyzing: "analizando...", fastSync: "traduciendo archivo...", apiLimit: "IA Saturada", retry: "Reintentar", info: "info", searchGlobal: "Buscar en todo el mundo con IA", fromArchive: "En Archivo" },
  en: { welcome: "bidaer log:", explorer: "explorer", searchPlaceholder: "city...", emailPlaceholder: "register your email", userPlaceholder: "choose a username", login: "request access", verify: "validate", tagline: TAGLINE, authError: "invalid email", codeError: "8 digits", selectLang: "language", loading: "syncing...", navElite: "elite", navHub: "destinations", navVisa: "passport", navStore: "store", changeEmail: "change", sentTo: "sent to", loadingTour: "generating masterclass...", analyzing: "analyzing...", fastSync: "translating archive...", apiLimit: "AI Saturated", retry: "Retry", info: "info", searchGlobal: "Search global with AI", fromArchive: "In Archive" },
  zh: { welcome: "日志:", explorer: "探险家", searchPlaceholder: "城市...", emailPlaceholder: "注册您的电子邮箱", userPlaceholder: "选择用户名", login: "请求访问", verify: "验证", tagline: TAGLINE, authError: "邮箱无效", codeError: "8位数字", selectLang: "选择语言", loading: "同步中...", navElite: "精英", navHub: "目的地", navVisa: "护照", navStore: "商店", changeEmail: "修改", sentTo: "发送至", loadingTour: "生成中...", analyzing: "分析中...", fastSync: "翻译中...", apiLimit: "IA 饱和", retry: "重试", info: "信息", searchGlobal: "全球搜索", fromArchive: "存档中" },
  ca: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciutat...", emailPlaceholder: "registra el teu email", userPlaceholder: "tria un nom d'usuari", login: "sol·licitar accés", verify: "validar", tagline: TAGLINE, authError: "email no vàlid", codeError: "8 dígits", selectLang: "idioma", loading: "sincronitzant...", navElite: "elit", navHub: "destins", navVisa: "passaport", navStore: "botiga", changeEmail: "corregir", sentTo: "enviat a", loadingTour: "generant...", analyzing: "analitzant...", fastSync: "traduint...", apiLimit: "IA Saturada", retry: "Reintentar", info: "info", searchGlobal: "Cerca global amb IA", fromArchive: "A l'Arxiu" },
  eu: { welcome: "log bidaer:", explorer: "esploratzailea", searchPlaceholder: "hiria...", emailPlaceholder: "erregistratu zure emaila", userPlaceholder: "aukeratu erabiltzaile izena", login: "sarrera eskatu", verify: "balioztatu", tagline: TAGLINE, authError: "email okerra", codeError: "8 digitu", selectLang: "hizkuntza", loading: "sinkronizatzen...", navElite: "elitea", navHub: "destinuak", navVisa: "pasaportea", navStore: "denda", changeEmail: "zuzendu", sentTo: "hona bidalia", loadingTour: "sortzen...", analyzing: "analitzant...", fastSync: "itzultzen...", apiLimit: "IA Saturatuta", retry: "Berriz saiatu", info: "info", searchGlobal: "Bilaketa globala IA-rekin", fromArchive: "Artxiboan" },
  ar: { welcome: "سجل المسافر:", explorer: "مستكشف", searchPlaceholder: "مدينة...", emailPlaceholder: "سجل بريدك الإلكتروني", userPlaceholder: "اختر اسم المستخدم", login: "طلب الدخول", verify: "تحقق", tagline: TAGLINE, authError: "بريد غير صالح", codeError: "8 أرقام", selectLang: "اللغة", loading: "جاري المزامنة...", navElite: "النخبة", navHub: "وجهات", navVisa: "جواز السفر", navStore: "متجر", changeEmail: "تعديل", sentTo: "تم الإرسال إلى", loadingTour: "جاري الإنشاء...", analyzing: "جاري التحليل...", fastSync: "جاري الترجمة...", apiLimit: "الذكاء الاصطناعي مشبع", retry: "إعادة المحاولة", info: "معلومات", searchGlobal: "بحث عالمي بالذكاء الاصطناعي", fromArchive: "في الأرشيف" },
  pt: { welcome: "registro bidaer:", explorer: "explorador", searchPlaceholder: "cidade...", emailPlaceholder: "registre seu email", userPlaceholder: "escolha um nom de usuário", login: "solicitar acceso", verify: "validar", tagline: TAGLINE, authError: "email inválido", codeError: "8 dígitos", selectLang: "idioma", loading: "sincronizando...", navElite: "elite", navHub: "destinos", navVisa: "passaporte", navStore: "loja", changeEmail: "corregir", sentTo: "enviado para", loadingTour: "gerando...", analyzing: "analisando...", fastSync: "traduzindo...", apiLimit: "IA Saturada", retry: "Repetir", info: "info", searchGlobal: "Busca global com IA", fromArchive: "No Arquivo" },
  fr: { welcome: "journal bidaer:", explorer: "explorateur", searchPlaceholder: "ville...", emailPlaceholder: "enregistrez votre email", userPlaceholder: "choisissez un nom d'utilisateur", login: "accès", verify: "valider", tagline: TAGLINE, authError: "email invalide", codeError: "8 chiffres", selectLang: "langue", loading: "synchronisation...", navElite: "élite", navHub: "destinations", navVisa: "passeport", navStore: "boutique", changeEmail: "corriger", sentTo: "envoyé à", loadingTour: "génération...", analyzing: "analyse...", fastSync: "traduction...", apiLimit: "IA Saturée", retry: "Réessayer", info: "info", searchGlobal: "Recherche mondiale IA", fromArchive: "Dans l'Archive" },
  de: { welcome: "bidaer log:", explorer: "entdecker", searchPlaceholder: "stadt...", emailPlaceholder: "e-mail registrieren", userPlaceholder: "benutzernamen wählen", login: "zugang", verify: "bestätigen", tagline: TAGLINE, authError: "ungültige e-mail", codeError: "8 ziffern", selectLang: "sprache", loading: "synchronisierung...", navElite: "elite", navHub: "ziele", navVisa: "pass", navStore: "shop", changeEmail: "korrigieren", sentTo: "gesendet an", loadingTour: "generierung...", analyzing: "analyse...", fastSync: "übersetzung...", apiLimit: "KI gesättigt", retry: "Wiederholen", info: "info", searchGlobal: "Globale KI-Suche", fromArchive: "Im Archiv" },
  it: { welcome: "diario bidaer:", explorer: "esplore", searchPlaceholder: "città...", emailPlaceholder: "registra la tua email", userPlaceholder: "scegli un nome utente", login: "accesso", verify: "valida", tagline: TAGLINE, authError: "email non valida", codeError: "8 cifre", selectLang: "lingua", loading: "sincronizzazione...", navElite: "élite", navHub: "destinazioni", navVisa: "passaporto", navStore: "negozio", changeEmail: "correggi", sentTo: "inviato a", loadingTour: "generazione...", analyzing: "analisi...", fastSync: "traduzione...", apiLimit: "IA Satura", retry: "Riprova", info: "info", searchGlobal: "Ricerca globale IA", fromArchive: "In Archivio" },
  ja: { welcome: "ログ:", explorer: "探検家", searchPlaceholder: "都市...", emailPlaceholder: "メールを登録", userPlaceholder: "ユーザー名を選択", login: "アクセス", verify: "確認", tagline: TAGLINE, authError: "無効なメール", codeError: "8桁", selectLang: "言語", loading: "同期中...", navElite: "エリート", navHub: "目的地", navVisa: "パスポート", navStore: "ショップ", changeEmail: "修正", sentTo: "送信先", loadingTour: "生成中...", analyzing: "分析中...", fastSync: "翻訳中...", apiLimit: "IA 飽和", retry: "再試行", info: "情報", searchGlobal: "グローバルAI検索", fromArchive: "アーカイブ内" },
  ru: { welcome: "журнал:", explorer: "исследователь", searchPlaceholder: "город...", emailPlaceholder: "зарегистрируйте email", userPlaceholder: "выберите имя пользователя", login: "запрос", verify: "проверить", tagline: TAGLINE, authError: "неверный email", codeError: "8 цифр", selectLang: "язык", loading: "синхронизация...", navElite: "элита", navHub: "места", navVisa: "паспорт", navStore: "магазин", changeEmail: "исправить", sentTo: "отправлено на", loadingTour: "генерация...", analyzing: "анализ...", fastSync: "перевод...", apiLimit: "ИИ перегружен", retry: "Повторить", info: "инфо", searchGlobal: "Глобальный поиск ИИ", fromArchive: "В Архиве" },
  hi: { welcome: "लॉग:", explorer: "खोजकर्ता", searchPlaceholder: "शहर...", emailPlaceholder: "अपना ईमेल पंजीकृत करें", userPlaceholder: "उपयोगकर्ता नाम चुनें", login: "पहुंच", verify: "पुष्टि", tagline: TAGLINE, authError: "अमान्य ईमेल", codeError: "8 अंक", selectLang: "भाषा", loading: "सिंक हो रहा है...", navElite: "अभिजात वर्ग", navHub: "गंतव्य", navVisa: "पासपोर्ट", navStore: "स्टोर", changeEmail: "सुधारें", sentTo: "को भेजा गया", loadingTour: "बना रहा है...", analyzing: "विश्लेषण...", fastSync: "अनुवाद...", apiLimit: "एआई संतृप्त", retry: "पुनः प्रयास", info: "जानकारी", searchGlobal: "एआई वैश्विक खोज", fromArchive: "संग्रह में" },
  ko: { welcome: "로그:", explorer: "탐험가", searchPlaceholder: "도시...", emailPlaceholder: "이메일 등록", userPlaceholder: "사용자 이름 선택", login: "요청", verify: "확인", tagline: TAGLINE, authError: "잘못된 이메일", codeError: "8자리", selectLang: "언어", loading: "동기화 중...", navElite: "엘리트", navHub: "목적지", navVisa: "여권", navStore: "상점", changeEmail: "수정", sentTo: "전송됨:", loadingTour: "생성 중...", analyzing: "分析中...", fastSync: "번역 중...", apiLimit: "IA 포화", retry: "재시도", info: "정보", searchGlobal: "AI 글로벌 검색", fromArchive: "아카이브" },
  tr: { welcome: "günlük:", explorer: "gezgin", searchPlaceholder: "şehir...", emailPlaceholder: "e-postanızı kaydedin", userPlaceholder: "kullanıcı adı seçin", login: "erişim", verify: "doğrula", tagline: TAGLINE, authError: "geçersiz eposta", codeError: "8 hane", selectLang: "dil", loading: "senkronize ediliyor...", navElite: "seçkinler", navHub: "hedefler", navVisa: "pasaport", navStore: "mağaza", changeEmail: "düzelt", sentTo: "gönderildi:", loadingTour: "oluşturuluyor...", analyzing: "analiz...", fastSync: "çevriliyor...", apiLimit: "IA Doygun", retry: "Tekrar dene", info: "bilgi", searchGlobal: "IA Küresel Arama", fromArchive: "Arşivde" }
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
  const [email, setEmal] = useState('');
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchOptions, setSearchOptions] = useState<{name: string, spanishName: string, country: string, isCached?: boolean}[] | null>(null);
  
  const [user, setUser] = useState<UserProfile>(() => {
    try {
        const saved = localStorage.getItem('bdai_profile');
        if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    } catch (e) {}
    return GUEST_PROFILE;
  });

  useEffect(() => {
    const init = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await getUserProfileByEmail(session.user.email || '');
                if (profile) {
                    const updated = { ...profile, id: session.user.id, email: session.user.email, isLoggedIn: true };
                    setUser(updated as any);
                    localStorage.setItem('bdai_profile', JSON.stringify(updated));
                    
                    const hasSeenOnboarding = localStorage.getItem('bdai_onboarding_completed');
                    setView(hasSeenOnboarding ? AppView.HOME : AppView.ONBOARDING);
                }
            } else if (user.isLoggedIn) {
                const hasSeenOnboarding = localStorage.getItem('bdai_onboarding_completed');
                setView(hasSeenOnboarding ? AppView.HOME : AppView.ONBOARDING);
            }
        } finally { setIsVerifyingSession(false); }
    };
    init();
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  const t = (key: string) => {
    const lang = user.language || 'es';
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['es'];
    return dict[key] || TRANSLATIONS['es'][key] || key;
  };

  const handleLangChange = async (code: string) => {
      const updatedUser = { ...user, language: code };
      setUser(updatedUser); 
      localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
      await syncUserProfile(updatedUser);
      if (selectedCity && tours.length > 0) {
          setIsLoading(true);
          setLoadingMessage(t('fastSync'));
          try {
              const cached = await getCachedTours(selectedCity, "", code);
              if (cached && cached.langFound === code) {
                  setTours(cached.data);
              } else {
                  const targetName = LANGUAGES.find(l => l.code === code)?.name || "Spanish";
                  const translated = await translateTours(tours, targetName);
                  setTours(translated);
                  saveToursToCache(selectedCity, "", code, translated);
              }
          } catch (e) { console.error(e); } finally { setIsLoading(false); }
      }
  };

  const completeOnboarding = () => {
      localStorage.setItem('bdai_onboarding_completed', 'true');
      setView(AppView.HOME);
  };

  const handleCitySearch = async (cityInput: string) => {
    if (!cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));
    setSearchOptions(null);
    try {
        const dbMatches = await searchCitiesInCache(cityInput);
        if (dbMatches.length > 0) {
            setSearchOptions(dbMatches);
        } else {
            const aiResults = await standardizeCityName(cityInput);
            setSearchOptions(aiResults);
        }
    } finally { setIsLoading(false); }
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string, isCached?: boolean}) => {
    setIsLoading(true);
    setSearchOptions(null);
    setSelectedCity(official.spanishName);
    setTours([]); 
    try {
        const cached = await getCachedTours(official.spanishName, official.country, user.language);
        if (cached) {
            if (cached.langFound !== user.language) {
                setLoadingMessage(t('fastSync'));
                const targetName = LANGUAGES.find(l => l.code === user.language)?.name || "Spanish";
                const translated = await translateTours(cached.data, targetName);
                setTours(translated);
                saveToursToCache(official.spanishName, official.country, user.language, translated);
            } else {
                setTours(cached.data);
            }
            setView(AppView.CITY_DETAIL);
        } else {
            setLoadingMessage(t('loadingTour'));
            const generated = await generateToursForCity(official.spanishName, official.country, user);
            if (generated.length > 0) {
                setTours(generated);
                saveToursToCache(official.spanishName, official.country, user.language, generated);
                setView(AppView.CITY_DETAIL);
            }
        }
    } finally { setIsLoading(false); }
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center"><BdaiLogo className="w-16 h-16 animate-pulse" /></div>;

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-white font-black uppercase text-[9px] tracking-[0.3em] text-center">{loadingMessage}</p>
        </div>
      )}

      {view === AppView.ONBOARDING && <Onboarding language={user.language} onComplete={completeOnboarding} />}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617] bg-login-glow">
              <div className="text-center mb-10 mt-[-15dvh] animate-fade-in flex flex-col items-center">
                  <BdaiLogo className="w-44 h-44 animate-pulse-logo" />
                  <h1 className="text-7xl font-black lowercase tracking-tighter text-white/95 -mt-6">bdai</h1>
                  <p className="text-[13px] font-black lowercase text-purple-500 mt-1 opacity-80">{t('tagline')}</p>
              </div>
              
              <div className="w-full max-w-[220px] space-y-3 mb-8">
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-3 animate-fade-in">
                          <div className="group bg-black/60 border border-white/5 rounded-xl p-2.5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.9)] focus-within:border-purple-500/50 transition-all">
                              <label className="text-[8px] font-black text-white/40 tracking-[0.15em] mb-0.5 block px-1 lowercase">{t('userPlaceholder')}</label>
                              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-transparent text-purple-400 outline-none text-[10px] font-black lowercase px-1 placeholder-slate-800" placeholder="..." />
                          </div>
                          <div className="group bg-black/60 border border-white/5 rounded-xl p-2.5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.9)] focus-within:border-purple-500/50 transition-all">
                              <label className="text-[8px] font-black text-white/40 tracking-[0.15em] mb-0.5 block px-1 lowercase">{t('emailPlaceholder')}</label>
                              <input type="email" value={email} onChange={e => setEmal(e.target.value)} className="w-full bg-transparent text-purple-400 outline-none text-[10px] font-black lowercase px-1 placeholder-slate-800" placeholder="..." />
                          </div>
                          <button onClick={() => { if(validateEmailFormat(email)) { supabase.auth.signInWithOtp({email}); setLoginStep('CODE'); } }} className="w-full py-3.5 bg-white text-slate-950 rounded-xl font-black lowercase text-[10px] tracking-widest active:scale-95 transition-all shadow-2xl mt-4">{t('login')}</button>
                      </div>
                  ) : (
                      <div className="space-y-6 text-center animate-fade-in">
                          <div className="bg-black/60 border border-white/5 p-5 rounded-[2.5rem] mb-4 shadow-2xl">
                             <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{t('sentTo')}</p>
                             <p className="text-[10px] font-black text-purple-400 truncate mb-3 lowercase">{email}</p>
                             <button onClick={() => setLoginStep('EMAIL')} className="text-[8px] font-black text-white/30 uppercase tracking-widest underline underline-offset-4 hover:text-white transition-all">{t('changeEmail')}</button>
                          </div>
                          <input autoFocus type="text" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-transparent border-b-2 border-purple-500 py-2 text-center font-black text-4xl text-white outline-none tracking-[0.2em]" placeholder="0000" />
                          <button onClick={async () => { const { data } = await supabase.auth.verifyOtp({email, token: otpCode, type: 'email'}); if(data.session) { 
                              const onboardingDone = localStorage.getItem('bdai_onboarding_completed');
                              setView(onboardingDone ? AppView.HOME : AppView.ONBOARDING); 
                          } }} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black lowercase text-[11px] tracking-widest active:scale-95 transition-all shadow-lg">{t('verify')}</button>
                      </div>
                  )}
              </div>

              <div className="absolute bottom-6 left-0 right-0 px-8 flex flex-col items-center">
                <div className="bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,1)] flex flex-col items-center w-full max-w-[220px]">
                    <p className="text-[7px] font-black text-white/60 uppercase tracking-[0.3em] mb-2">{t('selectLang')}</p>
                    <div className="grid grid-cols-5 gap-x-3 gap-y-2 items-center justify-items-center">
                      {LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => handleLangChange(lang.code)} className="transition-all active:scale-90 relative">
                          <FlagIcon code={lang.code} className={`w-3.5 h-3.5 ${user.language === lang.code ? 'ring-1 ring-purple-500 scale-125 z-10 shadow-lg' : 'grayscale opacity-30 hover:opacity-100 hover:grayscale-0'}`} />
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
                          <div className="bg-white/10 px-3 py-1.5 rounded-xl text-[8px] font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}</div>
                      </header>
                      <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{t('welcome')} <br/><span className="text-purple-600/60 block mt-1">{user.username || t('explorer')}.</span></h1>
                      <div className="relative mt-6 flex gap-3">
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySearch(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none font-bold text-xs" />
                          <button onClick={() => handleCitySearch(searchVal)} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg"><i className="fas fa-search text-sm"></i></button>
                      </div>
                      
                      {searchOptions && (
                        <div className="mt-4 space-y-3 bg-slate-900 border-2 border-purple-500/50 p-6 rounded-[2.5rem] shadow-2xl animate-fade-in relative z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">{t('fromArchive')}</span>
                                <button onClick={() => handleCitySearch(searchVal)} className="text-[8px] font-black text-white/40 hover:text-white uppercase tracking-widest underline decoration-purple-500/50 underline-offset-4">{t('searchGlobal')}</button>
                            </div>
                            {searchOptions.map((opt, i) => (
                                <button key={i} onClick={() => processCitySelection(opt)} className="w-full p-5 bg-white/5 rounded-[1.5rem] flex items-center justify-between border border-white/5 hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.isCached ? 'bg-blue-600/20 text-blue-400' : 'bg-purple-600 text-white'}`}>
                                            <i className={`fas ${opt.isCached ? 'fa-database' : 'fa-globe-americas'}`}></i>
                                        </div>
                                        <div className="text-left">
                                            <span className="text-white font-black uppercase text-xs block">{opt.spanishName}</span>
                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{opt.country}</span>
                                        </div>
                                    </div>
                                    <i className="fas fa-chevron-right text-[10px] text-purple-500"></i>
                                </button>
                            ))}
                        </div>
                      )}

                      <TravelServices mode="HOME" language={user.language} onCitySelect={(name: string) => handleCitySearch(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto">
                      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button><h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2></header>
                      <div className="space-y-4 pb-12">
                          {tours.length > 0 ? (
                              tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0); }} language={user.language} />)
                          ) : (
                              <div className="py-20 text-center opacity-40"><i className="fas fa-spinner fa-spin text-2xl mb-4"></i><p className="text-[10px] font-black uppercase tracking-widest">Cargando tours...</p></div>
                          )}
                      </div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language} onBack={() => setView(AppView.CITY_DETAIL)} />}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} />}
                {view === AppView.TOOLS && <div className="pt-safe-iphone px-6 max-w-md mx-auto"><TravelServices mode="HUB" language={user.language} onCitySelect={(name: string) => handleCitySearch(name)} /></div>}
                {view === AppView.PROFILE && <div className="animate-fade-in"><ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => { setUser(u); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={user.language} onLogout={() => { supabase.auth.signOut(); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} /></div>}
                {view === AppView.SHOP && <Shop user={user} onPurchase={() => {}} />}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && view !== AppView.ONBOARDING && (
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
