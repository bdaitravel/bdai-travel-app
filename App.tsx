
import React, { useState, useEffect, useMemo } from 'react';
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
import { supabase, getUserProfileByEmail, getGlobalRanking, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat } from './services/supabaseClient';

const TRANSLATIONS: any = {
  es: { step1: "1. elige idioma", step2: "2. elige nombre de usuario", step3: "3. registra tu email", welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciudad...", emailPlaceholder: "tu@email.com", userPlaceholder: "usuario", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", authError: "email no válido", codeError: "8 dígitos", loading: "sincronizando...", navElite: "élite", navHub: "intel", navVisa: "pasaporte", navStore: "tienda", changeEmail: "corregir email", sentTo: "enviado a", results: "resultados" },
  en: { step1: "1. choose language", step2: "2. choose username", step3: "3. register your email", welcome: "bidaer log:", explorer: "explorer", searchPlaceholder: "city...", emailPlaceholder: "your@email.com", userPlaceholder: "username", login: "request access", verify: "validate", tagline: "better destinations by ai", authError: "invalid email", codeError: "8 digits", loading: "syncing...", navElite: "elite", navHub: "intel", navVisa: "passport", navStore: "store", changeEmail: "change email", sentTo: "sent to", results: "results" },
  it: { step1: "1. scegli la lingua", step2: "2. scegli il nome utente", step3: "3. registra la tua email", welcome: "log bidaer:", explorer: "esploratore", searchPlaceholder: "città...", emailPlaceholder: "tua@email.com", userPlaceholder: "nome utente", login: "richiedi accesso", verify: "valida", tagline: "better destinations by ai", authError: "email non valida", codeError: "8 cifre", loading: "sincronizzazione...", navElite: "élite", navHub: "intel", navVisa: "passaporto", navStore: "tienda", changeEmail: "correggi email", sentTo: "inviato a", results: "risultati" },
  zh: { step1: "1. 选择语言", step2: "2. 选择用户名", step3: "3. 注册电子邮件", welcome: "bidaer 日志:", explorer: "探险家", searchPlaceholder: "城市...", emailPlaceholder: "你的@email.com", userPlaceholder: "用户名", login: "请求访问", verify: "验证", tagline: "better destinations by ai", sentTo: "已发送至", results: "结果", changeEmail: "更改电子邮件" },
  ca: { step1: "1. tria idioma", step2: "2. tria nom d'usuari", step3: "3. registra el teu email", welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "ciutat...", emailPlaceholder: "teu@email.com", userPlaceholder: "usuari", login: "sol·licitar accés", verify: "validar", tagline: "better destinations by ai", sentTo: "enviat a", results: "resultats", changeEmail: "corregir email" },
  eu: { step1: "1. hizkuntza aukeratu", step2: "2. erabiltzaile izena aukeratu", step3: "3. zure emaila erregistratu", welcome: "bidaer log:", explorer: "esploratzailea", searchPlaceholder: "hiria...", emailPlaceholder: "zure@email.com", userPlaceholder: "erabiltzailea", login: "sarbidea eskatu", verify: "egiaztatu", tagline: "better destinations by ai", sentTo: "hona bidalia", results: "emaitzak", changeEmail: "emaila zuzendu" },
  pt: { step1: "1. escolha o idioma", step2: "2. escolha o nome de usuário", step3: "3. registre seu e-mail", welcome: "log bidaer:", explorer: "explorador", searchPlaceholder: "cidade...", emailPlaceholder: "seu@email.com", userPlaceholder: "usuário", login: "solicitar acceso", verify: "validar", tagline: "better destinations by ai", sentTo: "enviado para", results: "resultados", changeEmail: "corrigir e-mail" },
  fr: { step1: "1. choisissez la langue", step2: "2. choisissez un nom d'utilisateur", step3: "3. enregistrez votre e-mail", welcome: "log bidaer:", explorer: "explorateur", searchPlaceholder: "ville...", emailPlaceholder: "votre@email.com", userPlaceholder: "nom d'utilisateur", login: "demander l'accès", verify: "valider", tagline: "better destinations by ai", sentTo: "envoyé à", results: "résultats", changeEmail: "corriger l'e-mail" },
  de: { step1: "1. Sprache wählen", step2: "2. Benutzernamen wählen", step3: "3. E-Mail registrieren", welcome: "bidaer log:", explorer: "entdecker", searchPlaceholder: "stadt...", emailPlaceholder: "deine@email.com", userPlaceholder: "benutzername", login: "zugang anfordern", verify: "bestätigen", tagline: "better destinations by ai", sentTo: "gesendet an", results: "ergebnisse", changeEmail: "E-Mail korrigieren" },
  ja: { step1: "1. 言語を選択", step2: "2. ユーザー名を選択", step3: "3. メールを登録", welcome: "bidaer ログ:", explorer: "探検家", searchPlaceholder: "都市...", emailPlaceholder: "メール...", userPlaceholder: "ユーザー名", login: "アクセスをリクエスト", verify: "確認", tagline: "better destinations by ai", sentTo: "送信先", results: "結果", changeEmail: "メールを修正" },
  ru: { step1: "1. выберите язык", step2: "2. выберите имя пользователя", step3: "3. зарегистрируйте свой email", welcome: "bidaer лог:", explorer: "исследователь", searchPlaceholder: "город...", emailPlaceholder: "ваш@email.com", userPlaceholder: "имя пользователя", login: "запросить доступ", verify: "подтвердить", tagline: "better destinations by ai", sentTo: "отправлено на", results: "результаты", changeEmail: "исправить email" },
  hi: { step1: "1. भाषा चुनें", step2: "2. उपयोगकर्ता नाम चुनें", step3: "3. अपना ईमेल पंजीकृत करें", welcome: "bidaer लॉग:", explorer: "खोजकर्ता", searchPlaceholder: "शहर...", emailPlaceholder: "आपका@email.com", userPlaceholder: "उपयोगकर्ता", login: "पहुँच का अनुरोध", verify: "सत्यापित", tagline: "better destinations by ai", sentTo: "को भेजा गया", results: "परिणाम", changeEmail: "ईमेल सुधारें" },
  ko: { step1: "1. 언어 선택", step2: "2. 사용자 이름 선택", step3: "3. 이메일 등록", welcome: "bidaer 로그:", explorer: "탐험가", searchPlaceholder: "도시...", emailPlaceholder: "이메일...", userPlaceholder: "사용자 이름", login: "액세스 요청", verify: "확인", tagline: "better destinations by ai", sentTo: "보낸 사람", results: "결과", changeEmail: "이메일 수정" },
  tr: { step1: "1. dili seçin", step2: "2. kullanıcı adını seçin", step3: "3. e-postanızı kaydedin", welcome: "bidaer günlüğü:", explorer: "gezgin", searchPlaceholder: "şehir...", emailPlaceholder: "eposta...", userPlaceholder: "kullanıcı adı", login: "erişim iste", verify: "doğrula", tagline: "better destinations by ai", sentTo: "gönderildi", results: "sonuçlar", changeEmail: "epostayı düzelt" },
  ar: { step1: "1. اختر اللغة", step2: "2. اختر اسم المستخدم", step3: "3. سجل بريدك الإلكتروني", welcome: "سجل بيداير:", explorer: "مستكشف", searchPlaceholder: "مدينة...", emailPlaceholder: "بريدك...", userPlaceholder: "اسم المستخدم", login: "طلب الدخول", verify: "تحقق", tagline: "better destinations by ai", sentTo: "أرسلت إلى", results: "نتائج", changeEmail: "تعديل البريد" }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, visitedCities: [], completedTours: [], badges: [], stamps: []
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
  const [user, setUser] = useState<UserProfile>(GUEST_PROFILE);
  const [currentLanguage, setCurrentLanguage] = useState<string>('es');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setCurrentLanguage(parsed.language || 'es');
    }
    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const profile = await getUserProfileByEmail(session.user.email || '');
                const lang = profile?.language || user.language || 'es';
                const newUser = { ...(profile || GUEST_PROFILE), id: session.user.id, email: session.user.email, isLoggedIn: true, language: lang };
                setUser(newUser as any);
                setCurrentLanguage(lang);
                setView(AppView.HOME);
            }
        } catch (e) {} finally { setIsVerifyingSession(false); }
    };
    checkAuth();
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const t = useMemo(() => (key: string) => {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS['es'];
    return dict[key] || TRANSLATIONS['es'][key] || key;
  }, [currentLanguage]);

  const handleCitySearch = async (cityInput: string) => {
    if (!cityInput || !cityInput.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(t('loading'));
    try {
        const results = await standardizeCityName(cityInput);
        if (results && results.length > 0) {
            setSearchOptions(results);
            setIsLoading(false);
            return;
        }
        processCitySelection({ name: cityInput, spanishName: cityInput, country: "" });
    } catch (e) { processCitySelection({ name: cityInput, spanishName: cityInput, country: "" }); }
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string}) => {
    setIsLoading(true);
    setSearchOptions(null);
    setSelectedCity(official.spanishName);
    try {
        const cached = await getCachedTours(official.spanishName, official.country, currentLanguage);
        if (cached && cached.data && cached.data.length > 0) {
            setTours(cached.data);
            setView(AppView.CITY_DETAIL);
            setIsLoading(false);
            return;
        }
        setLoadingMessage(t('loading'));
        const generated = await generateToursForCity(official.spanishName, official.country, user);
        if (generated && generated.length > 0) {
            setTours(generated);
            await saveToursToCache(official.spanishName, official.country, currentLanguage, generated);
            setView(AppView.CITY_DETAIL);
        } else {
            setView(AppView.HOME);
        }
    } catch (e) { setView(AppView.HOME); } finally { setIsLoading(false); }
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
              const newUser = { ...(profile || GUEST_PROFILE), id: session.user.id, email, username: username || 'explorer', isLoggedIn: true, language: currentLanguage };
              setUser(newUser as any);
              localStorage.setItem('bdai_profile', JSON.stringify(newUser));
              await syncUserProfile(newUser as any);
              setShowOnboarding(true);
          }
      } catch (e: any) { alert(e.message); } finally { setIsLoading(false); }
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
          <div className="h-full w-full flex flex-col items-center p-6 relative bg-[#020617] overflow-y-auto no-scrollbar">
              {/* BRAND AREA - LOGO XL, PULSING, REST MINIMAL */}
              <div className="text-center animate-fade-in flex flex-col items-center mb-10 mt-10">
                  <BdaiLogo className="w-36 h-36 animate-pulse-logo" />
                  <h1 className="text-5xl font-black lowercase tracking-[-0.05em] text-white/95 -mt-2">bdai</h1>
                  <p className="text-[7px] font-black lowercase tracking-[0.2em] text-purple-500/80 -mt-1 opacity-60 uppercase">{t('tagline')}</p>
              </div>

              {/* INPUTS AREA - FINE AND HIGH CONTRAST */}
              <div className="w-full max-w-[260px] space-y-3 mb-12">
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-3 animate-fade-in">
                          <div className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden group focus-within:border-purple-500/50 transition-all">
                            <span className="absolute left-4 top-1.5 text-[6px] font-black text-white uppercase tracking-[0.2em] pointer-events-none">
                                {t('step2')}
                            </span>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-transparent pt-5 pb-2 px-4 text-left text-white outline-none text-xs font-bold placeholder-slate-700 transition-all" placeholder={t('userPlaceholder')} />
                          </div>
                          
                          <div className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden group focus-within:border-purple-500/50 transition-all">
                            <span className="absolute left-4 top-1.5 text-[6px] font-black text-white uppercase tracking-[0.2em] pointer-events-none">
                                {t('step3')}
                            </span>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent pt-5 pb-2 px-4 text-left text-white outline-none text-xs font-bold placeholder-slate-700 transition-all" placeholder={t('emailPlaceholder')} />
                          </div>
                          
                          <button onClick={handleLoginRequest} className="w-full py-2.5 bg-white text-slate-950 rounded-lg font-black lowercase text-[9px] tracking-widest active:scale-95 transition-all shadow-xl shadow-white/5 border border-white/10">
                            {t('login')}
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-6 text-center animate-fade-in">
                          <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                            <p className="text-[7px] font-black text-white/50 uppercase tracking-widest mb-1">{t('sentTo')}</p>
                            <p className="text-purple-400 font-black lowercase text-xs mb-3">{email}</p>
                            <button onClick={() => setLoginStep('EMAIL')} className="text-[7px] text-white/30 uppercase font-black tracking-widest border border-white/10 px-3 py-1 rounded-full active:scale-90 transition-all">{t('changeEmail')}</button>
                          </div>
                          <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-transparent border-b border-purple-500/30 py-2 text-center font-black text-3xl text-white outline-none tracking-[0.2em]" placeholder="0000" />
                          <button onClick={handleVerifyCode} className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-black lowercase text-[9px] tracking-widest active:scale-95 transition-all">
                            {t('verify')}
                          </button>
                      </div>
                  )}
              </div>

              {/* STEP 1 - LANGUAGE SELECTOR AT BOTTOM, TEXT RIGHT ABOVE FLAGS */}
              <div className="w-full max-w-[280px] flex flex-col items-center gap-3 mt-auto pb-10">
                <p className="text-[7px] font-black text-white/60 uppercase tracking-[0.3em] text-center">
                    {t('step1')}
                </p>
                <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-[2rem] shadow-2xl backdrop-blur-xl w-full">
                    <div className="grid grid-cols-5 gap-x-2 gap-y-2 items-center justify-items-center">
                      {LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => { setCurrentLanguage(lang.code); setUser(p => ({...p, language: lang.code})); }} className="transition-all active:scale-90 relative">
                          <FlagIcon code={lang.code} className={`w-5 h-5 ${currentLanguage === lang.code ? 'ring-2 ring-purple-500 scale-110 z-10 shadow-lg' : 'grayscale opacity-20 hover:opacity-100 hover:grayscale-0'}`} />
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
                          <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 mt-4 space-y-3 animate-fade-in shadow-2xl">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">{t('results')}:</p>
                              {searchOptions.map((opt, i) => (
                                  <button key={i} onClick={() => processCitySelection(opt)} className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group active:bg-purple-600 transition-all">
                                      <div className="text-left">
                                          <p className="text-xs font-black text-white group-active:text-white uppercase">{opt.spanishName}</p>
                                          <p className="text-[8px] font-bold text-slate-500 uppercase group-active:text-white/60">{opt.country}</p>
                                      </div>
                                      <i className="fas fa-chevron-right text-[10px] text-slate-700 group-active:text-white"></i>
                                  </button>
                              ))}
                          </div>
                      )}
                      {!searchOptions && <TravelServices mode="HOME" language={currentLanguage} onCitySelect={(name: string) => handleCitySearch(name)} />}
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto">
                      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20"><button onClick={() => setView(AppView.HOME)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center"><i className="fas fa-arrow-left text-xs"></i></button><h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2></header>
                      <div className="space-y-4 pb-12">
                          {tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0); }} language={currentLanguage} />)}
                      </div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => { setUser(u); setCurrentLanguage(u.language); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={currentLanguage} onBack={() => setView(AppView.CITY_DETAIL)} />}
                {view === AppView.LEADERBOARD && <div className="max-w-md mx-auto h-full"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={currentLanguage} /></div>}
                {view === AppView.TOOLS && <div className="pt-safe-iphone px-6 max-w-md mx-auto"><TravelServices mode="HUB" language={currentLanguage} onCitySelect={(name: string) => handleCitySearch(name)} /></div>}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => { setUser(u); setCurrentLanguage(u.language); syncUserProfile(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} language={currentLanguage} onLogout={() => { supabase.auth.signOut(); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
                {view === AppView.SHOP && <div className="max-w-md mx-auto h-full"><Shop user={user} onPurchase={() => {}} language={currentLanguage} /></div>}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-4 flex justify-center pointer-events-none">
                <nav className="bg-slate-900/98 backdrop-blur-2xl border border-white/10 px-1 py-3 flex justify-around items-center w-full max-w-lg rounded-[2.5rem] pointer-events-auto shadow-2xl overflow-x-auto no-scrollbar">
                    <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                    <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                    <button onClick={() => setView(AppView.HOME)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg' : 'bg-white/5'}`}><BdaiLogo className="w-5 h-5" /></button>
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
