
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, generateAudio } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { SchematicMap } from './components/SchematicMap';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Onboarding } from './components/Onboarding';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { syncUserProfile, getUserProfileByEmail, getGlobalRanking } from './services/supabaseClient';

// --- UI COMPONENTS ---
const QuickCityBtn = ({ onClick, label, city, color }: any) => {
    const colors: any = {
        purple: 'from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30',
        indigo: 'from-indigo-600/20 to-blue-600/20 text-indigo-400 border-indigo-500/30',
        blue: 'from-blue-600/20 to-cyan-600/20 text-blue-400 border-blue-500/30',
        orange: 'from-orange-600/20 to-red-600/20 text-orange-400 border-orange-500/30',
        amber: 'from-amber-600/20 to-yellow-600/20 text-amber-400 border-amber-500/30',
        green: 'from-emerald-600/20 to-green-600/20 text-emerald-400 border-emerald-500/30',
        rose: 'from-rose-600/20 to-pink-600/20 text-rose-400 border-rose-500/30',
        cyan: 'from-cyan-600/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
    };
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-[2rem] bg-gradient-to-br border backdrop-blur-md transition-all active:scale-95 ${colors[color] || colors.purple}`}>
            <span className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">{label}</span>
            <span className="text-xs font-bold text-white whitespace-nowrap">{city}</span>
        </button>
    );
};

const NavButton = ({ icon, label, isActive, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-purple-500' : 'text-slate-500'}`}>
        <i className={`fas ${icon} text-lg`}></i>
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

