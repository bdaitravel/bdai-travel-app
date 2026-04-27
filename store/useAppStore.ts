import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { UserProfile, Tour } from '../types';
import { getEnvAwareStorage } from '../services/storageProvider';
 
export const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
  email: '', language: 'es', miles: 0, rank: 'ZERO', 
  culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0,
  interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, 
  stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 }, 
  visitedCities: [], completedTours: [], badges: [], stamps: [], capturedMoments: [], audioSpeed: 1.0
};
 
interface AppState {
  
  // Audio Player State (en memoria, no persistido)
  audioPlayer: {
    isPlaying: boolean;
    currentTrackId: string | null;
  };
  setAudioPlaying: (isPlaying: boolean, trackId?: string) => void;
 
  // Data State (solo userProfile se persiste)
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  
  // Estado de navegación — NO se persiste. La URL es la fuente de verdad.
  // CityDetailView se autoabastece de Supabase si estos están vacíos al montar.
  activeTours: Tour[];
  setActiveTours: (tours: Tour[] | ((prev: Tour[]) => Tour[])) => void;
  
  currentTour: Tour | null;
  setCurrentTour: (tour: Tour | null | ((prev: Tour | null) => Tour | null)) => void;
  
  currentStopIndex: number;
  setCurrentStopIndex: (index: number) => void;
  
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
 
  selectedCityInfo: { city: string; country: string; countryEn: string; slug: string } | null;
  setSelectedCityInfo: (info: { city: string; country: string; countryEn: string; slug: string } | null) => void;
  
  // Global UI States (no persistidos)
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  
  loadingMessage: string;
  setLoadingMessage: (msg: string) => void;
 
  showOnboarding: boolean;
  setShowOnboarding: (val: boolean) => void;
 
  visaToShare: { cityName: string; miles: number } | null;
  setVisaToShare: (val: { cityName: string; miles: number } | null) => void;
 
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
 
  clearSession: () => void;
}
 
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      
      audioPlayer: { isPlaying: false, currentTrackId: null },
      setAudioPlaying: (isPlaying, trackId) => set((state) => ({ 
        audioPlayer: { 
            isPlaying, 
            currentTrackId: trackId !== undefined ? trackId : state.audioPlayer.currentTrackId 
        } 
      })),
 
      userProfile: GUEST_PROFILE,
      setUserProfile: (profile) => set((state) => ({ 
        userProfile: typeof profile === 'function' ? profile(state.userProfile) : profile 
      })),
      updateUserProfile: (updates) => set((state) => ({ 
        userProfile: { ...state.userProfile, ...updates } 
      })),
      
      // Estado de navegación — siempre empieza vacío, se llena al navegar
      activeTours: [],
      setActiveTours: (tours) => set((state) => ({ 
        activeTours: typeof tours === 'function' ? tours(state.activeTours) : tours 
      })),
      
      currentTour: null,
      setCurrentTour: (tour) => set((state) => ({ 
        currentTour: typeof tour === 'function' ? tour(state.currentTour) : tour, 
        currentStopIndex: 0 
      })),
      
      currentStopIndex: 0,
      setCurrentStopIndex: (index) => set({ currentStopIndex: index }),
      
      userLocation: null,
      setUserLocation: (loc) => set({ userLocation: loc }),
 
      selectedCityInfo: null,
      setSelectedCityInfo: (info) => set({ selectedCityInfo: info }),
      
      isLoading: false,
      setIsLoading: (val) => set({ isLoading: val }),
 
      loadingMessage: '',
      setLoadingMessage: (msg) => set({ loadingMessage: msg }),
 
      showOnboarding: false,
      setShowOnboarding: (val) => set({ showOnboarding: val }),
 
      visaToShare: null,
      setVisaToShare: (val) => set({ visaToShare: val }),
 
      hasHydrated: false,
      setHasHydrated: (val) => set({ hasHydrated: val }),
 
      clearSession: () => set({
        userProfile: GUEST_PROFILE,
        activeTours: [],
        currentTour: null,
        currentStopIndex: 0,
        audioPlayer: { isPlaying: false, currentTrackId: null },
        selectedCityInfo: null,
        isLoading: false,
        loadingMessage: '',
        showOnboarding: false,
        visaToShare: null
      })
    }),
    {
      name: 'bdai-app-storage',
      storage: createJSONStorage(() => getEnvAwareStorage()),
      // Solo se persiste el perfil del usuario.
      // activeTours y selectedCityInfo son estado de navegación:
      // la URL es la fuente de verdad y CityDetailView se autoabastece de Supabase.
      partialize: (state) => ({
        userProfile: state.userProfile,
        currentStopIndex: state.currentStopIndex,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);