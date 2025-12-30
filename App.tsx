
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES, TravelerRank } from './types';
import { generateToursForCity, generateAudio } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { syncUserProfile, getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode } from './services/supabaseClient';

function decodeBase64(base64: string) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return new Uint8Array(0);
  }
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const TRANSLATIONS: any = {
  en: { welcome: "Hello,", explore: "Explore", toolkit: "Hub", passport: "Visa", shop: "Store", ranking: "Elite", searchPlaceholder: "Search any city...", login: "Issue Passport", tagline: "better destinations by ai", emailLabel: "Email", nameLabel: "First Name", verifyTitle: "Verification", back: "Back", confirmCode: "Confirm", logout: "Log Out", trending: "Global Trends", spainTitle: "Spain Collection", results: "AI Tours", quotaError: "Daily limit reached. Use your own API key for unlimited access.", loading: "Curating your experience...", useOwnKey: "Use Own API Key" },
  es: { welcome: "Hola,", explore: "Explorar", toolkit: "Hub", passport: "Visa", shop: "Tienda", ranking: "Elite", searchPlaceholder: "Busca cualquier ciudad...", login: "Emitir Pasaporte", tagline: "better destinations by ai", emailLabel: "Email", nameLabel: "Nombre", verifyTitle: "Verificación", back: "Atrás", confirmCode: "Confirmar", logout: "Cerrar Sesión", trending: "Tendencias", spainTitle: "Colección España", results: "Tours IA", quotaError: "Límite diario alcanzado. Usa tu propia clave de API para acceso ilimitado.", loading: "Curando tu experiencia global...", useOwnKey: "Usar mi propia clave API" },
  ca: { welcome: "Hola,", explore: "Explorar", toolkit: "Hub", passport: "Visa", shop: "Botiga", ranking: "Elit", searchPlaceholder: "Cerca qualsevol ciutat...", login: "Emetre Passaport", tagline: "better destinations by ai", emailLabel: "Correu", nameLabel: "Nom", verifyTitle: "Verificació", back: "Enrere", confirmCode: "Confirmar", logout: "Tancar Sessió", trending: "Tendències", spainTitle: "Colecció Espanya", results: "Tours IA", quotaError: "Límit diari assolit. Utilitza la teva pròpia clau de API.", loading: "Curant la teva experiència...", useOwnKey: "Usar clau propia" },
  eu: { welcome: "Kaixo,", explore: "Esploratu", toolkit: "Gunea", passport: "Visa", shop: "Denda", ranking: "Elitea", searchPlaceholder: "Bilatu hiriak...", login: "Pasaportea Igortu", tagline: "better destinations by ai", emailLabel: "Posta", nameLabel: "Izena", verifyTitle: "Egiaztapena", back: "Atzera", confirmCode: "Berretsi", logout: "Saioa Itxi", trending: "Joerak", spainTitle: "Espainia Bilduma", results: "IA Ibilbideak", quotaError: "Eguneko muga gainditu da. Erabili zure API gakoa.", loading: "Esperientzia prestatzen...", useOwnKey: "Nire gakoa erabili" },
  fr: { welcome: "Bonjour,", explore: "Explorer", toolkit: "Hub", passport: "Visa", shop: "Boutique", ranking: "Élite", searchPlaceholder: "Chercher une ville...", login: "Émettre Passeport", tagline: "better destinations by ai", emailLabel: "E-mail", nameLabel: "Prénom", verifyTitle: "Vérification", back: "Retour", confirmCode: "Confirmer", logout: "Déconnexion", trending: "Tendances", spainTitle: "Collection Espagne", results: "Circuits IA", quotaError: "Limite quotidienne atteinte. Utilisez votre propre clé API.", loading: "Préparation de votre voyage...", useOwnKey: "Utiliser ma propre clé" }
};

