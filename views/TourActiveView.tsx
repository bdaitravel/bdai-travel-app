import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ActiveTourCard } from '../components/TourCard';
import { Tour, UserProfile } from '../types';

interface TourActiveViewProps {
  activeTour: Tour | null;
  user: UserProfile;
  currentStopIndex: number;
  setCurrentStopIndex: (idx: number) => void;
  navigate: (path: string) => void;
  updateUserAndSync: (u: UserProfile) => void;
  setVisaToShare: (val: { cityName: string, miles: number } | null) => void;
  userLocation: { lat: number, lng: number } | null;
  selectedCitySlug: string;
}

export const TourActiveView: React.FC<TourActiveViewProps> = ({
  activeTour, user, currentStopIndex, 
  setCurrentStopIndex, navigate, updateUserAndSync, 
  setVisaToShare, userLocation, selectedCitySlug
}) => {
  const { tourId, stopIdx } = useParams();
  const idx = parseInt(stopIdx || '0', 10);
  
  useEffect(() => {
    if (idx !== currentStopIndex) {
        setCurrentStopIndex(idx);
    }
  }, [tourId, idx, currentStopIndex, setCurrentStopIndex]);

  if (!activeTour) return null;

  return (
    <ActiveTourCard 
      tour={activeTour} 
      user={user} 
      currentStopIndex={idx} 
      onNext={() => navigate(`/tour/${tourId}/stop/${idx + 1}`)} 
      onPrev={() => navigate(`/tour/${tourId}/stop/${idx - 1}`)} 
      onJumpTo={(i: number) => navigate(`/tour/${tourId}/stop/${i}`)} 
      onUpdateUser={(u: any) => updateUserAndSync(u)} 
      language={user.language} 
      onBack={() => navigate(`/city/${selectedCitySlug || ''}`)} 
      userLocation={userLocation} 
      onTourComplete={() => setVisaToShare({ cityName: activeTour.city, miles: activeTour.stops.reduce((acc, s) => acc + (s.photoSpot?.milesReward || 0), 0) })} 
    />
  );
};
