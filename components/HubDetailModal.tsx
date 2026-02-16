
import React from 'react';
// Fix: Import HubIntel which is now correctly exported from types.ts
import { HubIntel } from '../types';

const TEXTS: any = {
  en: { details: "Intel Details", save: "Save to My Passport", saved: "Saved", close: "Close" },
  es: { details: "Detalles del Intel", save: "Guardar en Mi Pasaporte", saved: "Guardado", close: "Cerrar" },
  ca: { details: "Detalls", save: "Desar al Passaport", saved: "Desat", close: "Tancar" },
  eu: { details: "Xehetasunak", save: "Pasaportean Gorde", saved: "Gordeta", close: "Itxi" },
  fr: { details: "Détails", save: "Enregistrer", saved: "Enregistré", close: "Fermer" },
  de: { details: "Details", save: "Speichern", saved: "Gespeichert", close: "Schließen" },
  ja: { details: "詳細", save: "保存する", saved: "保存済み", close: "閉じる" },
  zh: { details: "详细信息", save: "保存", saved: "已保存", close: "关闭" },
  ar: { details: "التفاصيل", save: "حفظ", saved: "تم الحفظ", close: "إغلاق" }
};

// Fix: Use specific interface for props instead of 'any'
interface HubDetailModalProps {
  intel: HubIntel;
  isSaved: boolean;
  onClose: () => void;
  onSave: () => void;
  language: string;
}

export const HubDetailModal: React.FC<HubDetailModalProps> = ({ intel, isSaved, onClose, onSave, language }) => {
  const t = TEXTS[language] || TEXTS['es'];
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center px-4 pb-12">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="bg-slate-900 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative z-10 border border-white/10 flex flex-col animate-slide-up">
        <div className={`h-3 bg-gradient-to-r ${intel.color}`}></div>
        <div className="p-10 space-y-8">
            <div className="flex justify-between items-start"><div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center text-3xl text-white"><i className={`fas ${intel.icon}`}></i></div><button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 text-slate-500"><i className="fas fa-times"></i></button></div>
            <div><p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mb-2">{intel.type} Intel</p><h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">{intel.title}</h2><div className="flex items-center gap-2 mt-2"><i className="fas fa-location-dot text-slate-500 text-[10px]"></i><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{intel.location}</p></div></div>
            <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 space-y-4"><p className="text-slate-300 text-sm leading-relaxed font-medium">{intel.description}</p>{intel.details && <div className="pt-4 border-t border-white/5"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.details}</p><p className="text-slate-400 text-xs italic leading-relaxed">{intel.details}</p></div>}</div>
            <div className="pt-4"><button onClick={onSave} className={`w-full py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl ${isSaved ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-white text-slate-950'}`}><i className={`fas ${isSaved ? 'fa-check-circle' : 'fa-bookmark'}`}></i>{isSaved ? t.saved : t.save}</button></div>
        </div>
      </div>
    </div>
  );
};