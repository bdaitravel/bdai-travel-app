
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppView, UserProfile, Tour, LeaderboardEntry, LANGUAGES } from './types';
import { generateToursForCity, translateSearchQuery, QuotaError } from './services/geminiService';
import { TourCard, ActiveTourCard } from './components/TourCard';
import { Leaderboard } from './components/Leaderboard';
import { ProfileModal } from './components/ProfileModal';
import { Shop } from './components/Shop'; 
import { TravelServices, formatCityName, formatCountryName } from './components/TravelServices';
import { BdaiLogo } from './components/BdaiLogo'; 
import { AdminPanel } from './components/AdminPanel';
import { translations } from './data/translations';
import { 
  supabase, 
  getUserProfileByEmail, 
  getGlobalRanking, 
  syncUserProfile, 
  validateEmailFormat,
  checkIfCityCached
} from './services/supabaseClient';

const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
  email: '', language: 'es', miles: 0, rank: 'Turist', 
  culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0,
  interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, 
  stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 }, 
  visitedCities: [], completedTours: [], badges: [], stamps: [], capturedMoments: []
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-purple-500 scale-105' : 'text-slate-500 opacity-40'}`}
  >
    <i className={`fas ${icon} text-lg`}></i>
    <span className="text-[7px] font-black uppercase tracking-widest text-center truncate w-full">{label}</span>
  </button>
);

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [loginPhase, setLoginPhase] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isSyncingLang, setIsSyncingLang] = useState(false);
  const [searchOptions, setSearchOptions] = useState<any[] | null>(null);
  const [user, setUser] = useState<UserProfile>(GUEST_PROFILE);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const searchTimeoutRef = useRef<any>(null);
