import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BdaiLogo } from './components/BdaiLogo';
import { ToastContainer } from './components/Toast';

import { LoginView } from './views/LoginView';
import { HomeView } from './views/HomeView';

// Code-splitting: estas vistas no hacen falta en el primer arranque (login/home), así que se
// cargan bajo demanda. Reduce el JS a parsear/ejecutar en el arranque en frío — relevante para
// batería/CPU en gama media-baja, que es donde se reportan la mayoría de bugs de esta app.
const CityDetailView = lazy(() => import('./views/CityDetailView').then(m => ({ default: m.CityDetailView })));
const TourActiveView = lazy(() => import('./views/TourActiveView').then(m => ({ default: m.TourActiveView })));
const Leaderboard = lazy(() => import('./components/Leaderboard').then(m => ({ default: m.Leaderboard })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const Shop = lazy(() => import('./components/Shop').then(m => ({ default: m.Shop })));
const CityDiscoveryMap = lazy(() => import('./components/CityDiscoveryMap').then(m => ({ default: m.CityDiscoveryMap })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const Onboarding = lazy(() => import('./components/Onboarding').then(m => ({ default: m.Onboarding })));
const ProfileCompletionPrompt = lazy(() => import('./components/ProfileCompletionPrompt').then(m => ({ default: m.ProfileCompletionPrompt })));
const LeaderboardLockedView = lazy(() => import('./components/LeaderboardLockedView').then(m => ({ default: m.LeaderboardLockedView })));

import { useAppStore } from './store/useAppStore';
import { useTranslation } from './hooks/useTranslation';
import { useGeolocation } from './hooks/useGeolocation';
import { tourCacheService } from './lib/tourCacheService';
import { saveLastRoute } from './lib/lastRouteStorage';
import { useAuth } from './hooks/useAuth';
import { useCity } from './hooks/useCity';
import { supabase, getGlobalRanking, queueProfileSync } from './services/supabaseClient';
import { LeaderboardEntry } from './types';
import { CityLocation } from './services/supabase/toursService';

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



const RouteLoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center py-24">
    <BdaiLogo className="w-10 h-10 animate-pulse opacity-60" />
  </div>
);

const NavButton = ({ icon, label, isActive, onClick, showDot }: { icon: string; label: string; isActive: boolean; onClick: () => void; showDot?: boolean }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-purple-500 scale-105' : 'text-slate-500 opacity-40'}`}>
    <div className="relative">
      <i className={`fas ${icon} text-lg`}></i>
      {showDot && <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-purple-500 border border-[#0a0f1e]"></span>}
    </div>
    <span className="text-[7px] font-black uppercase tracking-widest text-center truncate w-full">{label}</span>
  </button>
);

export default function App() {
  const {
    userProfile: user, setUserProfile: setUser,
    isLoading, setIsLoading, loadingMessage,
    showOnboarding, setShowOnboarding,
    // "Completa tu perfil" (edad, ciudad, país, sexo) se ofrece una sola vez, justo al cerrar
    // la tarjeta de tour completado (ver TourCard.tsx → onTourComplete) — nunca al abrir la
    // app, y siempre descartable, para no reproducir el muro de registro que motivó pasar a
    // login anónimo (Guideline 5.1.1(v)).
    showProfileCompletion, setShowProfileCompletion
  } = useAppStore();

  const navigate = useNavigate();
  const location = useLocation();
  const { t, handleLangChange, isSyncingLang } = useTranslation();
  const { isVerifyingSession, handleLinkApple, handleLinkGoogle } = useAuth(true);
  const { processCitySelection } = useCity();

  // El mapa de descubrimiento (CityDiscoveryMap) ya tiene el slug exacto y
  // fiable de city_locations — se navega con él directamente en vez de pasar
  // por handleTravelServiceSelect(name, country), que reconstruye el slug a
  // partir del nombre/país y falla cuando el país no se pudo derivar del slug
  // original (~95 de 357 ciudades tienen country vacío por slugs de país de
  // más de una palabra, ej. "cape_town_south_africa" — ver AGENTS.md).
  const handleDiscoveryCitySelect = (city: CityLocation) => {
    processCitySelection(
      { city: city.name, name: city.name, country: city.country, countryEn: city.country, slug: city.slug },
      user.language
    );
  };

  useGeolocation(location.pathname.startsWith('/tour/') ? 'active' : 'idle');

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('bdai-stop-audio'));
    setIsLoading(false);
  }, [location.pathname, setIsLoading]);

  // Guardar la última ruta para restauración de estado en Android: si el proceso es matado
  // y recreado, Capacitor no conserva el hash de la URL y siempre recarga en la base — sin
  // esto se aterriza en /home pase lo que pase. useAuth la restaura tras el login.
  useEffect(() => {
    saveLastRoute(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    getGlobalRanking().then(setLeaderboard);
    tourCacheService.evictExpired().catch(() => {});
  }, []);

  const updateUserAndSync = (updatedUser: any) => {
    setUser(updatedUser);
    if (updatedUser.isLoggedIn) queueProfileSync(updatedUser);
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
  // Ya no depende de isLoggedIn: navegar sin sesión (si el alta anónima fallara) debe poder
  // llegar igual a Ranking/Perfil/Tienda — esas rutas siguen pidiendo login por su cuenta al
  // entrar, así que el gate real sigue existiendo, solo que en el sitio correcto.
  const showNav = !isTourActive && !isAdminView;

  return (
    <div className="flex-1 bg-transparent flex flex-col h-[100dvh] w-full font-sans text-slate-100 overflow-hidden">
      {/* Montado aquí, fuera de <Routes>, para que sobreviva a cualquier navegación (ej. el
          toast de "cuenta eliminada" justo antes de redirigir a /login) — antes no estaba
          montado en NINGÚN sitio de la app, así que ningún toast() de todo el proyecto se
          llegaba a ver nunca. */}
      <ToastContainer />
      {(isLoading || isSyncingLang) && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-10 animate-fade-in">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-black uppercase text-[10px] tracking-[0.4em] text-center animate-pulse">
            {isSyncingLang ? t('translatingInterface') : (loadingMessage || t('syncing'))}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col relative h-full">
        <div className={`flex-1 overflow-y-auto no-scrollbar relative ${isTourActive ? 'pb-0' : 'pb-36'}`}>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Guideline 5.1.1(v) de Apple: hacer/ver tours es el contenido principal de la
                  app y no es "de cuenta" — no puede exigir sesión, ni siquiera anónima. Estas
                  cuatro rutas quedan abiertas incondicionalmente; el login (anónimo automático
                  o manual) sigue existiendo para lo que sí es de cuenta: ranking, perfil,
                  tienda. Esto además hace que la app funcione igual aunque el alta anónima de
                  Supabase falle o esté mal configurada — no dependemos de que funcione para que
                  el contenido básico sea usable. */}
              <Route path="/login" element={user.isLoggedIn ? <Navigate to="/home" /> : <LoginView />} />
              <Route path="/home" element={<HomeView appDesc={APP_DESC} />} />
              <Route path="/city/:slug" element={<CityDetailView />} />
              <Route path="/tour/:tourId/stop/:stopIdx" element={<TourActiveView />} />

              <Route path="/leaderboard" element={
                !user.isLoggedIn ? <Navigate to="/login" /> :
                user.isAnonymous ? <LeaderboardLockedView language={user.language} onLinkApple={handleLinkApple} onLinkGoogle={handleLinkGoogle} /> :
                <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} /></div>
              } />
              <Route path="/profile" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login')}} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
              <Route path="/profile/visa/:cityName" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login')}} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
              <Route path="/profile/badge/:badgeId" element={user.isLoggedIn ? <ProfileModal user={user} onClose={() => navigate('/home')} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); navigate('/login')}} onOpenAdmin={() => navigate('/admin')} onLangChange={handleLangChange} /> : <Navigate to="/login" />} />
              <Route path="/shop" element={user.isLoggedIn ? <div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><Shop user={user} onPurchase={() => {}} /></div> : <Navigate to="/login" />} />
              <Route path="/tools" element={<div className="w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto h-full px-4 sm:px-6"><CityDiscoveryMap onCitySelect={handleDiscoveryCitySelect} /></div>} />
              {/* Guideline 2.2 de Apple: el panel admin son herramientas internas de QA, no
                  deben quedar accesibles a cualquier usuario logueado navegando la URL a mano
                  — antes solo se ocultaba el botón que lleva aquí, no la ruta en sí. */}
              <Route path="/admin" element={(user.isLoggedIn && (user.email === 'travelbdai@gmail.com' || user.isAdmin)) ? <AdminPanel user={user} onBack={() => navigate('/profile')} /> : <Navigate to={user.isLoggedIn ? '/home' : '/login'} />} />
              <Route path="/" element={<Navigate to="/home" />} />
            </Routes>
          </Suspense>

          {showOnboarding && (
            <Suspense fallback={null}>
              <Onboarding user={user} language={user.language} onComplete={() => setShowOnboarding(false)} />
            </Suspense>
          )}
          {showProfileCompletion && (
            <Suspense fallback={null}>
              <ProfileCompletionPrompt user={user} onClose={(updatedUser) => {
                updateUserAndSync(updatedUser);
                setShowProfileCompletion(false);
              }} />
            </Suspense>
          )}
        </div>

        {showNav && (
          <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-6 flex justify-center pointer-events-none">
            <nav className="bg-[#0a0f1e]/90 backdrop-blur-md border border-white/5 px-2 py-4 flex justify-around items-center w-full max-w-sm md:max-w-lg lg:max-w-2xl rounded-[2.5rem] pointer-events-auto shadow-2xl">
              <NavButton icon="fa-trophy" label={t('navRanking')} isActive={location.pathname === '/leaderboard'} onClick={() => navigate('/leaderboard')} />
              <NavButton icon="fa-compass" label={t('navTOP')} isActive={location.pathname === '/tools'} onClick={() => navigate('/tools')} />
              <button onClick={() => navigate('/home')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${location.pathname === '/home' || location.pathname === '/' ? 'bg-purple-600 -mt-10 scale-110 shadow-lg shadow-purple-500/40' : 'bg-white/5 border border-white/5'}`}><BdaiLogo className="w-7 h-7" /></button>
              <NavButton icon="fa-id-card" label={t('navVisa')} isActive={location.pathname === '/profile'} onClick={() => navigate('/profile')} showDot={!user.city || !user.birthday} />
              <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={location.pathname === '/shop'} onClick={() => navigate('/shop')} />
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
