
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, standardizeCityName, QuotaError } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { AdminPanel } from './components/AdminPanel';
import { 
  supabase, 
  getUserProfileByEmail, 
  getGlobalRanking, 
  syncUserProfile, 
  getCachedTours, 
  saveToursToCache, 
  validateEmailFormat 
} from './services/supabaseClient';

const TRANSLATIONS: Record<string, any> = {
  es: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciudad...", emailPlaceholder: "tu@email.com", userPlaceholder: "usuario", login: "solicitar acceso", tagline: "better destinations by ai", selectLang: "idioma", syncing: "sincronizando...", navElite: "élite", navHub: "intel", navVisa: "pasaporte", navStore: "tienda", analyzing: "analizando...", fastSync: "traduciendo...", loadingTour: "generando masterclass...", apiLimit: "IA Saturada", quotaMsg: "Límite gratuito superado" },
  en: { welcome: "bidaer log:", explorer: "explorer", searchPlaceholder: "city...", emailPlaceholder: "your@email.com", userPlaceholder: "username", login: "request access", tagline: "better destinations by ai", selectLang: "language", syncing: "syncing...", navElite: "elite", navHub: "intel", navVisa: "passport", navStore: "store", analyzing: "analyzing...", fastSync: "syncing...", loadingTour: "generating masterclass...", apiLimit: "AI Busy", quotaMsg: "Free limit exceeded" },
  it: { welcome: "log bidaer:", explorer: "esploratore", searchPlaceholder: "città...", emailPlaceholder: "tua@email.com", userPlaceholder: "utente", login: "richiedi acceso", tagline: "better destinations by ai", selectLang: "lingua", syncing: "sincronizzazione...", navElite: "élite", navHub: "intel", navVisa: "passaporto", navStore: "negozio", analyzing: "analisi...", fastSync: "traduzione...", loadingTour: "generando masterclass...", apiLimit: "IA Satura", quotaMsg: "Limite gratuito superato" },
  fr: { welcome: "log bidaer:", explorer: "explorateur", searchPlaceholder: "ville...", emailPlaceholder: "votre@email.com", userPlaceholder: "utilisateur", login: "demander l'accès", tagline: "better destinations by ai", selectLang: "langue", syncing: "synchronisation...", navElite: "élite", navHub: "intel", navVisa: "passeport", navStore: "boutique", analyzing: "analyse...", fastSync: "traduction...", loadingTour: "génération masterclass...", apiLimit: "IA Saturée", quotaMsg: "Limite gratuite dépassée" },
  de: { welcome: "bidaer-log:", explorer: "entdecker", searchPlaceholder: "stadt...", emailPlaceholder: "ihre@email.com", userPlaceholder: "benutzer", login: "zugang anfordern", tagline: "better destinations by ai", selectLang: "sprache", syncing: "synchronisierung...", navElite: "elite", navHub: "intel", navVisa: "reisepass", navStore: "shop", analyzing: "analyse...", fastSync: "übersetzung...", loadingTour: "generiere masterclass...", apiLimit: "KI ausgelastet", quotaMsg: "Kostenloses Limit überschritten" },
  pt: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "cidade...", emailPlaceholder: "seu@email.com", userPlaceholder: "usuário", login: "solicitar acceso", tagline: "better destinations by ai", selectLang: "idioma", syncing: "sincronizando...", navElite: "elite", navHub: "intel", navVisa: "passaporte", navStore: "loja", analyzing: "analisando...", fastSync: "traduzindo...", loadingTour: "gerando masterclass...", apiLimit: "IA Saturada", quotaMsg: "Limite gratuito excedido" },
  ro: { welcome: "log bidaer:", explorer: "explorator", searchPlaceholder: "oraș...", emailPlaceholder: "email@tau.com", userPlaceholder: "utilizator", login: "solicită acces", tagline: "better destinations by ai", selectLang: "limbă", syncing: "sincronizare...", navElite: "elită", navHub: "intel", navVisa: "pașaport", navStore: "magazin", analyzing: "analiză...", fastSync: "traducere...", loadingTour: "generare masterclass...", apiLimit: "IA Saturată", quotaMsg: "Limita gratuită a fost depășită" },
  ja: { welcome: "bidaer ログ:", explorer: "探検家", searchPlaceholder: "都市名...", emailPlaceholder: "メールアドレス", userPlaceholder: "ユーザー名", login: "アクセスをリクエスト", tagline: "better destinations by ai", selectLang: "言語", syncing: "同期中...", navElite: "エリート", navHub: "インテル", navVisa: "パスポート", navStore: "ショップ", analyzing: "分析中...", fastSync: "翻訳中...", loadingTour: "マスタークラスを生成中...", apiLimit: "AI 混雑中", quotaMsg: "無料枠を超えました" },
  zh: { welcome: "bidaer 日志:", explorer: "探险家", searchPlaceholder: "城市...", emailPlaceholder: "你的邮箱", userPlaceholder: "用户名", login: "请求访问", tagline: "better destinations by ai", selectLang: "语言", syncing: "同期中...", navElite: "精英", navHub: "情报", navVisa: "护照", navStore: "商店", analyzing: "分析中...", fastSync: "翻译中...", loadingTour: "正在生成大师课...", apiLimit: "AI 繁忙", quotaMsg: "超出免费额度" },
  ru: { welcome: "журнал bidaer:", explorer: "исследователь", searchPlaceholder: "город...", emailPlaceholder: "ваш@email.com", userPlaceholder: "пользователь", login: "запросить доступ", tagline: "better destinations by ai", selectLang: "язык", syncing: "синхронизация...", navElite: "элита", navHub: "интел", navVisa: "паспорт", navStore: "магазин", analyzing: "анализ...", fastSync: "перевод...", loadingTour: "генерация мастер-класса...", apiLimit: "IA Satura", quotaMsg: "Бесплатный лимит превышен" },
  tr: { welcome: "bidaer günlüğü:", explorer: "kaşif", searchPlaceholder: "şehir...", emailPlaceholder: "e-postanız", userPlaceholder: "kullanıcı", login: "erişim iste", tagline: "better destinations by ai", selectLang: "dil", syncing: "senkronize ediliyor...", navElite: "elit", navHub: "intel", navVisa: "pasaport", navStore: "mağaza", analyzing: "analiz ediliyor...", fastSync: "çevriliyor...", loadingTour: "masterclass oluşturuluyor...", apiLimit: "IA Satura", quotaMsg: "Ücretsiz limit aşıldı" },
  ar: { welcome: "سجل bidaer:", explorer: "مستكشف", searchPlaceholder: "مدينة...", emailPlaceholder: "بريدك الإلكتروني", userPlaceholder: "اسم المستخدم", login: "طلب الدخول", tagline: "وجهات أفضل بواسطة الذكاء الاصطناعي", selectLang: "اللغة", syncing: "مزامنة...", navElite: "نخبة", navHub: "ذكاء", navVisa: "جواز سفر", navStore: "متجر", analyzing: "تحليل...", fastSync: "ترجمة...", loadingTour: "جاري إنشاء الماستركلاس...", apiLimit: "الذكاء الاصطناعي مشبع", quotaMsg: "تم تجاوز الحد المجاني" },
  hi: { welcome: "bidaer लॉग:", explorer: "खोजकर्ता", searchPlaceholder: "शहर...", emailPlaceholder: "आपका ईमेल", userPlaceholder: "उपयोगकर्ता नाम", login: "पहुँच का अनुरोध करें", tagline: "एआई द्वारा बेहतर गंतव्य", selectLang: "भाषा", syncing: "सिंक हो रहा है...", navElite: "अभिजात वर्ग", navHub: "इंटेल", navVisa: "पासपोर्ट", navStore: "स्टोर", analyzing: "विश्लेषण...", fastSync: "अनुवाद...", loadingTour: "मास्‍टरक्लास बना रहा है...", apiLimit: "एआई व्यस्त", quotaMsg: "मुफ्त सीमा पार हो गई" },
  ko: { welcome: "bidaer 로그:", explorer: "탐험가", searchPlaceholder: "도시...", emailPlaceholder: "이메일 주소", userPlaceholder: "사용자 이름", login: "액세스 요청", tagline: "AI 기반 최고의 여행지", selectLang: "언어", syncing: "동기화 중...", navElite: "엘리트", navHub: "인텔", navVisa: "여권", navStore: "상점", analyzing: "분석 중...", fastSync: "번역 중...", loadingTour: "마스터클래스 생성 중...", apiLimit: "AI 사용량 초과", quotaMsg: "무료 한도 초과" },
  pl: { welcome: "log bidaer:", explorer: "odkrywca", searchPlaceholder: "miasto...", emailPlaceholder: "twój@email.com", userPlaceholder: "użytkownik", login: "poproś o dostęp", tagline: "lepsze cele gracias a AI", selectLang: "język", syncing: "synchronizacja...", navElite: "elita", navHub: "intel", navVisa: "paszport", navStore: "sklep", analyzing: "analizowanie...", fastSync: "tłumaczenie...", loadingTour: "generowanie masterclass...", apiLimit: "AI przeciążone", quotaMsg: "Przekroczono darmowy limit" },
  nl: { welcome: "bidaer log:", explorer: "ontdekkingsreiziger", searchPlaceholder: "stad...", emailPlaceholder: "je@email.com", userPlaceholder: "gebruikersnaam", login: "toegang aanvragen", tagline: "betere bestemmingen door AI", selectLang: "taal", syncing: "synchroniseren...", navElite: "elite", navHub: "intel", navVisa: "paspoort", navStore: "winkel", analyzing: "analyseren...", fastSync: "vertalen...", loadingTour: "masterclass genereren...", apiLimit: "AI Bezet", quotaMsg: "Gratis limiet overschreden" },
  ca: { welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciutat...", emailPlaceholder: "tu@email.com", userPlaceholder: "usuari", login: "sol·licitar accés", tagline: "millors destinacions per IA", selectLang: "idioma", syncing: "sincronitzant...", navElite: "elit", navHub: "intel", navVisa: "passaport", navStore: "botiga", analyzing: "analitzant...", fastSync: "traduint...", loadingTour: "generant masterclass...", apiLimit: "IA Saturada", quotaMsg: "Límit gratuït superat" },
  eu: { welcome: "bidaer log:", explorer: "esploratzailea", searchPlaceholder: "hiria...", emailPlaceholder: "zure@email.com", userPlaceholder: "erabiltzailea", login: "sarbidea eskatu", tagline: "helmuga hobeak AI bidez", selectLang: "hizkuntza", syncing: "sinkronizatzen...", navElite: "elitea", navHub: "intel", navVisa: "pasaportea", navStore: "denda", analyzing: "analizatzen...", fastSync: "itzultzen...", loadingTour: "masterclassa sortzen...", apiLimit: "AI Saturatuta", quotaMsg: "Doako muga gaindituta" },
  vi: { welcome: "nhật ký bidaer:", explorer: "nhà thám hiểm", searchPlaceholder: "thành phố...", emailPlaceholder: "email của bạn", userPlaceholder: "tên người dùng", login: "yêu cầu truy cập", tagline: "điểm đến tốt hơn nhờ AI", selectLang: "ngôn ngữ", syncing: "đang đồng bộ...", navElite: "tinh hoa", navHub: "thông tin", navVisa: "hộ chiếu", navStore: "cửa hàng", analyzing: "đang phân tích...", fastSync: "đang dịch...", loadingTour: "đang tạo lớp học...", apiLimit: "AI Bận", quotaMsg: "Vượt quá giới hạn miễn phí" },
  th: { welcome: "บันทึก bidaer:", explorer: "นักสำรวจ", searchPlaceholder: "เมือง...", emailPlaceholder: "อีเมลของคุณ", userPlaceholder: "ชื่อผู้ใช้", login: "ขอเข้าถึง", tagline: "จุดหมายปลายทางที่ดีกว่าโดย AI", selectLang: "ภาษา", syncing: "กำลังซิงค์...", navElite: "อีลิท", navHub: "อินเทล", navVisa: "พาสปอร์ต", navStore: "ร้านค้า", analyzing: "กำลังวิเคราะห์...", fastSync: "กำลังแปล...", loadingTour: "กำลังสร้างมาสเตอร์คลาส...", apiLimit: "AI หนาแน่น", quotaMsg: "เกินขีดจำกัดฟรี" }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
  email: '', language: 'es', miles: 0, rank: 'Turist', 
  culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0,
  interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, 
  stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 }, 
  visitedCities: [], completedTours: [], badges: [], stamps: [], capturedMoments: []
};

