
import React, { useState, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, HubIntel } from '../types';
import { FlagIcon } from './FlagIcon';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  language?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || 'Madrid',
      country: user.country || 'España',
      bio: user.bio || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '2000-01-01',
      language: user.language || 'es'
  });

  const handleSave = () => {
      if (onUpdateUser) onUpdateUser({ 
          ...user, 
          ...formData, 
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: `${formData.firstName} ${formData.lastName}`,
          language: formData.language,
          username: formData.username,
          birthday: formData.birthday
      });
      setIsEditing(false);
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
      return (hash % 20); 
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
                        <i className="fas fa-globe-americas text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.4em]">bdai Global Explorer Passport</h2>
                        <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest">Document of Identity</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isOwnProfile && (
                        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center transition-all active:scale-90">
                            <i className={`fas ${isEditing ? 'fa-save text-green-400' : 'fa-edit'}`}></i>
                        </button>
                    )}
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times"></i></button>
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
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Surname / Apellidos</p>
                        {isEditing ? (
                             <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-200/50 rounded px-1 outline-none font-black" />
                        ) : (
                             <p className="font-black text-slate-800 uppercase">{(formData.lastName || 'EXPLORADOR').toUpperCase()}</p>
                        )}
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Given Names / Nombres</p>
                        {isEditing ? (
                             <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-200/50 rounded px-1 outline-none font-black" />
                        ) : (
                             <p className="font-black text-slate-800 uppercase">{(formData.firstName || 'USUARIO').toUpperCase()}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Birthday / Nacimiento</p>
                            {isEditing ? (
                                <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-slate-200/50 rounded px-1 outline-none font-black" />
                            ) : (
                                <p className="font-black text-slate-800 uppercase">{formData.birthday}</p>
                            )}
                        </div>
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Issued / Expedición</p>
                            <p className="font-black text-slate-800 uppercase">{user.joinDate || '20/05/2025'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">User / Usuario</p>
                            {isEditing ? (
                                <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-200/50 rounded px-1 outline-none font-black" />
                            ) : (
                                <p className="font-black text-slate-800 uppercase">@{formData.username}</p>
                            )}
                        </div>
                        <div className="border-b border-slate-300 pb-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Lang / Idioma</p>
                            {isEditing ? (
                                <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full bg-slate-200/50 rounded px-1 outline-none font-black appearance-none">
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                </select>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <FlagIcon code={formData.language} className="w-3" />
                                    <p className="font-black text-slate-800 uppercase">{LANGUAGES.find(l => l.code === formData.language)?.name}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Millas & Rango */}
            <div className="bg-[#1e293b] p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-50"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em] mb-1">Millas Totales</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter">{user.miles.toLocaleString()} <span className="text-xs">m</span></h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Estatus</p>
                        <p className="text-xl font-black text-yellow-500 uppercase tracking-tighter">{user.rank}</p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN: ARCHIVOS DE INTELIGENCIA (INTEL ARCHIVES) */}
            <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                    <i className="fas fa-folder-open text-slate-800"></i> Archivos de Inteligencia
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    {user.savedIntel && user.savedIntel.length > 0 ? user.savedIntel.map((intel: HubIntel) => (
                        <div key={intel.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow group">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${intel.color} flex items-center justify-center text-white text-xl shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
                                <i className={`fas ${intel.icon}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{intel.type} • {intel.location}</p>
                                    <i className="fas fa-bookmark text-purple-600 text-[8px]"></i>
                                </div>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{intel.title}</p>
                                <p className="text-[9px] text-slate-500 italic mt-1 line-clamp-2 leading-relaxed">{intel.description}</p>
                                {intel.details && <div className="mt-2 text-[8px] font-black text-purple-600 uppercase border-t border-slate-100 pt-2 flex items-center gap-2 animate-pulse"><i className="fas fa-eye"></i> Secreto Revelado</div>}
                            </div>
                        </div>
                    )) : (
                        <div className="py-12 bg-white/40 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center px-8">
                            <i className="fas fa-microchip text-slate-300 text-3xl mb-4"></i>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No has archivado ninguna inteligencia. Visita el Hub para robar secretos del mundo.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sellos de Ciudad */}
            <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Visados Verificados</h4>
                <div className="grid grid-cols-4 gap-6">
                    {user.visitedCities && user.visitedCities.length > 0 ? user.visitedCities.map((city) => (
                        <div key={city} style={{ transform: `rotate(${getStampRotation(city)}deg)` }} className="aspect-square rounded-full border-[3px] border-red-800/40 flex items-center justify-center p-1.5 opacity-80 mix-blend-multiply hover:scale-110 transition-transform">
                            <div className="w-full h-full rounded-full border-2 border-red-800/30 flex flex-col items-center justify-center text-red-800/60 font-black text-center leading-tight">
                                <span className="text-[8px] uppercase tracking-tighter">{city.substring(0,8)}</span>
                                <span className="text-[5px] tracking-widest">VERIFIED</span>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-4 py-16 bg-slate-300/20 rounded-[2.5rem] border-2 border-dashed border-slate-400/50 text-center text-[9px] font-black text-slate-500 uppercase">Explora para recibir sellos</div>
                    )}
                </div>
            </div>

            <button onClick={onLogout} className="w-full py-4 text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-red-600 transition-colors">Cerrar Sesión</button>
        </div>
      </div>
    </div>
  );
};
