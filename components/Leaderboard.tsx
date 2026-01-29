
import React from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  currentUser: LeaderboardEntry;
  entries: LeaderboardEntry[];
  onUserClick: (entry: LeaderboardEntry) => void;
  language: string;
}

const TEXTS: any = {
    en: { title: "Elite Travelers", you: "Your Status", subtitle: "Global explorer rankings" },
    es: { title: "Ranking Global", you: "Tu Estado", subtitle: "Exploradores de élite" },
    pt: { title: "Ranking Global", you: "Seu Status", subtitle: "Exploradores de elite" },
    it: { title: "Classifica Mondiale", you: "Tuo Stato", subtitle: "Esploratori d'élite" },
    ru: { title: "Рейтинг", you: "Ваш статус", subtitle: "Элитные исследователи" },
    hi: { title: "वैश्विक रैंकिंग", you: "आपकी स्थिति", subtitle: "अभिजात वर्ग के खोजकर्ता" },
    fr: { title: "Classement Mondial", you: "Votre Statut", subtitle: "Voyageurs d'élite" },
    de: { title: "Bestenliste", you: "Dein Status", subtitle: "Globale Entdecker-Rankings" },
    ja: { title: "リーダーボード", you: "あなたのステータス", subtitle: "エリート探検家" },
    zh: { title: "全球排行榜", you: "您的状态", subtitle: "精英探险家" },
    ca: { title: "Ranking Global", you: "El Teu Estat", subtitle: "Exploradors d'elit" },
    eu: { title: "Sailkapen Orokorra", you: "Zure Egoera", subtitle: "Esploratzaile eliteak" }
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser, entries, onUserClick, language }) => {
  const t = TEXTS[language] || TEXTS['es'];
  const sorted = [...entries].sort((a, b) => b.miles - a.miles);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="w-full h-full pb-24 animate-fade-in flex flex-col pt-12 bg-slate-950 overflow-y-auto no-scrollbar">
        <div className="text-center mb-12 px-6">
            <h2 className="text-5xl font-black text-white lowercase tracking-tighter mb-2">{t.title}</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 opacity-60">{t.subtitle}</p>
        </div>
        <div className="flex justify-center items-end gap-3 mb-16 px-6 h-80 relative">
            {top3[1] && (
                <div className="flex flex-col items-center w-28 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="relative mb-4 group cursor-pointer" onClick={() => onUserClick(top3[1])}>
                        <img src={top3[1].avatar} className="w-18 h-18 rounded-[2rem] border-2 border-slate-400/50 object-cover shadow-2xl relative z-10" />
                        <div className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-slate-400 text-slate-950 flex items-center justify-center text-[11px] font-black border-4 border-slate-950 z-20 shadow-lg">2</div>
                    </div>
                    <div className="w-full h-28 bg-white/5 border border-white/10 rounded-t-[2rem] flex flex-col items-center justify-center p-3 backdrop-blur-md shadow-2xl">
                        <p className="text-[10px] font-black truncate w-full text-center text-slate-200">{top3[1].name}</p>
                        <p className="text-[9px] text-purple-400 font-bold">{top3[1].miles.toLocaleString()}m</p>
                    </div>
                </div>
            )}
            {top3[0] && (
                <div className="flex flex-col items-center w-32 z-10 animate-slide-up">
                    <div className="relative mb-6 group cursor-pointer" onClick={() => onUserClick(top3[0])}>
                        <img src={top3[0].avatar} className="w-24 h-24 rounded-[2.5rem] border-4 border-yellow-500 object-cover shadow-[0_0_40px_rgba(234,179,8,0.4)] relative z-10" />
                        <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-yellow-500 text-yellow-950 flex items-center justify-center text-sm font-black border-4 border-slate-950 z-20 shadow-xl">1</div>
                    </div>
                    <div className="w-full h-40 bg-gradient-to-b from-purple-600/30 to-slate-900/80 border border-purple-500/40 rounded-t-[2.5rem] flex flex-col items-center justify-center p-4 backdrop-blur-2xl shadow-2xl">
                        <p className="text-xs font-black truncate w-full text-center mb-1 text-white">{top3[0].name}</p>
                        <p className="text-[11px] text-yellow-400 font-black tracking-widest">{top3[0].miles.toLocaleString()} MILES</p>
                    </div>
                </div>
            )}
            {top3[2] && (
                <div className="flex flex-col items-center w-28 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="relative mb-4 group cursor-pointer" onClick={() => onUserClick(top3[2])}>
                        <img src={top3[2].avatar} className="w-18 h-18 rounded-[2rem] border-2 border-amber-700/50 object-cover shadow-2xl relative z-10" />
                        <div className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center text-[11px] font-black border-4 border-slate-950 z-20 shadow-lg">3</div>
                    </div>
                    <div className="w-full h-20 bg-white/5 border border-white/10 rounded-t-[2rem] flex flex-col items-center justify-center p-3 backdrop-blur-md shadow-2xl">
                        <p className="text-[10px] font-black truncate w-full text-center text-slate-200">{top3[2].name}</p>
                        <p className="text-[9px] text-purple-400 font-bold">{top3[2].miles.toLocaleString()}m</p>
                    </div>
                </div>
            )}
        </div>
        <div className="flex-1 px-6 space-y-3 pb-10">
            {rest.map((user, idx) => (
                <div key={user.id} onClick={() => onUserClick(user)} className="flex items-center p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                    <span className="w-10 text-sm font-black text-slate-600 group-hover:text-purple-400">{idx + 4}</span>
                    <img src={user.avatar} className="w-12 h-12 rounded-2xl border border-white/10 object-cover" />
                    <div className="ml-5 flex-1">
                        <p className="font-black text-sm text-slate-100">{user.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{user.miles.toLocaleString()} miles</p>
                    </div>
                    <i className="fas fa-chevron-right text-[10px] text-slate-700"></i>
                </div>
            ))}
        </div>
        <div className="px-6 mt-2 pb-6">
            <div className="bg-purple-600 p-6 rounded-[3rem] flex items-center shadow-2xl border border-white/20">
                <div className="relative shrink-0">
                    <img src={currentUser.avatar} className="w-14 h-14 rounded-3xl border-2 border-white/30 object-cover" />
                </div>
                <div className="ml-5 flex-1 min-w-0">
                    <p className="font-black text-base uppercase text-white truncate">{t.you}</p>
                    <p className="text-[11px] font-bold text-purple-100 truncate">{currentUser.miles.toLocaleString()} miles</p>
                </div>
                <div className="w-14 h-14 rounded-3xl bg-white/20 flex items-center justify-center text-3xl shrink-0">🗺️</div>
            </div>
        </div>
    </div>
  );
};
