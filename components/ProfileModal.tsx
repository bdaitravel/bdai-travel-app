import React, { useState } from 'react';
import { UserProfile, LeaderboardEntry, LANGUAGES } from '../types';

interface ProfileModalProps {
  user: UserProfile | LeaderboardEntry;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      name: user.name,
      username: user.username || '',
      bio: (user as any).bio || '',
      city: (user as any).city || '',
      language: (user as any).language || 'es'
  });

  const badges = user.badges || [];
  const visitedCities = (user as any).visitedCities || [];
  const rank = (user as any).rank || 'Turista';
  
  // Specific Points (Fallback to 0 if not present in mock leaderboard data)
  const photoPoints = (user as any).photoPoints || 0;
  const foodPoints = (user as any).foodPoints || 0;
  const culturePoints = (user as any).culturePoints || 0;

  const handleSave = () => {
      if (onUpdateUser && isOwnProfile) {
          onUpdateUser({
              ...(user as UserProfile),
              name: editForm.name,
              username: editForm.username,
              bio: editForm.bio,
              city: editForm.city,
              language: editForm.language
          });
          setIsEditing(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white/90 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative z-10 transform transition-all scale-100 border border-white/40 max-h-[90vh] overflow-y-auto custom-scrollbar font-sans">
        {/* Header / Cover */}
        <div className="h-32 bg-gradient-to-br from-slate-800 to-black relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur transition-colors z-20"
          >
            <i className="fas fa-times"></i>
          </button>
          {isOwnProfile && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute top-4 left-4 px-3 py-1 bg-white/20 hover:bg-white/40 text-white rounded-full text-xs font-bold backdrop-blur transition-colors z-20 border border-white/30"
              >
                <i className="fas fa-edit mr-1"></i> Edit Passport
              </button>
          )}
          {isEditing && (
              <button 
                onClick={handleSave}
                className="absolute top-4 left-4 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-bold shadow-lg transition-colors z-20"
              >
                <i className="fas fa-check mr-1"></i> Save
              </button>
          )}
          <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '15px 15px'}}></div>
        </div>

        {/* Avatar & Basic Info */}
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-24 h-24 rounded-full border-[5px] border-white shadow-xl object-cover bg-slate-200"
            />
            <div className="flex flex-col items-end">
                {isOwnProfile && !isEditing && (
                  <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md mb-2">
                    You
                  </span>
                )}
                <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">
                    {rank}
                </span>
            </div>
          </div>

          <div className="mb-6">
            {isEditing ? (
                <div className="space-y-3">
                    <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-lg font-bold"
                        placeholder="Your Name"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                            type="text" 
                            value={editForm.username} 
                            onChange={e => setEditForm({...editForm, username: e.target.value})}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm text-purple-600 font-bold"
                            placeholder="@username"
                        />
                        <select 
                            value={editForm.language}
                            onChange={e => setEditForm({...editForm, language: e.target.value})}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold bg-white"
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.code} value={l.code}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-3xl font-heading font-bold text-slate-900 leading-none mb-1 tracking-tight">{user.name}</h2>
                    <p className="text-purple-600 font-bold text-sm">@{user.username || user.name.toLowerCase().replace(/\s/g, '')}</p>
                </>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
             <div className="text-center">
               <span className="block text-xl font-heading font-bold text-slate-800">{user.miles.toLocaleString()}</span>
               <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Miles</span>
             </div>
             <div className="text-center border-l border-slate-200">
               <span className="block text-xl font-heading font-bold text-slate-800">{badges.length}</span>
               <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Badges</span>
             </div>
             <div className="text-center border-l border-slate-200">
               <span className="block text-xl font-heading font-bold text-slate-800">{visitedCities.length}</span>
               <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cities</span>
             </div>
          </div>

           {/* Granular Points Row */}
           <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-pink-50 p-2 rounded-xl text-center border border-pink-100">
                    <i className="fas fa-camera text-pink-400 mb-1"></i>
                    <p className="font-bold text-slate-700 text-sm">{photoPoints}</p>
                    <p className="text-[7px] font-bold uppercase text-pink-400">Photo</p>
                </div>
                <div className="bg-orange-50 p-2 rounded-xl text-center border border-orange-100">
                    <i className="fas fa-utensils text-orange-400 mb-1"></i>
                    <p className="font-bold text-slate-700 text-sm">{foodPoints}</p>
                    <p className="text-[7px] font-bold uppercase text-orange-400">Food</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl text-center border border-blue-100">
                    <i className="fas fa-landmark text-blue-400 mb-1"></i>
                    <p className="font-bold text-slate-700 text-sm">{culturePoints}</p>
                    <p className="text-[7px] font-bold uppercase text-blue-400">Culture</p>
                </div>
           </div>

          {/* Details */}
          <div className="space-y-5 mb-6">
             <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-sm border border-slate-100">
                 <i className="fas fa-map-marker-alt"></i>
               </div>
               <div className="flex-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Base Camp</p>
                 {isEditing ? (
                     <input 
                        type="text" 
                        value={editForm.city} 
                        onChange={e => setEditForm({...editForm, city: e.target.value})}
                        className="w-full p-1 border border-slate-300 rounded text-sm"
                        placeholder="e.g. Madrid, Spain"
                     />
                 ) : (
                    <p className="font-bold text-slate-800 text-lg leading-tight">
                        {/* Fix: casting user to any as city is only in UserProfile */}
                        {(user as any).city || 'World Citizen'}
                    </p>
                 )}
               </div>
             </div>

             <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0 shadow-sm border border-slate-100">
                 <i className="fas fa-quote-left"></i>
               </div>
               <div className="flex-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Manifesto</p>
                 {isEditing ? (
                     <textarea 
                        value={editForm.bio} 
                        onChange={e => setEditForm({...editForm, bio: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                        placeholder="Your travel philosophy..."
                        rows={2}
                     />
                 ) : (
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {/* Fix: casting user to any as bio is only in UserProfile */}
                        "{(user as any).bio || 'Ready to explore.'}"
                    </p>
                 )}
               </div>
             </div>
          </div>

          {/* Visited Cities (NEW) */}
          {visitedCities.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Visa Stamps</p>
                <div className="flex flex-wrap gap-2">
                    {visitedCities.map((city: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100 flex items-center gap-1">
                            <i className="fas fa-check-circle text-[10px]"></i> {city}
                        </span>
                    ))}
                </div>
              </div>
          )}

          {/* Badges Preview */}
          {badges.length > 0 && (
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Trophy Case</p>
                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                  {badges.map((b: any, i: number) => (
                    <div key={i} className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center text-yellow-600 shadow-sm border border-yellow-100 flex-shrink-0 text-lg group relative" title={b.name}>
                       <i className={`fas ${b.icon}`}></i>
                       <span className="absolute -bottom-6 text-[8px] bg-black text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">{b.name}</span>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};