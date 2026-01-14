
import React, { useState, useEffect } from 'react';
import { generateCityPostcard } from '../services/geminiService';

const TEXTS: any = {
    es: { title: "Tu Postal IA", desc: "Generada especialmente para ti", share: "Compartir con el mundo", close: "Cerrar", loading: "Pintando tu postal...", error: "No se pudo generar la imagen." },
    en: { title: "Your AI Postcard", desc: "Specially generated for you", share: "Share with the world", close: "Close", loading: "Painting your postcard...", error: "Could not generate image." },
    ca: { title: "La teva Postal IA", desc: "Generada especialment per a tu", share: "Compartir amb el món", close: "Tancar", loading: "Pintant la teva postal...", error: "No s'ha pogut generar la imatge." },
    eu: { title: "Zure AI Postala", desc: "Zuretzat bereziki sortua", share: "Munduarekin partekatu", close: "Itxi", loading: "Zure postala margotzen...", error: "Ezin izan da irudia sortu." },
    fr: { title: "Votre Carte IA", desc: "Générée spécialement pour vous", share: "Partager avec le monde", close: "Fermer", loading: "Peinture de votre carte...", error: "Impossible de générer l'image." }
};

export const PostcardModal: React.FC<{ city: string, interests: string[], language: string, onClose: () => void }> = ({ city, interests, language, onClose }) => {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const t = TEXTS[language] || TEXTS.es;

    useEffect(() => {
        const load = async () => {
            const res = await generateCityPostcard(city, interests);
            setImage(res);
            setLoading(false);
        };
        load();
    }, [city]);

    const handleShare = async () => {
        if (image && navigator.share) {
            const blob = await (await fetch(image)).blob();
            const file = new File([blob], `postcard-${city}.png`, { type: 'image/png' });
            navigator.share({
                title: `Postal de ${city}`,
                files: [file]
            }).catch(console.error);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={onClose}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl relative z-10 flex flex-col animate-slide-up">
                <div className="aspect-[9/16] bg-slate-200 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                            <i className="fas fa-wand-magic-sparkles text-4xl animate-pulse text-purple-600"></i>
                            <p className="text-[10px] font-black uppercase tracking-widest">{t.loading}</p>
                        </div>
                    ) : image ? (
                        <img src={image} className="w-full h-full object-cover" alt="AI Postcard" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500">{t.error}</div>
                    )}
                </div>
                <div className="p-8 text-center bg-white">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">{city}</h3>
                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-6">{t.desc}</p>
                    <div className="flex flex-col gap-3">
                        <button 
                            disabled={loading || !image}
                            onClick={handleShare}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            <i className="fas fa-share-nodes mr-2"></i> {t.share}
                        </button>
                        <button onClick={onClose} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">{t.close}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
