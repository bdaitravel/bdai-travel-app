
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES, HubIntel, Stop } from './types';
import { generateToursForCity, generateAudio } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { FlagIcon } from './components/FlagIcon';
import { HubDetailModal } from './components/HubDetailModal';
import { getUserProfileByEmail, getGlobalRanking, sendOtpEmail, verifyOtpCode, supabase, getCachedTours, syncUserProfile } from './services/supabaseClient';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

function decodeBase64(base64: string) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) { return new Uint8Array(0); }
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all pointer-events-auto ${isActive ? 'text-purple-500 scale-110' : 'text-slate-500 opacity-50'}`}>
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const TRANSLATIONS: any = {
  en: { welcome: "Hello,", explorer: "Explorer", searchPlaceholder: "Search city...", login: "Issue Passport", verify: "Verify", tagline: "better destinations by ai", loading: "Accessing Archives..." },
  es: { welcome: "Hola,", explorer: "Explorador", searchPlaceholder: "Buscar ciudad...", login: "Emitir Pasaporte", verify: "Verificar", tagline: "better destinations by ai", loading: "Consultando Archivos..." },
  ca: { welcome: "Hola,", explorer: "Explorador", searchPlaceholder: "Cerca ciutat...", login: "Emetre Passaport", verify: "Validar", tagline: "better destinations by ai", loading: "Consultant Arxius..." },
  eu: { welcome: "Kaixo,", explorer: "Esploratzailea", searchPlaceholder: "Hiria bilatu...", login: "Pasaportea Lortu", verify: "Egiaztatu", tagline: "better destinations by ai", loading: "Artxiboak Kontsultatzen..." },
  fr: { welcome: "Bonjour,", explorer: "Explorateur", searchPlaceholder: "Chercher ville...", login: "Passeport", verify: "Vérifier", tagline: "better destinations by ai", loading: "Consultation..." }
};

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Explorer', 
  email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, birthday: '2000-01-01', 
  visitedCities: [], 
  completedTours: [], savedIntel: [], stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, 
  badges: [], joinDate: new Date().toLocaleDateString(), passportNumber: 'XP-TEMP-BDAI', city: '', country: ''
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [loginStep, setLoginStep] = useState<'FORM' | 'VERIFY'>('FORM');
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
  const [selectedHubIntel, setSelectedHubIntel] = useState<HubIntel | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        pos => setUserLocation({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        err => console.error("GPS Error:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const profile = await getUserProfileByEmail(session.user.email!);
            const finalUser = profile ? { ...profile, isLoggedIn: true } : { ...GUEST_PROFILE, id: session.user.id, email: session.user.email!, isLoggedIn: true };
            setUser(finalUser);
            localStorage.setItem('bdai_profile', JSON.stringify(finalUser));
            setView(AppView.HOME);
        }
    };
    checkSession();
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
    if (updatedUser.isLoggedIn) syncUserProfile(updatedUser);
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setAuthError("Introduce un email válido");
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      const { error } = await sendOtpEmail(email);
      if (error) {
        setAuthError(error.message === "Email rate limit exceeded" ? "Demasiados intentos. Espera 1 minuto." : "Error al enviar el código. Revisa el correo.");
      } else {
        setLoginStep('VERIFY');
      }
    } catch (e) {
      setAuthError("Error de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveHubIntel = () => {
    if (!selectedHubIntel) return;
    const currentSaved = Array.isArray(user.savedIntel) ? [...user.savedIntel] : [];
    const isAlreadySaved = currentSaved.some(i => i.id === selectedHubIntel.id);
    let updatedUser;
    if (isAlreadySaved) {
        updatedUser = { ...user, savedIntel: currentSaved.filter(i => i.id !== selectedHubIntel.id) };
    } else {
        const newIntelItem = { ...selectedHubIntel, savedAt: new Date().toISOString() };
        updatedUser = { ...user, savedIntel: [...currentSaved, newIntelItem], miles: (user.miles || 0) + 10 };
        setMilesToast({show: true, amount: 10, text: "Intel Archivado"});
        setTimeout(() => setMilesToast({show: false, amount: 0}), 2000);
    }
    handleUpdateProfile(updatedUser);
  };

  const handleCitySelect = async (cityInput: string) => {
    const city = cityInput.trim().split(' ')[0].replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    setSelectedCity(city);
    const cached = await getCachedTours(city, user.language);
    if (cached && cached.length > 0) {
        setTours(cached);
        setView(AppView.CITY_DETAIL);
        return; 
    }
    setIsLoading(true);
    setView(AppView.CITY_DETAIL);
    try {
        const res = await generateToursForCity(city, user);
        setTours(Array.isArray(res) ? res : []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleVisitStop = (stopId: string) => {
    if (!activeTour || !userLocation) {
        alert("Necesitas activar el GPS para verificar tu posición.");
        return;
    }
    const stop = activeTour.stops.find(s => s.id === stopId);
    if (!stop || stop.visited) return;
    const dist = getDistance(userLocation.lat, userLocation.lng, stop.latitude, stop.longitude);
    if (dist > 150) {
        alert(`Distancia: ${Math.round(dist)}m. Acércate al monumento para reclamar millas.`);
        return;
    }
    const totalReward = 50 + (stop.photoSpot?.milesReward || 0);
    const updatedTour = { ...activeTour, stops: activeTour.stops.map(s => s.id === stopId ? {...s, visited: true} : s) };
    setActiveTour(updatedTour);
    handleUpdateProfile({
        ...user,
        miles: (user.miles || 0) + totalReward,
        visitedCities: user.visitedCities.includes(activeTour.city) ? user.visitedCities : [...user.visitedCities, activeTour.city]
    });
    setMilesToast({show: true, amount: totalReward});
    setTimeout(() => setMilesToast({show: false, amount: 0}), 2000);
  };

  const handleVerifyOtp = async () => {
      setAuthError(null);
      setIsLoading(true);
      const { data, error } = await verifyOtpCode(email, otpCode);
      if (error) { setAuthError("Código incorrecto o caducado."); setIsLoading(false); return; }
      if (data.user || data.session) {
          const profile = await getUserProfileByEmail(email);
          const newUser = profile ? { ...profile, isLoggedIn: true } : { ...GUEST_PROFILE, id: data.user?.id || 'new', email: email, isLoggedIn: true };
          setUser(newUser);
          localStorage.setItem('bdai_profile', JSON.stringify(newUser));
          await syncUserProfile(newUser);
          setIsLoading(false);
          setView(AppView.HOME);
      }
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) {
        if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e){}
        setAudioPlayingId(null);
        return;
    }
    setAudioLoadingId(id);
    try {
        const base64 = await generateAudio(text, user.language);
        if (base64) {
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();
            if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e){}
            const buffer = await decodeAudioData(decodeBase64(base64), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => setAudioPlayingId(null);
            source.start(0);
            audioSourceRef.current = source;
            setAudioPlayingId(id);
        }
    } catch (e) {} finally { setAudioLoadingId(null); }
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-[#020617] flex flex-col shadow-2xl relative overflow-hidden text-slate-100 font-sans">
      
      {milesToast.show && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2000] animate-bounce pointer-events-none">
              <div className="bg-yellow-500 text-slate-950 px-6 py-3 rounded-full font-black text-xl shadow-[0_20px_60px_rgba(234,179,8,0.6)] border-4 border-white flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-plus"></i>
                    {milesToast.amount}
                    <span className="text-sm">Mi</span>
                  </div>
                  {milesToast.text && <p className="text-[8px] uppercase tracking-widest mt-1">{milesToast.text}</p>}
              </div>
          </div>
      )}

      {selectedHubIntel && (
          <HubDetailModal 
            intel={selectedHubIntel} 
            isSaved={user.savedIntel?.some(i => i.id === selectedHubIntel.id) || false}
            onClose={() => setSelectedHubIntel(null)}
            onSave={handleSaveHubIntel}
            language={user.language}
          />
      )}

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 bg-[#020617]">
              <div className="absolute top-12 flex gap-4 bg-white/5 backdrop-blur-xl p-2 rounded-full border border-white/10">
                  {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => setUser(p => ({...p, language: l.code}))} className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${user.language === l.code ? 'border-purple-500 scale-110' : 'border-transparent opacity-30 grayscale'}`}>
                        <FlagIcon code={l.code} className="w-full h-full object-cover" />
                      </button>
                  ))}
              </div>

              <div className="text-center mb-12 animate-fade-in flex flex-col items-center">
                  <BdaiLogo className="w-44 h-44 mb-6 drop-shadow-[0_0_40px_rgba(168,85,247,0.3)]" />
                  <h1 className="text-4xl font-black lowercase tracking-[-0.05em] text-white">bdai</h1>
                  <p className="text-purple-400 text-[8px] font-black uppercase tracking-[0.3em] opacity-60 mt-2">{t('tagline')}</p>
              </div>
              
              <div className="w-full space-y-4 max-w-xs z-10">
                  {authError && <p className="text-red-500 text-[10px] font-black uppercase mb-4 text-center animate-pulse">{authError}</p>}
                  
                  {loginStep === 'FORM' ? (
                      <>
                          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-center text-sm text-white focus:border-purple-500/50 transition-colors" />
                          <button disabled={isLoading} onClick={handleSendOtp} className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                            {isLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : t('login')}
                          </button>
                      </>
                  ) : (
                      <>
                          <input type="text" maxLength={8} placeholder="Código" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none text-center font-black text-sm text-purple-400 focus:border-purple-500" />
                          <button disabled={isLoading} onClick={handleVerifyOtp} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all disabled:opacity-50">
                            {isLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : t('verify')}
                          </button>
                          <button onClick={() => setLoginStep('FORM')} className="w-full text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4">Cambiar email</button>
                      </>
                  )}
              </div>
          </div>
      ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-36 z-10 relative bg-[#020617]">
                {view === AppView.HOME && (
                  <div className="space-y-4 pt-safe animate-fade-in">
                      <header className="flex justify-between items-center pt-8 px-8">
                          <div className="flex items-center gap-3">
                            <BdaiLogo className="w-10 h-10"/>
                            <span className="font-black text-2xl lowercase tracking-[-0.05em] text-white">bdai</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
                                <i className="fas fa-coins text-yellow-500 text-xs"></i>
                                <span className="text-xs font-black text-white">{user.miles.toLocaleString()}</span>
                            </div>
                            <button onClick={() => setView(AppView.PROFILE)} className="w-12 h-12 rounded-2xl border-2 border-purple-500/50 overflow-hidden bg-slate-900 shadow-xl active:scale-90 transition-transform">
                                <img src={user.avatar} className="w-full h-full object-cover" />
                            </button>
                          </div>
                      </header>
                      <div className="pt-8 px-8 mb-4">
                          <h1 className="text-4xl font-black leading-tight mb-8 font-heading text-white uppercase tracking-tighter">
                            {t('welcome')} <br/>
                            <span className="text-purple-600/40 truncate block mt-1">{user.firstName || t('explorer')}.</span>
                          </h1>
                          <div className="relative">
                            <i className="fas fa-search absolute left-6 top-6 text-slate-500"></i>
                            <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 pl-16 pr-8 outline-none text-white shadow-2xl focus:border-purple-500/50 transition-all" />
                          </div>
                      </div>
                      <TravelServices mode="HOME" language={user.language} onCitySelect={handleCitySelect} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe px-6 animate-fade-in">
                      <header className="flex items-center gap-4 mb-8 py-6 sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-20">
                          <button onClick={() => setView(AppView.HOME)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><i className="fas fa-arrow-left"></i></button>
                          <h2 className="text-3xl font-black font-heading truncate uppercase tracking-tighter text-white">{selectedCity}</h2>
                      </header>
                      {isLoading ? (
                          <div className="py-32 text-center text-slate-500 font-black uppercase text-[9px] tracking-[0.4em] animate-pulse">{t('loading')}</div>
                      ) : (
                          <div className="space-y-8 pb-12">
                            {tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0);}} language={user.language} />)}
                          </div>
                      )}
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(p => Math.min(activeTour.stops.length - 1, p + 1))} onPrev={() => setCurrentStopIndex(p => Math.max(0, p - 1))} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} language={user.language} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} onVisit={handleVisitStop} />
                )}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} />}
                {view === AppView.TOOLS && (
                  <div className="pt-safe animate-fade-in space-y-4">
                    <header className="px-8 pt-10 mb-6">
                        <h2 className="text-6xl font-black lowercase tracking-tighter text-white font-heading">hub</h2>
                        <div className="w-12 h-1 bg-purple-600 mt-2 rounded-full"></div>
                    </header>
                    <TravelServices mode="HUB" language={user.language} onCitySelect={handleCitySelect} onHubItemSelect={setSelectedHubIntel} />
                  </div>
                )}
                {view === AppView.SHOP && <Shop user={user} onPurchase={() => {}} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language} onUpdateUser={handleUpdateProfile} onLogout={() => { supabase.auth.signOut(); localStorage.removeItem('bdai_profile'); setView(AppView.LOGIN); }} />}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-8 pb-12 pointer-events-none">
                <nav className="bg-slate-900/95 backdrop-blur-3xl border border-white/10 px-6 py-5 flex justify-between items-center w-full rounded-[3rem] pointer-events-auto shadow-2xl">
                    <NavButton icon="fa-trophy" label="Elite" isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                    <NavButton icon="fa-compass" label="Hub" isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                    <button onClick={() => setView(AppView.HOME)} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-12 scale-110 shadow-lg rotate-45' : 'bg-white/5'}`}><div className={view === AppView.HOME ? '-rotate-45' : ''}><BdaiLogo className="w-8 h-8" /></div></button>
                    <NavButton icon="fa-id-card" label="Visa" isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                    <NavButton icon="fa-shopping-bag" label="Store" isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                </nav>
            </div>
          </>
      )}
    </div>
  );
}
