
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
        langTitle: "System Language", linked: "Linked", notLinked: "Not linked",
        username: "Username"
    },
    es: {
        title: "Pasaporte Global bdai", subtitle: "Credencial Nómada Digital",
        surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País",
        birthday: "Nacimiento", age: "Edad", social: "Social Matrix", interests: "Perfil de Intereses",
        achievements: "Logros de Élite", visas: "Visados Verificados", entry: "ENTRADA",
        verified: "VERIFICADO", noBadges: "Sin insignias aún", noVisas: "Listo para sellos",
        save: "Guardar Pasaporte", edit: "Editar Identidad", logout: "Cerrar Sesión",
        langTitle: "Idioma del Sistema", linked: "Vinculado", notLinked: "Sin vincular",
        username: "Usuario"
    },
    ca: {
        title: "Passaport Global bdai", subtitle: "Credencial Nòmada Digital",
        surname: "Cognoms", givenNames: "Noms", city: "Ciutat", country: "País",
        birthday: "Naixement", age: "Edat", social: "Social Matrix", interests: "Perfil d'Interessos",
        achievements: "Logros d'Elit", visas: "Visats Verificats", entry: "ENTRADA",
        verified: "VERIFICAT", noBadges: "Sense insignies", noVisas: "Llest per segells",
        save: "Guardar Passaport", edit: "Editar Identitat", logout: "Tancar Sessió",
        langTitle: "Idioma del Sistema", linked: "Vinculat", notLinked: "Sense vincular",
        username: "Usuari"
    },
    eu: {
        title: "bdai Pasaporte Globala", subtitle: "Nomada Digital Agiria",
        surname: "Abizenak", givenNames: "Izenak", city: "Hiria", country: "Herrialdea",
        birthday: "Jaioteguna", age: "Adina", social: "Sare Sozialak", interests: "Interes Profila",
        achievements: "Eliteko Lorpenak", visas: "Egiaztatutako Visatuak", entry: "SARRERA",
        verified: "EGIAZTATUA", noBadges: "Intzigniarik gabe", noVisas: "Zigiluetarako prest",
        save: "Pasaportea Gorde", edit: "Identitatea Aldatu", logout: "Saioa Itxi",
        langTitle: "Sistemaren Hizkuntza", linked: "Lotuta", notLinked: "Lotu gabe",
        username: "Erabiltzailea"
    },
    fr: {
        title: "Passeport Global bdai", subtitle: "Identité Nomade Numérique",
        surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays",
        birthday: "Naissance", age: "Âge", social: "Matrice Sociale", interests: "Profil d'Intérêts",
        achievements: "Réussites d'Élite", visas: "Visas Vérifiés", entry: "ENTRÉE",
        verified: "VÉRIFIÉ", noBadges: "Pas de badges", noVisas: "Prêt pour les tampons",
        save: "Sauver le Passeport", edit: "Modifier l'Identité", logout: "Déconnexion",
        langTitle: "Langue du Système", linked: "Lié", notLinked: "Pas lié",
        username: "Utilisateur"
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
          x: '',
          facebook: ''
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

  const getStampRotation = (city: string) => {
      let hash = 0;
      for (let i = 0; i < city.length; i++) hash = city.charCodeAt(i) + ((hash << 5) - hash);
      return (hash % 25) - 12; 
  };

  const getSocialIcon = (platform: string) => {
      switch(platform) {
          case 'x': return 'fa-x-twitter';
          case 'facebook': return 'fa-facebook-f';
          case 'instagram': return 'fa-instagram';
          case 'tiktok': return 'fa-tiktok';
          default: return 'fa-share-nodes';
      }
  };

  const getSocialUrl = (platform: string, handle: string) => {
      if (!handle) return '#';
      const cleanHandle = handle.replace('@', '');
      switch(platform) {
          case 'x': return `https://x.com/${cleanHandle}`;
          case 'facebook': return `https://facebook.com/${cleanHandle}`;
          case 'instagram': return `https://instagram.com/${cleanHandle}`;
          case 'tiktok': return `https://tiktok.com/@${cleanHandle}`;
          default: return '#';
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="bg-[#f2efe4] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 border-[6px] border-[#d4cfbd] flex flex-col max-h-[92vh] text-slate-900 font-sans">
        
        {/* Passport Header */}
        <div className="bg-[#7b1b1b] p-6 flex flex-col gap-1 border-b-[6px] border-[#d4cfbd] relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12"></div>
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900 shadow-lg">
                        <i className="fas fa-id-badge text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.4em] leading-none">{pt('title')}</h2>
                        <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest mt-1">{pt('subtitle')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isOwnProfile && (
                        <>
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

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-12 pb-24">
            
            {/* Foto & Biometría */}
            <div className="flex gap-6 items-start">
                <div className="relative group shrink-0">
                    <div className="w-32 h-44 bg-white border-4 border-[#d4cfbd] rounded-xl shadow-inner overflow-hidden flex items-center justify-center p-2 relative">
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
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{pt('username')}</p>
                        {isEditing ? (
                            <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black text-purple-600" />
                        ) : (
                            <p className="font-black text-purple-600">@{formData.username}</p>
                        )}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{pt('surname')}</p>
                        {isEditing ? (
                            <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black uppercase" />
                        ) : (
                            <p className="font-black text-slate-800 uppercase truncate">{(formData.lastName || 'EXPLORADOR').toUpperCase()}</p>
                        )}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{pt('givenNames')}</p>
                        {isEditing ? (
                            <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black uppercase" />
                        ) : (
                            <p className="font-black text-slate-800 uppercase truncate">{(formData.firstName || 'USUARIO').toUpperCase()}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{pt('birthday')}</p>
                            {isEditing ? (
                                <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-100 px-1 border-none font-black" />
                            ) : (
                                <p className="font-black text-slate-800">{formData.birthday}</p>
                            )}
                        </div>
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{pt('age')}</p>
                            <p className="font-black text-slate-800">{user.age}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN: REDES SOCIALES (ENLACES DINÁMICOS) */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                    <i className="fas fa-network-wired text-slate-800"></i> {pt('social')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    {['instagram', 'tiktok', 'x', 'facebook'].map((platform) => {
                        const value = formData.socialLinks[platform as keyof SocialLinks];
                        const url = getSocialUrl(platform, value || '');
                        
                        return (
                            <div key={platform} className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${value ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-200/50 border-dashed border-slate-300 opacity-60'}`}>
                                {isEditing ? (
                                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm shrink-0">
                                        <i className={`fab ${getSocialIcon(platform)}`}></i>
                                    </div>
                                ) : (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm shrink-0 hover:bg-purple-600 transition-colors">
                                        <i className={`fab ${getSocialIcon(platform)}`}></i>
                                    </a>
                                )}
                                
                                {isEditing ? (
                                    <input 
                                        placeholder={`@${platform}`}
                                        value={value} 
                                        onChange={e => setFormData({
                                            ...formData, 
                                            socialLinks: { ...formData.socialLinks, [platform]: e.target.value }
                                        })} 
                                        className="w-full bg-transparent text-[9px] font-black uppercase outline-none" 
                                    />
                                ) : (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black uppercase truncate group-hover:text-purple-600 transition-colors">
                                            {value || pt('notLinked')}
                                        </p>
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SECCIÓN: VISADOS VERIFICADOS (SELLOS) */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                    <i className="fas fa-stamp text-slate-800"></i> {pt('visas')}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                    {user.visitedCities && user.visitedCities.length > 0 ? user.visitedCities.map((city: string) => (
                        <div key={city} className="relative aspect-square flex items-center justify-center group">
                            <div className="absolute inset-0 bg-blue-600/10 rounded-full scale-90 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div 
                                className="w-20 h-20 border-[3px] border-blue-600/60 rounded-full flex flex-col items-center justify-center p-2 relative"
                                style={{ transform: `rotate(${getStampRotation(city)}deg)` }}
                            >
                                <div className="absolute inset-0 bg-blue-600/5 rounded-full pointer-events-none"></div>
                                <p className="text-[6px] font-black text-blue-600/60 uppercase tracking-tighter leading-none mb-1">{pt('verified')}</p>
                                <p className="text-[10px] font-black text-blue-600 uppercase text-center leading-none tracking-tighter">{city}</p>
                                <div className="mt-1 flex gap-0.5">
                                    {[1,2,3,4,5].map(s => <i key={s} className="fas fa-star text-[4px] text-blue-600/40"></i>)}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 py-6 bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-300 text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{pt('noVisas')}</p>
                        </div>
                    )}
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
                            {opt.icon} {(opt.label as any)[user.language] || (opt.label as any)['es']}
                        </button>
                    ))}
                </div>
            </div>

            {/* SECCIÓN: INSIGNIAS (LOGROS) */}
            <div className="space-y-4 pb-12">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                    <i className="fas fa-award text-slate-800"></i> {pt('achievements')}
                </h4>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                    {user.badges && user.badges.length > 0 ? user.badges.map((badge: Badge) => (
                        <div key={badge.id} className="min-w-[100px] flex flex-col items-center gap-2 group">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-4 border-white shadow-lg flex items-center justify-center text-slate-900 text-xl transition-transform group-hover:scale-110">
                                <i className={`fas ${badge.icon}`}></i>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-black uppercase text-slate-800">{badge.name}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="w-full py-6 bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-300 text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{pt('noBadges')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
