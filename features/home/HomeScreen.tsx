
import React from 'react';
import { BdaiLogo } from '../../components/BdaiLogo';
import { TravelServices } from '../../components/TravelServices';
import { useLanguage } from '../../context/LanguageContext';
import { UserProfile } from '../../types';

interface HomeScreenProps {
  user: UserProfile;
  searchVal: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: () => void;
  onCitySelect: (name: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, searchVal, onSearchChange, onSearchSubmit, onCitySelect }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 pt-safe-iphone max-w-md mx-auto animate-fade-in">
      <header className="flex justify-between items-center py-4 px-6">
        <div className="flex items-center gap-3">
          <BdaiLogo className="w-8 h-8" />
          <span className="font-black text-xl tracking-tighter">bdai</span>
        </div>
        <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[9px] font-black">
          <i className="fas fa-coins text-yellow-500 mr-2"></i>
          {user.miles.toLocaleString()}
        </div>
      </header>

      <div className="px-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter">
          {t('auth.welcome')} <br />
          <span className="text-purple-600/60 block mt-1">{user.username}.</span>
        </h1>
      </div>

      <div className="relative mt-2 flex gap-3 px-6">
        <input 
          type="text" 
          value={searchVal} 
          onChange={e => onSearchChange(e.target.value)} 
          placeholder={t('home.searchPlaceholder')}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-bold placeholder-white/20" 
        />
        <button 
          onClick={onSearchSubmit} 
          className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg active:scale-90 transition-transform"
        >
          <i className="fas fa-search"></i>
        </button>
      </div>

      <TravelServices 
        mode="HOME" 
        language={user.language} 
        onCitySelect={onCitySelect} 
      />
    </div>
  );
};
