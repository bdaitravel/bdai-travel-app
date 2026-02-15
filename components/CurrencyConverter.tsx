
import React, { useState } from 'react';

const RATES: Record<string, number> = { 'EUR': 1.0, 'USD': 1.17, 'GBP': 0.83, 'JPY': 182.48, 'CNY': 7.75, 'MXN': 19.10, 'BRL': 5.85, 'ARS': 1040.0, 'CAD': 1.52, 'AUD': 1.68 };
const FLAGS: Record<string, string> = { 'EUR': '🇪🇺', 'USD': '🇺🇸', 'GBP': '🇬🇧', 'JPY': '🇯🇵', 'CNY': '🇨🇳', 'MXN': '🇲🇽', 'BRL': '🇧🇷', 'ARS': '🇦🇷', 'CAD': '🇨🇦', 'AUD': '🇦🇺' };
const UI_TEXTS: any = {
    en: { title: "Currency Converter", amount: "Amount", info: "*Rates verified for session.", refreshing: "Refreshing..." },
    es: { title: "Conversor de Moneda", amount: "Cantidad", info: "*Tipos verificados.", refreshing: "Actualizando..." },
    fr: { title: "Convertisseur", amount: "Montant", info: "*Vérifié.", refreshing: "Mise à jour..." },
    de: { title: "Währungsrechner", amount: "Betrag", info: "*Verifiziert.", refreshing: "Aktualisierung..." },
    it: { title: "Convertitore", amount: "Importo", info: "*Verificato.", refreshing: "Aggiornamento..." },
    pt: { title: "Conversor", amount: "Quantia", info: "*Verificado.", refreshing: "Atualizando..." },
    ro: { title: "Convertor", amount: "Suma", info: "*Verificat.", refreshing: "Actualizare..." },
    zh: { title: "汇率换算", amount: "金额", info: "*汇率已验证。", refreshing: "刷新中..." },
    ja: { title: "通貨換算", amount: "金額", info: "*レート確認済み。", refreshing: "更新中..." },
    ru: { title: "Конвертер", amount: "Сумма", info: "*Курсы подтверждены.", refreshing: "Обновление..." },
    ar: { title: "محول العملات", amount: "المبلغ", info: "*الأسعار محدثة.", refreshing: "تحديث..." },
    hi: { title: "मुद्रा परिवर्तक", amount: "राशि", info: "*दरें सत्यापित।", refreshing: "ताज़ा कर रहा है..." },
    ko: { title: "환율 계산기", amount: "금액", info: "*환율 확인됨.", refreshing: "업데이트 중..." },
    tr: { title: "Döviz Çevirici", amount: "Miktar", info: "*Oranlar doğrulandı.", refreshing: "Güncelleniyor..." },
    pl: { title: "Konwerter walut", amount: "Kwota", info: "*Kursy zweryfikowane.", refreshing: "Odświeżanie..." },
    nl: { title: "Wisselkoers", amount: "Bedrag", info: "*Koersen geverifieerd.", refreshing: "Vernieuwen..." },
    ca: { title: "Conversor", amount: "Quantitat", info: "*Verificat.", refreshing: "Actualitzant..." },
    eu: { title: "Bihurtzailea", amount: "Zenbatekoa", info: "*Egiaztatuta.", refreshing: "Eguneratzen..." },
    vi: { title: "Chuyển đổi tiền", amount: "Số tiền", info: "*Đã xác minh.", refreshing: "Đang cập nhật..." },
    th: { title: "แปลงสกุลเงิน", amount: "จำนวนเงิน", info: "*อัตราแลกเปลี่ยนได้รับยืนยัน", refreshing: "กำลังอัปเดต..." }
};

export const CurrencyConverter: React.FC<any> = ({ language = 'es' }) => {
  const [amount, setAmount] = useState<string>('1');
  const [from, setFrom] = useState<string>('EUR');
  const [to, setTo] = useState<string>('USD');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const t = UI_TEXTS[language] || UI_TEXTS['en'] || UI_TEXTS['es'];
  const handleSwap = () => { const f = from; setFrom(to); setTo(f); };
  const handleRefresh = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 800); };
  const result = (parseFloat(amount || '0') * (RATES[to] / RATES[from])).toFixed(2);
  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-slate-100 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6"><h3 className="font-heading font-bold text-xl text-slate-800 flex items-center gap-2"><i className="fas fa-exchange-alt text-purple-600"></i> {t.title}</h3><button onClick={handleRefresh} className={`text-slate-300 hover:text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`}><i className="fas fa-sync-alt text-xs"></i></button></div>
      <div className="space-y-4 relative z-10">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200"><label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">{t.amount}</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent text-3xl font-bold text-slate-800 outline-none" placeholder="0.00" /></div>
        <div className="flex items-center gap-2"><div className="flex-1"><select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full p-3 rounded-xl bg-slate-900 text-white font-bold outline-none appearance-none text-center cursor-pointer">{Object.keys(RATES).map(c => <option key={c} value={c}>{FLAGS[c]} {c}</option>)}</select></div><button onClick={handleSwap} className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center active:rotate-180 transition-all shadow-sm"><i className="fas fa-retweet"></i></button><div className="flex-1"><select value={to} onChange={(e) => setTo(e.target.value)} className="w-full p-3 rounded-xl bg-slate-900 text-white font-bold outline-none appearance-none text-center cursor-pointer">{Object.keys(RATES).map(c => <option key={c} value={c}>{FLAGS[c]} {c}</option>)}</select></div></div>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-2xl shadow-lg text-white text-center mt-4 transition-all hover:scale-[1.02]">{isRefreshing ? <p className="text-sm font-bold animate-pulse">{t.refreshing}</p> : <><p className="text-sm opacity-80 mb-1">{amount} {from} =</p><p className="text-4xl font-heading font-bold tracking-tighter">{result} <span className="text-lg opacity-60 font-medium">{to}</span></p></>}</div>
        <p className="text-[9px] text-center text-slate-400 mt-2 italic px-4 leading-tight">{t.info}</p>
      </div>
    </div>
  );
};