// --- PEGA ESTO JUSTO AQUÍ ---

  // 1. Función para manejar el éxito del login
  const handleLoginSuccess = async (supabaseUser: any) => {
    const profile = await getUserProfileByEmail(supabaseUser.email || '');
    if (profile) {
      setUser({ ...profile, isLoggedIn: true });
      localStorage.setItem('bdai_profile', JSON.stringify({ ...profile, isLoggedIn: true }));
      setView(AppView.HOME);
    } else {
      const newProfile = { 
        ...GUEST_PROFILE, 
        email: supabaseUser.email || '', 
        id: supabaseUser.id, 
        isLoggedIn: true,
        rank: 'ZERO' 
      };
      await syncUserProfile(newProfile);
      setUser(newProfile);
      setView(AppView.HOME);
    }
  };

  // 2. Función del botón de Google (Arreglada para que no la bloquee el navegador)
  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setLoadingMessage("CONECTANDO CON GOOGLE...");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: "https://www.bdai.travel",
        }
      });
      if (error) throw error;
    } catch (e: any) {
      alert(e.message || "Error al conectar con Google");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Función del botón de Email
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: "https://www.bdai.travel",
        },
      });
      if (error) throw error;
      alert("¡Código enviado! Revisa tu email.");
    } catch (e: any) {
      alert(e.message || "Error al enviar el email.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. El "Oído" que escucha a Google y te deja entrar
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleLoginSuccess(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- AQUÍ SIGUE TU CÓDIGO (t = useCallback...) ---  const t = useCallback((key: string) => {
    const lang = user.language || 'es';
    const dict = translations[lang] || translations['en'];
    return dict[key] || translations['en'][key] || key;
  }, [user.language]);

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                handleLoginSuccess(session.user);
            } else {
               const saved = localStorage.getItem('bdai_profile');
               if (saved) {
                 const parsed = JSON.parse(saved);
                 setUser(prev => ({ ...prev, language: parsed.language || 'es' }));
               }
            }
        } catch (e) { console.error("Auth init error", e); } finally { setIsVerifyingSession(false); }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        handleLoginSuccess(session.user);
      } else if (_event === 'SIGNED_OUT') {
        setUser(GUEST_PROFILE);
        setView(AppView.LOGIN);
      }
    });

    checkAuth();
    getGlobalRanking().then(setLeaderboard);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = async (supabaseUser: any) => {
    const profile = await getUserProfileByEmail(supabaseUser.email || '');
    if (profile) {
      setUser({ ...profile, isLoggedIn: true });
      localStorage.setItem('bdai_profile', JSON.stringify({ ...profile, isLoggedIn: true }));
      setView(AppView.HOME);
    } else {
      const newProfile = { ...GUEST_PROFILE, email: supabaseUser.email || '', id: supabaseUser.id, isLoggedIn: true };
      await syncUserProfile(newProfile);
      setUser(newProfile);
      setView(AppView.HOME);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
        (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleRequestOtp = async () => {
    if (isLoading) return; 
    if (!validateEmailFormat(email)) { alert("Enter a valid email."); return; }
    setIsLoading(true);
    setLoadingMessage("REQUESTING KEY...");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setLoginPhase('OTP');
    } catch (e: any) { alert(e.message || "Failed to send code."); } finally { setIsLoading(false); }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || isLoading) return;

  setIsLoading(true);
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Asegúrate de que esta URL sea exactamente tu dominio
        emailRedirectTo: "https://www.bdai.travel",
      },
    });
    if (error) throw error;
    alert("¡Código enviado! Revisa tu bandeja de entrada.");
  } catch (e: any) {
    alert(e.message || "Error al enviar el email.");
  } finally {
    setIsLoading(false);
  }
};
  const handleVerifyOtp = async () => {
    if (isLoading) return; 
    if (otpToken.length < 8) return;
    setIsLoading(true);
    setLoadingMessage("DECRYPTING ACCESS...");
    try {
      const { data, error } = await supabase.auth.verifyOtp({ 
        email, 
        token: otpToken, 
        type: 'email' 
      });
      if (error) throw error;
      if (data.user) {
        const profile = await getUserProfileByEmail(email);
        if (profile) {
          setUser({ ...profile, isLoggedIn: true });
        } else {
          const newProfile = { ...GUEST_PROFILE, email, id: data.user.id, isLoggedIn: true };
          await syncUserProfile(newProfile);
          setUser(newProfile);
        }
        setView(AppView.HOME);
      }
    } catch (e: any) { alert(e.message || "Invalid or expired code."); } finally { setIsLoading(false); }
  };

  const processCitySelection = async (selection: {name: string, country: string}, langCode: string) => {
    setIsLoading(true); 
    setSearchOptions(null); 
    setSearchVal(''); 
    const cleanName = selection.name.split(',')[0].trim();
    setSelectedCity(cleanName); 

    try {
        setTours([]);
        const { data: cached, error } = await supabase
          .from('tours_cache')
          .select('data')
          .ilike('city', cleanName) 
          .eq('language', langCode.toLowerCase())
          .maybeSingle();

        if (!error && cached && cached.data && cached.data.length > 0) {
            setTours(cached.data); 
            setView(AppView.CITY_DETAIL);
            setIsLoading(false);
            return;
        }
        
        setLoadingMessage(t('generating'));
        const generated = await generateToursForCity(cleanName, selection.country, { ...user, language: langCode } as UserProfile);
        if (generated.length > 0) {
            setTours(generated); 
            await supabase.from('tours_cache').upsert({
              city: cleanName.toLowerCase(),
              language: langCode.toLowerCase(),
              data: generated
            }, { onConflict: 'city,language' });
            setView(AppView.CITY_DETAIL);
        } else { alert("Location protocol failed."); }
    } catch (e) { 
        if (e instanceof QuotaError) { alert("API PROTOCOL ERROR: LIMIT_REACHED"); } 
        else { console.error("Selection error:", e); }
    } finally { setIsLoading(false); }
  };

  const handleCitySearch = async (val: string) => {
    setSearchVal(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.length < 3) { setSearchOptions(null); return; }

    searchTimeoutRef.current = setTimeout(async () => {
        try {
            let queryVal = val;
            const isNonLatin = /[^\u0000-\u007f]/.test(val);
            if (isNonLatin) {
                const translation = await translateSearchQuery(val);
                queryVal = translation.english;
            }

            const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryVal)}&format=json&addressdetails=1&limit=5&featuretype=city`, {
                headers: {
                    'Accept-Language': user.language || 'es',
                    'User-Agent': 'bdai-app-v1'
                }
            });
            if (!resp.ok) throw new Error(`Search service error: ${resp.status}`);
            const data = await resp.json();
            const results = await Promise.all(data.map(async (item: any) => {
                const name = item.address.city || item.address.town || item.address.village || item.address.city_district || item.display_name.split(',')[0];
                const country = item.address.country;
                const isCached = await checkIfCityCached(name.toLowerCase(), country);
                return { name, country, isCached, fullName: `${name}, ${country}` };
            }));
            setSearchOptions(results);
        } catch (e) { console.error("Search protocol error:", e); }
    }, 500);
  };

  const handleLangChange = (code: string) => {
      setIsSyncingLang(code !== user.language);
      const updatedUser = { ...user, language: code };
      setUser(updatedUser);
      localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
      if (user.isLoggedIn) syncUserProfile(updatedUser);
      setTours([]); 
      setTimeout(() => setIsSyncingLang(false), 500);
  };

  const updateUserAndSync = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('bdai_profile', JSON.stringify(updatedUser));
    if (updatedUser.isLoggedIn) { syncUserProfile(updatedUser); }
  };

  if (isVerifyingSession) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center">
        <BdaiLogo className="w-16 h-16 animate-pulse" />
      </div>
    );
  }

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

      {view === AppView.LOGIN ? (
          <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617]">
              <div className="text-center flex flex-col items-center mb-10 mt-[-15dvh] animate-fade-in">
                  <BdaiLogo className="w-32 h-32 mb-4 animate-pulse-logo" />
                  <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 leading-none">bdai</h1>
                  <p className="text-[10px] font-medium text-purple-400 mt-2 lowercase opacity-80">better destinations by ai</p>
              </div>

              {loginPhase === 'EMAIL' ? (
                <div className="w-full max-w-[280px] space-y-4 animate-fade-in">
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      disabled={isLoading}
                      className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-center text-white outline-none text-sm font-medium placeholder-slate-700 shadow-inner focus:border-purple-500/50 transition-all" 
                      placeholder={t('emailPlaceholder')} 
                    />
                    <button 
                      onClick={handleRequestOtp} 
                      disabled={isLoading}
                      className="w-full h-14 bg-white text-slate-950 rounded-2xl font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                      {t('requestAccess')}
                    </button>

                    <div className="flex items-center gap-4 py-1">
                        <div className="h-px bg-white/5 flex-1"></div>
                        <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">{t('socialAccess')}</span>
                        <div className="h-px bg-white/5 flex-1"></div>
                    </div>

                    <div className="w-full">
                        <button 
                          onClick={handleGoogleLogin} 
                          disabled={isLoading}
                          className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-2xl font-black lowercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <i className="fab fa-google text-[10px] text-purple-400"></i>
                          google
                        </button>
                    </div>
                </div>
              ) : (
                <div className="w-full max-w-[280px] space-y-6 animate-fade-in">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('enterCode')}</p>
                      <p className="text-[10px] font-bold text-purple-400/80 truncate">{email}</p>
                    </div>
                    <input 
                      type="text" 
                      maxLength={8}
                      value={otpToken} 
                      onChange={e => setOtpToken(e.target.value)} 
                      disabled={isLoading}
                      className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-center text-white outline-none text-2xl font-black tracking-[0.5em] shadow-inner focus:border-purple-500/50 transition-all" 
                      placeholder="00000000" 
                    />
                    <div className="flex gap-2">
                        <button 
                          onClick={() => setLoginPhase('EMAIL')} 
                          disabled={isLoading}
                          className="flex-1 h-14 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black lowercase text-[10px] tracking-widest disabled:opacity-50"
                        >
                          {t('back')}
                        </button>
                        <button 
                          onClick={handleVerifyOtp} 
                          disabled={otpToken.length < 8 || isLoading}
                          className="flex-[2] h-14 bg-purple-600 text-white rounded-2xl font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
                        >
                          {t('verifyCode')}
                        </button>
                    </div>
                </div>
              )}

              <div className="absolute bottom-10 left-0 right-0 px-8 flex flex-col items-center">
                <div className="relative group">
                    <select 
                      value={user.language} 
                      onChange={(e) => handleLangChange(e.target.value)}
                      disabled={isLoading}
                      className="appearance-none bg-white/5 border border-white/10 rounded-full px-6 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-purple-500/40 transition-all cursor-pointer pr-10"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">{lang.name}</option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[7px] text-slate-600 pointer-events-none"></i>
                </div>
              </div>
          </div>
      ) : (
          <div className="flex-1 flex flex-col relative h-full">
            <div className={`flex-1 overflow-y-auto no-scrollbar relative ${view === AppView.TOUR_ACTIVE ? 'pb-0' : 'pb-36'}`}>
                {view === AppView.HOME && (
                  <div className="space-y-6 pt-safe-iphone max-w-md mx-auto animate-fade-in">
                      <header className="flex justify-between items-center py-4 px-6">
                          <div className="flex items-center gap-3"><BdaiLogo className="w-8 h-8"/><span className="font-black text-xl tracking-tighter lowercase">bdai</span></div>
                          <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-2 shadow-lg border border-white/5"><i className="fas fa-coins text-yellow-500"></i>{user.miles.toLocaleString()}</div>
                      </header>

                      <div className="py-10 px-6 text-center flex flex-col items-center">
                        <BdaiLogo className="w-32 h-32 mb-6 animate-pulse-logo" />
                        <h1 className="text-8xl font-black text-white lowercase tracking-tighter leading-none">bdai</h1>
                        <p className="text-[11px] font-medium text-purple-400 mt-2 lowercase opacity-80 mb-10">better destinations by ai</p>
                        
                        <div className="w-full relative">
                            <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={searchVal} 
                                  onChange={(e) => handleCitySearch(e.target.value)} 
                                  placeholder={t('searchPlaceholder')} 
                                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-bold text-sm shadow-inner focus:border-purple-500/40 transition-all" 
                                />
                                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 transition-transform active:scale-90"><i className="fas fa-search"></i></div>
                            </div>

                            {searchOptions && searchOptions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-4 space-y-2 bg-[#0a0f1e]/98 backdrop-blur-3xl border border-white/5 p-3 rounded-[2rem] shadow-2xl animate-slide-up z-[1001]">
                                  {searchOptions.map((opt, i) => (
                                      <button key={i} onClick={() => processCitySelection(opt, user.language)} className="w-full p-4 bg-white/[0.03] rounded-xl flex items-center justify-between border border-white/5 active:bg-purple-600/10 transition-all text-left">
                                          <div className="flex items-center gap-4">
                                              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                                                  <i className={`fas ${opt.isCached ? 'fa-bolt text-cyan-400' : 'fa-globe text-purple-500'} text-xs`}></i>
                                              </div>
                                              <div className="truncate">
                                                  <span className="text-white font-black uppercase text-[11px] block">{formatCityName(opt.name, user.language)}</span>
                                                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{opt.isCached ? t('ready') : formatCountryName(opt.country, user.language)}</span>
                                              </div>
                                          </div>
                                          <i className="fas fa-chevron-right text-[9px] text-purple-500/40"></i>
                                      </button>
                                  ))}
                              </div>
                            )}
                        </div>
                      </div>

                      <TravelServices mode="HOME" lang={user.language} onCitySelect={(name: string) => handleCitySearch(name)} />
                  </div>
                )}
                {view === AppView.CITY_DETAIL && (
                  <div className="pt-safe-iphone px-6 max-w-md mx-auto animate-fade-in">
                      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/80 backdrop-blur-xl z-20">
                        <button onClick={() => setView(AppView.HOME)} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-90"><i className="fas fa-arrow-left text-xs"></i></button>
                        <h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{formatCityName(selectedCity, user.language)}</h2>
                      </header>
                      <div className="space-y-6 pb-12">
                          {tours.map(tour => (
                            <TourCard key={tour.id} tour={tour} onSelect={() => { setActiveTour(tour); setView(AppView.TOUR_ACTIVE); setCurrentStopIndex(0); }} language={user.language} />
                          ))}
                      </div>
                  </div>
                )}
                {view === AppView.TOUR_ACTIVE && activeTour && (
                  <ActiveTourCard tour={activeTour} user={user} currentStopIndex={currentStopIndex} onNext={() => setCurrentStopIndex(i => i + 1)} onPrev={() => setCurrentStopIndex(i => i - 1)} onJumpTo={(i: number) => setCurrentStopIndex(i)} onUpdateUser={(u: any) => updateUserAndSync(u)} language={user.language} onBack={() => setView(AppView.CITY_DETAIL)} userLocation={userLocation} />
                )}
                {view === AppView.LEADERBOARD && <div className="max-w-md mx-auto h-full"><Leaderboard currentUser={user as any} entries={leaderboard} onUserClick={() => {}} language={user.language} /></div>}
                {view === AppView.PROFILE && <ProfileModal user={user} onClose={() => setView(AppView.HOME)} onUpdateUser={(u) => updateUserAndSync(u)} language={user.language} onLogout={() => { supabase.auth.signOut(); setView(AppView.LOGIN); setLoginPhase('EMAIL'); }} onOpenAdmin={() => setView(AppView.ADMIN)} onLangChange={handleLangChange} />}
                {view === AppView.SHOP && <div className="max-w-md mx-auto h-full"><Shop user={user} onPurchase={() => {}} /></div>}
                {view === AppView.TOOLS && <div className="max-w-md mx-auto h-full"><TravelServices mode="HUB" lang={user.language} onCitySelect={(name: string) => handleCitySearch(name)} /></div>}
                {view === AppView.ADMIN && <AdminPanel user={user} onBack={() => setView(AppView.PROFILE)} />}
            </div>

            {view !== AppView.TOUR_ACTIVE && view !== AppView.ADMIN && (
              <div className="fixed bottom-0 left-0 right-0 z-[1000] px-6 pb-safe-iphone mb-6 flex justify-center pointer-events-none">
                <nav className="bg-[#0a0f1e]/90 backdrop-blur-2xl border border-white/5 px-2 py-4 flex justify-around items-center w-full max-w-sm rounded-[2.5rem] pointer-events-auto shadow-2xl">
                    <NavButton icon="fa-trophy" label={t('navElite')} isActive={view === AppView.LEADERBOARD} onClick={() => setView(AppView.LEADERBOARD)} />
                    <NavButton icon="fa-compass" label={t('navHub')} isActive={view === AppView.TOOLS} onClick={() => setView(AppView.TOOLS)} />
                    <button onClick={() => setView(AppView.HOME)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${view === AppView.HOME ? 'bg-purple-600 -mt-10 scale-110 shadow-lg shadow-purple-500/40' : 'bg-white/5 border border-white/5'}`}><BdaiLogo className="w-7 h-7" /></button>
                    <NavButton icon="fa-id-card" label={t('navVisa')} isActive={view === AppView.PROFILE} onClick={() => setView(AppView.PROFILE)} />
                    <NavButton icon="fa-shopping-bag" label={t('navStore')} isActive={view === AppView.SHOP} onClick={() => setView(AppView.SHOP)} />
                </nav>
              </div>
            )}
          </div>
      )}
    </div>
  );
}
