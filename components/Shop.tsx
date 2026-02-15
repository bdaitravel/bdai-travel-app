
import { UserProfile } from '../types';
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const EXTERNAL_STORES = [
    { id: 'bdai', name: 'bdai.tech', url: 'https://www.bdai.tech/', icon: 'fa-globe', color: 'bg-purple-600' },
    { id: 'etsy', name: 'Etsy Shop', url: 'https://www.etsy.com/es/shop/BdaiShop', icon: 'fa-etsy', color: 'bg-[#F1641E]' },
    { id: 'hotmart', name: 'Hotmart', url: '#', icon: 'fa-fire', color: 'bg-[#f04e23]' },
    { id: 'amazon', name: 'Amazon', url: '#', icon: 'fa-amazon', color: 'bg-[#FF9900]' },
    { id: 'miravia', name: 'Miravia', url: '#', icon: 'fa-shopping-bag', color: 'bg-[#fe016d]' }
];

export const Shop: React.FC<{ user: UserProfile, onPurchase: (reward: number) => void }> = ({ user, onPurchase }) => {
    const { t, language } = useLanguage();

    const openStore = (url: string) => {
        if (url !== '#') window.open(url, '_blank');
    };

    return (
        <div className="pb-44 animate-fade-in bg-[#020617] min-h-full">
            <header className="bg-gradient-to-b from-purple-900/40 to-slate-950 p-10 rounded-b-[4rem] border-b border-purple-500/20 shadow-2xl">
                <h2 className={`text-4xl font-black text-white tracking-tighter uppercase ${language === 'ar' ? 'text-right' : ''}`}>{t('shop.title')}</h2>
                <p className={`text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mb-8 ${language === 'ar' ? 'text-right' : ''}`}>{t('shop.subtitle')}</p>
                
                <button 
                    onClick={() => openStore('https://www.bdai.tech/')}
                    className="w-full bg-white text-slate-950 p-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-3 mb-8"
                >
                    <i className="fas fa-external-link-alt"></i>
                    {t('shop.mainBtn')}
                </button>
            </header>

            <div className="p-8 space-y-6">
                <h3 className={`text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-2 ${language === 'ar' ? 'text-right' : ''}`}>{t('shop.official')}</h3>
                <div className="grid grid-cols-1 gap-4">
                    {EXTERNAL_STORES.map(store => (
                        <div key={store.id} onClick={() => openStore(store.url)} className={`bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex items-center justify-between group active:scale-95 transition-all cursor-pointer ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-14 h-14 rounded-2xl ${store.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                                    <i className={`fab ${store.icon} ${store.id === 'bdai' ? 'fas fa-globe' : ''} ${store.id === 'miravia' ? 'fas fa-shopping-bag' : ''}`}></i>
                                </div>
                                <div className={language === 'ar' ? 'text-right' : ''}>
                                    <h4 className="text-white font-black text-sm uppercase">{store.name}</h4>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Official platform</p>
                                </div>
                            </div>
                            <i className={`fas fa-external-link-alt text-slate-700 group-hover:text-purple-500 ${language === 'ar' ? 'rotate-180' : ''}`}></i>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
