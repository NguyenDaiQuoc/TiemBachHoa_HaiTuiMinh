import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from './auth-store';

export const useAdminAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,
      setAuth: (user, token) => set({ user, token }),
      setHydrated: (state) => set({ isHydrated: state }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'admin-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
