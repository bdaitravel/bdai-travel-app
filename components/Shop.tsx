
import React, { useState } from 'react';
import { UserProfile, TravelerRank } from '../types';

interface ShopProps {
  user: UserProfile;
}

const ETSY_STORE = "https://bdaishop.etsy.com";

const PRODUCTS: any[] = [
  { id: 't1', title: 'Plantilla de Notion: Diario de Viaje', category: 'Itineraries', price: 14.99, platform: 'Etsy', url: ETSY_STORE, image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=400&q=80' },
  { id: 'm1', title: 'Bolsa Tote: "bdai Explorer"', category: 'Merch', price: 19.99, platform: 'Etsy', url: ETSY_STORE, image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=400&q=80' },
  { id: 'r1', title: 'Recetario: Sabores del Mundo', category: 'Recipes', price: 11.99, platform: 'Amazon', url: '#', image: 'https://images.unsplash.com/photo-1598155523122-38423bd4d6bc?auto=format&fit=crop&w=400&q=80' },
];

const SHOP_TEXTS: any = {
    en: {
        title: "bdai shop",
        subtitle: "Official Marketplace",
        discount: "Loyalty Discount",
        discountSub: "Applied automatically based on rank.",
        buy: "Buy Now",
        challenge: "Monthly Goal",
        challengeSub: "Unlock new badges with every purchase.",
        visitStore: "Visit Etsy Store",
        cats: { 'Guides': 'Guides', 'Itineraries': 'Templates', 'Recipes': 'Gastronomy', 'Merch': 'Merch', 'Premium': 'Premium' }
    },
    es: {
        title: "tienda bdai",
        subtitle: "Mercado Oficial del Viajero",
        discount: "Tu Descuento de Nivel",
        discountSub: "Se aplica automáticamente según tu rango.",
        buy: "Comprar",
        challenge: "Objetivo Mensual",
        challengeSub: "Gana insignias exclusivas con cada compra.",
        visitStore: "Ver Tienda Etsy",
        cats: { 'Guides': 'Guías', 'Itineraries': 'Plantillas', 'Recipes': 'Gastronomía', 'Merch': 'Merch', 'Premium': 'Premium' }
    },
    de: {
        title: "bdai shop",
        subtitle: "Offizieller Marktplatz",
        discount: "Treuerabatt",
        discountSub: "Wird automatisch basierend auf dem Rang angewendet.",
        buy: "Kaufen",
        challenge: "Monatsziel",
        challengeSub: "Schalte neue Abzeichen mit jedem Kauf frei.",
        visitStore: "Etsy Store besuchen",
        cats: { 'Guides': 'Guides', 'Itineraries': 'Vorlagen', 'Recipes': 'Gastronomie', 'Merch': 'Merch', 'Premium': 'Premium' }
    }
};

export const Shop: React.FC<ShopProps> = ({ user }) => {
  const [activeCategory, setActiveCategory] = useState<string>('Itineraries');
  const t = SHOP_TEXTS[user.language] || SHOP_TEXTS['en'];
  const categories = ['Guides', 'Itineraries', 'Recipes', 'Merch', 'Premium'];

  return (
    <div className="pb-24 animate-fade-in bg-slate-50 min-h-full">
      <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                  <div><h2 className="text-2xl font-heading font-bold lowercase">{t.title}</h2><p className="text-slate-400 text-xs uppercase tracking-widest">{t.subtitle}</p></div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center font-bold shadow-lg">🎁</div>
                  <div><p className="font-bold text-sm">{t.discount}</p><p className="text-xs text-slate-300">{t.discountSub}</p></div>
              </div>
              <a href={ETSY_STORE} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition shadow-lg"><i className="fab fa-etsy text-orange-600"></i> {t.visitStore}</a>
          </div>
      </div>

      <div className="px-6 mt-6">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>
                      {t.cats[cat] || cat}
                  </button>
              ))}
          </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
          {PRODUCTS.filter(p => p.category === activeCategory).map(product => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group flex flex-col">
                  <div className="relative aspect-square overflow-hidden bg-slate-200">
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[8px] px-2 py-1 rounded uppercase font-bold">{product.platform}</div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-slate-800 text-xs leading-tight mb-2 line-clamp-2">{product.title}</h3>
                      <div className="mt-auto">
                          <p className="text-lg font-bold text-purple-600 mb-2">${product.price}</p>
                          <a href={product.url} target="_blank" rel="noopener noreferrer" className="block w-full py-2 bg-slate-900 text-white text-center text-[10px] font-bold rounded-lg hover:bg-purple-600 transition-colors uppercase tracking-wider">{t.buy}</a>
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
