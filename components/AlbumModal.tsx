
import React, { useState, useEffect } from 'react';
import { UserProfile, Tour } from '../types';
import { BdaiLogo } from './BdaiLogo';

interface AlbumModalProps {
    user: UserProfile;
    onClose: () => void;
    language: string;
}

const TEXTS: any = {
    en: { title: "Smart Storyboard", subtitle: "Your journey, curated by Dai", generate: "Compile Album", loading: "Processing memories...", buying: "Finalizing sync...", hotmart: "Open in Hotmart", notice: "This album combines your captured angles with Dai's cynical narrative." },
    es: { title: "Storyboard Inteligente", subtitle: "Tu viaje, curado por Dai", generate: "Compilar Álbum", loading: "Procesando recuerdos...", buying: "Sincronizando...", hotmart: "Ver en Hotmart", notice: "Este álbum combina tus fotos capturadas con la narrativa cínica de Dai." },
    ca: { title: "Storyboard Intel·ligent", subtitle: "El teu viatge, curat per la Dai", generate: "Compilar Àlbum", loading: "Processant...", buying: "Sincronitzant...", hotmart: "Obrir Hotmart", notice: "Aquest àlbum combina les teves fotos amb la narrativa de la Dai." }
};

export const AlbumModal: React.FC<AlbumModalProps> = ({ user, onClose, language }) => {
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'READY'>('IDLE');
    const t = TEXTS[language] || TEXTS.es;

    const handleGenerate = () => {
        setStatus('LOADING');
        setTimeout(() => setStatus('READY'), 3500);
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={onClose}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl relative z-10 flex flex-col animate-slide-up border-[6px] border-slate-100">
                <div className="p-8 text-center bg-white flex flex-col items-center">
                    <div className="w-20 h-20 bg-purple-600/10 rounded-3xl flex items-center justify-center mb-6 border border-purple-500/20">
                        <BdaiLogo className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1 leading-none">{t.title}</h3>
                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-8">{t.subtitle}</p>
                    
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 mb-8 w-full">
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{t.notice}</p>
                    </div>

                    {status === 'IDLE' && (
                        <button onClick={handleGenerate} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                            {t.generate}
                        </button>
                    )}

                    {status === 'LOADING' && (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">{t.loading}</p>
                        </div>
                    )}

                    {status === 'READY' && (
                        <div className="w-full space-y-3">
                            <div className="bg-green-100 text-green-600 p-4 rounded-2xl border border-green-200 flex items-center gap-3">
                                <i className="fas fa-check-circle text-xl"></i>
                                <span className="text-[10px] font-black uppercase tracking-widest">Álbum Generado</span>
                            </div>
                            <button className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                                <i className="fas fa-external-link-alt mr-2"></i> {t.hotmart}
                            </button>
                        </div>
                    )}

                    <button onClick={onClose} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-6">Cerrar</button>
                </div>
            </div>
        </div>
    );
};
