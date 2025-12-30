
import React, { useState, useRef } from 'react';
import { UserProfile, LeaderboardEntry, LANGUAGES } from '../types';
import { FlagIcon } from '../App';

interface ProfileModalProps {
  user: UserProfile | LeaderboardEntry;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onSelectOwnKey?: () => void;
  language?: string;
}

const AVATARS = [
    "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aria",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo"
];

const UI_TEXT: any = {
    en: { passport: "Global Passport", surname: "Surname", givenNames: "Given Names", rank: "Rank", miles: "Total Miles", bio: "Bio", badges: "Badges", stamps: "Visa Stamps", edit: "Edit", save: "Save", langLabel: "Native Language", username: "Username", email: "Email", expedition: "Expedition Date", passportNo: "Passport No.", curios: "Explorer Motto", wall: "Social Wall", logout: "Sign Out", changeAvatar: "Pick Photo", city: "City of Origin", country: "Country", age: "Age", apiKey: "Satellite Connection", apiDesc: "Use your own key for unlimited AI access." },
    es: { passport: "Pasaporte Global", surname: "Apellidos", givenNames: "Nombres", rank: "Rango", miles: "Millas Totales", bio: "Biografía", badges: "Insignias", stamps: "Sellos Visa", edit: "Editar", save: "Guardar", langLabel: "Idioma Nativo", username: "Usuario", email: "Correo", expedition: "Fecha Expedición", passportNo: "Nº Pasaporte", curios: "Lema del Explorador", wall: "Muro Social", logout: "Cerrar Sesión", changeAvatar: "Elegir Foto", city: "Ciudad de Origen", country: "País", age: "Edad", apiKey: "Conexión Satelital", apiDesc: "Usa tu propia clave para acceso IA ilimitado." },
    ca: { passport: "Passaport Global", surname: "Cognoms", givenNames: "Noms", rank: "Rang", miles: "Milles Totals", bio: "Biografia", badges: "Insignies", stamps: "Segells Visa", edit: "Editar", save: "Desar", langLabel: "Idioma Natiu", username: "Usuari", email: "Correu", expedition: "Data Expedició", passportNo: "Núm. Passaport", curios: "Lema de l'Explorador", wall: "Mur Social", logout: "Tancar Sessió", changeAvatar: "Tria Foto", city: "Ciutat d'Origen", country: "País", age: "Edat", apiKey: "Connexió Satel·lital", apiDesc: "Usa la teva clau per a IA il·limitada." },
    eu: { passport: "Pasaporte Globala", surname: "Abizenak", givenNames: "Izenak", rank: "Maila", miles: "Miliak Guztira", bio: "Biografia", badges: "Intsigniak", stamps: "Visa zigiluak", edit: "Editatu", save: "Gorde", langLabel: "Ama Hizkuntza", username: "Erabiltzailea", email: "Helbidea", expedition: "Jaulkipen Data", passportNo: "Pasaporte Zbk.", curios: "Esploratzailearen Lemak", wall: "Muru Soziala", logout: "Saioa Itxi", changeAvatar: "Argazkia Aukeratu", city: "Jatorrizko Hiria", country: "Herrialdea", age: "Adina", apiKey: "Satelite Konexioa", apiDesc: "Erabili zure gakoa mugarik gabeko IArako." },
    fr: { passport: "Passeport Global", surname: "Nom", givenNames: "Prénoms", rank: "Rang", miles: "Miles Totaux", bio: "Bio", badges: "Badges", stamps: "Tampons Visa", edit: "Modifier", save: "Enregistrer", langLabel: "Langue Maternelle", username: "Utilisateur", email: "E-mail", expedition: "Date d'émission", passportNo: "N° Passeport", curios: "Devise de l'Explorateur", wall: "Mur Social", logout: "Déconnexion", changeAvatar: "Choisir Photo", city: "Ville d'Origine", country: "Pays", age: "Âge", apiKey: "Connexion Satellite", apiDesc: "Utilisez votre clé pour un accès IA illimité." }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, onSelectOwnKey, language = 'es' }) => {
  const profile = user as UserProfile;
  const t = UI_TEXT[language] || UI_TEXT['es'];
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'passport' | 'wall'>('passport');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      username: profile.username || '',
      email: profile.email || '',
      avatar: profile.avatar || AVATARS[0],
      language: profile.language || 'es',
      profileCuriosity: profile.profileCuriosity || "Escribe aquí tu frase inspiradora de viaje...",
      city: profile.city || '',
      country: profile.country || '',
      age: profile.age || 25
  });

  const handleSave = () => {
      if (onUpdateUser) onUpdateUser({ ...profile, ...formData, name: `${formData.firstName} ${formData.lastName}` });
      setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({...formData, avatar: reader.result as string});
      reader.readAsDataURL(file);
    }
  };

  const handleLanguageChange = (code: string) => {
    setFormData({...formData, language: code});
    if (onUpdateUser) onUpdateUser({ ...profile, ...formData, language: code });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={onClose}></div>
      <div className="bg-[#1e293b] w-full max-w-sm rounded-[2.8rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 border border-white/10 flex flex-col max-h-[92vh] animate-slide-up text-white font-sans">
        
        <div className="flex bg-white/5 border-b border-white/5 p-2">
            <button onClick={() => setActiveTab('passport')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'passport' ? 'text-yellow-500' : 'text-white/30'}`}>PASSPORT</button>
            <button onClick={() => setActiveTab('wall')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'wall' ? 'text-yellow-500' : 'text-white/30'}`}>{t.wall}</button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#fcf9f2] m-4 rounded-[2rem] shadow-inner text-slate-900 pb-12">
            {activeTab === 'passport' ? (
                <div className="p-7">
                    <div className="flex justify-between items-start mb-8">
                        <div className="space-y-1">
                            <h2 className="text-red-900 font-black text-[11px] uppercase tracking-[0.3em]">{t.passport}</h2>
                            <p className="font-mono text-[10px] opacity-40 uppercase tracking-widest">{profile.passportNumber || 'WORLD-992-BDAI'}</p>
                        </div>
                        <div className="flex gap-2">
                            {isOwnProfile && <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="w-10 h-10 rounded-full bg-yellow-500 text-slate-900 flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className={`fas ${isEditing ? 'fa-save' : 'fa-pen-nib'} text-xs`}></i></button>}
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
                        </div>
                    </div>

                    <div className="flex gap-5 mb-10">
                        <div className="relative group">
                            <div className="w-32 h-40 bg-white p-2 rounded-lg shadow-2xl border border-slate-300 transform -rotate-1 relative overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                                <img src={formData.avatar} className="w-full h-full object-cover grayscale-[0.2]" alt="ID" />
                                <div className="absolute inset-0 bg-red-900/5 pointer-events-none border-4 border-slate-200/50"></div>
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[8px] font-black uppercase text-center p-2 opacity-100 transition-opacity">
                                        <i className="fas fa-camera text-xl mb-1 block"></i><br/>{t.changeAvatar}
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        </div>

                        <div className="flex-1 space-y-4 pt-1">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <InputLabel label={t.surname} value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
                                    <InputLabel label={t.givenNames} value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
                                    <InputLabel label={t.username} value={formData.username} onChange={v => setFormData({...formData, username: v})} prefix="@" />
                                </div>
                            ) : (
                                <>
                                    <DataBlock label={t.surname} value={profile.lastName || 'EXPLORER'} />
                                    <DataBlock label={t.givenNames} value={profile.firstName || 'BDAI'} />
                                    <DataBlock label={t.username} value={`@${profile.username || 'explorador'}`} color="text-red-800" />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-10">
                         {isEditing ? (
                             <>
                                <InputLabel label={t.city} value={formData.city} onChange={v => setFormData({...formData, city: v})} />
                                <InputLabel label={t.country} value={formData.country} onChange={v => setFormData({...formData, country: v})} />
                                <InputLabel label={t.age} value={formData.age.toString()} onChange={v => setFormData({...formData, age: parseInt(v) || 0})} />
                             </>
                         ) : (
                             <>
                                <DataBlock label={t.city} value={profile.city || 'Desconocida'} />
                                <DataBlock label={t.country} value={profile.country || 'Planeta Tierra'} />
                                <DataBlock label={t.age} value={profile.age?.toString() || '25'} />
                             </>
                         )}
                         <DataBlock label={t.rank} value={profile.rank || 'Turist'} color="text-red-900" />
                    </div>

                    <div className="mb-10 p-5 bg-white/60 rounded-3xl border border-black/5 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.langLabel}</p>
                        <div className="flex flex-wrap gap-2">
                            {LANGUAGES.map(lang => (
                                <button key={lang.code} onClick={() => handleLanguageChange(lang.code)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${formData.language === lang.code ? 'border-red-900 bg-red-900/10' : 'border-transparent bg-white/50'}`}>
                                    <FlagIcon code={lang.code} className="w-5" />
                                    <span className="text-[10px] font-black uppercase">{lang.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-10 border-l-4 border-red-900 pl-5 py-4 bg-red-900/5 rounded-r-2xl pr-5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.curios}</p>
                        {isEditing ? (
                            <textarea 
                                value={formData.profileCuriosity} 
                                onChange={e => setFormData({...formData, profileCuriosity: e.target.value})}
                                className="w-full bg-white/50 rounded-xl p-3 text-xs font-serif italic border border-slate-300 outline-none focus:border-red-900 min-h-[80px]"
                                placeholder="Escribe tu frase aquí..."
                            />
                        ) : (
                            <p className="text-sm font-bold font-serif leading-relaxed italic text-slate-700">"{profile.profileCuriosity || formData.profileCuriosity}"</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-900 p-6 rounded-3xl border border-white/10 shadow-2xl">
                        <DataBlock label={t.miles} value={profile.miles.toLocaleString()} color="text-yellow-500" />
                        <DataBlock label={t.expedition} value={profile.joinDate || new Date().toLocaleDateString()} color="text-white" />
                    </div>

                    {isOwnProfile && onSelectOwnKey && (
                        <div className="mb-10 space-y-2">
                            <button onClick={onSelectOwnKey} className="w-full py-4 border-2 border-slate-200 bg-white text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[9px] tracking-widest shadow-sm hover:bg-slate-50 transition-colors">
                                <i className="fas fa-satellite text-purple-600"></i> {t.apiKey}
                            </button>
                            <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest px-4">{t.apiDesc}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.badges}</p>
                        <div className="flex flex-wrap gap-2">
                            {profile.badges && profile.badges.length > 0 ? (
                                profile.badges.map(badge => (
                                    <div key={badge.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
                                        <i className={`fas ${badge.icon} text-red-800 text-xs`}></i>
                                        <span className="text-[8px] font-black uppercase text-slate-800">{badge.name}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] font-bold text-slate-300 uppercase italic">Visa stamps pending...</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center py-24">
                    <i className="fas fa-tower-broadcast text-5xl text-slate-300 mb-6 animate-pulse"></i>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t.wall}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Coming soon: Connect with other explorers in this city.</p>
                </div>
            )}
            
            <div className="mt-8 px-7">
                <button onClick={onClose} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all">
                    {t.logout}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const DataBlock = ({ label, value, color = "text-slate-900" }: any) => (
    <div>
        <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">{label}</p>
        <p className={`text-[12px] font-black uppercase tracking-tight font-mono ${color}`}>{value || '---'}</p>
    </div>
);

const InputLabel = ({ label, value, onChange, prefix = "" }: any) => (
    <div>
        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-1 border-b border-slate-300 pb-1">
            {prefix && <span className="text-[12px] font-black text-slate-400">{prefix}</span>}
            <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-transparent text-[12px] font-black uppercase outline-none focus:text-red-900" />
        </div>
    </div>
);
