import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { toast } from './Toast';

interface ShareableBadgeProps {
  rank: string;
  miles: number;
  onClose: () => void;
}

// SVG inline — siempre renderizan bien en html-to-image, sin depender de fuentes
const RANK_ICONS: Record<string, React.ReactNode> = {
  'ZERO': (
    <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  ),
  'SCOUT': (
    <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
      <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
    </svg>
  ),
  'ROVER': (
    <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
      <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98z"/>
    </svg>
  ),
  'TITAN': (
    <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z"/>
    </svg>
  ),
  'ZENITH': (
    <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/>
    </svg>
  ),
};

const RANK_CONFIG: Record<string, { bg: string; glow: string; accent: string; badge: string; stars: number }> = {
  'ZERO':   { bg: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', glow: 'rgba(148,163,184,0.25)', accent: '#94a3b8', badge: '#334155', stars: 1 },
  'SCOUT':  { bg: 'linear-gradient(145deg, #064e3b 0%, #022c22 100%)', glow: 'rgba(52,211,153,0.35)', accent: '#34d399', badge: '#065f46', stars: 2 },
  'ROVER':  { bg: 'linear-gradient(145deg, #1e3a8a 0%, #0c1a6b 100%)', glow: 'rgba(96,165,250,0.35)', accent: '#60a5fa', badge: '#1e40af', stars: 3 },
  'TITAN':  { bg: 'linear-gradient(145deg, #581c87 0%, #2e1065 100%)', glow: 'rgba(192,132,252,0.45)', accent: '#c084fc', badge: '#6b21a8', stars: 4 },
  'ZENITH': { bg: 'linear-gradient(145deg, #78350f 0%, #3b0f03 100%)', glow: 'rgba(251,191,36,0.55)', accent: '#fbbf24', badge: '#92400e', stars: 5 },
};

export const ShareableBadge: React.FC<ShareableBadgeProps> = ({ rank, miles, onClose }) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');

  const config = RANK_CONFIG[rank] || RANK_CONFIG['ZERO'];
  const icon = RANK_ICONS[rank] || RANK_ICONS['ZENITH'];
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
    setStatusText('Generando...');

    try {
      await new Promise(r => setTimeout(r, 400));

      const dataUrl = await htmlToImage.toPng(badgeRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `bdai-rank-${rank.toLowerCase()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      setStatusText('Compartiendo...');

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `bdai — Rango ${rank}`,
            text: `🌍 Acabo de alcanzar el rango ${rank} en bdai con ${miles.toLocaleString()} millas! ✈️ #bdai #travel`,
          });
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') {
            triggerDownload(dataUrl, fileName);
            toast("📸 ¡Insignia guardada! Compártela en tus redes. ✨", "success");
          }
        }
      } else {
        triggerDownload(dataUrl, fileName);
        toast("📸 ¡Insignia descargada! Compártela en tus redes. ✨", "success");
      }
    } catch (error) {
      console.error("Error generating badge:", error);
      toast("Error generando imagen", "error");
    } finally {
      setIsGenerating(false);
      setStatusText('');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>

      {/* BADGE cuadrado 1:1 — todo inline para exportar bien */}
      <div
        ref={badgeRef}
        style={{
          width: '300px', height: '300px',
          background: config.bg,
          borderRadius: '28px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial Black, Arial, sans-serif',
        }}
      >
        {/* Glow radial de fondo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 40%, ${config.glow} 0%, transparent 65%)`,
        }} />

        {/* Línea top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: config.accent }} />

        {/* bdai label */}
        <div style={{
          position: 'absolute', top: '14px',
          color: config.accent, fontSize: '9px', fontWeight: 900,
          letterSpacing: '5px', opacity: 0.55,
        }}>
          BDAI.TRAVEL
        </div>

        {/* Icono SVG con glow */}
        <div style={{
          width: '88px', height: '88px',
          background: config.badge,
          borderRadius: '22px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '14px',
          position: 'relative', zIndex: 2,
          border: '2px solid rgba(255,255,255,0.12)',
          boxShadow: `0 0 28px ${config.glow}, 0 8px 20px rgba(0,0,0,0.4)`,
        }}>
          {icon}
        </div>

        {/* Estrellas */}
        <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', zIndex: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ fontSize: '13px', color: config.accent, opacity: i < config.stars ? 1 : 0.18 }}>★</span>
          ))}
        </div>

        {/* Label rango */}
        <div style={{
          color: config.accent, fontSize: '8px', fontWeight: 900,
          letterSpacing: '4px', opacity: 0.75, marginBottom: '4px', zIndex: 2,
        }}>
          CURRENT STATUS
        </div>

        {/* Nombre rango */}
        <div style={{
          color: 'white', fontSize: '34px', fontWeight: 900,
          letterSpacing: '-1px', lineHeight: 1, zIndex: 2,
        }}>
          {rank}
        </div>

        {/* Footer con millas */}
        <div style={{
          position: 'absolute', bottom: '12px', left: '12px', right: '12px',
          background: 'rgba(0,0,0,0.28)',
          borderRadius: '12px', padding: '7px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid rgba(255,255,255,0.07)',
          zIndex: 2,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '7px', fontWeight: 900, letterSpacing: '1px' }}>{date}</span>
          <span style={{ color: config.accent, fontSize: '16px', fontWeight: 900 }}>
            {miles.toLocaleString()} <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '2px', opacity: 0.6 }}>MI</span>
          </span>
        </div>

        {/* Línea bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: config.accent, opacity: 0.5 }} />
      </div>

      {/* Botones fuera del badge */}
      <div style={{ marginTop: '20px', width: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleShare}
          disabled={isGenerating}
          style={{
            width: '100%', padding: '17px',
            background: isGenerating ? '#1e293b' : config.badge,
            border: `1px solid ${config.accent}50`,
            color: 'white', borderRadius: '18px',
            fontWeight: 900, fontSize: '11px', letterSpacing: '3px',
            textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: `0 6px 20px ${config.glow}`,
          }}
        >
          <span>📤</span>
          {isGenerating ? statusText : 'Compartir Insignia'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '13px',
            background: 'transparent', color: '#64748b',
            borderRadius: '14px', fontWeight: 900,
            fontSize: '10px', letterSpacing: '2px',
            textTransform: 'uppercase', border: 'none', cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

