
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
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad Credential", surname: "Surname", givenNames: "Given Names", city: "City of Origin", country: "Country", birthday: "Date of Birth", age: "Age", social: "Social Matrix", interests: "Interest Profile", visas: "Verified Visas", entry: "ENTRY", verified: "VERIFIED", noVisas: "Ready for stamps", save: "Save Passport", edit: "Edit Identity", logout: "Logout", username: "Username", audioMemory: "Listen Memory", linked: "Linked", language: "Current Language", rank: "Traveler Rank", miles: "Total Miles", syncing: "Syncing...", success: "Saved!", error: "Sync Error", dbHelp: "Run this in Supabase SQL Editor:" },
    es: { title: "Pasaporte Global bdai", subtitle: "Credencial Nómada Digital", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad Origen", country: "País", birthday: "F. Nacimiento", age: "Edad", social: "Social Matrix", interests: "Perfil de Intereses", visas: "Visados Verificados", entry: "ENTRADA", verified: "VERIFICADO", noVisas: "Listo para sellos", save: "Guardar Pasaporte", edit: "Editar Identidad", logout: "Cerrar Sesión", username: "Usuario", audioMemory: "Escuchar Recuerdo", linked: "Vinculado", language: "Idioma Actual", rank: "Rango del Viajero", miles: "Millas Totales", syncing: "Sincronizando...", success: "¡Guardado!", error: "Error Sync", dbHelp: "Ejecuta esto en Supabase SQL Editor:" },
};

