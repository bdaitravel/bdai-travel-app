import React from 'react';
import { BdaiLogo } from './BdaiLogo';
import { translations } from '../data/translations';

interface OnboardingModalProps {
  onClose: () => void;
  language: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, language }) => {
  const t = (key: string) => {
    const dict = translations[language] || translations['en'];
    return dict[key] || translations['en'][key] || key;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-start overflow-y-auto no-scrollbar bg-slate-950/98 backdrop-blur-2xl p-6">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-white/5 p-8 relative mt-12 animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <i className="fas fa-times text-lg"></i>
        </button>

        <div className="text-center flex flex-col items-center mb-8">
          <BdaiLogo className="w-20 h-20 mb-4 animate-pulse-logo" />
          <h2 className="text-4xl font-black lowercase tracking-tighter text-white/95 leading-none">bdai</h2>
          <p className="text-[9px] font-medium text-purple-400 mt-2 lowercase opacity-80">{t('subTitle')}</p>
        </div>

        <div className="space-y-8 text-center">
          <div>
            <i className="fas fa-search text-purple-400 text-3xl mb-3"></i>
            <h3 className="text-lg font-bold text-white mb-2">{t('onboardingExploreTitle')}</h3>
            <p className="text-sm text-slate-300">{t('onboardingExploreDesc')}</p>
          </div>

          <div>
            <i className="fas fa-map-marked-alt text-cyan-400 text-3xl mb-3"></i>
            <h3 className="text-lg font-bold text-white mb-2">{t('onboardingTravelTitle')}</h3>
            <p className="text-sm text-slate-300">{t('onboardingTravelDesc')}</p>
          </div>

          <div>
            <i className="fas fa-trophy text-yellow-500 text-3xl mb-3"></i>
            <h3 className="text-lg font-bold text-white mb-2">{t('onboardingEarnTitle')}</h3>
            <p className="text-sm text-slate-300">{t('onboardingEarnDesc')}</p>
          </div>

          <div>
            <i className="fas fa-passport text-red-400 text-3xl mb-3"></i>
            <h3 className="text-lg font-bold text-white mb-2">{t('onboardingPassportTitle')}</h3>
            <p className="text-sm text-slate-300">{t('onboardingPassportDesc')}</p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full mt-10 py-4 bg-purple-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all"
        >
          {t('onboardingGotIt')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;
