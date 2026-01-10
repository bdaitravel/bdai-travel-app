
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
        surname: "Surname", givenNames: "Given Names", city: "City", country: "Country",
        birthday: "Birthday", age: "Age", social: "Social Matrix", interests: "Interest Profile",
        achievements: "Elite Achievements", visas: "Verified Visas", entry: "ENTRY",
        verified: "VERIFIED", noBadges: "No badges yet", noVisas: "Ready for stamps",
        save: "Save Passport", edit: "Edit Identity", logout: "Logout",
        username: "Username", audioMemory: "Listen Memory", linked: "Linked", visit: "Visit Profile"
    },
    es: {
        title: "Pasaporte Global bdai", subtitle: "Credencial Nómada Digital",
        surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País",
        birthday: "Nacimiento", age: "Edad", social: "Social Matrix", interests: "Perfil de Intereses",
        achievements: "Logros de Élite", visas: "Visados Verificados", entry: "ENTRADA",
        verified: "VERIFICADO", noBadges: "Sin insignias aún", noVisas: "Listo para sellos",
        save: "Guardar Pasaporte", edit: "Editar Identidad", logout: "Cerrar Sesión",
        username: "Usuario", audioMemory: "Escuchar Recuerdo", linked: "Vinculado", visit: "Ver Perfil"
    }
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
          const text = user.language === 'es' ? `Bienvenido de nuevo a ${city}, explorador. Es un placer volver a ver tu sello en este pasaporte.` : `Welcome back to ${city}, explorer. It is a pleasure to see your stamp in this passport again.`;
          const base64 = await generateAudio(text, user.language);
          if (base64) {
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const dataInt16 = new Int16Array(bytes.buffer);
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
      } catch (e) { setPlayingCityAudio(null); } finally { setLoadingAudio(null); }
  };

  const getStampStyle = (city: string) => {
      let hash = 0;
      for (let i = 0; i < city.length; i++) hash = city.charCodeAt(i) + ((hash << 5) - hash);
      const rotation = (hash % 20) - 10;
      const colors = ['border-blue-700/60 text-blue-700', 'border-red-700/60 text-red-700', 'border-emerald-700/60 text-emerald-700', 'border-purple-700/60 text-purple-700'];
      const colorClass = colors[Math.abs(hash) % colors.length];
      return { rotation, colorClass };
  };

  const getSocialIcon = (platform: string) => {
      switch(platform) {
          case 'x': return 'fa-x-twitter';
          case 'facebook': return 'fa-facebook-f';
          case 'instagram': return 'fa-instagram';
          case 'tiktok': return 'fa-tiktok';
          default: return 'fa-share-nodes';
      }
  };

  const getSocialUrl = (platform: string, handle: string) => {
      if (!handle) return '#';
      const clean = handle.replace('@', '');
      switch(platform) {
          case 'x': return `https://x.com/${clean}`;
          case 'facebook': return `https://facebook.com/${clean}`;
          case 'instagram': return `https://instagram.com/${clean}`;
          case 'tiktok': return `https://tiktok.com/@${clean}`;
          default: return '#';
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={onClose}></div>
      <div className="bg-[#f2efe4] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 border-[6px] border-[#d4cfbd] flex flex-col max-h-[92vh] text-slate-900 font-sans">
        
        {/* Header - Reforzado para iPhone */}
        <div className="bg-[#7b1b1b] p-6 pb-8 flex flex-col gap-1 border-b-[6px] border-[#d4cfbd] shrink-0">
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-12 pb-32">
            {/* Identity */}
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
                    <div className="mt-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center bg-slate-200/50 py-1 rounded">ID: {user.passportNumber}</div>
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('birthday')}</p>
                            {isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black outline-none" /> : <p className="font-black text-slate-800">{formData.birthday}</p>}
                        </div>
                        <div className="border-b border-slate-300 pb-1"><p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('age')}</p><p className="font-black text-slate-800">{user.age}</p></div>
                    </div>
                </div>
            </div>

            {/* Social Matrix - Reforzada con enlaces directos */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1"><i className="fas fa-network-wired text-slate-800"></i> {pt('social')}</h4>
                <div className="grid grid-cols-2 gap-3">
                    {['instagram', 'tiktok', 'x', 'facebook'].map(p => {
                        const val = formData.socialLinks?.[p as keyof SocialLinks];
                        const url = getSocialUrl(p, val || '');
                        return (
                            <div key={p} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${val ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-200/50 border-dashed border-slate-300'}`}>
                                <a href={url} target="_blank" rel="noopener" className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${val ? 'bg-slate-900 text-white active:scale-95 transition-all shadow-md' : 'bg-slate-300 text-white pointer-events-none'}`}>
                                    <i className={`fab ${getSocialIcon(p)}`}></i>
                                </a>
                                <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                        <input placeholder={`@${p}`} value={val} onChange={e => setFormData({...formData, socialLinks: {...formData.socialLinks, [p]: e.target.value}})} className="w-full bg-transparent text-[9px] font-black uppercase outline-none" />
                                    ) : (
                                        <a href={url} target="_blank" rel="noopener" className="block">
                                            <p className="text-[9px] font-black uppercase truncate text-slate-600">{val || '---'}</p>
                                            {val && <p className="text-[6px] font-black text-purple-600 uppercase tracking-widest">{pt('linked')}</p>}
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Verified Stamps */}
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

            {/* Achievements */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1"><i className="fas fa-award text-slate-800"></i> {pt('achievements')}</h4>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                    {user.badges && user.badges.length > 0 ? user.badges.map(b => (
                        <div key={b.id} className="min-w-[100px] flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-4 border-white shadow-lg flex items-center justify-center text-slate-900 text-xl"><i className={`fas ${b.icon}`}></i></div>
                            <p className="text-[8px] font-black uppercase text-slate-800 text-center leading-tight">{b.name}</p>
                        </div>
                    )) : <div className="w-full py-6 bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-300 text-center"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{pt('noBadges')}</p></div>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
