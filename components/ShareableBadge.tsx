import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { toast } from './Toast';

interface ShareableBadgeProps {
  rank: string;
  miles: number;
  onClose: () => void;
}

// Logo bdai SVG inline — siempre se renderiza en html-to-image
const BdaiLogoInline = ({ size = 40 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 375 375">
    <defs>
      <clipPath id="a"><path d="M93.6 117.7H281.4V305.4H93.6z"/></clipPath>
      <clipPath id="b"><path d="M187.5 117.7c-51.8 0-93.9 42-93.9 93.8s42 93.9 93.9 93.9 93.9-42 93.9-93.9-42-93.8-93.9-93.8z"/></clipPath>
      <clipPath id="c"><path d="M0.6 0.7H188.4V188.4H0.6z"/></clipPath>
      <clipPath id="d"><path d="M94.5 0.7C42.7 0.7 0.6 42.7 0.6 94.5s42 93.9 93.9 93.9 93.9-42 93.9-93.9S146.3 0.7 94.5 0.7z"/></clipPath>
    </defs>
    <g clipPath="url(#a)">
      <g clipPath="url(#b)">
        <g transform="translate(93 117)">
          <g clipPath="url(#c)">
            <g clipPath="url(#d)">
              <path fill="#f6c604" d="M0.6 0.7H188.4V188.4H0.6z"/>
            </g>
          </g>
        </g>
      </g>
    </g>
    <path fill="#f6c604" d="M93.6 69.7v131.8c0 36.1 29.3 65.4 65.4 65.4V135.1c0-36.1-29.3-65.4-65.4-65.4z"/>
    <path fill="#5e17eb" d="M187.9 277.5c-5.7-2.5-33.9-39-33.9-57.8 0-19 14.9-33.9 33.9-33.9s33.9 15.2 33.9 34.5c0 18.7-28.2 54.8-33.9 57.2z"/>
    <path fill="#5e17eb" d="M187.9 187.9c17.9 0 31.8 14.3 31.8 32.4 0 7.5-5.3 19.5-14.4 33.2-7.3 11.2-14.4 19.1-17.4 21.6-2.9-2.5-10.1-10.4-17.4-21.7-9.1-14-14.4-26.2-14.4-33.6 0-17.9 14-31.9 31.8-31.9m0-4.2c-20.2 0-36 15.8-36 36s31.1 39.7 36 39.7 36-39.2 36-39.2c0-20.2-15.8-36.5-36-36.5z"/>
    <g transform="translate(151 143)">
      <path fill="#5e17eb" d="M36.9 93.6C31.2 91.1 3 54.6 3 35.8 3 16.8 17.9 1.9 36.9 1.9s33.9 15.2 33.9 34.4c0 18.7-28.2 54.8-33.9 57.3z"/>
      <path fill="#5e17eb" d="M36.9 4c-17.9 0-31.9 14.3-31.9 32.4 0 7.5 5.3 19.5 14.4 33.2 7.3 11.2 14.4 19.1 17.5 21.6 2.9-2.5 10.1-10.4 17.4-21.7 9.1-14 14.4-26.2 14.4-33.6C68.7 18 54.7 4 36.9 4m0-4.2C57.1-.2 72.8 15.6 72.8 35.8S41.7 95.7 36.9 95.7.9 56.5.9 36.3 16.7-.2 36.9-.2z"/>
    </g>
  </svg>
);

const RANK_CONFIG: Record<string, {
  emoji: string;
  stars: number;
  accentColor: string;
  glowColor: string;
  tagline: string;
}> = {
  'ZERO':   { emoji: '🌑', stars: 1, accentColor: '#64748b', glowColor: 'rgba(100,116,139,0.25)', tagline: 'THE JOURNEY BEGINS' },
  'SCOUT':  { emoji: '🧭', stars: 2, accentColor: '#34d399', glowColor: 'rgba(52,211,153,0.3)',   tagline: 'EXPLORING THE WORLD' },
  'ROVER':  { emoji: '🚀', stars: 3, accentColor: '#60a5fa', glowColor: 'rgba(96,165,250,0.3)',   tagline: 'ALWAYS ON THE MOVE' },
  'TITAN':  { emoji: '⚡', stars: 4, accentColor: '#c084fc', glowColor: 'rgba(192,132,252,0.35)', tagline: 'MASTER OF CITIES' },
  'ZENITH': { emoji: '👑', stars: 5, accentColor: '#fbbf24', glowColor: 'rgba(251,191,36,0.45)',  tagline: 'LEGEND OF THE ROADS' },
};

export const ShareableBadge: React.FC<ShareableBadgeProps> = ({ rank, miles, onClose }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const config = RANK_CONFIG[rank] || RANK_CONFIG['ZERO'];
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  const handleShare = async () => {
    if (!badgeRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      const dataUrl = await htmlToImage.toPng(badgeRef.current, {
        quality: 1, pixelRatio: 3, cacheBust: true, skipFonts: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `bdai-rank-${rank.toLowerCase()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `bdai — ${rank}`,
            text: `🌍 Acabo de alcanzar el rango ${rank} en bdai con ${miles.toLocaleString()} millas! ✈️ #bdai #travel`,
          });
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            const a = document.createElement('a'); a.href = dataUrl; a.download = fileName; a.click();
            toast("📸 Guardada. Compártela en tus redes ✨", "success");
          }
        }
      } else {
        const a = document.createElement('a'); a.href = dataUrl; a.download = fileName; a.click();
        toast("📸 Descargada. Compártela en tus redes ✨", "success");
      }
    } catch { toast("Error generando imagen", "error"); }
    finally { setIsGenerating(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(24px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>

      {/* ── BADGE 1:1 320×320 ── */}
      <div ref={badgeRef} style={{
        width: '320px', height: '320px',
        background: 'linear-gradient(145deg, #0d0d1a 0%, #020617 100%)',
        borderRadius: '28px', overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Arial Black, Arial, sans-serif',
      }}>

        {/* Glow radial */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 45%, ${config.glowColor} 0%, transparent 65%)`,
        }} />

        {/* Franja top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: config.accentColor }} />

        {/* Header — logo real bdai + label */}
        <div style={{
          position: 'absolute', top: '12px', left: '16px', right: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BdaiLogoInline size={28} />
            <span style={{ color: 'white', fontSize: '15px', fontWeight: 900, letterSpacing: '-0.5px' }}>bdai</span>
          </div>
          <span style={{ color: config.accentColor, fontSize: '7px', fontWeight: 900, letterSpacing: '3px', opacity: 0.8 }}>
            ACHIEVEMENT
          </span>
        </div>

        {/* Emoji rango */}
        <div style={{
          width: '76px', height: '76px',
          background: 'rgba(147,51,234,0.12)',
          border: `2px solid ${config.accentColor}35`,
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', marginBottom: '10px',
          position: 'relative', zIndex: 2,
          boxShadow: `0 0 25px ${config.glowColor}`,
        }}>
          {config.emoji}
        </div>

        {/* Estrellas */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', zIndex: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ fontSize: '13px', color: config.accentColor, opacity: i < config.stars ? 1 : 0.12 }}>★</span>
          ))}
        </div>

        {/* Tagline */}
        <div style={{
          color: config.accentColor, fontSize: '7px', fontWeight: 900,
          letterSpacing: '3px', opacity: 0.75, marginBottom: '4px', zIndex: 2,
        }}>
          {config.tagline}
        </div>

        {/* Rango */}
        <div style={{
          color: 'white', fontSize: '42px', fontWeight: 900,
          letterSpacing: '-1px', lineHeight: 1, zIndex: 2,
          textShadow: `0 0 20px ${config.glowColor}`,
        }}>
          {rank}
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute', bottom: '12px', left: '12px', right: '12px',
          background: 'rgba(255,255,255,0.04)', borderRadius: '12px',
          padding: '7px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid rgba(255,255,255,0.06)', zIndex: 2,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: '7px', fontWeight: 900, letterSpacing: '1px' }}>{date}</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ color: config.accentColor, fontSize: '16px', fontWeight: 900 }}>{miles.toLocaleString()}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '7px', fontWeight: 900, letterSpacing: '2px' }}>MI</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '7px', fontWeight: 900, letterSpacing: '1px' }}>bdai.travel</span>
        </div>

        {/* Franja bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: config.accentColor, opacity: 0.35 }} />
      </div>

      {/* Botones */}
      <div style={{ marginTop: '20px', width: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleShare} disabled={isGenerating} style={{
          width: '100%', padding: '18px',
          background: isGenerating ? '#1e293b' : '#9333ea',
          color: 'white', borderRadius: '20px',
          fontWeight: 900, fontSize: '11px', letterSpacing: '3px',
          textTransform: 'uppercase', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: '0 8px 24px rgba(147,51,234,0.4)',
        }}>
          <span>📤</span>
          {isGenerating ? 'Generando...' : 'Compartir Insignia'}
        </button>
        <button onClick={onClose} style={{
          width: '100%', padding: '14px', background: 'transparent', color: '#64748b',
          borderRadius: '16px', fontWeight: 900, fontSize: '10px', letterSpacing: '2px',
          textTransform: 'uppercase', border: 'none', cursor: 'pointer',
        }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