export const FlagIcon = ({ code, className = "w-6 h-4" }: { code: string, className?: string }) => {
    switch(code) {
        case 'es': return ( <svg viewBox="0 0 750 500" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="750" height="500" fill="#c60b1e"/><rect width="750" height="250" y="125" fill="#ffc400"/></svg> );
        case 'en': return ( <svg viewBox="0 0 741 390" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="741" height="390" fill="#fff"/><path d="M0 0h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0z" fill="#b22234"/><rect width="296" height="210" fill="#3c3b6e"/></svg> );
        case 'ca': return ( <svg viewBox="0 0 9 6" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="9" height="6" fill="#FCDD09"/><path d="M0 1h9M0 2.33h9M0 3.66h9M0 5h9" stroke="#DA121A" strokeWidth="0.66"/></svg> );
        case 'eu': return ( <svg viewBox="0 0 280 160" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="280" height="160" fill="#D31027"/><path d="M0 0l280 160M0 160L280 0" stroke="#009543" strokeWidth="20"/><path d="M140 0v160M0 80h280" stroke="#FFF" strokeWidth="16"/></svg> );
        case 'fr': return ( <svg viewBox="0 0 3 2" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="1" height="2" fill="#002395"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#ed2939"/></svg> );
        default: return <div className={`${className} bg-slate-200 rounded-sm`}></div>;
    }
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const dataInt16 = new Int16Array(arrayBuffer);
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
  en: { 
    welcome: "Hello,", searchPlaceholder: "Search any city...", login: "Issue Passport", tagline: "better destinations by ai", emailLabel: "Email", nameLabel: "First Name", verifyTitle: "Identity Verification", verifyWarning: "Check your email or use 123456.", verifyBtn: "Confirm Identity", loading: "AI Processing...", back: "Back", start: "Start Tour", ranking: "Elite", toolkit: "Hub", passport: "Visa", shop: "Store",
    lblMadrid: "Royal", lblBarcelona: "Art", lblSevilla: "Magic", lblValencia: "Future", lblGranada: "Alhambra", lblBilbao: "Urban", lblMalaga: "Coast", lblSanSebastian: "Gastro"
  },
  es: { 
    welcome: "Hola,", searchPlaceholder: "Busca cualquier ciudad...", login: "Emitir Pasaporte", tagline: "better destinations by ai", emailLabel: "Email", nameLabel: "Nombre", verifyTitle: "Verificación de Identidad", verifyWarning: "Revisa tu email o usa el código 123456.", verifyBtn: "Confirmar Identidad", loading: "Procesando IA...", back: "Atrás", start: "Empezar", ranking: "Elite", toolkit: "Hub", passport: "Visa", shop: "Store",
    lblMadrid: "Real", lblBarcelona: "Arte", lblSevilla: "Magia", lblValencia: "Futuro", lblGranada: "Alhambra", lblBilbao: "Urbano", lblMalaga: "Costa", lblSanSebastian: "Gastro"
  }
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [loginStep, setLoginStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [otpCode, setOtpCode] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) return JSON.parse(saved);
    return {
      id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: '', email: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, visitedCities: [], completedTours: [], stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, badges: [], passportNumber: '', joinDate: new Date().toLocaleDateString()
    };
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (user.id !== 'guest') {
      localStorage.setItem('bdai_profile', JSON.stringify(user));
      syncUserProfile(user);
    }
  }, [user]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) {
      if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e) {} }
      setAudioPlayingId(null);
      return;
    }
    setAudioLoadingId(id);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContextRef.current.state === 'suspended') { await audioContextRef.current.resume(); }
      const base64 = await generateAudio(text, user.language);
      if (!base64) throw new Error("Audio generation failed");
      const bytes = decodeBase64(base64);
      const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
      if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e) {} }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setAudioPlayingId(null);
      source.start();
      audioSourceRef.current = source;
      setAudioPlayingId(id);
    } catch (e) { console.error("Audio Error:", e); } finally { setAudioLoadingId(null); }
  };

  const handleCheckIn = (stopId: string, miles: number) => {
    if (!activeTour) return;
    const updatedStops = activeTour.stops.map(s => s.id === stopId ? { ...s, visited: true } : s);
    setActiveTour({ ...activeTour, stops: updatedStops });
    setUser(prev => ({ ...prev, miles: prev.miles + miles }));
  };

  const finalizeLogin = async () => {
    setIsLoading(true);
    try {
      if (otpCode === '123456' || otpCode === '000000') {
          const existingProfile = await getUserProfileByEmail(user.email);
          if (existingProfile) {
            setUser({ ...existingProfile, isLoggedIn: true, language: user.language });
            setView(AppView.HOME);
          } else {
            const newUser: UserProfile = { ...user, id: `u_${Date.now()}`, isLoggedIn: true, name: `${user.firstName} ${user.lastName}`.trim() || 'Explorer', username: user.email.split('@')[0], rank: 'Turist' };
            setUser(newUser);
            setView(AppView.WELCOME);
          }
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleCitySelect = async (city: string) => {
    if (!city) return;
    setSelectedCity(city);
    setIsLoading(true);
    setView(AppView.CITY_DETAIL);
    try {
        const gen = await generateToursForCity(city, user);
        setTours(gen);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-950 flex flex-col shadow-2xl relative overflow-hidden font-sans text-white">
      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-8 relative">
              <div className="absolute top-12 flex justify-center gap-4 z-50">
                  {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => setUser(p => ({...p, language: l.code}))} className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${user.language === l.code ? 'border-purple-500 scale-110 shadow-lg' : 'border-white/10 opacity-30'}`}>
                        <FlagIcon code={l.code} className="w-full h-full object-cover" />
                      </button>
                  ))}
              </div>
              <div className="text-center mb-12 animate-fade-in mt-10">
                  <BdaiLogo className="w-32 h-32 mx-auto mb-2 opacity-90" />
                  <h1 className="text-6xl font-black text-white lowercase tracking-tighter">bdai</h1>
                  <p className="text-purple-400 text-[7.5px] font-bold uppercase tracking-[0.8em] opacity-40 mt-1">{t('tagline')}</p>
              </div>
              <div className="w-full max-w-xs">
                  {loginStep === 'FORM' ? (
                      <form onSubmit={(e) => {e.preventDefault(); setLoginStep('VERIFY');}} className="space-y-4 animate-slide-up">
                          <input type="text" required value={user.firstName} onChange={e => setUser({...user, firstName: e.target.value})} placeholder={t('nameLabel')} className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-4 px-6 text-white outline-none focus:border-purple-500/50 transition-colors text-sm" />
                          <input type="email" required value={user.email} onChange={e => setUser({...user, email: e.target.value})} placeholder={t('emailLabel')} className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-4 px-6 text-white outline-none focus:border-purple-500/50 transition-colors text-sm" />
                          <button type="submit" className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all mt-6 text-[10px]">{t('login')}</button>
                      </form>
                  ) : (
                      <div className="space-y-6 animate-slide-up text-center">
                          <h2 className="text-2xl font-black text-white leading-tight">{t('verifyTitle')}</h2>
                          <p className="text-[10px] text-slate-500">{t('verifyWarning')}</p>
                          <form onSubmit={(e) => {e.preventDefault(); finalizeLogin();}} className="space-y-6">
                            <input type="text" maxLength={6} inputMode="numeric" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} autoFocus className="w-full bg-white/5 border-2 border-purple-500/20 rounded-[2rem] py-5 text-center font-black tracking-[0.2em] text-white outline-none focus:border-purple-500/50 shadow-inner text-5xl" placeholder="000000" />
                            <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-[10px]">{t('verifyBtn')}</button>
                          </form>
                      </div>
                  )}
              </div>
          </div>
      ) : view === AppView.WELCOME ? (
          <Onboarding onComplete={(interests) => { setUser(prev => ({ ...prev, interests })); setView(AppView.HOME); }} language={user.language} onLanguageSelect={(l) => setUser(p => ({...p, language: l}))} />
      ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32 z-10 relative">
                {view === AppView.HOME && (
                  <div className="space-y-8 pt-safe animate-fade-in px-6">
                      <header className="flex justify-between items-center pt-6">
                          <div className="flex items-center gap-2" onClick={() => window.location.reload()}><BdaiLogo className="w-10 h-10"/><span className="font-heading font-black text-3xl lowercase tracking-tighter">bdai</span></div>
                          <button onClick={() => setView(AppView.PROFILE)} className="w-12 h-12 rounded-full border-2 border-purple-500 overflow-hidden shadow-xl active:scale-90 transition-transform"><img src={user.avatar} className="w-full h-full object-cover" /></button>
                      </header>
                      <div className="relative z-10">
                          <div className="mb-8"><p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{t('tagline')}</p><h1 className="text-5xl font-heading font-black leading-tight tracking-tighter">{t('welcome')} <br/><span className="text-white/30">{user.firstName || 'Explorador'}.</span></h1></div>
                          <div className="relative group"><i className="fas fa-search absolute left-5 top-5 text-slate-500 group-focus-within:text-purple-500 transition-colors"></i><input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchVal.trim() && handleCitySelect(searchVal.trim())} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white outline-none focus:border-purple-500 focus:bg-white/10 transition-all shadow-2xl" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full animate-slide-up pb-10">
                          <QuickCityBtn onClick={() => handleCitySelect('Madrid')} label={t('lblMadrid')} city="Madrid 🏰" color="purple" />
                          <QuickCityBtn onClick={() => handleCitySelect('Barcelona')} label={t('lblBarcelona')} city="Barcelona 🎨" color="indigo" />
                          <QuickCityBtn onClick={() => handleCitySelect('Sevilla')} label={t('lblSevilla')} city="Sevilla 💃" color="blue" />
                          <QuickCityBtn onClick={() => handleCitySelect('Valencia')} label={t('lblValencia')} city="Valencia 🏖️" color="orange" />
                          <QuickCityBtn onClick={() => handleCitySelect('Granada')} label={t('lblGranada')} city="Granada 🕌" color="amber" />
                          <QuickCityBtn onClick={() => handleCitySelect('Bilbao')} label={t('lblBilbao')} city="Bilbao 🏗️" color="green" />
                          <QuickCityBtn onClick={() => handleCitySelect('Malaga')} label={t('lblMalaga')} city="Málaga ☀️" color="rose" />
                          <QuickCityBtn onClick={() => handleCitySelect('San Sebastian')} label={t('lblSanSebastian')} city="Donostia 🥘" color="cyan" />
                      </div>
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe px-6 animate-fade-in flex flex-col min-h-full">
                      <header className="flex items-center gap-4 mb-6 py-4 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10"><button onClick={() => setView(AppView.HOME)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90"><i className="fas fa-arrow-left"></i></button><div><p className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-1">bdai guide</p><h2 className="text-3xl font-black leading-none">{selectedCity}</h2></div></header>
                      {isLoading ? (
                          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500"><i className="fas fa-compass fa-spin text-4xl mb-6 text-purple-500"></i><p className="font-black uppercase text-[11px] tracking-widest">{t('loading')}</p></div>
                      ) : (
                          <div className="space-y-6 pb-12">
                            {tours.map(tour => (
                              <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); setView(AppView.TOUR_ACTIVE);}} onPlayAudio={handlePlayAudio} isPlayingAudio={audioPlayingId === tour.id} isAudioLoading={audioLoadingId === tour.id} language={user.language} />
                            ))}
                          </div>
                      )}
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <div className="h-full flex flex-col bg-white overflow-hidden text-slate-900">
                      <div className="h-[45vh] w-full relative"><SchematicMap stops={activeTour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} /><button onClick={() => setView(AppView.CITY_DETAIL)} className="absolute top-6 left-6 z-[400] w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90"><i className="fas fa-times"></i></button></div>
                      <div className="flex-1 relative z-10 -mt-8 bg-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
                          <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} language={user.language} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} onCheckIn={handleCheckIn} onShare={() => {}} onNext={() => { if (currentStopIndex < activeTour.stops.length - 1) setCurrentStopIndex(prev => prev + 1); else setView(AppView.HOME); }} onPrev={() => { if (currentStopIndex > 0) setCurrentStopIndex(prev => prev - 1); }} />
                      </div>
                  </div>
                )}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language} onUpdateUser={setUser} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={() => {}} />}
                {view === AppView.TOOLS && <TravelServices language={user.language} onCitySelect={handleCitySelect} />}
            </div>
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-6 pb-8 flex justify-center pointer-events-none">
                <nav className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 px-4 py-4 flex justify-between items-center w-full rounded-[3rem] shadow-2xl pointer-events-auto">
                    <NavButton icon="fa-trophy" label={t('ranking')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                    <NavButton icon="fa-rocket" label={t('toolkit')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                    <button onClick={() => setView(AppView.HOME)} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 ${view === AppView.HOME || view === AppView.CITY_DETAIL ? 'bg-purple-600 -mt-8 border-4 border-slate-950' : 'bg-white/5'}`}><BdaiLogo className="w-9 h-9" /></button>
                    <NavButton icon="fa-passport" label={t('passport')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                    <NavButton icon="fa-shopping-bag" label={t('shop')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                </nav>
            </div>
          </>
      )}
    </div>
  );
}
