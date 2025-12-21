
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile, Tour, Stop, WalkLevel } from './types';
import { generateToursForCity, speakText } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { SchematicMap } from './components/SchematicMap';
import { ProfileModal } from './components/ProfileModal';
import { TravelServices } from './components/TravelServices';
import { Shop } from './components/Shop';
import { BdaiLogo } from './components/BdaiLogo';
import { Onboarding } from './components/Onboarding';
import { Leaderboard } from './components/Leaderboard';

// Helper de distancia Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Metros
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

export const FlagIcon = ({ code, className }: { code: string; className?: string }) => {
  const flagSources: Record<string, string> = {
    en: 'https://flagcdn.com/w80/gb.png',
    es: 'https://flagcdn.com/w80/es.png',
    fr: 'https://flagcdn.com/w80/fr.png',
    ca: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Catalonia.svg/120px-Flag_of_Catalonia.svg.png',
    eu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_the_Basque_Country.svg/120px-Flag_of_the_Basque_Country.svg.png'
  };
  const src = flagSources[code] || `https://flagcdn.com/w80/${code}.png`;
  return (
    <div className={`overflow-hidden rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-black/5 flex-shrink-0 bg-slate-100 ${className}`}>
      <img src={src} className="w-full h-full object-cover" alt={code} />
    </div>
  );
};

