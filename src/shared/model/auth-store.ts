import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string | null;
  username?: string | null;
  phone?: string | null;
  avatar?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | "HIDDEN";
  birthDate?: string | Date | null;
  bio?: string | null;
  role: string;
  membershipPoints?: number;
  createdAt?: string | Date;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  setHydrated: (state: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
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
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
