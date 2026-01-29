
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
import { supabase, getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, getCachedTours, saveToursToCache, validateEmailFormat } from './services/supabaseClient';

const TRANSLATIONS: Record<string, any> = {
  en: { welcome: "Bidaer Log:", explorer: "Explorer", searchPlaceholder: "Target city...", emailPlaceholder: "Email address", login: "Send Code", verify: "Authenticate", tagline: "better destinations by ai", authError: "AI Latency. Try again.", selectLang: "Language", loading: "Syncing...", analyzing: "Locating...", generating: "Generating...", translating: "Translating...", navElite: "Elite", navHub: "Intel", navVisa: "Passport", navStore: "Store", sendingTo: "Sending to:" },
  es: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciudad objetivo...", emailPlaceholder: "Email", login: "Enviar Código", verify: "Acceder", tagline: "better destinations by ai", authError: "Latencia de IA. Reintenta.", selectLang: "Idioma", loading: "Sincronizando...", analyzing: "Localizando...", generating: "Generando...", translating: "Traduciendo...", navElite: "Élite", navHub: "Intel", navVisa: "Pasaporte", navStore: "Tienda", sendingTo: "Enviando a:" },
  de: { welcome: "Bidaer Log:", explorer: "Entdecker", searchPlaceholder: "Zielstadt...", emailPlaceholder: "E-Mail", login: "Code senden", verify: "Anmelden", tagline: "Bessere Ziele durch KI", authError: "KI-Fehler. Erneut versuchen.", selectLang: "Sprache", loading: "Synchronisieren...", analyzing: "Suche...", generating: "Erstellen...", translating: "Übersetzen...", navElite: "Elite", navHub: "Intel", navVisa: "Reisepass", navStore: "Shop", sendingTo: "Senden an:" },
  ca: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciutat objectiu...", emailPlaceholder: "Correu", login: "Enviar Codi", verify: "Accedir", tagline: "millors destins amb IA", authError: "Error de IA. Reintenta.", selectLang: "Idioma", loading: "Sincronitzant...", analyzing: "Localitzant...", generating: "Generant...", translating: "Traduint...", navElite: "Elit", navHub: "Intel", navVisa: "Passaport", navStore: "Botiga", sendingTo: "Enviant a:" },
  eu: { welcome: "Bidaer Loga:", explorer: "Esploratzailea", searchPlaceholder: "Helburuko hiria...", emailPlaceholder: "Posta", login: "Bidali Kodea", verify: "Sartu", tagline: "helmuga hobeak AIarekin", authError: "AI akatsa. Saiatu berriro.", selectLang: "Hizkuntza", loading: "Sinkronizatzen...", analyzing: "Lokalizatzen...", generating: "Sortzen...", translating: "Itzultzen...", navElite: "Elite", navHub: "Intel", navVisa: "Pasaportea", navStore: "Denda", sendingTo: "Bidaltzen hona:" },
  pt: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Cidade alvo...", emailPlaceholder: "Email", login: "Enviar Código", verify: "Aceder", tagline: "melhores destinos por IA", authError: "Erro de IA.", selectLang: "Idioma", loading: "Sincronizando...", analyzing: "Localizando...", generating: "Gerando...", translating: "Traduzindo...", navElite: "Elite", navHub: "Intel", navVisa: "Passaporte", navStore: "Loja", sendingTo: "Enviando para:" },
  it: { welcome: "Log Bidaer:", explorer: "Esploratore", searchPlaceholder: "Città...", emailPlaceholder: "Email", login: "Invia Codice", verify: "Accedi", tagline: "migliori destinazioni", authError: "Errore AI.", selectLang: "Lingua", loading: "Sincronizzazione...", analyzing: "Ricerca...", generating: "Generazione...", translating: "Traduzione...", navElite: "Elite", navHub: "Intel", navVisa: "Passaporto", navStore: "Store", sendingTo: "Inviando a:" },
  fr: { welcome: "Log Bidaer:", explorer: "Explorateur", searchPlaceholder: "Ville...", emailPlaceholder: "Email", login: "Envoyer le code", verify: "Accéder", tagline: "meilleures destinations", authError: "Erreur IA.", selectLang: "Langue", loading: "Sync...", analyzing: "Localisation...", generating: "Génération...", translating: "Traduction...", navElite: "Élite", navHub: "Intel", navVisa: "Passeport", navStore: "Store", sendingTo: "Envoi à :" },
  ru: { welcome: "Лог Bidaer:", explorer: "Исследователь", searchPlaceholder: "Город...", emailPlaceholder: "Электронная почта", login: "Отправить код", verify: "Войти", tagline: "лучшие места с ИИ", authError: "Ошибка ИИ.", selectLang: "Язык", loading: "Синхронизация...", analyzing: "Поиск...", generating: "Создание...", translating: "Перевод...", navElite: "Элита", navHub: "Инфо", navVisa: "Паспорт", navStore: "Магазин", sendingTo: "Отправка на:" },
  hi: { welcome: "बिडर लॉग:", explorer: "खोजकर्ता", searchPlaceholder: "लक्ष्य शहर...", emailPlaceholder: "ईमेल", login: "कोड भेजें", verify: "प्रमाणित करें", tagline: "AI द्वारा बेहतर गंतव्य", authError: "AI विलंब।", selectLang: "भाषा", loading: "सिंक हो रहा है...", analyzing: "ढूंढ रहे हैं...", generating: "बना रहे हैं...", translating: "अनुवाद कर रहे हैं...", navElite: "एलीट", navHub: "इंटेल", navVisa: "पासपोर्ट", navStore: "स्टोर", sendingTo: "भेज रहे हैं:" },
  ja: { welcome: "ビデアーログ:", explorer: "探検家", searchPlaceholder: "対象都市...", emailPlaceholder: "メール", login: "送信", verify: "認証", tagline: "AIによる目的地", authError: "AIエラー", selectLang: "言語", loading: "同期中...", analyzing: "解析中...", generating: "生成中...", translating: "翻訳中...", navElite: "エリート", navHub: "情報", navVisa: "パスポート", navStore: "ストア", sendingTo: "送信先:" },
  zh: { welcome: "Bidaer 日志:", explorer: "探险家", searchPlaceholder: "目标城市...", emailPlaceholder: "电子邮件", login: "发送代码", verify: "验证", tagline: "AI 打造更好目的地", authError: "AI 延迟", selectLang: "语言", loading: "同步中...", analyzing: "分析中...", generating: "生成中...", translating: "翻译中...", navElite: "精英", navHub: "情报", navVisa: "护照", navStore: "商店", sendingTo: "发送至:" }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, visitedCities: [], completedTours: [], badges: []
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [loginStep, setLoginStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchOptions, setSearchOptions] = useState<{name: string, spanishName: string, country: string}[] | null>(null);
  
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    return GUEST_PROFILE;
  });

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  const t = (key: string) => {
    const dict = TRANSLATIONS[user.language] || TRANSLATIONS['es'];
    return dict[key] || TRANSLATIONS['es'][key] || key;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            getUserProfileByEmail(session.user.email || '').then(profile => {
                setUser({ ...(profile || user), id: session.user.id, email: session.user.email!, isLoggedIn: true });
                setView(AppView.HOME);
            });
        }
        setIsVerifyingSession(false);
    });
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
  };

  const processCitySelection = async (officialNames: {name: string, spanishName: string, country: string}) => {
    setIsLoading(true); 
    setSearchOptions(null); 
    setAuthError(null);
    setLoadingMessage(t('analyzing'));
    const targetLang = user.language || 'es';
    
    try {
        setSelectedCity(officialNames.spanishName); 
        const cached = await getCachedTours(officialNames.spanishName, officialNames.country, targetLang);
        
        if (cached) {
            if (cached.langFound === targetLang) {
                setTours(cached.data); setView(AppView.CITY_DETAIL);
                setIsLoading(false); return;
            } else {
                setLoadingMessage(t('translating'));
                const translated = await translateTours(cached.data, targetLang);
                setTours(translated);
                setView(AppView.CITY_DETAIL);
                setIsLoading(false); return;
            }
        }

        setLoadingMessage(t('generating'));
        const generated = await generateToursForCity(officialNames.spanishName, officialNames.country, user);
        setTours(generated); 
        setView(AppView.CITY_DETAIL);
    } catch (e: any) { 
        setAuthError(t('authError')); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleCitySelect = async (cityInput: string) => {
    if (!cityInput.trim() || isLoading) return;
    setAuthError(null);
    setIsLoading(true);
    setLoadingMessage(t('analyzing'));

    try {
        const results = await standardizeCityName(cityInput);
        if (results && results.length > 1) {
            setSearchOptions(results);
            setIsLoading(false);
        } else if (results && results.length === 1) {
            await processCitySelection(results[0]);
        } else {
            await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
        }
    } catch (e: any) {
        await processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
    }
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center"><BdaiLogo className="w-24 h-24 mb-6 animate-pulse" /></div>;

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 flex flex-col items-center justify-center p-10 backdrop-blur-3xl">
          <BdaiLogo className="w-16 h-16 animate-pulse mb-8" />
          <p className="text-white font-black uppercase text-[11px] tracking-[0.5em] text-center">{loadingMessage || t('loading')}</p>
        </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-between p-8 py-safe-iphone bg-[#020617]">
              <div className="text-center pt-12">
                  <BdaiLogo className="w-24 h-24 mx-auto mb-6 animate-pulse-logo" />
                  <h1 className="text-4xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mt-2">{t('tagline')}</p>
              </div>

              <div className="w-full max-w-sm space-y-8">
                  <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-[1px] flex-1 bg-white/10"></div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('selectLang')}</span>
                        <div className="h-[1px] flex-1 bg-white/10"></div>
                      </div>
                      <div className="flex overflow-x-auto no-scrollbar gap-3 px-2 py-2">
                        {LANGUAGES.map(lang => (
                            <button key={lang.code} onClick={() => handleUpdateUser({...user, language: lang.code})} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${user.language === lang.code ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 grayscale'}`}>
                                <FlagIcon code={lang.code} className="w-5 h-5" />
                                <span className="text-[9px] font-black uppercase whitespace-nowrap">{lang.name}</span>
                            </button>
                        ))}
                      </div>
                  </div>
                  
                  <div className="w-full space-y-4 max-w-xs mx-auto">
                      {authError && <div className="text-red-400 text-[8px] font-black uppercase text-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{authError}</div>}
                      <input type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-2xl py-5 px-6 text-center text-white outline-none font-bold" />
                      <button onClick={handleCitySelect.bind(null, searchVal)} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">{t('login')}</button>
                  </div>
              </div>
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
                      
                      <div className="relative mt-8 flex flex-col gap-3">
                          <div className="flex gap-3">
                              <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-16 text-white outline-none font-bold" />
                              <button onClick={() => handleCitySelect(searchVal)} className="w-16 h-16 rounded-[2rem] bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-all"><i className="fas fa-search"></i></button>
                          </div>
                          {searchOptions && (
                              <div className="mt-2 space-y-3 bg-slate-900 border border-purple-500/30 p-4 rounded-[2.5rem] shadow-2xl max-h-64 overflow-y-auto z-[50]">
                                  {searchOptions.map((opt: any, i: number) => (
                                      <button key={i} onClick={() => processCitySelection(opt)} className="w-full p-6 bg-white/5 hover:bg-purple-600 border border-white/5 rounded-3xl flex items-center justify-between group transition-all">
                                          <div className="text-left"><span className="text-white font-black uppercase text-sm block">{opt.spanishName}</span><span className="text-[9px] text-slate-500 group-hover:text-purple-200 font-bold uppercase">{opt.country}</span></div>
                                          <i className="fas fa-chevron-right text-slate-700 group-hover:text-white"></i>
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>
                      <TravelServices mode="HOME" language={user.language} onCitySelect={(name) => handleCitySelect(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6">
                      <header className="flex items-center gap-4 mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left"></i></button><h2 className="text-3xl font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2></header>
                      <div className="space-y-6 pb-12">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language} />)}</div>
                      <CommunityBoard city={selectedCity} language={user.language} user={user} />
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={handleUpdateUser} language={user.language} onBack={() => setView(AppView.CITY_DETAIL)} />}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language} onCitySelect={(name) => handleCitySelect(name)} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={(reward) => handleUpdateUser({...user, miles: user.miles + reward})} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language} onUpdateUser={handleUpdateUser} onLogout={() => { localStorage.removeItem('bdai_profile'); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
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

function NavButton({ icon, label, isActive, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-purple-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
      <i className={`fas ${icon} text-lg`}></i>
      <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