const LangCircle: React.FC<{ code: string; label: string; isActive: boolean; onClick: () => void }> = ({ code, label, isActive, onClick }) => (
    <button 
      onClick={onClick} 
      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-90 shrink-0 ${isActive ? 'bg-purple-600 border-purple-400 text-white font-black scale-110 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 font-bold hover:bg-white/10'}`}
    >
        <span className="text-[9px] uppercase tracking-tighter">{label}</span>
    </button>
);

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-purple-500 scale-105' : 'text-slate-500 opacity-40'}`}
  >
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[7px] font-black uppercase tracking-widest text-center truncate w-full">{label}</span>
  </button>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isSyncingLang, setIsSyncingLang] = useState(false);
  const [searchOptions, setSearchOptions] = useState<any[] | null>(null);
  const [user, setUser] = useState<UserProfile>(GUEST_PROFILE);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const t = useCallback((key: string) => {
    const dict = TRANSLATIONS[user.language] || TRANSLATIONS['en'];
    return dict[key] || TRANSLATIONS['en'][key] || key;
  }, [user.language]);

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const saved = localStorage.getItem('bdai_profile');
            if (saved) {
              const parsed = JSON.parse(saved);
              setUser(prev => ({ ...prev, ...parsed, isLoggedIn: true }));
              setView(AppView.HOME);
              
              if (parsed.email) {
                  const freshProfile = await getUserProfileByEmail(parsed.email);
                  if (freshProfile) {
                      setUser(prev => ({ ...prev, ...freshProfile, isLoggedIn: true }));
                      localStorage.setItem('bdai_profile', JSON.stringify({ ...freshProfile, isLoggedIn: true }));
                  }
              }
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await getUserProfileByEmail(session.user.email || '');
                if (profile) {
                  setUser({ ...profile, isLoggedIn: true });
                  localStorage.setItem('bdai_profile', JSON.stringify({ ...profile, isLoggedIn: true }));
                  setView(AppView.HOME);
                }
            }
        } catch (e) { console.error("Auth error", e); } finally { setIsVerifyingSession(false); }
    };
    checkAuth();
    getGlobalRanking().then(setLeaderboard);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            setUserLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            });
        },
        (err) => console.error("GPS Sensor Error:", err),
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const processCitySelection = async (official: {name: string, localizedName: string, spanishName: string, country: string}, langCode: string) => {
    setIsLoading(true); 
    setSearchOptions(null); 
    setSelectedCity(official.localizedName || official.spanishName); 
    try {
        setTours([]);
        const cached = await getCachedTours(official.spanishName, official.country, langCode);
        if (cached && cached.data.length > 0) {
            setTours(cached.data); 
            setView(AppView.CITY_DETAIL);
            return;
        }
        
        setLoadingMessage(TRANSLATIONS[langCode]?.loadingTour || t('loadingTour'));
        const generated = await generateToursForCity(official.spanishName, official.country, { ...user, language: langCode } as UserProfile);
        if (generated.length > 0) {
            setTours(generated); 
            await saveToursToCache(official.spanishName, official.country, langCode, generated);
            setView(AppView.CITY_DETAIL);
        }
    } catch (e) { alert(t('apiLimit')); } finally { setIsLoading(false); }
  };

  const handleLangChange = (code: string) => {
      setIsSyncingLang(true);
      const updatedUser = { ...user, language: code };
      setUser(updatedUser);
      localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
      if (user.isLoggedIn) syncUserProfile(updatedUser);
      
      setTours([]);
      if (selectedCity && (view === AppView.CITY_DETAIL || view === AppView.TOUR_ACTIVE)) {
          handleCitySearch(selectedCity);
      }
      
      setTimeout(() => setIsSyncingLang(false), 500);
  };

  const handleLogin = async () => {
    if (!validateEmailFormat(email)) { alert("Email inválido."); return; }
    setIsLoading(true);
    setLoadingMessage(t('syncing'));
    try {
      const profile = await getUserProfileByEmail(email);
      let activeUser: UserProfile;
      if (profile) { 
          activeUser = { ...profile, isLoggedIn: true }; 
      }
      else {
        activeUser = { ...GUEST_PROFILE, email, username: username || email.split('@')[0], isLoggedIn: true, id: `u_${Date.now()}` };
        await syncUserProfile(activeUser);
      }
      setUser(activeUser);
      localStorage.setItem('bdai_profile', JSON.stringify(activeUser));
      setView(AppView.HOME);
    } catch (e) { alert("Error."); } finally { setIsLoading(false); }
  };

  const handleCitySearch = async (cityInput: string) => {
    if (!cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));
    try {
        const results = await standardizeCityName(cityInput, user.language);
        if (results && results.length > 0) { setSearchOptions(results); }
        else { await processCitySelection({ name: cityInput, localizedName: cityInput, spanishName: cityInput, country: "" }, user.language); }
    } catch (e) { await processCitySelection({ name: cityInput, localizedName: cityInput, spanishName: cityInput, country: "" }, user.language); } finally { setIsLoading(false); }
  };

  const updateUserAndSync = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
    if (updatedUser.isLoggedIn) {
      syncUserProfile(updatedUser);
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center">
        <BdaiLogo className="w-16 h-16 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-transparent flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {(isLoading || isSyncingLang) && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-fade-in">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-black uppercase text-[10px] tracking-[0.4em] text-center animate-pulse">
              {isSyncingLang ? (TRANSLATIONS[user.language]?.fastSync || t('syncing')) : loadingMessage}
            </p>
        </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617]">
              <div className="text-center flex flex-col items-center mb-10 mt-[-10dvh] animate-fade-in">
                  <BdaiLogo className="w-44 h-44 animate-pulse-logo" />
                  <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 -mt-8">bdai</h1>
                  <p className="text-[10px] font-black lowercase tracking-[0.3em] text-purple-500 mt-2 uppercase">{t('tagline')}</p>
              </div>
              
              <div className="w-full max-w-[240px] mt-2 space-y-2">
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-center text-white outline-none text-[10px] font-medium placeholder-slate-700 shadow-inner focus:border-purple-500/30 transition-all" placeholder={t('userPlaceholder')} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-center text-white outline-none text-[10px] font-medium placeholder-slate-700 shadow-inner focus:border-purple-500/30 transition-all" placeholder={t('emailPlaceholder')} />
                  <button onClick={handleLogin} className="w-full mt-4 h-12 bg-white text-slate-950 rounded-xl font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
                    {t('login')}
                  </button>
              </div>

              <div className="absolute bottom-12 left-0 right-0 px-8 flex flex-col items-center gap-4">
                <p className="text-[7px] font-black uppercase tracking-[0.4em] text-white/20">{t('selectLang')}</p>
                <div className="w-full max-w-full overflow-x-auto no-scrollbar flex gap-2 px-6 py-4 bg-white/[0.02] rounded-full border border-white/[0.05]">
                    {LANGUAGES.map(lang => (
                        <LangCircle key={lang.code} label={lang.name} code={lang.code} isActive={user.language === lang.code} onClick={() => handleLangChange(lang.code)} />
                    ))}
                </div>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-36'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-6 pt-safe-iphone max-w-md mx-auto animate-fade-in">
                      <header className="flex justify-between items-center py-4 px-6">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-8 h-8"/><span className="font-black text-xl tracking-tighter">bdai</span></div>
                          <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-2 shadow-lg border border-white/5"><i className="fas fa-coins text-yellow-500"></i>{user.miles.toLocaleString()}</div>
                      </header>
                      <div className="py-2 px-6">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                            {t('welcome')} <br/>
                            <span className="text-purple-600/60 block mt-1">{user.name || user.username || t('explorer')}.</span>
                        </h1>
                      </div>
                      <div className="relative mt-2 flex gap-3 px-6">
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySearch(searchVal)} placeholder={t('searchPlaceholder')} className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-bold text-sm shadow-inner" />
                          <button onClick={() => handleCitySearch(searchVal)} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg active:scale-95 transition-all"><i className="fas fa-search text-sm"></i></button>
                      </div>
                      {searchOptions && (
                        <div className="mx-6 mt-4 space-y-3 bg-slate-900/95 backdrop-blur-3xl border border-purple-500/20 p-6 rounded-[2.5rem] shadow-2xl animate-slide-up relative z-[1001]">
                            {searchOptions.map((opt, i) => (
                                <button key={i} onClick={() => processCitySelection(opt, user.language)} className="w-full p-4 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5 active:bg-purple-600/20 transition-all">
                                    <div className="flex items-center gap-4 text-left text-white">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-map-marker-alt text-purple-500 text-sm"></i></div>
                                        <div className="min-w-0"><span className="text-white font-black uppercase text-xs block truncate">{opt.localizedName || opt.spanishName}</span><span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{opt.country}</span></div>
                                    </div>
                                    <i className="fas fa-chevron-right text-purple-500 text-[10px]"></i>
                                </button>
                            ))}
                        </div>
                      )}
                      <TravelServices mode="HOME" language={user.language} onCitySelect={(name: string) => handleCitySearch(name)} />
                  </div>
                )}
                
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto animate-fade-in">
                      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20">
                        <button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button>
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2>
                      </header>
                      <div className="space-y-6 pb-12">
                          {tours.map(tour => (
                            <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0); }} language={user.language} />
                          ))}
                      </div>
                  </div>
                )}
                
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => updateUserAndSync(u)} language={user.language} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />
                )}
                
                {view === AppView.LEADERBOARD && <div className="max-w-md mx-auto h-full"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} /></div>}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { setView(AppView.LOGIN); localStorage.removeItem('bdai_profile'); }} onOpenAdmin={() => setView(AppView.ADMIN)} onLangChange={handleLangChange} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={() => {}} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language} onCitySelect={(name: string) => handleCitySearch(name)} />}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>

            {view !== AppView.TOUR_ACTIVE && view !== AppView.ADMIN && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-6 flex justify-center pointer-events-none">
                <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/5 px-2 py-4 flex justify-around items-center w-full max-w-sm rounded-[2.5rem] pointer-events-auto shadow-2xl">
                    <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                    <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                    <button onClick={() => setView(AppView.HOME)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg shadow-purple-500/40' : 'bg-white/5 border border-white/5'}`}><BdaiLogo className="w-7 h-7" /></button>
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
