
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES, INTERESTS_LIST, TravelerRank, CityInfo } from './types';
import { generateToursForCity, generateAudio, generateStopDetails, getCityInfo } from './services/geminiService';
import { CityCard } from './components/CityCard';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { SchematicMap } from './components/SchematicMap';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Onboarding } from './components/Onboarding';
import { Shop } from './components/Shop'; 
import { BdaiLogo } from './components/BdaiLogo'; 
import { CurrencyConverter } from './components/CurrencyConverter';

// --- AUDIO UTILS (PCM DECODER) ---
const base64ToUint8Array = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const pcmToAudioBuffer = (data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000) => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};

// --- TRANSLATIONS DICTIONARY ---
const TRANSLATIONS: any = {
  en: {
    login: "Login", register: "Register", signin: "Sign In", createAccount: "Start Adventure",
    name: "First Name", surname: "Last Name", email: "Email", password: "Password", birthDate: "Birth Date",
    invalidEmail: "Invalid email", passShort: "Password too short", nameReq: "Name fields required", dateReq: "Birth date required",
    welcome: "Hello,", whereTo: "Where are we going today?",
    explore: "Explore", passport: "Passport", shop: "Shop", connect: "Tools",
    myPassport: "My Passport", edit: "Edit", save: "Save", signOut: "Sign Out",
    ranking: "Leaderboard", shopComing: "Coming soon", baseCity: "Base City", bio: "Bio / Manifesto",
    surnameLabel: "Surname / Nom", givenNameLabel: "Given Names / Prénoms", dateIssue: "Date of Issue",
    avatarUrl: "Change Photo", share: "Share Achievements", visitedPlaces: "Visited Places",
    toursDone: "Tours Completed", miles: "bdai Miles", shareText: "Check out my travel stats on bdai!",
    nextLevel: "Next Level", aiMemory: "AI Trip Memory", generate: "Generate",
    culturePoints: "Culture", foodPoints: "Gastronomy", photoPoints: "Photography",
    username: "Username", usernameReq: "Username required", publicProfile: "Public Profile", rankingVisibility: "Visible in Global Ranking",
    privateProfile: "Private Profile",
    featuredRegion: "Local Experience",
    spainDestinations: "Spain Highlights",
    topWorldDestinations: "World Top 5",
    worldDestinations: "Europe Classics",
    asiaDestinations: "Exotic Asia",
    americasDestinations: "The Americas",
    africaDestinations: "Magic Africa",
    searchPlaceholder: "Search any city in the world...",
    downloadOffline: "Download Offline",
    tools: "Travel Tools",
    cityIntel: "City Intelligence",
    loadingIntel: "AI Analyzing city data...",
    transportLabel: "Transport",
    bestTimeLabel: "Best Time",
    dishLabel: "Local Dish",
    costLabel: "Cost Level",
    securityLabel: "Safety",
    wifiLabel: "Free WiFi Spots",
    heroTitle: "Discover the World",
    heroSubtitle: "Free Tours & Smart Travel",
    lingoLabel: "Speak Like a Local",
    accessibilityLabel: "Travel Accessibility",
    acc_standard: "Standard",
    acc_wheelchair: "Wheelchair",
    acc_low_walking: "Low Walking"
  },
  es: {
    login: "Entrar", register: "Registrarse", signin: "Iniciar Sesión", createAccount: "Empezar Aventura",
    name: "Nombre", surname: "Apellidos", email: "Email", password: "Contraseña", birthDate: "Fecha Nacimiento",
    invalidEmail: "Email no válido", passShort: "Contraseña muy corta", nameReq: "Nombre y apellidos obligatorios", dateReq: "Fecha de nacimiento obligatoria",
    welcome: "Hola,", whereTo: "¿A dónde vamos hoy?",
    explore: "Explorar", passport: "Pasaporte", shop: "Tienda", connect: "Herramientas",
    myPassport: "Mi Pasaporte", edit: "Editar", save: "Guardar", signOut: "Cerrar Sesión",
    ranking: "Ranking Global", shopComing: "Próximamente", baseCity: "Ciudad Base", bio: "Bio / Manifiesto",
    surnameLabel: "Apellidos / Nom", givenNameLabel: "Nombre / Prénoms", dateIssue: "Fecha de Expedición",
    avatarUrl: "Cambiar Foto", share: "Compartir Hitos", visitedPlaces: "Sitios Visitados",
    toursDone: "Tours Completados", miles: "Millas bdai", shareText: "¡Mira mis estadísticas de viaje en bdai!",
    nextLevel: "Siguiente Nivel", aiMemory: "Memoria IA de Viaje", generate: "Generar",
    culturePoints: "Cultura", foodPoints: "Gastronomía", photoPoints: "Fotografía",
    username: "Usuario", usernameReq: "Nombre de usuario obligatorio", publicProfile: "Perfil Público", rankingVisibility: "Visible en Ranking Global",
    privateProfile: "Perfil Privado",
    featuredRegion: "Experiencia Local",
    spainDestinations: "Joyas de España",
    topWorldDestinations: "Top 5 Mundial",
    worldDestinations: "Clásicos de Europa",
    asiaDestinations: "Asia Exótica",
    americasDestinations: "Las Américas",
    africaDestinations: "África Mágica",
    searchPlaceholder: "Busca cualquier ciudad del mundo...",
    downloadOffline: "Descargar Offline",
    tools: "Herramientas",
    cityIntel: "Información de Ciudad",
    loadingIntel: "IA Analizando datos de la ciudad...",
    transportLabel: "Transporte",
    bestTimeLabel: "Mejor Época",
    dishLabel: "Plato Típico",
    costLabel: "Nivel de Coste",
    securityLabel: "Seguridad",
    wifiLabel: "Zonas WiFi Gratis",
    heroTitle: "Descubre el Mundo",
    heroSubtitle: "Free Tours y Viajes Inteligentes",
    lingoLabel: "Habla como un Local",
    accessibilityLabel: "Accesibilidad de Viaje",
    acc_standard: "Estándar",
    acc_wheelchair: "Silla de Ruedas",
    acc_low_walking: "Poca Caminata"
  },
  de: {
    login: "Anmelden", register: "Registrieren", signin: "Einloggen", createAccount: "Abenteuer starten",
    name: "Vorname", surname: "Nachname", email: "E-Mail", password: "Passwort", birthDate: "Geburtsdatum",
    invalidEmail: "Ungültige E-Mail", passShort: "Passwort zu kurz", nameReq: "Namensfelder erforderlich", dateReq: "Geburtsdatum erforderlich",
    welcome: "Hallo,", whereTo: "Wohin gehen wir heute?",
    explore: "Entdecken", passport: "Reisepass", shop: "Shop", connect: "Tools",
    myPassport: "Mein Reisepass", edit: "Bearbeiten", save: "Speichern", signOut: "Abmelden",
    ranking: "Bestenliste", shopComing: "Demnächst", baseCity: "Heimatstadt", bio: "Bio / Manifest",
    surnameLabel: "Nachname / Nom", givenNameLabel: "Vornamen / Prénoms", dateIssue: "Ausstellungsdatum",
    avatarUrl: "Foto ändern", share: "Erfolge teilen", visitedPlaces: "Besuchte Orte",
    toursDone: "Abgeschlossene Touren", miles: "bdai Meilen", shareText: "Sieh dir meine Reisestatistiken auf bdai an!",
    nextLevel: "Nächstes Level", aiMemory: "KI Reiseerinnerung", generate: "Generieren",
    culturePoints: "Kultur", foodPoints: "Gastronomie", photoPoints: "Fotografie",
    username: "Benutzername", usernameReq: "Benutzername erforderlich", publicProfile: "Öffentliches Profil", rankingVisibility: "In globaler Bestenliste sichtbar",
    privateProfile: "Privates Profil",
    featuredRegion: "Lokale Erfahrung",
    spainDestinations: "Spanien Highlights",
    topWorldDestinations: "Welt Top 5",
    worldDestinations: "Europa Klassiker",
    asiaDestinations: "Exotisches Asien",
    americasDestinations: "Amerika",
    africaDestinations: "Magisches Afrika",
    searchPlaceholder: "Suche eine Stadt weltweit...",
    downloadOffline: "Offline herunterladen",
    tools: "Reisetools",
    cityIntel: "Stadt-Infos",
    loadingIntel: "KI analysiert Stadtdaten...",
    transportLabel: "Transport",
    bestTimeLabel: "Beste Reisezeit",
    dishLabel: "Lokales Gericht",
    costLabel: "Preisniveau",
    securityLabel: "Sicherheit",
    wifiLabel: "Gratis WLAN-Hotspots",
    heroTitle: "Entdecke die Welt",
    heroSubtitle: "Kostenlose Touren & Intelligentes Reisen",
    lingoLabel: "Sprich wie ein Einheimischer",
    accessibilityLabel: "Barrierefreiheit",
    acc_standard: "Standard",
    acc_wheelchair: "Rollstuhl",
    acc_low_walking: "Wenig Gehen"
  }
};

