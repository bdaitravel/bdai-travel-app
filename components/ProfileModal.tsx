
import React, { useState, useRef } from 'react';
import { UserProfile, LeaderboardEntry, LANGUAGES, TravelerRank } from '../types';
import { FlagIcon } from '../App';

interface ProfileModalProps {
  user: UserProfile | LeaderboardEntry;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  language?: string;
}

const UI_TEXT: any = {
    en: { passport: "Passport", surname: "Surname", givenNames: "Given Names", username: "Username", city: "City", country: "Country", lang: "Language", edit: "Edit Profile", save: "Save", miles: "Total Miles", badges: "Achievements", change: "Upload Photo", rank: "Traveler Rank" },
    es: { passport: "Pasaporte", surname: "Apellidos", givenNames: "Nombres", username: "Usuario", city: "Ciudad", country: "País", lang: "Idioma", edit: "Editar Perfil", save: "Guardar", miles: "Millas Totales", badges: "Logros", change: "Subir Foto", rank: "Rango Viajero" },
    fr: { passport: "Passeport", surname: "Nom", givenNames: "Prénoms", username: "Pseudo", city: "Ville", country: "Pays", lang: "Langue", edit: "Modifier", save: "Sauver", miles: "Miles Totaux", badges: "Badges", change: "Charger Photo", rank: "Rang" },
    ca: { passport: "Passaport", surname: "Cognoms", givenNames: "Noms", username: "Usuari", city: "Ciutat", country: "País", lang: "Idioma", edit: "Editar Perfil", save: "Desar", miles: "Milles Totals", badges: "Mèrits", change: "Pujar Foto", rank: "Rang" },
    eu: { passport: "Pasaportea", surname: "Abizenak", givenNames: "Izenak", username: "Erabiltzailea", city: "Hiria", country: "Herrialdea", lang: "Hizkuntza", edit: "Editatu", save: "Gorde", miles: "Miliak Guztira", badges: "Domina", change: "Argazkia Igo", rank: "Maila" }
};

