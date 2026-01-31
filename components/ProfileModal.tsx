
import React, { useState, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, RANK_THRESHOLDS, TravelerRank } from '../types';
import { FlagIcon } from './FlagIcon';
import { syncUserProfile } from '../services/supabaseClient';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  language?: string;
}

const MODAL_TEXTS: any = {
    en: { title: "bdai Global Passport", subtitle: "Nomad ID", surname: "Last Name", givenNames: "First Name", city: "Origin City", country: "Origin Country", birthday: "Birth Date", age: "Age", save: "Save", edit: "Edit", logout: "Logout" },
    es: { title: "Pasaporte Global bdai", subtitle: "ID Nómada", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad Origen", country: "País Origen", birthday: "F. Nacimiento", age: "Edad", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión" }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pt = (key: string) => (MODAL_TEXTS[user.language] || MODAL_TEXTS['es'])[key] || key;

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

  const handleSave = async () => {
      setIsSyncing(true);
      const birthDate = new Date(formData.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`, age: age };
      const result = await syncUserProfile(updatedUser);
      if (result.success && onUpdateUser) onUpdateUser(updatedUser);
      setIsEditing(false);
      setIsSyncing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setFormData({...formData, avatar: e.target.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  const currentThreshold = RANK_THRESHOLDS[user.rank || 'Turist'];
  const progressPercent = Math.min(100, (user.miles / 5000) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={onClose}></div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      <div className="bg-[#f3f0e6] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border-[6px] border-[#d7d2c3] flex flex-col max-h-[90vh] text-slate-900">
        
        <div className="bg-[#8b2b2b] p-6 flex justify-between items-center shrink-0 border-b-4 border-[#d7d2c3]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900 border-2 border-yellow-400"><i className="fas fa-id-card"></i></div>
                <div>
                    <h2 className="text-yellow-500 font-black text-[10px] uppercase tracking-widest">{pt('title')}</h2>
                    <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest">{pt('subtitle')}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEditing ? 'bg-blue-600' : 'bg-white/10'} text-white shadow-lg`}>
                    {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'}`}></i>}
                </button>
                <button onClick={onLogout} className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg"><i className="fas fa-sign-out-alt"></i></button>
                <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
            <div className="flex gap-6 items-start">
                <div className="shrink-0 relative">
                    <div onClick={() => isEditing && fileInputRef.current?.click()} className="w-32 h-40 bg-white border-2 border-[#d7d2c3] rounded-lg shadow-xl overflow-hidden flex items-center justify-center p-1 cursor-pointer">
                        <img src={formData.avatar} className="w-full h-full object-cover grayscale contrast-125" />
                        {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-black uppercase">Cambiar</div>}
                    </div>
                </div>
                <div className="flex-1 space-y-4">
                    <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1">{pt('givenNames')}</p>{isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-xs uppercase" /> : <p className="font-black text-slate-800 uppercase">{formData.firstName || '---'}</p>}</div>
                    <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1">{pt('surname')}</p>{isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-xs uppercase" /> : <p className="font-black text-slate-800 uppercase">{formData.lastName || '---'}</p>}</div>
                    <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1">Status</p><p className="font-black text-purple-600 text-xs uppercase">{user.rank}</p></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-300 pt-6">
                <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1">{pt('birthday')}</p>{isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-xs" /> : <p className="font-bold text-slate-800 text-xs">{formData.birthday || '---'}</p>}</div>
                <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1">{pt('age')}</p><p className="font-bold text-slate-800 text-xs">{user.age || '--'}</p></div>
                <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1">{pt('city')}</p>{isEditing ? <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-xs" /> : <p className="font-bold text-slate-800 text-xs uppercase">{formData.city || '---'}</p>}</div>
                <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1">{pt('country')}</p>{isEditing ? <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-xs" /> : <p className="font-bold text-slate-800 text-xs uppercase">{formData.country || '---'}</p>}</div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-300">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Idioma Pasaporte</h4>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
                    {LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => setFormData({...formData, language: lang.code})} className={`w-11 h-11 shrink-0 rounded-full overflow-hidden border-2 transition-all ${formData.language === lang.code ? 'border-purple-600 scale-110 shadow-lg' : 'border-transparent opacity-40 grayscale'}`}>
                            <FlagIcon code={lang.code} className="w-full h-full" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
