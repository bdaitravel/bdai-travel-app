
import React, { useState, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, HubIntel, Badge, SocialLinks, INTEREST_OPTIONS } from '../types';
import { FlagIcon } from './FlagIcon';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  language?: string;
}

const MODAL_TEXTS: any = {
    en: {
        title: "bdai Global Passport", subtitle: "Digital Nomad Credential",
        surname: "Surname", givenNames: "Given Names", city: "City", country: "Country",
        birthday: "Birthday", age: "Age", social: "Social Matrix", interests: "Interest Profile",
        achievements: "Elite Achievements", visas: "Verified Visas", entry: "ENTRY",
        verified: "VERIFIED", noBadges: "No badges yet", noVisas: "Ready for stamps",
        save: "Save Passport", edit: "Edit Identity", logout: "Logout",
        langTitle: "System Language", linked: "Linked", notLinked: "Not linked"
    },
    es: {
        title: "Pasaporte Global bdai", subtitle: "Credencial Nómada Digital",
        surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País",
        birthday: "Nacimiento", age: "Edad", social: "Social Matrix", interests: "Perfil de Intereses",
        achievements: "Logros de Élite", visas: "Visados Verificados", entry: "ENTRADA",
        verified: "VERIFICADO", noBadges: "Sin insignias aún", noVisas: "Listo para sellos",
        save: "Guardar Pasaporte", edit: "Editar Identidad", logout: "Cerrar Sesión",
        langTitle: "Idioma del Sistema", linked: "Vinculado", notLinked: "Sin vincular"
    },
    ca: {
        title: "Passaport Global bdai", subtitle: "Credencial Nòmada Digital",
        surname: "Cognoms", givenNames: "Noms", city: "Ciutat", country: "País",
        birthday: "Naixement", age: "Edat", social: "Social Matrix", interests: "Perfil d'Interessos",
        achievements: "Logros d'Elit", visas: "Visats Verificats", entry: "ENTRADA",
        verified: "VERIFICAT", noBadges: "Sense insignies", noVisas: "Llest per segells",
        save: "Guardar Passaport", edit: "Editar Identitat", logout: "Tancar Sessió",
        langTitle: "Idioma del Sistema", linked: "Vinculat", notLinked: "Sense vincular"
    },
    eu: {
        title: "bdai Pasaporte Globala", subtitle: "Nomada Digital Agiria",
        surname: "Abizenak", givenNames: "Izenak", city: "Hiria", country: "Herrialdea",
        birthday: "Jaioteguna", age: "Adina", social: "Sare Sozialak", interests: "Interes Profila",
        achievements: "Eliteko Lorpenak", visas: "Egiaztatutako Visatuak", entry: "SARRERA",
        verified: "EGIAZTATUA", noBadges: "Intzigniarik gabe", noVisas: "Zigiluetarako prest",
        save: "Pasaportea Gorde", edit: "Identitatea Aldatu", logout: "Saioa Itxi",
        langTitle: "Sistemaren Hizkuntza", linked: "Lotuta", notLinked: "Lotu gabe"
    },
    fr: {
        title: "Passeport Global bdai", subtitle: "Identité Nomade Numérique",
        surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays",
        birthday: "Naissance", age: "Âge", social: "Matrice Sociale", interests: "Profil d'Intérêts",
        achievements: "Réussites d'Élite", visas: "Visas Vérifiés", entry: "ENTRÉE",
        verified: "VÉRIFIÉ", noBadges: "Pas de badges", noVisas: "Prêt pour les tampons",
        save: "Sauver le Passeport", edit: "Modifier l'Identité", logout: "Déconnexion",
        langTitle: "Langue du Système", linked: "Lié", notLinked: "Pas lié"
    }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const pt = (key: string) => (MODAL_TEXTS[user.language] || MODAL_TEXTS['es'])[key] || key;

  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || 'Madrid',
      country: user.country || 'España',
      bio: user.bio || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es',
      interests: user.interests || [],
      socialLinks: user.socialLinks || {
          instagram: '',
          tiktok: '',
          twitter: '',
          linkedin: ''
      }
  });

  const handleSave = () => {
      const birthDate = new Date(formData.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      
      if (onUpdateUser) onUpdateUser({ 
          ...user, 
          ...formData, 
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          language: formData.language,
          birthday: formData.birthday,
          age: age,
          city: formData.city,
          country: formData.country,
          interests: formData.interests
      });
      setIsEditing(false);
  };

  const handleLanguageUpdate = (code: string) => {
      setFormData(prev => ({ ...prev, language: code }));
      // Actualización inmediata para que la UI reaccione
      if (onUpdateUser) onUpdateUser({ ...user, language: code });
  };

  const toggleInterest = (id: string) => {
    setFormData(prev => ({
        ...prev,
        interests: prev.interests.includes(id) 
            ? prev.interests.filter(i => i !== id) 
            : [...prev.interests, id]
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(p => ({ ...p, avatar: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleShare = () => {
      if (navigator.share) {
          navigator.share({
              title: `Passport Digital: ${user.firstName}`,
              text: `🚀 Rango ${user.rank} con ${user.miles.toLocaleString()} millas. ¡Únete a la expedición!`,
              url: window.location.origin
          }).catch(console.error);
      }
  };

  const getStampRotation = (city: string) => {
      let hash = 0;
      for (let i = 0; i < city.length; i++) hash = city.charCodeAt(i) + ((hash << 5) - hash);
      return (hash % 25) - 12; 
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="bg-[#f2efe4] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 border-[6px] border-[#d4cfbd] flex flex-col max-h-[90vh] text-slate-900 font-sans">
        
        {/* Passport Header */}
        <div className="bg-[#7b1b1b] p-6 flex flex-col gap-1 border-b-[6px] border-[#d4cfbd] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12"></div>
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900 shadow-lg">
                        <i className="fas fa-id-badge text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.4em]">{pt('title')}</h2>
                        <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest">{pt('subtitle')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isOwnProfile && (
                        <>
                            <button onClick={handleShare} className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg">
                                <i className="fas fa-share-nodes"></i>
                            </button>
                            <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isEditing ? 'bg-green-600 text-white shadow-lg' : 'bg-white/10 text-white'}`}>
                                <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'}`}></i>
                            </button>
                            <button onClick={onLogout} className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center transition-all active:scale-90 shadow-lg">
                                <i className="fas fa-sign-out-alt"></i>
                            </button>
                        </>
                    )}
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center active:scale-90 transition-transform"><i className="fas fa-times"></i></button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
            {/* Foto & Biometría */}
            <div className="flex gap-8 items-start">
                <div className="relative group shrink-0">
                    <div className="w-36 h-48 bg-white border-4 border-[#d4cfbd] rounded-xl shadow-inner overflow-hidden flex items-center justify-center p-2 relative">
                        <img src={formData.avatar} className="w-full h-full object-cover filter contrast-110 saturate-[0.8] mix-blend-multiply" />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <i className="fas fa-camera text-white text-2xl"></i>
                            </div>
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    <div className="mt-3 text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center bg-slate-200/50 py-1 rounded">ID: {user.passportNumber}</div>
                </div>

                <div className="flex-1 space-y-4 font-mono text-[10px]">
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{pt('surname')}</p>
                        {isEditing ? (
                            <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black uppercase" />
                        ) : (
                            <p className="font-black text-slate-800 uppercase">{(formData.lastName || 'EXPLORADOR').toUpperCase()}</p>
                        )}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{pt('givenNames')}</p>
                        {isEditing ? (
                            <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black uppercase" />
                        ) : (
                            <p className="font-black text-slate-800 uppercase">{(formData.firstName || 'USUARIO').toUpperCase()}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{pt('city')}</p>
                            {isEditing ? (
                                <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black uppercase" />
                            ) : (
                                <p className="font-black text-slate-800 uppercase">{formData.city}</p>
                            )}
                        </div>
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{pt('country')}</p>
                            {isEditing ? (
                                <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black uppercase" />
                            ) : (
                                <p className="font-black text-slate-800 uppercase">{formData.country}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{pt('birthday')}</p>
                            {isEditing ? (
                                <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black" />
                            ) : (
                                <p className="font-black text-slate-800 uppercase">{formData.birthday}</p>
                            )}
                        </div>
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{pt('age')}</p>
                            <p className="font-black text-slate-800 uppercase">{user.age} YRS</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN: IDIOMA (LANGUAGE SELECTION) */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                    <i className="fas fa-language text-slate-800"></i> {pt('langTitle')}
                </h4>
                <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                        <button 
                            key={lang.code}
                            disabled={!isEditing}
                            onClick={() => handleLanguageUpdate(lang.code)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all
                                ${formData.language === lang.code 
                                    ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-500/10' 
                                    : 'bg-slate-200/50 border-slate-300 opacity-60'}`}
                        >
                            <FlagIcon code={lang.code} className="w-6 h-6 rounded-full object-cover" />
                            <span className="text-[10px] font-black uppercase">{lang.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* SECCIÓN: REDES SOCIALES */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                    <i className="fas fa-network-wired text-slate-800"></i> {pt('social')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    {['instagram', 'tiktok', 'twitter', 'linkedin'].map((platform) => (
                        <div key={platform} className={`flex items-center gap-3 p-3 rounded-2xl border ${formData.socialLinks[platform as keyof SocialLinks] ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-200/50 border-dashed border-slate-300 opacity-60'}`}>
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm shrink-0">
                                <i className={`fab fa-${platform === 'twitter' ? 'x-twitter' : platform}`}></i>
                            </div>
                            {isEditing ? (
                                <input 
                                    placeholder={`@${platform}`}
                                    value={formData.socialLinks[platform as keyof SocialLinks]} 
                                    onChange={e => setFormData({
                                        ...formData, 
                                        socialLinks: { ...formData.socialLinks, [platform]: e.target.value }
                                    })} 
                                    className="w-full bg-transparent text-[9px] font-black uppercase outline-none" 
                                />
                            ) : (
                                <p className="text-[9px] font-black uppercase truncate">
                                    {formData.socialLinks[platform as keyof SocialLinks] || pt('notLinked')}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN: GUSTOS / INTERESES */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                    <i className="fas fa-fingerprint text-slate-800"></i> {pt('interests')}
                </h4>
                <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(opt => (
                        <button 
                            key={opt.id}
                            disabled={!isEditing}
                            onClick={() => toggleInterest(opt.id)}
                            className={`px-4 py-2 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all
                                ${formData.interests.includes(opt.id) 
                                    ? 'bg-purple-600 border-purple-500 text-white shadow-md' 
                                    : 'bg-white border-slate-200 text-slate-400 opacity-60'}`}
                        >
                            {opt.icon} {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* SECCIÓN: INSIGNIAS DESBLOQUEADAS */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                    <i className="fas fa-award text-slate-800"></i> {pt('achievements')}
                </h4>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {user.badges && user.badges.length > 0 ? user.badges.map((badge: Badge) => (
                        <div key={badge.id} className="min-w-[100px] flex flex-col items-center gap-2 group">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-4 border-white shadow-lg flex items-center justify-center text-slate-900 text-xl relative overflow-hidden transition-transform group-hover:scale-110">
                                <i className={`fas ${badge.icon}`}></i>
                                <div className="absolute inset-0 bg-white/20 -translate-y-full group-hover:translate-y-full transition-transform duration-1000"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-black uppercase text-slate-800">{badge.name}</p>
                                <p className="text-[6px] text-slate-400 uppercase">{badge.earnedAt}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="w-full py-6 bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-300 text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{pt('noBadges')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN: VISADOS VERIFICADOS */}
            <div className="space-y-6 pb-8">
                <div className="flex justify-between items-center px-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{pt('visas')}</h4>
                    <span className="text-[8px] font-bold text-slate-300 uppercase">Pág. {Math.min(12 + (user.visitedCities?.length || 0), 48)} / 48</span>
                </div>
                
                <div className="bg-[#e9e6d8] rounded-[2rem] p-10 border-2 border-[#d4cfbd] shadow-inner relative overflow-hidden min-h-[300px]">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-12">
                        <i className="fas fa-earth-europe text-[20rem]"></i>
                    </div>
                    
                    {user.visitedCities && user.visitedCities.length > 0 ? (
                        <div className="grid grid-cols-3 gap-y-10 gap-x-6 relative z-10">
                            {user.visitedCities.map((city) => (
                                <div 
                                    key={city} 
                                    style={{ transform: `rotate(${getStampRotation(city)}deg)` }} 
                                    className="aspect-square flex items-center justify-center relative group"
                                >
                                    <div className="w-full h-full rounded-full border-[3px] border-red-900/40 flex items-center justify-center p-1 opacity-70 mix-blend-multiply hover:scale-110 transition-transform duration-500 cursor-help">
                                        <div className="w-full h-full rounded-full border-2 border-red-900/30 flex flex-col items-center justify-center text-red-900/70 font-black text-center leading-none">
                                            <span className="text-[5px] tracking-[0.2em] mb-1">{pt('entry')}</span>
                                            <span className="text-[10px] uppercase tracking-tighter font-serif">{city.substring(0,8)}</span>
                                            <div className="w-10 h-[1px] bg-red-900/30 my-1"></div>
                                            <span className="text-[6px] tracking-widest uppercase">{pt('verified')}</span>
                                            <span className="text-[4px] mt-1 opacity-50 uppercase">BDAI-GLOBAL</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 py-12">
                            <i className="fas fa-stamp text-6xl mb-4"></i>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[150px]">{pt('noVisas')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
