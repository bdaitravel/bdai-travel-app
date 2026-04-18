import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TourCard } from '../components/TourCard';
import { CityCommunity } from '../components/CityCommunity';
import { formatCityName } from '../components/TravelServices';
import { useAppStore } from '../store/useAppStore';
import { useCity } from '../hooks/useCity';

export const CityDetailView: React.FC = () => {
  const { 
    userProfile: user, 
    selectedCityInfo, 
    activeTours: tours, 
    setCurrentTour: setActiveTour 
  } = useAppStore();
  const { processCitySelection } = useCity();
  const navigate = useNavigate();

  const slug = selectedCityInfo?.slug || '';

  return (
    <div className="pt-safe-iphone w-full max-w-lg md:max-w-4xl lg:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 animate-fade-in relative z-10">
      <header className="flex items-center gap-4 mb-8 py-4 sticky top-0 bg-[#020617]/80 backdrop-blur-xl z-20">
        <button onClick={() => navigate('/home')} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-90"><i className="fas fa-arrow-left text-xs"></i></button>
        <h2 className="text-lg font-black uppercase tracking-tighter text-white truncate flex-1">{formatCityName(selectedCityInfo?.city || '', user.language)}</h2>
        {user.isAdmin && (
          <button onClick={() => selectedCityInfo && processCitySelection({ city: selectedCityInfo.city, country: selectedCityInfo.country, countryEn: selectedCityInfo.countryEn, slug: selectedCityInfo.slug }, user.language, true)} 
            className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center active:rotate-180 transition-transform">
            <i className="fas fa-sync-alt text-xs"></i>
          </button>
        )}
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {tours.map((tour, idx) => (
          <TourCard key={`${tour.id}-${idx}`} tour={tour} onSelect={() => { 
              setActiveTour(tour); 
              navigate(`/tour/${tour.id}/stop/0`);
          }} language={user.language} />
        ))}
        {slug && <CityCommunity citySlug={slug} user={user} />}
      </div>
    </div>
  );
};
