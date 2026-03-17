
import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { UserProfile } from '../types';

interface VisaShareProps {
  user: UserProfile;
  cityName: string;
  milesEarned: number;
  onClose: () => void;
}

const RANK_THEMES: Record<string, { bg: string, accent: string, text: string }> = {
  'ZERO': { bg: 'bg-slate-700', accent: 'text-slate-300', text: 'text-white' },
  'SCOUT': { bg: 'bg-emerald-600', accent: 'text-emerald-200', text: 'text-white' },
  'ROVER': { bg: 'bg-blue-600', accent: 'text-blue-200', text: 'text-white' },
  'TITAN': { bg: 'bg-purple-700', accent: 'text-purple-200', text: 'text-white' },
  'ZENITH': { bg: 'bg-amber-500', accent: 'text-amber-100', text: 'text-slate-900' },
};

export const VisaShare: React.FC<VisaShareProps> = ({ user, cityName, milesEarned, onClose }) => {
  const visaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const theme = RANK_THEMES[user.rank] || RANK_THEMES['ZERO'];

  const handleShare = async () => {
    if (!visaRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await htmlToImage.toPng(visaRef.current, {
        quality: 1,
        pixelRatio: 3,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `bdai-visa-${cityName.toLowerCase()}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: `bdai Visa - ${cityName}`,
          text: `Just conquered ${cityName}! My rank is ${user.rank}. #bdai #travel`,
        });
      } else {
        const link = document.createElement('a');
        link.download = `bdai-visa-${cityName.toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Error generating visa:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
      <div 
        ref={visaRef}
        className={`w-full max-w-[320px] aspect-[9/16] ${theme.bg} rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden shadow-2xl`}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex flex-col">
            <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${theme.accent}`}>Official Visa</span>
            <h1 className={`text-2xl font-black italic tracking-tighter ${theme.text}`}>bdai</h1>
          </div>
          <div className={`w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center`}>
            <i className={`fas fa-passport ${theme.text} text-xl`}></i>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center py-10">
          <p className={`text-[10px] font-black uppercase tracking-[0.5em] mb-2 ${theme.accent} opacity-60`}>Destination</p>
          <h2 className={`text-5xl font-black uppercase tracking-tighter leading-none break-words ${theme.text}`}>
            {cityName}
          </h2>
          <div className={`w-16 h-2 bg-white/30 mt-6 rounded-full`}></div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-3xl">
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-[8px] font-black uppercase tracking-widest ${theme.accent} opacity-60`}>Traveler</p>
                <p className={`text-lg font-black ${theme.text}`}>{user.firstName} {user.lastName}</p>
                <p className={`text-[7px] font-bold uppercase tracking-widest ${theme.accent} opacity-40 mt-0.5`}>{user.country}</p>
              </div>
              <div className="text-right">
                <p className={`text-[8px] font-black uppercase tracking-widest ${theme.accent} opacity-60`}>Rank</p>
                <p className={`text-lg font-black ${theme.text}`}>{user.rank}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className={`text-[8px] font-black uppercase tracking-widest ${theme.accent} opacity-60`}>Miles Earned</p>
              <p className={`text-3xl font-black ${theme.text}`}>+{milesEarned}</p>
            </div>
            <div className="text-right">
              <p className={`text-[8px] font-black uppercase tracking-widest ${theme.accent} opacity-60`}>Date</p>
              <p className={`text-xs font-black ${theme.text}`}>{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div className="h-full bg-white/40 animate-scan"></div>
        </div>
      </div>

      <div className="mt-10 w-full max-w-[320px] space-y-3">
        <button 
          onClick={handleShare}
          disabled={isGenerating}
          className="w-full py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <i className="fas fa-share-alt"></i>
          {isGenerating ? 'Generating...' : 'Share Visa'}
        </button>
        <button 
          onClick={onClose}
          className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