// --- INITIAL DATA ---
const INITIAL_USER: UserProfile = {
  id: 'u1', 
  isLoggedIn: false, 
  firstName: 'Alex', 
  lastName: 'Traveler', 
  name: 'Alex Traveler', 
  username: 'alextravels', 
  email: 'alex@bdai.com', 
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', 
  language: 'es', 
  miles: 1250, 
  rank: 'Explorador',
  culturePoints: 800,
  foodPoints: 300,
  photoPoints: 150,
  interests: ['History', 'Food & Drink'], 
  accessibility: 'standard', 
  isPublic: true, 
  bio: 'Explorando el mundo una historia a la vez.', 
  age: 28, 
  country: 'Spain', 
  city: 'Madrid', 
  passportNumber: 'TT-8829-X',
  joinDate: 'Dic 2023',
  badges: [{ id: 'b1', name: 'Early Adopter', icon: 'fa-rocket', description: 'Se unió a la beta.' }], 
  visitedCities: ['Madrid'], 
  completedTours: []
};

// --- GAMIFICATION LOGIC ---
const RANKS: { name: TravelerRank; minMiles: number; color: string }[] = [
    { name: 'Turista', minMiles: 0, color: 'text-slate-500' },
    { name: 'Explorador', minMiles: 1000, color: 'text-green-600' },
    { name: 'Wanderer', minMiles: 5000, color: 'text-blue-600' },
    { name: 'Globe-Trotter', minMiles: 15000, color: 'text-purple-600' },
    { name: 'Leyenda del Viaje', minMiles: 40000, color: 'text-amber-500' }
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { id: '1', name: 'Marco Polo', username: 'marco', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', miles: 45000, rank: 1, isPublic: true },
    { id: '2', name: 'Ibn Battuta', username: 'ibn', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', miles: 42000, rank: 2, isPublic: true },
    { id: '3', name: 'Amelia Earhart', username: 'amelia', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', miles: 38000, rank: 3, isPublic: true },
    { id: '4', name: 'Nelly Bly', username: 'nelly', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', miles: 35000, rank: 4, isPublic: true },
    { id: 'u1', name: 'Alex Traveler', username: 'alextravels', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', miles: 1250, rank: 10, isPublic: true }
];

const calculateRank = (miles: number): TravelerRank => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (miles >= RANKS[i].minMiles) return RANKS[i].name;
    }
    return 'Turista';
};

const getNextRank = (currentRank: TravelerRank) => {
    const idx = RANKS.findIndex(r => r.name === currentRank);
    return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
};

const SPAIN_CITIES = [
  { name: 'Barcelona', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80', desc: 'Sagrada Familia y Gaudí.' },
  { name: 'Madrid', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80', desc: 'Gran Vía y Secretos.' },
  { name: 'Sevilla', image: 'https://images.unsplash.com/photo-1621590393529-6330364e9766?auto=format&fit=crop&w=800&q=80', desc: 'Plaza de España y Color.' },
  { name: 'Granada', image: 'https://images.unsplash.com/photo-1620663436028-2f831c28b792?auto=format&fit=crop&w=800&q=80', desc: 'La Alhambra Eterna.' },
  { name: 'Valencia', image: 'https://images.unsplash.com/photo-1571216686313-20293946ca35?auto=format&fit=crop&w=800&q=80', desc: 'Artes, Ciencias y Paella.' },
  { name: 'San Sebastián', image: 'https://images.unsplash.com/photo-1544918877-460635b6d13e?auto=format&fit=crop&w=800&q=80', desc: 'La Concha y Gastronomía.' },
  { name: 'Santiago', image: 'https://images.unsplash.com/photo-1593414212513-88697960177?auto=format&fit=crop&w=800&q=80', desc: 'Catedral y el Camino.' },
];

const WORLD_CITIES = [
  { name: 'Miami', image: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&w=800&q=80', desc: 'South Beach y Art Deco.' },
  { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80', desc: 'Shibuya y Neones.' },
  { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', desc: 'Eiffel y Amour.' },
  { name: 'Roma', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80', desc: 'Coliseo Eterno.' },
  { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80', desc: 'Skyline de Manhattan.' },
];

const SectionRow = ({ title, markerColor, children }: { title: string, markerColor: string, children?: React.ReactNode }) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const scroll = (offset: number) => { if (rowRef.current) rowRef.current.scrollBy({ left: offset, behavior: 'smooth' }); };
    return (
        <div className="px-6 mb-8 relative group">
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-1 h-6 ${markerColor} rounded-full`}></div>
                <h3 className="font-heading font-bold text-xl text-slate-800">{title}</h3>
            </div>
            <div className="relative -mx-6 px-6"> 
                <button onClick={() => scroll(-280)} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-slate-800 border border-slate-100 hover:bg-white hover:scale-110 active:scale-95 transition-all hidden group-hover:flex"><i className="fas fa-chevron-left text-sm"></i></button>
                <div ref={rowRef} className="overflow-x-auto no-scrollbar flex gap-4 pb-4 snap-x snap-mandatory">{children}</div>
                <button onClick={() => scroll(280)} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-slate-800 border border-slate-100 hover:bg-white hover:scale-110 active:scale-95 transition-all hidden group-hover:flex"><i className="fas fa-chevron-right text-sm"></i></button>
            </div>
        </div>
    );
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [tours, setTours] = useState<Tour[]>([]);
  const [cityInfo, setCityInfo] = useState<CityInfo | null>(null);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isLoadingTours, setIsLoadingTours] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [selectedLeaderboardUser, setSelectedLeaderboardUser] = useState<LeaderboardEntry | null>(null);
  const [showAiMemory, setShowAiMemory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      username: '',
      birthDate: '',
      isPublic: true,
      accessibility: 'standard' as any
  });
  const [authError, setAuthError] = useState('');

  const t = (key: string) => {
      const dict = TRANSLATIONS[user.language] || TRANSLATIONS['en'];
      return dict[key] || TRANSLATIONS['en'][key] || key;
  };

  useEffect(() => {
    if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn("GPS Error", err),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
     const newRank = calculateRank(user.miles);
     if (newRank !== user.rank) {
         setUser(prev => ({ ...prev, rank: newRank }));
     }
  }, [user.miles]);

  const handleAuthSubmit = () => {
      setAuthError('');
      if (!authForm.email || !authForm.email.includes('@')) { setAuthError(t('invalidEmail')); return; }
      if (!authForm.password || authForm.password.length < 4) { setAuthError(t('passShort')); return; }

      if (authMode === 'register') {
          if (!authForm.firstName || !authForm.lastName) { setAuthError(t('nameReq')); return; }
          if (!authForm.username) { setAuthError(t('usernameReq')); return; }
          if (!authForm.birthDate) { setAuthError(t('dateReq')); return; }

          setUser({
              ...INITIAL_USER,
              isLoggedIn: true,
              firstName: authForm.firstName,
              lastName: authForm.lastName,
              name: `${authForm.firstName} ${authForm.lastName}`,
              username: authForm.username,
              email: authForm.email,
              isPublic: authForm.isPublic,
              accessibility: authForm.accessibility,
              joinDate: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
              language: user.language
          });
      } else {
          setUser({ ...user, isLoggedIn: true });
      }
      setView(AppView.WELCOME);
  };

  const handleCitySelect = async (city: string) => {
    setSelectedCity(city);
    setIsLoadingTours(true);
    setCityInfo(null);
    setView(AppView.CITY_DETAIL);
    
    try {
        const [generatedTours, generatedInfo] = await Promise.all([
            generateToursForCity(city, user.language),
            getCityInfo(city, user.language)
        ]);
        setTours(generatedTours);
        setCityInfo(generatedInfo);
    } catch (e) { 
        console.error(e); 
    } finally { 
        setIsLoadingTours(false); 
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          handleCitySelect(searchQuery);
          setSearchQuery('');
      }
  };

  const handleTourSelect = (tour: Tour) => {
      setActiveTour(tour);
      setCurrentStopIndex(0);
      setView(AppView.TOUR_ACTIVE);
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
    if (audioPlayingId === id) {
        setAudioPlayingId(null);
        return;
    }
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    setAudioLoadingId(id);
    
    try {
        const base64Audio = await generateAudio(text);
        if (!base64Audio) throw new Error("No audio returned");
        const pcmBytes = base64ToUint8Array(base64Audio);
        const audioBuffer = pcmToAudioBuffer(pcmBytes, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setAudioPlayingId(null);
            audioSourceRef.current = null;
        };
        source.start(0);
        audioSourceRef.current = source;
        setAudioPlayingId(id);
    } catch (e) { 
        console.error("Audio playback failed", e);
    } finally { 
        setAudioLoadingId(null); 
    }
  };

  const handleCheckIn = (stopId: string, baseMiles: number, stopType: string) => {
      if (!activeTour) return;
      const updatedStops = activeTour.stops.map(s => s.id === stopId ? { ...s, visited: true } : s);
      setActiveTour({ ...activeTour, stops: updatedStops });
      let bonuses = { food: 50, photo: 100, historical: 50, art: 50 };
      let bonus = (bonuses as any)[stopType] || 0;

      setUser(prev => ({
          ...prev,
          miles: prev.miles + baseMiles + bonus,
          visitedCities: !prev.visitedCities.includes(activeTour.city) ? [...prev.visitedCities, activeTour.city] : prev.visitedCities
      }));
  };

  const handleEnrichStop = async (stopId: string) => {
      if (!activeTour) return;
      const stopIndex = activeTour.stops.findIndex(s => s.id === stopId);
      if (stopIndex === -1) return;
      const stop = activeTour.stops[stopIndex];
      if (!stop.isRichInfo) {
          const richData = await generateStopDetails(stop.name, activeTour.city, user.language);
          const newStops = [...activeTour.stops];
          newStops[stopIndex] = { ...stop, ...richData, isRichInfo: true };
          setActiveTour({ ...activeTour, stops: newStops });
      }
  };

  const renderLogin = () => (
      <div className="h-screen w-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1080&q=80" 
               className="w-full h-full object-cover opacity-80" 
               alt="Background"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80"></div>
          </div>
          <div className="relative z-10 w-full max-w-sm">
              <div className="flex flex-col items-center mb-10">
                  <div className="w-40 h-40 flex items-center justify-center mb-4">
                      <BdaiLogo className="w-full h-full text-white" />
                  </div>
                  <h1 className="text-6xl font-heading font-black text-white tracking-tighter lowercase">bdai</h1>
                  <p className="text-white text-sm font-bold tracking-widest uppercase opacity-90">{t('heroSubtitle')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl overflow-hidden">
                   <div className="flex justify-end mb-4">
                       <select value={user.language} onChange={(e) => setUser({...user, language: e.target.value})} className="bg-black/30 text-white text-xs font-bold py-1 px-3 rounded-full border border-white/10">
                           {LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-slate-900">{l.name}</option>)}
                       </select>
                   </div>
                   <div className="flex bg-black/20 rounded-xl p-1 mb-6 border border-white/5">
                       <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300'}`}>{t('login')}</button>
                       <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300'}`}>{t('register')}</button>
                   </div>
                   <div className="space-y-4">
                       {authMode === 'register' && (
                           <>
                               <div className="grid grid-cols-2 gap-3">
                                   <div><label className="text-slate-200 text-[10px] font-bold uppercase ml-1">{t('name')}</label><input type="text" value={authForm.firstName} onChange={(e) => setAuthForm({...authForm, firstName: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none"/></div>
                                   <div><label className="text-slate-200 text-[10px] font-bold uppercase ml-1">{t('surname')}</label><input type="text" value={authForm.lastName} onChange={(e) => setAuthForm({...authForm, lastName: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none"/></div>
                                </div>
                                <div><label className="text-slate-200 text-[10px] font-bold uppercase ml-1">{t('username')}</label><input type="text" value={authForm.username} onChange={(e) => setAuthForm({...authForm, username: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" placeholder="@"/></div>
                           </>
                       )}
                       <div><label className="text-slate-200 text-[10px] font-bold uppercase ml-1">{t('email')}</label><input type="email" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none"/></div>
                       {authMode === 'register' && (
                           <>
                               <div><label className="text-slate-200 text-[10px] font-bold uppercase ml-1">{t('birthDate')}</label><input type="date" value={authForm.birthDate} onChange={(e) => setAuthForm({...authForm, birthDate: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none"/></div>
                               <div className="space-y-1">
                                    <label className="text-slate-200 text-[10px] font-bold uppercase ml-1">{t('accessibilityLabel')}</label>
                                    <select value={authForm.accessibility} onChange={e => setAuthForm({...authForm, accessibility: e.target.value as any})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none font-bold">
                                        <option value="standard" className="bg-slate-900">{t('acc_standard')}</option>
                                        <option value="wheelchair" className="bg-slate-900">{t('acc_wheelchair')}</option>
                                        <option value="low_walking" className="bg-slate-900">{t('acc_low_walking')}</option>
                                    </select>
                                </div>
                               <div className="flex items-center gap-3 pt-2">
                                   <div onClick={() => setAuthForm({...authForm, isPublic: !authForm.isPublic})} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${authForm.isPublic ? 'bg-green-500' : 'bg-slate-600'}`}><div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${authForm.isPublic ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                                   <span className="text-slate-200 text-xs font-bold">{t('rankingVisibility')}</span>
                               </div>
                           </>
                       )}
                       <div><label className="text-slate-200 text-[10px] font-bold uppercase ml-1">{t('password')}</label><input type="password" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm outline-none"/></div>
                       {authError && <p className="text-red-400 text-xs text-center font-bold mt-2 bg-red-900/50 py-1 rounded">{authError}</p>}
                       <button onClick={handleAuthSubmit} className="w-full py-4 mt-2 bg-white text-slate-900 rounded-xl font-black hover:bg-slate-100 transition-all active:scale-95 text-sm uppercase tracking-wide shadow-lg">{authMode === 'login' ? t('signin') : t('createAccount')}</button>
                   </div>
              </div>
          </div>
      </div>
  );

  if (view === AppView.LOGIN) return renderLogin();
  if (view === AppView.WELCOME) return <Onboarding key={user.language} onComplete={() => setView(AppView.HOME)} language={user.language} />;
  
  if (view === AppView.TOUR_ACTIVE && activeTour) {
      return (
          <div className="h-screen w-full flex flex-col bg-white">
              <div className="h-[45vh] w-full relative">
                  <SchematicMap stops={activeTour.stops} currentStopIndex={currentStopIndex} userLocation={userLocation} />
                  <button onClick={() => setView(AppView.CITY_DETAIL)} className="absolute top-4 left-4 z-[400] w-10 h-10 bg-white text-slate-900 rounded-full shadow-lg flex items-center justify-center"><i className="fas fa-times"></i></button>
              </div>
              <div className="flex-1 relative z-10 -mt-6 bg-white rounded-t-[2rem] shadow-2xl overflow-hidden">
                  <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => { if (currentStopIndex < activeTour.stops.length - 1) setCurrentStopIndex(prev => prev + 1); else { alert("Tour Completado!"); setView(AppView.HOME); } }} onPrev={() => { if (currentStopIndex > 0) setCurrentStopIndex(prev => prev - 1); }} language={user.language} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} onCheckIn={handleCheckIn} userLocation={userLocation} onEnrichStop={handleEnrichStop}/>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden font-sans">
      {selectedLeaderboardUser && <ProfileModal user={selectedLeaderboardUser} onClose={() => setSelectedLeaderboardUser(null)} isOwnProfile={false} language={user.language} />}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-0">
          {view === AppView.HOME && (
            <div className="space-y-8 pb-24 pt-safe">
                <header className="flex justify-between items-center px-6 pt-6">
                    <div className="flex items-center gap-2"><div className="w-10 h-10"><BdaiLogo className="w-full h-full" /></div><span className="font-heading font-bold text-xl tracking-tight text-slate-900 lowercase">bdai</span></div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <select value={user.language} onChange={(e) => setUser({...user, language: e.target.value})} className="appearance-none bg-white pl-4 pr-8 py-2 rounded-full shadow-sm border border-slate-100 text-xs font-bold text-slate-700 outline-none uppercase tracking-wider">
                                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.code}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none"><i className="fas fa-chevron-down text-[10px] text-slate-400 group-hover:text-purple-500 transition-colors"></i></div>
                        </div>
                        <button onClick={() => setView(AppView.PROFILE)} className="relative group"><img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover transition-transform group-active:scale-95" alt="Profile" /></button>
                    </div>
                </header>
                <div className="px-6">
                    <h1 className="text-4xl font-heading font-bold text-slate-900 leading-tight mb-2">{t('welcome')} <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">{user.firstName}.</span></h1>
                    <p className="text-slate-500 font-medium mb-6">{t('whereTo')}</p>
                    <form onSubmit={handleSearchSubmit} className="relative group z-30"><i className="fas fa-search absolute left-4 top-3.5 text-slate-400 transition-colors"></i><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-800 focus:outline-none focus:border-purple-500 shadow-sm transition-all"/></form>
                </div>
                <SectionRow title={t('spainDestinations')} markerColor="bg-yellow-400">{SPAIN_CITIES.map((city) => (<div key={city.name} onClick={() => handleCitySelect(city.name)} className="w-60 flex-shrink-0 group cursor-pointer snap-center"><CityCard name={city.name} image={city.image} description={city.desc} onClick={() => handleCitySelect(city.name)}/></div>))}</SectionRow>
                <SectionRow title={t('topWorldDestinations')} markerColor="bg-gradient-to-r from-purple-50 to-pink-500">{WORLD_CITIES.map((city) => (<div key={city.name} onClick={() => handleCitySelect(city.name)} className="w-60 flex-shrink-0 group cursor-pointer snap-center"><CityCard name={city.name} image={city.image} description={city.desc} onClick={() => handleCitySelect(city.name)}/></div>))}</SectionRow>
                <div className="px-6 grid grid-cols-2 gap-4">
                    <div onClick={() => setView(AppView.LEADERBOARD)} className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 cursor-pointer hover:scale-[1.02] transition"><i className="fas fa-trophy text-2xl text-yellow-600 mb-2"></i><h3 className="font-bold text-slate-800">{t('ranking')}</h3><p className="text-xs text-slate-500">{user.miles} {t('miles')}</p></div>
                    <div onClick={() => setView(AppView.SHOP)} className="bg-purple-50 p-4 rounded-2xl border border-purple-100 cursor-pointer hover:scale-[1.02] transition"><i className="fas fa-shopping-bag text-2xl text-purple-600 mb-2"></i><h3 className="font-bold text-slate-800">{t('shop')}</h3><p className="text-xs text-slate-500">bdai Store</p></div>
                </div>
            </div>
          )}
          {view === AppView.CITY_DETAIL && (
            <div className="h-full flex flex-col pb-24">
                <div className="px-6 pt-6 pb-4 bg-white sticky top-0 z-20 flex items-center gap-4 border-b border-slate-100 pt-safe"><button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><i className="fas fa-arrow-left"></i></button><h2 className="text-2xl font-bold text-slate-900">{selectedCity}</h2></div>
                <div className="p-6 space-y-6">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-lg"><div className="flex items-center gap-3"><i className="fas fa-cloud-download-alt text-xl text-green-400"></i><div><p className="font-bold text-sm">Modo Offline</p><p className="text-[10px] text-slate-400">{t('downloadOffline')}</p></div></div><button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition">Descargar</button></div>
                    <div>
                        <h3 className="font-bold font-heading text-lg text-slate-800 mb-3 flex items-center gap-2"><i className="fas fa-info-circle text-purple-500"></i> {t('cityIntel')}</h3>
                        {cityInfo ? (
                            <div className="space-y-4 animate-slide-up">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col h-full"><i className="fas fa-bus text-blue-500 mb-2 text-xl"></i><div><p className="text-[10px] font-bold text-slate-400 uppercase">{t('transportLabel')}</p><p className="text-xs font-bold text-slate-800 mt-1">{cityInfo.transport}</p></div></div>
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col h-full"><i className="fas fa-calendar-day text-orange-500 mb-2 text-xl"></i><div><p className="text-[10px] font-bold text-slate-400 uppercase">{t('bestTimeLabel')}</p><p className="text-xs font-bold text-slate-800 mt-1">{cityInfo.bestTime}</p></div></div>
                                    <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 flex flex-col h-full"><i className="fas fa-utensils text-pink-500 mb-2 text-xl"></i><div><p className="text-[10px] font-bold text-slate-400 uppercase">{t('dishLabel')}</p><p className="text-xs font-bold text-slate-800 mt-1">{cityInfo.localDish}</p></div></div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col h-full"><i className="fas fa-wallet text-green-500 mb-2 text-xl"></i><div><p className="text-[10px] font-bold text-slate-400 uppercase">{t('costLabel')}</p><p className="text-xs font-bold text-slate-800 mt-1">{cityInfo.costLevel}</p></div></div>
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col h-full col-span-2"><i className="fas fa-shield-alt text-red-500 mb-2 text-xl"></i><div><p className="text-[10px] font-bold text-slate-400 uppercase">{t('securityLabel')}</p><p className="text-xs font-bold text-slate-800 mt-1">{cityInfo.securityLevel}</p></div></div>
                                </div>
                                <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                                    <h4 className="font-bold text-sm text-cyan-900 mb-2 flex items-center gap-2"><i className="fas fa-wifi"></i> {t('wifiLabel')}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {cityInfo.wifiSpots.map((spot, i) => <span key={i} className="text-[10px] font-bold text-cyan-700 bg-white px-2 py-1 rounded-md shadow-sm">📍 {spot}</span>)}
                                    </div>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100"><h4 className="font-bold text-sm text-indigo-900 mb-2">{t('lingoLabel')}</h4><div className="space-y-2">{cityInfo.lingo.map((p, i) => <div key={i} className="text-xs font-medium text-slate-700 bg-white p-2 rounded shadow-sm">💬 {p}</div>)}</div></div>
                            </div>
                        ) : (<div className="text-center py-4 text-slate-400 text-xs">{t('loadingIntel')}</div>)}
                    </div>
                    {isLoadingTours ? <div className="text-center py-20"><i className="fas fa-spinner fa-spin text-purple-600 text-3xl"></i></div> : tours.map(tour => (
                        <div key={tour.id} className="h-[450px]">
                            <TourCard 
                                tour={tour} 
                                onSelect={handleTourSelect} 
                                onPlayAudio={(t) => { handlePlayAudio(t.id, t.description); }} 
                                isPlayingAudio={audioPlayingId === tour.id} 
                                isAudioLoading={audioLoadingId === tour.id} 
                                isFavorite={false} 
                                onToggleFavorite={() => {}} 
                            />
                        </div>
                    ))}
                </div>
            </div>
          )}
          {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} onUpdateUser={setUser} language={user.language} />}
          {view === AppView.LEADERBOARD && <Leaderboard currentUser={{...user, rank: 0}} entries={MOCK_LEADERBOARD} onUserClick={setSelectedLeaderboardUser} language={user.language} />}
          {view === AppView.SHOP && <Shop user={user} />}
          {view === AppView.CONNECT && <div className="p-6 pb-24 space-y-6 pt-safe"><h2 className="text-2xl font-bold font-heading">{t('tools')}</h2><CurrencyConverter language={user.language} /></div>}
      </div>
      {view !== AppView.TOUR_ACTIVE && view !== AppView.CITY_DETAIL && (
          <div className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center relative z-20 shadow-lg pb-safe">
              <NavButton icon="fa-compass" label={t('explore')} isActive={view === AppView.HOME} onClick={() => setView(AppView.HOME)} />
              <NavButton icon="fa-passport" label={t('passport')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
              <NavButton icon="fa-shopping-bag" label={t('shop')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
              <NavButton icon="fa-tools" label={t('connect')} isActive={view === AppView.CONNECT} onClick={() => setView(AppView.CONNECT)} />
          </div>
      )}
    </div>
  );
}

const NavButton = ({ icon, label, isActive, onClick }: any) => (<button onClick={onClick} className={`flex flex-col items-center gap-1 w-16 transition-colors ${isActive ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}><i className={`fas ${icon} text-lg ${isActive ? 'animate-bounce' : ''}`}></i><span className="text-[9px] font-bold uppercase tracking-wide">{label}</span></button>);
