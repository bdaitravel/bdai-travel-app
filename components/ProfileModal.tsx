
import React, { useState } from 'react';
import { UserProfile, LeaderboardEntry, LANGUAGES } from '../types';

interface ProfileModalProps {
  user: UserProfile | LeaderboardEntry;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  language?: string;
}

const UI_TEXTS: any = {
    en: {
        edit: "Edit Passport", save: "Save", miles: "Miles", badges: "Badges", cities: "Cities", base: "Base Camp", bio: "Manifesto", stamps: "Visa Stamps", trophy: "Trophy Case", acc_title: "Accessibility Mode"
    },
    es: {
        edit: "Editar Pasaporte", save: "Guardar", miles: "Millas", badges: "Medallas", cities: "Ciudades", base: "Cuartel General", bio: "Manifiesto", stamps: "Sellos de Visado", trophy: "Vitrinas de Trofeos", acc_title: "Modo de Accesibilidad"
    },
    de: {
        edit: "Pass bearbeiten", save: "Speichern", miles: "Meilen", badges: "Abzeichen", cities: "Städte", base: "Heimatbasis", bio: "Manifest", stamps: "Visumstempel", trophy: "Trophäenschrank", acc_title: "Barrierefreiheit"
    }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, language = 'es' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const t = UI_TEXTS[language] || UI_TEXTS['en'];
  const [editForm, setEditForm] = useState({
      name: user.name,
      username: user.username || '',
      bio: (user as any).bio || '',
      city: (user as any).city || '',
      language: (user as any).language || 'es',
      accessibility: (user as UserProfile).accessibility || 'standard'
  });

  const accOptions = [
      { id: 'standard', icon: 'fa-walking' },
      { id: 'wheelchair', icon: 'fa-wheelchair' },
      { id: 'low_walking', icon: 'fa-shoe-prints' }
  ];

  const handleSave = () => {
      if (onUpdateUser && isOwnProfile) {
          onUpdateUser({
              ...(user as UserProfile),
              name: editForm.name,
              username: editForm.username,
              bio: editForm.bio,
              city: editForm.city,
              language: editForm.language,
              accessibility: editForm.accessibility as any
          });
          setIsEditing(false);
      }
  };

  const badges = user.badges || [];
  const visitedCities = (user as any).visitedCities || [];
  const rank = (user as any).rank || 'Turista';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative z-10 transform transition-all border border-white/40 max-h-[90vh] overflow-y-auto no-scrollbar font-sans">
        <div className="h-32 bg-gradient-to-br from-slate-800 to-black relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/20 text-white rounded-full flex items-center justify-center backdrop-blur z-20"><i className="fas fa-times"></i></button>
          {isOwnProfile && !isEditing && (<button onClick={() => setIsEditing(true)} className="absolute top-4 left-4 px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold backdrop-blur z-20 border border-white/30"><i className="fas fa-edit mr-1"></i> {t.edit}</button>)}
          {isEditing && (<button onClick={handleSave} className="absolute top-4 left-4 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg z-20 transition-colors"><i className="fas fa-check mr-1"></i> {t.save}</button>)}
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4"><img src={user.avatar} className="w-24 h-24 rounded-full border-[5px] border-white shadow-xl object-cover bg-slate-200"/><span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">{rank}</span></div>
          <div className="mb-6">
            {isEditing ? (
                <div className="space-y-4">
                    <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-2xl text-lg font-bold outline-none focus:border-purple-500" placeholder="Nombre Completo"/>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.acc_title}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {accOptions.map(opt => (<button key={opt.id} onClick={() => setEditForm({...editForm, accessibility: opt.id as any})} className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1 ${editForm.accessibility === opt.id ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}><i className={`fas ${opt.icon}`}></i><span className="text-[8px] font-bold uppercase">{opt.id === 'low_walking' ? 'Fácil' : opt.id}</span></button>))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="w-full p-3 border border-slate-200 rounded-2xl text-sm text-purple-600 font-bold outline-none" placeholder="@usuario"/>
                        <select value={editForm.language} onChange={e => setEditForm({...editForm, language: e.target.value})} className="w-full p-3 border border-slate-200 rounded-2xl text-sm font-bold bg-slate-50">{LANGUAGES.map(l => (<option key={l.code} value={l.code}>{l.name}</option>))}</select>
                    </div>
                </div>
            ) : (<><div className="flex items-center gap-2 mb-1"><h2 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">{user.name}</h2><i className={`fas ${accOptions.find(o => o.id === (user as UserProfile).accessibility)?.icon || 'fa-walking'} text-slate-300 text-sm`}></i></div><p className="text-purple-600 font-bold text-sm">@{user.username || user.name.toLowerCase().replace(/\s/g, '')}</p></>)}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
             <div className="text-center"><span className="block text-xl font-heading font-bold text-slate-800">{user.miles.toLocaleString()}</span><span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{t.miles}</span></div>
             <div className="text-center border-l border-slate-200"><span className="block text-xl font-heading font-bold text-slate-800">{badges.length}</span><span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{t.badges}</span></div>
             <div className="text-center border-l border-slate-200"><span className="block text-xl font-heading font-bold text-slate-800">{visitedCities.length}</span><span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{t.cities}</span></div>
          </div>

          <div className="space-y-5 mb-6">
             <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shadow-sm border border-slate-100"><i className="fas fa-map-marker-alt"></i></div><div className="flex-1"><p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.base}</p>{isEditing ? (<input type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl text-sm" placeholder="Madrid, España"/>) : (<p className="font-bold text-slate-800 text-lg leading-tight">{user.city || 'Ciudadano del Mundo'}</p>)}</div></div>
             <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shadow-sm border border-slate-100"><i className="fas fa-quote-left"></i></div><div className="flex-1"><p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.bio}</p>{isEditing ? (<textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full p-2 border border-slate-200 rounded-xl text-sm" placeholder="Tu filosofía de viaje..." rows={2}/>) : (<p className="text-sm text-slate-600 leading-relaxed font-medium">"{user.bio || 'Listo para explorar.'}"</p>)}</div></div>
          </div>

          {badges.length > 0 && (<div><p className="text-[10px] font-bold text-slate-400 uppercase mb-3">{t.trophy}</p><div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">{badges.map((b: any, i: number) => (<div key={i} className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center text-yellow-600 shadow-sm border border-yellow-100 flex-shrink-0 text-lg relative group" title={b.name}><i className={`fas ${b.icon}`}></i></div>))}</div></div>)}
        </div>
      </div>
    </div>
  );
};
