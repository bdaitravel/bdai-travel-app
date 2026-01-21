
import React from 'react';

interface CityCardProps {
  name: string;
  type: 'history' | 'food' | 'art' | 'culture';
  description: string;
  onClick: () => void;
}

const TYPE_CONFIG: any = {
    history: { icon: 'fa-fingerprint', color: 'from-amber-500/10 to-orange-950/40', text: 'Registro Histórico' },
    food: { icon: 'fa-microscope', color: 'from-emerald-500/10 to-teal-950/40', text: 'Análisis Gastro' },
    art: { icon: 'fa-eye', color: 'from-purple-500/10 to-indigo-950/40', text: 'Visión Estética' },
    culture: { icon: 'fa-network-wired', color: 'from-blue-500/10 to-cyan-950/40', text: 'Dinámica Social' }
};

export const CityCard: React.FC<CityCardProps> = ({ name, type, description, onClick }) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.history;

  return (
    <div 
      onClick={onClick}
      className="group relative h-56 rounded-[2.5rem] bg-slate-900 border border-white/5 p-6 flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-800 hover:border-purple-500/50 hover:scale-[1.01] shadow-2xl overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
      
      <div className="relative z-10 flex justify-between items-start">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl text-white shadow-inner">
              <i className={`fas ${config.icon}`}></i>
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-purple-500/60">{config.text}</span>
      </div>

      <div className="relative z-10">
          <h3 className="text-3xl font-heading font-black text-white leading-tight mb-1 tracking-tighter uppercase">{name}</h3>
          <p className="text-[9px] font-bold text-slate-500 line-clamp-2 uppercase tracking-widest">{description}</p>
      </div>

      <div className="absolute -bottom-6 -right-6 text-white/5 text-8xl transform -rotate-12 transition-transform group-hover:scale-110 group-hover:-rotate-3">
          <i className={`fas ${config.icon}`}></i>
      </div>
      
      {/* Indicador de Escaneo */}
      <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/20 overflow-hidden">
          <div className="w-1/3 h-full bg-purple-500 animate-scan"></div>
      </div>
    </div>
  );
};
