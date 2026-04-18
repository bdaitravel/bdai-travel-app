import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ActiveTourCard } from '../components/TourCard';
import { useAppStore } from '../store/useAppStore';
import { syncUserProfile } from '../services/supabaseClient';

export const TourActiveView: React.FC = () => {
  const { 
    currentTour: activeTour, 
    userProfile: user, 
    currentStopIndex, 
    setCurrentStopIndex, 
    setUserProfile,
    setVisaToShare,
    userLocation,
    selectedCityInfo
  } = useAppStore();

  const navigate = useNavigate();
  const { tourId, stopIdx } = useParams();
  const idx = parseInt(stopIdx || '0', 10);
  
  useEffect(() => {
    if (idx !== currentStopIndex) {
        setCurrentStopIndex(idx);
    }
  }, [tourId, idx, currentStopIndex, setCurrentStopIndex]);

  const updateUserAndSync = (u: any) => {
    setUserProfile(u);
    if (u.isLoggedIn) syncUserProfile(u);
  };

  if (!activeTour) return null;

  return (
    <ActiveTourCard 
      tour={activeTour} 
      user={user} 
      currentStopIndex={idx} 
      onNext={() => navigate(`/tour/${tourId}/stop/${idx + 1}`)} 
      onPrev={() => navigate(`/tour/${tourId}/stop/${idx - 1}`)} 
      onJumpTo={(i: number) => navigate(`/tour/${tourId}/stop/${i}`)} 
      onUpdateUser={updateUserAndSync} 
      language={user.language} 
      onBack={() => navigate(`/city/${selectedCityInfo?.slug || ''}`)} 
      userLocation={userLocation} 
      onTourComplete={() => setVisaToShare({ cityName: activeTour.city, miles: activeTour.stops.reduce((acc, s) => acc + (s.photoSpot?.milesReward || 0), 0) })} 
    />
  );
};
