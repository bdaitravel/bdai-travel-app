import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { toast } from './Toast';

interface ShareableBadgeProps {
  rank: string;
  miles: number;
  onClose: () => void;
}

const RANK_CONFIG: Record<string, {
  label: string;
  emoji: string;
  stars: number;
  accentColor: string;
  glowColor: string;
  tagline: string;
}> = {
  'ZERO':   { label: 'ZERO',   emoji: '🌑', stars: 1, accentColor: '#64748b', glowColor: 'rgba(100,116,139,0.3)', tagline: 'The journey begins' },
  'SCOUT':  { label: 'SCOUT',  emoji: '🧭', stars: 2, accentColor: '#34d399', glowColor: 'rgba(52,211,153,0.35)', tagline: 'Exploring the world' },
  'ROVER':  { label: 'ROVER',  emoji: '🚀', stars: 3, accentColor: '#60a5fa', glowColor: 'rgba(96,165,250,0.35)', tagline: 'Always on the move' },
  'TITAN':  { label: 'TITAN',  emoji: '⚡', stars: 4, accentColor: '#c084fc', glowColor: 'rgba(192,132,252,0.4)',  tagline: 'Master of cities' },
  'ZENITH': { label: 'ZENITH', emoji: '👑', stars: 5, accentColor: '#fbbf24', glowColor: 'rgba(251,191,36,0.5)',  tagline: 'Legend of the roads' },
};

export const ShareableBadge: React.FC<ShareableBadgeProps> = ({ rank, miles, onClose }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const config = RANK_CONFIG[rank] || RANK_CONFIG['ZERO'];
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  const triggerDownload = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            title: `bdai — Rango ${rank}`,
            text: `🌍 Acabo de alcanzar el rango ${rank} en bdai con ${miles.toLocaleString()} millas! ✈️ #bdai #travel #${rank.toLowerCase()}`,
          });
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            triggerDownload(dataUrl, fileName);
            toast("📸 ¡Guardada! Compártela en redes. ✨", "success");
          }
        }
      } else {
        triggerDownload(dataUrl, fileName);
        toast("📸 ¡Descargada! Compártela en redes. ✨", "success");
      }
    } catch (e) {
      toast("Error generando imagen", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(24px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>

      {/* ── BADGE 1:1 Instagram ── */}
      <div ref={badgeRef} style={{
        width: '320px', height: '320px',
        background: 'linear-gradient(145deg, #0a0f1e 0%, #020617 100%)',
        borderRadius: '28px',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial Black, Arial, sans-serif',
      }}>

        {/* Glow de fondo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 45%, ${config.glowColor} 0%, transparent 68%)`,
        }} />

        {/* Línea top color acento */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: config.accentColor }} />

        {/* Header — bdai branding */}
        <div style={{
          position: 'absolute', top: '14px', left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Logo "b" de bdai en morado */}
            <div style={{
              width: '22px', height: '22px',
              background: '#9333ea',
              borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 900, color: 'white', fontStyle: 'italic',
            }}>b</div>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 900, letterSpacing: '-0.5px' }}>bdai</span>
          </div>
          <span style={{ color: config.accentColor, fontSize: '8px', fontWeight: 900, letterSpacing: '3px', opacity: 0.7 }}>
            ACHIEVEMENT
          </span>
        </div>

        {/* Emoji grande — icono del rango */}
        <div style={{
          width: '80px', height: '80px',
          background: 'rgba(147,51,234,0.15)',
          border: `2px solid ${config.accentColor}40`,
          borderRadius: '22px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '38px',
          marginBottom: '12px',
          position: 'relative', zIndex: 2,
          boxShadow: `0 0 30px ${config.glowColor}`,
        }}>
          {config.emoji}
        </div>

        {/* Estrellas */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', zIndex: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{
              fontSize: '14px',
              color: config.accentColor,
              opacity: i < config.stars ? 1 : 0.15,
            }}>★</span>
          ))}
        </div>

        {/* Tagline */}
        <div style={{
          color: config.accentColor, fontSize: '8px', fontWeight: 900,
          letterSpacing: '3px', opacity: 0.8, marginBottom: '4px', zIndex: 2,
          textTransform: 'uppercase',
        }}>
          {config.tagline}
        </div>

        {/* Nombre rango — protagonista */}
        <div style={{
          color: 'white', fontSize: '40px', fontWeight: 900,
          letterSpacing: '-1px', lineHeight: 1,
          zIndex: 2, textShadow: `0 0 20px ${config.glowColor}`,
        }}>
          {rank}
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute', bottom: '12px', left: '12px', right: '12px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px', padding: '8px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid rgba(255,255,255,0.06)',
          zIndex: 2,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '7px', fontWeight: 900, letterSpacing: '1px' }}>
            {date}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ color: config.accentColor, fontSize: '17px', fontWeight: 900 }}>
              {miles.toLocaleString()}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '7px', fontWeight: 900, letterSpacing: '2px' }}>
              MILLAS
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '7px', fontWeight: 900, letterSpacing: '1px' }}>
            bdai.travel
          </span>
        </div>

        {/* Línea bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: config.accentColor, opacity: 0.4 }} />
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
          width: '100%', padding: '14px',
          background: 'transparent', color: '#64748b',
          borderRadius: '16px', fontWeight: 900,
          fontSize: '10px', letterSpacing: '2px',
          textTransform: 'uppercase', border: 'none', cursor: 'pointer',
        }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

