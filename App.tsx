
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, generateStopDetails, generateAudio, translateTourObject, LANGUAGE_NAMES } from './services/geminiService';
import { CityCard } from './components/CityCard';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { SchematicMap } from './components/SchematicMap';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Onboarding } from './components/Onboarding';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 

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
  en: {
    welcome: "Hello,", guest: "Traveler", whereTo: "Where are we going today?",
    explore: "Explore", passport: "Passport", shop: "Shop", utilities: "Tools",
    ranking: "Ranking", searchPlaceholder: "Any city in the world...",
    login: "Create Passport", continueGuest: "Explore as Guest",
    nudge: "You are a Guest. Register to save your miles!",
    spain: "Spain Highlights", europe: "Europe Classics", world: "Global Explorations",
    miles: "Miles", tagline: "better destinations by ai", smartTravel: "smart travel",
    selectLang: "Language", analyze: "Analyzing city with AI...",
    resultsFor: "Tours in", start: "Start", translating: "Translating content...",
    madridDesc: "Center & Royalty", bcnDesc: "Gaudí & Sea", sevillaDesc: "Art & Blossom",
    nyDesc: "The Big Apple", tokyoDesc: "Future & Tradition", romeDesc: "Eternal History",
    guestBio: "Exploring the world as a guest traveler.",
    mobility: "Local Mobility Guide", apps: "Best Apps", public: "Public Transport",
    topExplorers: "Top Explorers", viewRanking: "View Ranking"
  },
  es: {
    welcome: "Hola,", guest: "Viajero", whereTo: "¿A dónde vamos hoy?",
    explore: "Explorar", passport: "Pasaporte", shop: "Tienda", utilities: "Herramientas",
    ranking: "Ranking", searchPlaceholder: "Cualquier ciudad del mundo...",
    login: "Crear Pasaporte", continueGuest: "Explorar como Invitado",
    nudge: "Estás como invitado. ¡Regístrate para guardar tus millas!",
    spain: "Joyas de España", europe: "Clásicos de Europa", world: "Exploración Global",
    miles: "Millas", tagline: "better destinations by ai", smartTravel: "viajes inteligentes",
    selectLang: "Idioma", analyze: "Analizando la ciudad con IA...",
    resultsFor: "Tours en", start: "Empezar", translating: "Traduciendo contenido...",
    madridDesc: "Centro y Realeza", bcnDesc: "Gaudí y Mar", sevillaDesc: "Arte y Azahar",
    nyDesc: "La Gran Manzana", tokyoDesc: "Futuro y Tradición", romeDesc: "Historia Eterna",
    guestBio: "Explorando el mundo como invitado.",
    mobility: "Guía de Movilidad Local", apps: "Apps Sugeridas", public: "Transporte Público",
    topExplorers: "Top Exploradores", viewRanking: "Ver Ranking"
  }
};

