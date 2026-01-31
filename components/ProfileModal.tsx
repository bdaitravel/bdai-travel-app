
import React, { useState, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, Badge, SocialLinks, INTEREST_OPTIONS, RANK_THRESHOLDS, TravelerRank, BADGE_DEFINITIONS } from '../types';
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
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad Credential", surname: "Surname", givenNames: "Given Names", city: "City of Origin", country: "Country", birthday: "Date of Birth", age: "Age", social: "Social Matrix", interests: "Interest Profile", visas: "Verified Visas", entry: "ENTRY", verified: "VERIFIED", noVisas: "Ready for stamps", save: "Save Passport", edit: "Edit Identity", logout: "Logout", username: "Username", audioMemory: "Listen Memory", linked: "Linked", language: "Current Language", rank: "Traveler Rank", miles: "Total Miles", syncing: "Syncing...", success: "Saved!", error: "Sync Error", dbHelp: "Run this in Supabase SQL Editor:", progress: "Progress to next rank", badges: "Achievement Log", categoryPoints: "Activity Matrix", admin: "Engine Room" },
    es: { title: "Pasaporte Global bdai", subtitle: "Credencial Nómada Digital", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad Origen", country: "País", birthday: "F. Nacimiento", age: "Edad", social: "Social Matrix", interests: "Perfil de Intereses", visas: "Visados Verificados", entry: "ENTRADA", verified: "VERIFICADO", noVisas: "Listo para sellos", save: "Guardar Pasaporte", edit: "Editar Identidad", logout: "Cerrar Sesión", username: "Usuario", audioMemory: "Escuchar Recuerdo", linked: "Vinculado", language: "Idioma Actual", rank: "Rango del Viajero", miles: "Millas Totales", syncing: "Sincronizando...", success: "¡Guardado!", error: "Error Sync", dbHelp: "Ejecuta esto en Supabase SQL Editor:", progress: "Progreso al siguiente rango", badges: "Logros de Viaje", categoryPoints: "Matriz de Actividad", admin: "Sala de Máquinas" },
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error' | 'partial'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleLanguageChange = (code: string) => {
    setFormData(prev => ({ ...prev, language: code }));
  };

  const handleSave = async () => {
      setIsSyncing(true);
      const birthDate = new Date(formData.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`, age: age };
      const result = await syncUserProfile(updatedUser);
      if (result.success) {
          if (onUpdateUser) onUpdateUser(updatedUser);
          setSyncStatus('success');
          setTimeout(() => { setIsEditing(false); setSyncStatus('idle'); }, 2000);
      } else {
          setSyncStatus('error');
      }
      setIsSyncing(false);
  };

  const ranks: TravelerRank[] = ['Turist', 'Explorer', 'Wanderer', 'Globe-Trotter', 'Legend'];
  const currentRankIndex = ranks.indexOf(user.rank || 'Turist');
  const nextRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;
  const currentThreshold = RANK_THRESHOLDS[user.rank || 'Turist'];
  const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : currentThreshold;
  const progressPercent = nextRank ? Math.min(100, Math.max(0, ((user.miles - currentThreshold) / (nextThreshold - currentThreshold)) * 100)) : 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={onClose}></div>
      <div className="bg-[#f2efe4] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 border-[8px] border-[#d4cfbd] flex flex-col max-h-[95vh] text-slate-900 font-sans">
        
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
                            {onOpenAdmin && (
                                <button onClick={onOpenAdmin} className="w-12 h-12 rounded-2xl bg-slate-900 text-purple-400 flex items-center justify-center shadow-lg border border-purple-500/30">
                                    <i className="fas fa-microchip"></i>
                                </button>
                            )}
                            <button 
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                                disabled={isSyncing}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEditing ? (syncStatus === 'success' ? 'bg-green-600' : syncStatus === 'error' ? 'bg-red-600' : 'bg-blue-600') : 'bg-white/10'} text-white shadow-lg`}
                            >
                                {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'}`}></i>}
                            </button>
                            <button onClick={onLogout} className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg"><i className="fas fa-sign-out-alt"></i></button>
                        </>
                    )}
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10 pb-32">
            <div className="bg-white/40 p-6 rounded-3xl border border-slate-200">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-1">{pt('rank')}</p>
                        <h4 className="text-2xl font-black text-purple-600 uppercase tracking-tighter">{user.rank}</h4>
                    </div>
                    <div className="text-right">
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-1">{pt('miles')}</p>
                        <h4 className="text-lg font-black text-slate-900">{user.miles.toLocaleString()}</h4>
                    </div>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-purple-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    {nextRank ? `${pt('progress')}: ${(nextThreshold - user.miles).toLocaleString()} miles to ${nextRank}` : 'MAX RANK ACHIEVED'}
                </p>
            </div>

            <div className="flex gap-8 items-start">
                <div className="relative group shrink-0">
                    <div className="w-36 h-48 bg-white border-4 border-[#d4cfbd] rounded-xl shadow-2xl overflow-hidden flex items-center justify-center p-2 relative">
                        <img src={formData.avatar} className="w-full h-full object-cover filter contrast-110 saturate-[0.9] mix-blend-multiply" />
                        <div className="absolute inset-0 bg-[#f2efe4]/10 mix-blend-overlay"></div>
                    </div>
                </div>
                
                <div className="flex-1 space-y-6">
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('username')}</p>
                        <p className="font-black text-purple-600 text-lg uppercase tracking-tight">{formData.username || 'traveler'}</p>
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('surname')}</p>
                        <p className="font-black text-slate-800 uppercase truncate text-lg tracking-tight">{formData.lastName || '---'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 px-1">
                    <i className="fas fa-chart-bar text-slate-800"></i> {pt('categoryPoints')}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Cultura', points: user.culturePoints || 0, icon: 'fa-landmark', color: 'bg-amber-100 text-amber-600' },
                        { label: 'Gastro', points: user.foodPoints || 0, icon: 'fa-utensils', color: 'bg-emerald-100 text-emerald-600' },
                        { label: 'Foto', points: user.photoPoints || 0, icon: 'fa-camera', color: 'bg-purple-100 text-purple-600' }
                    ].map(cat => (
                        <div key={cat.label} className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                            <div className={`w-8 h-8 ${cat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}><i className={`fas ${cat.icon} text-xs`}></i></div>
                            <p className="text-[10px] font-black text-slate-900">{cat.points}</p>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

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
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
