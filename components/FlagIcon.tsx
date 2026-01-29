
import React from 'react';

export const FlagIcon = ({ code, className }: { code: string; className?: string }) => {
  const flags: Record<string, string> = {
    es: "https://flagcdn.com/w160/es.png",
    en: "https://flagcdn.com/w160/gb.png",
    pt: "https://flagcdn.com/w160/pt.png",
    it: "https://flagcdn.com/w160/it.png",
    ru: "https://flagcdn.com/w160/ru.png",
    hi: "https://flagcdn.com/w160/in.png",
    fr: "https://flagcdn.com/w160/fr.png",
    de: "https://flagcdn.com/w160/de.png",
    ja: "https://flagcdn.com/w160/jp.png",
    zh: "https://flagcdn.com/w160/cn.png",
    ca: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Catalonia.svg/160px-Flag_of_Catalonia.svg.png",
    eu: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_the_Basque_Country.svg/160px-Flag_of_the_Basque_Country.svg.png"
  };
  
  return (
    <div className={`${className} rounded-full overflow-hidden flex items-center justify-center bg-slate-800 border border-white/10 aspect-square shrink-0`}>
      <img 
        src={flags[code] || flags['es']} 
        alt={`Flag ${code}`} 
        className="w-full h-full object-cover" 
        onError={(e) => {
          (e.target as HTMLImageElement).src = flags['es'];
        }}
      />
    </div>
  );
};
