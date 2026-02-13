import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, UserRole } from '@/types';

interface AppState {
  userProfile: UserProfile | null;
  currentRole: UserRole | null;
  setUserProfile: (profile: UserProfile | null) => void;
  setCurrentRole: (role: UserRole | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userProfile: null,
      currentRole: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      setCurrentRole: (role) => set({ currentRole: role }),
      reset: () => set({ userProfile: null, currentRole: null }),
    }),
    {
      name: 'sas-transport-storage',
    }
  )
);
