
import React, { useState, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, Badge, SocialLinks, INTEREST_OPTIONS } from '../types';
import { FlagIcon } from './FlagIcon';
import { generateAudio } from '../services/geminiService';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  language?: string;
}

const MODAL_TEXTS: any = {
    en: {
        title: "bdai Global Passport", subtitle: "Digital Nomad Credential",
        surname: "Surname", givenNames: "Given Names", city: "City of Origin", country: "Country",
        birthday: "Date of Birth", age: "Age", social: "Social Matrix", interests: "Interest Profile",
        visas: "Verified Visas", entry: "ENTRY", verified: "VERIFIED", noVisas: "Ready for stamps",
        save: "Save Passport", edit: "Edit Identity", logout: "Logout",
        username: "Username", audioMemory: "Listen Memory", linked: "Linked",
        language: "Current Language", rank: "Traveler Rank", miles: "Total Miles"
    },
    es: {
        title: "Pasaporte Global bdai", subtitle: "Credencial Nómada Digital",
        surname: "Apellidos", givenNames: "Nombres", city: "Ciudad Origen", country: "País",
        birthday: "F. Nacimiento", age: "Edad", social: "Social Matrix", interests: "Perfil de Intereses",
        visas: "Visados Verificados", entry: "ENTRADA", verified: "VERIFICADO", noVisas: "Listo para sellos",
        save: "Guardar Pasaporte", edit: "Editar Identidad", logout: "Cerrar Sesión",
        username: "Usuario", audioMemory: "Escuchar Recuerdo", linked: "Vinculado",
        language: "Idioma Actual", rank: "Rango del Viajero", miles: "Millas Totales"
    },
    ca: {
        title: "Passaport Global bdai", subtitle: "Credencial Nòmada Digital",
        surname: "Cognoms", givenNames: "Noms", city: "Ciutat Origen", country: "País",
        birthday: "F. Naixement", age: "Edat", social: "Social Matrix", interests: "Perfil d'Interessos",
        visas: "Visats Verificats", entry: "ENTRADA", verified: "VERIFICAT", noVisas: "Llest per a segells",
        save: "Desar Passaport", edit: "Editar Identitat", logout: "Tancar Sessió",
        username: "Usuari", audioMemory: "Escolta el Record", linked: "Vinculat",
        language: "Idioma Actual", rank: "Rang del Viatger", miles: "Milles Totals"
    },
    eu: {
        title: "Pasaporte Global bdai", subtitle: "Nomada Digital Agiria",
        surname: "Abizenak", givenNames: "Izenak", city: "Jatorrizko Hiria", country: "Herrialdea",
        birthday: "Jaiotze-data", age: "Adina", social: "Social Matrix", interests: "Interesen Profila",
        visas: "Egiaztatutako Visatuak", entry: "SARRERA", verified: "EGIAZTATUA", noVisas: "Zigiluak jasotzeko prest",
        save: "Pasaportea Gorde", edit: "Nortasuna Editatu", logout: "Saioa Itxi",
        username: "Erabiltzailea", audioMemory: "Oroitzapena Entzun", linked: "Lotuta",
        language: "Hizkuntza", rank: "Bidaiari Maila", miles: "Milia Guztiak"
    },
    fr: {
        title: "Passeport Global bdai", subtitle: "Identifiant Nomade Numérique",
        surname: "Nom", givenNames: "Prénoms", city: "Ville d'Origine", country: "Pays",
        birthday: "Date de Naissance", age: "Âge", social: "Social Matrix", interests: "Profil d'Intérêts",
        visas: "Visas Vérifiés", entry: "ENTRÉE", verified: "VÉRIFIÉ", noVisas: "Prêt pour les tampons",
        save: "Enregistrer Passeport", edit: "Modifier l'Identité", logout: "Déconnexion",
        username: "Utilisateur", audioMemory: "Écouter le Souvenir", linked: "Lié",
        language: "Langue Actuelle", rank: "Rang Voyageur", miles: "Total des Miles"
    }
};

const getCountryFlag = (country: string): string => {
    const c = country.toLowerCase();
    if (c.includes('españa') || c.includes('spain')) return '🇪🇸';
    if (c.includes('francia') || c.includes('france')) return '🇫🇷';
    if (c.includes('japon') || c.includes('japan')) return '🇯🇵';
    if (c.includes('uk') || c.includes('reino unido')) return '🇬🇧';
    if (c.includes('usa') || c.includes('eeuu')) return '🇺🇸';
    if (c.includes('alemania') || c.includes('germany')) return '🇩🇪';
    if (c.includes('italia') || c.includes('italy')) return '🇮🇹';
    return '🌍';
};

