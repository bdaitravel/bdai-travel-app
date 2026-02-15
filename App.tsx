
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry } from './types';
import { generateToursForCity, standardizeCityName } from './services/geminiService';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { LoginScreen } from './features/auth/LoginScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { AdminPanel } from './components/AdminPanel';
import { 
  supabase, 
  getUserProfileByEmail, 
  getGlobalRanking, 
  syncUserProfile, 
  getCachedTours, 
  saveToursToCache, 
  validateEmailFormat 
} from './services/supabaseClient';

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
  email: '', language: 'es', miles: 0, rank: 'Turist', culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, 
  country: '', birthday: '', city: '',
  stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 }, 
  visitedCities: [], completedTours: [], badges: [], stamps: []
};

const AppContent = () => {
  const { language, t, setLanguage } = useLanguage();
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [user, setUser] = useState<UserProfile>(GUEST_PROFILE);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  
  // Estado para la ubicación del usuario
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Efecto para activar el GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        console.error("GPS Error:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('bdai_profile');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const migratedProfile = { ...GUEST_PROFILE, ...parsed };
            setUser(migratedProfile);
            setLanguage(migratedProfile.language || 'es');
        } catch (e) {
            localStorage.removeItem('bdai_profile');
        }
    }
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await getUserProfileByEmail(session.user.email || '');
          if (profile) {
            setUser({ ...profile, isLoggedIn: true });
            setLanguage(profile.language);
            setView(AppView.HOME);
          }
        }
      } catch (e) { console.error(e); } finally { setIsVerifyingSession(false); }
    };
    checkAuth();
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const handleLogin = async () => {
    if (!validateEmailFormat(email)) { alert("Email inválido."); return; }
    setIsLoading(true);
    setLoadingMessage(t('common.syncing'));
    try {
      const profile = await getUserProfileByEmail(email);
      const activeUser = profile ? { ...profile, isLoggedIn: true } : { ...GUEST_PROFILE, email, username: username || email.split('@')[0], isLoggedIn: true, id: `u_${Date.now()}`, language };
      await syncUserProfile(activeUser);
      setUser(activeUser);
      localStorage.setItem('bdai_profile', JSON.stringify(activeUser));
      setView(AppView.HOME);
    } catch (e) { alert("Error."); } finally { setIsLoading(false); }
  };

  const processCitySelection = async (official: {name: string, spanishName: string, country: string}) => {
    setIsLoading(true); 
    setSelectedCity(official.spanishName); 
    try {
      const cached = await getCachedTours(official.spanishName, official.country, language);
      if (cached) {
        setTours(cached.data); 
        setView(AppView.CITY_DETAIL);
        return;
      }
      setLoadingMessage(t('common.loading'));
      const generated = await generateToursForCity(official.spanishName, official.country, { ...user, language } as UserProfile);
      if (generated.length > 0) {
        setTours(generated); 
        await saveToursToCache(official.spanishName, official.country, language, generated);
        setView(AppView.CITY_DETAIL);
      }
    } catch (e) { alert("IA Saturada"); } finally { setIsLoading(false); }
  };

  if (isVerifyingSession) return <div className="fixed inset-0 bg-slate-950 flex items-center justify-center"><BdaiLogo className="w-16 h-16 animate-pulse" /></div>;

  return (
    <div className="flex-1 bg-transparent flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-black uppercase text-[10px] tracking-[0.4em]">{loadingMessage}</p>
        </div>
      )}

      {view === AppView.LOGIN ? (
        <LoginScreen 
          username={username} email={email} 
          onUsernameChange={setUsername} onEmailChange={setEmail} 
          onLogin={handleLogin} 
        />
      ) : (
        <div className="flex-1 flex flex-col relative h-full">
          <div className={`flex-1 overflow-y-auto no-scrollbar relative ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-36'}`}>
            
            {view === AppView.HOME && (
              <div className="space-y-6 pt-safe-iphone max-w-md mx-auto animate-fade-in">
                <header className="flex justify-between items-center py-4 px-6">
                  <div className="flex items-center gap-3"><BdaiLogo className="w-8 h-8"/><span className="font-black text-xl tracking-tighter">bdai</span></div>
                  <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[9px] font-black"><i className="fas fa-coins text-yellow-500 mr-2"></i>{user.miles.toLocaleString()}</div>
                </header>
                <div className="px-6">
                  <h1 className="text-3xl font-black uppercase tracking-tighter">{t('auth.tagline')} <br/><span className="text-purple-600/60 block mt-1">{user.username}.</span></h1>
                </div>
                <div className="relative mt-2 flex gap-3 px-6">
                  <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="ciudad..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-bold" />
                  <button onClick={() => standardizeCityName(searchVal).then(res => res[0] && processCitySelection(res[0]))} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg"><i className="fas fa-search"></i></button>
                </div>
                <TravelServices mode="HOME" onCitySelect={(name: string) => processCitySelection({name, spanishName: name, country: ''})} />
              </div>
            )}

            {view === AppView.HUB && (
              <div className="pt-safe-iphone max-w-md mx-auto animate-fade-in">
                 <TravelServices mode="HUB" onCitySelect={(name: string) => processCitySelection({name, spanishName: name, country: ''})} />
              </div>
            )}
            
            {view === AppView.CITY_DETAIL && (
              <div className="pt-safe-iphone px-6 max-w-md mx-auto animate-fade-in">
                <header className="flex items-center gap-4 mb-8 py-4">
                  <button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center"><i className="fas fa-arrow-left"></i></button>
                  <h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{selectedCity}</h2>
                </header>
                <div className="space-y-6 pb-12">
                  {tours.map(tour => (
                    <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0); }} />
                  ))}
                </div>
              </div>
            )}
            
            {view === AppView.TOUR_ACTIVE && activeTour && (
              <ActiveTourCard 
                tour={activeTour} 
                user={user} 
                currentStopIndex={currentStopIndex} 
                onNext={() => setCurrentStopIndex(i => i + 1)} 
                onPrev={() => setCurrentStopIndex(i => i - 1)} 
                onJumpTo={setCurrentStopIndex} 
                onUpdateUser={setUser} 
                onBack={() => setView(AppView.CITY_DETAIL)} 
                userLocation={userLocation}
              />
            )}
            
            {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={language} />}
            {view === AppView.PROFILE && <ProfileScreen user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={u => { setUser(u); localStorage.setItem('bdai_profile', JSON.stringify(u)); }} onLogout={() => { setView(AppView.LOGIN); localStorage.removeItem('bdai_profile'); }} onOpenAdmin={() => setView(AppView.ADMIN)} />}
            {view === AppView.SHOP && <Shop user={user} onPurchase={() => {}} />}
            {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
          </div>

          {view !== AppView.TOUR_ACTIVE && view !== AppView.ADMIN && (
            <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-6 flex justify-center pointer-events-none">
              <nav className="bg-slate-900/90 backdrop-blur-2xl border border-white/5 px-2 py-4 flex justify-around items-center w-full max-w-sm rounded-[2.5rem] pointer-events-auto shadow-2xl">
                <button onClick={() => setView(AppView.HUB)} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === AppView.HUB ? 'text-purple-500' : 'text-slate-500'}`}><i className="fas fa-brain"></i><span className="text-[7px] font-black uppercase">{t('nav.hub')}</span></button>
                <button onClick={() => setView(AppView.LEADERBOARD)} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === AppView.LEADERBOARD ? 'text-purple-500' : 'text-slate-500'}`}><i className="fas fa-trophy"></i><span className="text-[7px] font-black uppercase">{t('nav.elite')}</span></button>
                <button onClick={() => setView(AppView.HOME)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg' : 'bg-white/5'}`}><BdaiLogo className="w-7 h-7" /></button>
                <button onClick={() => setView(AppView.SHOP)} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === AppView.SHOP ? 'text-purple-500' : 'text-slate-500'}`}><i className="fas fa-shopping-bag"></i><span className="text-[7px] font-black uppercase">{t('nav.store')}</span></button>
                <button onClick={() => setView(AppView.PROFILE)} className={`flex flex-col items-center gap-1 transition-all flex-1 ${view === AppView.PROFILE ? 'text-purple-500' : 'text-slate-500'}`}><i className="fas fa-id-card"></i><span className="text-[7px] font-black uppercase">{t('nav.visa')}</span></button>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
