
import React, { useState, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, VisaStamp } from '../types';
import { FlagIcon } from './FlagIcon';
import { syncUserProfile } from '../services/supabaseClient';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  language?: string;
}

const MODAL_TEXTS: any = {
    es: { title: "Pasaporte Global bdai", subtitle: "Nómada Digital ID", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País", age: "Edad", birthday: "F. Nacimiento", categoryPoints: "Actividad Técnica", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión", stamps: "Visados", visibility: "Visibilidad", public: "Público", private: "Privado", langLabel: "Idioma", user_id: "ID_USUARIO", rank: "RANGO", miles: "MILLAS", admin: "SALA DE MÁQUINAS" },
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad ID", surname: "Surname", givenNames: "Given Names", city: "City", country: "Country", age: "Age", birthday: "Birthdate", categoryPoints: "Technical Activity", save: "Save", edit: "Edit", logout: "Logout", stamps: "Stamps", visibility: "Visibility", public: "Public", private: "Private", langLabel: "Language", user_id: "USER_ID", rank: "RANK", miles: "MILES", admin: "ADMIN PANEL" },
    it: { title: "Passaporto Globale bdai", subtitle: "ID Nomade Digitale", surname: "Cognome", givenNames: "Nome", city: "Città", country: "Paese", age: "Età", birthday: "Data di Nascita", categoryPoints: "Attività Tecnica", save: "Salva", edit: "Modifica", logout: "Esci", stamps: "Visti", visibility: "Visibilità", public: "Pubblico", private: "Privato", langLabel: "Lingua", user_id: "ID_UTENTE", rank: "RANGO", miles: "MIGLIA", admin: "SALA MACCHINE" }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const pt = (key: string) => (MODAL_TEXTS[user.language] || MODAL_TEXTS['es'])[key] || key;

  const isAdmin = user.email === 'travelbdai@gmail.com';

  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || '',
      country: user.country || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es',
      isPublic: user.isPublic ?? false
  });

  const handleSave = async () => {
      setIsSyncing(true);
      try {
          const birthDate = new Date(formData.birthday);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`, age: age };
          await syncUserProfile(updatedUser);
          if (onUpdateUser) onUpdateUser(updatedUser);
          setIsEditing(false);
      } catch (e) {
          console.error("Save error:", e);
      } finally {
          setIsSyncing(false);
      }
  };

  const activityCategories = [
    { label: 'Hist', points: user.historyPoints || 0, icon: 'fa-monument' },
    { label: 'Gast', points: user.foodPoints || 0, icon: 'fa-utensils' },
    { label: 'Arte', points: user.artPoints || 0, icon: 'fa-palette' },
    { label: 'Natu', points: user.naturePoints || 0, icon: 'fa-leaf' },
    { label: 'Foto', points: user.photoPoints || 0, icon: 'fa-camera' },
    { label: 'Cult', points: user.culturePoints || 0, icon: 'fa-landmark' },
    { label: 'Arqu', points: user.archPoints || 0, icon: 'fa-archway' }
  ];

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
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEditing ? 'bg-blue-600 shadow-lg' : 'bg-white/10'} text-white transition-all`}>
                    {isSyncing ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'} text-xs`}></i>}
                </button>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
            <div className="flex gap-6 items-start">
                <div className="shrink-0 w-28 h-36 bg-white border-2 border-[#d7d2c3] rounded-xl shadow-lg overflow-hidden flex items-center justify-center p-1 relative">
                    <img src={formData.avatar} className="w-full h-full object-cover grayscale contrast-125 saturate-0" />
                </div>
                <div className="flex-1 space-y-4">
                    <div className="pb-2 border-b border-slate-200">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('user_id')}</p>
                        <p className="font-black text-slate-900 uppercase text-sm leading-none tracking-tight">{formData.username}</p>
                    </div>
                    <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('givenNames')}</p>{isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[11px] font-bold uppercase" /> : <p className="font-black text-slate-800 uppercase text-xs leading-none">{formData.firstName || '---'}</p>}</div>
                    <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('surname')}</p>{isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[11px] font-bold uppercase" /> : <p className="font-black text-slate-800 uppercase text-xs leading-none">{formData.lastName || '---'}</p>}</div>
                    <div className="flex justify-between border-t border-slate-200 pt-3">
                        <div><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('rank')}</p><p className="font-black text-purple-600 text-[10px] uppercase mt-1">{user.rank}</p></div>
                        <div className="text-right"><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('miles')}</p><p className="font-black text-slate-900 text-[10px] mt-1">{user.miles.toLocaleString()}</p></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5 border-t border-slate-300 pt-5">
                <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('city')}</p>{isEditing ? <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[11px] uppercase" /> : <p className="font-bold text-slate-800 text-[11px] uppercase">{formData.city || '---'}</p>}</div>
                <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('birthday')}</p>{isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[11px] uppercase" /> : <p className="font-bold text-slate-800 text-[11px] uppercase">{formData.birthday || '---'}</p>}</div>
            </div>

            <div className="pt-2 border-t border-slate-200">
                <p className="text-[7px] text-slate-400 font-black uppercase mb-3 tracking-widest">{pt('visibility')}</p>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => isEditing && setFormData({...formData, isPublic: !formData.isPublic})}
                        className={`flex-1 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${formData.isPublic ? 'bg-purple-600 text-white border-purple-500' : 'bg-white border-slate-200 text-slate-400'}`}
                        disabled={!isEditing}
                    >
                        {formData.isPublic ? pt('public') : pt('private')}
                    </button>
                </div>
            </div>

            <div className="pt-2">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 border-b border-slate-200 pb-2">{pt('stamps')}</h4>
                <div className="grid grid-cols-4 gap-3">
                    {(user.stamps || []).map((stamp, i) => (
                        <div key={i} className="w-18 h-18 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-2 text-center opacity-80 text-blue-600 border-blue-600">
                            <p className="text-[6px] font-black uppercase leading-tight truncate w-full">{stamp.city}</p>
                            <p className="text-[5px] font-bold">{stamp.date.split('-')[0]}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-2">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 border-b border-slate-200 pb-2">{pt('categoryPoints')}</h4>
                <div className="grid grid-cols-4 gap-2">
                    {activityCategories.map(cat => (
                        <div key={cat.label} className="bg-white/40 border border-slate-200 p-2 rounded-xl text-center flex flex-col items-center shadow-sm">
                            <p className="text-xs font-black text-slate-900 leading-none">{cat.points}</p>
                            <p className="text-[5px] font-black text-slate-400 uppercase tracking-widest mt-1.5 truncate w-full">{cat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-5 border-t border-slate-300">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-4 tracking-widest">{pt('langLabel')}</p>
                <div className="grid grid-cols-6 gap-4 mb-8">
                    {LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => { setFormData({...formData, language: lang.code}); if(onUpdateUser) onUpdateUser({...user, language: lang.code}); }} className={`transition-all active:scale-90`}>
                            <FlagIcon code={lang.code} className={`w-7 h-7 ${formData.language === lang.code ? 'ring-2 ring-purple-600' : 'opacity-30 grayscale'}`} />
                        </button>
                    ))}
                </div>

                {/* BOTÓN SALA DE MÁQUINAS - SOLO PARA travelbdai@gmail.com */}
                {isAdmin && (
                    <button 
                        onClick={onOpenAdmin}
                        className="w-full py-4 mb-3 bg-slate-900 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl border-2 border-yellow-500/20 active:scale-95 transition-all"
                    >
                        <i className="fas fa-tools text-xs"></i>
                        {pt('admin')}
                    </button>
                )}

                <button onClick={onLogout} className="w-full py-4 border border-red-100 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95 transition-all">
                    {pt('logout')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
