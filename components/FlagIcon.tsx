
import React from 'react';

export const FlagIcon = ({ code, className }: { code: string; className?: string }) => {
  const flags: Record<string, string> = {
    es: "https://flagcdn.com/w80/es.png",
    en: "https://flagcdn.com/w80/gb.png",
    ca: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Catalonia.svg/80px-Flag_of_Catalonia.svg.png",
    eu: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_the_Basque_Country.svg/80px-Flag_of_the_Basque_Country.svg.png",
    fr: "https://flagcdn.com/w80/fr.png",
    de: "https://flagcdn.com/w80/de.png",
    ja: "https://flagcdn.com/w80/jp.png",
    zh: "https://flagcdn.com/w80/cn.png",
    ar: "https://flagcdn.com/w80/sa.png"
  };
  
  return (
    <img 
      src={flags[code] || flags['es']} 
      alt={`Flag ${code}`} 
      className={`${className} object-cover`} 
      onError={(e) => {
        (e.target as HTMLImageElement).src = flags['es'];
      }}
    />
  );
};
