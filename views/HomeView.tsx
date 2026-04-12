import React from 'react';
import { BdaiLogo } from '../components/BdaiLogo';
import { TravelServices } from '../components/TravelServices';
import { UserProfile } from '../types';

interface HomeViewProps {
  user: UserProfile;
  setShowOnboarding: (val: boolean) => void;
  searchVal: string;
  handleCitySearch: (val: string) => void;
  isSearching: boolean;
  searchOptions: any[] | null;
  processCitySelection: (opt: any, lang: string) => void;
  handleTravelServiceSelect: (name: string, country?: string) => void;
  t: (key: string) => string;
  appDesc: Record<string, string>;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user, setShowOnboarding, searchVal, handleCitySearch,
  isSearching, searchOptions, processCitySelection,
  handleTravelServiceSelect, t, appDesc
}) => (
  <div className="space-y-6 pt-safe-iphone w-full max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto px-0 sm:px-6 md:px-8 animate-fade-in relative z-10">
    <header className="flex justify-between items-center py-4 px-6">
      <div className="flex items-center gap-3"><BdaiLogo className="w-8 h-8"/><span className="font-black text-xl tracking-tighter lowercase">bdai</span></div>
      <div className="flex items-center gap-2">
        <button onClick={() => setShowOnboarding(true)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all"><i className="fas fa-question text-[10px]"></i></button>
        <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-2 shadow-lg border border-white/5"><i className="fas fa-coins text-yellow-500"></i>{user.miles.toLocaleString()}</div>
      </div>
    </header>

    <div className="py-10 px-6 text-center flex flex-col items-center">
      <BdaiLogo className="w-32 h-32 mb-6 animate-pulse-logo" />
      <h1 className="text-8xl font-black text-white lowercase tracking-tighter leading-none">bdai</h1>
      <p className="text-[11px] font-medium text-purple-400 mt-2 lowercase opacity-80 mb-4">better destinations by ai</p>
      <p className="text-xs text-slate-400 max-w-[280px] mx-auto mb-10 leading-relaxed font-medium">
        {appDesc[user.language] || appDesc['en']}
      </p>
      
      <div className="w-full relative">
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none font-bold text-sm shadow-inner flex items-center justify-between">
            <input type="text" value={searchVal} onChange={(e) => handleCitySearch(e.target.value)} 
              placeholder={t('searchPlaceholder')} className="bg-transparent border-none outline-none w-full" />
            {isSearching && <i className="fas fa-spinner fa-spin text-purple-500 text-xs"></i>}
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 transition-transform active:scale-90"><i className="fas fa-search"></i></div>
        </div>

        {searchOptions && searchOptions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-4 space-y-2 bg-[#0a0f1e]/98 backdrop-blur-3xl border border-white/5 p-3 rounded-[2rem] shadow-2xl animate-slide-up z-[1001]">
            {searchOptions.map((opt, i) => (
              <button key={i} onClick={() => processCitySelection(opt, user.language)} 
                className="w-full p-4 bg-white/[0.03] rounded-xl flex items-center justify-between border border-white/5 active:bg-purple-600/10 transition-all text-left">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {opt.countryCode ? (
                      <img src={`https://flagsapi.com/${opt.countryCode}/flat/64.png`} alt={opt.country} className="w-full h-full object-cover" />
                    ) : (
                      <i className={`fas ${opt.isCached ? 'fa-bolt text-cyan-400' : 'fa-globe text-purple-500'} text-xs`}></i>
                    )}
                  </div>
                  <div className="truncate">
                    <span className="text-white font-black uppercase text-[11px] block">{opt.cityLocal || opt.fullName}</span>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{opt.country}</span>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-[9px] text-purple-500/40"></i>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>

    <TravelServices mode="HOME" lang={user.language} onCitySelect={handleTravelServiceSelect} />
  </div>
);
