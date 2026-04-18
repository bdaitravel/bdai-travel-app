import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { AdminPanel } from './components/AdminPanel';
import { Onboarding } from './components/Onboarding';
import { VisaShare } from './components/VisaShare';

import { LoginView } from './views/LoginView';
import { HomeView } from './views/HomeView';
import { CityDetailView } from './views/CityDetailView';
import { TourActiveView } from './views/TourActiveView';

import { useAppStore } from './store/useAppStore';
import { useTranslation } from './hooks/useTranslation';
import { useGeolocation } from './hooks/useGeolocation';
import { useAuth } from './hooks/useAuth';
import { useCity } from './hooks/useCity';
import { supabase, getGlobalRanking, syncUserProfile } from './services/supabaseClient';
import { LeaderboardEntry } from './types';

declare global {
  interface Window {
    aistudio: any;
  }
}

const APP_DESC: Record<string, string> = {
  es: "Descubre ciudades con rutas únicas generadas por IA. Sin paradas repetidas, solo experiencias auténticas y gemas ocultas.",
  en: "Discover cities with unique AI-generated tours. No repeated stops, only authentic experiences and hidden gems.",
  fr: "Découvrez des villes avec des itinéraires uniques générés par IA. Aucun arrêt répété, que des expériences authentiques et des joyaux cachés.",
  de: "Entdecke Städte mit einzigartigen KI-generierten Touren. Keine wiederholten Stopps, nur authentische Erlebnisse und verborgene Schätze.",
  it: "Scopri città con percorsi unici generati dall'IA. Nessuna tappa ripetuta, solo esperienze autentiche e gemme nascoste.",
  pt: "Descobre cidades com rotas únicas geradas por IA. Sem paragens repetidas, só experiências autênticas e joias escondidas.",
  ro: "Descoperă orașe cu rute unice generate de IA. Fără opriri repetate, doar experiențe autentice și comori ascunse.",
  ru: "Открывай города с уникальными маршрутами от ИИ. Никаких повторений, только настоящие впечатления и скрытые жемчужины.",
  zh: "发现由AI生成的独特城市路线。没有重复的站点，只有真实的体验和隐藏的宝藏。",
  ja: "AIが生成するユニークな都市ツアーを発見。繰り返しのストップなし、本物の体験と隠れた宝石だけ。",
  ar: "اكتشف المدن بمسارات فريدة تولدها الذكاء الاصطناعي. لا توقفات متكررة، فقط تجارب أصيلة وجواهر خفية.",
  hi: "AI द्वारा जनित अनूठे शहर पर्यटन खोजें। कोई दोहराई गई रुकावट नहीं, केवल प्रामाणिक अनुभव और छिपे हुए रत्न।",
  ko: "AI가 생성한 독특한 도시 투어를 발견하세요. 반복 없는 정류장, 진정한 경험과 숨겨진 보석만.",
  tr: "Yapay zeka tarafından oluşturulan benzersiz şehir turlarını keşfet. Tekrar eden durak yok, sadece otantik deneyimler ve gizli mücevherler.",
  nl: "Ontdek steden met unieke AI-gegenereerde tours. Geen herhaalde stops, alleen authentieke ervaringen en verborgen juweeltjes.",
  pl: "Odkrywaj miasta z unikalnymi trasami generowanymi przez AI. Bez powtarzających się przystanków, tylko autentyczne doświadczenia i ukryte klejnoty.",
  ca: "Descobreix ciutats amb rutes úniques generades per IA. Sense parades repetides, només experiències autèntiques i joies ocultes.",
  eu: "Aurkitu hiriak AAren bidez sortutako bide bereziekin. Ez errepikaturiko geldialdirik, benetako esperientziak eta ezkutuko harribitxiak baino.",
  vi: "Khám phá các thành phố với các tuyến đường độc đáo do AI tạo ra. Không có điểm dừng lặp lại, chỉ có trải nghiệm chân thực và viên ngọc ẩn.",
  th: "ค้นพบเมืองด้วยเส้นทางท่องเที่ยวเฉพาะตัวที่สร้างโดย AI ไม่มีจุดหยุดซ้ำ มีแต่ประสบการณ์แท้จริงและสถานที่ซ่อนเร้น",
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-purple-500 scale-105' : 'text-slate-500 opacity-40'}`}>
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[7px] font-black uppercase tracking-widest text-center truncate w-full">{label}</span>
  </button>
);

