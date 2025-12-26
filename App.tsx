
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, generateAudio } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { SchematicMap } from './components/SchematicMap';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Onboarding } from './components/Onboarding';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { CommunityBoard } from './components/CommunityBoard';
import { BdaiLogo } from './components/BdaiLogo'; 
import { syncUserProfile, getUserProfileByEmail, getGlobalRanking } from './services/supabaseClient';

const QuickCityBtn = ({ onClick, label, city, color }: any) => {
    const colors: any = {
        purple: 'from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30',
        indigo: 'from-indigo-600/20 to-blue-600/20 text-indigo-400 border-indigo-500/30',
        blue: 'from-blue-600/20 to-cyan-600/20 text-blue-400 border-blue-500/30',
        orange: 'from-orange-600/20 to-red-600/20 text-orange-400 border-orange-500/30'
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
        case 'es': return ( <svg viewBox="0 0 750 500" className={className}><rect width="750" height="500" fill="#c60b1e"/><rect width="750" height="250" y="125" fill="#ffc400"/></svg> );
        case 'en': return ( <svg viewBox="0 0 741 390" className={className}><rect width="741" height="390" fill="#fff"/><path d="M0 0h741v30H0zm0 60h741v30H0z" fill="#b22234"/><rect width="296" height="210" fill="#3c3b6e"/></svg> );
        case 'sw': return ( <div className={`${className} bg-red-600 flex flex-col`}><div className="flex-1 bg-black"></div><div className="flex-1 bg-green-600"></div></div> );
        default: return <div className={`${className} bg-slate-200 rounded-sm`}></div>;
    }
};

function decodeBase64(base64: string) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return audioBuffer;
}

