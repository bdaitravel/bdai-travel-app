import React from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  currentUser: LeaderboardEntry;
  entries: LeaderboardEntry[];
  onUserClick: (entry: LeaderboardEntry) => void;
  language: string;
}

const TEXTS: any = {
    en: { title: "Weekly Top Travelers", you: "You" },
    es: { title: "Ranking Semanal", you: "Tú" },
    fr: { title: "Meilleurs Voyageurs", you: "Vous" },
    de: { title: "Top Reisende", you: "Du" },
    it: { title: "Viaggiatori Top", you: "Tu" },
    pt: { title: "Melhores Viajantes", you: "Você" },
    ca: { title: "Viatgers Top Setmanals", you: "Tu" },
    eu: { title: "Asteko Bidaiari Onenak", you: "Zu" },
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser, entries, onUserClick, language }) => {
  const t = TEXTS[language] || TEXTS['en'];

  // Sort by miles
  const sorted = [...entries].sort((a, b) => b.miles - a.miles);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Helper to render the top badge
  const renderBadge = (badges: any[] | undefined) => {
    if (!badges || badges.length === 0) return null;
    const topBadge = badges[0]; // Prioritize the first badge
    return (
      <span 
        className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 text-yellow-600 rounded-full text-[10px] border border-yellow-200 ml-1" 
        title={topBadge.name}
      >
        <i className={`fas ${topBadge.icon}`}></i>
      </span>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-24 animate-fade-in p-6">
        <h2 className="text-center text-2xl font-bold text-slate-800 mb-8">{t.title}</h2>

        {/* Podium */}
        <div className="flex justify-center items-end gap-4 mb-10 px-4">
            {/* 2nd Place */}
            {top3[1] && <PodiumUser user={top3[1]} rank={2} height="h-32" color="bg-slate-200" onClick={() => onUserClick(top3[1])} />}
            {/* 1st Place */}
            {top3[0] && <PodiumUser user={top3[0]} rank={1} height="h-44" color="bg-yellow-300" onClick={() => onUserClick(top3[0])} isFirst />}
            {/* 3rd Place */}
            {top3[2] && <PodiumUser user={top3[2]} rank={3} height="h-24" color="bg-amber-600" onClick={() => onUserClick(top3[2])} />}
        </div>

        {/* List List */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 relative overflow-hidden">
            {/* Scrollable Area for other users */}
            <div className="overflow-y-auto max-h-[400px]">
                {rest.map((user, idx) => (
                    <div 
                        key={user.id} 
                        onClick={() => onUserClick(user)}
                        className="flex items-center p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                        <div className="w-8 font-bold text-slate-400 group-hover:text-purple-500">{idx + 4}</div>
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                        <div className="ml-4 flex-1">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                                {user.name} 
                                {renderBadge(user.badges)}
                                {user.isPublic && <span className="w-2 h-2 rounded-full bg-green-400 ml-2" title="Online"></span>}
                            </div>
                            <div className="text-xs text-slate-500">{user.miles.toLocaleString()} miles</div>
                        </div>
                        <i className="fas fa-chevron-right text-slate-300 group-hover:text-purple-400"></i>
                    </div>
                ))}
            </div>
            
            {/* Current User Fixed at Bottom */}
             <div 
                onClick={() => onUserClick(currentUser)}
                className="sticky bottom-0 z-10 bg-purple-50 p-4 flex items-center border-t border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
             >
                <div className="w-8 font-bold text-purple-800">-</div>
                <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full border-2 border-purple-200 object-cover" />
                 <div className="ml-4 flex-1">
                    <div className="font-bold text-purple-900 flex items-center gap-1">
                        {t.you}
                        {renderBadge(currentUser.badges)}
                    </div>
                    <div className="text-xs text-purple-600">{currentUser.miles.toLocaleString()} miles</div>
                </div>
             </div>
        </div>
    </div>
  );
};

const PodiumUser = ({ user, rank, height, color, isFirst = false, onClick }: any) => (
    <div onClick={onClick} className="flex flex-col items-center group relative cursor-pointer transition-transform hover:-translate-y-1">
        <div className="relative mb-2">
            <img 
                src={user.avatar} 
                className={`rounded-full border-4 border-white shadow-md object-cover bg-slate-200 ${isFirst ? 'w-20 h-20' : 'w-14 h-14'}`} 
            />
            {isFirst && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>}
        </div>
        <div className={`w-20 sm:w-24 ${height} ${color} rounded-t-lg shadow-inner flex flex-col justify-end pb-2 items-center group-hover:brightness-105 transition-all`}>
            <span className={`font-bold text-2xl ${rank === 1 ? 'text-yellow-800' : rank === 2 ? 'text-slate-600' : 'text-amber-100'}`}>
                {rank}
            </span>
        </div>
        <div className="absolute -bottom-6 w-24 text-center">
            <p className="text-xs font-bold text-slate-700 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-mono">{user.miles}m</p>
        </div>
    </div>
);
