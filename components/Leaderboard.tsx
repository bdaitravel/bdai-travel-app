
import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';

const MOCK_LEADERS: LeaderboardEntry[] = [
    { id: '1', name: 'Alex Rivera', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', miles: 12450, countryPoints: 14, travelerType: 'Backpacker', gender: 'M', country: 'ES' },
    { id: '2', name: 'Marta García', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marta', miles: 11200, countryPoints: 8, travelerType: 'Cultural', gender: 'F', country: 'ES' },
    { id: '3', name: 'Hiroshi T.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiro', miles: 9800, countryPoints: 22, travelerType: 'Digital Nomad', gender: 'M', country: 'JP' },
    { id: '4', name: 'Elena G.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', miles: 8400, countryPoints: 5, travelerType: 'Luxury', gender: 'F', country: 'IT' },
    { id: '5', name: 'Julio V.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julio', miles: 7200, countryPoints: 12, travelerType: 'Backpacker', gender: 'M', country: 'ES' },
];

export const Leaderboard: React.FC<{ language: string, currentUser: LeaderboardEntry }> = ({ language, currentUser }) => {
    const [filter, setFilter] = useState<'world' | 'backpacker' | 'country'>('world');
    
    const filtered = MOCK_LEADERS.filter(l => {
        if (filter === 'backpacker') return l.travelerType === 'Backpacker';
        if (filter === 'country') return l.country === 'ES'; 
        return true;
    }).sort((a, b) => b.miles - a.miles);

    return (
        <div className="p-8 animate-fade-in pb-32">
            <header className="mb-14 text-center">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 lowercase leading-none">Hall of Fame</h2>
                <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.6em]">Ranking Global de Viajeros</p>
            </header>

            <div className="flex gap-4 overflow-x-auto no-scrollbar mb-12 pb-2">
                {['world', 'backpacker', 'country'].map(f => (
                    <button key={f} onClick={() => setFilter(f as any)} className={`px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${filter === f ? 'bg-slate-950 text-white border-slate-950 shadow-2xl scale-105' : 'bg-white text-slate-300 border-slate-50 hover:border-purple-200 hover:text-slate-600'}`}>
                        {f === 'world' ? 'Mundial' : f === 'backpacker' ? 'Mochileros' : 'España'}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {filtered.map((user, i) => (
                    <div key={user.id} className={`flex items-center gap-6 p-7 rounded-[3rem] border transition-all ${i === 0 ? 'bg-amber-50 border-amber-200 shadow-2xl scale-[1.04]' : 'bg-white border-slate-50 shadow-sm hover:shadow-md'}`}>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg shadow-inner flex-shrink-0 ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-50 text-slate-400'}`}>
                            {i + 1}
                        </div>
                        <img src={user.avatar} className="w-16 h-16 rounded-full border-4 border-white shadow-xl flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-950 leading-tight uppercase text-base truncate tracking-tighter">{user.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.travelerType}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="font-black text-slate-950 text-2xl tracking-tighter leading-none">{user.miles.toLocaleString()}</p>
                            <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mt-1">Millas</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 p-10 bg-slate-950 rounded-[4rem] flex items-center gap-8 border-4 border-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/30 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
                 <img src={currentUser.avatar} className="w-20 h-20 rounded-full border-4 border-purple-500 relative z-10 shadow-2xl" alt="" />
                 <div className="flex-1 relative z-10">
                     <p className="text-white font-black leading-tight uppercase text-lg tracking-tight">Tu Posición</p>
                     <p className="text-[11px] font-black text-purple-400 uppercase tracking-[0.3em]">#120 Global</p>
                 </div>
                 <div className="text-right text-white relative z-10 flex-shrink-0">
                     <p className="font-black text-4xl tracking-tighter leading-none">Top 12%</p>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Leyenda</p>
                 </div>
            </div>
        </div>
    );
};
