
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

interface ShareableVisaProps {
  cityName: string;
  milesEarned: number;
  stampDate: string;
  onClose?: () => void;
}

/**
 * ShareableVisa: A Tech-Noir aesthetic component that generates an image 
 * of a completed travel mission and shares it using the Web Share API.
 */
export const ShareableVisa: React.FC<ShareableVisaProps> = ({ 
  cityName, 
  milesEarned, 
  stampDate,
  onClose 
}) => {
  const visaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (!visaRef.current) return;
    
    setIsGenerating(true);
    try {
      // Capture the component as a canvas
      const canvas = await html2canvas(visaRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#020617',
        logging: false,
        useCORS: true
      });

      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png', 1.0)
      );

      if (!blob) throw new Error("Canvas to Blob failed");

      const file = new File([blob], `bdai-visa-${cityName.toLowerCase()}.png`, { type: 'image/png' });

      // Native Share check
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `BDAI Passport - ${cityName}`,
          text: `Just conquered ${cityName} with bdai.travel! 🚀 #TravelTech #AI #NómadaDigital`,
        });
      } else {
        // Fallback for desktop: Download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bdai-visa-${cityName}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Sharing failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      
      {/* CAPTURE ZONE (The Visual Visa) */}
      <div 
        ref={visaRef}
        className="w-full max-w-[340px] aspect-[4/5] rounded-[3rem] bg-slate-950 border-4 border-slate-900 shadow-2xl relative overflow-hidden flex flex-col p-8 select-none"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-950 to-cyan-900/10 opacity-60"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30"></div>
        
        {/* Header */}
        <div className="relative z-10 flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-purple-500 mb-1">Status Report</span>
            <span className="text-xl font-black text-white italic tracking-tighter">MISSION ACCOMPLISHED</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <i className="fas fa-shield-halved text-purple-400 text-sm"></i>
          </div>
        </div>

        {/* City Name - The Hero */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2">Location Identity</p>
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none break-words">
            {cityName}
          </h2>
          <div className="w-12 h-1 bg-cyan-400 mt-4 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
        </div>

        {/* Stats & Reward */}
        <div className="relative z-10 mb-8 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Protocol Reward</p>
              <p className="text-2xl font-black text-cyan-400">+{milesEarned} <span className="text-[10px] text-slate-400">MI</span></p>
            </div>
            <i className="fas fa-bolt-lightning text-cyan-400/50 text-xl"></i>
          </div>
        </div>

        {/* Footer & Stamp */}
        <div className="relative z-10 flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Verified by</p>
            <p className="text-[10px] font-black text-white tracking-tighter">bdai.travel/intel</p>
          </div>
          
          {/* Circular Stamp */}
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-purple-500/30 flex flex-col items-center justify-center p-2 transform rotate-12 bg-purple-500/5 shadow-inner">
             <span className="text-[6px] font-black text-purple-400 uppercase tracking-tighter">AUTHENTIC</span>
             <span className="text-[8px] font-black text-white uppercase border-y border-purple-500/30 my-1 px-1">{stampDate}</span>
             <span className="text-[5px] font-black text-purple-500/40 uppercase">BDAI_GEN_7</span>
          </div>
        </div>

        {/* Decorative Scanners */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500/20 overflow-hidden">
          <div className="w-1/3 h-full bg-purple-500 animate-scan"></div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="mt-10 w-full max-w-[340px] space-y-4">
        <button 
          onClick={handleShare}
          disabled={isGenerating}
          className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-[0_10px_30px_rgba(147,51,234,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Syncing Image...
            </>
          ) : (
            <>
              <i className="fas fa-share-nodes"></i>
              Share to Social
            </>
          )}
        </button>

        <button 
          onClick={onClose}
          className="w-full py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest"
        >
          Not now
        </button>
      </div>

      {/* Bottom Legal/Tagline */}
      <p className="absolute bottom-8 text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">
        Better Destinations by AI // {new Date().getFullYear()}
      </p>
    </div>
  );
};
