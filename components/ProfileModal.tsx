
import React, { useState, useRef } from 'react';
import { UserProfile, LeaderboardEntry, LANGUAGES } from '../types';

interface ProfileModalProps {
  user: UserProfile | LeaderboardEntry;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  language?: string;
}

const UI_TEXT: any = {
    en: { passport: "Passport", surname: "Surname", givenNames: "Given Names", rank: "Rank", miles: "Total Miles", bio: "Bio", badges: "Badges", stamps: "Visa Stamps", edit: "Edit", save: "Save Passport", langLabel: "Language" },
    es: { passport: "Pasaporte", surname: "Apellidos", givenNames: "Nombres", rank: "Rango", miles: "Millas Totales", bio: "Biografía", badges: "Insignias", stamps: "Sellos Visa", edit: "Editar", save: "Guardar", langLabel: "Idioma" },
    ca: { passport: "Passaport", surname: "Cognoms", givenNames: "Noms", rank: "Rang", miles: "Milles Totals", bio: "Biografia", badges: "Insígnies", stamps: "Segells Visa", edit: "Editar", save: "Guardar", langLabel: "Idioma" },
    fr: { passport: "Passeport", surname: "Nom", givenNames: "Prénoms", rank: "Rang", miles: "Milles Totaux", bio: "Bio", badges: "Badges", stamps: "Visas", edit: "Modifier", save: "Enregistrer", langLabel: "Langue" },
    de: { passport: "Reisepass", surname: "Nachname", givenNames: "Vorname", rank: "Rang", miles: "Gesamtmeilen", bio: "Bio", badges: "Abzeichen", stamps: "Visa-Stempel", edit: "Editieren", save: "Speichern", langLabel: "Sprache" },
    pt: { passport: "Passaporte", surname: "Sobrenome", givenNames: "Nomes", rank: "Posto", miles: "Milhas Totais", bio: "Bio", badges: "Distintivos", stamps: "Selos Visa", edit: "Editar", save: "Salvar", langLabel: "Idioma" },
    ar: { passport: "جواز السفر", surname: "اللقب", givenNames: "الأسماء الأولى", rank: "الرتبة", miles: "إجمالي الأميال", bio: "نبذة", badges: "الأوسمة", stamps: "أختام الفيزا", edit: "تعديل", save: "حفظ", langLabel: "اللغة" },
    zh: { passport: "护照", surname: "姓", givenNames: "名字", rank: "等级", miles: "总里程", bio: "个人简介", badges: "勋章", stamps: "签证印章", edit: "编辑", save: "保存", langLabel: "语言" },
    ja: { passport: "パスポート", surname: "苗字", givenNames: "名前", rank: "ランク", miles: "合計マイル", bio: "自己紹介", badges: "バッジ", stamps: "入国スタンプ", edit: "編集", save: "保存", langLabel: "言語" }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, language = 'es' }) => {
  const profile = user as UserProfile;
  const t = UI_TEXT[language] || UI_TEXT['en'];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: profile.firstName, lastName: profile.lastName, bio: profile.bio, avatar: profile.avatar, language: profile.language, isPublic: profile.isPublic !== undefined ? profile.isPublic : true });

  const handleSave = () => {
      if (onUpdateUser) {
          onUpdateUser({ ...profile, firstName: formData.firstName, lastName: formData.lastName, bio: formData.bio, avatar: formData.avatar, language: formData.language, isPublic: formData.isPublic });
      }
      setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#0b1c3d] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border border-white/10 flex flex-col max-h-[92vh] animate-slide-up">
        <div className="p-8 border-b border-white/10 flex justify-between items-start flex-shrink-0">
            <div className="space-y-1"><h2 className="text-yellow-500 font-heading font-black text-xs uppercase tracking-[0.5em]">{t.passport}</h2><p className="text-white/40 font-mono text-[8px] uppercase tracking-widest">Global Citizen • BDAI Explorer Network</p></div>
            <div className="flex gap-2">
                {isOwnProfile && <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="w-10 h-10 rounded-full bg-yellow-500 text-slate-900 flex items-center justify-center shadow-lg border border-yellow-400 active:scale-90 transition-transform z-20"><i className={`fas ${isEditing ? 'fa-save' : 'fa-pen'} text-xs`}></i></button>}
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"><i className="fas fa-times text-xs"></i></button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#e8e4d8] m-3 rounded-[1.5rem] shadow-inner text-slate-900 pb-10">
            <div className="p-6">
                <div className="flex gap-4 mb-8">
                    <div onClick={() => isEditing && fileInputRef.current?.click()} className={`w-28 h-36 bg-white p-2 rounded shadow-xl border border-slate-300 transform -rotate-1 relative overflow-hidden transition-all ${isEditing ? 'cursor-pointer ring-2 ring-yellow-500/50 hover:scale-[1.02]' : ''}`}>
                        <img src={formData.avatar} className="w-full h-full object-cover grayscale-[0.2]" alt="ID" />
                        {isEditing && <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center p-2 opacity-0 hover:opacity-100 transition-opacity"><i className="fas fa-camera text-xl mb-1"></i></div>}
                        <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => setFormData({...formData, avatar: r.result as string}); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
                    </div>
                    <div className="flex-1 space-y-4 pt-2">
                        {isEditing ? (
                            <div className="space-y-3">
                                <div><p className="text-[7px] font-black text-slate-400 uppercase">{t.surname}</p><input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/70 border-b-2 border-slate-300 text-xs font-black uppercase p-1 rounded-t-md outline-none focus:border-yellow-500"/></div>
                                <div><p className="text-[7px] font-black text-slate-400 uppercase">{t.givenNames}</p><input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/70 border-b-2 border-slate-300 text-xs font-black uppercase p-1 rounded-t-md outline-none focus:border-yellow-500"/></div>
                                <div><p className="text-[7px] font-black text-slate-400 uppercase">{t.langLabel}</p><select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full bg-white/70 border-b-2 border-slate-300 text-[10px] font-black uppercase p-1 rounded-t-md outline-none focus:border-yellow-500">{LANGUAGES.map(lang => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}</select></div>
                            </div>
                        ) : (
                            <>
                                <div><p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{t.surname}</p><p className="text-sm font-black text-slate-900 uppercase tracking-tight font-mono">{profile.lastName || 'TRAVELER'}</p></div>
                                <div><p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{t.givenNames}</p><p className="text-sm font-black text-slate-900 uppercase tracking-tight font-mono">{profile.firstName || 'ALEX'}</p></div>
                                <div><p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{t.langLabel}</p><p className="text-[10px] font-black text-purple-600 uppercase">{LANGUAGES.find(l => l.code === profile.language)?.name}</p></div>
                            </>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.bio}</p>{isEditing ? (<textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-white/70 border border-slate-300 text-xs p-3 rounded-xl italic h-24 outline-none"/>) : (<div className="bg-white/40 p-4 rounded-2xl border border-slate-900/5 italic text-sm text-slate-600 leading-relaxed">"{profile.bio}"</div>)}</div>
                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.badges}</p><div className="grid grid-cols-2 gap-3">{profile.badges.map(badge => (<div key={badge.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col items-center gap-2 shadow-sm"><div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 text-lg shadow-inner"><i className={`fas ${badge.icon}`}></i></div><p className="text-[8px] font-black uppercase text-center text-slate-800 leading-none">{badge.name}</p></div>))}</div></div>
                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.stamps}</p><div className="flex flex-wrap gap-4">{profile.visitedCities.map(city => (<div key={city} className="w-16 h-16 rounded-full border-2 border-dashed border-slate-400/30 flex flex-col items-center justify-center p-2 text-center opacity-40 transform rotate-12"><span className="text-[7px] font-black uppercase text-slate-600 leading-none">{city}</span><i className="fas fa-plane-arrival text-[10px] text-slate-300 mt-1"></i></div>))}</div></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