const RANK_CONFIG: Record<TravelerRank, { color: string, icon: string }> = {
    'Turist': { color: 'from-slate-400 to-slate-600', icon: 'fa-walking' },
    'Explorer': { color: 'from-green-500 to-emerald-700', icon: 'fa-map-signs' },
    'Wanderer': { color: 'from-blue-500 to-indigo-700', icon: 'fa-compass' },
    'Globe-Trotter': { color: 'from-purple-500 to-pink-700', icon: 'fa-globe' },
    'Legend': { color: 'from-yellow-500 to-orange-700', icon: 'fa-crown' }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, language = 'es' }) => {
  const profile = user as UserProfile;
  const t = UI_TEXT[language] || UI_TEXT['es'];
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      username: profile.username || '',
      city: profile.city || '',
      country: profile.country || '',
      avatar: profile.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      language: profile.language || 'es'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFilePicker = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleSave = () => {
      if (onUpdateUser) {
          onUpdateUser({ ...profile, ...formData, name: `${formData.firstName} ${formData.lastName}`.trim() });
      }
      setIsEditing(false);
  };

  const currentRank = profile.rank || 'Turist';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#0b1c3d] w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl relative z-10 border border-white/10 flex flex-col max-h-[90vh] animate-slide-up">
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        <div className="flex justify-between items-center p-6 bg-white/5 border-b border-white/5">
            <h2 className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em]">{t.passport}</h2>
            <div className="flex gap-2">
                {isOwnProfile && (
                    <button 
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                        className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${isEditing ? 'bg-green-600 text-white' : 'bg-yellow-500 text-slate-950'}`}
                    >
                        {isEditing ? t.save : t.edit}
                    </button>
                )}
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#e8e4d8] m-4 rounded-[2rem] shadow-inner text-slate-900 pb-12 relative">
            <div className="p-8">
                <div className="flex gap-6 mb-10">
                    <div className="flex flex-col items-center gap-3">
                        <div 
                            onClick={triggerFilePicker}
                            className={`w-28 h-36 bg-white p-2 rounded shadow-2xl border border-slate-300 transform -rotate-1 relative overflow-hidden ${isEditing ? 'cursor-pointer ring-4 ring-yellow-500/30 group' : ''}`}
                        >
                            <img src={formData.avatar} className="w-full h-full object-cover grayscale-[0.2]" alt="ID" />
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity text-center p-2">
                                    <i className="fas fa-camera text-xl mb-1"></i>
                                    <span className="text-[8px] font-black uppercase leading-tight">{t.change}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-4 pt-2">
                        {isEditing ? (
                            <>
                                <InputLabel label={t.surname} value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
                                <InputLabel label={t.givenNames} value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
                                <InputLabel label={t.username} value={formData.username} onChange={v => setFormData({...formData, username: v})} />
                            </>
                        ) : (
                            <>
                                <DataBlock label={t.surname} value={profile.lastName || '---'} />
                                <DataBlock label={t.givenNames} value={profile.firstName || '---'} />
                                <DataBlock label={t.username} value={`@${profile.username || 'explorador'}`} color="text-blue-700" />
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                    {isEditing ? (
                        <>
                            <InputLabel label={t.city} value={formData.city} onChange={v => setFormData({...formData, city: v})} />
                            <InputLabel label={t.country} value={formData.country} onChange={v => setFormData({...formData, country: v})} />
                            <div className="col-span-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">{t.lang}</label>
                                <select 
                                    value={formData.language} 
                                    onChange={e => setFormData({...formData, language: e.target.value})}
                                    className="w-full bg-white/70 border-b border-slate-300 p-2 text-xs font-black uppercase outline-none"
                                >
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <DataBlock label={t.city} value={profile.city || '---'} />
                            <DataBlock label={t.country} value={profile.country || '---'} />
                            <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-1">{t.lang}</p>
                                <div className="flex items-center gap-2">
                                    <FlagIcon code={profile.language || 'es'} className="w-5 h-3.5 shadow-sm rounded-sm" />
                                    <span className="text-[10px] font-black uppercase text-slate-600">{LANGUAGES.find(l => l.code === (profile.language || 'es'))?.name}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white/50 p-6 rounded-3xl border border-slate-900/5 mb-10 shadow-sm">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t.miles}</p>
                            <p className="text-3xl font-black font-mono tracking-tighter">{(profile.miles || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${RANK_CONFIG[currentRank].color} text-white text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2`}>
                                <i className={`fas ${RANK_CONFIG[currentRank].icon}`}></i> {currentRank}
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.badges}</p>
                    <div className="flex flex-wrap gap-3">
                        {(profile.badges || []).length > 0 ? (profile.badges || []).map((badge: any) => (
                            <div key={badge.id} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-200">
                                <i className={`fas ${badge.icon || 'fa-medal'} text-xl`}></i>
                            </div>
                        )) : (
                            <div className="flex gap-3 opacity-20 grayscale">
                                {[1,2,3].map(i => <div key={i} className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-400 flex items-center justify-center text-slate-400"><i className="fas fa-lock text-xs"></i></div>)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const DataBlock = ({ label, value, color = "text-slate-900" }: any) => (
    <div className="border-b border-slate-300 pb-1">
        <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">{label}</p>
        <p className={`text-[12px] font-black uppercase tracking-tight font-mono truncate ${color}`}>{value}</p>
    </div>
);

const InputLabel = ({ label, value, onChange }: any) => (
    <div className="group">
        <p className="text-[7px] font-black text-slate-400 uppercase mb-1">{label}</p>
        <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            className="w-full bg-white/70 border-b-2 border-slate-300 p-1 text-[11px] font-black uppercase outline-none focus:border-yellow-500 focus:text-blue-700 transition-all"
        />
    </div>
);
