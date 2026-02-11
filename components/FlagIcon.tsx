
import React, { useState } from 'react';

export const FlagIcon = ({ code, className }: { code: string; className?: string }) => {
  const [hasError, setHasError] = useState(false);

  const flags: Record<string, string> = {
    es: "https://flagcdn.com/w160/es.png",
    en: "https://flagcdn.com/w160/gb.png",
    zh: "https://flagcdn.com/w160/cn.png",
    pt: "https://flagcdn.com/w160/pt.png",
    it: "https://flagcdn.com/w160/it.png",
    ru: "https://flagcdn.com/w160/ru.png",
    hi: "https://flagcdn.com/w160/in.png",
    fr: "https://flagcdn.com/w160/fr.png",
    de: "https://flagcdn.com/w160/de.png",
    ja: "https://flagcdn.com/w160/jp.png",
    ar: "https://flagcdn.com/w160/sa.png",
    ko: "https://flagcdn.com/w160/kr.png",
    tr: "https://flagcdn.com/w160/tr.png",
    ca: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Catalonia.svg/160px-Flag_of_Catalonia.svg.png",
    eu: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_the_Basque_Country.svg/160px-Flag_of_the_Basque_Country.svg.png"
  };

  if (hasError || !flags[code]) {
    return (
      <div className={`${className} rounded-full flex items-center justify-center bg-slate-800 border border-purple-500/30 aspect-square shrink-0 shadow-sm`}>
        <span className="text-[10px] font-black text-purple-400 uppercase">{code.slice(0, 2)}</span>
      </div>
    );
  }
  
  return (
    <div className={`${className} rounded-full overflow-hidden flex items-center justify-center bg-slate-800 border border-white/20 aspect-square shrink-0 shadow-sm`}>
      <img 
        src={flags[code]} 
        alt={`Flag ${code}`} 
        className="w-full h-full object-cover scale-110" 
        onError={() => setHasError(true)}
      />
    </div>
  );
};
