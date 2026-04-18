import React from 'react';
import { BdaiLogo } from '../components/BdaiLogo';
import { LANGUAGES } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useAppStore } from '../store/useAppStore';

export const LoginView: React.FC = () => {
    const { userProfile: user, isLoading } = useAppStore();
    const { 
        loginPhase, 
        setLoginPhase, 
        email, 
        setEmail, 
        otpToken, 
        setOtpToken, 
        handleRequestOtp, 
        handleGoogleLogin, 
        handleVerifyOtp 
    } = useAuth();
    
    const { t, handleLangChange } = useTranslation();

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-10 relative bg-[#020617]">
            <div className="text-center flex flex-col items-center mb-10 mt-[-15dvh] animate-fade-in">
            <BdaiLogo className="w-32 h-32 mb-4 animate-pulse-logo" />
            <h1 className="text-6xl font-black lowercase tracking-tighter text-white/95 leading-none">bdai</h1>
            <p className="text-[10px] font-medium text-purple-400 mt-2 lowercase opacity-80">better destinations by ai</p>
            </div>

            {loginPhase === 'EMAIL' ? (
            <div className="w-full max-w-[280px] space-y-4 animate-fade-in">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading}
                className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-center text-white outline-none text-sm font-medium placeholder-slate-700 shadow-inner focus:border-purple-500/50 transition-all" 
                placeholder={t('emailPlaceholder')} />
                <button onClick={handleRequestOtp} disabled={isLoading}
                className="w-full h-14 bg-white text-slate-950 rounded-2xl font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
                {t('requestAccess')}
                </button>
                <div className="flex items-center gap-4 py-1">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">{t('socialAccess')}</span>
                <div className="h-px bg-white/5 flex-1"></div>
                </div>
                <button onClick={handleGoogleLogin} disabled={isLoading}
                className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-2xl font-black lowercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <i className="fab fa-google text-[10px] text-purple-400"></i>google
                </button>
            </div>
            ) : (
            <div className="w-full max-w-[280px] space-y-6 animate-fade-in">
                <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('enterCode')}</p>
                <p className="text-[10px] font-bold text-purple-400/80 truncate">{email}</p>
                </div>
                <input type="text" maxLength={8} value={otpToken} onChange={e => setOtpToken(e.target.value)} disabled={isLoading}
                className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-center text-white outline-none text-2xl font-black tracking-[0.5em] shadow-inner focus:border-purple-500/50 transition-all" 
                placeholder="00000000" />
                <div className="flex gap-2">
                <button onClick={() => setLoginPhase('EMAIL')} disabled={isLoading}
                    className="flex-1 h-14 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black lowercase text-[10px] tracking-widest disabled:opacity-50">
                    {t('back')}
                </button>
                <button onClick={handleVerifyOtp} disabled={otpToken.length < 8 || isLoading}
                    className="flex-[2] h-14 bg-purple-600 text-white rounded-2xl font-black lowercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30">
                    {t('verifyCode')}
                </button>
                </div>
            </div>
            )}

            <div className="absolute bottom-10 left-0 right-0 px-8 flex flex-col items-center">
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
        </div>
    );
};
