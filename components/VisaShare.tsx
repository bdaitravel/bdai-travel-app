import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Tour, UserProfile } from '../types';

interface VisaShareProps {
  tour: Tour;
  user: UserProfile;
  onClose: () => void;
}

const RANK_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  ZERO: { bg: 'bg-gray-700', text: 'text-gray-300', border: 'border-gray-500' },
  SCOUT: { bg: 'bg-green-700', text: 'text-green-300', border: 'border-green-500' },
  ROVER: { bg: 'bg-blue-700', text: 'text-blue-300', border: 'border-blue-500' },
  TITAN: { bg: 'bg-purple-700', text: 'text-purple-300', border: 'border-purple-500' },
  ZENITH: { bg: 'bg-yellow-700', text: 'text-yellow-300', border: 'border-yellow-500' },
};

const VisaShare: React.FC<VisaShareProps> = ({ tour, user, onClose }) => {
  const visaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (!visaRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(visaRef.current, { cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'bdai_visa.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: `My BDAI Visa for ${tour.city}`,
          text: `I just completed the '${tour.title}' tour in ${tour.city} with BDAI!`,
          files: [file],
        });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'bdai_visa.png';
        link.click();
      }
    } catch (error) {
      console.error('Failed to share visa', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const rankColor = RANK_COLORS[user.rank] || RANK_COLORS.ZERO;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[1000] animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border border-purple-500/20 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-purple-500/20" onClick={(e) => e.stopPropagation()}>
        <div ref={visaRef} className={`p-4 rounded-lg ${rankColor.bg} border ${rankColor.border}`}>
          <h2 className={`text-2xl font-black ${rankColor.text}`}>VISA</h2>
          <p className={`font-bold ${rankColor.text}`}>{tour.city}</p>
          <p className={`text-sm ${rankColor.text}`}>{tour.title}</p>
          <p className={`text-xs mt-4 ${rankColor.text}`}>Issued to: {user.username}</p>
        </div>
        <button onClick={handleShare} disabled={isGenerating} className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-lg font-bold w-full">
          {isGenerating ? 'Generating...' : 'Share Visa'}
        </button>
        <button onClick={onClose} className="mt-2 text-purple-400 text-sm">Close</button>
      </div>
    </div>
  );
};

export default VisaShare;
