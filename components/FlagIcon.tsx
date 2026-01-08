
import React from 'react';

export const FlagIcon = ({ code, className }: { code: string; className?: string }) => {
  const flags: Record<string, string> = {
    es: "https://flagcdn.com/w80/es.png",
    en: "https://flagcdn.com/w80/gb.png",
    ca: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Catalonia.svg/80px-Flag_of_Catalonia.svg.png",
    eu: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Flag_of_the_Basque_Country.svg/80px-Flag_of_the_Basque_Country.svg.png",
    fr: "https://flagcdn.com/w80/fr.png"
  };
  
  return (
    <img 
      src={flags[code] || flags['es']} 
      alt={`Flag ${code}`} 
      className={className} 
      onError={(e) => {
        (e.target as HTMLImageElement).src = flags['es'];
      }}
    />
  );
};
