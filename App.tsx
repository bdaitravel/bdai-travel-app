
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile, Tour, LANGUAGES } from './types';
import { generateToursForCity, standardizeCityName } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { Onboarding } from './components/Onboarding';
import { supabase, getUserProfileByEmail, syncUserProfile, getCachedTours, saveToursToCache, validateEmailFormat } from './services/supabaseClient';

const UI_STRINGS: any = {
  es: { welcome: "log bdai:", search: "buscar ciudad...", email: "tu email", login: "acceder", tag: "better destinations by ai", loading: "sincronizando...", nav1: "élite", nav2: "global", nav3: "visa", nav4: "tienda", verify: "verificar código", enterCode: "introduce el código" },
  en: { welcome: "bdai log:", search: "search city...", email: "your email", login: "login", tag: "better destinations by ai", loading: "syncing...", nav1: "elite", nav2: "global", nav3: "visa", nav4: "store", verify: "verify code", enterCode: "enter code" },
  zh: { welcome: "bdai 日志:", search: "搜索城市...", email: "电子邮箱", login: "登录", tag: "better destinations by ai", loading: "同步中...", nav1: "精英", nav2: "全球", nav3: "签证", nav4: "商店", verify: "验证", enterCode: "输入代码" },
  ca: { welcome: "log bdai:", search: "buscar ciutat...", email: "el teu email", login: "accedir", tag: "better destinations by ai", loading: "sincronitzant...", nav1: "elit", nav2: "global", nav3: "visa", nav4: "botiga", verify: "verificar", enterCode: "introdueix el codi" },
  eu: { welcome: "log bdai:", search: "hiria bilatu...", email: "zure emaila", login: "sartu", tag: "better destinations by ai", loading: "sinkronizatzen...", nav1: "elitea", nav2: "globala", nav3: "visa", nav4: "denda", verify: "egiaztatu", enterCode: "idatzi kodea" },
  gl: { welcome: "log bdai:", search: "buscar cidade...", email: "o teu email", login: "acceder", tag: "better destinations by ai", loading: "sincronizando...", nav1: "élite", nav2: "global", nav3: "visa", nav4: "tenda", verify: "verificar", enterCode: "introduce o código" },
  nl: { welcome: "bdai log:", search: "stad zoeken...", email: "je e-mail", login: "inloggen", tag: "better destinations by ai", loading: "synchroniseren...", nav1: "elite", nav2: "globaal", nav3: "visa", nav4: "winkel", verify: "verificeren", enterCode: "voer code in" },
  pl: { welcome: "log bdai:", search: "szukaj miasta...", email: "twój e-mail", login: "zaloguj", tag: "better destinations by ai", loading: "synchronizacja...", nav1: "elita", nav2: "globalny", nav3: "wiza", nav4: "sklep", verify: "weryfikuj", enterCode: "wpisz kod" },
  sv: { welcome: "bdai logg:", search: "sök stad...", email: "din e-post", login: "logga in", tag: "better destinations by ai", loading: "synkar...", nav1: "elit", nav2: "global", nav3: "visa", nav4: "butik", verify: "verifiera", enterCode: "ange kod" },
  el: { welcome: "bdai log:", search: "αναζήτηση πόλης...", email: "το email σου", login: "είσοδος", tag: "better destinations by ai", loading: "συγχρονισμός...", nav1: "ελίτ", nav2: "παγκόσμιο", nav3: "βίζα", nav4: "κατάστημα", verify: "επαλήθευση", enterCode: "κωδικός" },
  he: { welcome: "bdai log:", search: "חיפוש עיר...", email: "האימייל שלך", login: "התחברות", tag: "better destinations by ai", loading: "מסנכרן...", nav1: "עלית", nav2: "גלובלי", nav3: "ויזה", nav4: "חנות", verify: "אימות", enterCode: "הזן קוד" },
  vi: { welcome: "nhật ký bdai:", search: "tìm thành phố...", email: "email của bạn", login: "đăng nhập", tag: "better destinations by ai", loading: "đang đồng bộ...", nav1: "tinh hoa", nav2: "toàn cầu", nav3: "visa", nav4: "cửa hàng", verify: "xác minh", enterCode: "nhập mã" },
  th: { welcome: "บันทึก bdai:", search: "ค้นหาเมือง...", email: "อีเมลของคุณ", login: "เข้าสู่ระบบ", tag: "better destinations by ai", loading: "กำลังซิงค์...", nav1: "ชนชั้นนำ", nav2: "ทั่วโลก", nav3: "วีซ่า", nav4: "ร้านค้า", verify: "ยืนยัน", enterCode: "ใส่รหัส" },
  id: { welcome: "log bdai:", search: "cari kota...", email: "email anda", login: "masuk", tag: "better destinations by ai", loading: "sinkronisasi...", nav1: "elit", nav2: "global", nav3: "visa", nav4: "toko", verify: "verifikasi", enterCode: "masukkan kode" },
  ro: { welcome: "jurnal bdai:", search: "caută oraș...", email: "email-ul tău", login: "autentificare", tag: "better destinations by ai", loading: "sincronizare...", nav1: "elită", nav2: "global", nav3: "viză", nav4: "magazin", verify: "verifică", enterCode: "introdu codul" }
};

