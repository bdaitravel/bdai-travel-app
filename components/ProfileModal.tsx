
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
    en: {
        passport: "Passport", surname: "Surname", givenNames: "Given Names",
        rank: "Rank", miles: "Total Miles", bio: "Bio",
        socials: "Digital Presence", badges: "Badge Collection", stamps: "Visa Stamps",
        shareBadge: "Share", issueDate: "Date of Issue", edit: "Edit Profile",
        save: "Save Passport", sharedBadge: "I just earned the badge!",
        langLabel: "Language / Idioma", changePhoto: "Change Photo",
        privacy: "Profile Visibility", public: "Public (Ranking)", private: "Private (Hidden)",
        copied: "Copied to clipboard!"
    },
    es: {
        passport: "Pasaporte", surname: "Apellidos", givenNames: "Nombres",
        rank: "Rango", miles: "Millas Totales", bio: "Biografía",
        socials: "Presencia Digital", badges: "Colección de Insignias", stamps: "Sellos de Visado",
        shareBadge: "Compartir", issueDate: "Fecha de Expedición", edit: "Editar Perfil",
        save: "Guardar Pasaporte", sharedBadge: "¡Acabo de ganar la insignia!",
        langLabel: "Idioma / Language", changePhoto: "Cambiar Foto",
        privacy: "Visibilidad del Perfil", public: "Público (En Ranking)", private: "Privado (Oculto)",
        copied: "¡Copiado al portapapeles!"
    }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, language = 'es' }) => {
  const profile = user as UserProfile;
  const t = UI_TEXT[language] || UI_TEXT['en'];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      avatar: profile.avatar,
      language: profile.language,
      isPublic: profile.isPublic !== undefined ? profile.isPublic : true,
      instagram: profile.socials?.instagram || '',
      tiktok: profile.socials?.tiktok || '',
      x: profile.socials?.x || '',
      linkedin: profile.socials?.linkedin || '',
      facebook: profile.socials?.facebook || ''
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

  const handleShareBadge = (badgeName: string) => {
    const text = `${t.sharedBadge} ${badgeName} en bdai! 🌍🏅`;
    if (navigator.share) {
        navigator.share({ title: 'bdai Badge', text }).catch(() => {
            // Fallback manually if share is cancelled or fails
            navigator.clipboard.writeText(text);
        });
    } else {
        navigator.clipboard.writeText(text);
        alert(t.copied);
    }
  };

  const handleSave = () => {
      if (onUpdateUser) {
          onUpdateUser({
              ...profile,
              firstName: formData.firstName,
              lastName: formData.lastName,
              bio: formData.bio,
              avatar: formData.avatar,
              language: formData.language,
              isPublic: formData.isPublic,
              socials: {
                  ...profile.socials,
                  instagram: formData.instagram,
                  tiktok: formData.tiktok,
                  x: formData.x,
                  linkedin: formData.linkedin,
                  facebook: formData.facebook
              }
          });
      }
      setIsEditing(false);
  };

  const discountPercent = Math.min(25, Math.floor(profile.miles / 500) * 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-[#0b1c3d] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] relative z-10 border border-white/10 flex flex-col max-h-[92vh] animate-slide-up">
        
        {/* Passport Header */}
        <div className="p-8 border-b border-white/10 relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <i className="fas fa-globe-americas text-[12rem] text-white transform rotate-45"></i>
            </div>
            <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                    <h2 className="text-yellow-500 font-heading font-black text-xs uppercase tracking-[0.5em]">{t.passport}</h2>
                    <p className="text-white/40 font-mono text-[8px] uppercase tracking-widest leading-none">Global Citizen • BDAI Explorer Network</p>
                </div>
                <div className="flex gap-2">
                    {isOwnProfile && (
                        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="w-10 h-10 rounded-full bg-yellow-500 text-slate-900 flex items-center justify-center shadow-lg border border-yellow-400 active:scale-90 transition-transform z-20">
                            <i className={`fas ${isEditing ? 'fa-save' : 'fa-pen'} text-xs`}></i>
                        </button>
                    )}
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
                        <i className="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        </div>

        {/* Identity Page */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#e8e4d8] m-3 rounded-[1.5rem] shadow-inner text-slate-900 pb-10">
            <div className="p-6">
                <div className="flex gap-4 mb-8">
                    {/* ID Photo */}
                    <div 
                        onClick={() => isEditing && fileInputRef.current?.click()}
                        className={`w-28 h-36 bg-white p-2 rounded shadow-xl border border-slate-300 transform -rotate-1 relative overflow-hidden transition-all ${isEditing ? 'cursor-pointer ring-2 ring-yellow-500/50 hover:scale-[1.02]' : ''}`}
                    >
                        <img src={isEditing ? formData.avatar : profile.avatar} className="w-full h-full object-cover grayscale-[0.2]" alt="ID" />
                        <div className="absolute inset-0 border-4 border-slate-900/5 pointer-events-none"></div>
                        
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center p-2 opacity-0 hover:opacity-100 transition-opacity">
                                <i className="fas fa-camera text-xl mb-1"></i>
                                <span className="text-[8px] font-black uppercase leading-none">{t.changePhoto}</span>
                            </div>
                        )}

                        <div className={`absolute bottom-0 w-full h-8 ${isEditing && !formData.isPublic ? 'bg-red-900/10' : 'bg-blue-900/10'} backdrop-blur-sm flex items-center justify-center`}>
                            <span className="text-[8px] font-black text-slate-800/60 uppercase tracking-tighter">
                                {formData.isPublic ? 'Verified Traveler' : 'Confidential'}
                            </span>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="flex-1 space-y-4 pt-2">
                        {isEditing ? (
                            <>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[7px] font-black text-slate-400 uppercase">{t.surname}</p>
                                        <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/70 border-b-2 border-slate-300 text-xs font-black uppercase p-1 rounded-t-md outline-none focus:border-yellow-500 transition-colors"/>
                                    </div>
                                    <div>
                                        <p className="text-[7px] font-black text-slate-400 uppercase">{t.givenNames}</p>
                                        <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/70 border-b-2 border-slate-300 text-xs font-black uppercase p-1 rounded-t-md outline-none focus:border-yellow-500 transition-colors"/>
                                    </div>
                                    <div>
                                        <p className="text-[7px] font-black text-slate-400 uppercase">{t.langLabel}</p>
                                        <select 
                                            value={formData.language} 
                                            onChange={e => setFormData({...formData, language: e.target.value})}
                                            className="w-full bg-white/70 border-b-2 border-slate-300 text-[10px] font-black uppercase p-1 rounded-t-md outline-none focus:border-yellow-500 transition-colors"
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{t.surname}</p>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight font-mono">{profile.lastName || 'TRAVELER'}</p>
                                </div>
                                <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{t.givenNames}</p>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight font-mono">{profile.firstName || 'ALEX'}</p>
                                </div>
                                <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{t.langLabel}</p>
                                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-tight">
                                        {LANGUAGES.find(l => l.code === profile.language)?.name}
                                    </p>
                                </div>
                            </>
                        )}
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2">
                            <div>
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{t.issueDate}</p>
                                <p className="text-[9px] font-bold text-slate-800 uppercase leading-none">{profile.joinDate}</p>
                            </div>
                            <div>
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Passport No.</p>
                                <p className="text-[9px] font-mono font-bold text-red-600 uppercase">{profile.passportNumber}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-8">
                    {[
                        { icon: 'fa-route', val: profile.miles, label: 'Miles', color: 'text-slate-400' },
                        { icon: 'fa-landmark', val: profile.culturePoints, label: 'Culture', color: 'text-purple-500' },
                        { icon: 'fa-utensils', val: profile.foodPoints, label: 'Food', color: 'text-orange-500' },
                        { icon: 'fa-star', val: discountPercent + '%', label: 'Disc.', color: 'text-green-600' }
                    ].map(item => (
                        <div key={item.label} className="bg-white/60 p-2 rounded-xl border border-slate-200 text-center shadow-sm">
                            <i className={`fas ${item.icon} ${item.color} text-[10px] mb-1`}></i>
                            <p className="text-[9px] font-black text-slate-800 leading-none">{item.val}</p>
                            <p className="text-[6px] text-slate-400 uppercase mt-0.5">{item.label}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* Privacy Section */}
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.privacy}</p>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setFormData({...formData, isPublic: true})}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.isPublic ? 'bg-green-600 text-white border-green-700 shadow-md' : 'bg-white text-slate-400 border-slate-200 opacity-60'}`}
                                >
                                    {t.public}
                                </button>
                                <button 
                                    onClick={() => setFormData({...formData, isPublic: false})}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${!formData.isPublic ? 'bg-slate-900 text-white border-slate-950 shadow-md' : 'bg-white text-slate-400 border-slate-200 opacity-60'}`}
                                >
                                    {t.private}
                                </button>
                            </div>
                        ) : (
                            <div className={`px-4 py-2 rounded-xl border flex items-center justify-between ${profile.isPublic ? 'bg-green-50 border-green-100' : 'bg-slate-100 border-slate-200'}`}>
                                <span className={`text-[10px] font-black uppercase ${profile.isPublic ? 'text-green-700' : 'text-slate-500'}`}>
                                    {profile.isPublic ? t.public : t.private}
                                </span>
                                <i className={`fas ${profile.isPublic ? 'fa-globe-americas text-green-500' : 'fa-user-secret text-slate-400'}`}></i>
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.bio}</p>
                        {isEditing ? (
                            <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-white/70 border border-slate-300 text-xs p-3 rounded-xl italic h-24 outline-none focus:ring-2 focus:ring-yellow-500/30 transition-all"/>
                        ) : (
                            <div className="bg-white/40 p-4 rounded-2xl border border-slate-900/5 italic text-sm text-slate-600 leading-relaxed font-medium">
                                "{profile.bio}"
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.socials}</p>
                        {isEditing ? (
                            <div className="grid grid-cols-1 gap-3">
                                <div className="relative">
                                    <i className="fab fa-instagram absolute left-3 top-2.5 text-pink-500"></i>
                                    <input placeholder="Instagram handle" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="w-full bg-white/70 border border-slate-300 text-xs p-2 pl-10 rounded-xl outline-none focus:border-pink-300"/>
                                </div>
                                <div className="relative">
                                    <i className="fab fa-tiktok absolute left-3 top-2.5 text-slate-900"></i>
                                    <input placeholder="TikTok handle" value={formData.tiktok} onChange={e => setFormData({...formData, tiktok: e.target.value})} className="w-full bg-white/70 border border-slate-300 text-xs p-2 pl-10 rounded-xl outline-none focus:border-slate-400"/>
                                </div>
                                <div className="relative">
                                    <i className="fa-brands fa-x-twitter absolute left-3 top-2.5 text-slate-900"></i>
                                    <input placeholder="X (Twitter) handle" value={formData.x} onChange={e => setFormData({...formData, x: e.target.value})} className="w-full bg-white/70 border border-slate-300 text-xs p-2 pl-10 rounded-xl outline-none focus:border-slate-900"/>
                                </div>
                                <div className="relative">
                                    <i className="fab fa-linkedin absolute left-3 top-2.5 text-blue-700"></i>
                                    <input placeholder="LinkedIn profile" value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} className="w-full bg-white/70 border border-slate-300 text-xs p-2 pl-10 rounded-xl outline-none focus:border-blue-400"/>
                                </div>
                                <div className="relative">
                                    <i className="fab fa-facebook absolute left-3 top-2.5 text-blue-600"></i>
                                    <input placeholder="Facebook profile" value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} className="w-full bg-white/70 border border-slate-300 text-xs p-2 pl-10 rounded-xl outline-none focus:border-blue-300"/>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {profile.socials?.instagram && (
                                    <div className="bg-gradient-to-tr from-yellow-100 to-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-[10px] font-bold border border-pink-200 flex items-center gap-1.5 shadow-sm">
                                        <i className="fab fa-instagram"></i> {profile.socials.instagram}
                                    </div>
                                )}
                                {profile.socials?.tiktok && (
                                    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                                        <i className="fab fa-tiktok"></i> {profile.socials.tiktok}
                                    </div>
                                )}
                                {profile.socials?.x && (
                                    <div className="bg-white text-slate-900 border border-slate-300 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                                        <i className="fa-brands fa-x-twitter"></i> {profile.socials.x}
                                    </div>
                                )}
                                {profile.socials?.linkedin && (
                                    <div className="bg-blue-700 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                                        <i className="fab fa-linkedin"></i> {profile.socials.linkedin}
                                    </div>
                                )}
                                {profile.socials?.facebook && (
                                    <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                                        <i className="fab fa-facebook"></i> {profile.socials.facebook}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.badges}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {profile.badges.map(badge => (
                                <div key={badge.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col items-center gap-2 group transition-all hover:border-purple-300 shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 text-lg shadow-inner">
                                        <i className={`fas ${badge.icon}`}></i>
                                    </div>
                                    <p className="text-[8px] font-black uppercase text-center text-slate-800 leading-none">{badge.name}</p>
                                    <button 
                                        onClick={() => handleShareBadge(badge.name)} 
                                        className="w-full mt-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[7px] font-black text-purple-600 uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-purple-600 hover:text-white hover:border-purple-600"
                                    >
                                        <i className="fas fa-share-alt"></i> {t.shareBadge}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.stamps}</p>
                        <div className="flex flex-wrap gap-4">
                            {profile.visitedCities.map(city => (
                                <div key={city} className="w-16 h-16 rounded-full border-2 border-dashed border-slate-400/30 flex flex-col items-center justify-center p-2 text-center opacity-40 transform rotate-12">
                                    <span className="text-[7px] font-black uppercase text-slate-600 leading-none">{city}</span>
                                    <i className="fas fa-plane-arrival text-[10px] text-slate-300 mt-1"></i>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Dynamic MRZ */}
        <div className="px-8 py-4 bg-white/5 font-mono text-[8px] text-white/10 leading-tight tracking-[0.2em] select-none flex-shrink-0">
            {`P<BDAI${formData.lastName?.toUpperCase().padEnd(10, '<')}<<${formData.firstName?.toUpperCase().padEnd(10, '<')}<<<<<`}
            <br/>
            {`${profile.passportNumber?.replace('-', '')}<<${profile.miles}MILLAS<<<<${profile.rank?.toUpperCase().substring(0, 4)}<${formData.isPublic ? 'PUB' : 'PRIV'}<${formData.language.toUpperCase()}`}
        </div>
      </div>
    </div>
  );
};
