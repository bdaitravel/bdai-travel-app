
import React, { useState, useEffect } from 'react';
import { UserProfile, TravelerRank, TravelerType } from '../types';

const RANK_COLORS: Record<TravelerRank, string> = {
    'Turista': 'bg-slate-300', 'Explorador': 'bg-emerald-500', 'Wanderer': 'bg-blue-500',
    'Globe-Trotter': 'bg-purple-600', 'Leyenda': 'bg-amber-500'
};

const UI_TEXT: any = {
    en: { title: "Digital Passport", first: "First Name", last: "Last Name", type: "Traveler Type", save: "Save Changes", edit: "Edit Profile", skills: "Travel Skills", cult: "Culture", gastro: "Gastro", photo: "Photo", miles: "bdai Miles" },
    es: { title: "Pasaporte Digital", first: "Nombre", last: "Apellidos", type: "Perfil", save: "Guardar", edit: "Editar Perfil", skills: "Habilidades", cult: "Cultura", gastro: "Gastro", photo: "Foto", miles: "Millas bdai" },
    ca: { title: "Passaport Digital", first: "Nom", last: "Cognoms", type: "Perfil", save: "Desar", edit: "Editar Perfil", skills: "Habilitats", cult: "Cultura", gastro: "Gastro", photo: "Foto", miles: "Milles bdai" },
    fr: { title: "Passeport Digital", first: "Prénom", last: "Nom", type: "Profil", save: "Enregistrer", edit: "Modifier le profil", skills: "Compétences", cult: "Culture", gastro: "Gastro", photo: "Photo", miles: "Miles bdai" },
    eu: { title: "Pasaporte Digitala", first: "Izena", last: "Abizena", type: "Profila", save: "Gorde", edit: "Profila Editatu", skills: "Gaitasunak", cult: "Kultura", gastro: "Gastro", photo: "Argazkia", miles: "bdai Miliak" }
};

const TRAVELER_TYPES: TravelerType[] = ['Backpacker', 'Luxury', 'Cultural', 'Foodie', 'Digital Nomad', 'Party', 'Business'];

export const ProfileModal: React.FC<{ user: UserProfile; onUpdate: (u: UserProfile) => void; onClose: () => void }> = ({ user, onUpdate, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  
  // Sincronizar si el usuario cambia externamente
  useEffect(() => {
    setFormData({ ...user });
  }, [user]);

  const t = UI_TEXT[user.language] || UI_TEXT['en'];

  const handleSave = () => {
      onUpdate({ ...formData });
      setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all" onClick={onClose}></div>
      <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.2)] relative z-10 flex flex-col border border-white/50 animate-slide-up h-[80vh]">
        
        <div className="bg-slate-900 text-white p-8 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-4">
                <i className="fas fa-passport text-purple-500 text-xl"></i>
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">{t.title}</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 transition-colors"><i className="fas fa-times text-xs opacity-60"></i></button>
        </div>

        <div className="p-10 flex-1 overflow-y-auto no-scrollbar bg-slate-50/20">
            <div className="flex flex-col items-center mb-10">
                <div className="relative mb-6">
                    <div className="w-32 h-44 bg-white p-3 border border-slate-200 shadow-2xl rounded-lg overflow-hidden transform hover:-rotate-2 transition-transform duration-500">
                        <img src={user.avatar} className="w-full h-full object-cover grayscale brightness-90 contrast-125" alt="ID" />
                    </div>
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${RANK_COLORS[user.rank]} text-white text-[8px] font-black px-4 py-2 rounded-full shadow-2xl uppercase tracking-[0.2em] whitespace-nowrap`}>
                        {user.rank}
                    </div>
                </div>
                
                <div className="w-full space-y-6 text-center">
                    {!isEditing ? (
                        <>
                            <div>
                                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">{t.first} & {t.last}</p>
                                <p className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{user.firstName} {user.lastName}</p>
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-2 bg-purple-50 inline-block px-3 py-1 rounded-full">{user.travelerType}</p>
                            </div>
                            <button onClick={() => setIsEditing(true)} className="w-full py-4 bg-white border border-slate-100 rounded-2xl text-[9px] font-black text-slate-900 uppercase tracking-[0.3em] shadow-sm hover:shadow-md transition-all active:scale-95">
                                {t.edit}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4 animate-fade-in text-left">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase ml-2">{t.first}</label>
                                <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full text-xs font-bold p-4 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 ring-purple-600/20" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase ml-2">{t.last}</label>
                                <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full text-xs font-bold p-4 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 ring-purple-600/20" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase ml-2">{t.type}</label>
                                <select value={formData.travelerType} onChange={e => setFormData({...formData, travelerType: e.target.value as TravelerType})} className="w-full text-xs font-bold p-4 bg-white border border-slate-100 rounded-xl outline-none appearance-none">
                                    {TRAVELER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <button onClick={handleSave} className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl mt-4 active:scale-95 transition-all">
                                {t.save}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-950 text-white p-8 rounded-[2rem] text-center mb-10 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-600/20 transition-all duration-700"></div>
                <p className="text-[9px] font-black uppercase mb-2 opacity-40 tracking-[0.5em]">{t.miles}</p>
                <p className="text-4xl font-black tracking-tighter text-purple-400">{user.miles.toLocaleString()}</p>
            </div>

            <div className="space-y-8">
                <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-100"></div>{t.skills}<div className="h-px flex-1 bg-slate-100"></div>
                </h4>
                <div className="space-y-6 px-2">
                    <Skill label={t.cult} val={user.culturePoints} max={10000} color="bg-amber-400" />
                    <Skill label={t.gastro} val={user.foodPoints} max={10000} color="bg-orange-400" />
                    <Skill label={t.photo} val={user.photoPoints} max={10000} color="bg-pink-400" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const Skill = ({ label, val, max, color }: any) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-widest">
            <span>{label}</span>
            <span className="text-slate-900">{val.toLocaleString()} pts</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className={`h-full ${color} transition-all duration-1000 ease-out shadow-sm`} style={{ width: `${Math.min((val/max)*100, 100)}%` }}></div>
        </div>
    </div>
);
