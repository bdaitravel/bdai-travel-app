import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileCompletionPromptProps {
  user: UserProfile;
  onClose: (updatedUser: UserProfile) => void;
}

const TEXTS: Record<string, Record<string, string>> = {
  es: {
    title: "Completa tu perfil", subtitle: "Cuéntanos un poco más de ti y llévate +10 millas de regalo.",
    birthday: "Fecha de nacimiento", city: "Ciudad", country: "País", cityPlaceholder: "Tu ciudad", countryPlaceholder: "Tu país",
    gender: "Sexo", male: "Hombre", female: "Mujer", unspecified: "Prefiero no decirlo",
    save: "Guardar y recibir +10 millas", skip: "Ahora no"
  },
  en: {
    title: "Complete your profile", subtitle: "Tell us a bit more about you and get +10 free miles.",
    birthday: "Date of birth", city: "City", country: "Country", cityPlaceholder: "Your city", countryPlaceholder: "Your country",
    gender: "Gender", male: "Male", female: "Female", unspecified: "Prefer not to say",
    save: "Save and get +10 miles", skip: "Not now"
  }
};

export const ProfileCompletionPrompt: React.FC<ProfileCompletionPromptProps> = ({ user, onClose }) => {
  const lang = user.language || 'es';
  const t = TEXTS[lang] || TEXTS.en;

  const [birthday, setBirthday] = useState(user.birthday || '');
  const [city, setCity] = useState(user.city || '');
  const [country, setCountry] = useState(user.country || '');
  const [gender, setGender] = useState<NonNullable<UserProfile['gender']>>(user.gender || 'unspecified');

  const handleSkip = () => {
    onClose({ ...user, profileCompletedAt: new Date().toISOString() });
  };

  const handleSave = () => {
    const age = birthday ? new Date().getFullYear() - new Date(birthday).getFullYear() : user.age;
    onClose({
      ...user,
      birthday: birthday || user.birthday,
      age,
      city: city || user.city,
      country: country || user.country,
      gender,
      miles: user.miles + 10,
      profileCompletedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-y-auto no-scrollbar animate-fade-in">
      <div className="w-full max-w-md bg-slate-900/80 border border-white/10 p-8 rounded-[3rem] shadow-2xl backdrop-blur-2xl relative">
        <button onClick={handleSkip} aria-label="Close"
          className="absolute top-6 right-6 z-10 w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center active:scale-90 hover:bg-white/10 hover:text-white transition-all">
          <i className="fas fa-times"></i>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <i className="fas fa-gift text-purple-400"></i>
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-widest">{t.title}</h3>
          <p className="text-slate-400 text-[11px] mt-2 leading-relaxed px-2">{t.subtitle}</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.birthday}</p>
            <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
              className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-xs outline-none focus:border-purple-500/50 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.city}</p>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder={t.cityPlaceholder}
                className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-xs outline-none focus:border-purple-500/50 placeholder-slate-700 transition-all" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.country}</p>
              <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder={t.countryPlaceholder}
                className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-xs outline-none focus:border-purple-500/50 placeholder-slate-700 transition-all" />
            </div>
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.gender}</p>
            <div className="flex gap-2">
              {(['male', 'female', 'unspecified'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  className={`flex-1 h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${gender === g ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/10 text-slate-400'}`}>
                  {t[g]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSave}
          className="w-full h-14 mt-6 bg-white text-slate-950 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
          {t.save}
        </button>
        <button onClick={handleSkip} className="w-full h-10 mt-1 text-slate-500 text-[9px] font-black uppercase tracking-widest">
          {t.skip}
        </button>
      </div>
    </div>
  );
};
