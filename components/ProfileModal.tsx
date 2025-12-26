
import React, { useState } from 'react';
import { UserProfile, LANGUAGES } from '../types';
import { FlagIcon } from '../App';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  language?: string;
}

const UI_TEXT: any = {
    en: { passport: "Digital Passport", surname: "Surname", givenNames: "Given Names", gallery: "My Travel Album", noPhotos: "No memories captured yet", miles: "Total Miles", rank: "Traveler Level" },
    es: { passport: "Pasaporte Digital", surname: "Apellidos", givenNames: "Nombres", gallery: "Mi Álbum de Viajes", noPhotos: "Sin recuerdos capturados aún", miles: "Millas Totales", rank: "Rango Viajero" },
    sw: { passport: "Pasipoti ya Kidijitali", surname: "Jina la ukoo", givenNames: "Majina", gallery: "Albamu Yangu", noPhotos: "Hakuna kumbukumbu", miles: "Maili", rank: "Ngazi" }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, language = 'es' }) => {
  const t = UI_TEXT[language] || UI_TEXT['es'];
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      avatar: user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
  });

  const handleSave = () => {
      if (onUpdateUser) {
          onUpdateUser({ ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`.trim() });
      }
      setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#0b1c3d] w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl relative z-10 border border-white/10 flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header - Passport style */}
        <div className="flex justify-between items-center p-6 bg-white/5 border-b border-white/5">
            <h2 className="text-white/40 font-black text-[10px] uppercase tracking-[0.4em]">{t.passport}</h2>
            <div className="flex gap-2">
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="px-5 py-2 rounded-full bg-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-widest transition-transform active:scale-90">
                    {isEditing ? 'Guardar' : 'Editar'}
                </button>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
            </div>
        </div>

        {/* Passport Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#e8e4d8] m-4 rounded-[2rem] text-slate-900 pb-12 shadow-inner">
            <div className="p-8">
                {/* ID Info */}
                <div className="flex gap-6 mb-10 border-b border-slate-300 pb-8">
                    <div className="w-24 h-32 bg-white p-1 shadow-2xl border border-slate-400 transform -rotate-2 flex-shrink-0">
                        <img src={formData.avatar} className="w-full h-full object-cover grayscale-[0.2]" alt="ID" />
                        <div className="absolute inset-0 border-[0.5px] border-black/5 pointer-events-none"></div>
                    </div>
                    <div className="flex-1 space-y-4 pt-2">
                        <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{t.surname}</p>
                            {isEditing ? 
                                <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-transparent border-b border-slate-400 text-sm font-black uppercase outline-none" /> 
                                : <p className="text-sm font-black uppercase font-mono tracking-tight">{user.lastName || 'EXPLORER'}</p>
                            }
                        </div>
                        <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{t.givenNames}</p>
                            {isEditing ? 
                                <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-transparent border-b border-slate-400 text-sm font-black uppercase outline-none" /> 
                                : <p className="text-sm font-black uppercase font-mono tracking-tight">{user.firstName || 'GUEST'}</p>
                            }
                        </div>
                    </div>
                </div>

                {/* Personal Gallery - Album */}
                <div className="mb-10">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.gallery}</h3>
                        <span className="text-[8px] font-black text-slate-400 opacity-60">MEMORIES: {user.personalPhotos?.length || 0}</span>
                    </div>
                    {user.personalPhotos && user.personalPhotos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {user.personalPhotos.map((url, idx) => (
                                <div key={idx} className="aspect-square bg-white rounded-lg overflow-hidden border border-slate-300 p-0.5 shadow-sm transform hover:scale-105 transition-transform">
                                    <img src={url} className="w-full h-full object-cover rounded-md" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 bg-slate-400/10 rounded-[2rem] border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-400">
                            <i className="fas fa-images text-3xl mb-3 opacity-30"></i>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em]">{t.noPhotos}</p>
                        </div>
                    )}
                </div>

                {/* Status Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 p-4 rounded-2xl border border-slate-300 shadow-sm">
                        <p className="text-[7px] font-black text-slate-400 uppercase mb-1">{t.miles}</p>
                        <p className="text-xl font-black font-mono tracking-tighter">{user.miles.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl border border-slate-300 shadow-sm">
                        <p className="text-[7px] font-black text-slate-400 uppercase mb-1">{t.rank}</p>
                        <p className="text-[10px] font-black uppercase text-purple-700">{user.rank}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
