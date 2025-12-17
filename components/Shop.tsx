
import React, { useState } from 'react';
import { UserProfile, TravelerRank } from '../types';

interface ShopProps {
  user: UserProfile;
}

interface Product {
  id: string;
  title: string;
  category: 'Guides' | 'Itineraries' | 'Recipes' | 'Merch' | 'Premium';
  price: number;
  image: string;
  platform: 'Etsy' | 'Hotmart' | 'Amazon' | 'Miravia' | 'Gumroad';
  url: string;
}

const ETSY_STORE = "https://bdaishop.etsy.com";

const PRODUCTS: Product[] = [
  // --- FASE 1: RIOJA EXCLUSIVES ---
  { id: 'r_rioja', title: 'Recetario Tradicional Riojano', category: 'Recipes', price: 8.99, platform: 'Hotmart', url: '#', image: 'https://images.unsplash.com/photo-1598155523122-38423bd4d6bc?auto=format&fit=crop&w=400&q=80' },
  { id: 'p_rioja', title: 'La Rioja Premium Experience', category: 'Premium', price: 19.99, platform: 'Hotmart', url: '#', image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=400&q=80' },

  // --- GUÍAS DIGITALES ---
  { id: 'g1', title: 'Paris Essential: 3 Days', category: 'Guides', price: 9.99, platform: 'Hotmart', url: '#', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80' },
  { id: 'g2', title: 'Tokyo in 24 Hours', category: 'Guides', price: 4.99, platform: 'Hotmart', url: '#', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80' },
  { id: 'g3', title: 'New York Essentials', category: 'Guides', price: 12.99, platform: 'Hotmart', url: '#', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400&q=80' },
  
  // --- ITINERARIOS Y PLANTILLAS ---
  { id: 't1', title: 'Travel Journal Notion Template', category: 'Itineraries', price: 14.99, platform: 'Etsy', url: ETSY_STORE, image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=400&q=80' },
  { id: 't3', title: 'Solo Travel Safety Guide', category: 'Itineraries', price: 5.99, platform: 'Gumroad', url: '#', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80' },
  
  // --- RECETARIOS GLOBAL ---
  { id: 'r1', title: 'Authentic Japan Recipes', category: 'Recipes', price: 11.99, platform: 'Amazon', url: '#', image: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&w=400&q=80' },
  { id: 'r2', title: 'Taste of Italy', category: 'Recipes', price: 11.99, platform: 'Amazon', url: '#', image: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&w=400&q=80' },
  
  // --- MERCH ---
  { id: 'm1', title: 'Tote: "Travel More"', category: 'Merch', price: 19.99, platform: 'Etsy', url: ETSY_STORE, image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=400&q=80' },
  { id: 'm2', title: 'T-Shirt: "Citizen of the World"', category: 'Merch', price: 24.99, platform: 'Miravia', url: '#', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80' },
  
  // --- PREMIUM ---
  { id: 'p1', title: 'AI Generated Trip Album', category: 'Premium', price: 29.99, platform: 'Hotmart', url: '#', image: 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=400&q=80' },
];

const DISCOUNT_MAP: Record<TravelerRank, number> = {
  'Turista': 0,
  'Explorador': 0.05,
  'Wanderer': 0.10,
  'Globe-Trotter': 0.15,
  'Leyenda del Viaje': 0.20
};

const SHOP_TEXTS: any = {
    en: {
        title: "bdai store",
        subtitle: "Official Marketplace",
        discount: "Your Loyalty Discount",
        discountSub: "Applied automatically to all links.",
        buy: "Buy Now",
        challenge: "Monthly Challenge",
        challengeSub: "Buy 3 guides to unlock the 'Scholar' badge.",
        visitStore: "Visit Etsy Store",
        cats: {
            'Guides': 'Guides',
            'Itineraries': 'Itineraries',
            'Recipes': 'Recipes',
            'Merch': 'Merch',
            'Premium': 'Premium'
        }
    },
    es: {
        title: "tienda bdai",
        subtitle: "Mercado Oficial",
        discount: "Tu Descuento de Fidelidad",
        discountSub: "Aplicado automáticamente.",
        buy: "Comprar",
        challenge: "Reto Mensual",
        challengeSub: "Compra 3 guías para la insignia 'Erudito'.",
        visitStore: "Visitar Tienda Etsy",
        cats: {
            'Guides': 'Guías',
            'Itineraries': 'Itinerarios',
            'Recipes': 'Recetas',
            'Merch': 'Merch',
            'Premium': 'Premium'
        }
    },
    ca: {
        title: "botiga bdai",
        subtitle: "Mercat Oficial",
        discount: "El Teu Descompte",
        discountSub: "Aplicat automàticament.",
        buy: "Comprar",
        challenge: "Repte Mensual",
        challengeSub: "Compra 3 guies per la insígnia 'Erudit'.",
        visitStore: "Visitar Botiga Etsy",
        cats: {
            'Guides': 'Guies',
            'Itineraries': 'Itineraris',
            'Recipes': 'Receptes',
            'Merch': 'Merch',
            'Premium': 'Prèmium'
        }
    },
    eu: {
        title: "bdai denda",
        subtitle: "Merkatu Ofiziala",
        discount: "Zure Deskontua",
        discountSub: "Automatikoki aplikatuta.",
        buy: "Erosi",
        challenge: "Hilabeteko Erronka",
        challengeSub: "Erosi 3 gida domina lortzeko.",
        visitStore: "Etsy Denda Bisitatu",
        cats: {
            'Guides': 'Gidak',
            'Itineraries': 'Ibilbideak',
            'Recipes': 'Errezetak',
            'Merch': 'Merch',
            'Premium': 'Premium'
        }
    }
};

export const Shop: React.FC<ShopProps> = ({ user }) => {
  const [activeCategory, setActiveCategory] = useState<string>('Recipes');
  const t = SHOP_TEXTS[user.language] || SHOP_TEXTS['en'];
  
  // Logic for Discount
  const discount = DISCOUNT_MAP[user.rank] || 0;
  const discountPercent = discount * 100;

  const categories = ['Guides', 'Itineraries', 'Recipes', 'Merch', 'Premium'];
  const filteredProducts = PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="pb-24 animate-fade-in bg-slate-50 min-h-full">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '15px 15px'}}></div>
          <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <h2 className="text-2xl font-heading font-bold lowercase">{t.title}</h2>
                      <p className="text-slate-400 text-xs uppercase tracking-widest">{t.subtitle}</p>
                  </div>
                  <div className="text-right">
                      <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block mb-1">
                          {user.rank}
                      </div>
                  </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {discountPercent}%
                  </div>
                  <div>
                      <p className="font-bold text-sm">{t.discount}</p>
                      <p className="text-xs text-slate-300">{t.discountSub}</p>
                  </div>
              </div>

              <a 
                href={ETSY_STORE} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition shadow-lg"
              >
                  <i className="fab fa-etsy text-orange-600"></i>
                  {t.visitStore}
              </a>
          </div>
      </div>

      {/* Categories */}
      <div className="px-6 mt-6">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-slate-500 border border-slate-200'}`}
                  >
                      {t.cats[cat] || cat}
                  </button>
              ))}
          </div>
      </div>

      {/* Product Grid */}
      <div className="p-6 grid grid-cols-2 gap-4">
          {filteredProducts.map(product => {
              const finalPrice = (product.price * (1 - discount)).toFixed(2);
              
              return (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100 group flex flex-col">
                      <div className="relative aspect-square overflow-hidden bg-slate-200">
                          <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[8px] px-2 py-1 rounded uppercase font-bold tracking-wider">
                              {product.platform}
                          </div>
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2 line-clamp-2">{product.title}</h3>
                          
                          <div className="mt-auto">
                              <div className="flex items-baseline gap-2 mb-3">
                                  <span className="text-lg font-bold text-purple-600">${finalPrice}</span>
                                  {discount > 0 && (
                                      <span className="text-xs text-slate-400 line-through">${product.price}</span>
                                  )}
                              </div>
                              
                              <a 
                                href={product.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-full py-2 bg-slate-900 text-white text-center text-xs font-bold rounded-lg hover:bg-purple-600 transition-colors"
                              >
                                {t.buy}
                              </a>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>
      
      {/* Monthly Challenge Teaser */}
      <div className="px-6 mb-6">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">🎯</div>
              <div>
                  <h4 className="font-bold text-slate-800 text-sm">{t.challenge}</h4>
                  <p className="text-xs text-slate-500">{t.challengeSub}</p>
              </div>
          </div>
      </div>
    </div>
  );
};
