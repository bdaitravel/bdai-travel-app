
import React from 'react';

interface CityCardProps {
  name: string;
  type: 'history' | 'food' | 'art' | 'culture';
  description: string;
  onClick: () => void;
}

const TYPE_CONFIG: any = {
    history: { icon: 'fa-landmark', color: 'from-amber-500/20 to-orange-600/20', text: 'Histórico' },
    food: { icon: 'fa-utensils', color: 'from-emerald-500/20 to-teal-600/20', text: 'Gastronomía' },
    art: { icon: 'fa-palette', color: 'from-purple-500/20 to-indigo-600/20', text: 'Vanguardia' },
    culture: { icon: 'fa-users', color: 'from-blue-500/20 to-cyan-600/20', text: 'Cultura' }
};

export const CityCard: React.FC<CityCardProps> = ({ name, type, description, onClick }) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.history;

  return (
    <div 
      onClick={onClick}
      className="group relative h-48 rounded-[2rem] bg-white/5 border border-white/10 p-5 flex flex-col justify-between cursor-pointer transition-all hover:bg-white/10 hover:border-purple-500/50 hover:scale-[1.02] shadow-xl overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-40 group-hover:opacity-60 transition-opacity`}></div>
      
      <div className="relative z-10 flex justify-between items-start">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl text-white shadow-inner">
              <i className={`fas ${config.icon}`}></i>
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/40">{config.text}</span>
      </div>

      <div className="relative z-10">
          <h3 className="text-xl font-heading font-black text-white leading-tight mb-1">{name}</h3>
          <p className="text-[10px] font-medium text-slate-400 line-clamp-1">{description}</p>
      </div>

      <div className="absolute -bottom-4 -right-4 text-white/5 text-6xl transform -rotate-12 transition-transform group-hover:scale-125 group-hover:-rotate-6">
          <i className={`fas ${config.icon}`}></i>
      </div>
    </div>
  );
};