const SQL_MIGRATION = `
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS captured_moments jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS saved_intel jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS join_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS passport_number text,
ADD COLUMN IF NOT EXISTS culture_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS food_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS photo_points integer DEFAULT 0;
`.trim();

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error' | 'partial'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState('');
  const [showSqlHelp, setShowSqlHelp] = useState(false);
  
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

  // Fix: Added missing handleLanguageChange function to update local state
  const handleLanguageChange = (code: string) => {
    setFormData(prev => ({ ...prev, language: code }));
  };

  const handleSave = async () => {
      setIsSyncing(true);
      setSyncStatus('idle');
      
      const birthDate = new Date(formData.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`, age: age };
      
      const result = await syncUserProfile(updatedUser);
      
      if (result.success) {
          if (onUpdateUser) onUpdateUser(updatedUser);
          setSyncStatus(result.needsMigration ? 'partial' : 'success');
          if (result.needsMigration) {
              setSyncErrorMessage(result.error || '');
          }
          setTimeout(() => {
              if (!result.needsMigration) {
                setIsEditing(false);
                setSyncStatus('idle');
              }
          }, 2000);
      } else {
          setSyncStatus('error');
          setSyncErrorMessage(result.error || 'Desconocido');
      }
      setIsSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={onClose}></div>
      <div className="bg-[#f2efe4] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 border-[8px] border-[#d4cfbd] flex flex-col max-h-[95vh] text-slate-900 font-sans">
        
        {/* Header Estilo Pasaporte */}
        <div className="bg-[#7b1b1b] p-6 pb-8 flex flex-col gap-1 border-b-[8px] border-[#d4cfbd] shrink-0 pt-safe-iphone relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg border-2 border-yellow-400"><i className="fas fa-id-badge text-2xl"></i></div>
                    <div>
                        <h2 className="text-yellow-500 font-black text-[11px] uppercase tracking-[0.4em] leading-none">{pt('title')}</h2>
                        <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest mt-1">{pt('subtitle')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isOwnProfile && (
                        <>
                            <button 
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                                disabled={isSyncing}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEditing ? (syncStatus === 'success' ? 'bg-green-600' : syncStatus === 'error' ? 'bg-red-600' : syncStatus === 'partial' ? 'bg-amber-600' : 'bg-blue-600') : 'bg-white/10'} text-white shadow-lg`}
                            >
                                {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${isEditing ? (syncStatus === 'success' ? 'fa-check' : syncStatus === 'error' || syncStatus === 'partial' ? 'fa-exclamation-triangle' : 'fa-save') : 'fa-edit'}`}></i>}
                            </button>
                            <button onClick={onLogout} className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg"><i className="fas fa-sign-out-alt"></i></button>
                        </>
                    )}
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>
            </div>

            {/* Alerta de Base de Datos */}
            {(syncStatus === 'error' || syncStatus === 'partial') && (
                <div className="mt-4 p-4 bg-black/60 rounded-2xl border border-white/10 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <i className="fas fa-database text-amber-500 mt-1"></i>
                        <div className="flex-1">
                            <p className="text-white text-[9px] font-bold leading-tight">{syncErrorMessage}</p>
                            {/* Fix: Removed duplicate onClick attribute and invalid setShowOnboarding call */}
                            <button className="mt-2 text-[8px] text-amber-400 font-black uppercase tracking-widest flex items-center gap-2" onClick={() => setShowSqlHelp(!showSqlHelp)}>
                                <i className="fas fa-terminal"></i> {showSqlHelp ? "OCULTAR SQL" : pt('dbHelp')}
                            </button>
                        </div>
                    </div>
                    {showSqlHelp && (
                        <div className="mt-4 bg-black/80 p-3 rounded-xl border border-white/5 relative group">
                            <pre className="text-[7px] text-green-500 font-mono overflow-x-auto whitespace-pre-wrap">{SQL_MIGRATION}</pre>
                            <button 
                                onClick={() => { navigator.clipboard.writeText(SQL_MIGRATION); alert("SQL Copied!"); }}
                                className="absolute top-2 right-2 p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                            >
                                <i className="fas fa-copy"></i>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10 pb-32">
            <div className="flex gap-8 items-start">
                <div className="relative group shrink-0">
                    <div className="w-36 h-48 bg-white border-4 border-[#d4cfbd] rounded-xl shadow-2xl overflow-hidden flex items-center justify-center p-2 relative">
                        <img src={formData.avatar} className="w-full h-full object-cover filter contrast-110 saturate-[0.9] mix-blend-multiply" />
                        <div className="absolute inset-0 bg-[#f2efe4]/10 mix-blend-overlay"></div>
                        {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}><i className="fas fa-camera text-white text-3xl"></i></div>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { const r = new FileReader(); r.onloadend = () => setFormData(p => ({...p, avatar: r.result as string})); r.readAsDataURL(file); }
                    }} />
                </div>
                
                <div className="flex-1 space-y-6">
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('username')}</p>
                        {isEditing ? <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-white/50 px-1 border-none font-black text-purple-600 outline-none uppercase text-lg" /> : <p className="font-black text-purple-600 text-lg uppercase tracking-tight">{formData.username || 'traveler'}</p>}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('surname')}</p>
                        {isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/50 px-1 border-none font-black uppercase outline-none text-lg" /> : <p className="font-black text-slate-800 uppercase truncate text-lg tracking-tight">{formData.lastName || 'CHONG'}</p>}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('givenNames')}</p>
                        {isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/50 px-1 border-none font-black uppercase outline-none text-lg" /> : <p className="font-black text-slate-800 uppercase truncate text-lg tracking-tight">{formData.firstName || 'DAISY'}</p>}
                    </div>
                    
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('birthday')}</p>
                        {isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-white/50 px-1 border-none font-black outline-none text-lg" /> : <p className="font-black text-slate-800 uppercase truncate text-lg tracking-tight">{formData.birthday ? new Date(formData.birthday).toLocaleDateString(user.language, { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('city')}</p>
                            {isEditing ? <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/50 px-1 border-none font-black outline-none uppercase" /> : <p className="font-black text-slate-800 uppercase truncate tracking-tight">{formData.city || '---'}</p>}
                        </div>
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('country')}</p>
                            {isEditing ? <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-white/50 px-1 border-none font-black outline-none uppercase" /> : <p className="font-black text-slate-800 uppercase truncate tracking-tight">{formData.country || '---'}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Selector de Idiomas (Estilo Banderas de la Captura) */}
            <div className="space-y-6 pt-4 border-t border-slate-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 px-1"><i className="fas fa-language text-slate-800"></i> {pt('language')}</h4>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
                    {LANGUAGES.map(lang => (
                        <div key={lang.code} className="flex flex-col items-center gap-2 shrink-0">
                            <button 
                                onClick={() => handleLanguageChange(lang.code)} 
                                className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center bg-white shadow-sm ${formData.language === lang.code ? 'border-purple-600 scale-110 shadow-lg ring-4 ring-purple-500/10' : 'border-transparent opacity-40 grayscale-[0.5]'}`}
                            >
                                <FlagIcon code={lang.code} className="w-full h-full" />
                            </button>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${formData.language === lang.code ? 'text-purple-600' : 'text-slate-400'}`}>{lang.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
