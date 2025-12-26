
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
    en: { passport: "Passport", surname: "Surname", givenNames: "Given Names", gallery: "Travel Album", noPhotos: "No photos yet", miles: "Total Miles", rank: "Rank" },
    es: { passport: "Pasaporte", surname: "Apellidos", givenNames: "Nombres", gallery: "Mi Álbum", noPhotos: "Sin fotos aún", miles: "Millas Totales", rank: "Rango" },
    sw: { passport: "Pasipoti", surname: "Jina la ukoo", givenNames: "Majina", gallery: "Albamu yangu", noPhotos: "Hakuna picha", miles: "Maili", rank: "Ngazi" }
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
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#0b1c3d] w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl relative z-10 border border-white/10 flex flex-col max-h-[90vh] animate-slide-up">
        
        <div className="flex justify-between items-center p-6 bg-white/5 border-b border-white/5">
            <h2 className="text-white/60 font-black text-[10px] uppercase tracking-[0.4em]">{t.passport}</h2>
            <div className="flex gap-2">
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="px-5 py-2 rounded-full bg-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-widest">
                    {isEditing ? 'Guardar' : 'Editar'}
                </button>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><i className="fas fa-times"></i></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#e8e4d8] m-4 rounded-[2rem] text-slate-900 pb-12">
            <div className="p-8">
                <div className="flex gap-6 mb-10 border-b border-slate-300 pb-8">
                    <div className="w-24 h-32 bg-white p-1 shadow-xl border border-slate-300 transform -rotate-1">
                        <img src={formData.avatar} className="w-full h-full object-cover grayscale-[0.1]" alt="Passport ID" />
                    </div>
                    <div className="flex-1 space-y-4 pt-2">
                        <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase">{t.surname}</p>
                            {isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-transparent border-b border-slate-300 text-xs font-black uppercase" /> : <p className="text-sm font-black uppercase font-mono">{user.lastName || '---'}</p>}
                        </div>
                        <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase">{t.givenNames}</p>
                            {isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-transparent border-b border-slate-300 text-xs font-black uppercase" /> : <p className="text-sm font-black uppercase font-mono">{user.firstName || '---'}</p>}
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.gallery}</h3>
                    {user.personalPhotos && user.personalPhotos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {user.personalPhotos.map((url, idx) => (
                                <div key={idx} className="aspect-square bg-white rounded-lg overflow-hidden border border-slate-300 p-0.5 shadow-sm">
                                    <img src={url} className="w-full h-full object-cover rounded-md" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 bg-slate-400/10 rounded-2xl border-2 border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-400">
                            <i className="fas fa-camera-retro text-2xl mb-2"></i>
                            <p className="text-[9px] font-black uppercase tracking-widest">{t.noPhotos}</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 p-4 rounded-2xl border border-slate-300">
                        <p className="text-[7px] font-black text-slate-400 uppercase">{t.miles}</p>
                        <p className="text-xl font-black font-mono">{user.miles.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl border border-slate-300">
                        <p className="text-[7px] font-black text-slate-400 uppercase">{t.rank}</p>
                        <p className="text-[10px] font-black uppercase text-purple-700">{user.rank}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
