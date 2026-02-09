
import React, { useState } from 'react';
import { UserProfile } from '../types';

const SHOP_TEXTS: any = {
    en: { title: "bdai hub", subtitle: "Assets & Partner Network", buy: "Buy on Etsy", official: "Official Stores", partnerTitle: "Partner Program", partnerDesc: "Earn 10% on every sale.", searchPlaceholder: "Affiliate Link or Code...", validate: "Validate", earn: "Earn", market: "Market", cats: { 'Market': 'Marketplace', 'Earn': 'Earn & Partners' } },
    es: { title: "hub bdai", subtitle: "Activos y Red de Partners", buy: "Comprar en Etsy", official: "Tiendas Oficiales", partnerTitle: "Programa de Partners", partnerDesc: "Gana un 10% por cada venta.", searchPlaceholder: "Enlace de afiliado o código...", validate: "Validar", earn: "Gana", market: "Mercado", cats: { 'Market': 'Marketplace', 'Earn': 'Gana y Socios' } },
    it: { title: "hub bdai", subtitle: "Asset e Rete Partner", buy: "Compra su Etsy", official: "Store Ufficiali", partnerTitle: "Programma Partner", partnerDesc: "Guadagna il 10% su ogni vendita.", searchPlaceholder: "Link o codice affiliato...", validate: "Valida", earn: "Guadagna", market: "Mercato", cats: { 'Market': 'Marketplace', 'Earn': 'Guadagna' } }
};

const ITEMS = [
    { id: 'd1', name: 'Travel Guide 1–3 days', price: '9.90€', icon: 'fa-map-location-dot', color: 'bg-purple-600', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'd2', name: 'Digital Recipes', price: '12.50€', icon: 'fa-utensils', color: 'bg-emerald-600', link: 'https://www.etsy.com/es/shop/BdaiShop' },
    { id: 'p1', name: 'Premium Tote Bag', price: '22.00€', icon: 'fa-bag-shopping', color: 'bg-amber-600', link: 'https://www.etsy.com/es/shop/BdaiShop' }
];

export const Shop: React.FC<{ user: UserProfile, language: string, onPurchase: (reward: number) => void }> = ({ user, language, onPurchase }) => {
    const [activeTab, setActiveTab] = useState<'Market' | 'Earn'>('Market');
    const [affiliateCode, setAffiliateCode] = useState('');
    const t = SHOP_TEXTS[language] || SHOP_TEXTS.es;

    return (
        <div className="pb-44 animate-fade-in bg-[#020617] min-h-full">
            <header className="bg-gradient-to-b from-purple-900/30 to-slate-950 p-10 rounded-b-[4rem] border-b border-purple-500/10">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{t.title}</h2>
                <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mt-1">{t.subtitle}</p>
                
                <div className="flex gap-2 mt-8 bg-white/5 p-1.5 rounded-[2rem] border border-white/5">
                    <button onClick={() => setActiveTab('Market')} className={`flex-1 py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'Market' ? 'bg-white text-slate-950' : 'text-white/40'}`}>{t.market}</button>
                    <button onClick={() => setActiveTab('Earn')} className={`flex-1 py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'Earn' ? 'bg-purple-600 text-white' : 'text-white/40'}`}>{t.earn}</button>
                </div>
            </header>

            {activeTab === 'Market' ? (
                <div className="p-8 space-y-6 animate-fade-in">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{t.official}</p>
                    <div className="grid grid-cols-1 gap-4">
                        {ITEMS.map(item => (
                            <div key={item.id} onClick={() => window.open(item.link, '_blank')} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex items-center justify-between group active:scale-95 transition-all cursor-pointer">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white text-xl shadow-lg`}><i className={`fas ${item.icon}`}></i></div>
                                    <div>
                                        <h4 className="text-white font-black text-xs uppercase leading-none mb-1">{item.name}</h4>
                                        <p className="text-[11px] font-black text-purple-400">{item.price}</p>
                                    </div>
                                </div>
                                <i className="fas fa-external-link-alt text-slate-700 group-hover:text-purple-500 text-xs"></i>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-8 space-y-10 animate-fade-in">
                    <div className="bg-gradient-to-br from-purple-600/20 to-slate-900 border border-purple-500/30 rounded-[3rem] p-8 text-center relative overflow-hidden">
                        <i className="fas fa-handshake absolute -top-10 -right-10 text-9xl text-white/5 rotate-12"></i>
                        <h4 className="text-white font-black text-xl uppercase mb-2 relative z-10">{t.partnerTitle}</h4>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 relative z-10">{t.partnerDesc}</p>
                        
                        <div className="relative z-10 flex flex-col gap-3">
                            <input 
                                type="text" 
                                value={affiliateCode} 
                                onChange={(e) => setAffiliateCode(e.target.value)} 
                                placeholder={t.searchPlaceholder}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-[10px] font-bold outline-none focus:border-purple-500 transition-all"
                            />
                            <button className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                                {t.validate}
                            </button>
                        </div>
                    </div>

                    <div className="p-8 border border-white/5 bg-white/5 rounded-[3rem] flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white shrink-0"><i className="fas fa-shield-halved text-2xl"></i></div>
                        <div>
                            <h5 className="text-white font-black text-[10px] uppercase mb-1">Certificación Emerald</h5>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Infraestructura de monetización segura. Pagos mensuales directos vía Stripe/PayPal.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
