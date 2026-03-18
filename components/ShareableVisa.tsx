
import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { toast } from './Toast';
import { BdaiLogo } from './BdaiLogo';

interface ShareableVisaProps {
  cityName: string;
  milesEarned: number;
  stampDate: string;
  rank: string;
  onClose?: () => void;
  pt: (key: string) => string;
}

export const ShareableVisa: React.FC<ShareableVisaProps> = ({ 
  cityName, 
  milesEarned, 
  stampDate,
  rank,
  onClose,
  pt
}) => {
  const visaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleCopyLink = () => {
    const epicLink = `https://bdai.travel/visa/${cityName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    navigator.clipboard.writeText(epicLink);
    toast(pt('linkCopied') || "🚀 LINK ÉPICO COPIADO AL PORTAPAPELES", "success");
  };

  const handleShare = async () => {
    if (!visaRef.current || isGenerating) return;
    setIsGenerating(true);
    setStatusText(pt('mintingVisa') || '🎨 MINTING VISA...');

    try {
      await new Promise(r => setTimeout(r, 300));

      const dataUrl = await htmlToImage.toPng(visaRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `bdai-visa-${cityName.toLowerCase().replace(/\s+/g, '-')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      setStatusText(pt('transmitting') || '🛰️ TRANSMITTING...');

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `BDAI Passport - ${cityName}`,
            text: `Mission Accomplished in ${cityName} with @bdai.travel! 🌍✨ #TravelTech #AI #DigitalNomad`,
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
            toast(pt('visaSaved') || "📸 ¡Visado guardado en Fotos! Abre Instagram o TikTok para compartirlo. ✨", "success");
            setStatusText(pt('readyToShare') || '✅ READY TO SHARE');
          }
        }
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        a.click();
        toast(pt('visaSaved') || "📸 ¡Visado guardado en Fotos! Abre Instagram o TikTok para compartirlo. ✨", "success");
        setStatusText(pt('readyToShare') || '✅ READY TO SHARE');
      }
    } catch (error: any) {
      console.error("Visa generation error:", error);
      toast(`Error: ${error.message || "Could not generate Visa."}`, "error");
      setStatusText('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      
      {/* CAPTURE ZONE */}
      <div 
        ref={visaRef}
        data-visa-container
        className="w-full max-w-[340px] aspect-[4/5] rounded-[3rem] bg-slate-950 border-4 border-slate-900 shadow-2xl relative overflow-hidden flex flex-col p-8 select-none"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950 opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60"></div>
        
        <div className="relative z-10 flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-purple-400 mb-1">{pt('statusVerified') || 'Status: Verified'}</span>
            <span className="text-lg font-black text-white italic tracking-tighter">{pt('missionAccomplished') || 'MISSION ACCOMPLISHED'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-[0_0_15px_rgba(147,51,234,0.3)]">
            <BdaiLogo className="h-4 text-purple-400" />
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center my-4">
          <div className="w-full border-y-2 border-dashed border-slate-700 py-6 relative">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-950 rounded-full border-r-2 border-dashed border-slate-700"></div>
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-950 rounded-full border-l-2 border-dashed border-slate-700"></div>
            
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] mb-3">{pt('locationIdentity') || 'Location Identity'}</p>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none break-words drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {cityName}
            </h2>
            <div className="w-16 h-1 bg-cyan-400 mx-auto mt-4 shadow-[0_0_15px_rgba(34,211,238,0.6)]"></div>
          </div>
        </div>

        <div className="relative z-10 mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-2xl backdrop-blur-md shadow-inner">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[7px] font-black text-purple-300/70 uppercase tracking-widest">{pt('protocolReward') || 'Protocol Reward'}</p>
              <p className="text-2xl font-black text-cyan-400">+{milesEarned} <span className="text-[10px] text-cyan-400/50 uppercase">{pt('miles') || 'Miles'}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-black text-purple-300/70 uppercase tracking-widest">{pt('currentRank') || 'Current Rank'}</p>
              <p className="text-sm font-black text-purple-400 uppercase tracking-tighter">{rank}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-[6px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">ENTRY_DATE</p>
            <p className="text-xs font-mono text-slate-300">{stampDate || new Date().toLocaleDateString()}</p>
          </div>
          <div className="w-24 h-24 rounded-full border-4 border-double border-purple-500/60 flex flex-col items-center justify-center p-2 transform -rotate-12 bg-purple-500/10 shadow-[0_0_20px_rgba(147,51,234,0.2)]">
            <span className="text-[7px] font-black text-purple-400 uppercase tracking-tighter">{pt('verified') || 'VERIFIED'}</span>
            <span className="text-[9px] font-black text-white uppercase border-y border-purple-500/50 my-1 px-2 py-0.5">{cityName.substring(0, 3).toUpperCase()}</span>
            <span className="text-[5px] font-black text-purple-500/70 uppercase tracking-widest">B-DAI_SYS</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500/30 overflow-hidden">
          <div className="w-1/3 h-full bg-purple-400 animate-scan"></div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="mt-10 w-full max-w-[340px] space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleShare}
            disabled={isGenerating}
            className="py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-[0_10px_40px_rgba(147,51,234,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
          >
            <i className="fas fa-camera"></i>
            {isGenerating ? pt('minting') || 'MINTING...' : pt('image') || 'IMAGE'}
          </button>
          <button 
            onClick={handleCopyLink}
            className="py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-link"></i>
            {pt('share') || 'SHARE'}
          </button>
        </div>

        <button 
          onClick={onClose}
          disabled={isGenerating}
          className="w-full py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors disabled:opacity-30"
        >
          {pt('backToPassport') || 'Back to Passport'}
        </button>
      </div>

      <p className="absolute bottom-8 text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">
        Better Destinations by AI // {new Date().getFullYear()}
      </p>
    </div>
  );
};