const UI_TEXT: any = {
    en: { welcome: "Your next", trip: "journey", search: "Search any city...", challenge: "Monthly Challenge", visits: "Visited Points", loading: "Curating your experience...", startBtn: "Start Adventure", toolkit: "Toolkit", hot: "Popular right now" },
    es: { welcome: "Tu próximo", trip: "viaje", search: "Busca cualquier ciudad...", challenge: "Desafío Mensual", visits: "Puntos Visitados", loading: "Curando tu experiencia...", startBtn: "Comenzar Aventura", toolkit: "Herramientas", hot: "Populares ahora" },
    ca: { welcome: "El teu proper", trip: "viatge", search: "Cerca qualsevol ciutat...", challenge: "Repte Mensual", visits: "Punts Visitats", loading: "Compondre la teva experiència...", startBtn: "Començar Aventura", toolkit: "Eines", hot: "Populares ara" },
    fr: { welcome: "Votre prochain", trip: "voyage", search: "Chercher une ville...", challenge: "Défi Mensuel", visits: "Points Visités", loading: "Préparation de l'expérience...", startBtn: "Commencer l'Aventure", toolkit: "Outils", hot: "Populaire en ce moment" },
    eu: { welcome: "Zure hurrengo", trip: "bidaia", search: "Bilatu edozein hiri...", challenge: "Hileroko Erronka", visits: "Bisitatutako Puntuak", loading: "Zure esperientzia prestatzen...", startBtn: "Abentura Hasi", toolkit: "Tresnak", hot: "Populares orain" }
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('tt_user_vfinal');
    return saved ? JSON.parse(saved) : {
      id: 'bdai-' + Math.random().toString(36).substr(2, 5),
      isLoggedIn: false, firstName: 'Viajero', lastName: 'bdai', name: 'Viajero', username: 'user',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=travel', language: 'es', gender: 'M',
      travelerType: 'Backpacker', walkLevel: 'Standard', age: 25, miles: 0, culturePoints: 0, 
      foodPoints: 0, photoPoints: 0, countryPoints: 0, rank: 'Turista', visitedCities: [], 
      visitedCountries: [], badges: [], joinDate: '2024', isPublic: true
    };
  });

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [timeAvailable, setTimeAvailable] = useState('4 hours');
  const [intent, setIntent] = useState('Discovering secrets');
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => { 
    localStorage.setItem('tt_user_vfinal', JSON.stringify(user)); 
  }, [user]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const t = UI_TEXT[user.language] || UI_TEXT['en'];

  const handleCitySearch = (city: string) => {
    if (!city.trim()) return;
    setSelectedCity(city);
    setCustomizing(true);
    setView(AppView.CITY_DETAIL);
  };

  const startAIGeneration = async () => {
    if (!selectedCity) return;
    setIsLoading(true);
    setCustomizing(false);
    const result = await generateToursForCity(selectedCity, user, timeAvailable, intent);
    setTours(result);
    setIsLoading(false);
  };

  const processCheckIn = (stopId: string) => {
    const currentStop = activeTour?.stops[currentStopIndex];
    if (!currentStop || currentStop.visited) return;

    // Validación GPS estricta: Solo si está a menos de 150 metros
    if (userLocation) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, currentStop.latitude, currentStop.longitude);
        if (dist > 150) {
            alert(`GPS: Estás a ${Math.round(dist)}m. El límite es 150m. ¡Muévete un poco más cerca!`);
            return;
        }
    } else {
        alert("¡Error de GPS! No podemos validar tu posición actual para otorgarte las millas.");
        return;
    }
    
    const stopType = currentStop.type || 'culture';
    
    setUser(u => {
      let { culturePoints, foodPoints, photoPoints, miles, rank } = u;
      if (['historical', 'culture', 'art'].includes(stopType)) culturePoints += 150;
      if (stopType === 'food') foodPoints += 150;
      if (stopType === 'photo') photoPoints += 150;
      miles += 50;

      const total = culturePoints + foodPoints + photoPoints;
      if (total > 15000) rank = 'Leyenda';
      else if (total > 8000) rank = 'Globe-Trotter';
      else if (total > 3000) rank = 'Wanderer';
      else if (total > 800) rank = 'Explorador';

      return { ...u, culturePoints, foodPoints, photoPoints, miles, rank };
    });

    if (activeTour) {
        const newStops = [...activeTour.stops];
        newStops[currentStopIndex] = { ...newStops[currentStopIndex], visited: true };
        setActiveTour({ ...activeTour, stops: newStops });
    }
  };

  const renderView = () => {
    switch(view) {
        case AppView.HOME:
            return (
                <div className="pt-safe px-8 space-y-12 animate-fade-in pb-12">
                    <header className="flex justify-between items-center py-8">
                        <div className="flex items-center gap-3">
                            <BdaiLogo className="w-8 h-8" />
                            <span className="font-black text-2xl tracking-tighter lowercase text-slate-900">bdai</span>
                        </div>
                        <div onClick={() => setView(AppView.PROFILE)} className="flex items-center gap-3 bg-white p-2.5 pr-5 rounded-full border border-slate-100 cursor-pointer shadow-xl active:scale-95 transition-all">
                            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-slate-50 shadow-sm" />
                            <div>
                                <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest leading-none mb-1">{user.rank}</p>
                                <p className="text-[12px] font-black text-slate-900 leading-none">{user.miles.toLocaleString()} Millas</p>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tighter lowercase">
                                {t.welcome}<br/><span className="text-purple-600 font-black">{t.trip}</span>
                            </h2>
                            <div className="relative group shadow-2xl shadow-slate-200">
                                <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-lg group-focus-within:text-purple-600 transition-colors"></i>
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleCitySearch(searchQuery)} 
                                    placeholder={t.search} 
                                    className="w-full bg-white border-2 border-slate-50 rounded-[2rem] py-6 pl-14 pr-4 outline-none focus:ring-4 ring-purple-600/5 transition-all font-black text-base placeholder:text-slate-300" 
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] ml-2">{t.hot}</p>
                            <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-8 px-8 pb-4">
                                {[
                                    { city: 'París', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
                                    { city: 'Roma', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400' },
                                    { city: 'Tokyo', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400' }
                                ].map(c => (
                                    <div key={c.city} className="w-56 h-72 flex-shrink-0 relative rounded-[3rem] overflow-hidden group shadow-xl active:scale-95 transition-all cursor-pointer" onClick={() => handleCitySearch(c.city)}>
                                        <img src={c.img} className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-125" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-8 left-8">
                                            <h4 className="text-2xl font-black text-white tracking-tighter">{c.city}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group cursor-pointer border border-white/5" onClick={() => setView(AppView.LEADERBOARD)}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] -mr-16 -mt-16 group-hover:bg-purple-600/20 transition-all duration-1000"></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-purple-500 mb-4">{t.challenge}</p>
                        <h3 className="text-3xl font-black mb-8 tracking-tighter lowercase leading-tight">desafíos bdai<br/><span className="text-white/40">niveles mundiales</span></h3>
                        <div className="w-full h-2 bg-white/10 rounded-full mb-8 overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full w-[65%] shadow-[0_0_20px_rgba(168,85,247,0.8)]"></div>
                        </div>
                        <div className="flex justify-between items-center relative z-10">
                            <p className="text-[11px] text-white/40 font-black uppercase tracking-widest">Puntos: 3.420 / 5.000</p>
                            <i className="fas fa-chevron-right text-purple-500"></i>
                        </div>
                    </div>
                </div>
            );
        case AppView.CITY_DETAIL:
            return (
                <div className="pt-safe px-8 animate-fade-in pb-20">
                    <button onClick={() => setView(AppView.HOME)} className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-8 text-slate-300 shadow-xl border border-slate-50"><i className="fas fa-arrow-left text-base"></i></button>
                    <h2 className="text-5xl font-black tracking-tighter mb-12 lowercase text-slate-900">{selectedCity}</h2>
                    {customizing ? (
                        <div className="space-y-12">
                            <section>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 ml-2">Duración de ruta</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {['2 hours', '4 hours', 'Full Day', '2 Days'].map(d => (
                                        <button key={d} onClick={() => setTimeAvailable(d)} className={`py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest border-2 transition-all ${timeAvailable === d ? 'bg-slate-950 border-slate-950 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:border-purple-200'}`}>{d}</button>
                                    ))}
                                </div>
                            </section>
                            <section>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 ml-2">Nivel de esfuerzo</p>
                                <div className="grid grid-cols-3 gap-4">
                                    {['Lazy', 'Standard', 'Marathoner'].map(l => (
                                        <button key={l} onClick={() => setUser({...user, walkLevel: l as WalkLevel})} className={`py-6 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border-2 transition-all ${user.walkLevel === l ? 'bg-purple-600 border-purple-600 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-400'}`}>{l}</button>
                                    ))}
                                </div>
                            </section>
                            <button onClick={startAIGeneration} className="w-full py-7 bg-slate-950 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.6em] shadow-2xl shadow-purple-200/50 active:scale-95 transition-all mt-6">Generar con IA</button>
                        </div>
                    ) : isLoading ? (
                        <div className="py-40 text-center flex flex-col items-center">
                            <div className="w-14 h-14 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mb-12"></div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] animate-pulse">{t.loading}</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            {tours.map(tour => (
                                <TourCard key={tour.id} tour={tour} language={user.language} onSelect={() => {setActiveTour(tour); setCurrentStopIndex(0); setView(AppView.TOUR_ACTIVE);}} onPlayAudio={(id, text) => speakText(text, user.language)} />
                            ))}
                        </div>
                    )}
                </div>
            );
        case AppView.TOUR_ACTIVE:
            return activeTour ? (
                <div className="h-screen w-full flex flex-col bg-white animate-fade-in overflow-hidden">
                    <div className="h-[40vh] relative flex-shrink-0">
                        <SchematicMap stops={activeTour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} />
                        <button onClick={() => setView(AppView.CITY_DETAIL)} className="absolute top-8 left-8 z-[400] w-12 h-12 bg-white/95 backdrop-blur-xl rounded-full shadow-2xl flex items-center justify-center text-slate-500 border border-white hover:text-slate-900 transition-all"><i className="fas fa-times text-base"></i></button>
                    </div>
                    <div className="flex-1 relative z-10 -mt-12 bg-white rounded-t-[4rem] shadow-[0_-40px_80px_rgba(0,0,0,0.08)] overflow-hidden border-t border-slate-50">
                        <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} language={user.language} onNext={() => currentStopIndex < activeTour.stops.length - 1 ? setCurrentStopIndex(prev => prev + 1) : setView(AppView.HOME)} onPrev={() => currentStopIndex > 0 && setCurrentStopIndex(prev => prev - 1)} onPlayAudio={(id: string, text: string) => speakText(text, user.language)} onCheckIn={processCheckIn} />
                    </div>
                </div>
            ) : null;
        case AppView.PROFILE:
            return <ProfileModal user={user} onUpdate={(updated) => setUser(updated)} onClose={() => setView(AppView.HOME)} />;
        case AppView.LEADERBOARD:
            return <Leaderboard language={user.language} currentUser={user as any} />;
        case AppView.SHOP:
            return <Shop user={user} />;
        case AppView.UTILITIES:
            return <TravelServices language={user.language} />;
        default:
            return null;
    }
  };

  if (view === AppView.LOGIN) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-10 text-center relative overflow-hidden">
      <div className="absolute top-[-5%] right-[-10%] w-[80%] h-[60%] bg-purple-100/40 rounded-full blur-[140px] opacity-60"></div>
      <div className="absolute bottom-[-5%] left-[-10%] w-[80%] h-[60%] bg-amber-100/40 rounded-full blur-[140px] opacity-60"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm animate-fade-in">
        <div className="mb-16 animate-float">
          <BdaiLogo className="w-56 h-56 drop-shadow-[0_30px_60px_rgba(0,0,0,0.12)]" />
        </div>
        
        <div className="space-y-6 mb-24 w-full flex flex-col items-center">
          <h1 className="text-7xl font-black text-slate-950 tracking-tight lowercase leading-none">bdai</h1>
          <p className="text-slate-400 text-[11px] uppercase tracking-[0.7em] font-black whitespace-nowrap overflow-visible text-center">better destination by ai</p>
        </div>
        
        <button 
          onClick={() => setShowOnboarding(true)} 
          className="group relative w-full py-7 px-8 bg-slate-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl active:scale-[0.98] transition-all duration-500 hover:bg-slate-900 border border-white/10"
        >
          <span className="relative z-10 flex items-center justify-center gap-4">
            {t.startBtn}
            <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-3 transition-transform duration-500"></i>
          </span>
        </button>
        
        <div className="mt-20 text-slate-200 text-[10px] font-black uppercase tracking-[1em]">art of travel</div>
      </div>

      {showOnboarding && (
        <Onboarding 
          language={user.language} 
          onLanguageSelect={(l) => setUser(u => ({ ...u, language: l }))} 
          onComplete={() => { setShowOnboarding(false); setView(AppView.HOME); }} 
        />
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {renderView()}
      </div>

      <nav className="fixed bottom-10 left-8 right-8 bg-white/95 backdrop-blur-3xl px-10 py-6 flex justify-between items-center rounded-[3rem] shadow-[0_30px_80px_rgba(0,0,0,0.15)] z-50 border border-white/50">
        <div className="flex flex-col items-center gap-2 group cursor-pointer transition-all active:scale-90" onClick={() => setView(AppView.HOME)}>
            <i className={`fas fa-compass text-2xl transition-all duration-300 ${view === AppView.HOME ? 'text-purple-600 scale-125' : 'text-slate-200 group-hover:text-slate-400'}`}></i>
            <span className={`text-[8px] font-black uppercase tracking-widest ${view === AppView.HOME ? 'text-purple-600' : 'text-slate-300'}`}>Home</span>
        </div>
        <div className="flex flex-col items-center gap-2 group cursor-pointer transition-all active:scale-90" onClick={() => setView(AppView.UTILITIES)}>
            <i className={`fas fa-toolbox text-2xl transition-all duration-300 ${view === AppView.UTILITIES ? 'text-purple-600 scale-125' : 'text-slate-200 group-hover:text-slate-400'}`}></i>
            <span className={`text-[8px] font-black uppercase tracking-widest ${view === AppView.UTILITIES ? 'text-purple-600' : 'text-slate-300'}`}>Toolkit</span>
        </div>
        <div className="flex flex-col items-center gap-2 group cursor-pointer transition-all active:scale-90" onClick={() => setView(AppView.SHOP)}>
            <i className={`fas fa-shopping-bag text-2xl transition-all duration-300 ${view === AppView.SHOP ? 'text-purple-600 scale-125' : 'text-slate-200 group-hover:text-slate-400'}`}></i>
            <span className={`text-[8px] font-black uppercase tracking-widest ${view === AppView.SHOP ? 'text-purple-600' : 'text-slate-300'}`}>Shop</span>
        </div>
        <div className="flex flex-col items-center gap-2 group cursor-pointer transition-all active:scale-90" onClick={() => setView(AppView.LEADERBOARD)}>
            <i className={`fas fa-trophy text-2xl transition-all duration-300 ${view === AppView.LEADERBOARD ? 'text-purple-600 scale-125' : 'text-slate-200 group-hover:text-slate-400'}`}></i>
            <span className={`text-[8px] font-black uppercase tracking-widest ${view === AppView.LEADERBOARD ? 'text-purple-600' : 'text-slate-300'}`}>Rank</span>
        </div>
        <div className="flex flex-col items-center gap-2 group cursor-pointer transition-all active:scale-90" onClick={() => setView(AppView.PROFILE)}>
            <i className={`fas fa-id-badge text-2xl transition-all duration-300 ${view === AppView.PROFILE ? 'text-purple-600 scale-125' : 'text-slate-200 group-hover:text-slate-400'}`}></i>
            <span className={`text-[8px] font-black uppercase tracking-widest ${view === AppView.PROFILE ? 'text-purple-600' : 'text-slate-300'}`}>Pass</span>
        </div>
      </nav>
    </div>
  );
}
