import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { toast } from './Toast';
import { BdaiLogo } from './BdaiLogo';
import { Badge } from '../types';

interface ShareableBadgeProps {
  rank?: string;
  miles?: number;
  badge?: Badge;
  badgeDescription?: string;
  onClose: () => void;
  pt: (key: string) => string;
}

export const ShareableBadge: React.FC<ShareableBadgeProps> = ({ rank, miles, badge, badgeDescription, onClose, pt }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleShare = async () => {
    if (!badgeRef.current || isGenerating) return;
    setIsGenerating(true);
    setStatusText(pt('minting') || '🎨 MINTING BADGE...');

    try {
      await new Promise(r => setTimeout(r, 300));

      const dataUrl = await htmlToImage.toPng(badgeRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const fileName = badge ? `bdai-badge-${badge.name.toLowerCase().replace(/\s+/g, '-')}.png` : `bdai-rank-${rank?.toLowerCase().replace(/\s+/g, '-')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      setStatusText(pt('transmitting') || '🛰️ TRANSMITTING...');

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: badge ? `BDAI Badge - ${badge.name}` : `BDAI Rank - ${rank}`,
            text: badge ? `I just earned the ${badge.name} badge on @bdai.travel! 🌍✨` : `I just reached ${rank} rank with ${miles?.toLocaleString()} miles on @bdai.travel! 🌍✨`,
          });
          setStatusText(pt('readyToShare') || '✅ READY TO SHARE');
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') {
            setStatusText('');
          } else {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            a.click();
            toast(pt('badgeSaved') || "📸 ¡Insignia guardada en Fotos! Abre Instagram o TikTok para compartirla. ✨", "success");
            setStatusText(pt('readyToShare') || '✅ READY TO SHARE');
          }
        }
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.click();
        toast(pt('badgeDownloaded') || "📸 ¡Insignia descargada! Compártela en tus redes. ✨", "success");
        setStatusText(pt('readyToShare') || '✅ READY TO SHARE');
      }
    } catch (error) {
      console.error("Error generating badge:", error);
      toast(pt('errorGenerating') || "Error generating image", "error");
      setStatusText('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md z-[999999]">
      <div className="w-full max-w-[340px] flex flex-col items-center">
        
        {/* The Shareable Card */}
        <div 
          ref={badgeRef}
          data-badge-container
          className="w-full bg-slate-950 border-4 border-slate-900 rounded-[3rem] p-8 relative overflow-hidden flex flex-col items-center mb-6 shadow-2xl"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950 opacity-90"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60"></div>
          
          {/* bdai Logo */}
          <div className="relative z-10 w-full flex justify-between items-start mb-8">
            <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase tracking-[0.4em] text-purple-400 mb-1">ACHIEVEMENT_UNLOCKED</span>
              <span className="text-xs font-black text-white italic tracking-tighter">B-DAI_SYS</span>
            </div>
            <BdaiLogo className="h-4 text-purple-400 drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]" />
          </div>

          <div className="relative z-10 w-32 h-32 rounded-full bg-slate-900 flex items-center justify-center shadow-[0_0_50px_rgba(147,51,234,0.4)] mb-8 border-4 border-double border-purple-500/50 relative">
            <div className="absolute inset-0 rounded-full border border-purple-400/20 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-inner">
              <i className={`fas ${badge ? badge.icon : 'fa-crown'} text-5xl text-white drop-shadow-lg`}></i>
            </div>
          </div>
          
          <div className="relative z-10 w-full flex flex-col items-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2 text-center">
              {badge ? (badge.category === 'rank' ? pt('rankBadge') || 'Rank Badge' : pt('achievementBadge') || 'Achievement') : pt('currentStatus') || 'Current Status'}
            </p>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 text-center leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {badge ? badge.name : rank}
            </h3>
            <div className="w-16 h-1 bg-cyan-400 mx-auto mb-6 shadow-[0_0_15px_rgba(34,211,238,0.6)]"></div>
          </div>
          
          {badge && badgeDescription && (
            <div className="relative z-10 w-full p-4 bg-purple-900/20 border border-purple-500/30 rounded-2xl backdrop-blur-md shadow-inner mb-4">
              <p className="text-xs font-bold text-purple-200 text-center">
                {badgeDescription}
              </p>
            </div>
          )}

          {!badge && miles !== undefined && (
            <div className="relative z-10 w-full p-5 bg-purple-900/20 border border-purple-500/30 rounded-2xl backdrop-blur-md shadow-inner flex flex-col items-center mb-4">
               <p className="text-[9px] font-black text-purple-300/70 uppercase tracking-widest mb-1">{pt('totalDistance') || 'Total Distance'}</p>
               <p className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                 {miles.toLocaleString()} <span className="text-[12px] text-cyan-400/50 uppercase">{pt('miles') || 'Miles'}</span>
               </p>
            </div>
          )}
          
          {/* Watermark */}
          <div className="relative z-10 mt-2 text-[6px] font-black text-slate-600 tracking-[0.4em] uppercase w-full text-center">
            VERIFIED BY BDAI.TRAVEL
          </div>
        </div>

        {/* Action Buttons (Not captured in image) */}
        <button 
          onClick={handleShare} 
          disabled={isGenerating}
          className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all mb-4 disabled:opacity-50 disabled:active:scale-100"
        >
          {isGenerating ? (
            <span className="animate-pulse">{statusText}</span>
          ) : (
            <><i className="fas fa-paper-plane mr-2"></i> {pt('confirmShare') || 'Confirm & Share'}</>
          )}
        </button>
        <button 
          onClick={onClose} 
          disabled={isGenerating}
          className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
        >
          {pt('cancel') || 'Cancel'}
        </button>
      </div>
    </div>
  );
};
