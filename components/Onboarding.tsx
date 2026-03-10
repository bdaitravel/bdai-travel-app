import React, { useState } from 'react';
import { UserProfile } from '../types';
import { BdaiLogo } from './BdaiLogo';
import { RANKS } from '../services/gamificationService';

interface OnboardingProps {
  user: UserProfile;
  language?: string;
  onComplete: () => void;
}

const STEPS = ['welcome','what_is_bdai','meet_dai','how_it_works','ranks','miles','ready'] as const;
type Step = typeof STEPS[number];

export const Onboarding: React.FC<OnboardingProps> = ({ user, language = 'es', onComplete }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [isExiting, setIsExiting] = useState(false);
  const currentIndex = STEPS.indexOf(step);
  const isLast = currentIndex === STEPS.length - 1;

  const next = () => { if (isLast) { handleComplete(); return; } setStep(STEPS[currentIndex + 1]); };
  const prev = () => { if (currentIndex > 0) setStep(STEPS[currentIndex - 1]); };
  const handleComplete = () => { setIsExiting(true); setTimeout(onComplete, 300); };

  const firstName = user.firstName || user.username || 'Viajero';

  const content: Record<Step, React.ReactNode> = {
    welcome: (
      <div className="flex flex-col items-center text-center">
        <BdaiLogo className="w-28 h-28 mb-6 animate-pulse-logo" />
        <h1 className="text-7xl font-black text-white lowercase tracking-tighter leading-none mb-3">bdai</h1>
        <p className="text-purple-400 text-[11px] uppercase tracking-widest mb-8">better destinations by ai</p>
        <div className="bg-white/5 border border-white/10 rounded-3xl px-8 py-6 max-w-xs">
          <p className="text-white font-black text-lg mb-2">Hola, {firstName} 👋</p>
          <p className="text-slate-400 text-[13px] leading-relaxed">Bienvenido a la guía de viajes más sarcástica, inteligente y no-turística del planeta.</p>
        </div>
      </div>
    ),
    what_is_bdai: (
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="text-6xl">🌍</div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">¿Qué es bdai?</h2>
          <p className="text-purple-400 text-[10px] uppercase tracking-widest">Better Destinations AI</p>
        </div>
        <div className="space-y-3 w-full max-w-sm text-left">
          {[
            { icon: '🧠', title: 'IA con personalidad', desc: 'No somos Wikipedia. DAI conoce los secretos que los guías no cuentan.' },
            { icon: '🗺️', title: 'Tours únicos', desc: '3 rutas temáticas por ciudad, con 10+ paradas. Regenerables ilimitado.' },
            { icon: '🎯', title: 'Solo lo real', desc: 'Sin inventos. Sin patrocinados. Solo lugares reales y datos verificados.' },
            { icon: '🏆', title: 'Gamificado', desc: 'Gana millas, sube de rango y colecciona insignias explorando.' },
          ].map(item => (
            <div key={item.title} className="flex gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div><p className="text-white font-black text-[12px] uppercase mb-1">{item.title}</p><p className="text-slate-400 text-[11px] leading-relaxed">{item.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    ),
    meet_dai: (
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="w-28 h-28 bg-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/40 border-4 border-white/20">
          <i className="fas fa-brain text-5xl text-white"></i>
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">Conoce a DAI</h2>
          <p className="text-purple-400 text-[10px] uppercase tracking-widest">Tu guía de IA con actitud</p>
        </div>
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-3xl p-5 max-w-sm text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center"><i className="fas fa-brain text-white text-[10px]"></i></div>
            <span className="text-purple-300 font-black text-[10px] uppercase tracking-widest">DAI dice:</span>
          </div>
          <p className="text-slate-300 text-[13px] leading-relaxed italic">"Bienvenido, {firstName}. Conozco cada callejón, cada secreto y cada vergüenza histórica de cada ciudad. Los guías te llevan donde quieren. Yo te llevo donde deberías ir."</p>
        </div>
        <div className="space-y-2 w-full max-w-sm text-left">
          {[['🎭','Sarcástico pero preciso — nunca inventa'],['📚','Historia, arquitectura, arte y gastronomía'],['🗣️','16 idiomas — habla el tuyo'],['🔊','Audioguía con voz propia']].map(([icon,text]) => (
            <div key={text} className="flex items-center gap-3 text-slate-400 text-[12px]"><span>{icon}</span><span>{text}</span></div>
          ))}
        </div>
      </div>
    ),
    how_it_works: (
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="text-5xl">⚡</div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">Cómo funciona</h2>
          <p className="text-slate-400 text-[11px]">3 pasos para descubrir cualquier ciudad</p>
        </div>
        <div className="space-y-3 w-full max-w-sm">
          {[
            { num:'01', title:'Busca una ciudad', desc:'Cualquier ciudad del mundo. DAI la conoce casi todas.', icon:'fa-search' },
            { num:'02', title:'DAI genera 3 tours', desc:'3 rutas temáticas con 10+ paradas. Aparecen conforme se generan.', icon:'fa-brain' },
            { num:'03', title:'Explora y gana', desc:'Sigue la ruta en el mapa, escucha el audio y gana millas en cada parada.', icon:'fa-map-location-dot' },
          ].map(s => (
            <div key={s.num} className="flex gap-4 bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-left">
              <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center shrink-0"><span className="text-purple-400 font-black text-[10px]">{s.num}</span></div>
              <div><p className="text-white font-black text-[12px] uppercase mb-1">{s.title}</p><p className="text-slate-400 text-[11px] leading-relaxed">{s.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    ),
    ranks: (
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="text-5xl">👑</div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">Tu rango</h2>
          <p className="text-slate-400 text-[11px]">De ZERO a ZENITH — ¿dónde llegarás?</p>
        </div>
        <div className="w-full max-w-sm space-y-2">
          {RANKS.map(rank => (
            <div key={rank.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-xl w-8 text-center">{rank.icon}</span>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[11px] uppercase" style={{ color: rank.color }}>{rank.label}</span>
                  {rank.id === 'ZERO' && <span className="text-[8px] bg-purple-600/30 text-purple-300 rounded-full px-2 py-0.5 font-black">TÚ AHORA</span>}
                </div>
                <p className="text-slate-500 text-[10px]">{rank.description}</p>
              </div>
              <span className="text-[9px] text-slate-600 font-black">{rank.minMiles.toLocaleString()}mi</span>
            </div>
          ))}
        </div>
      </div>
    ),
    miles: (
      <div className="flex flex-col items-center text-center space-y-5">
        <div className="text-5xl">🪙</div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">Millas bdai</h2>
          <p className="text-slate-400 text-[11px]">Gana explorando. Sube de rango.</p>
        </div>
        <div className="space-y-2 w-full max-w-sm">
          {[
            { action:'Visitar una parada',    miles:'+10',   icon:'fa-map-pin',        color:'#6366f1' },
            { action:'Foto en una parada',    miles:'+50',   icon:'fa-camera',         color:'#007AFF' },
            { action:'Completar un tour',     miles:'+200',  icon:'fa-flag-checkered', color:'#34C759' },
            { action:'Primera vez en ciudad', miles:'+500',  icon:'fa-city',           color:'#f59e0b' },
            { action:'Racha diaria',          miles:'+100',  icon:'fa-fire',           color:'#FF6B35' },
            { action:'Invitar un amigo',      miles:'+1000', icon:'fa-user-plus',      color:'#AF52DE' },
          ].map(item => (
            <div key={item.action} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.color+'20' }}>
                <i className={`fas ${item.icon} text-sm`} style={{ color: item.color }}></i>
              </div>
              <span className="text-slate-300 text-[12px] flex-1 text-left">{item.action}</span>
              <span className="font-black text-[13px]" style={{ color: item.color }}>{item.miles}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    ready: (
      <div className="flex flex-col items-center text-center space-y-7">
        <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-purple-900 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50 border-4 border-white/20">
          <i className="fas fa-rocket text-5xl text-white"></i>
        </div>
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">¡Listo, {firstName}!</h2>
          <p className="text-slate-400 text-[13px] leading-relaxed max-w-xs">Empiezas en rango <strong className="text-purple-400">ZERO</strong>. El mundo está esperando. DAI también.</p>
        </div>
        <div className="bg-purple-600/10 border border-purple-500/30 rounded-3xl px-6 py-5 max-w-xs">
          <p className="text-slate-300 text-[13px] italic leading-relaxed">"Cero millas. Cero tours. Cero excusas. Busca tu primera ciudad."</p>
          <p className="text-purple-400 font-black text-[10px] mt-2 uppercase tracking-widest">— DAI</p>
        </div>
        <p className="text-slate-600 text-[10px]">Al continuar aceptas nuestros Términos y Política de Privacidad</p>
      </div>
    ),
  };

  return (
    <div className={`fixed inset-0 z-[9997] bg-[#020617] flex flex-col transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="h-0.5 bg-white/5 w-full">
        <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500" style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }} />
      </div>
      <div className="flex justify-center gap-1.5 pt-4 pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 h-1.5 bg-purple-500' : i < currentIndex ? 'w-1.5 h-1.5 bg-purple-500/40' : 'w-1.5 h-1.5 bg-white/10'}`} />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm animate-fade-in" key={step}>{content[step]}</div>
      </div>
      <div className="px-6 pb-8 flex gap-3">
        {currentIndex > 0 && (
          <button onClick={prev} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center active:scale-90 transition-all">
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
        )}
        <button onClick={next} className="flex-1 h-14 bg-purple-600 text-white rounded-2xl font-black lowercase text-[12px] tracking-widest shadow-xl shadow-purple-500/30 active:scale-95 transition-all flex items-center justify-center gap-2">
          {isLast ? <><i className="fas fa-rocket text-sm"></i> ¡Empezar!</> : <>Siguiente <i className="fas fa-arrow-right text-sm"></i></>}
        </button>
        {!isLast && (
          <button onClick={handleComplete} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-slate-600 flex items-center justify-center text-[9px] font-black uppercase active:scale-90 transition-all">Skip</button>
        )}
      </div>
    </div>
  );
};

