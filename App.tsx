
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, generateStopDetails, generateAudio, LANGUAGE_NAMES } from './services/geminiService';
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
  en: { welcome: "Hello,", guest: "Traveler", explore: "Explore", passport: "Passport", shop: "Shop", utilities: "Tools", ranking: "Ranking", searchPlaceholder: "Any city in the world...", login: "Create Passport", continueGuest: "Explore as Guest", tagline: "better destinations by ai", spain: "Spain Highlights", world: "Global Explorations", analyze: "Analyzing with AI...", resultsFor: "Tours in", topExplorers: "Top Explorers", viewRanking: "View Ranking", mobility: "Mobility Guide", availableApps: "Available Apps", publicTransportLabel: "Public Transport", defaultTransport: "Local transport network operating normally." },
  es: { welcome: "Hola,", guest: "Viajero", explore: "Explorar", passport: "Pasaporte", shop: "Tienda", utilities: "Herramientas", ranking: "Ranking", searchPlaceholder: "Cualquier ciudad del mundo...", login: "Crear Pasaporte", continueGuest: "Explorar como Invitado", tagline: "better destinations by ai", spain: "Joyas de España", world: "Exploración Global", analyze: "Analizando con IA...", resultsFor: "Tours en", topExplorers: "Top Exploradores", viewRanking: "Ver Ranking", mobility: "Guía de Movilidad", availableApps: "Apps Disponibles", publicTransportLabel: "Transporte Público", defaultTransport: "Red de transporte local operando con normalidad." },
  eu: { welcome: "Kaixo,", guest: "Bidaiaria", explore: "Esploratu", passport: "Pasaportea", shop: "Denda", utilities: "Tresnak", ranking: "Sailkapena", searchPlaceholder: "Munduko edozein hiri...", login: "Pasaportea sortu", continueGuest: "Esploratu gonbidatu gisa", tagline: "better destinations by ai", spain: "Espainiako aipagarrienak", world: "Explorazio globala", analyze: "AIrekin aztertzen...", resultsFor: "Ibilbideak hemen:", topExplorers: "Esploratzaile onenak", viewRanking: "Ikusi sailkapena", mobility: "Mugikortasun gida", availableApps: "Eskuragarri dauden aplikazioak", publicTransportLabel: "Garraio Publikoa", defaultTransport: "Tokiko garraio sarea normaltasunez dabil." },
  ca: { welcome: "Hola,", guest: "Viatger", explore: "Explorar", passport: "Passaport", shop: "Botiga", utilities: "Eines", ranking: "Ranking", searchPlaceholder: "Qualsevol ciutat del món...", login: "Crear Passaport", continueGuest: "Explorar com a Convidat", tagline: "better destinations by ai", spain: "Joies d'Espanya", world: "Exploració Global", analyze: "Analitzant con IA...", resultsFor: "Tours a", topExplorers: "Top Exploradors", viewRanking: "Veure Ranking", mobility: "Guia de Mobilitat", availableApps: "Apps Disponibles", publicTransportLabel: "Transport Público", defaultTransport: "Xarxa de transport local operant amb normalitat." },
  fr: { welcome: "Bonjour,", guest: "Voyageur", explore: "Explorer", passport: "Passeport", shop: "Boutique", utilities: "Outils", ranking: "Classement", searchPlaceholder: "N'importe quelle ville...", login: "Créer un Passeport", continueGuest: "Explorer en invité", tagline: "better destinations by ai", spain: "Points forts de l'Espagne", world: "Explorations mondiales", analyze: "Analyse avec l'IA...", resultsFor: "Tours à", topExplorers: "Top Explorateurs", viewRanking: "Voir le classement", mobility: "Guide de mobilité", availableApps: "Apps disponibles", publicTransportLabel: "Transports publics", defaultTransport: "Réseau de transport local fonctionnant normalement." },
  de: { welcome: "Hallo,", guest: "Reisender", explore: "Erkunden", passport: "Reisepass", shop: "Shop", utilities: "Tools", ranking: "Ranking", searchPlaceholder: "Jede Stadt der Welt...", login: "Reisepass erstellen", continueGuest: "Als Gast erkunden", tagline: "better destinations by ai", spain: "Spanien Highlights", world: "Globale Erkundungen", analyze: "KI-Analyse...", resultsFor: "Touren in", topExplorers: "Top-Entdecker", viewRanking: "Ranking ansehen", mobility: "Mobilitätsleitfaden", availableApps: "Verfügbare Apps", publicTransportLabel: "Öffentlicher Verkehr", defaultTransport: "Lokales Verkehrsnetz normal in Betrieb." },
  ar: { welcome: "مرحباً،", guest: "مسافر", explore: "استكشف", passport: "جواز السفر", shop: "متجر", utilities: "أدوات", ranking: "ترتيب", searchPlaceholder: "أي مدينة في العالم...", login: "إنشاء جواز سفر", continueGuest: "استكشاف كضيف", tagline: "better destinations by ai", spain: "أبرز معالم إسبانيا", world: "استكشافات عالمية", analyze: "جارٍ التحليل بالذكاء الاصطناعي...", resultsFor: "جولات في", topExplorers: "أفضل المستكشفين", viewRanking: "عرض الترتيب", mobility: "دليل التنقل", availableApps: "التطبيقات المتاحة", publicTransportLabel: "النقل العام", defaultTransport: "شبكة النقل المحلي تعمل كالمعتاد." },
  zh: { welcome: "您好，", guest: "旅行者", explore: "探索", passport: "护照", shop: "商店", utilities: "工具", ranking: "排行", searchPlaceholder: "世界任何城市...", login: "创建护照", continueGuest: "以访客身份探索", tagline: "better destinations by ai", spain: "西班牙精选", world: "全球探索", analyze: "AI 分析中...", resultsFor: "行程在", topExplorers: "顶级探险家", viewRanking: "查看排行", mobility: "出行指南", availableApps: "可用应用", publicTransportLabel: "公共交通", defaultTransport: "当地交通网络运行正常。" },
  ja: { welcome: "こんにちは、", guest: "旅行者", explore: "探索", passport: "パスポート", shop: "ショップ", utilities: "ツール", ranking: "ランキング", searchPlaceholder: "世界のあらゆる都市...", login: "パスポート作成", continueGuest: "ゲストとして探索", tagline: "better destinations by ai", spain: "スペインのハイライト", world: "グローバル探索", analyze: "AIで分析中...", resultsFor: "のツアー：", topExplorers: "トップ冒険家", viewRanking: "ランキングを見る", mobility: "モビリティガイド", availableApps: "利用可能なアプリ", publicTransportLabel: "公共交通機関", defaultTransport: "地元の交通機関は正常に運行しています。" }
};