export const FlagIcon = ({ code, className = "w-6 h-4" }: { code: string, className?: string }) => {
    switch(code) {
        case 'es': return ( <svg viewBox="0 0 750 500" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="750" height="500" fill="#c60b1e"/><rect width="750" height="250" y="125" fill="#ffc400"/></svg> );
        case 'en': return ( <svg viewBox="0 0 741 390" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="741" height="390" fill="#fff"/><path d="M0 0h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0z" fill="#b22234"/><rect width="296" height="210" fill="#3c3b6e"/></svg> );
        case 'ca': return ( <svg viewBox="0 0 9 6" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="9" height="6" fill="#FCDD09"/><path d="M0 1h9M0 2.33h9M0 3.66h9M0 5h9" stroke="#DA121A" strokeWidth="0.66"/></svg> );
        case 'eu': return ( <svg viewBox="0 0 280 160" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="280" height="160" fill="#D31027"/><path d="M0 0l280 160M0 160L280 0" stroke="#009543" strokeWidth="20"/><path d="M140 0v160M0 80h280" stroke="#FFF" strokeWidth="16"/></svg> );
        case 'fr': return ( <svg viewBox="0 0 3 2" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="1" height="2" fill="#002395"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#ed2939"/></svg> );
        case 'de': return ( <svg viewBox="0 0 5 3" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="5" height="1" fill="#000"/><rect width="5" height="1" y="1" fill="#d00"/><rect width="5" height="1" y="2" fill="#ffce00"/></svg> );
        case 'pt': return ( <svg viewBox="0 0 3 2" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="1.2" height="2" fill="#060"/><rect width="1.8" height="2" x="1.2" fill="#f00"/><circle cx="1.2" cy="1" r="0.3" fill="#ff0"/></svg> );
        case 'ja': return ( <svg viewBox="0 0 3 2" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="3" height="2" fill="#fff"/><circle cx="1.5" cy="1" r="0.6" fill="#bc002d"/></svg> );
        case 'zh': return ( <svg viewBox="0 0 3 2" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="3" height="2" fill="#ee1c25"/><circle cx="0.5" cy="0.5" r="0.2" fill="#ffff00"/></svg> );
        case 'ar': return ( <svg viewBox="0 0 3 2" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="3" height="2" fill="#000"/><rect width="3" height="0.66" y="0.66" fill="#f00"/><rect width="3" height="0.66" y="1.33" fill="#fff"/><rect width="1" height="2" fill="#f00"/></svg> );
        default: return <div className={`${className} bg-slate-200 rounded-sm`}></div>;
    }
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u2', name: 'Elena Sky', username: 'elenasky', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', miles: 5420, rank: 1, isPublic: true },
  { id: 'u3', name: 'Marc Port', username: 'marcworld', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', miles: 4100, rank: 2, isPublic: true },
  { id: 'u4', name: 'Sofia Sun', username: 'sofiasun', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', miles: 3850, rank: 3, isPublic: true },
];

const getCitiesByContinent = (t: any) => ({
  spain: [
    { name: 'Madrid', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=600&q=80', desc: "Centro y Realeza" },
    { name: 'Barcelona', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=600&q=80', desc: "Gaudí y Mar" },
    { name: 'Sevilla', image: 'https://images.unsplash.com/photo-1621590393529-6330364e9766?auto=format&fit=crop&w=600&q=80', desc: "Arte y Azahar" }
  ],
  world: [
    { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80', desc: "The Big Apple" },
    { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80', desc: "Futuro y Tradición" },
    { name: 'Roma', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80', desc: "Historia Eterna" }
  ]
});

const GUEST_USER: UserProfile = {
  id: 'guest', isLoggedIn: false, firstName: 'Invitado', lastName: 'bdai', name: 'Invitado', username: 'guest', email: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', language: 'es', miles: 0, rank: 'Turista', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: 'Explorando el mundo como invitado.', age: 25, visitedCities: [], completedTours: [], badges: [], passportNumber: 'TEMP-0000', joinDate: '01/01/2024'
};

const SectionRow = ({ title, children }: { title: string, children?: React.ReactNode }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    return (
        <div className="px-6 mb-8 relative">
            <h3 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2 mb-4">
                <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                {title}
            </h3>
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory pt-2">
                {children}
            </div>
        </div>
    );
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<UserProfile>(GUEST_USER);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['es'])[key] || key;
  const citiesData = getCitiesByContinent(t);

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) {
        if (audioSourceRef.current) { audioSourceRef.current.stop(); audioSourceRef.current = null; }
        setAudioPlayingId(null);
        return;
    }
    if (audioPlayingId) { if (audioSourceRef.current) audioSourceRef.current.stop(); setAudioPlayingId(null); }
    setAudioLoadingId(id);
    try {
        const audioBase64 = await generateAudio(text);
        if (!audioBase64) throw new Error("No audio");
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        const bytes = decodeBase64(audioBase64);
        const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => { if (audioPlayingId === id) setAudioPlayingId(null); };
        source.start();
        audioSourceRef.current = source;
        setAudioPlayingId(id);
    } catch (e) { console.error(e); } finally { setAudioLoadingId(null); }
  };

  const handleCitySelect = async (city: string) => {
    setSelectedCity(city);
    setIsLoading(true);
    setView(AppView.CITY_DETAIL);
    try {
        const generated = await generateToursForCity(city, user.language);
        setTours(generated || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleTourSelect = (tour: Tour) => {
    setActiveTour(tour);
    setCurrentStopIndex(0);
    setView(AppView.TOUR_ACTIVE);
  };

  const setLanguage = (lang: string) => {
      setUser(prev => ({ ...prev, language: lang }));
  };

  if (view === AppView.LOGIN) return (
      <div className="h-screen w-full flex flex-col items-center justify-end bg-slate-950 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80" className="w-full h-full object-cover opacity-40 grayscale-[0.5]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          </div>
          <div className="absolute top-12 left-0 right-0 z-20 flex flex-wrap justify-center gap-2 px-4">
              {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.code)} className={`w-12 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${user.language === l.code ? 'bg-white border-white scale-110 shadow-lg' : 'bg-black/20 border-white/20 opacity-60'}`}>
                      <FlagIcon code={l.code} className="w-8 h-auto shadow-sm" />
                  </button>
              ))}
          </div>
          <div className="relative z-10 mb-16 animate-fade-in">
              <BdaiLogo className="w-24 h-24 mx-auto mb-4" />
              <h1 className="text-6xl font-black text-white lowercase tracking-tighter mb-1">bdai</h1>
              <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">{t('tagline')}</p>
          </div>
          <div className="relative z-10 w-full max-w-xs space-y-4 mb-12">
              <button onClick={() => setView(AppView.WELCOME)} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                  <i className="fas fa-passport text-purple-600"></i> {t('login')}
              </button>
              <button onClick={() => setView(AppView.HOME)} className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">
                  {t('continueGuest')}
              </button>
          </div>
      </div>
  );

  if (view === AppView.WELCOME) return <Onboarding onComplete={() => setView(AppView.HOME)} language={user.language} onLanguageSelect={setLanguage} />;
  
  if (view === AppView.TOUR_ACTIVE && activeTour) {
      return (
          <div className="h-screen w-full flex flex-col bg-white overflow-hidden animate-fade-in">
              <div className="h-[40vh] w-full relative">
                  <SchematicMap stops={activeTour.stops} currentStopIndex={currentStopIndex} />
                  <button onClick={() => setView(AppView.CITY_DETAIL)} className="absolute top-4 left-4 z-[400] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-900"><i className="fas fa-times"></i></button>
              </div>
              <div className="flex-1 relative z-10 -mt-8 bg-white rounded-t-[3rem] shadow-2xl overflow-hidden">
                <ActiveTourCard 
                  tour={activeTour}
                  currentStopIndex={currentStopIndex}
                  onNext={() => { if (currentStopIndex < activeTour.stops.length - 1) setCurrentStopIndex(prev => prev + 1); else setView(AppView.HOME); }}
                  onPrev={() => { if (currentStopIndex > 0) setCurrentStopIndex(prev => prev - 1); }}
                  language={user.language}
                  onCheckIn={(id, m) => setUser(p => ({...p, miles: p.miles + m}))}
                  onEnrichStop={async (id) => {
                      const stop = activeTour.stops.find(s => s.id === id);
                      if (!stop || stop.isRichInfo) return;
                      const rich = await generateStopDetails(stop.name, activeTour.city, user.language);
                      setActiveTour(prev => prev ? ({...prev, stops: prev.stops.map(s => s.id === id ? {...s, ...rich, isRichInfo: true} : s)}) : null);
                  }}
                  onPlayAudio={handlePlayAudio}
                  audioPlayingId={audioPlayingId}
                  audioLoadingId={audioLoadingId}
                />
              </div>
          </div>
      );
  }

  const isExploreActive = view === AppView.HOME || view === AppView.CITY_DETAIL;

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {view === AppView.HOME && (
            <div className="space-y-8 pt-safe animate-fade-in">
                <header className="flex justify-between items-center px-6 pt-6">
                    <div className="flex items-center gap-2">
                        <BdaiLogo className="w-8 h-8"/>
                        <span className="font-heading font-black text-2xl lowercase tracking-tighter">bdai</span>
                    </div>
                    <button onClick={() => setView(AppView.PROFILE)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md active:scale-90 transition-transform">
                        <img src={user.avatar} className="w-full h-full object-cover" alt="User avatar"/>
                    </button>
                </header>
                <div className="px-6">
                    <h1 className="text-4xl font-heading font-black mb-6 leading-none tracking-tighter">
                        {t('welcome')} <br/>
                        <span className="text-purple-600">{user.isLoggedIn ? user.firstName : t('guest')}.</span>
                    </h1>
                    <form onSubmit={(e) => { e.preventDefault(); if (searchQuery) handleCitySelect(searchQuery); }} className="relative">
                        <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 shadow-sm outline-none font-medium" />
                    </form>
                </div>

                <div className="px-6">
                    <div onClick={() => setView(AppView.LEADERBOARD)} className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 text-white flex items-center justify-between cursor-pointer shadow-lg active:scale-95 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl">
                                <i className="fas fa-trophy text-yellow-400"></i>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-0.5">{t('topExplorers')}</p>
                                <p className="font-black text-lg leading-tight">{MOCK_LEADERBOARD[0].name} (1º)</p>
                            </div>
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full">{t('viewRanking')}</span>
                    </div>
                </div>

                <SectionRow title={t('spain')}>
                    {citiesData.spain.map(c => <div key={c.name} className="w-64 flex-shrink-0 snap-center"><CityCard name={c.name} image={c.image} description={c.desc} onClick={() => handleCitySelect(c.name)}/></div>)}
                </SectionRow>
                <SectionRow title={t('world')}>
                    {citiesData.world.map(c => <div key={c.name} className="w-64 flex-shrink-0 snap-center"><CityCard name={c.name} image={c.image} description={c.desc} onClick={() => handleCitySelect(c.name)}/></div>)}
                </SectionRow>
            </div>
          )}
          {view === AppView.CITY_DETAIL && (
            <div className="pt-safe px-6 animate-fade-in">
                <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-slate-50/90 backdrop-blur-md z-10">
                    <button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                    <div>
                        <p className="text-[9px] font-black uppercase text-purple-600 tracking-widest mb-1">{t('resultsFor')}</p>
                        <h2 className="text-2xl font-black leading-none">{selectedCity}</h2>
                    </div>
                </header>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <i className="fas fa-spinner fa-spin text-3xl mb-4 text-purple-600"></i>
                        <p className="font-black uppercase text-[10px] tracking-widest">{t('analyze')}</p>
                    </div>
                ) : (
                    <>
                        {tours.length > 0 && tours[0].transportApps && (
                            <div className="mb-8 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm animate-slide-up">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-3 flex items-center gap-2">
                                    <i className="fas fa-taxi"></i> {t('mobility')}
                                </h4>
                                <div className="space-y-4">
                                    {tours[0].transportApps && tours[0].transportApps.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Apps</p>
                                            <div className="flex flex-wrap gap-2">
                                                {tours[0].transportApps.map(app => (
                                                    <span key={app} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700">{app}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {tours[0].publicTransport && (
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transporte Público</p>
                                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{tours[0].publicTransport}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="space-y-6 pb-12">
                            {tours.map(tour => (
                                <TourCard key={tour.id} tour={tour} onSelect={() => handleTourSelect(tour)} onPlayAudio={() => handlePlayAudio(tour.id, tour.description)} isPlayingAudio={audioPlayingId === tour.id} isAudioLoading={audioLoadingId === tour.id} isFavorite={false} onToggleFavorite={() => {}} />
                            ))}
                        </div>
                    </>
                )}
            </div>
          )}
          {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language} onUpdateUser={setUser} />}
          {view === AppView.SHOP && <Shop user={user} />}
          {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={MOCK_LEADERBOARD} onUserClick={() => {}} language={user.language} />}
          {view === AppView.UTILITIES && <TravelServices language={user.language} />}
      </div>
      
      {/* Redesigned Bottom Navigation Bar with Prominent Explore Button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-4 pb-6 flex justify-center pointer-events-none">
          <nav className="bg-white/95 backdrop-blur-2xl border border-slate-200/50 px-3 py-3 flex justify-between items-center w-full rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto">
              <div className="flex-1 flex justify-around items-center">
                  <NavButton icon="fa-trophy" label={t('ranking')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                  <NavButton icon="fa-tools" label={t('utilities')} isActive={view === AppView.UTILITIES} onClick={() => setView(AppView.UTILITIES)} />
              </div>

              {/* Central Featured Explore Button */}
              <div className="relative -mt-12 px-4">
                  <button 
                    onClick={() => setView(AppView.HOME)}
                    className={`group relative flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-500 transform active:scale-90 ${isExploreActive ? 'scale-110' : ''}`}
                  >
                      {/* Animated Rings */}
                      {isExploreActive && (
                          <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping"></div>
                      )}
                      
                      <div className={`relative z-10 w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition-all duration-500 overflow-hidden ${isExploreActive ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
                          <BdaiLogo className={`w-12 h-12 transition-all duration-500 ${isExploreActive ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'opacity-80'}`} />
                      </div>
                      
                      {/* Label under the logo */}
                      <span className={`mt-2 text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isExploreActive ? 'text-purple-600 opacity-100' : 'text-slate-400 opacity-0'}`}>
                          {t('explore')}
                      </span>
                  </button>
              </div>

              <div className="flex-1 flex justify-around items-center">
                  <NavButton icon="fa-passport" label={t('passport')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                  <NavButton icon="fa-shopping-bag" label={t('shop')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
              </div>
          </nav>
      </div>
    </div>
  );
}

const NavButton = ({ icon, label, isActive, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 w-12 transition-all duration-300 ${isActive ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-purple-100/50' : 'bg-transparent'}`}>
            <i className={`fas ${icon} text-base`}></i>
        </div>
        <span className="text-[6px] font-black uppercase tracking-[0.1em] leading-none text-center truncate w-full">{label}</span>
    </button>
);
