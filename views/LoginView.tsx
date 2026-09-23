import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { BdaiLogo } from '../components/BdaiLogo';
import { AppleLogo } from '../components/AppleLogo';
import { LANGUAGES } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';

// Apple exige (normativa 4.8 de App Review) que si se ofrece un login social
// de terceros (Google) también se ofrezca "Sign in with Apple" con el mismo
// peso — la forma más simple de cumplirlo es mostrar solo Apple en iOS en
// vez de los dos a la vez. Android y web siguen con Google como siempre.
const isIOS = Capacitor.getPlatform() === 'ios';

export const LoginView: React.FC = () => {
    const { userProfile: user, isLoading } = useAppStore();
    const {
        handleGoogleLogin,
        handleAppleLogin,
        handleContinueAsGuest
    } = useAuth();

    const { t, handleLangChange } = useTranslation();
    const [showGuestWarning, setShowGuestWarning] = useState(false);

    return (
        <div className="min-h-full w-full flex flex-col items-center p-6 sm:p-10 bg-[#020617] overflow-y-auto overflow-x-hidden">
            <div className="flex-1 min-h-[1.5rem]"></div>
            <div className="text-center flex flex-col items-center mb-10 animate-fade-in">
            <BdaiLogo className="w-32 h-32 mb-4 animate-pulse-logo" />
            <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 leading-none">bdai</h1>
            <p className="text-[10px] font-medium text-purple-400 mt-2 lowercase opacity-80">better destinations by ai</p>
            </div>

            {/* Dos opciones, mismo peso visual: cuenta real (Google/Apple) o explorar sin
                registrarte. Ya no hay login por email + código: se quitó por problemas de
                entrega de esos correos con el servicio de email por defecto de Supabase (ver
                AGENTS.md). */}
            <div className="w-full max-w-[280px] space-y-4 animate-fade-in">
                {isIOS ? (
                // Apple exige el botón oficial "Sign in with Apple" (logomark + texto exactos,
                // sin recolorear ni sustituir el logo por un icono de terceros — Guideline 4).
                // AppleLogo usa el SVG "Logo-only" descargado de Apple Design Resources tal cual,
                // no un icono de terceros ni un glifo de fuente.
                <button onClick={handleAppleLogin} disabled={isLoading}
                className="w-full h-14 bg-black border border-white/10 text-white rounded-2xl font-bold text-[16px] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <AppleLogo className="w-5 h-5" color="#FFFFFF" />
                <span>{t('signInWithApple')}</span>
                </button>
                ) : (
                <button onClick={handleGoogleLogin} disabled={isLoading}
                className="w-full h-14 bg-white text-slate-900 rounded-2xl font-black text-[14px] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <i className="fab fa-google text-base text-purple-600"></i>Google
                </button>
                )}

                <div className="flex items-center gap-4 py-1">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">{t('orDivider')}</span>
                <div className="h-px bg-white/5 flex-1"></div>
                </div>

                {/* Guideline 5.1.1(v): tiene que poder explorar sin registrarse con un solo
                    toque — ahora con el mismo peso visual que Google/Apple, ya que solo quedan
                    estas dos opciones. Antes de crear la cuenta anónima, avisa de que el
                    progreso queda solo en este dispositivo (mismo mensaje que en el perfil,
                    aquí ANTES de confirmar en vez de después). */}
                <button onClick={() => setShowGuestWarning(true)} disabled={isLoading}
                className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[14px] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <i className="fas fa-compass text-base text-purple-400"></i>{t('exploreGuest')}
                </button>
            </div>

            <div className="flex-1 min-h-[1.5rem]"></div>

            <div className="w-full px-8 flex flex-col items-center pb-8 pt-4">
            <div className="relative group">
                <select value={user.language} onChange={(e) => handleLangChange(e.target.value)} disabled={isLoading}
                className="appearance-none bg-white/5 border border-white/10 rounded-full px-6 py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-purple-500/40 transition-all cursor-pointer pr-10">
                {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">{lang.name}</option>
                ))}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[7px] text-slate-600 pointer-events-none"></i>
            </div>
            </div>

            {showGuestWarning && (
                <div className="fixed inset-0 z-[10000] bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
                    <div className="w-full max-w-[320px] bg-slate-900/80 border border-amber-500/30 p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl">
                        <div className="flex items-start gap-3 mb-6">
                            <i className="fas fa-triangle-exclamation text-amber-500 text-sm mt-0.5"></i>
                            <div>
                                <p className="text-amber-500 font-black text-[11px] uppercase tracking-widest leading-tight mb-1">{t('guestWarningTitle')}</p>
                                <p className="text-slate-300 text-[11px] leading-relaxed">{t('guestWarningText')}</p>
                            </div>
                        </div>
                        <button onClick={() => { setShowGuestWarning(false); handleContinueAsGuest(); }} disabled={isLoading}
                            className="w-full h-14 bg-purple-600 text-white rounded-2xl font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 mb-2">
                            {t('guestWarningConfirm')}
                        </button>
                        <button onClick={() => setShowGuestWarning(false)} disabled={isLoading}
                            className="w-full h-11 text-slate-400 font-black lowercase text-[10px] tracking-widest">
                            {t('guestWarningCancel')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
