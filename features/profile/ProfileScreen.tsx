
import React, { useState, useEffect } from 'react';
import { UserProfile, LANGUAGES, AVATARS } from '../../types';
import { syncUserProfile } from '../../services/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';

interface ProfileScreenProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin }) => {
  const { language, setLanguage, t } = useLanguage();
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

  useEffect(() => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || '',
      country: user.country || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es'
    });
  }, [user]);

  const isAdmin = user.email === 'travelbdai@gmail.com';

  const handleAvatarChange = async () => {
    const currentIndex = AVATARS.indexOf(formData.avatar);
    const nextIndex = (currentIndex + 1) % AVATARS.length;
    const newAvatar = AVATARS[nextIndex];
    
    setFormData(prev => ({ ...prev, avatar: newAvatar }));
    
    const updatedUser = { ...user, avatar: newAvatar };
    if (onUpdateUser) onUpdateUser(updatedUser);
    if (user.isLoggedIn) await syncUserProfile(updatedUser);
  };

  const handleSave = async () => {
    setIsSyncing(true);
    try {
      const birthDate = new Date(formData.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const updatedUser = { 
        ...user, 
        ...formData, 
        name: `${formData.firstName} ${formData.lastName}`.trim(), 
        age 
      };
      await syncUserProfile(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      setIsEditing(false);
    } catch (e) {
      console.error("Save error", e);
    } finally { 
      setIsSyncing(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={onClose}></div>
      <div className="bg-[#f3f0e6] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border-[3px] border-[#d7d2c3] flex flex-col max-h-[95vh] text-slate-900">
        <div className="bg-[#8b2b2b] p-5 flex justify-between items-center shrink-0 border-b-2 border-[#d7d2c3]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900 border border-yellow-400 shadow-md"><i className="fas fa-id-card text-xs"></i></div>
            <div>
              <h2 className="text-yellow-500 font-black text-[10px] uppercase tracking-widest leading-none">{t('profile.title')}</h2>
              <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest mt-1">{t('profile.subtitle')}</p>
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
            <div onClick={handleAvatarChange} className="shrink-0 w-28 h-36 bg-white border-2 border-[#d7d2c3] rounded-xl shadow-lg overflow-hidden p-1 relative cursor-pointer group active:scale-95 transition-transform">
              <img src={formData.avatar} className="w-full h-full object-cover grayscale contrast-125 saturate-0" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[8px] font-black text-center px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col items-center gap-2">
                  <i className="fas fa-sync-alt text-lg"></i>
                  {t('profile.changeAvatar')}
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">ID_NOMAD</p>
                <p className="font-black text-slate-900 uppercase text-xs truncate leading-none">@{formData.username}</p>
              </div>
              <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{t('profile.rank')}</p><p className="font-black text-purple-600 text-[9px] uppercase">{user.rank}</p></div>
              <div className="flex justify-between border-t border-slate-200 pt-3">
                <div><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{t('profile.miles')}</p><p className="font-black text-slate-900 text-[9px] mt-1">{user.miles.toLocaleString()}</p></div>
                <div className="text-right"><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{t('profile.streak')}</p><p className="font-black text-orange-600 text-[9px] mt-1"><i className="fas fa-fire mr-1"></i> {user.stats.streakDays}</p></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-4 border-t border-slate-200">
            {/* Fila 1: Nombres */}
            <div className="space-y-1">
              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{t('profile.givenNames')}</p>
              {isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase outline-none focus:border-purple-400" /> : <p className="font-bold text-slate-800 text-[10px] uppercase truncate">{formData.firstName || '---'}</p>}
            </div>
            <div className="space-y-1">
              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{t('profile.surname')}</p>
              {isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase outline-none focus:border-purple-400" /> : <p className="font-bold text-slate-800 text-[10px] uppercase truncate">{formData.lastName || '---'}</p>}
            </div>

            {/* Fila 2: Ubicación */}
            <div className="space-y-1">
              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{t('profile.city')}</p>
              {isEditing ? <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase outline-none focus:border-purple-400" /> : <p className="font-bold text-slate-800 text-[10px] uppercase truncate">{formData.city || '---'}</p>}
            </div>
            <div className="space-y-1">
              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{t('profile.country')}</p>
              {isEditing ? <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase outline-none focus:border-purple-400" placeholder="País" /> : <p className="font-bold text-slate-800 text-[10px] uppercase truncate">{formData.country || '---'}</p>}
            </div>

            {/* Fila 3: Fecha (Ancho completo) */}
            <div className="space-y-1 col-span-2">
              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{t('profile.birthday')}</p>
              {isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] outline-none focus:border-purple-400" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.birthday || '---'}</p>}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-4 tracking-widest">{t('profile.langLabel')}</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {LANGUAGES.map(lang => (
                <button 
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${language === lang.code ? 'bg-purple-600 text-white scale-110 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}
                >
                  <span className="text-[8px] uppercase">{lang.name}</span>
                </button>
              ))}
            </div>

            {isAdmin && (
              <button onClick={onOpenAdmin} className="w-full py-4 mb-3 bg-slate-900 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95 shadow-lg">
                <i className="fas fa-tools text-xs"></i> {t('profile.admin')}
              </button>
            )}

            <button onClick={onLogout} className="w-full py-4 border border-red-100 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95">
              {t('profile.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
