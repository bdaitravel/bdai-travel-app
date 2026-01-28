
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, generateAudio, standardizeCityName, getGreetingContext, translateTours, cleanDescriptionText } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { Onboarding } from './components/Onboarding';
import { FlagIcon } from './components/FlagIcon';
import { AdminPanel } from './components/AdminPanel';
import { supabase, getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache, normalizeKey, validateEmailFormat } from './services/supabaseClient';
import { STATIC_TOURS } from './data/toursData';

const TRANSLATIONS: any = {
  en: { welcome: "Bidaer Log:", explorer: "Explorer", searchPlaceholder: "Target city...", emailPlaceholder: "Credential email", codeLabel: "security code", login: "Send Code", verify: "Access", tagline: "better destinations by ai", authError: "Check email/spam", codeError: "Invalid code", selectLang: "Select your language", resend: "Resend", checkEmail: "Check inbox", sentTo: "Code sent to:", tryDifferent: "Change email", close: "Close", loading: "Syncing data...", loadingTour: "Dai is deconstructing urban reality...", translating: "Translating verified intelligence...", navElite: "Elite", navHub: "Intel", navVisa: "Passport", navStore: "Store", quotaError: "Dai is exhausted. Retrying...", timeoutError: "Connection timeout.", selectAmbiguity: "Which one do you mean?" },
  es: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciudad objetivo...", emailPlaceholder: "Email de credencial", codeLabel: "código de seguridad", login: "Enviar Código", verify: "Acceder", tagline: "better destinations by ai", authError: "Revisa tu email o SPAM", codeError: "Código no válido", selectLang: "Selecciona tu idioma", resend: "Reenviar", checkEmail: "Revisa tu email", sentTo: "Código enviado a:", tryDifferent: "Cambiar email", close: "Cerrar", loading: "Sincronizando...", loadingTour: "Dai está analizando la ciudad...", translating: "Traduciendo inteligencia verificada...", navElite: "Élite", navHub: "Intel", navVisa: "Pasaporte", navStore: "Tienda", quotaError: "Dai está exhausta. Reintentando...", timeoutError: "Tiempo de espera agotado.", selectAmbiguity: "¿A qué ciudad te refieres?" },
  ca: { welcome: "Log Bidaer:", explorer: "Explorador", searchPlaceholder: "Ciutat objectiu...", emailPlaceholder: "Email de credencial", codeLabel: "codi de seguretat", login: "Enviar Codi", verify: "Accedir", tagline: "better destinations by ai", authError: "Revisa el teu email o SPAM", codeError: "Codi no vàlid", selectLang: "Selecciona el teu idioma", resend: "Renvoyer", checkEmail: "Revisa el teu email", sentTo: "Codi enviat a:", tryDifferent: "Canviar email", close: "Tancar", loading: "Carregant...", loadingTour: "La Dai està analitzant la ciutat...", translating: "Traduint intel·ligència verificada...", navElite: "Elit", navHub: "Intel", navVisa: "Passaport", navStore: "Botiga", quotaError: "La Dai està esgotada. Reintentant...", timeoutError: "Temps d'espera esgotat.", selectAmbiguity: "A quina ciutat et refereixes?" },
  eu: { welcome: "Bidaer Log:", explorer: "Esploratzailea", searchPlaceholder: "Helburu hiria...", emailPlaceholder: "Egiaztapen emaila", codeLabel: "segurtasun kodea", login: "Bidali Kodea", verify: "Sartu", tagline: "better destinations by ai", authError: "Begiratu tu emaila edo SPAMa", codeError: "Kode baliogabea", selectLang: "Hautatu zure hizkuntza", resend: "Berriro bidali", checkEmail: "Begiratu tu emaila", sentTo: "Kodea hona bidali da:", tryDifferent: "Emaila aldatu", close: "Itxi", loading: "Kargatzen...", loadingTour: "Dai hiria aztertzen ari da...", translating: "Adimen egiaztatua itzultzen...", navElite: "Elite", navHub: "Intel", navVisa: "Pasaportea", navStore: "Denda", quotaError: "Dai nekatuta dago. Berriro saiatzen...", timeoutError: "Denbora agortu da.", selectAmbiguity: "Zein hiri da?" },
  fr: { welcome: "Log Bidaer:", explorer: "Explorateur", searchPlaceholder: "Ville cible...", emailPlaceholder: "Email d'accès", codeLabel: "code de seguridad", login: "Envoyer le Code", verify: "Accéder", tagline: "better destinations by ai", authError: "Vérifiez vos e-mails ou SPAM", codeError: "Code invalide", selectLang: "Choisissez votre langue", resend: "Renvoyer", checkEmail: "Vérifiez vos e-mails", sentTo: "Code envoyé à :", tryDifferent: "Changer d'e-mail", close: "Fermer", loading: "Chargement...", loadingTour: "Dai analyse la ville...", translating: "Traduction de l'intelligence vérifiée...", navElite: "Élite", navHub: "Intel", navVisa: "Passeport", navStore: "Boutique", quotaError: "Dai est épuisée. Nouvelle tentative...", timeoutError: "Délai d'attente dépassé.", selectAmbiguity: "De quelle ville s'agit-il ?" },
  de: { welcome: "Bidaer Log:", explorer: "Entdecker", searchPlaceholder: "Zielstadt...", emailPlaceholder: "E-Mail", codeLabel: "Code", login: "Code senden", verify: "Zugreifen", tagline: "Bessere Ziele durch KI", authError: "E-Mail/Spam prüfen", codeError: "Ungültiger Code", selectLang: "Wählen Sie Ihre Sprache", resend: "Erneut senden", checkEmail: "Posteingang prüfen", sentTo: "Code gesendet an:", tryDifferent: "E-Mail ändern", close: "Schließen", loading: "Synchronisierung...", loadingTour: "Dai analysiert...", translating: "Übersetzung...", navElite: "Elite", navHub: "Intel", navVisa: "Pass", navStore: "Shop", quotaError: "Dai ist erschöpft. Erneuter Versuch...", timeoutError: "Zeitüberschreitung.", selectAmbiguity: "Welche Stadt meinen Sie?" },
  ja: { welcome: "Bidaer ログ:", explorer: "エクスプローラー", searchPlaceholder: "目的地...", emailPlaceholder: "メール", codeLabel: "コード", login: "送信", verify: "アクセス", tagline: "AIによる次世代の旅", authError: "メールを確認してください", codeError: "無効なコード", selectLang: "言語を選択してください", resend: "再送", checkEmail: "受信トレイを確認", sentTo: "送信先:", tryDifferent: "メール変更", close: "閉じる", loading: "同期中...", loadingTour: "分析中...", translating: "翻訳中...", navElite: "エリート", navHub: "インテル", navVisa: "パスポー", navStore: "ショップ", quotaError: "Daiは疲れました。再試行中...", timeoutError: "タイムアウト。", selectAmbiguity: "どの都市ですか？" },
  zh: { welcome: "Bidaer 日志:", explorer: "探险家", searchPlaceholder: "目标城市...", emailPlaceholder: "邮箱", codeLabel: "验证码", login: "发送", verify: "进入", tagline: "AI驱动的旅程", authError: "请检查邮箱", codeError: "无效代码", selectLang: "请选择您的语言", resend: "重发", checkEmail: "检查收件箱", sentTo: "代码已发送至:", tryDifferent: "更换邮箱", close: "关闭", loading: "同步中...", loadingTour: "分析中...", translating: "翻译中...", navElite: "精英", navHub: "情报", navVisa: "护照", navStore: "商店", quotaError: "Dai 累了，正在重试...", timeoutError: "超时。", selectAmbiguity: "您指的是哪个城市？" },
  ar: { welcome: "سجل بيداير:", explorer: "مكتشف", searchPlaceholder: "المدينة...", emailPlaceholder: "البريد", codeLabel: "الرمز", login: "إرسال", verify: "دخول", tagline: "وجهات أفضل بالذكاء الاصطناعي", authError: "تحقق من البريد", codeError: "رمز غير صالح", selectLang: "اختر لغتك", resend: "إعادة إرسال", checkEmail: "تحقق من الوارد", sentTo: "أُرسل الرمز إلى:", tryDifferent: "تغيير البريد", close: "إغلاق", loading: "مزامنة...", loadingTour: "داي تحلل...", translating: "ترجمة...", navElite: "النخبة", navHub: "المعلomat", navVisa: "جواز السفر", navStore: "المتجر", quotaError: "داي مرهقة، جاري المحاولة...", timeoutError: "انتهى الوقت.", selectAmbiguity: "أي مدينة تقصد؟" }
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
  const [loginStep, setLoginStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [showOnboarding, setShowOnboarding] = useState(false);
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
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const isAudioUnlocked = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const profile = await getUserProfileByEmail(session.user.email || '');
            const newUser = { ...(profile || user), id: session.user.id, email: session.user.email, isLoggedIn: true };
            setUser(newUser as any);
            setView(AppView.HOME);
            if (!newUser.interests?.length) setShowOnboarding(true);
        }
    };
    checkAuth();
    getGlobalRanking().then(setLeaderboard);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => setUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}));
    }
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language || 'es'] || TRANSLATIONS['es'])[key] || key;

  /**
   * AUDIO BRIDGE: Desbloqueo síncrono del motor de audio para iOS.
   */
  const unlockAudio = async () => {
    if (isAudioUnlocked.current) return;
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer; source.connect(ctx.destination);
        source.start(0);
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance("");
            utterance.volume = 0; window.speechSynthesis.speak(utterance);
        }
        isAudioUnlocked.current = true;
    } catch (e) { console.warn(e); }
  };

  const handleSendOtp = async () => {
    await unlockAudio();
    if (!email || !validateEmailFormat(email) || isLoading) return;
    setAuthError(null); setIsLoading(true);
    try {
      const { error } = await sendOtpEmail(email);
      if (error) throw error;
      setLoginStep('CODE');
    } catch (e: any) { setAuthError(e.message); } 
    finally { setIsLoading(false); }
  };

  const handleVerifyOtp = async () => {
    await unlockAudio();
    if (!otpCode || otpCode.length < 6 || isLoading) return;
    setIsLoading(true); setAuthError(null);
    try {
      const { data, error } = await verifyOtpCode(email, otpCode);
      if (error || !data?.user) { setAuthError(error?.message || t('codeError')); } 
      else {
        const profile = await getUserProfileByEmail(email);
        const newUser: UserProfile = { ...(profile || user), id: data.user.id, email, isLoggedIn: true };
        setUser(newUser); localStorage.setItem('bdai_profile', JSON.stringify(newUser));
        syncUserProfile(newUser); setView(AppView.HOME);
        if (!newUser.interests?.length) setShowOnboarding(true);
      }
    } catch (e: any) { setAuthError(e.message); } 
    finally { setIsLoading(false); }
  };

  const processCitySelection = async (name: string, country: string) => {
    await unlockAudio();
    setIsLoading(true); setSearchOptions(null); setLoadingMessage(t('loadingTour'));
    const targetLang = user.language || 'es';
    try {
        setSelectedCity(name); setSelectedCountry(country);
        const dbCached = await getCachedTours(name, country, targetLang);
        if (dbCached && dbCached.length > 0) { setTours(dbCached); setView(AppView.CITY_DETAIL); setIsLoading(false); return; }
        const greeting = await getGreetingContext(name, targetLang);
        const generated = await generateToursForCity(name, country, user, greeting, false);
        if (generated && generated.length > 0) {
            setTours(generated); await saveToursToCache(name, country, targetLang, generated);
            setView(AppView.CITY_DETAIL);
        }
    } catch (e: any) { setAuthError(e.message); } 
    finally { setIsLoading(false); }
  };

  const handleCitySelect = async (cityInput: string) => {
    await unlockAudio();
    if (!cityInput.trim() || isLoading) return;
    setAuthError(null); setIsLoading(true); setLoadingMessage(t('loadingTour'));
    try {
        const results = await standardizeCityName(cityInput);
        if (results.length > 1) { setSearchOptions(results); setIsLoading(false); } 
        else if (results.length === 1) { await processCitySelection(results[0].name, results[0].country); }
    } catch (e: any) { setAuthError(e.message); setIsLoading(false); }
  };

  const handlePlayAudio = async (id: string, text: string) => {
    await unlockAudio();
    const synth = window.speechSynthesis;
    if (audioPlayingId === id) { 
      if (audioSourceRef.current) audioSourceRef.current.stop();
      if (synth) synth.cancel(); setAudioPlayingId(null); return; 
    }
    if (audioSourceRef.current) audioSourceRef.current.stop();
    if (synth) synth.cancel();
    setAudioLoadingId(id);
    try {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();
        const base64 = await generateAudio(text, user.language, selectedCity || 'Global');
        if (base64) {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const dataInt16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 2));
            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
            const source = ctx.createBufferSource();
            source.buffer = buffer; source.connect(ctx.destination);
            source.onended = () => setAudioPlayingId(null);
            source.start(0); audioSourceRef.current = source; setAudioPlayingId(id);
        } else {
            setAudioPlayingId(id);
            const utterance = new SpeechSynthesisUtterance(cleanDescriptionText(text));
            utterance.lang = user.language;
            utterance.onend = () => setAudioPlayingId(null);
            synth.speak(utterance);
        }
    } catch(e) { setAudioPlayingId(null); } 
    finally { setAudioLoadingId(null); }
  };

  return (
    <div className="flex-1 bg-[#020617] flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {showOnboarding && <Onboarding language={user.language || 'es'} onLanguageSelect={(c) => { unlockAudio(); setUser(p => ({...p, language: c})); }} onComplete={(ints) => { unlockAudio(); setUser(p => ({...p, interests: ints})); setShowOnboarding(false); syncUserProfile({...user, interests: ints}); }} />}
      {isLoading && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-6"></div>
              <p className="text-white font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">{loadingMessage || t('loading')}</p>
          </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-between p-8 py-safe-iphone relative overflow-hidden">
              <div className="text-center pt-8">
                  <div className="w-40 h-40 mb-6 bg-purple-600/10 rounded-[3rem] flex items-center justify-center border border-purple-500/20 shadow-[0_0_50px_rgba(147,51,234,0.3)] mx-auto animate-pulse transition-all">
                     <BdaiLogo className="w-28 h-28" />
                  </div>
                  <h1 className="text-3xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-purple-400 text-[8px] font-black uppercase tracking-[0.4em] mt-1">{t('tagline')}</p>
              </div>
              <div className="w-full space-y-4 max-w-xs z-10 mb-6">
                  {authError && <div className="text-red-400 text-[8px] font-black uppercase text-center bg-red-500/10 p-3 rounded-2xl border border-red-500/20">{authError}</div>}
                  {loginStep === 'EMAIL' ? (
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-center animate-pulse">{t('selectLang')}</p>
                              <div className="flex justify-start gap-3 overflow-x-auto no-scrollbar py-2 px-1">
                                  {LANGUAGES.map(lang => (
                                      <button key={lang.code} onClick={() => { unlockAudio(); setUser(p => ({...p, language: lang.code})); }} className={`w-10 h-10 shrink-0 rounded-full border-2 overflow-hidden transition-all ${user.language === lang.code ? 'border-purple-500 scale-110 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'border-white/5 opacity-40'}`}><FlagIcon code={lang.code} className="w-full h-full" /></button>
                                  ))}
                              </div>
                          </div>
                          <input type="email" placeholder={t('emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-center text-white focus:border-purple-500 outline-none font-bold" />
                          <button onClick={handleSendOtp} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-2xl">
                              {t('login')}
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-4 text-center">
                          <p className="text-[8px] font-black text-slate-500 uppercase">{t('sentTo')} {email}</p>
                          <input autoFocus type="text" inputMode="numeric" maxLength={8} value={otpCode} onChange={e => setOtpCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()} className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 text-center font-black text-3xl text-white tracking-widest outline-none" placeholder="000000" />
                          <button onClick={handleVerifyOtp} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-2xl">{t('verify')}</button>
                          <button onClick={() => setLoginStep('EMAIL')} className="text-[8px] font-black text-slate-600 uppercase">{t('tryDifferent')}</button>
                      </div>
                  )}
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
                      <div className="relative mt-8">
                        <i className="fas fa-search absolute left-6 top-6 text-slate-500"></i>
                        <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 pl-16 pr-8 text-white focus:border-purple-500 outline-none font-bold" />
                      </div>
                      {searchOptions && (
                          <div className="mt-6 space-y-3 animate-fade-in">
                              {searchOptions.map((opt, i) => (
                                  <button key={i} onClick={() => processCitySelection(opt.name, opt.country)} className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between group active:bg-purple-600 transition-all"><div className="flex flex-col items-start"><span className="text-white font-black uppercase text-sm">{opt.name}</span><span className="text-[9px] text-slate-500 font-bold uppercase">{opt.country}</span></div><i className="fas fa-chevron-right text-slate-700"></i></button>
                              ))}
                          </div>
                      )}
                      <TravelServices mode="HOME" language={user.language || 'es'} onCitySelect={(name) => handleCitySelect(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 animate-fade-in">
                      <header className="flex items-center gap-4 mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20">
                        <button onClick={() => setView(AppView.HOME)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2>
                      </header>
                      <div className="space-y-6 pb-24">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { unlockAudio(); setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language || 'es'} />)}</div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => { unlockAudio(); setCurrentStopIndex(i => i + 1); }} onPrev={() => { unlockAudio(); setCurrentStopIndex(i => i - 1); }} onJumpTo={(i: number) => { unlockAudio(); setCurrentStopIndex(i); }} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} language={user.language || 'es'} onBack={() => { if(audioSourceRef.current) audioSourceRef.current.stop(); if(window.speechSynthesis) window.speechSynthesis.cancel(); setAudioPlayingId(null); setView(AppView.CITY_DETAIL); }} userLocation={userLocation} onVisit={(id: string, miles: number) => { setUser(p => ({...p, miles: p.miles + miles})); setActiveTour({ ...activeTour, stops: activeTour.stops.map(s => s.id === id ? { ...s, visited: true } : s) }); }} />}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => unlockAudio()} language={user.language || 'es'} />}
                {view === AppView.TOOLS && <TravelServices mode="HUB" language={user.language || 'es'} onCitySelect={(name) => handleCitySelect(name)} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={(reward) => setUser(p => ({...p, miles: p.miles + reward}))} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language || 'es'} onUpdateUser={(u) => { unlockAudio(); setUser(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); syncUserProfile(u); }} onLogout={() => { localStorage.removeItem('bdai_profile'); setView(AppView.LOGIN); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>
            {view !== AppView.TOUR_ACTIVE && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-8 pb-safe-iphone mb-4 pointer-events-none">
                  <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center w-full rounded-[3rem] pointer-events-auto shadow-2xl">
                      <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => { unlockAudio(); setView(AppView.LEADERBOARD); }} />
                      <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => { unlockAudio(); setView(AppView.TOOLS); }} />
                      <button onClick={() => { unlockAudio(); setView(AppView.HOME); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-12 scale-110 rotate-45' : 'bg-white/5'}`}><BdaiLogo className="w-7 h-7" /></button>
                      <NavButton icon="fa-id-card" label={t('navVisa')} isActive={view === AppView.PROFILE} onClick={() => { unlockAudio(); setView(AppView.PROFILE); }} />
                      <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={view === AppView.SHOP} onClick={() => { unlockAudio(); setView(AppView.SHOP); }} />
                  </nav>
              </div>
            )}
          </div>
      )}
    </div>
  );
}
