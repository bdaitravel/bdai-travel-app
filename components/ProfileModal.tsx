
import React, { useState } from 'react';
import { UserProfile, LANGUAGES, AVATARS } from '../types';
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
    es: { title: "Pasaporte Global bdai", subtitle: "Nómada Digital ID", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País", age: "Edad", birthday: "F. Nacimiento", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión", stamps: "Mis Visados", langLabel: "Idioma", user_id: "ID_USUARIO", rank: "RANGO", miles: "MILLAS", admin: "ADMIN", streak: "Racha", changeAvatar: "Toca para cambiar foto" },
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad ID", surname: "Surname", givenNames: "Given Names", city: "City", country: "Country", age: "Age", birthday: "Birthdate", save: "Save", edit: "Edit", logout: "Logout", stamps: "My Visas", langLabel: "Language", user_id: "USER_ID", rank: "RANK", miles: "MILES", admin: "ADMIN", streak: "Streak", changeAvatar: "Tap to change photo" },
    fr: { title: "Passeport Global bdai", subtitle: "ID Nomade Numérique", surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays", age: "Âge", birthday: "Date de Naissance", save: "Enregistrer", edit: "Modifier", logout: "Déconnexion", stamps: "Mes Visas", langLabel: "Langue", user_id: "ID_UTILISATEUR", rank: "RANG", miles: "MILES", admin: "ADMIN", streak: "Série", changeAvatar: "Appuyez pour changer" },
    ro: { title: "Pașaport Global bdai", subtitle: "ID Nomad Digital", surname: "Nume", givenNames: "Prenume", city: "Oraș", country: "Țară", age: "Vârstă", birthday: "Data Nașterii", save: "Salvează", edit: "Editează", logout: "Deconectare", stamps: "Vizele Mele", langLabel: "Limbă", user_id: "ID_UTILIZATOR", rank: "RANG", miles: "MILE", admin: "ADMIN", streak: "Zile", changeAvatar: "Atinge pentru schimbare" },
    ja: { title: "bdai グローバルパスポート", subtitle: "デジタルノマド ID", surname: "姓", givenNames: "名", city: "都市", country: "国", age: "年齢", birthday: "誕生日", save: "保存", edit: "編集", logout: "ログアウト", stamps: "ビザスタンプ", langLabel: "言語", user_id: "ユーザーID", rank: "ランク", miles: "マイル", admin: "管理", streak: "ストリーク", changeAvatar: "タップで変更" },
    hi: { title: "bdai ग्लोबल पासपोर्ट", subtitle: "डिजिटल नोमैड आईडी", surname: "उपनाम", givenNames: "दिया गया नाम", city: "शहर", country: "देश", age: "आयु", birthday: "जन्म तिथि", save: "सहेजें", edit: "संपादित करें", logout: "लॉगआउट", stamps: "मेरे वीजा", langLabel: "भाषा", user_id: "उपयोगकर्ता_आईडी", rank: "रैंक", miles: "मील", admin: "एडमिन", streak: "लकीर", changeAvatar: "फोटो बदलने के लिए टैप करें" }
};

