
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry } from './types';
import { generateTours } from './services/geminiService';
import { getUserProfileByEmail, syncUserProfile, getGlobalRanking } from './services/supabaseClient';

// Importación de componentes que ya existen en tu proyecto
import { LoginScreen } from './features/auth/LoginScreen';
import { HomeScreen } from './features/home/HomeScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { TravelServices } from './components/TravelServices';
import { Shop } from './components/Shop';
import { Leaderboard } from './components/Leaderboard';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

const AppContent = () => {
  const { language, t } = useLanguage();
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<UserProfile>({
    username: '',
    email: '',
    miles: 0,
    isLoggedIn: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    language: 'es',
    stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 },
    rank: 'Turista'
  });
  
  const [searchCity, setSearchCity] = useState('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);

  // Cargar Ranking cuando se entra en esa vista
  useEffect(() => {
    if (view === AppView.RANKING) {
      getGlobalRanking().then(data => setRanking(data));
    }
  }, [view]);

  const handleLogin = async () => {
    if (!user.email) return;
    const profile = await getUserProfileByEmail(user.email);
    if (profile) {
      setUser(profile);
    } else {
      const newUser = { ...user, isLoggedIn: true };
      await syncUserProfile(newUser);
      setUser(newUser);
    }
    setView(AppView.EXPLORE);
  };

  const handleSearch = async () => {
    if (!searchCity) return;
    setIsLoading(true);
    const results = await generateTours(searchCity);
    setTours(results);
    setIsLoading(false);
  };

  // --- Renderizado de Vistas ---
  const renderView = () => {
    switch (view) {
      case AppView.LOGIN:
        return (
          <LoginScreen 
            username={user.username} 
            email={user.email} 
            onUsernameChange={(val) => setUser({...user, username: val})}
            onEmailChange={(val) => setUser({...user, email: val})}
            onLogin={handleLogin}
          />
        );

      case AppView.EXPLORE:
        return (
          <div className="pb-24">
            <HomeScreen 
              user={user} 
              searchVal={searchCity}
              onSearchChange={setSearchCity}
              onSearchSubmit={handleSearch}
              onCitySelect={(city) => { setSearchCity(city); handleSearch(); }}
            />
            <div className="px-6 space-y-6">
              {isLoading && <div className="text-center py-10"><i className="fas fa-spinner fa-spin text-purple-500"></i></div>}
              {tours.map(tour => (
                <TourCard key={tour.id} tour={tour} onSelect={(t) => { setSelectedTour(t); setView(AppView.TOUR_DETAIL); }} />
              ))}
            </div>
          </div>
        );

      case AppView.HUB:
        return <TravelServices mode="HUB" language={user.language} onCitySelect={(city) => { setSearchCity(city); setView(AppView.EXPLORE); handleSearch(); }} />;

      case AppView.SHOP:
        return <Shop user={user} onPurchase={(reward) => setUser({...user, miles: user.miles + reward})} />;

      case AppView.RANKING:
        return (
          <Leaderboard 
            currentUser={{...user, id: user.id || 'me', name: user.username, rank: 0}} 
            entries={ranking} 
            onUserClick={() => {}} 
            language={user.language} 
          />
        );

      case AppView.TOUR_DETAIL:
        if (!selectedTour) return null;
        return (
          <ActiveTourCard 
            tour={selectedTour} 
            user={user} 
            currentStopIndex={currentStopIndex}
            onNext={() => setCurrentStopIndex(prev => prev + 1)}
            onPrev={() => setCurrentStopIndex(prev => prev - 1)}
            onJumpTo={setCurrentStopIndex}
            onUpdateUser={setUser}
            onBack={() => { setView(AppView.EXPLORE); setCurrentStopIndex(0); }}
            language={user.language}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] text-white overflow-hidden">
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {renderView()}
      </main>

      {/* Navegación Inferior (Solo si no está en Login o Detalle de Tour) */}
      {view !== AppView.LOGIN && view !== AppView.TOUR_DETAIL && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 px-6 pb-8 pt-4 flex justify-between items-center z-50">
          <NavBtn active={view === AppView.EXPLORE} icon="fa-compass" label="Explorar" onClick={() => setView(AppView.EXPLORE)} />
          <NavBtn active={view === AppView.HUB} icon="fa-bolt" label="Hub" onClick={() => setView(AppView.HUB)} />
          <NavBtn active={view === AppView.SHOP} icon="fa-shopping-bag" label="Tienda" onClick={() => setView(AppView.SHOP)} />
          <NavBtn active={view === AppView.RANKING} icon="fa-trophy" label="Elite" onClick={() => setView(AppView.RANKING)} />
          <button 
            onClick={() => setView(AppView.PASSPORT)}
            className="w-10 h-10 rounded-full border-2 border-purple-500 overflow-hidden"
          >
            <img src={user.avatar} className="w-full h-full object-cover" />
          </button>
        </nav>
      )}

      {/* Modal de Perfil/Pasaporte */}
      {view === AppView.PASSPORT && (
        <ProfileScreen 
          user={user} 
          onClose={() => setView(AppView.EXPLORE)} 
          onUpdateUser={setUser}
          onLogout={() => { setView(AppView.LOGIN); setUser({...user, isLoggedIn: false}); }}
        />
      )}
    </div>
  );
};

const NavBtn = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-purple-500 scale-110' : 'text-slate-500'}`}>
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const App = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;