const TRANSLATIONS: any = {
  en: { welcome: "Welcome Traveler,", searchPlaceholder: "Search any city...", login: "Issue Passport", verifyTitle: "Verification", verifySubtitle: "Use access code 123456 to verify." },
  es: { welcome: "Bienvenido Viajero,", searchPlaceholder: "Busca cualquier ciudad...", login: "Emitir Pasaporte", verifyTitle: "Verificación", verifySubtitle: "Usa el código 123456 para verificar." },
  sw: { welcome: "Karibu Msafiri,", searchPlaceholder: "Tafuta mji...", login: "Toa Pasipoti", verifyTitle: "Uthibitisho", verifySubtitle: "Tumia msimbo 123456." }
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
      id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: '', email: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, visitedCities: [], completedTours: [], stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, badges: [], personalPhotos: [], joinDate: new Date().toLocaleDateString()
    };
  });
  const [selectedCity, setSelectedCity] = useState<string>('Madrid');
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
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const handlePlayAudio = useCallback(async (id: string, text: string) => {
    if (audioPlayingId === id) {
      if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e) {}
      setAudioPlayingId(null);
      return;
    }
    setAudioLoadingId(id);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      
      const base64 = await generateAudio(text, user.language);
      if (!base64) throw new Error();
      
      const bytes = decodeBase64(base64);
      const buffer = await decodeAudioData(bytes, audioContextRef.current);
      
      if (audioSourceRef.current) try { audioSourceRef.current.stop(); } catch(e) {}
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setAudioPlayingId(null);
      source.start();
      audioSourceRef.current = source;
      setAudioPlayingId(id);
    } catch (e) { 
        console.error("Audio error");
    } finally { 
        setAudioLoadingId(null); 
    }
  }, [audioPlayingId, user.language]);

  const handleCitySelect = async (city: string) => {
    if (!city) return;
    setSelectedCity(city);
    setIsLoading(true);
    setView(AppView.CITY_DETAIL);
    try {
        const gen = await generateToursForCity(city, user);
        setTours(gen || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const finalizeLogin = async () => {
    if (otpCode === '123456') {
        const existing = await getUserProfileByEmail(user.email);
        if (existing) setUser({ ...existing, isLoggedIn: true });
        else setUser({ ...user, id: `u_${Date.now()}`, isLoggedIn: true, name: user.firstName || 'Explorer', personalPhotos: [] });
        setView(AppView.HOME);
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-950 flex flex-col shadow-2xl relative overflow-hidden text-white">
      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-8">
              <div className="absolute top-12 flex gap-4">
                  {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => setUser(p => ({...p, language: l.code}))} className={`w-8 h-8 rounded-full overflow-hidden border-2 ${user.language === l.code ? 'border-purple-500 shadow-lg' : 'border-white/10 opacity-30'}`}>
                        <FlagIcon code={l.code} className="w-full h-full object-cover" />
                      </button>
                  ))}
              </div>
              <div className="text-center mb-12 animate-fade-in">
                  <BdaiLogo className="w-24 h-24 mx-auto mb-4" />
                  <h1 className="text-5xl font-black lowercase tracking-tighter">bdai</h1>
                  <p className="text-purple-400 text-[8px] font-black uppercase tracking-[0.5em] mt-1 opacity-50">better destinations by ai</p>
              </div>
              <div className="w-full max-w-xs space-y-4">
                  {loginStep === 'FORM' ? (
                      <form onSubmit={(e) => {e.preventDefault(); setLoginStep('VERIFY');}} className="space-y-4 animate-slide-up">
                          <input type="text" required value={user.firstName} onChange={e => setUser({...user, firstName: e.target.value})} placeholder="Nombre" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm" />
                          <input type="email" required value={user.email} onChange={e => setUser({...user, email: e.target.value})} placeholder="Email" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm" />
                          <button type="submit" className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">{t('login')}</button>
                      </form>
                  ) : (
                      <div className="space-y-6 text-center animate-slide-up">
                          <h2 className="text-xl font-black">{t('verifyTitle')}</h2>
                          <p className="text-[10px] text-slate-500">{t('verifySubtitle')}</p>
                          <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full bg-white/5 border-2 border-purple-500/20 rounded-2xl py-5 text-center text-4xl font-black" placeholder="000000" />
                          <button onClick={finalizeLogin} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Confirmar</button>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                {view === AppView.HOME && (
                  <div className="space-y-8 pt-safe animate-fade-in px-6">
                      <header className="flex justify-between items-center pt-6">
                          <div className="flex items-center gap-2"><BdaiLogo className="w-8 h-8"/><span className="font-black text-2xl lowercase tracking-tighter">bdai</span></div>
                          <button onClick={() => setView(AppView.PROFILE)} className="w-10 h-10 rounded-full border-2 border-purple-500 overflow-hidden"><img src={user.avatar} className="w-full h-full object-cover" /></button>
                      </header>
                      <div>
                          <h1 className="text-4xl font-black leading-tight mb-6">{t('welcome')} <br/><span className="text-white/30">{user.firstName || 'Explorer'}.</span></h1>
                          <input type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchVal)} placeholder={t('searchPlaceholder')} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-purple-500 shadow-2xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pb-8">
                          <QuickCityBtn onClick={() => handleCitySelect('Madrid')} label="Royal" city="Madrid 🏰" color="purple" />
                          <QuickCityBtn onClick={() => handleCitySelect('Barcelona')} label="Art" city="Barcelona 🎨" color="indigo" />
                          <QuickCityBtn onClick={() => handleCitySelect('Sevilla')} label="Magic" city="Sevilla 💃" color="blue" />
                          <QuickCityBtn onClick={() => handleCitySelect('Valencia')} label="Future" city="Valencia 🏖️" color="orange" />
                      </div>
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe px-6 animate-fade-in">
                      <header className="flex items-center gap-4 mb-6 py-4"><button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><i className="fas fa-arrow-left"></i></button><h2 className="text-2xl font-black">{selectedCity}</h2></header>
                      {isLoading ? (
                          <div className="py-20 text-center text-slate-500"><i className="fas fa-spinner fa-spin text-2xl mb-4 text-purple-500"></i><p className="text-[10px] uppercase font-black tracking-widest">Generando Narrativa Local...</p></div>
                      ) : (
                          <div className="space-y-6 pb-12">
                            {(tours || []).map(tour => (
                              <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); setView(AppView.TOUR_ACTIVE);}} onPlayAudio={handlePlayAudio} isPlayingAudio={audioPlayingId === tour.id} isAudioLoading={audioLoadingId === tour.id} language={user.language} />
                            ))}
                          </div>
                      )}
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <div className="h-full flex flex-col bg-white overflow-hidden text-slate-900 animate-fade-in">
                      <div className="h-[40vh] w-full relative"><SchematicMap stops={activeTour.stops} currentStopIndex={currentStopIndex} /><button onClick={() => setView(AppView.CITY_DETAIL)} className="absolute top-6 left-6 z-[400] w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"><i className="fas fa-times"></i></button></div>
                      <div className="flex-1 relative z-10 -mt-6 bg-white rounded-t-[3rem] shadow-2xl overflow-hidden">
                          <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} language={user.language} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} onNext={() => setCurrentStopIndex(p => Math.min(p + 1, activeTour.stops.length - 1))} onPrev={() => setCurrentStopIndex(p => Math.max(p - 1, 0))} />
                      </div>
                  </div>
                )}
                {view === AppView.COMMUNITY && <div className="px-6 pt-10"><CommunityBoard city={selectedCity || 'Madrid'} language={user.language} user={user} /></div>}
                {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} language={user.language} />}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} language={user.language} onUpdateUser={setUser} />}
                {view === AppView.SHOP && <Shop user={user} onPurchase={() => {}} />}
                {view === AppView.TOOLS && <TravelServices language={user.language} onCitySelect={handleCitySelect} />}
            </div>
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-6 pb-8 pointer-events-none">
                <nav className="bg-slate-900/95 backdrop-blur-xl border border-white/10 px-4 py-4 flex justify-between items-center w-full rounded-[2.5rem] pointer-events-auto shadow-2xl">
                    <NavButton icon="fa-trophy" label="Elite" isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                    <NavButton icon="fa-users" label="Muro" isActive={view === AppView.COMMUNITY} onClick={() => setView(AppView.COMMUNITY)} />
                    <button onClick={() => setView(AppView.HOME)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-8 border-4 border-slate-950 shadow-purple-500/50' : 'bg-white/5'}`}><BdaiLogo className="w-8 h-8" /></button>
                    <NavButton icon="fa-passport" label="Visa" isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                    <NavButton icon="fa-shopping-bag" label="Shop" isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                </nav>
            </div>
          </>
      )}
    </div>
  );
}
