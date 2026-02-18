
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
 * 
 * Optimized to handle AbortErrors (user cancellation) and ensure 
 * reliable canvas rendering.
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
      // Ensure the capture happens with clean settings
      const canvas = await html2canvas(visaRef.current, {
        scale: 3, // Even higher resolution for sharing
        backgroundColor: '#020617',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // You can modify the cloned document if needed to ensure fonts/styles load
          const el = clonedDoc.querySelector('[data-visa-container]');
          if (el) (el as HTMLElement).style.borderRadius = '3rem';
        }
      });

      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, 'image/png', 1.0)
      );

      if (!blob) throw new Error("Could not generate image blob");

      const fileName = `bdai-visa-${cityName.toLowerCase().replace(/\s+/g, '-')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Native Share logic
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `BDAI Passport - ${cityName}`,
            text: `Just conquered ${cityName} with bdai.travel! 🚀 #TravelTech #AI #NómadaDigital #WorldTraveler`,
          });
        } catch (shareError: any) {
          // Gracefully handle user cancellation
          if (shareError.name === 'AbortError') {
            console.debug("Share operation was canceled by the user.");
          } else {
            throw shareError;
          }
        }
      } else {
        // Fallback for desktop or non-supporting browsers: Download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        
        // Brief timeout before cleanup to ensure download triggers
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (error: any) {
      console.error("Visa sharing failed:", error);
      // We could add a toast or alert here if it's a real failure
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      
      {/* CAPTURE ZONE (The Visual Visa) */}
      <div 
        ref={visaRef}
        data-visa-container
        className="w-full max-w-[340px] aspect-[4/5] rounded-[3rem] bg-slate-950 border-4 border-slate-900 shadow-2xl relative overflow-hidden flex flex-col p-8 select-none"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-slate-950 to-cyan-900/20 opacity-80"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40"></div>
        
        {/* Header */}
        <div className="relative z-10 flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-purple-400 mb-1">Status: Verified</span>
            <span className="text-xl font-black text-white italic tracking-tighter">MISSION ACCOMPLISHED</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
            <i className="fas fa-shield-halved text-purple-400 text-sm"></i>
          </div>
        </div>

        {/* City Name - The Hero */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2">Location Identity</p>
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none break-words">
            {cityName}
          </h2>
          <div className="w-12 h-1.5 bg-cyan-400 mt-4 shadow-[0_0_15px_rgba(34,211,238,0.6)]"></div>
        </div>

        {/* Stats & Reward */}
        <div className="relative z-10 mb-8 p-4 bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Protocol Reward</p>
              <p className="text-2xl font-black text-cyan-400">+{milesEarned} <span className="text-[10px] text-slate-400 uppercase">Miles</span></p>
            </div>
            <i className="fas fa-bolt-lightning text-cyan-400/50 text-xl animate-pulse"></i>
          </div>
        </div>

        {/* Footer & Stamp */}
        <div className="relative z-10 flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Digital Auth</p>
            <p className="text-[10px] font-black text-white tracking-tighter opacity-80 uppercase">bdai.travel/intel</p>
          </div>
          
          {/* Circular Stamp */}
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-purple-500/40 flex flex-col items-center justify-center p-2 transform rotate-12 bg-purple-500/10 shadow-inner">
             <span className="text-[6px] font-black text-purple-400 uppercase tracking-tighter">VERIFIED</span>
             <span className="text-[8px] font-black text-white uppercase border-y border-purple-500/30 my-1 px-1">{stampDate}</span>
             <span className="text-[5px] font-black text-purple-500/50 uppercase">GEN_CORE_7</span>
          </div>
        </div>

        {/* Decorative Scanners */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500/30 overflow-hidden">
          <div className="w-1/3 h-full bg-purple-400 animate-scan"></div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="mt-10 w-full max-w-[340px] space-y-4">
        <button 
          onClick={handleShare}
          disabled={isGenerating}
          className="w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-[0_10px_40px_rgba(147,51,234,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-slate-800 disabled:text-slate-500"
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
          disabled={isGenerating}
          className="w-full py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors disabled:opacity-30"
        >
          Not now
        </button>
      </div>

      {/* Bottom Legal/Tagline */}
      <p className="absolute bottom-8 text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">
        Better Destinations by AI // {new Date().getFullYear()}
      </p>
    </div>
  );
};
