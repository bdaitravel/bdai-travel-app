
import React, { useState, useEffect } from 'react';
import { generateCityPostcard } from '../services/geminiService';

const TEXTS: any = {
    en: { title: "Your AI Postcard", desc: "For you", share: "Share", close: "Close", loading: "Painting...", error: "Error generating image." },
    es: { title: "Tu Postal IA", desc: "Especial para ti", share: "Compartir", close: "Cerrar", loading: "Pintando...", error: "No se pudo generar." },
    pt: { title: "Seu Cartão IA", desc: "Para você", share: "Compartilhar", close: "Fechar", loading: "Pintando...", error: "Erro." },
    it: { title: "Tua Cartolina IA", desc: "Per te", share: "Condividi", close: "Chiudi", loading: "Dipingendo...", error: "Errore." },
    ru: { title: "Ваша открытка", desc: "Для вас", share: "Поделиться", close: "Закрыть", loading: "Рисую...", error: "Ошибка." },
    hi: { title: "आपकी AI पोस्टकार्ड", desc: "आपके लिए", share: "साझा करें", close: "बंद करें", loading: "चित्रकारी...", error: "त्रुटि।" },
    fr: { title: "Votre Carte IA", desc: "Pour vous", share: "Partager", close: "Fermer", loading: "Peinture...", error: "Erreur." },
    de: { title: "Deine KI-Postkarte", desc: "Für dich", share: "Teilen", close: "Schließen", loading: "Malen...", error: "Fehler." },
    ja: { title: "AIポストカード", desc: "あなた専用", share: "共有", close: "閉じる", loading: "作成中...", error: "エラー。" },
    zh: { title: "AI明信片", desc: "为您定制", share: "分享", close: "关闭", loading: "绘画中...", error: "生成失败。" },
    ca: { title: "La teva Postal IA", desc: "Per a tu", share: "Compartir", close: "Tancar", loading: "Pintant...", error: "Error." },
    eu: { title: "Zure AI Postala", desc: "Zuretzat", share: "Partekatu", close: "Itxi", loading: "Margotzen...", error: "Errorea." }
};

export const PostcardModal: React.FC<any> = ({ city, interests, language, onClose }) => {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const t = TEXTS[language] || TEXTS.es;
    useEffect(() => { const load = async () => { const res = await generateCityPostcard(city, interests); setImage(res); setLoading(false); }; load(); }, [city]);
    const handleShare = async () => { if (image && navigator.share) { const blob = await (await fetch(image)).blob(); const file = new File([blob], `postcard-${city}.png`, { type: 'image/png' }); navigator.share({ title: `Postal de ${city}`, files: [file] }).catch(console.error); } };
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={onClose}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl relative z-10 flex flex-col animate-slide-up">
                <div className="aspect-[9/16] bg-slate-200 relative">
                    {loading ? <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4"><i className="fas fa-wand-magic-sparkles text-4xl animate-pulse text-purple-600"></i><p className="text-[10px] font-black uppercase tracking-widest">{t.loading}</p></div> : image ? <img src={image} className="w-full h-full object-cover" alt="AI Postcard" /> : <div className="absolute inset-0 flex items-center justify-center text-slate-500">{t.error}</div>}
                </div>
                <div className="p-8 text-center bg-white">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">{city}</h3>
                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-6">{t.desc}</p>
                    <div className="flex flex-col gap-3">
                        <button disabled={loading || !image} onClick={handleShare} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"><i className="fas fa-share-nodes mr-2"></i> {t.share}</button>
                        <button onClick={onClose} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">{t.close}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
