
import React from 'react';

const TEXTS: any = {
    es: { title: "Partner bdai", subtitle: "Gana dinero viajando", desc: "Únete a nuestra red de inteligencia de viajes. Comparte BDAI con tu audiencia y gana comisiones por cada tour y producto masterclass vendido.", benefits: ["10% de Comisión en Guías", "Panel de Control de Ingresos", "Pagos Mensuales Directos", "Acceso a Tours Exclusivos"], cta: "Activar Cuenta Partner", info: "Tu cuenta de partner se vinculará a tu email de BDAI automáticamente tras la validación." },
    en: { title: "bdai Partner", subtitle: "Earn while you travel", desc: "Join our travel intelligence network. Share BDAI with your audience and earn commissions on every tour and masterclass product sold.", benefits: ["10% Commission on Guides", "Earnings Dashboard", "Direct Monthly Payments", "Access to Exclusive Tours"], cta: "Activate Partner Account", info: "Your partner account will be automatically linked to your BDAI email after validation." }
};

export const PartnerProgram: React.FC<{ language: string, onBack: () => void }> = ({ language, onBack }) => {
    const t = TEXTS[language] || TEXTS.es;
    return (
        <div className="pb-44 animate-fade-in bg-slate-950 min-h-full flex flex-col p-8 font-sans overflow-y-auto no-scrollbar">
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{t.title}</h2>
                    <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest mt-2">{t.subtitle}</p>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"><i className="fas fa-arrow-left"></i></button>
            </header>

            <div className="bg-gradient-to-br from-purple-600/20 to-slate-900 border border-purple-500/30 rounded-[3rem] p-10 mb-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 text-purple-500/10 text-9xl transform rotate-12"><i className="fas fa-handshake"></i></div>
                <p className="text-slate-300 text-sm leading-relaxed mb-8 font-medium relative z-10">{t.desc}</p>
                
                <div className="space-y-4 relative z-10">
                    {t.benefits.map((b: string, i: number) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white"><i className="fas fa-check"></i></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{b}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <button className="w-full py-6 rounded-[2rem] bg-white text-slate-950 font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">
                    {t.cta}
                </button>
                <p className="text-[8px] text-center text-slate-500 font-bold uppercase tracking-widest px-10 leading-relaxed">
                    {t.info}
                </p>
            </div>

            <div className="mt-12 p-8 border border-white/5 bg-white/5 rounded-[2.5rem] flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-4"><i className="fas fa-shield-halved"></i></div>
                <h4 className="text-white font-black text-xs uppercase mb-2">Seguridad Emerald</h4>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed">Motor de afiliación certificado. Las cookies de seguimiento tienen una duración de 30 días.</p>
            </div>
        </div>
    );
};
