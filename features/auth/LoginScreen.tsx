
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
    <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617] animate-fade-in overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-purple-900/10 to-transparent pointer-events-none"></div>

      <div className="text-center flex flex-col items-center mb-10 relative z-10">
        <BdaiLogo className="w-40 h-40 animate-pulse-logo" />
        <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 -mt-6">bdai</h1>
        <p className="text-[10px] font-black lowercase tracking-[0.4em] text-purple-500 mt-2 uppercase">{t('auth.tagline')}</p>
      </div>
      
      <div className="w-full max-w-[280px] space-y-3 relative z-10">
        <div className="space-y-2">
            <input 
              type="text" 
              value={username} 
              onChange={e => onUsernameChange(e.target.value)} 
              className="w-full h-12 bg-white/[0.05] border border-white/10 rounded-2xl px-5 text-center text-white outline-none text-[13px] font-bold placeholder-slate-400 shadow-inner focus:border-purple-500/50 transition-all focus:bg-white/[0.08]" 
              placeholder={t('auth.user')} 
            />
            <input 
              type="email" 
              value={email} 
              onChange={e => onEmailChange(e.target.value)} 
              className="w-full h-12 bg-white/[0.05] border border-white/10 rounded-2xl px-5 text-center text-white outline-none text-[13px] font-bold placeholder-slate-400 shadow-inner focus:border-purple-500/50 transition-all focus:bg-white/[0.08]" 
              placeholder={t('auth.email')} 
            />
        </div>
        <button 
          onClick={onLogin} 
          className="w-full h-14 bg-white text-slate-950 rounded-2xl font-black lowercase text-[11px] tracking-widest shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-[0.97] transition-all hover:bg-slate-100"
        >
          {t('auth.login')}
        </button>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30">{t('auth.selectLang')}</p>
        <div className="w-full max-w-sm overflow-x-auto no-scrollbar px-6 flex justify-start">
            <div className="flex gap-3 pb-2 snap-x snap-mandatory px-4 min-w-max">
              {LANGUAGES.map(lang => (
                <button 
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`snap-center w-11 h-11 rounded-full border flex items-center justify-center transition-all shrink-0 ${language === lang.code ? 'bg-purple-600 border-purple-400 text-white font-black scale-110 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-white/5 border-white/10 text-slate-500 font-bold hover:bg-white/10'}`}
                >
                  <span className="text-[10px] uppercase tracking-tighter">{lang.name}</span>
                </button>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};
