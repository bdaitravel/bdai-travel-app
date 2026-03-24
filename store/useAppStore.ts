import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { UserProfile, Tour, AppView } from '../types';
import { getEnvAwareStorage } from '../services/storageProvider';

export const GUEST_PROFILE: UserProfile = { 
  id: 'guest', isLoggedIn: false, firstName: '', lastName: '', name: '', username: 'traveler', 
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", 
  email: '', language: 'es', miles: 0, rank: 'ZERO', 
  culturePoints: 0, foodPoints: 0, photoPoints: 0, historyPoints: 0, naturePoints: 0, artPoints: 0, archPoints: 0,
  interests: [], accessibility: 'standard', isPublic: false, bio: '', age: 25, 
  stats: { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 }, 
  visitedCities: [], completedTours: [], badges: [], stamps: [], capturedMoments: []
};

interface AppState {
  // Navigation & UI
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  
  // Audio Player State (Kept in memory, not persisted to disk)
  audioPlayer: {
    isPlaying: boolean;
    currentTrackId: string | null;
  };
  setAudioPlaying: (isPlaying: boolean, trackId?: string) => void;

  // Data State (Persisted based on environment)
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  
  activeTours: Tour[];
  setActiveTours: (tours: Tour[] | ((prev: Tour[]) => Tour[])) => void;
  
  currentTour: Tour | null;
  setCurrentTour: (tour: Tour | null | ((prev: Tour | null) => Tour | null)) => void;
  
  currentStopIndex: number;
  setCurrentStopIndex: (index: number) => void;
  
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  
  clearSession: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: AppView.LOGIN,
      setCurrentView: (view) => set({ currentView: view }),
      
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
      
      clearSession: () => set({
        currentView: AppView.LOGIN,
        userProfile: GUEST_PROFILE,
        activeTours: [],
        currentTour: null,
        currentStopIndex: 0,
        audioPlayer: { isPlaying: false, currentTrackId: null }
      })
    }),
    {
      name: 'bdai-app-storage',
      storage: createJSONStorage(() => getEnvAwareStorage()),
      // Don't persist ephemeral player state or location
      partialize: (state) => ({
        userProfile: state.userProfile,
        activeTours: state.activeTours,
        currentTour: state.currentTour,
        currentStopIndex: state.currentStopIndex,
      }),
    }
  )
);