const getCityFlag = (city: string): string => {
    const c = city.toLowerCase();
    if (['madrid', 'barcelona', 'sevilla', 'santillana del mar', 'albarracín', 'cudillero', 'ronda', 'vitoria-gasteiz', 'vitoria'].includes(c)) return '🇪🇸';
    if (['parís', 'paris', 'lyon', 'niza', 'bordeaux', 'marseille', 'strasbourg'].includes(c)) return '🇫🇷';
    if (['tokio', 'tokyo', 'kyoto', 'osaka'].includes(c)) return '🇯🇵';
    if (['nueva york', 'new york', 'los angeles', 'chicago'].includes(c)) return '🇺🇸';
    if (['londres', 'london', 'manchester'].includes(c)) return '🇬🇧';
    if (['roma', 'rome', 'florencia', 'florence', 'venecia', 'venice'].includes(c)) return '🇮🇹';
    return '🏳️';
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [playingCityAudio, setPlayingCityAudio] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const pt = (key: string) => (MODAL_TEXTS[user.language] || MODAL_TEXTS['es'])[key] || key;

  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || 'Madrid',
      country: user.country || 'España',
      bio: user.bio || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es',
      interests: user.interests || [],
      socialLinks: user.socialLinks || { instagram: '', tiktok: '', x: '', facebook: '' }
  });

  const handleSave = () => {
      const birthDate = new Date(formData.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (onUpdateUser) onUpdateUser({ ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`, age: age });
      setIsEditing(false);
  };

  const handleLanguageChange = (code: string) => {
      setFormData(prev => ({ ...prev, language: code }));
      if (!isEditing && onUpdateUser) {
          onUpdateUser({ ...user, language: code });
      }
  };

  const handlePlayCityAudio = async (city: string) => {
      if (playingCityAudio === city) {
          if (audioSourceRef.current) audioSourceRef.current.stop();
          setPlayingCityAudio(null);
          return;
      }
      setLoadingAudio(city);
      try {
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') await ctx.resume();

          const text = user.language === 'es' ? `Bienvenido de nuevo a ${city}, explorador. Es un placer volver a ver tu sello en este pasaporte.` : `Welcome back to ${city}, explorer. It is a pleasure to see your stamp in this passport again.`;
          
          // PASAMOS LA CIUDAD ESPECÍFICA PARA EL CACHÉ ETIQUETADO
          const base64 = await generateAudio(text, user.language, city);
          
          if (base64) {
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              
              const validLength = Math.floor(bytes.byteLength / 2);
              const dataInt16 = new Int16Array(bytes.buffer, 0, validLength);
              
              const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
              const channelData = buffer.getChannelData(0);
              for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
              
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => setPlayingCityAudio(null);
              source.start(0);
              audioSourceRef.current = source;
              setPlayingCityAudio(city);
          }
      } catch (e) { 
        console.error("Profile Audio Error:", e);
        setPlayingCityAudio(null); 
      } finally { 
        setLoadingAudio(null); 
      }
  };

  const getStampStyle = (city: string) => {
      let hash = 0;
      for (let i = 0; i < city.length; i++) hash = city.charCodeAt(i) + ((hash << 5) - hash);
      const rotation = (hash % 20) - 10;
      const colors = ['border-blue-700/60 text-blue-700', 'border-red-700/60 text-red-700', 'border-emerald-700/60 text-emerald-700', 'border-purple-700/60 text-purple-700'];
      const colorClass = colors[Math.abs(hash) % colors.length];
      return { rotation, colorClass };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={onClose}></div>
      <div className="bg-[#f2efe4] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 border-[6px] border-[#d4cfbd] flex flex-col max-h-[92vh] text-slate-900 font-sans">
        
        {/* Passport Header */}
        <div className="bg-[#7b1b1b] p-6 pb-8 flex flex-col gap-1 border-b-[6px] border-[#d4cfbd] shrink-0 pt-safe-iphone">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900 shadow-lg"><i className="fas fa-id-badge text-xl"></i></div>
                    <div>
                        <h2 className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.4em] leading-none">{pt('title')}</h2>
                        <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest mt-1">{pt('subtitle')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isOwnProfile && (
                        <>
                            <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isEditing ? 'bg-green-600' : 'bg-white/10'} text-white`}><i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'}`}></i></button>
                            <button onClick={onLogout} className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg"><i className="fas fa-sign-out-alt"></i></button>
                        </>
                    )}
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>
            </div>
        </div>

        {/* Scrollable Passport Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10 pb-32">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 border-2 border-dashed border-[#d4cfbd] rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
                    <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-1">{pt('rank')}</p>
                    <span className="text-xs font-black text-purple-700 uppercase tracking-tighter">{user.rank}</span>
                </div>
                <div className="bg-white/60 border-2 border-dashed border-[#d4cfbd] rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
                    <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-1">{pt('miles')}</p>
                    <span className="text-lg font-black text-slate-900 tracking-tight leading-none">{user.miles.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                <div className="relative group shrink-0">
                    <div className="w-32 h-44 bg-white border-4 border-[#d4cfbd] rounded-xl shadow-inner overflow-hidden flex items-center justify-center p-2">
                        <img src={formData.avatar} className="w-full h-full object-cover filter contrast-110 saturate-[0.8] mix-blend-multiply" />
                        {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}><i className="fas fa-camera text-white text-2xl"></i></div>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { const r = new FileReader(); r.onloadend = () => setFormData(p => ({...p, avatar: r.result as string})); r.readAsDataURL(file); }
                    }} />
                    <div className="mt-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center bg-slate-200/50 py-1 rounded">ID: {user.passportNumber || 'BD-000-AI'}</div>
                </div>
                
                <div className="flex-1 space-y-4 font-mono text-[10px]">
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('username')}</p>
                        {isEditing ? <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black text-purple-600 outline-none" /> : <p className="font-black text-purple-600">@{formData.username}</p>}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('surname')}</p>
                        {isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black uppercase outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{formData.lastName || 'EXPLORADOR'}</p>}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('givenNames')}</p>
                        {isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black uppercase outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{formData.firstName || 'USUARIO'}</p>}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('birthday')}</p>
                        {isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{formData.birthday || '---'}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('city')}</p>
                            {isEditing ? <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{formData.city || '---'}</p>}
                        </div>
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('country')}</p>
                            {isEditing ? <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{getCountryFlag(formData.country)} {formData.country || '---'}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1"><i className="fas fa-language text-slate-800"></i> {pt('language')}</h4>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {LANGUAGES.map(lang => (
                        <button 
                            key={lang.code} 
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${formData.language === lang.code ? 'bg-white border-purple-600 shadow-md scale-105' : 'bg-slate-200/50 border-transparent opacity-60'}`}
                        >
                            <span className="text-[10px] font-black uppercase text-slate-700">{lang.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1"><i className="fas fa-stamp text-slate-800"></i> {pt('visas')}</h4>
                <div className="grid grid-cols-2 gap-6">
                    {user.visitedCities && user.visitedCities.length > 0 ? user.visitedCities.map(city => {
                        const { rotation, colorClass } = getStampStyle(city);
                        const isPlaying = playingCityAudio === city;
                        const isLoad = loadingAudio === city;
                        return (
                            <div key={city} className="flex flex-col items-center gap-3 animate-fade-in group">
                                <div 
                                    className={`w-28 h-28 border-[4px] ${colorClass} rounded-[2rem] flex flex-col items-center justify-center p-3 relative shadow-inner overflow-hidden cursor-pointer active:scale-95 transition-all`}
                                    style={{ transform: `rotate(${rotation}deg)`, borderStyle: 'double' }}
                                    onClick={() => handlePlayCityAudio(city)}
                                >
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_currentColor_1px,_transparent_1px)] bg-[size:4px_4px]"></div>
                                    <div className="absolute top-2 right-2 text-xs opacity-60">{getCityFlag(city)}</div>
                                    <p className="text-[6px] font-black uppercase tracking-tighter leading-none mb-1">{pt('verified')}</p>
                                    <i className={`fas ${isLoad ? 'fa-spinner fa-spin' : isPlaying ? 'fa-volume-up animate-pulse' : 'fa-monument'} text-2xl mb-1`}></i>
                                    <p className="text-[12px] font-black uppercase text-center leading-none tracking-tighter">{city}</p>
                                    <p className="text-[6px] font-black uppercase mt-1 tracking-widest">{pt('entry')}</p>
                                </div>
                                <button onClick={() => handlePlayCityAudio(city)} className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${isPlaying ? 'text-purple-600' : 'text-slate-400'}`}>
                                    <i className={`fas ${isPlaying ? 'fa-stop-circle' : 'fa-play-circle'}`}></i> {pt('audioMemory')}
                                </button>
                            </div>
                        );
                    }) : <div className="col-span-2 py-8 bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-300 text-center"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{pt('noVisas')}</p></div>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
