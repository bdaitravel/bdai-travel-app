
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LANGUAGES, TRANSLATIONS, TravelerRank, CityInfo } from './types';
import { generateToursForCity, generateAudio, getCityInfo } from './services/geminiService';
import { CityCard } from './components/CityCard';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { SchematicMap } from './components/SchematicMap';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Onboarding } from './components/Onboarding';
import { Shop } from './components/Shop'; 
import { BdaiLogo } from './components/BdaiLogo'; 

const INITIAL_USER: UserProfile = {
  id: 'u1', isLoggedIn: false, firstName: '', lastName: '', name: '', username: '', email: '', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', language: 'es', miles: 0, rank: 'Turista', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: true, bio: '', age: 0, badges: [], visitedCities: [], completedTours: []
};

const SPAIN_CITIES = [
  { name: 'Madrid', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=600&q=80', desc: 'La capital del Imperio.' },
  { name: 'Barcelona', image: 'https://images.unsplash.com/photo-1583997051654-820ce293b8c7?auto=format&fit=crop&w=600&q=80', desc: 'Arquitectura y Mediterráneo.' },
  { name: 'Sevilla', image: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=600&q=80', desc: 'Arte, sol y azahar.' },
  { name: 'Valencia', image: 'https://images.unsplash.com/photo-1597910037310-7ddd813c9e7a?auto=format&fit=crop&w=600&q=80', desc: 'Ciudad de las Ciencias.' },
  { name: 'Bilbao', image: 'https://images.unsplash.com/photo-1563288118-2e86e927622c?auto=format&fit=crop&w=600&q=80', desc: 'El corazón del norte.' }
];

const SectionRow = ({ title, children, markerColor = "bg-purple-500" }: any) => (
    <div className="space-y-4 mb-8">
        <div className="px-6 flex items-center gap-3">
            <div className={`w-1 h-6 ${markerColor} rounded-full`}></div>
            <h2 className="text-xl font-heading font-bold text-slate-900 tracking-tight">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar snap-x">
            {children}
        </div>
    </div>
);

export default function App() {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [tours, setTours] = useState<Tour[]>([]);
  const [cityInfo, setCityInfo] = useState<CityInfo | null>(null);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isLoadingTours, setIsLoadingTours] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', firstName: '', lastName: '', username: '', birthDate: '', isPublic: true });

  const t = (key: string) => {
      const dict = TRANSLATIONS[user.language] || TRANSLATIONS['es'];
      return dict[key] || TRANSLATIONS['es'][key] || key;
  };

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    const supportedLang = LANGUAGES.find(l => l.code === browserLang);
    if (supportedLang) {
        setUser(prev => ({ ...prev, language: supportedLang.code }));
    }
  }, []);

  const handleAuthSubmit = () => {
      setUser({ ...user, isLoggedIn: true, firstName: authForm.firstName || 'Viajero', lastName: authForm.lastName || 'Bdai', joinDate: '2024' });
      setView(AppView.WELCOME);
  };

  const handleCitySelect = async (city: string) => {
    setSelectedCity(city);
    setIsLoadingTours(true);
    setView(AppView.CITY_DETAIL);
    try {
        const [generatedTours, generatedInfo] = await Promise.all([ 
            generateToursForCity(city, user.language), 
            getCityInfo(city, user.language) 
        ]);
        setTours(generatedTours); 
        setCityInfo(generatedInfo);
    } finally { 
        setIsLoadingTours(false); 
    }
  };

  // Fixed: handleTourSelect was missing, causing errors when selecting tours in the city detail view
  const handleTourSelect = (tour: Tour) => {
    setActiveTour(tour);
    setCurrentStopIndex(0);
    setView(AppView.TOUR_ACTIVE);
  };

  const renderLogin = () => (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 relative bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 opacity-40">
              <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1080&q=80" className="w-full h-full object-cover" alt="Bkg"/>
          </div>
          <div className="relative z-10 w-full max-w-sm">
              <div className="flex flex-col items-center mb-8">
                  <BdaiLogo className="w-20 h-20 text-white mb-4" />
                  <h1 className="text-5xl font-black text-white lowercase">bdai</h1>
                  <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase">{t('heroSubtitle')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[2.5rem] shadow-2xl">
                   <div className="flex justify-between items-center mb-6">
                       <div className="flex bg-black/40 rounded-full p-1 w-44">
                           <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-full transition-all ${authMode === 'login' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>{t('login')}</button>
                           <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-full transition-all ${authMode === 'register' ? 'bg-white text-slate-900' : 'text-slate-300'}`}>{t('register')}</button>
                       </div>
                       <select value={user.language} onChange={(e) => setUser({...user, language: e.target.value})} className="bg-black/60 text-white text-[10px] font-bold py-2 px-3 rounded-full outline-none">
                           {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>)}
                       </select>
                   </div>
                   <div className="space-y-4">
                       {authMode === 'register' && (
                           <>
                               <input type="text" placeholder={t('namePlaceholder')} onChange={(e) => setAuthForm({...authForm, firstName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-white text-sm outline-none focus:border-white/50"/>
                               <input type="text" placeholder={t('surnamePlaceholder')} onChange={(e) => setAuthForm({...authForm, lastName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-white text-sm outline-none focus:border-white/50"/>
                           </>
                       )}
                       <input type="email" placeholder={t('emailPlaceholder')} className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-white text-sm outline-none focus:border-white/50"/>
                       <input type="password" placeholder={t('passPlaceholder')} className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-white text-sm outline-none focus:border-white/50"/>
                       <button onClick={handleAuthSubmit} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-2">
                           {authMode === 'login' ? t('signin') : t('createAccount')}
                       </button>
                   </div>
              </div>
          </div>
      </div>
  );

  const renderHome = () => (
    <div className="space-y-8 pb-24 pt-safe animate-fade-in">
        <header className="flex justify-between items-center px-6 pt-6">
            <div className="flex items-center gap-2">
                <BdaiLogo className="w-10 h-10" />
                <span className="font-heading font-bold text-xl text-slate-900 lowercase">bdai</span>
            </div>
            <div className="flex items-center gap-3">
                <select value={user.language} onChange={(e) => setUser({...user, language: e.target.value})} className="bg-white px-3 py-2 rounded-full shadow-sm border border-slate-100 text-xs font-bold uppercase">
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.code}</option>)}
                </select>
                <button onClick={() => setView(AppView.PROFILE)}>
                    <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover" alt="P"/>
                </button>
            </div>
        </header>

        <div className="px-6">
            <h1 className="text-4xl font-heading font-bold text-slate-900 leading-tight mb-2">
                {t('welcome')} <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">{user.firstName || t('traveler')}.</span>
            </h1>
            <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) handleCitySelect(searchQuery); }} className="relative mt-6">
                <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-800 focus:outline-none focus:border-purple-500 shadow-sm transition-all"/>
            </form>
        </div>

        <SectionRow title={t('spainDestinations')} markerColor="bg-yellow-400">
            {SPAIN_CITIES.map((city) => (
                <div key={city.name} className="w-60 flex-shrink-0 snap-center">
                    {/* Fixed: Removing 't' prop which is not defined in CityCardProps */}
                    <CityCard name={city.name} image={city.image} description={city.desc} onClick={() => handleCitySelect(city.name)} />
                </div>
            ))}
        </SectionRow>

        <div className="px-6 grid grid-cols-2 gap-4">
            <div onClick={() => setView(AppView.LEADERBOARD)} className="bg-yellow-50 p-5 rounded-[2rem] border border-yellow-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <i className="fas fa-trophy text-2xl text-yellow-600 mb-3"></i>
                <h3 className="font-bold text-slate-800 text-sm">{t('ranking')}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{user.miles} {t('miles')}</p>
            </div>
            <div onClick={() => setView(AppView.SHOP)} className="bg-purple-50 p-5 rounded-[2rem] border border-purple-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <i className="fas fa-shopping-bag text-2xl text-purple-600 mb-3"></i>
                <h3 className="font-bold text-slate-800 text-sm">{t('shop')}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{t('gearUp')}</p>
            </div>
        </div>
    </div>
  );

  if (view === AppView.LOGIN) return renderLogin();
  {/* Fixed: Removing 't' prop which is not defined in OnboardingProps */}
  if (view === AppView.WELCOME) return <Onboarding onComplete={() => setView(AppView.HOME)} language={user.language} />;
  
  if (view === AppView.TOUR_ACTIVE && activeTour) {
      return (
          <div className="h-screen w-full flex flex-col bg-white">
              <div className="h-[40vh] w-full relative">
                  <SchematicMap stops={activeTour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} />
                  <button onClick={() => setView(AppView.CITY_DETAIL)} className="absolute top-4 left-4 z-[400] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"><i className="fas fa-times"></i></button>
              </div>
              <div className="flex-1 relative z-10 -mt-6 bg-white rounded-t-[2rem] shadow-xl overflow-hidden">
                  <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => { if (currentStopIndex < activeTour.stops.length - 1) setCurrentStopIndex(prev => prev + 1); else setView(AppView.HOME); }} onPrev={() => { if (currentStopIndex > 0) setCurrentStopIndex(prev => prev - 1); }} language={user.language} t={t} />
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-0">
          {view === AppView.HOME && renderHome()}
          {view === AppView.CITY_DETAIL && (
            <div className="h-full flex flex-col pb-24 animate-fade-in">
                <div className="px-6 pt-6 pb-4 bg-white sticky top-0 z-20 flex items-center gap-4 border-b border-slate-100 shadow-sm pt-safe">
                    <button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-800"><i className="fas fa-arrow-left"></i></button>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedCity}</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-slate-900 text-white p-5 rounded-[2rem] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <i className="fas fa-cloud-download-alt text-2xl text-green-400"></i>
                            <div>
                                <p className="font-bold text-sm">{t('downloadLabel')}</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase">{t('offlineSub')}</p>
                            </div>
                        </div>
                    </div>
                    {cityInfo && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-5 rounded-[2rem] border border-blue-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t('transportLabel')}</p>
                                <p className="text-xs font-bold text-slate-800">{cityInfo.transport}</p>
                            </div>
                            <div className="bg-orange-50 p-5 rounded-[2rem] border border-orange-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{t('bestTimeLabel')}</p>
                                <p className="text-xs font-bold text-slate-800">{cityInfo.bestTime}</p>
                            </div>
                        </div>
                    )}
                    {isLoadingTours ? <div className="text-center py-20 animate-pulse">{t('loadingTours')}</div> : tours.map(tour => (
                        <div key={tour.id} className="h-[480px] mb-6">
                            {/* Fixed: using handleTourSelect, and ensuring required props for TourCard are passed while removing unsupported ones */}
                            <TourCard 
                                tour={tour} 
                                onSelect={() => handleTourSelect(tour)} 
                                onPlayAudio={() => {}} 
                                isPlayingAudio={false} 
                                isAudioLoading={false} 
                                isFavorite={false} 
                                onToggleFavorite={() => {}} 
                            />
                        </div>
                    ))}
                </div>
            </div>
          )}
          {/* Fixed: Removing 't' prop which is not defined in ProfileModalProps */}
          {view === AppView.PROFILE && <ProfileModal user={user as any} onClose={() => setView(AppView.HOME)} isOwnProfile={true} onUpdateUser={(u) => setUser(u)} />}
          {/* Fixed: Removing 't' prop which is not defined in ShopProps */}
          {view === AppView.SHOP && <Shop user={user} />}
          {view === AppView.CONNECT && <div className="p-8 pt-safe"><h2 className="text-3xl font-bold mb-8">{t('eSimStore')}</h2><div className="bg-purple-50 p-10 rounded-[3rem] text-center border border-purple-100"><i className="fas fa-wifi text-6xl text-purple-200 mb-6"></i><h3 className="font-bold text-slate-800 text-xl mb-2">{t('eSimSoon')}</h3></div></div>}
          {/* Fixed: Removing 't' prop which is not defined in LeaderboardProps */}
          {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={[]} onUserClick={() => {}} language={user.language} />}
      </div>
      <nav className="bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center relative z-20 pb-safe shadow-lg">
          <NavButton icon="fa-compass" label={t('exploreLabel')} isActive={view === AppView.HOME || view === AppView.CITY_DETAIL} onClick={() => setView(AppView.HOME)} />
          <NavButton icon="fa-passport" label={t('passport')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
          <NavButton icon="fa-shopping-bag" label={t('shop')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
          <NavButton icon="fa-wifi" label={t('connect')} isActive={view === AppView.CONNECT} onClick={() => setView(AppView.CONNECT)} />
      </nav>
    </div>
  );
}

const NavButton = ({ icon, label, isActive, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 w-16 transition-all active:scale-95 ${isActive ? 'text-purple-600' : 'text-slate-400'}`}>
        <div className={`p-2 rounded-2xl ${isActive ? 'bg-purple-50' : 'bg-transparent'}`}>
            <i className={`fas ${icon} text-lg`}></i>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
);