export const FlagIcon = ({ code, className = "w-5 h-3.5" }: { code: string, className?: string }) => {
    switch(code) {
        case 'es': return ( <svg viewBox="0 0 750 500" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="750" height="500" fill="#c60b1e"/><rect width="750" height="250" y="125" fill="#ffc400"/></svg> );
        case 'en': return ( <svg viewBox="0 0 741 390" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="741" height="390" fill="#fff"/><path d="M0 0h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0zm0 60h741v30H0z" fill="#b22234"/><rect width="296" height="210" fill="#3c3b6e"/></svg> );
        case 'ca': return ( <svg viewBox="0 0 9 6" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="9" height="6" fill="#FCDD09"/><path d="M0 1h9M0 2.33h9M0 3.66h9M0 5h9" stroke="#DA121A" strokeWidth="0.66"/></svg> );
        case 'eu': return ( <svg viewBox="0 0 280 160" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="280" height="160" fill="#D31027"/><path d="M0 0l280 160M0 160L280 0" stroke="#009543" strokeWidth="20"/><path d="M140 0v160M0 80h280" stroke="#FFF" strokeWidth="16"/></svg> );
        case 'fr': return ( <svg viewBox="0 0 3 2" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="1" height="2" fill="#002395"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#ed2939"/></svg> );
        case 'de': return ( <svg viewBox="0 0 5 3" className={className} xmlns="http://www.w3.org/2000/svg"><rect width="5" height="1" fill="#000"/><rect width="5" height="1" y="1" fill="#d00"/><rect width="5" height="1" y="2" fill="#ffce00"/></svg> );
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
    { name: 'Sevilla', image: 'https://images.unsplash.com/photo-1621590393529-6330364e9766?auto=format&fit=crop&w=600&q=80', desc: "Arte y Azahar" },
    { name: 'Valencia', image: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=600&q=80', desc: "Luz y Modernidad" },
    { name: 'Granada', image: 'https://images.unsplash.com/photo-1527593346332-96947230460c?auto=format&fit=crop&w=600&q=80', desc: "Magia Nazarí" },
    { name: 'Mallorca', image: 'https://images.unsplash.com/photo-1516815231560-8581bb63041c?auto=format&fit=crop&w=600&q=80', desc: "El Paraíso Balear" },
    { name: 'Bilbao', image: 'https://images.unsplash.com/photo-1563292434-2e923b7e7cc7?auto=format&fit=crop&w=600&q=80', desc: "Arquitectura y Sabor" },
    { name: 'San Sebastián', image: 'https://images.unsplash.com/photo-1523498877561-f09b5ca14660?auto=format&fit=crop&w=600&q=80', desc: "La Concha y Pintxos" },
    { name: 'Málaga', image: 'https://images.unsplash.com/photo-1512411802905-22a4f479a957?auto=format&fit=crop&w=600&q=80', desc: "Sol y Picasso" },
    { name: 'Santiago de Compostela', image: 'https://images.unsplash.com/photo-1555562142-f8d95650125a?auto=format&fit=crop&w=600&q=80', desc: "Fe y Granito" }
  ],
  world: [
    { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80', desc: "The Big Apple" },
    { name: 'Tokyo', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80', desc: "Futuro y Tradición" },
    { name: 'Roma', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80', desc: "Historia Eterna" },
    { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80', desc: "La Cité de la Lumière" },
    { name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80', desc: "Mist and History" },
    { name: 'Sydney', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80', desc: "Harbor and Sun" },
    { name: 'Berlin', image: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=600&q=80', desc: "History Reborn" },
    { name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80', desc: "Desert Luxury" },
    { name: 'Kyoto', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80', desc: "Ancient Zen" },
    { name: 'Mexico City', image: 'https://images.unsplash.com/photo-1512813195391-454ca93d300a?auto=format&fit=crop&w=600&q=80', desc: "Cultural Heart" },
    { name: 'Buenos Aires', image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=600&q=80', desc: "Tango and Passion" }
  ]
});

const GUEST_USER: UserProfile = {
  id: 'guest', isLoggedIn: false, firstName: 'Invitado', lastName: 'bdai', name: 'Invitado', username: 'viajero_libre', email: '', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', language: 'es', miles: 1250, rank: 'Explorer', culturePoints: 0, foodPoints: 0, photoPoints: 0, interests: [], accessibility: 'standard', isPublic: false, bio: 'Explorando el mundo.', age: 25, visitedCities: ['Madrid'], completedTours: [], badges: [], passportNumber: 'XP-8829-GUEST', joinDate: '2024-05-15'
};

const SectionRow = ({ title, children }: { title: string, children?: React.ReactNode }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 10);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
    };

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = 300; 
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            checkScroll();
            el.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
        }
        return () => {
            if (el) {
                el.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            }
        };
    }, []);

    return (
        <div className="px-6 mb-8 relative group">
            <h3 className="font-heading font-black text-xl text-slate-900 flex items-center gap-2 mb-4">
                <span className="w-1.5 h-6 bg-purple-600 rounded-full"></span>
                {title}
            </h3>
            <div className="relative">
                {showLeft && <button onClick={() => scroll('left')} className="absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-slate-100 flex items-center justify-center text-purple-600 animate-fade-in"><i className="fas fa-chevron-left text-lg"></i></button>}
                {showRight && <button onClick={() => scroll('right')} className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-slate-100 flex items-center justify-center text-purple-600 animate-fade-in"><i className="fas fa-chevron-right text-lg"></i></button>}
                <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory pt-2 scroll-smooth">
                    {children}
                </div>
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

  const t = (key: string) => (TRANSLATIONS[user.language] || TRANSLATIONS['en'])[key] || key;
  const citiesData = getCitiesByContinent(t);

  const initAudio = async () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    return audioContextRef.current;
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (audioPlayingId === id) {
        audioSourceRef.current?.stop();
        setAudioPlayingId(null);
        return;
    }
    audioSourceRef.current?.stop();
    setAudioPlayingId(null);
    setAudioLoadingId(id);
    try {
        const ctx = await initAudio();
        const audioBase64 = await generateAudio(text);
        if (!audioBase64) throw new Error();
        const bytes = decodeBase64(audioBase64);
        const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => { if (audioSourceRef.current === source) setAudioPlayingId(null); };
        source.start(0);
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

  if (view === AppView.LOGIN) return (
      <div className="h-screen w-full flex flex-col items-center justify-end bg-slate-950 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 grayscale-[0.5] opacity-40 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80')] bg-cover"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          <div className="absolute top-12 left-0 right-0 z-20 flex flex-wrap justify-center gap-2 px-4">
              {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setUser({...user, language: l.code})} className={`w-11 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${user.language === l.code ? 'bg-white border-white scale-110 shadow-lg' : 'bg-black/20 border-white/20 opacity-60'}`}>
                      <FlagIcon code={l.code} className="w-7 h-auto shadow-sm" />
                  </button>
              ))}
          </div>
          <div className="relative z-10 mb-16 animate-fade-in">
              <BdaiLogo className="w-24 h-24 mx-auto mb-4" />
              <h1 className="text-6xl font-black text-white lowercase tracking-tighter mb-1">bdai</h1>
              <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">{t('tagline')}</p>
          </div>
          <div className="relative z-10 w-full max-w-xs space-y-4 mb-12">
              <button onClick={() => setView(AppView.WELCOME)} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"><i className="fas fa-passport text-purple-600"></i> {t('login')}</button>
              <button onClick={() => setView(AppView.HOME)} className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">{t('continueGuest')}</button>
          </div>
      </div>
  );

  if (view === AppView.WELCOME) return <Onboarding onComplete={() => setView(AppView.HOME)} language={user.language} onLanguageSelect={(l) => setUser({...user, language: l})} />;
  
  if (view === AppView.TOUR_ACTIVE && activeTour) return (
      <div className="h-screen w-full flex flex-col bg-white overflow-hidden animate-fade-in">
          <div className="h-[40vh] w-full relative">
              <SchematicMap stops={activeTour.stops} currentStopIndex={currentStopIndex} />
              <button onClick={() => setView(AppView.CITY_DETAIL)} className="absolute top-4 left-4 z-[400] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-900"><i className="fas fa-times"></i></button>
          </div>
          <div className="flex-1 relative z-10 -mt-8 bg-white rounded-t-[3rem] shadow-2xl overflow-hidden">
            <ActiveTourCard tour={activeTour} currentStopIndex={currentStopIndex} onNext={() => { if (currentStopIndex < activeTour.stops.length - 1) setCurrentStopIndex(prev => prev + 1); else setView(AppView.HOME); }} onPrev={() => { if (currentStopIndex > 0) setCurrentStopIndex(prev => prev - 1); }} language={user.language} onCheckIn={(id, m) => setUser(p => ({...p, miles: p.miles + m}))} onEnrichStop={async (id) => { const stop = activeTour.stops.find(s => s.id === id); if (!stop || stop.isRichInfo) return; const rich = await generateStopDetails(stop.name, activeTour.city, user.language); setActiveTour(prev => prev ? ({...prev, stops: prev.stops.map(s => s.id === id ? {...s, ...rich, isRichInfo: true} : s)}) : null); }} onPlayAudio={handlePlayAudio} audioPlayingId={audioPlayingId} audioLoadingId={audioLoadingId} />
          </div>
      </div>
  );

  const isExploreActive = view === AppView.HOME || view === AppView.CITY_DETAIL;

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {view === AppView.HOME && (
            <div className="space-y-8 pt-safe animate-fade-in px-6">
                <header className="flex justify-between items-center pt-6">
                    <div className="flex items-center gap-2"><BdaiLogo className="w-8 h-8"/><span className="font-heading font-black text-2xl lowercase tracking-tighter">bdai</span></div>
                    <button onClick={() => setView(AppView.PROFILE)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md active:scale-90 transition-transform"><img src={user.avatar} className="w-full h-full object-cover" alt="User"/></button>
                </header>
                <h1 className="text-4xl font-heading font-black leading-none tracking-tighter">{t('welcome')} <br/><span className="text-purple-600">{user.isLoggedIn ? user.firstName : t('guest')}.</span></h1>
                <form onSubmit={(e) => { e.preventDefault(); if (searchQuery) handleCitySelect(searchQuery); }} className="relative">
                    <i className="fas fa-search absolute left-4 top-3.5 text-slate-400"></i>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 shadow-sm outline-none font-medium" />
                </form>
                <SectionRow title={t('spain')}>{citiesData.spain.map(c => <div key={c.name} className="w-64 flex-shrink-0 snap-center"><CityCard name={c.name} image={c.image} description={c.desc} onClick={() => handleCitySelect(c.name)}/></div>)}</SectionRow>
                <SectionRow title={t('world')}>{citiesData.world.map(c => <div key={c.name} className="w-64 flex-shrink-0 snap-center"><CityCard name={c.name} image={c.image} description={c.desc} onClick={() => handleCitySelect(c.name)}/></div>)}</SectionRow>
            </div>
          )}
          {view === AppView.CITY_DETAIL && (
            <div className="pt-safe px-6 animate-fade-in">
                <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-slate-50/90 backdrop-blur-md z-10"><button onClick={() => setView(AppView.HOME)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><i className="fas fa-arrow-left"></i></button><div><p className="text-[9px] font-black uppercase text-purple-600 tracking-widest mb-1">{t('resultsFor')}</p><h2 className="text-2xl font-black leading-none">{selectedCity}</h2></div></header>
                {isLoading ? <div className="flex flex-col items-center justify-center py-24 text-slate-400"><i className="fas fa-spinner fa-spin text-3xl mb-4 text-purple-600"></i><p className="font-black uppercase text-[10px] tracking-widest">{t('analyze')}</p></div> : <div className="space-y-6 pb-12">{tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => {setActiveTour(tour); setView(AppView.TOUR_ACTIVE);}} onPlayAudio={() => handlePlayAudio(tour.id, tour.description)} isPlayingAudio={audioPlayingId === tour.id} isAudioLoading={audioLoadingId === tour.id} isFavorite={false} onToggleFavorite={() => {}} language={user.language} />)}</div>}
            </div>
          )}
          {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} isOwnProfile={true} language={user.language} onUpdateUser={setUser} />}
          {view === AppView.SHOP && <Shop user={user} />}
          {view === AppView.LEADERBOARD && <Leaderboard currentUser={user as any} entries={MOCK_LEADERBOARD} onUserClick={() => {}} language={user.language} />}
          {view === AppView.UTILITIES && <TravelServices language={user.language} />}
      </div>
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-4 pb-6 flex justify-center pointer-events-none">
          <nav className="bg-white/95 backdrop-blur-2xl border border-slate-200/50 px-3 py-3 flex justify-between items-center w-full rounded-[2.5rem] shadow-2xl pointer-events-auto">
              <div className="flex-1 flex justify-around items-center"><NavButton icon="fa-trophy" label={t('ranking')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} /><NavButton icon="fa-tools" label={t('utilities')} isActive={view === AppView.UTILITIES} onClick={() => setView(AppView.UTILITIES)} /></div>
              <div className="relative -mt-12 px-4"><button onClick={() => setView(AppView.HOME)} className={`group relative flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-500 transform active:scale-90 ${isExploreActive ? 'scale-110' : ''}`}>{isExploreActive && <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping"></div>}<div className={`relative z-10 w-full h-full rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition-all duration-500 overflow-hidden ${isExploreActive ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-slate-900 group-hover:bg-slate-800'}`}><BdaiLogo className={`w-12 h-12 transition-all duration-500 ${isExploreActive ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'opacity-80'}`} /></div><span className={`mt-2 text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isExploreActive ? 'text-purple-600 opacity-100' : 'text-slate-400 opacity-0'}`}>{t('explore')}</span></button></div>
              <div className="flex-1 flex justify-around items-center"><NavButton icon="fa-passport" label={t('passport')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} /><NavButton icon="fa-shopping-bag" label={t('shop')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} /></div>
          </nav>
      </div>
    </div>
  );
}

const NavButton = ({ icon, label, isActive, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 w-12 transition-all duration-300 ${isActive ? 'text-purple-600' : 'text-slate-400'}`}><div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-purple-100/50' : ''}`}><i className={`fas ${icon} text-base`}></i></div><span className="text-[6px] font-black uppercase tracking-[0.1em] leading-none text-center truncate w-full">{label}</span></button>
);
