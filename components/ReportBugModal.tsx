import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface ReportBugModalProps {
    onClose: () => void;
    language: string;
}

export const ReportBugModal: React.FC<ReportBugModalProps> = ({ onClose, language }) => {
    const [text, setText] = useState('');
    const [sent, setSent] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const { error } = await supabase
                .from('bug_reports')
                .insert([{ description: text, language: language }]);
            
            if (error) {
                console.error("Error sending bug report:", error);
                // Optionally show an error message to the user here
            } else {
                setSent(true);
                setTimeout(onClose, 2500);
            }
        } catch (error) {
            console.error("Unexpected error sending bug report:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-slate-700">
                {sent ? (
                    <div className="text-center py-8 animate-fade-in">
                        <i className="fas fa-check-circle text-5xl text-emerald-500 mb-4"></i>
                        <h3 className="text-white font-black uppercase tracking-widest text-lg mb-2">
                            {language === 'es' ? '¡Enviado!' : 'Sent!'}
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            {language === 'es' 
                                ? 'Gracias por ayudarnos a mejorar. Revisaremos tu reporte lo antes posible.' 
                                : 'Thanks for helping us improve. We will review your report as soon as possible.'}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col animate-fade-in">
                        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <i className="fas fa-bug text-2xl"></i>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                            {language === 'es' ? 'Reportar Error' : 'Report Bug'}
                        </h3>
                        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                            {language === 'es' 
                                ? 'Describe el problema que has encontrado. Tu reporte se enviará a ' 
                                : 'Describe the issue you found. Your report will be sent to '}
                            <span className="text-purple-400 font-bold">support@bdai.travel</span>
                        </p>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white text-sm mb-6 h-32 resize-none focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-600"
                            placeholder={language === 'es' ? '¿Qué ha fallado? Ej: El mapa no carga...' : 'What went wrong? Ex: The map is not loading...'}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            required
                        ></textarea>
                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-300 font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-colors active:scale-95"
                                disabled={isSending}
                            >
                                {language === 'es' ? 'Cancelar' : 'Cancel'}
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 py-4 rounded-2xl bg-purple-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={isSending || !text.trim()}
                            >
                                {isSending ? (
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                ) : (
                                    language === 'es' ? 'Enviar' : 'Send'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
