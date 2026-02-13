
import React, { useState } from 'react';
import { UserProfile, LANGUAGES, AVATARS, TravelerRank, RANK_THRESHOLDS } from '../types';
import { syncUserProfile } from '../services/supabaseClient';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  language?: string;
  onLangChange?: (code: string) => void;
}

const MODAL_TEXTS: any = {
    es: { title: "Pasaporte Global bdai", subtitle: "Nómada Digital ID", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País", age: "Edad", birthday: "Nacimiento", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión", stamps: "Mis Visados", badges: "Insignias", langLabel: "Idioma", rank: "RANGO", miles: "MILLAS", admin: "ADMIN", streak: "Racha", changeAvatar: "Cambiar Foto", stats: "Especialidades" },
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad ID", surname: "Surname", givenNames: "Given Names", city: "City", country: "Country", age: "Age", birthday: "Birthdate", save: "Save", edit: "Edit", logout: "Logout", stamps: "My Visas", badges: "Badges", langLabel: "Language", rank: "RANK", miles: "MILES", admin: "ADMIN", streak: "Streak", changeAvatar: "Change Photo", stats: "Specialties" }
};

const SkillBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[7px] font-black uppercase tracking-widest text-slate-400">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${Math.min(value, 100)}%` }}></div>
        </div>
    </div>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin, onLangChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || '',
      country: user.country || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es'
  });

  const pt = (key: string) => (MODAL_TEXTS[user.language] || MODAL_TEXTS['en'] || MODAL_TEXTS['es'])[key] || key;
  const isAdmin = user.email === 'travelbdai@gmail.com';

  const handleSave = async () => {
      setIsSyncing(true);
      try {
          const birthDate = new Date(formData.birthday);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`.trim(), age: age };
          await syncUserProfile(updatedUser);
          if (onUpdateUser) onUpdateUser(updatedUser);
          setIsEditing(false);
      } catch (e) {} finally { setIsSyncing(false); }
  };

  const getRankProgress = () => {
      const currentRank = user.rank;
      const ranks: TravelerRank[] = ['Turist', 'Explorer', 'Wanderer', 'Globe-Trotter', 'Legend'];
      const currentIndex = ranks.indexOf(currentRank);
      if (currentIndex === ranks.length - 1) return 100;
      const nextRank = ranks[currentIndex + 1];
      const min = RANK_THRESHOLDS[currentRank];
      const max = RANK_THRESHOLDS[nextRank];
      return ((user.miles - min) / (max - min)) * 100;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={onClose}></div>
      <div className="bg-[#f3f0e6] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border-[3px] border-[#d7d2c3] flex flex-col max-h-[95vh] text-slate-900">
        <div className="bg-[#8b2b2b] p-5 flex justify-between items-center shrink-0 border-b-2 border-[#d7d2c3]">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900 border border-yellow-400 shadow-md"><i className="fas fa-id-card text-xs"></i></div>
                <div>
                    <h2 className="text-yellow-500 font-black text-[10px] uppercase tracking-widest leading-none">{pt('title')}</h2>
                    <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest mt-1">{pt('subtitle')}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEditing ? 'bg-blue-600' : 'bg-white/10'} text-white transition-all shadow-lg`}>
                    {isSyncing ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'} text-xs`}></i>}
                </button>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
            <div className="flex gap-6 items-start">
                <div className="shrink-0 w-28 h-36 bg-white border-2 border-[#d7d2c3] rounded-xl shadow-lg overflow-hidden p-1 relative">
                    <img src={formData.avatar} className="w-full h-full object-cover grayscale contrast-125 saturate-0" />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-yellow-500 rounded-lg flex items-center justify-center border border-white shadow-sm"><i className="fas fa-stamp text-[8px] text-white"></i></div>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="pb-1 border-b border-slate-200">
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">ID_NOMAD</p>
                        <p className="font-black text-slate-900 uppercase text-[11px] truncate leading-none">@{formData.username}</p>
                    </div>
                    <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('rank')}</p>
                        <p className="font-black text-purple-600 text-[9px] uppercase">{user.rank}</p>
                        <div className="h-1 bg-slate-200 rounded-full mt-1"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${getRankProgress()}%` }}></div></div>
                    </div>
                    <div className="flex justify-between pt-1">
                        <div><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('miles')}</p><p className="font-black text-slate-900 text-[10px]">{user.miles.toLocaleString()}</p></div>
                        <div className="text-right"><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('streak')}</p><p className="font-black text-orange-600 text-[10px]"><i className="fas fa-fire mr-1"></i> {user.stats.streakDays}</p></div>
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{pt('stats')}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <SkillBar label="Historia" value={user.historyPoints || 0} color="bg-amber-500" />
                    <SkillBar label="Ingeniería" value={user.archPoints || 0} color="bg-blue-500" />
                    <SkillBar label="Gastro" value={user.foodPoints || 0} color="bg-emerald-500" />
                    <SkillBar label="Foto" value={user.photoPoints || 0} color="bg-purple-500" />
                </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest">{pt('stamps')}</p>
                <div className="grid grid-cols-4 gap-2">
                    {(user.stamps || []).map((s, i) => (
                        <div key={i} className="aspect-square rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden group">
                             <div className="absolute inset-0 opacity-10" style={{ backgroundColor: s.color }}></div>
                             <i className="fas fa-stamp text-slate-400 text-lg group-hover:scale-110 transition-transform"></i>
                             <span className="text-[5px] font-black uppercase absolute bottom-1 text-slate-500">{s.city.substring(0,3)}</span>
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 8 - (user.stamps || []).length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-white/30 border-2 border-dashed border-slate-200 rounded-lg"></div>
                    ))}
                </div>
            </div>

            <div className="pt-2 space-y-3">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{pt('langLabel')}</p>
                <div className="flex flex-wrap gap-2">
                    {LANGUAGES.slice(0, 10).map(lang => (
                        <button key={lang.code} onClick={() => onLangChange?.(lang.code)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${user.language === lang.code ? 'bg-purple-600 text-white shadow-lg scale-110' : 'bg-white text-slate-400'}`}>
                            <span className="text-[8px] font-black">{lang.name}</span>
                        </button>
                    ))}
                </div>

                {isAdmin && (
                    <button onClick={onOpenAdmin} className="w-full py-4 bg-slate-900 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95 shadow-lg mt-4">
                        <i className="fas fa-tools text-xs"></i> {pt('admin')}
                    </button>
                )}
                <button onClick={onLogout} className="w-full py-4 border border-red-100 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95">
                    {pt('logout')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