const LangCircle: React.FC<{ code: string; isActive: boolean; onClick: () => void }> = ({ code, isActive, onClick }) => (
    <button onClick={onClick} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-90 shrink-0 ${isActive ? 'bg-purple-600 border-purple-400 text-white font-black' : 'bg-white border-slate-200 text-slate-400 font-bold hover:bg-slate-50'}`}>
        <span className="text-[8px] uppercase">{code}</span>
    </button>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin }) => {
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

  const pt = (key: string) => {
    const lang = formData.language || 'es';
    return (MODAL_TEXTS[lang] || MODAL_TEXTS['es'])[key] || (MODAL_TEXTS['es'])[key] || key;
  };

  const isAdmin = user.email === 'travelbdai@gmail.com';

  const handleAvatarChange = () => {
      if (!isEditing) return;
      const currentIndex = AVATARS.indexOf(formData.avatar);
      const nextIndex = (currentIndex + 1) % AVATARS.length;
      setFormData({ ...formData, avatar: AVATARS[nextIndex] });
  };

  const handleSave = async () => {
      setIsSyncing(true);
      try {
          const birthDate = new Date(formData.birthday);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`.trim(), age: age };
          await syncUserProfile(updatedUser);
          if (onUpdateUser) onUpdateUser(updatedUser);
          setIsEditing(false);
      } catch (e) {} finally {
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
                <div onClick={handleAvatarChange} className={`shrink-0 w-28 h-36 bg-white border-2 border-[#d7d2c3] rounded-xl shadow-lg overflow-hidden p-1 relative ${isEditing ? 'cursor-pointer animate-pulse' : ''}`}>
                    <img src={formData.avatar} className="w-full h-full object-cover grayscale contrast-125 saturate-0" />
                    {isEditing && <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-[8px] font-black text-center px-2">{pt('changeAvatar')}</div>}
                    <div className="absolute bottom-1 right-1 bg-yellow-500 px-1 py-0.5 rounded text-[6px] font-black text-slate-950 border border-slate-900">ORIGINAL</div>
                </div>
                <div className="flex-1 space-y-4">
                    <div className="pb-2 border-b border-slate-200">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('user_id')}</p>
                        {isEditing ? (
                          <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] font-black uppercase text-purple-600" />
                        ) : (
                          <p className="font-black text-slate-900 uppercase text-xs truncate leading-none">@{formData.username}</p>
                        )}
                    </div>
                    <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('rank')}</p><p className="font-black text-purple-600 text-[9px] uppercase">{user.rank}</p></div>
                    <div className="flex justify-between border-t border-slate-200 pt-3">
                        <div><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('miles')}</p><p className="font-black text-slate-900 text-[9px] mt-1">{user.miles.toLocaleString()}</p></div>
                        <div className="text-right"><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('streak')}</p><p className="font-black text-orange-600 text-[9px] mt-1"><i className="fas fa-fire mr-1"></i> {user.stats.streakDays}</p></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="space-y-1">
                    <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('givenNames')}</p>
                    {isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.firstName || '---'}</p>}
                </div>
                <div className="space-y-1">
                    <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('surname')}</p>
                    {isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.lastName || '---'}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('city')}</p>
                    {isEditing ? <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.city || '---'}</p>}
                </div>
                <div className="space-y-1">
                    <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('country')}</p>
                    {isEditing ? <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.country || '---'}</p>}
                </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
                <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-1">{pt('birthday')}</p>
                {isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.birthday || '---'}</p>}
            </div>

            <div className="pt-2">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 border-b border-slate-200 pb-2">{pt('stamps')}</h4>
                <div className="flex gap-5 overflow-x-auto no-scrollbar pb-8 min-h-[100px] pt-2 px-1">
                    {user.stamps && user.stamps.length > 0 ? (
                        user.stamps.map((stamp, i) => (
                            <div key={i} className="shrink-0 w-20 h-20 rounded-full border-[3px] border-[#8b2b2b]/40 bg-white flex flex-col items-center justify-center text-center shadow-lg rotate-[-12deg] p-2">
                                <span className="text-[6px] font-black uppercase leading-none text-[#8b2b2b]">{stamp.country}</span>
                                <span className="text-[8px] font-black uppercase text-slate-900 my-0.5 tracking-tight border-y border-[#8b2b2b]/20 py-0.5 w-full">{stamp.city}</span>
                                <span className="text-[5px] font-bold text-slate-400 uppercase">{stamp.date}</span>
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-16 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center opacity-40 italic text-[9px]">---</div>
                    )}
                </div>
            </div>

            <div className="pt-5 border-t border-slate-300">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-4 tracking-widest">{pt('langLabel')}</p>
                <div className="flex flex-wrap gap-2 mb-8">
                    {LANGUAGES.map(lang => (
                        <LangCircle key={lang.code} code={lang.name} isActive={formData.language === lang.code} onClick={() => { setFormData({...formData, language: lang.code}); if(onUpdateUser) onUpdateUser({...user, language: lang.code}); }} />
                    ))}
                </div>

                {isAdmin && (
                    <button onClick={onOpenAdmin} className="w-full py-4 mb-3 bg-slate-900 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95 shadow-lg">
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