export default function App() {
  const { 
    userProfile: user, setUserProfile: setUser,
    isLoading, setIsLoading, loadingMessage,
    showOnboarding, setShowOnboarding,
    visaToShare, setVisaToShare
  } = useAppStore();

  const navigate = useNavigate();
  const location = useLocation();
  const { t, handleLangChange, isSyncingLang } = useTranslation();
  const { isVerifyingSession, setLoginPhase } = useAuth(true);
  const { handleTravelServiceSelect } = useCity(); 
  
  useGeolocation(); 

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('bdai-stop-audio'));
    setIsLoading(false);
    setVisaToShare(null);
  }, [location.pathname, setIsLoading, setVisaToShare]);

  useEffect(() => {
    getGlobalRanking().then(setLeaderboard);
  }, []);

  const updateUserAndSync = (updatedUser: any) => {
    setUser(updatedUser);
    if (updatedUser.isLoggedIn) syncUserProfile(updatedUser);
  };

  if (isVerifyingSession) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center">
        <BdaiLogo className="w-16 h-16 animate-pulse" />
      </div>
    );
  }

  const isTourActive = location.pathname.startsWith('/tour/');
  const isAdminView = location.pathname === '/admin';
  const showNav = user.isLoggedIn && !isTourActive && !isAdminView;

  return (
    <div className="flex-1 bg-transparent flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {(isLoading || isSyncingLang) && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-fade-in">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-black uppercase text-[10px] tracking-[0.4em] text-center animate-pulse">
            {isSyncingLang ? "translating interface..." : (loadingMessage || "syncing...")}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col relative h-full">
        <div className={`flex-1 overflow-y-auto no-scrollbar relative ${isTourActive ? 'pb-0' : 'pb-36'}`}>
          <Routes>
            <Route path="/login" element={user.isLoggedIn ? <Navigate to="/home" /> : <LoginView />} />
            <Route path="/home" element={user.isLoggedIn ? <HomeView appDesc={APP_DESC} /> : <Navigate to="/login" />} />
            <Route path="/city/:slug" element={user.isLoggedIn ? <CityDetailView /> : <Navigate to="/login" />} />
            <Route path="/tour/:tourId/stop/:stopIdx" element={user.isLoggedIn ? <TourActiveView /> : <Navigate to="/login" />} />
            
            <Route path="/leaderboard" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} /></div> : <Navigate to="/login" />} />
            <Route path="/profile" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login'); setLoginPhase('EMAIL'); }} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
            <Route path="/profile/visa/:cityName" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login'); setLoginPhase('EMAIL'); }} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
            <Route path="/profile/badge/:badgeId" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login'); setLoginPhase('EMAIL'); }} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
            <Route path="/shop" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><Shop user={user} onPurchase={() => {}} /></div> : <Navigate to="/login" />} />
            <Route path="/tools" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><TravelServices mode="HUB" lang={user.language} onCitySelect={handleTravelServiceSelect} /></div> : <Navigate to="/login" />} />
            <Route path="/admin" element={user.isLoggedIn ? <AdminPanel user={user} onBack={() => navigate('/profile')} /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={user.isLoggedIn ? "/home" : "/login"} />} />
          </Routes>

          {showOnboarding && <Onboarding user={user} language={user.language} onComplete={() => setShowOnboarding(false)} />}
          {visaToShare && <VisaShare user={user} cityName={visaToShare.cityName} milesEarned={visaToShare.miles} onClose={() => setVisaToShare(null)} />}
        </div>

        {showNav && (
          <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-6 flex justify-center pointer-events-none">
            <nav className="bg-[#0a0f1e]/90 backdrop-blur-2xl border border-white/5 px-2 py-4 flex justify-around items-center w-full max-w-sm md:max-w-lg lg:max-w-2xl rounded-[2.5rem] pointer-events-auto shadow-2xl">
              <NavButton icon="fa-trophy" label={t('navElite')} isActive={location.pathname === '/leaderboard'} onClick={() => navigate('/leaderboard')} />
              <NavButton icon="fa-compass" label={t('navHub')} isActive={location.pathname === '/tools'} onClick={() => navigate('/tools')} />
              <button onClick={() => navigate('/home')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${location.pathname === '/home' || location.pathname === '/' ? 'bg-purple-600 -mt-10 scale-110 shadow-lg shadow-purple-500/40' : 'bg-white/5 border border-white/5'}`}><BdaiLogo className="w-7 h-7" /></button>
              <NavButton icon="fa-id-card" label={t('navVisa')} isActive={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
              <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={location.pathname === '/shop'} onClick={() => navigate('/shop')} />
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
