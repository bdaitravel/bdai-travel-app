
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
    en: { passport: "Passport", surname: "Surname", givenNames: "Given Names", rank: "Rank", miles: "Total Miles", bio: "Bio", badges: "Badges", stamps: "Visa Stamps", edit: "Edit", save: "Save Passport", langLabel: "Language", username: "Username", email: "Email Address", expedition: "Date of Issue", passportNo: "Passport No.", socials: "Social Networks", nextBadge: "Next Milestone", albumTitle: "AI Travel Album", albumSub: "Generated from your latest adventures", community: "Community Info", off: "OFF", guides: "Excl. Guides", wallpapers: "Wallpapers", export: "Export Album for Socials", wall: "Explorer Wall", wallSub: "What other travelers say about your destinations" },
    es: { passport: "Pasaporte", surname: "Apellidos", givenNames: "Nombres", rank: "Rango", miles: "Millas Totales", bio: "Biografía", badges: "Insignias", stamps: "Sellos Visa", edit: "Editar", save: "Guardar", langLabel: "Idioma", username: "Usuario", email: "Correo Electrónico", expedition: "Fecha Expedición", passportNo: "Nº Pasaporte", socials: "Redes Sociales", nextBadge: "Siguiente Logro", albumTitle: "Álbum de Viaje IA", albumSub: "Generado de tus últimas aventuras", community: "Info Comunidad", off: "DTO", guides: "Guías Excl.", wallpapers: "Wallpapers", export: "Exportar Álbum para Redes", wall: "Muro del Explorador", wallSub: "Lo que dicen otros viajeros sobre tus destinos" },
};

