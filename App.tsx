
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES, HubIntel, Stop, TravelerRank, RANK_THRESHOLDS, BADGE_DEFINITIONS, Badge } from './types';
import { generateToursForCity, generateAudio } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { FlagIcon } from './components/FlagIcon';
import { Onboarding } from './components/Onboarding';
import { CommunityBoard } from './components/CommunityBoard';
import { CurrencyConverter } from './components/CurrencyConverter';
import { STATIC_TOURS } from './data/toursData';
import { getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, syncUserProfile, getCachedTours, saveToursToCache } from './services/supabaseClient';

// Importaciones de Capacitor para comportamiento de App Real
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { App as CapacitorApp } from '@capacitor/app';

const TRANSLATIONS: any = {
  en: { welcome: "Welcome,", explorer: "Explorer", searchPlaceholder: "Search any city...", login: "Issue Passport", verify: "Verify Code", tagline: "better destinations by ai", loading: "Accessing Global Archives...", rankUp: "RANK INCREASED!", badgeUnlock: "NEW BADGE!", langSelect: "Select System Language", changeEmail: "Edit email", otpPlaceholder: "OTP CODE", resend: "Resend Code", spamNote: "If not received, check your Junk/Spam folder" },
  es: { welcome: "Bienvenido,", explorer: "Explorador", searchPlaceholder: "Busca cualquier ciudad...", login: "Emitir Pasaporte", verify: "Verificar Código", tagline: "better destinations by ai", loading: "Consultando Archivos Globales...", rankUp: "¡SUBIDA DE RANGO!", badgeUnlock: "¡NUEVA INSIGNIA!", langSelect: "Idioma del Sistema", changeEmail: "Editar email", otpPlaceholder: "CÓDIGO OTP", resend: "Reenviar código", spamNote: "Si no llega, revisa tu carpeta de Spam o Correo no deseado" },
  ca: { welcome: "Benvingut,", explorer: "Explorador", searchPlaceholder: "Cerca qualsevol ciutat...", login: "Emetre Passaport", verify: "Validar Codi", tagline: "better destinations by ai", loading: "Consultant Arxius Globals...", rankUp: "¡PUJADA DE RANG!", badgeUnlock: "¡NOVA INSÍGNIA!", langSelect: "Idioma del Sistema", changeEmail: "Canviar email", otpPlaceholder: "CODI OTP", resend: "Reenviar codi", spamNote: "Si no arriba, revisa el correu brossa" },
  eu: { welcome: "Ongi etorri,", explorer: "Esploratzailea", searchPlaceholder: "Bilatu edozein hiri...", login: "Pasaportea Lortu", verify: "Kodea Egiaztatu", tagline: "better destinations by ai", loading: "Artxibo Globalak Kontsultatzen...", rankUp: "¡MAILA IGO DA!", badgeUnlock: "¡INTZIGNIA BERRIA!", langSelect: "Sistemaren Hizkuntza", changeEmail: "Emaila aldatu", otpPlaceholder: "OTP KODEA", resend: "Kodea birbidali", spamNote: "Iritsi ezean, begiratu Spam karpeta" },
  fr: { welcome: "Bienvenue,", explorer: "Explorateur", searchPlaceholder: "Chercher une ville...", login: "Émettre Passeport", verify: "Vérifier Code", tagline: "better destinations by ai", loading: "Consultation des Archives...", rankUp: "¡RANG AUGMENTÉ!", badgeUnlock: "NOUVEAU BADGE!", langSelect: "Langue du Système", changeEmail: "Modifier l'email", otpPlaceholder: "CODE OTP", resend: "Renvoyer le code", spamNote: "Vérifiez vos spams si vous ne recevez rien" }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Explorer', 
  email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, birthday: '2000-01-01', 
  visitedCities: [], completedTours: [], savedIntel: [], stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, 
  badges: [], joinDate: new Date().toLocaleDateString(), passportNumber: 'XP-TEMP-BDAI', city: '', country: ''
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all pointer-events-auto ${isActive ? 'text-purple-500 scale-110' : 'text-slate-500 opacity-50'}`}>
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [loginStep, setLoginStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) return { ...GUEST_PROFILE, ...JSON.parse(saved) };
    return GUEST_PROFILE;
  });

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [milesToast, setMilesToast] = useState<{show: boolean, amount: number, text?: string}>({show: false, amount: 0});

  useEffect(() => {
    const initNative = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
        
        setTimeout(async () => {
          await SplashScreen.hide();
        }, 500);

        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            CapacitorApp.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch (e) {
        console.warn("Entorno web detectado");
      }
    };

    initNative();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        err => console.error("GPS Error:", err),
        { enableHighAccuracy: true }
      );
    }
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const navigateTo = async (newView: AppView) => {
    await Haptics.impact({ style: ImpactStyle.Light });
    setView(newView);
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) { setAuthError("Email inválido"); return; }
    setIsLoading(true);
    setAuthError(null);
    try {
        const { error } = await sendOtpEmail(email);
        if (error) {
            setAuthError(error.message || "Error al enviar el código.");
        } else {
            setLoginStep('VERIFY');
            await Haptics.notification({ type: NotificationType.Success });
        }
    } catch (e) {
        setAuthError("Fallo de conexión.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
      if (!otpCode) return;
      setIsLoading(true);
      setAuthError(null);
      
      const { data, error } = await verifyOtpCode(email, otpCode);
      if (error) { 
          setAuthError("Código incorrecto o caducado."); 
          setIsLoading(false); 
          await Haptics.notification({ type: NotificationType.Error });
          return; 
      }

      const profile = await getUserProfileByEmail(email);
      const newUser = profile ? { ...profile, isLoggedIn: true } : { ...user, id: data.user?.id || 'new', email: email, isLoggedIn: true };
      setUser(newUser);
      localStorage.setItem('bdai_profile', JSON.stringify(newUser));
      navigateTo(AppView.HOME);
      if (!newUser.interests || newUser.interests.length === 0) setShowOnboarding(true);
      setIsLoading(false);
      await Haptics.notification({ type: NotificationType.Success });
  };

  const handleVisit = async (stopId: string, bonus: number = 100) => {
      if (!activeTour) return;
      await Haptics.notification({ type: NotificationType.Success });
      
      const updatedStops = activeTour.stops.map(s => s.id === stopId ? { ...s, visited: true } : s);
      const updatedTour = { ...activeTour, stops: updatedStops };
      setActiveTour(updatedTour);
      
      const updatedUser = { 
          ...user, 
          miles: user.miles + bonus,
          visitedCities: user.visitedCities.includes(activeTour.city) ? user.visitedCities : [...user.visitedCities, activeTour.city],
          stats: { ...user.stats, photosTaken: user.stats.photosTaken + (bonus > 100 ? 1 : 0) }
      };
      
      let newRank = user.rank;
      Object.entries(RANK_THRESHOLDS).forEach(([rank, threshold]) => {
          if (updatedUser.miles >= threshold) newRank = rank as TravelerRank;
      });
      updatedUser.rank = newRank;

      setUser(updatedUser);
      localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
      syncUserProfile(updatedUser);
      
      setMilesToast({ show: true, amount: bonus, text: bonus > 100 ? "PHOTO SPOT CAPTURADO" : "PARADA VERIFICADA" });
      setTimeout(() => setMilesToast({ show: false, amount: 0 }), 3000);
  };

  const handleCitySelect = async (cityInput: string) => {
    const cityNormalized = cityInput.trim().toLowerCase();
    if (!cityNormalized) return;
    
    await Haptics.impact({ style: ImpactStyle.Medium });
    setSelectedCity(cityInput.trim());
    setView(AppView.CITY_DETAIL);
    setIsLoading(true);

    try {
        const staticTour = STATIC_TOURS.find(t => t.city.toLowerCase() === cityNormalized);
        if (staticTour) {
            setTours([staticTour]);
            setIsLoading(false);
            return;
        }

        const cached = await getCachedTours(cityInput.trim(), user.language);
        if (cached && cached.length > 0) {
            setTours(cached);
            setIsLoading(false);
            return;
        }

        const res = await generateToursForCity(cityInput.trim(), user);
        if (Array.isArray(res) && res.length > 0) {
            setTours(res);
            await saveToursToCache(cityInput.trim(), user.language, res);
        }
    } catch (e) { 
        console.error("Selection Error:", e); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) {
        if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e){}
        setAudioPlayingId(null);
        return;
    }
    setAudioLoadingId(id);
    const base64 = await generateAudio(text, user.language);
    if (base64) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const ctx = audioContextRef.current;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e){}
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setAudioPlayingId(null);
        source.start(0);
        audioSourceRef.current = source;
        setAudioPlayingId(id);
    }
    setAudioLoadingId(null);
  };

  return (
    <div className="flex-1 bg-[#020617] flex flex-col relative overflow-hidden text-slate-100 font-sans select-none h-screen w-screen">
      
      {showOnboarding && <Onboarding language={user.language} onLanguageSelect={(l) => setUser({...user, language: l})} onComplete={(ints) => { 
          const updated = {...user, interests: ints};
          setUser(updated); syncUserProfile(updated); setShowOnboarding(false); 
      }} />}

      {milesToast.show && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] animate-bounce pointer-events-none w-full max-w-[280px]">
              <div className="bg-yellow-400 text-slate-950 px-6 py-4 rounded-[2.5rem] font-black shadow-2xl border-4 border-white flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-black">+{milesToast.amount} MILES</div>
                  {milesToast.text && <div className="text-[10px] uppercase tracking-widest mt-1 opacity-60">{milesToast.text}</div>}
              </div>
          </div>
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 bg-[#020617] relative">
              <div className="absolute top-12 flex gap-4 animate-fade-in pt-safe">
                  {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => setUser({...user, language: l.code})} className={`w-10 h-10 rounded-full border-2 transition-all overflow-hidden ${user.language === l.code ? 'border-purple-500 scale-125 shadow-lg shadow-purple-500/30' : 'border-white/10 opacity-40'}`}>
                          <FlagIcon code={l.code} className="w-full h-full object-cover" />
                      </button>
                  ))}
              </div>
              <div className="text-center mb-12 flex flex-col items-center">
                  <BdaiLogo className="w-40 h-40 mb-6 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
                  <h1 className="text-5xl font-black lowercase tracking-tighter text-white">bdai</h1>
                  <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] opacity-80 mt-2">{t('tagline')}</p>
              </div>
              <div className="w-full space-y-4 max-w-xs z-10">
                  {authError && <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 p-3 rounded-2xl border border-red-500/20">{authError}</p>}
                  
                  {loginStep === 'FORM' ? (
                      <>
                          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-center text-sm text-white focus:border-purple-500/50" />
                          <button disabled={isLoading} onClick={handleSendOtp} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : t('login')}
                          </button>
                      </>
                  ) : (
                      <div className="animate-fade-in space-y-4">
                          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-4">
                              {t('spamNote')}
                          </p>
                          <input type="text" maxLength={8} placeholder={t('otpPlaceholder')} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-center font-black text-2xl tracking-[0.2em] text-purple-400" />
                          <button disabled={isLoading} onClick={handleVerifyOtp} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : t('verify')}
                          </button>
                          <div className="flex gap-2">
                             <button onClick={() => setLoginStep('FORM')} className="flex-1 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5 rounded-2xl">
                                {t('changeEmail')}
                             </button>
                             <button onClick={handleSendOtp} className="flex-1 py-4 text-[9px] font-black text-purple-400 uppercase tracking-widest border border-purple-500/20 rounded-2xl">
                                {t('resend')}
                             </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar z-10 relative bg-[#020617] pb-40">
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe animate-fade-in">
                      <header className="flex justify-between items-center px-8">
                          <BdaiLogo className="w-10 h-10"/>
                          <div className="flex items-center gap-4">
                            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-xs font-black text-white">
                                <i className="fas fa-coins text-yellow-500 mr-2"></i> {user.miles.toLocaleString()}
                            </div>
                            <button onClick={() => navigateTo(AppView.PROFILE)} className="w-12 h-12 rounded-2xl border-2 border-purple-500/50 overflow-hidden shadow-xl active:scale-90 transition-all">
                                <img src={user.avatar} className="w-full h-full object-cover" />
                            </button>
                          </div>
                      </header>
                      <div className="pt-8 px-8 mb-4">
                          <h1 className="text-4xl font-black leading-tight text-white uppercase tracking-tighter">
                            {t('welcome')} <br/><span className="text-purple-600/60 truncate block mt-1">{user.firstName || t('explorer')}.</span>
                          </h1>
                          <div className="relative mt-8">
                            <i className="fas fa-search absolute left-6 top-6 text-slate-500"></i>
                            <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 outline-none text-white shadow-2xl focus:border-purple-500/50" />
                          </div>
                      </div>
                      <TravelServices mode="HOME" language={user.language} onCitySelect={handleCitySelect} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe px-6 animate-fade-in">
                      <header className="flex items-center gap-4 mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20">
                          <button onClick={() => navigateTo(AppView.HOME)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><i className="fas fa-arrow-left"></i></button>
                          <h2 className="text-3xl font-black font-heading truncate uppercase tracking-tighter text-white">{selectedCity}</h2>
                      </header>
                      {isLoading ? (
                          <div className="py-32 text-center text-slate-500 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">{t('loading')}</div>
                      ) : (
                          <div className="space-y-12 pb-24">
                            <div className="space-y-6">
                                {tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); navigateTo(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language} />)}
                            </div>
                            
                            {/* Muro Social de la Ciudad */}
                            {selectedCity && (
                                <div className="pt-8 border-t border-white/10">
                                    <CommunityBoard city={selectedCity} language={user.language} user={user} />
                                </div>
                            )}
                          </div>
                      )}
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(p => Math.min(activeTour.stops.length - 1, p + 1))} onPrev={() => setCurrentStopIndex(p => Math.max(0, p - 1))} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} language={user.language} onBack={() => navigateTo(AppView.CITY_DETAIL)} userLocation={userLocation} onVisit={handleVisit} />
                )}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} />}
                {view === AppView.TOOLS && (
                    <div className="pt-safe px-8 space-y-10 animate-fade-in pb-24">
                        <CurrencyConverter language={user.language} />
                        <TravelServices mode="HUB" language={user.language} onCitySelect={handleCitySelect} />
                    </div>
                )}
                {view === AppView.SHOP && <Shop user={user} onPurchase={(reward) => setUser({...user, miles: user.miles + reward})} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => navigateTo(AppView.HOME)} isOwnProfile={true} language={user.language} onUpdateUser={setUser} onLogout={() => { navigateTo(AppView.LOGIN); }} />}
            </div>
            
            {/* Barra de Navegación Inferior Nativa */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] px-8 pb-safe pointer-events-none mb-4">
                <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-6 py-4 flex justify-between items-center w-full rounded-[3rem] pointer-events-auto shadow-2xl">
                    <NavButton icon="fa-trophy" label="Elite" isActive={view === AppView.LEADERBOARD} onClick={() => navigateTo(AppView.LEADERBOARD)} />
                    <NavButton icon="fa-compass" label="Hub" isActive={view === AppView.TOOLS} onClick={() => navigateTo(AppView.TOOLS)} />
                    <button onClick={() => navigateTo(AppView.HOME)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-12 scale-110 shadow-lg rotate-45' : 'bg-white/5'}`}><div className={view === AppView.HOME ? '-rotate-45' : ''}><BdaiLogo className="w-7 h-7" /></div></button>
                    <NavButton icon="fa-id-card" label="Visa" isActive={view === AppView.PROFILE} onClick={() => navigateTo(AppView.PROFILE)} />
                    <NavButton icon="fa-shopping-bag" label="Store" isActive={view === AppView.SHOP} onClick={() => navigateTo(AppView.SHOP)} />
                </nav>
            </div>
          </>
      )}
    </div>
  );
}
