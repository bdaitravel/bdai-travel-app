
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES, Badge, TravelerRank } from './types';
import { generateToursForCity, generateAudio } from './services/geminiService';
import { CityCard } from './components/CityCard';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { SchematicMap } from './components/SchematicMap';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Onboarding } from './components/Onboarding';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { syncUserProfile } from './services/supabaseClient';

// --- AUDIO UTILS ---
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
  en: { welcome: "Hello,", explore: "Explore", toolkit: "Hub", passport: "Visa", shop: "Store", ranking: "Elite", searchPlaceholder: "Search any city...", login: "Issue Passport", tagline: "better destinations by ai", emailLabel: "Email", nameLabel: "Name", verifyTitle: "Verify Identity", verifyDesc: "Code sent to", verifyBtn: "Confirm", resend: "Resend", routes: "Routes", community: "Social", spots: "Photo Spots", viral: "Popularity", completion: "Completion", badges: "Top Badges", share: "Share & Earn", shareMsg: "Sharing my trip with #bdaitravel" },
  es: { welcome: "Hola,", explore: "Explorar", toolkit: "Hub", passport: "Visa", shop: "Store", ranking: "Elite", searchPlaceholder: "Busca cualquier ciudad...", login: "Emitir Pasaporte", tagline: "better destinations by ai", emailLabel: "Email", nameLabel: "Nombre", verifyTitle: "Verificar Identidad", verifyDesc: "Código enviado a", verifyBtn: "Confirmar", resend: "Reenviar", routes: "Rutas", community: "Social", spots: "Spots Fotos", viral: "Viralidad", completion: "Completado", badges: "Mejores Logros", share: "Compartir y Ganar", shareMsg: "Explorando el mundo con #bdaitravel" },
  ca: { welcome: "Hola,", explore: "Explorar", toolkit: "Hub", passport: "Visa", shop: "Store", ranking: "Elite", searchPlaceholder: "Cerca qualsevol ciutat...", login: "Emetre Passaport", tagline: "better destinations by ai", emailLabel: "Email", nameLabel: "Nom", verifyTitle: "Verificar Identitat", verifyDesc: "Codi enviat a", verifyBtn: "Confirmar", resend: "Reenviar", routes: "Rutes", community: "Social", spots: "Spots Fotos", viral: "Viralitat", completion: "Completat", badges: "Millors Logros", share: "Compartir i Guanyar", shareMsg: "Explorant el món amb #bdaitravel" },
  eu: { welcome: "Kaixo,", explore: "Esploratu", toolkit: "Hub", passport: "Visa", shop: "Denda", ranking: "Elite", searchPlaceholder: "Bilatu edozein hiri...", login: "Pasaportea jaulki", tagline: "better destinations by ai", emailLabel: "Email", nameLabel: "Izena", verifyTitle: "Identitatea egiaztatu", verifyDesc: "Kodea bidalita hona:", verifyBtn: "Baieztatu", resend: "Berriz bidali", routes: "Ibilbideak", community: "Soziala", spots: "Argazki Lekuak", viral: "Ospea", completion: "Osatua", badges: "Lorpen Nagusiak", share: "Partekatu eta Irabazi", shareMsg: "#bdaitravel-ekin mundua esploratzen" },
  fr: { welcome: "Bonjour,", explore: "Explorer", toolkit: "Hub", passport: "Visa", shop: "Boutique", ranking: "Élite", searchPlaceholder: "Chercher une ville...", login: "Délivrer Passeport", tagline: "better destinations by ai", emailLabel: "E-mail", nameLabel: "Nom", verifyTitle: "Vérifier Identité", verifyDesc: "Code envoyé à", verifyBtn: "Confirmer", resend: "Renvoyer", routes: "Itinéraires", community: "Social", spots: "Coins Photos", viral: "Popularité", completion: "Terminé", badges: "Top Badges", share: "Partager & Gagner", shareMsg: "J'explore le monde avec #bdaitravel" },
};

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

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'Marco Polo', username: 'marco', avatar: 'https://i.pravatar.cc/150?u=1', miles: 45000, rank: 1, isPublic: true },
  { id: '2', name: 'Ibn Battuta', username: 'ibn', avatar: 'https://i.pravatar.cc/150?u=2', miles: 38000, rank: 2, isPublic: true },
  { id: '3', name: 'Amelia Earhart', username: 'amelia', avatar: 'https://i.pravatar.cc/150?u=3', miles: 32000, rank: 3, isPublic: true },
  { id: '4', name: 'Nellie Bly', username: 'nellie', avatar: 'https://i.pravatar.cc/150?u=4', miles: 28000, rank: 4, isPublic: true },
  { id: '5', name: 'Ernest Shackleton', username: 'ernest', avatar: 'https://i.pravatar.cc/150?u=5', miles: 25000, rank: 5, isPublic: true },
];

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [loginStep, setLoginStep] = useState<'FORM' | 'VERIFY'>('FORM');
  const [cityTab, setCityTab] = useState<'routes' | 'community'>('routes');
  const [searchVal, setSearchVal] = useState('');
  const [user, setUser] = useState<UserProfile>({
    id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: '', email: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, visitedCities: [], completedTours: [], stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, badges: [], passportNumber: '', joinDate: new Date().toLocaleDateString()
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
    if (user.isLoggedIn && user.id !== 'guest') {
      syncUserProfile(user).catch(err => console.error("Sync failed:", err));
    }
  }, [user.miles, user.visitedCities, user.isLoggedIn]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS Access Denied")
      );
    }
  }, []);

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setAudioPlayingId(null);
      return;
    }
    setAudioLoadingId(id);
    try {
      const base64 = await generateAudio(text);
      if (!base64) throw new Error("Audio empty");
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bytes = decodeBase64(base64);
      const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
      if (audioSourceRef.current) audioSourceRef.current.stop();
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setAudioPlayingId(null);
      source.start();
      audioSourceRef.current = source;
      setAudioPlayingId(id);
    } catch (e) {
      console.error(e);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const handleCheckIn = (stopId: string, reward: number) => {
    if (!activeTour) return;
    const updatedTour = { ...activeTour };
    const stop = updatedTour.stops.find(s => s.id === stopId);
    if (stop && !stop.visited) {
      stop.visited = true;
      setActiveTour(updatedTour);
      setUser(prev => ({ 
        ...prev, 
        miles: prev.miles + reward, 
        visitedCities: selectedCity && !prev.visitedCities.includes(selectedCity) ? [...prev.visitedCities, selectedCity] : prev.visitedCities
      }));
    }
  };

  const handleShareExperience = async () => {
    const shareData = { title: 'bdai travel', text: t('shareMsg'), url: window.location.href };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            setUser(prev => ({ ...prev, miles: prev.miles + 150 }));
        } else {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`, '_blank');
        }
    } catch (e) { console.warn("Sharing cancelled"); }
  };

  const handleCitySelect = async (city: string) => {
    setSelectedCity(city);
    setCityTab('routes');
    setIsLoading(true);
    setView(AppView.CITY_DETAIL);
    try {
        const gen = await generateToursForCity(city, user.language);
        setTours(gen || []);
    } catch (e) { 
        console.error(e);
        alert("Error generating tours. Please try another city.");
        setView(AppView.HOME);
    } finally { setIsLoading(false); }
  };

  const finalizeLogin = () => {
    const generatedId = `bdai_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    setUser(prev => ({
        ...prev,
        id: generatedId,
        isLoggedIn: true,
        name: `${prev.firstName} ${prev.lastName}`,
        username: prev.firstName.toLowerCase() + Math.floor(Math.random()*100),
        passportNumber: `XP-${Math.floor(Math.random()*9000)+1000}-BDAI`
    }));
    setView(AppView.WELCOME);
  };

  if (view === AppView.LOGIN) return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-8 relative overflow-hidden font-sans">
          <div className="absolute top-12 left-0 right-0 flex justify-center gap-6 px-6 z-50">
              {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setUser(p => ({...p, language: l.code}))} className="flex flex-col items-center gap-2 group transition-all">
                      <div className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${user.language === l.code ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/20' : 'border-white/10 opacity-30 group-hover:opacity-60'}`}>
                        <FlagIcon code={l.code} className="w-full h-full object-cover" />
                      </div>
                  </button>
              ))}
          </div>

          <div className="text-center mb-12 animate-fade-in mt-20">
              <BdaiLogo className="w-32 h-32 mx-auto mb-2 opacity-90" />
              <h1 className="text-6xl font-black text-white lowercase tracking-tighter">bdai</h1>
              <p className="text-purple-400 text-[7.5px] font-bold uppercase tracking-[0.8em] opacity-40 mt-1">{t('tagline')}</p>
          </div>

          <div className="w-full max-w-xs transition-all duration-500">
              {loginStep === 'FORM' ? (
                  <form onSubmit={(e) => { e.preventDefault(); setLoginStep('VERIFY'); }} className="space-y-4 animate-slide-up">
                      <input type="text" required value={user.firstName} onChange={e => setUser({...user, firstName: e.target.value})} placeholder={t('nameLabel')} className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-4 px-6 text-white outline-none focus:border-purple-500/50 transition-colors text-sm" />
                      <input type="email" required value={user.email} onChange={e => setUser({...user, email: e.target.value})} placeholder={t('emailLabel')} className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-4 px-6 text-white outline-none focus:border-purple-500/50 transition-colors text-sm" />
                      <button type="submit" className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all mt-6 text-[10px]">{t('login')}</button>
                  </form>
              ) : (
                  <form onSubmit={(e) => { e.preventDefault(); finalizeLogin(); }} className="space-y-6 animate-slide-up text-center">
                      <h2 className="text-2xl font-black text-white">{t('verifyTitle')}</h2>
                      <p className="text-[11px] text-slate-500">{t('verifyDesc')} <span className="text-purple-400 font-bold">{user.email}</span></p>
                      <input type="text" maxLength={4} autoFocus className="w-40 bg-white/5 border-2 border-purple-500/20 rounded-[2rem] py-4 text-center text-4xl font-black tracking-[0.5em] text-white outline-none focus:border-purple-500/50" placeholder="0000" />
                      <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-[10px]">{t('verifyBtn')}</button>
                  </form>
              )}
          </div>
      </div>
  );

  if (view === AppView.WELCOME) return <Onboarding onComplete={() => setView(AppView.HOME)} language={user.language} onLanguageSelect={(l) => setUser(p => ({...p, language: l}))} />;

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-950 flex flex-col shadow-2xl relative overflow-hidden font-sans text-white">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {view === AppView.HOME && (
            <div className="space-y-8 pt-safe animate-fade-in px-6">
                <header className="flex justify-between items-center pt-6">
                    <div className="flex items-center gap-2"><BdaiLogo className="w-10 h-10"/><span className="font-heading font-black text-3xl lowercase tracking-tighter">bdai</span></div>
                    <button onClick={() => setView(AppView.PROFILE)} className="w-12 h-12 rounded-full border-2 border-purple-500 overflow-hidden shadow-lg"><img src={user.avatar} className="w-full h-full object-cover" /></button>
                </header>
                <div>
                    <h1 className="text-5xl font-heading font-black mb-6 leading-none tracking-tighter">{t('welcome')} <br/><span className="text-purple-400">{user.firstName || 'Explorador'}.</span></h1>
                    <div className="relative">
                        <i className="fas fa-search absolute left-5 top-5 text-slate-500"></i>
                        <input 
                            type="text" 
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchVal.trim() && handleCitySelect(searchVal.trim())}
                            placeholder={t('searchPlaceholder')} 
                            className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white outline-none focus:border-purple-500 transition-all" 
                        />
                    </div>
                </div>
            </div>
          )}

          {view === AppView.CITY_DETAIL && (
            <div className="pt-safe px-6 animate-fade-in flex flex-col min-h-full">
                <header className="flex items-center gap-4 mb-6 py-4 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
                    <button onClick={() => setView(AppView.HOME)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90"><i className="fas fa-arrow-left"></i></button>
                    <div><p className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-1">bdai explorer</p><h2 className="text-3xl font-black leading-none">{selectedCity}</h2></div>
                </header>

                <div className="flex bg-white/5 p-2 rounded-3xl mb-8 border border-white/10">
                    <button onClick={() => setCityTab('routes')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${cityTab === 'routes' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-500'}`}>{t('routes')}</button>
                    <button onClick={() => setCityTab('community')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${cityTab === 'community' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-500'}`}>{t('community')}</button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500"><i className="fas fa-compass fa-spin text-4xl mb-6 text-purple-500"></i><p className="font-black uppercase text-[11px] tracking-widest">IA Processing...</p></div>
                ) : (
                    <div className="space-y-6 pb-12">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); setCurrentStopIndex(0); setView(AppView.TOUR_ACTIVE);}} isPlayingAudio={audioPlayingId === tour.id} isAudioLoading={audioLoadingId === tour.id} onPlayAudio={handlePlayAudio} isFavorite={false} onToggleFavorite={() => {}} />)}</div>
                )}
            </div>
          )}

          {view === AppView.TOUR_ACTIVE && activeTour && (
            <div className="h-full flex flex-col bg-white overflow-hidden text-slate-900">
                <div className="h-[45vh] w-full relative">
                    <SchematicMap stops={activeTour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} />
                    <button onClick={() => setView(AppView.CITY_DETAIL)} className="absolute top-6 left-6 z-[400] w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90"><i className="fas fa-times"></i></button>
                </div>
                <div className="flex-1 relative z-10 -mt-8 bg-white rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
                    <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} language={user.language} onNext={() => { if (currentStopIndex < activeTour.stops.length - 1) setCurrentStopIndex(prev => prev + 1); else setView(AppView.HOME); }} onPrev={() => { if (currentStopIndex > 0) setCurrentStopIndex(prev => prev - 1); }} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} onCheckIn={handleCheckIn} onShare={handleShareExperience} />
                </div>
            </div>
          )}
          
          {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={MOCK_LEADERBOARD} onUserClick={() => {}} language={user.language} />}
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
    </div>
  );
}

const NavButton = ({ icon, label, isActive, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${isActive ? 'text-purple-400' : 'text-slate-500'}`}>
        <i className={`fas ${icon} text-lg`}></i>
        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
);
