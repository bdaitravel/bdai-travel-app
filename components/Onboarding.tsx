
import React, { useEffect, useState } from 'react';
import { BdaiLogo } from './BdaiLogo';
import { generateDaiWelcome } from '../services/geminiService';
import { UserProfile } from '../types';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
    user: UserProfile;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language, user }) => {
    const [welcomeMessage, setWelcomeMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWelcome = async () => {
            try {
                const msg = await generateDaiWelcome(user);
                setWelcomeMessage(msg);
            } catch (e) {
                setWelcomeMessage("Welcome to bdai. You start as ZERO. Conquer the world to become ZENITH.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchWelcome();
    }, [user, language]);

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col items-center p-6 overflow-y-auto no-scrollbar animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-600/30 to-transparent"></div>
            
            <div className="w-full max-w-sm mt-12 flex flex-col items-center relative z-10">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[3.5rem] shadow-2xl backdrop-blur-xl w-full flex flex-col items-center">
                    <BdaiLogo className="w-16 h-16 mb-6 animate-pulse-logo" />
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center leading-tight">DAI PROTOCOL</h2>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.4em] mt-3 text-center">Better Destinations by AI</p>
                    
                    <div className="w-full mt-10 p-6 bg-white/[0.03] border border-white/10 rounded-3xl relative">
                        <div className="absolute -top-3 left-6 bg-purple-600 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest text-white">DAI_VOICE</div>
                        {isLoading ? (
                            <div className="space-y-2">
                                <div className="h-2 bg-white/10 rounded animate-pulse w-full"></div>
                                <div className="h-2 bg-white/10 rounded animate-pulse w-3/4"></div>
                                <div className="h-2 bg-white/10 rounded animate-pulse w-1/2"></div>
                            </div>
                        ) : (
                            <p className="text-slate-300 text-sm font-medium italic leading-relaxed">
                                "{welcomeMessage}"
                            </p>
                        )}
                    </div>

                    <div className="w-full space-y-4 mt-8">
                        <div className="flex gap-4 items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                                <i className="fas fa-search text-white text-xs"></i>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-black uppercase text-[10px] tracking-widest">Explore</h4>
                                <p className="text-slate-500 text-[8px] font-bold uppercase">Search cities and launch thematic tours</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                                <i className="fas fa-location-dot text-white text-xs"></i>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-black uppercase text-[10px] tracking-widest">Verify</h4>
                                <p className="text-slate-500 text-[8px] font-bold uppercase">Approach stops to earn miles and stamps</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                                <i className="fas fa-ranking-star text-white text-xs"></i>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-black uppercase text-[10px] tracking-widest">Rank Up</h4>
                                <p className="text-slate-500 text-[8px] font-bold uppercase">From ZERO to ZENITH in the global ranking</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={onComplete} className="w-full mt-10 py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all">
                        I UNDERSTAND, DAI
                    </button>
                </div>
            </div>
        </div>
    );
};