const RANK_CONFIG: Record<TravelerRank, { min: number, color: string, discount: string, icon: string }> = {
    'Turist': { min: 0, color: 'from-slate-400 to-slate-600', discount: '0%', icon: 'fa-walking' },
    'Explorer': { min: 1000, color: 'from-green-500 to-emerald-700', discount: '5%', icon: 'fa-map-signs' },
    'Wanderer': { min: 5000, color: 'from-blue-500 to-indigo-700', discount: '10%', icon: 'fa-compass' },
    'Globe-Trotter': { min: 15000, color: 'from-purple-500 to-pink-700', discount: '20%', icon: 'fa-globe' },
    'Legend': { min: 40000, color: 'from-yellow-500 to-orange-700', discount: '40%', icon: 'fa-crown' }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, language = 'es' }) => {
  const profile = user as UserProfile;
  const t = UI_TEXT[language] || UI_TEXT['es'];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'passport' | 'albums' | 'community'>('passport');
  
  const currentRank = profile.rank || 'Turist';

  const [formData, setFormData] = useState({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      username: profile.username || '',
      email: profile.email || '',
      bio: profile.bio || '',
      avatar: profile.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      language: profile.language || 'es',
      socials: profile.socials || { instagram: '', tiktok: '', x: '' }
  });

  const handleSave = () => {
      if (onUpdateUser) {
          onUpdateUser({ ...profile, ...formData });
      }
      setIsEditing(false);
  };

  const nextRank = Object.entries(RANK_CONFIG).find(([_, cfg]) => cfg.min > (profile.miles || 0))?.[0] as TravelerRank | undefined;
  const nextRankMin = nextRank ? RANK_CONFIG[nextRank].min : (RANK_CONFIG[currentRank]?.min || 0);
  const prevRankMin = RANK_CONFIG[currentRank]?.min || 0;
  const progress = nextRank ? (((profile.miles || 0) - prevRankMin) / (nextRankMin - prevRankMin)) * 100 : 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#0b1c3d] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border border-white/10 flex flex-col max-h-[95vh] animate-slide-up">
        
        <div className="flex bg-white/5 border-b border-white/10 p-2">
            <TabBtn active={activeTab === 'passport'} onClick={() => setActiveTab('passport')} icon="fa-id-card" label="Passport" />
            <TabBtn active={activeTab === 'albums'} onClick={() => setActiveTab('albums')} icon="fa-book-open" label="Albums" />
            <TabBtn active={activeTab === 'community'} onClick={() => setActiveTab('community')} icon="fa-users" label="Community" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#e8e4d8] m-3 rounded-[1.5rem] shadow-inner text-slate-900 pb-10 relative">
            
            {activeTab === 'passport' && (
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <h2 className="text-blue-900 font-heading font-black text-[10px] uppercase tracking-[0.3em]">{t.passport}</h2>
                            <p className="font-mono text-[8px] opacity-40 uppercase tracking-widest">{profile.passportNumber || 'XP-8829-BDAI'}</p>
                        </div>
                        <div className="flex gap-2">
                            {isOwnProfile && <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="w-8 h-8 rounded-full bg-yellow-500 text-slate-900 flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className={`fas ${isEditing ? 'fa-save' : 'fa-pen-nib'} text-[10px]`}></i></button>}
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center"><i className="fas fa-times text-[10px]"></i></button>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-8">
                        <div className={`w-28 h-36 bg-white p-2 rounded shadow-2xl border border-slate-300 transform -rotate-1 relative overflow-hidden group`}>
                            <img src={formData.avatar} className="w-full h-full object-cover grayscale-[0.1]" alt="ID" />
                        </div>
                        <div className="flex-1 space-y-4 pt-1">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <InputLabel label={t.surname} value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} />
                                    <InputLabel label={t.givenNames} value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} />
                                    <InputLabel label={t.email} value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
                                </div>
                            ) : (
                                <>
                                    <DataBlock label={t.surname} value={profile.lastName} />
                                    <DataBlock label={t.givenNames} value={profile.firstName} />
                                    <DataBlock label={t.email} value={profile.email} color="text-slate-600" isSmall />
                                    <div className="pt-2">
                                        <span className={`px-2 py-1 rounded bg-gradient-to-r ${RANK_CONFIG[currentRank]?.color || 'from-slate-400 to-slate-600'} text-white text-[8px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 w-fit`}>
                                            <i className={`fas ${RANK_CONFIG[currentRank]?.icon || 'fa-user'}`}></i>
                                            {currentRank}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mb-8 p-4 bg-white/40 rounded-2xl border border-slate-900/5 shadow-sm">
                        <div className="flex justify-between items-end mb-2">
                            <div><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t.miles}</p><p className="text-xl font-black font-mono">{(profile.miles || 0).toLocaleString()}</p></div>
                            <div className="text-right"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">{t.nextBadge}</p><p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{nextRank || 'MAX LEVEL'}</p></div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                            <div className={`h-full bg-gradient-to-r ${RANK_CONFIG[currentRank]?.color || 'from-slate-400 to-slate-600'} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    {profile.badges && (profile.badges || []).length > 0 && (
                        <div className="mb-8">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.badges}</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(profile.badges || []).map(badge => (
                                    <div key={badge.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col items-center gap-1 shadow-sm transform hover:rotate-1 transition-all">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm shadow-inner"><i className={`fas ${badge.icon}`}></i></div>
                                        <p className="text-[7px] font-black uppercase text-center text-slate-800">{badge.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'albums' && (
                <div className="p-6 animate-fade-in">
                    <header className="mb-8">
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{t.albumTitle}</h3>
                    </header>
                    <div className="text-center py-12 opacity-30">
                        <i className="fas fa-camera text-4xl mb-4"></i>
                        <p className="text-xs font-bold uppercase tracking-widest">Sin fotos registradas</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${active ? 'text-yellow-500' : 'text-white/40'}`}>
        <i className={`fas ${icon} text-sm`}></i>
        <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

const DataBlock = ({ label, value, color = "text-slate-900", isSmall = false }: any) => (
    <div>
        <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{label}</p>
        <p className={`${isSmall ? 'text-[10px]' : 'text-sm'} font-black uppercase tracking-tight font-mono ${color}`}>{value || '---'}</p>
    </div>
);

const InputLabel = ({ label, value, onChange }: any) => (
    <div>
        <p className="text-[7px] font-black text-slate-400 uppercase">{label}</p>
        <div className="flex items-center gap-1 bg-white/70 border-b border-slate-300 p-1 rounded-t">
            <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-transparent text-xs font-black uppercase outline-none focus:text-blue-700"/>
        </div>
    </div>
);
