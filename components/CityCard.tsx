
import React, { useState, useEffect } from 'react';

interface CityCardProps {
  name: string;
  image?: string;
  description: string;
  onClick: () => void;
  isLoading?: boolean;
}

export const CityCard: React.FC<CityCardProps> = ({ name, image, description, onClick }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Usamos Unsplash como fuente gratuita por defecto. No genera gasto de IA.
  const displayImage = image || `https://source.unsplash.com/featured/?${encodeURIComponent(name)},city,architecture`;

  return (
    <div 
      onClick={onClick}
      className="group relative h-[380px] w-full rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 shadow-md hover:shadow-2xl hover:-translate-y-2 flex-shrink-0"
    >
      <div className={`absolute inset-0 bg-slate-200 ${!imgLoaded ? 'animate-pulse' : ''}`}></div>
      
      <img 
        src={displayImage} 
        alt={name} 
        onLoad={() => setImgLoaded(true)}
        className={`w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-in-out group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
      
      <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end pointer-events-none">
         <h3 className="text-3xl font-heading font-bold text-white mb-1 tracking-tight drop-shadow-lg">{name}</h3>
         {description && <p className="text-slate-200 text-sm font-medium line-clamp-2 mb-4 opacity-90">{description}</p>}
         
         <div className="flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
             <span className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg">
                 <i className="fas fa-arrow-right text-xs transform group-hover:translate-x-0.5 transition-transform"></i>
             </span>
             <span className="text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">Explorar</span>
         </div>
      </div>
    </div>
  );
};
