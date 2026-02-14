
import React from 'react';
import { BdaiLogo } from '../../components/BdaiLogo';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES } from '../../types';

interface LoginScreenProps {
  username: string;
  email: string;
  onUsernameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ username, email, onUsernameChange, onEmailChange, onLogin }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617] animate-fade-in">
      <div className="text-center flex flex-col items-center mb-10 mt-[-10dvh]">
        <BdaiLogo className="w-44 h-44 animate-pulse-logo" />
        <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 -mt-8">bdai</h1>
        <p className="text-[10px] font-black lowercase tracking-[0.3em] text-purple-500 mt-2 uppercase">{t('auth.tagline')}</p>
      </div>
      
      <div className="w-full max-w-[240px] mt-2 space-y-2">
        <input 
          type="text" 
          value={username} 
          onChange={e => onUsernameChange(e.target.value)} 
          className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-center text-white outline-none text-[10px] font-medium placeholder-slate-700 shadow-inner focus:border-purple-500/30 transition-all" 
          placeholder={t('auth.userPlaceholder')} 
        />
        <input 
          type="email" 
          value={email} 
          onChange={e => onEmailChange(e.target.value)} 
          className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-center text-white outline-none text-[10px] font-medium placeholder-slate-700 shadow-inner focus:border-purple-500/30 transition-all" 
          placeholder={t('auth.emailPlaceholder')} 
        />
        <button 
          onClick={onLogin} 
          className="w-full mt-4 h-12 bg-white text-slate-950 rounded-xl font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all"
        >
          {t('auth.login')}
        </button>
      </div>

      <div className="absolute bottom-12 left-0 right-0 px-8 flex flex-col items-center gap-4">
        <p className="text-[7px] font-black uppercase tracking-[0.4em] text-white/20">{t('auth.selectLang')}</p>
        <div className="w-full max-w-full overflow-x-auto no-scrollbar flex gap-2 px-6 py-4 bg-white/[0.02] rounded-full border border-white/[0.05]">
          {LANGUAGES.map(lang => (
            <button 
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-90 shrink-0 ${language === lang.code ? 'bg-purple-600 border-purple-400 text-white font-black scale-110 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 font-bold hover:bg-white/10'}`}
            >
              <span className="text-[9px] uppercase tracking-tighter">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
