import React, { useState } from 'react';

const RATES: Record<string, number> = {
  'EUR': 1.0,
  'USD': 1.08,
  'GBP': 0.85,
  'JPY': 163.50,
  'CNY': 7.85,
  'MXN': 18.50,
  'BRL': 5.40,
  'ARS': 980.00, // Example volatile rate
  'CAD': 1.48,
  'AUD': 1.65
};

const FLAGS: Record<string, string> = {
  'EUR': '🇪🇺', 'USD': '🇺🇸', 'GBP': '🇬🇧', 'JPY': '🇯🇵', 'CNY': '🇨🇳',
  'MXN': '🇲🇽', 'BRL': '🇧🇷', 'ARS': '🇦🇷', 'CAD': '🇨🇦', 'AUD': '🇦🇺'
};

export const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<string>('1');
  const [from, setFrom] = useState<string>('EUR');
  const [to, setTo] = useState<string>('USD');

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const result = (parseFloat(amount || '0') * (RATES[to] / RATES[from])).toFixed(2);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fas fa-coins text-6xl text-purple-600"></i>
      </div>
      
      <h3 className="font-heading font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
        <i className="fas fa-exchange-alt text-purple-600"></i> Converter
      </h3>

      <div className="space-y-4 relative z-10">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1 block">Amount</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-3xl font-bold text-slate-800 outline-none placeholder-slate-300"
            placeholder="0.00"
          />
        </div>

        <div className="flex items-center gap-2">
            <div className="flex-1">
                <select 
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 text-white font-bold outline-none appearance-none text-center"
                >
                    {Object.keys(RATES).map(c => <option key={c} value={c}>{FLAGS[c]} {c}</option>)}
                </select>
            </div>
            
            <button onClick={handleSwap} className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center hover:scale-110 transition shadow-sm">
                <i className="fas fa-retweet"></i>
            </button>

            <div className="flex-1">
                <select 
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 text-white font-bold outline-none appearance-none text-center"
                >
                    {Object.keys(RATES).map(c => <option key={c} value={c}>{FLAGS[c]} {c}</option>)}
                </select>
            </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-2xl shadow-lg text-white text-center mt-4">
             <p className="text-sm opacity-80 mb-1">{amount} {from} =</p>
             <p className="text-4xl font-heading font-bold">{result} <span className="text-lg">{to}</span></p>
        </div>
        
        <p className="text-[10px] text-center text-slate-400 mt-2">
            *Exchange rates are approximate and for travel reference only.
        </p>
      </div>
    </div>
  );
};
