import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { UserProfile } from '../types';

interface VisaShareProps {
  user: UserProfile;
  cityName: string;
  milesEarned: number;
  onClose: () => void;
}

const RANK_THEMES: Record<string, { bg: string, accent: string, badge: string, strip: string }> = {
  'ZERO':   { bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', accent: '#94a3b8', badge: '#334155', strip: '#475569' },
  'SCOUT':  { bg: 'linear-gradient(135deg, #065f46 0%, #022c22 100%)', accent: '#6ee7b7', badge: '#047857', strip: '#10b981' },
  'ROVER':  { bg: 'linear-gradient(135deg, #1e40af 0%, #0c1a6b 100%)', accent: '#93c5fd', badge: '#1d4ed8', strip: '#3b82f6' },
  'TITAN':  { bg: 'linear-gradient(135deg, #6b21a8 0%, #2e1065 100%)', accent: '#d8b4fe', badge: '#7e22ce', strip: '#a855f7' },
  'ZENITH': { bg: 'linear-gradient(135deg, #92400e 0%, #451a03 100%)', accent: '#fcd34d', badge: '#b45309', strip: '#f59e0b' },
};

export const VisaShare: React.FC<VisaShareProps> = ({ user, cityName, milesEarned, onClose }) => {
  const visaRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const theme = RANK_THEMES[user.rank] || RANK_THEMES['ZERO'];
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const cityCode = cityName.substring(0, 3).toUpperCase();

  const handleShare = async () => {
    if (!visaRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      // Esperar a que las fuentes e imágenes carguen
      await new Promise(r => setTimeout(r, 300));

      const dataUrl = await htmlToImage.toPng(visaRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: false,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `bdai-visa-${cityName.toLowerCase().replace(/\s/g, '-')}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `bdai Visa — ${cityName}`,
          text: `🌍 Acabo de conquistar ${cityName} en bdai! Rango: ${user.rank} · +${milesEarned} millas ✈️ #bdai #travel #${cityName.replace(/\s/g, '')}`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `bdai Visa — ${cityName}`,
          text: `🌍 Acabo de conquistar ${cityName} en bdai! Rango: ${user.rank} · +${milesEarned} millas ✈️`,
          url: 'https://www.bdai.travel',
        });
      } else {
        // Fallback: descargar
        const link = document.createElement('a');
        link.download = `bdai-visa-${cityName.toLowerCase().replace(/\s/g, '-')}.png`;
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(2,6,23,0.97)', backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      {/* VISA CARD — formato cuadrado 1:1 para Instagram */}
      <div
        ref={visaRef}
        style={{
          width: '320px', height: '320px',
          background: theme.bg,
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: "'Arial Black', Arial, sans-serif",
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Fondo decorativo */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-40px',
          width: '150px', height: '150px',
          background: 'rgba(0,0,0,0.15)',
          borderRadius: '50%',
        }} />

        {/* Franja superior de color */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '4px', background: theme.strip,
        }} />

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 2, padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ color: theme.accent, fontSize: '8px', fontWeight: 900, letterSpacing: '3px', textTransform: 'uppercase', opacity: 0.7 }}>OFFICIAL TRAVEL VISA</div>
              <div style={{ color: 'white', fontSize: '22px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-1px', lineHeight: 1 }}>bdai</div>
            </div>
            <div style={{
              background: theme.badge,
              borderRadius: '12px',
              padding: '8px 12px',
              textAlign: 'center',
              border: `1px solid rgba(255,255,255,0.2)`,
            }}>
              <div style={{ color: theme.accent, fontSize: '7px', fontWeight: 900, letterSpacing: '2px' }}>RANK</div>
              <div style={{ color: 'white', fontSize: '11px', fontWeight: 900, letterSpacing: '1px' }}>{user.rank}</div>
            </div>
          </div>

          {/* Ciudad — el protagonista */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: theme.accent, fontSize: '8px', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px' }}>DESTINATION</div>
            <div style={{ color: 'white', fontSize: cityName.length > 10 ? '28px' : '36px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px', lineHeight: 1.1 }}>
              {cityName}
            </div>
            <div style={{ width: '40px', height: '3px', background: theme.strip, borderRadius: '2px', marginTop: '10px' }} />
          </div>

          {/* Footer — datos del viajero */}
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '16px',
            padding: '12px 14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: theme.accent, fontSize: '7px', fontWeight: 900, letterSpacing: '2px', opacity: 0.6 }}>TRAVELER</div>
                <div style={{ color: 'white', fontSize: '13px', fontWeight: 900, marginTop: '2px' }}>
                  {user.username || user.firstName || 'Traveler'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: theme.accent, fontSize: '7px', fontWeight: 900, letterSpacing: '2px', opacity: 0.6 }}>MILES</div>
                <div style={{ color: theme.accent, fontSize: '18px', fontWeight: 900 }}>+{milesEarned}</div>
              </div>
            </div>
            <div style={{
              marginTop: '8px', paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '7px', fontWeight: 900, letterSpacing: '2px' }}>
                {date}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '7px', fontWeight: 900, letterSpacing: '2px' }}>
                bdai.travel
              </div>
            </div>
          </div>
        </div>

        {/* Franja inferior */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '3px', background: theme.strip, opacity: 0.6,
        }} />
      </div>

      {/* Botones */}
      <div style={{ marginTop: '24px', width: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleShare}
          disabled={isGenerating}
          style={{
            width: '100%', padding: '18px',
            background: isGenerating ? '#334155' : 'white',
            color: '#0f172a', borderRadius: '20px',
            fontWeight: 900, fontSize: '11px', letterSpacing: '3px',
            textTransform: 'uppercase', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: '16px' }}>📤</span>
          {isGenerating ? 'Generando...' : 'Compartir Visado'}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '14px',
            background: 'transparent', color: '#64748b',
            borderRadius: '16px', fontWeight: 900,
            fontSize: '10px', letterSpacing: '2px',
            textTransform: 'uppercase', border: 'none', cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
