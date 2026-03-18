import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { toast } from './Toast';
import { BdaiLogo } from './BdaiLogo';

interface ShareableBadgeProps {
  rank: string;
  miles: number;
  onClose: () => void;
}

export const ShareableBadge: React.FC<ShareableBadgeProps> = ({ rank, miles, onClose }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleShare = async () => {
    if (!badgeRef.current || isGenerating) return;
    setIsGenerating(true);
    setStatusText('🎨 MINTING BADGE...');

    try {
      await new Promise(r => setTimeout(r, 300));

      const dataUrl = await htmlToImage.toPng(badgeRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `bdai-rank-${rank.toLowerCase().replace(/\s+/g, '-')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      setStatusText('🛰️ TRANSMITTING...');

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `BDAI Rank - ${rank}`,
            text: `I just reached ${rank} rank with ${miles.toLocaleString()} miles on @bdai.travel! 🌍✨ #TravelTech #DigitalNomad`,
          });
          setStatusText('✅ READY TO SHARE');
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') {
            setStatusText('');
          } else {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = fileName;
            a.click();
            toast("📸 ¡Insignia guardada en Fotos! Abre Instagram o TikTok para compartirla. ✨", "success");
            setStatusText('✅ READY TO SHARE');
          }
        }
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.click();
        toast("📸 ¡Insignia descargada! Compártela en tus redes. ✨", "success");
        setStatusText('✅ READY TO SHARE');
      }
    } catch (error) {
      console.error("Error generating badge:", error);
      toast("Error generating image", "error");
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
          className="w-full bg-slate-950 border-4 border-slate-900 rounded-[3rem] p-8 relative overflow-hidden flex flex-col items-center mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-cyan-900/20"></div>
          
          {/* bdai Logo */}
          <div className="relative z-10 w-full flex justify-center mb-6 opacity-80">
            <BdaiLogo className="h-6 text-white" />
          </div>

          <div className="relative z-10 w-24 h-24 rounded-3xl bg-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(147,51,234,0.6)] mb-6 border-2 border-purple-400/50">
            <i className="fas fa-crown text-4xl text-white drop-shadow-lg"></i>
          </div>
          
          <p className="relative z-10 text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mb-2">Current Status</p>
          <h3 className="relative z-10 text-4xl font-black text-white uppercase tracking-tighter mb-6 text-center leading-none">{rank}</h3>
          
          <div className="relative z-10 w-full p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex flex-col items-center">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Distance</p>
             <p className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
               {miles.toLocaleString()} <span className="text-[12px] text-slate-400 uppercase">Miles</span>
             </p>
          </div>
          
          {/* Watermark */}
          <div className="relative z-10 mt-6 text-[8px] font-black text-slate-600 tracking-[0.3em] uppercase">
            bdai.travel
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
            <><i className="fas fa-paper-plane mr-2"></i> Confirm & Share</>
          )}
        </button>
        <button 
          onClick={onClose} 
          disabled={isGenerating}
          className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