const GUEST: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", email: '', language: 'es', miles: 0, rank: 'Turist', 
  culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0, 
  interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, 
  stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0 }, 
  visitedCities: [], completedTours: [], badges: [], stamps: []
};

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [isReady, setIsReady] = useState(false);
  const [loginStep, setLoginStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const [user, setUser] = useState<UserProfile>(GUEST);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);

  const t = (key: string) => (UI_STRINGS[user.language] || UI_STRINGS.en)[key] || key;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await getUserProfileByEmail(session.user.email!);
        const finalUser = { ...(profile || GUEST), isLoggedIn: true, id: session.user.id, email: session.user.email! };
        setUser(finalUser);
        setView(AppView.HOME);
      }
      setIsReady(true);
    });
  }, []);

  const handleSearch = async (val: string) => {
    if (!val.trim() || loading) return;
    setLoading(true); setLoadMsg(t('searching') || "buscando...");
    try {
      const data = await standardizeCityName(val);
      setResults(data);
    } catch (e) { 
      console.error("Search error", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const selectCity = async (city: any) => {
    setLoading(true); setLoadMsg(t('processing') || "procesando..."); setResults(null);
    try {
      const cached = await getCachedTours(city.spanishName, city.country, user.language);
      if (cached) {
        setTours(cached);
        setView(AppView.CITY_DETAIL);
      } else {
        const gen = await generateToursForCity(city.spanishName, city.country, user);
        setTours(gen);
        await saveToursToCache(city.spanishName, city.country, user.language, gen);
        setView(AppView.CITY_DETAIL);
      }
    } catch (e) { 
        console.error("Tour generation error", e); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleLogin = async () => {
    if (!validateEmailFormat(email)) return alert("Email inválido");
    setLoading(true);
    setLoadMsg("conectando...");
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      setLoginStep('CODE');
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setLoadMsg("verificando...");
    const { data: { session }, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) { 
      setLoading(false); 
      return alert(error.message); 
    }
    if (session) {
      const profile = await getUserProfileByEmail(email);
      setUser({ ...(profile || GUEST), isLoggedIn: true, id: session.user.id, email });
      setView(AppView.HOME);
    }
    setLoading(false);
  };

  const changeLanguage = async (newLang: string) => {
    const updatedUser = { ...user, language: newLang };
    setUser(updatedUser);
    if (user.isLoggedIn) await syncUserProfile(updatedUser);
  };

  if (!isReady) return <div className="h-full bg-black flex items-center justify-center"><BdaiLogo className="w-12 h-12 animate-pulse" /></div>;

  return (
    <div className="flex-1 bg-black flex flex-col h-[100dvh] text-slate-100 overflow-hidden font-sans">
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-10 backdrop-blur-md">
          <BdaiLogo className="w-16 h-16 animate-pulse mb-8 opacity-40" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500/80">{loadMsg}</p>
        </div>
      )}

      {view === AppView.LOGIN ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative login-gradient overflow-hidden animate-fade-in">
          
          <div className="flex flex-col items-center mb-10 text-center">
            <BdaiLogo className="w-44 h-44 mb-2 animate-pulse-logo" />
            <h1 className="text-4xl font-black lowercase tracking-tighter text-white leading-none">bdai</h1>
            <p className="text-[10px] font-medium text-purple-400/80 lowercase tracking-widest -mt-1">{t('tag')}</p>
          </div>
          
          <div className="w-full max-w-[260px] space-y-4">
            {loginStep === 'EMAIL' ? (
              <div className="space-y-4">
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder={t('email')} 
                  className="w-full bg-white/[0.02] border border-white/10 p-4 rounded-full text-center text-sm outline-none focus:border-purple-500/40 transition-all placeholder:text-white/20 font-light" 
                />
                <button 
                  onClick={handleLogin} 
                  className="w-full bg-white text-black py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all"
                >
                  {t('login')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-[8px] font-black uppercase tracking-[0.3em] text-purple-400/60 mb-1">{t('enterCode')}</p>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  placeholder="000000" 
                  className="w-full bg-white/[0.02] border border-white/10 p-4 rounded-full text-center text-2xl font-black outline-none tracking-[0.4em] focus:border-purple-500/40 transition-all text-white" 
                />
                <button 
                  onClick={verifyOtp} 
                  className="w-full bg-purple-600 text-white py-4 rounded-full font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-purple-600/20"
                >
                  {t('verify')}
                </button>
                <button 
                  onClick={() => setLoginStep('EMAIL')}
                  className="w-full text-[8px] font-black text-white/20 uppercase tracking-widest pt-2"
                >
                  atrás
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-14 flex gap-2 overflow-x-auto p-4 no-scrollbar w-full max-w-[280px] justify-start px-6">
              {LANGUAGES.map(l => (
                  <button 
                    key={l.code} 
                    onClick={() => changeLanguage(l.code)} 
                    className={`w-8 h-8 rounded-full border shrink-0 flex items-center justify-center transition-all ${user.language === l.code ? 'border-purple-500 bg-purple-500/10 text-white shadow-[0_0_10px_rgba(147,51,234,0.2)]' : 'border-white/5 text-white/20 hover:border-white/20'}`}
                  >
                      <span className="text-[8px] font-black uppercase">{l.code}</span>
                  </button>
              ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
          <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
            {view === AppView.HOME && (
              <div className="p-6 pt-safe-iphone space-y-6 animate-fade-in">
                <header className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><BdaiLogo className="w-8 h-8"/><span className="font-black tracking-tighter lowercase">bdai</span></div>
                  <div className="bg-white/5 px-3 py-1.5 rounded-lg text-[9px] font-black italic tracking-widest">{user.miles} MILLAS</div>
                </header>
                
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{t('welcome')}<br/><span className="text-purple-500">{user.username || 'explorador'}</span></h2>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={searchVal} 
                    onChange={e => setSearchVal(e.target.value)} 
                    placeholder={t('search')} 
                    className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-purple-500 transition-all text-sm" 
                    onKeyDown={e => e.key === 'Enter' && handleSearch(searchVal)} 
                  />
                  <button onClick={() => handleSearch(searchVal)} className="bg-purple-600 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"><i className="fas fa-search" /></button>
                </div>

                {results && (
                  <div className="space-y-2 animate-fade-in">
                    {results.map((r, i) => (
                      <button key={i} onClick={() => selectCity(r)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-left flex justify-between items-center group active:bg-purple-600/20 transition-all">
                        <div>
                          <p className="font-black text-sm uppercase">{r.spanishName}</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{r.country}</p>
                        </div>
                        <i className="fas fa-chevron-right text-[10px] text-slate-600 group-hover:text-purple-500" />
                      </button>
                    ))}
                  </div>
                )}
                
                <TravelServices mode="HOME" language={user.language} onCitySelect={val => handleSearch(val)} />
              </div>
            )}
            {view === AppView.CITY_DETAIL && (
              <div className="p-6 pt-safe-iphone space-y-6 animate-fade-in">
                <button onClick={() => setView(AppView.HOME)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"><i className="fas fa-arrow-left"/></button>
                <div className="space-y-4">
                  {tours.map(tour => <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); }} language={user.language} />)}
                </div>
              </div>
            )}
            {view === AppView.TOUR_ACTIVE && activeTour && (
              <ActiveTourCard tour={activeTour} user={user} onBack={() => setView(AppView.CITY_DETAIL)} onUpdateUser={setUser} language={user.language} />
            )}
            {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={setUser} onLogout={() => { setUser(GUEST); setView(AppView.LOGIN); }} />}
            {view === AppView.SHOP && <Shop user={user} onPurchase={() => {}} />}
            {view === AppView.LEADERBOARD && <Leaderboard entries={[]} currentUser={user as any} onUserClick={() => {}} language={user.language} />}
          </div>
          
          <nav className="fixed bottom-0 left-0 right-0 p-6 pb-safe-iphone bg-gradient-to-t from-black via-black/95 to-transparent flex justify-center z-[50]">
            <div className="bg-slate-900/95 border border-white/10 backdrop-blur-xl rounded-[2rem] p-2 flex gap-1 w-full max-w-sm shadow-2xl">
              <button onClick={() => setView(AppView.LEADERBOARD)} className={`flex-1 p-3 flex flex-col items-center gap-1 transition-colors ${view === AppView.LEADERBOARD ? 'text-purple-500' : 'text-slate-500'}`}><i className="fas fa-trophy text-sm"/><span className="text-[6px] font-black uppercase tracking-widest">{t('nav1')}</span></button>
              <button onClick={() => setView(AppView.TOOLS)} className={`flex-1 p-3 flex flex-col items-center gap-1 transition-colors ${view === AppView.TOOLS ? 'text-purple-500' : 'text-slate-500'}`}><i className="fas fa-compass text-sm"/><span className="text-[6px] font-black uppercase tracking-widest">{t('nav2')}</span></button>
              <button onClick={() => setView(AppView.HOME)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-8 shadow-xl' : 'bg-white/5'}`}><BdaiLogo className="w-5 h-5"/></button>
              <button onClick={() => setView(AppView.PROFILE)} className={`flex-1 p-3 flex flex-col items-center gap-1 transition-colors ${view === AppView.PROFILE ? 'text-purple-500' : 'text-slate-500'}`}><i className="fas fa-id-card text-sm"/><span className="text-[6px] font-black uppercase tracking-widest">{t('nav3')}</span></button>
              <button onClick={() => setView(AppView.SHOP)} className={`flex-1 p-3 flex flex-col items-center gap-1 transition-colors ${view === AppView.SHOP ? 'text-purple-500' : 'text-slate-500'}`}><i className="fas fa-shopping-bag text-sm"/><span className="text-[6px] font-black uppercase tracking-widest">{t('nav4')}</span></button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
