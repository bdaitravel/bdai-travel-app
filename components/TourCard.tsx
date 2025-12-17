
import React, { useState, useEffect } from 'react';
import { Tour, Stop } from '../types';

interface ActiveTourCardProps {
    tour: Tour;
    currentStopIndex: number;
    onNext: () => void;
    onPrev: () => void;
    language: string;
    onCheckIn: (id: string, miles: number, type: string) => void;
    onEnrichStop: (id: string) => void;
    userLocation: {lat: number, lng: number} | null;
    audioPlayingId: string | null;
    audioLoadingId: string | null;
    onPlayAudio: (id: string, text: string) => Promise<void>;
    t: (key: string) => string;
}

export const TourCard: React.FC<any> = ({ tour, onSelect }) => (
    <div onClick={onSelect} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer h-full flex flex-col">
        <div className="h-60 relative overflow-hidden bg-slate-200">
            <img src={tour.imageUrl || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80`} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" alt={tour.title} />
            <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/90 backdrop-blur shadow-sm">
                    {tour.theme}
                </span>
            </div>
            {tour.isSponsored && (
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Featured</div>
            )}
        </div>
        <div className="p-6 flex flex-col flex-1">
            <div className="flex gap-2 mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tour.duration}</span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tour.distance}</span>
            </div>
            <h3 className="text-xl font-heading font-bold text-slate-900 mb-2 leading-tight group-hover:text-purple-600 transition-colors">{tour.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 font-medium">{tour.description}</p>
            <div className="mt-auto pt-6 flex justify-between items-center border-t border-slate-50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tour.stops.length} Paradas</span>
                <span className="text-purple-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Empezar <i className="fas fa-arrow-right ml-1"></i></span>
            </div>
        </div>
    </div>
);

export const ActiveTourCard: React.FC<ActiveTourCardProps> = ({ 
    tour, currentStopIndex, onNext, onPrev, onCheckIn, onEnrichStop, userLocation, audioPlayingId, audioLoadingId, onPlayAudio, t 
}) => {
    const stop = tour.stops[currentStopIndex];
    
    useEffect(() => {
        if (!stop.isRichInfo) onEnrichStop(stop.id);
    }, [currentStopIndex]);

    const formatDescription = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (line.includes('[HOOK]')) return <p key={i} className="mb-4 text-lg font-black text-slate-900 leading-tight italic">{line.replace('[HOOK]', '').trim()}</p>;
            if (line.includes('[STORY]')) return <p key={i} className="mb-4 text-slate-600 leading-relaxed font-medium">{line.replace('[STORY]', '').trim()}</p>;
            return <p key={i} className="mb-4 text-slate-600 leading-relaxed">{line}</p>;
        });
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar">
            <div className="px-6 py-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest px-3 py-1 bg-purple-50 rounded-full border border-purple-100">
                           {t('tourGuidePersona')} • {currentStopIndex + 1}/{tour.stops.length}
                        </span>
                        <h2 className="text-3xl font-heading font-black text-slate-900 tracking-tight leading-none">{stop.name}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onPlayAudio(stop.id, stop.description)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border ${audioPlayingId === stop.id ? 'bg-red-50 text-red-600 border-red-100' : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'}`}
                        >
                            {audioLoadingId === stop.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className={`fas ${audioPlayingId === stop.id ? 'fa-stop' : 'fa-volume-up'}`}></i>
                            )}
                        </button>
                        <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shadow-sm border border-slate-100"><i className="fas fa-share-alt"></i></button>
                    </div>
                </div>

                <div className="prose prose-slate max-w-none">
                    {formatDescription(stop.description)}
                </div>

                {/* Sección Única: Chismes de Local */}
                {stop.gossip && (
                    <div className="bg-amber-50 p-6 rounded-[2rem] border-2 border-dashed border-amber-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 transform rotate-12 transition-transform group-hover:rotate-45">
                            <i className="fas fa-comment-medical text-6xl text-amber-900"></i>
                        </div>
                        <div className="relative z-10">
                            <h4 className="flex items-center gap-2 text-amber-900 font-black uppercase text-[10px] tracking-widest mb-3">
                                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                {t('insiderGossip')}
                            </h4>
                            <p className="text-amber-900/80 font-bold italic text-sm leading-relaxed">"{stop.gossip}"</p>
                        </div>
                    </div>
                )}

                {/* Sección Única: Secretos Guardados / Did You Know */}
                {stop.curiosity && (
                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '15px 15px'}}></div>
                        <div className="relative z-10">
                            <h4 className="text-yellow-400 font-black uppercase text-[10px] tracking-widest mb-2">{t('didYouKnow')}</h4>
                            <p className="text-slate-300 text-sm font-medium leading-relaxed">{stop.curiosity}</p>
                        </div>
                    </div>
                )}

                <div className="pt-6 space-y-4">
                    <button 
                        onClick={() => onCheckIn(stop.id, 50, stop.type)} 
                        disabled={stop.visited}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${stop.visited ? 'bg-green-100 text-green-600 cursor-default' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-200'}`}
                    >
                        {stop.visited ? <><i className="fas fa-check-circle"></i> {t('collected')}</> : <><i className="fas fa-map-marker-alt"></i> {t('checkin')} +50 {t('miles')}</>}
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={onPrev} disabled={currentStopIndex === 0} className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-slate-100 text-slate-400 transition-all ${currentStopIndex === 0 ? 'opacity-30' : 'hover:bg-slate-50 text-slate-600'}`}>
                           <i className="fas fa-arrow-left mr-2"></i> {t('prev')}
                        </button>
                        <button onClick={onNext} className="py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-slate-900 text-white shadow-lg active:scale-95 transition-all">
                           {t('next')} <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
