import React from 'react';
import { Capacitor } from '@capacitor/core';
import { AppleLogo } from './AppleLogo';

interface LeaderboardLockedViewProps {
  language: string;
  onLinkApple: () => void;
  onLinkGoogle: () => void;
}

const isIOS = Capacitor.getPlatform() === 'ios';

const TEXTS: Record<string, Record<string, string>> = {
  es: {
    title: "Vincula tu cuenta para participar",
    subtitle: "El Ranking Global compara viajeros reales entre sí. Vincula tu perfil con Apple o Google para que tus millas cuenten aquí — no perderás nada de tu progreso actual.",
    linkApple: "Vincular con Apple", linkGoogle: "Vincular con Google"
  },
  en: {
    title: "Link your account to take part",
    subtitle: "The Global Ranking compares real travelers against each other. Link your profile with Apple or Google so your miles count here — you won't lose any of your current progress.",
    linkApple: "Link with Apple", linkGoogle: "Link with Google"
  }
};

export const LeaderboardLockedView: React.FC<LeaderboardLockedViewProps> = ({ language, onLinkApple, onLinkGoogle }) => {
  const t = TEXTS[language] || TEXTS.en;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-6">
        <i className="fas fa-trophy text-2xl text-purple-400"></i>
      </div>
      <h2 className="text-white font-black text-sm uppercase tracking-widest mb-3">{t.title}</h2>
      <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs mb-8">{t.subtitle}</p>

      <div className="w-full max-w-[280px]">
        {isIOS ? (
          <button onClick={onLinkApple}
            className="w-full h-14 bg-black border border-white/10 text-white rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
            <AppleLogo className="w-[18px] h-[18px]" color="#FFFFFF" />
            {t.linkApple}
          </button>
        ) : (
          <button onClick={onLinkGoogle}
            className="w-full h-14 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
            <i className="fab fa-google text-purple-600"></i>{t.linkGoogle}
          </button>
        )}
      </div>
    </div>
  );
};
