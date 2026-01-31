
import React, { useState, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, Badge, SocialLinks, INTEREST_OPTIONS } from '../types';
import { FlagIcon } from './FlagIcon';
import { generateAudio, cleanDescriptionText } from '../services/geminiService';
import { syncUserProfile } from '../services/supabaseClient';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  language?: string;
}

const MODAL_TEXTS: any = {
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad Credential", surname: "Surname", givenNames: "Given Names", city: "City of Origin", country: "Country", birthday: "Date of Birth", age: "Age", social: "Social Matrix", interests: "Interest Profile", visas: "Verified Visas", entry: "ENTRY", verified: "VERIFIED", noVisas: "Ready for stamps", save: "Save Passport", edit: "Edit Identity", logout: "Logout", username: "Username", audioMemory: "Listen Memory", linked: "Linked", language: "Current Language", rank: "Traveler Rank", miles: "Total Miles", syncing: "Syncing...", success: "Saved!", error: "Sync Error" },
    es: { title: "Pasaporte Global bdai", subtitle: "Credencial Nómada Digital", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad Origen", country: "País", birthday: "F. Nacimiento", age: "Edad", social: "Social Matrix", interests: "Perfil de Intereses", visas: "Visados Verificados", entry: "ENTRADA", verified: "VERIFICADO", noVisas: "Listo para sellos", save: "Guardar Pasaporte", edit: "Editar Identidad", logout: "Cerrar Sesión", username: "Usuario", audioMemory: "Escuchar Recuerdo", linked: "Vinculado", language: "Idioma Actual", rank: "Rango del Viajero", miles: "Millas Totales", syncing: "Sincronizando...", success: "¡Guardado!", error: "Error Sync" },
    // ... otros idiomas se mantienen igual
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState('');
  
  const [playingCityAudio, setPlayingCityAudio] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = user.email === 'travelbdai@gmail.com';
  const pt = (key: string) => (MODAL_TEXTS[user.language] || MODAL_TEXTS['es'])[key] || key;

  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || '',
      country: user.country || '',
      bio: user.bio || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es',
      interests: user.interests || [],
      socialLinks: user.socialLinks || { instagram: '', tiktok: '', x: '', facebook: '' }
  });

  const handleSave = async () => {
      setIsSyncing(true);
      setSyncStatus('idle');
      
      const birthDate = new Date(formData.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`, age: age };
      
      // Intentamos sincronizar con Supabase
      const result = await syncUserProfile(updatedUser);
      
      if (result.success) {
          if (onUpdateUser) onUpdateUser(updatedUser);
          setSyncStatus('success');
          setTimeout(() => {
              setIsEditing(false);
              setSyncStatus('idle');
          }, 1500);
      } else {
          setSyncStatus('error');
          setSyncErrorMessage(result.error || 'Desconocido');
      }
      setIsSyncing(false);
  };

  const handleLanguageChange = (code: string) => {
      setFormData(prev => ({ ...prev, language: code }));
      if (!isEditing && onUpdateUser) {
          onUpdateUser({ ...user, language: code });
      }
  };

  const speakLocally = (text: string) => {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = user.language || 'es';
      utterance.onend = () => setPlayingCityAudio(null);
      synth.speak(utterance);
  };

  const handlePlayCityAudio = async (city: string) => {
      const synth = window.speechSynthesis;
      if (playingCityAudio === city) {
          if (audioSourceRef.current) audioSourceRef.current.stop();
          if (synth) synth.cancel();
          setPlayingCityAudio(null);
          return;
      }
      setLoadingAudio(city);
      const welcomeText = user.language === 'es' ? `Bienvenido de nuevo a ${city}, explorador.` : `Welcome back to ${city}, explorer.`;
      try {
          if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') await ctx.resume();
          const base64 = await generateAudio(welcomeText, user.language);
          if (base64) {
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const buffer = ctx.createBuffer(1, Math.floor(bytes.byteLength/2), 24000);
              const channelData = buffer.getChannelData(0);
              const dataInt16 = new Int16Array(bytes.buffer, 0, channelData.length);
              for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
              const source = ctx.createBufferSource();
              source.buffer = buffer; source.connect(ctx.destination);
              source.onended = () => setPlayingCityAudio(null);
              source.start(0); audioSourceRef.current = source;
              setPlayingCityAudio(city);
          } else { setPlayingCityAudio(city); speakLocally(welcomeText); }
      } catch (e) { setPlayingCityAudio(city); speakLocally(welcomeText); } finally { setLoadingAudio(null); }
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
                    {isAdmin && onOpenAdmin && (
                        <button onClick={onOpenAdmin} className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg animate-pulse" title="Admin Panel"><i className="fas fa-microchip"></i></button>
                    )}
                    {isOwnProfile && (
                        <>
                            <button 
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                                disabled={isSyncing}
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isEditing ? (syncStatus === 'success' ? 'bg-green-600' : syncStatus === 'error' ? 'bg-red-600' : 'bg-blue-600') : 'bg-white/10'} text-white shadow-lg`}
                            >
                                {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${isEditing ? (syncStatus === 'success' ? 'fa-check' : syncStatus === 'error' ? 'fa-exclamation-triangle' : 'fa-save') : 'fa-edit'}`}></i>}
                            </button>
                            <button onClick={onLogout} className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg"><i className="fas fa-sign-out-alt"></i></button>
                        </>
                    )}
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>
            </div>
            {syncStatus === 'error' && <p className="text-white text-[8px] font-bold bg-black/40 px-2 py-1 mt-2 rounded">Error: {syncErrorMessage}. ¿Has creado las columnas en Supabase?</p>}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10 pb-32">
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
                </div>
                
                <div className="flex-1 space-y-4 font-mono text-[10px]">
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('username')}</p>
                        {isEditing ? <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-white/40 px-1 border-none font-black text-purple-600 outline-none" /> : <p className="font-black text-purple-600">@{formData.username}</p>}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('surname')}</p>
                        {isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/40 px-1 border-none font-black uppercase outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{formData.lastName || 'EXPLORADOR'}</p>}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('givenNames')}</p>
                        {isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/40 px-1 border-none font-black uppercase outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{formData.firstName || 'USUARIO'}</p>}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('birthday')}</p>
                        {isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-white/40 px-1 border-none font-black outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{formData.birthday || '---'}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('city')}</p>
                            {isEditing ? <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/40 px-1 border-none font-black outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{formData.city || '---'}</p>}
                        </div>
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase mb-1">{pt('country')}</p>
                            {isEditing ? <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-white/40 px-1 border-none font-black outline-none" /> : <p className="font-black text-slate-800 uppercase truncate">{formData.country || '---'}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1"><i className="fas fa-language text-slate-800"></i> {pt('language')}</h4>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1">
                    {LANGUAGES.map(lang => (
                        <div key={lang.code} className="flex flex-col items-center gap-1.5 shrink-0">
                            <button onClick={() => handleLanguageChange(lang.code)} className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center bg-white ${formData.language === lang.code ? 'border-purple-600 scale-105 shadow-md shadow-purple-500/20' : 'border-transparent opacity-50 grayscale-[0.5]'}`}><FlagIcon code={lang.code} className="w-full h-full" /></button>
                            <span className={`text-[7px] font-black uppercase tracking-widest ${formData.language === lang.code ? 'text-purple-600' : 'text-slate-400'}`}>{lang.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