export const FlagIcon = ({ code, className = "w-6 h-4" }: { code: string, className?: string }) => {
    switch(code) {
        case 'es': return ( <svg viewBox="0 0 750 500" className={className}><rect width="750" height="500" fill="#c60b1e"/><rect width="750" height="250" y="125" fill="#ffc400"/></svg> );
        case 'en': return ( <svg viewBox="0 0 60 30" className={className}><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><g clipPath="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/><path d="M30,0 v30" stroke="#C8102E" strokeWidth="6"/><path d="M0,15 h60" stroke="#C8102E" strokeWidth="6"/></g></svg> );
        case 'ca': return ( <svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#FCDD09"/><path d="M0 1h9M0 2.33h9M0 3.66h9M0 5h9" stroke="#DA121A" strokeWidth="0.66"/></svg> );
        case 'eu': return ( <svg viewBox="0 0 280 160" className={className}><rect width="280" height="160" fill="#D31027"/><path d="M0 0l280 160M0 160L280 0" stroke="#009543" strokeWidth="20"/><path d="M140 0v160M0 80h280" stroke="#FFF" strokeWidth="16"/></svg> );
        case 'fr': return ( <svg viewBox="0 0 3 2" className={className}><rect width="1" height="2" fill="#002395"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#ed2939"/></svg> );
        default: return <div className={`${className} bg-slate-200 rounded-sm`}></div>;
    }
};

const CategoryHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="pt-8 pb-4 px-6">
        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
            {title}
        </h3>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 ml-4 opacity-60">{subtitle}</p>
    </div>
);

const QuickCityBtn = ({ onClick, city, color, icon, label }: any) => {
    const colors: any = {
        purple: 'from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30',
        indigo: 'from-indigo-600/20 to-blue-600/20 text-indigo-400 border-indigo-500/30',
        blue: 'from-blue-600/20 to-cyan-600/20 text-blue-400 border-blue-500/30',
        orange: 'from-orange-600/20 to-red-600/20 text-orange-400 border-orange-500/30',
        emerald: 'from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/30',
        rose: 'from-rose-600/20 to-pink-600/20 text-rose-400 border-rose-500/30',
        cyan: 'from-cyan-600/20 to-blue-600/20 text-cyan-400 border-cyan-500/30',
        gold: 'from-yellow-600/20 to-amber-600/20 text-yellow-500 border-yellow-500/30'
    };
    return (
        <button onClick={onClick} className={`flex-shrink-0 flex items-center gap-4 p-5 rounded-[2.2rem] bg-gradient-to-br border backdrop-blur-md transition-all active:scale-95 ${colors[color] || colors.purple}`}>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
                <i className={`fas ${icon}`}></i>
            </div>
            <div className="text-left">
                <span className="text-sm font-black text-white block leading-none mb-1">{city}</span>
                <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest">{label || 'IA GUIDE'}</span>
            </div>
        </button>
    );
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string, label: string, isActive: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 pointer-events-auto ${isActive ? 'text-purple-400' : 'text-slate-500'}`}>
        <i className={`fas ${icon} text-xl`}></i>
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [loginStep, setLoginStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [quotaHit, setQuotaHit] = useState(false);
  
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bdai_profile');
    const base: UserProfile = { id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: '', email: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, visitedCities: [], completedTours: [], stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, badges: [], joinDate: new Date().toLocaleDateString(), passportNumber: `ES-${Math.floor(Math.random()*9000)+1000}-BDAI` };
    if (saved) return { ...base, ...JSON.parse(saved) };
    return base;
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

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const handleOpenSelectKey = async () => {
    if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        setQuotaHit(false);
        if (selectedCity) handleCitySelect(selectedCity);
    }
  };

  const handleCitySelect = async (city: string) => {
    setIsLoading(true);
    setQuotaHit(false);
    setSelectedCity(city);
    setView(AppView.CITY_DETAIL);
    try {
        const res = await generateToursForCity(city, user);
        if (res === 'QUOTA') setQuotaHit(true);
        else setTours(Array.isArray(res) ? res : []);
    } catch (e) {
        setQuotaHit(true);
    } finally {
        setIsLoading(false);
    }
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) {
        if (audioSourceRef.current) audioSourceRef.current.stop();
        setAudioPlayingId(null);
        return;
    }
    setAudioLoadingId(id);
    try {
        const base64 = await generateAudio(text, user.language);
        if (base64 === "QUOTA_EXHAUSTED") {
            setQuotaHit(true);
            return;
        }
        if (base64) {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();
            const buffer = await decodeAudioData(decodeBase64(base64), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setAudioPlayingId(null);
            source.start(0);
            audioSourceRef.current = source;
            setAudioPlayingId(id);
        }
    } catch (e) { console.error("Audio error", e); }
    finally { setAudioLoadingId(null); }
  };

  const handleStartAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const { error } = await sendOtpEmail(user.email);
      setIsLoading(false);
      if (error) setAuthError(error.message);
      else setLoginStep('VERIFY');
  };

  const finalizeLogin = async () => {
      setIsLoading(true);
      const { data, error } = await verifyOtpCode(user.email, otpCode);
      setIsLoading(false);
      if (error || !data.user) setAuthError(t('errorLogin'));
      else {
          const profile = await getUserProfileByEmail(user.email);
          if (profile) setUser(profile);
          else setUser(prev => ({ ...prev, id: data.user!.id, isLoggedIn: true }));
          setView(AppView.HOME);
      }
  };

  useEffect(() => {
    getGlobalRanking().then(setLeaderboard);
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition((pos) => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
    }
  }, []);

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-950 flex flex-col shadow-2xl relative overflow-hidden text-white font-sans">
      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-950">
              <div className="absolute top-12 flex gap-3">
                  {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => setUser(p => ({...p, language: l.code}))} className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${user.language === l.code ? 'border-purple-500 scale-110 shadow-lg' : 'border-white/10 opacity-30'}`}>
                        <FlagIcon code={l.code} className="w-full h-full object-cover" />
                      </button>
                  ))}
              </div>
              <div className="text-center mb-12 animate-fade-in">
                  <BdaiLogo className="w-24 h-24 mx-auto mb-4" />
                  <h1 className="text-6xl font-black lowercase tracking-tighter">bdai</h1>
                  <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.6em] mt-1 opacity-60">{t('tagline')}</p>
              </div>
              <div className="w-full max-w-xs space-y-4">
                  {loginStep === 'FORM' ? (
                      <form onSubmit={handleStartAuth} className="space-y-4 animate-slide-up">
                          <input type="text" required value={user.firstName} onChange={e => setUser({...user, firstName: e.target.value})} placeholder={t('nameLabel')} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm outline-none focus:border-purple-500 transition-colors placeholder:opacity-50" />
                          <input type="email" required value={user.email} onChange={e => setUser({...user, email: e.target.value})} placeholder={t('emailLabel')} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-sm outline-none focus:border-purple-500 transition-colors placeholder:opacity-50" />
                          <button disabled={isLoading} type="submit" className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all">
                              {isLoading ? <i className="fas fa-spinner fa-spin"></i> : t('login')}
                          </button>
                      </form>
                  ) : (
                      <div className="space-y-6 text-center animate-slide-up">
                          <h2 className="text-xl font-black">{t('verifyTitle')}</h2>
                          <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full bg-white/5 border-2 border-purple-500/30 rounded-2xl py-5 text-center text-4xl font-black tracking-widest outline-none" placeholder="------" />
                          <button onClick={finalizeLogin} disabled={isLoading} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl">
                              {isLoading ? <i className="fas fa-spinner fa-spin"></i> : t('confirmCode')}
                          </button>
                          <button onClick={() => setLoginStep('FORM')} className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{t('back')}</button>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32 z-10 relative">
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe animate-fade-in">
                      <header className="flex justify-between items-center pt-6 px-6">
                          <div className="flex items-center gap-2"><BdaiLogo className="w-8 h-8"/><span className="font-black text-2xl lowercase tracking-tighter">bdai</span></div>
                          <button onClick={() => setView(AppView.PROFILE)} className="w-12 h-12 rounded-full border-2 border-purple-500 overflow-hidden shadow-lg"><img src={user.avatar} className="w-full h-full object-cover" /></button>
                      </header>
                      <div className="pt-4 px-6">
                          <h1 className="text-4xl font-black leading-tight mb-6">{t('welcome')} <br/><span className="text-white/30">{user.firstName || 'Explorer'}.</span></h1>
                          <div className="relative group">
                            <i className="fas fa-search absolute left-5 top-5 text-slate-500"></i>
                            <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-purple-500 shadow-2xl transition-all" />
                          </div>
                      </div>
                      <CategoryHeader title={t('spainTitle')} subtitle="The soul of the peninsula" />
                      <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2">
                          <QuickCityBtn onClick={() => handleCitySelect('Madrid')} city="Madrid" label="Arte 🖼️" icon="fa-landmark" color="gold" />
                          <QuickCityBtn onClick={() => handleCitySelect('Barcelona')} city="Barcelona" label="Gaudí 🌊" icon="fa-archway" color="gold" />
                          <QuickCityBtn onClick={() => handleCitySelect('Logroño')} city="Logroño" label="Vinos 🍷" icon="fa-wine-glass" color="orange" />
                          <QuickCityBtn onClick={() => handleCitySelect('Sevilla')} city="Sevilla" label="Duende 💃" icon="fa-fan" color="gold" />
                      </div>
                      <CategoryHeader title={t('trending')} subtitle="The world's top choices" />
                      <div className="px-6 space-y-3">
                          <QuickCityBtn onClick={() => handleCitySelect('Tokyo')} city="Tokyo" icon="fa-torii-gate" color="purple" />
                          <QuickCityBtn onClick={() => handleCitySelect('Paris')} city="Paris" icon="fa-monument" color="cyan" />
                      </div>
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe px-6 animate-fade-in">
                      <header className="flex items-center gap-4 mb-6 py-4 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
                          <button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                          <h2 className="text-2xl font-black">{selectedCity}</h2>
                      </header>
                      {isLoading ? (
                          <div className="py-24 text-center text-slate-500 animate-pulse">{t('loading')}</div>
                      ) : quotaHit ? (
                          <div className="py-20 text-center px-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                              <i className="fas fa-key text-3xl mb-6 text-yellow-500"></i>
                              <p className="text-sm font-bold text-slate-300 leading-relaxed mb-8">{t('quotaError')}</p>
                              <button onClick={handleOpenSelectKey} className="w-full py-5 bg-yellow-500 text-slate-950 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl">
                                  {t('useOwnKey')}
                              </button>
                          </div>
                      ) : (
                          <div className="space-y-6 pb-12">
                            {tours.map(tour => (
                              <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); setView(AppView.TOUR_ACTIVE);}} language={user.language} />
                            ))}
                          </div>
                      )}
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(prev => prev + 1)} onPrev={() => setCurrentStopIndex(prev => prev - 1)} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} userLocation={userLocation} language={user.language} />
                )}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} />}
                {view === AppView.TOOLS && <TravelServices language={user.language} onCitySelect={handleCitySelect} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={() => {}} />}
            </div>
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-6 pb-8 pointer-events-none">
                <nav className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 px-4 py-4 flex justify-between items-center w-full rounded-[2.5rem] pointer-events-auto shadow-2xl">
                    <NavButton icon="fa-trophy" label={t('ranking')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                    <NavButton icon="fa-rocket" label={t('toolkit')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                    <button onClick={() => setView(AppView.HOME)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 border-4 border-slate-950 scale-110' : 'bg-white/5'}`}><BdaiLogo className="w-8 h-8" /></button>
                    <NavButton icon="fa-passport" label={t('passport')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                    <NavButton icon="fa-shopping-bag" label={t('shop')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                </nav>
            </div>
            {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language} onUpdateUser={setUser} onSelectOwnKey={handleOpenSelectKey} />}
          </>
      )}
    </div>
  );
}
