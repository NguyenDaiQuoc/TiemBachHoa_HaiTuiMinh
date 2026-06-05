import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AdminLocale = 'vi' | 'en';

interface AdminUiState {
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
  toggleLocale: () => void;
}

export const useAdminUiStore = create<AdminUiState>()(
  persist(
    (set, get) => ({
      locale: 'vi',
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set({ locale: get().locale === 'vi' ? 'en' : 'vi' }),
    }),
    {
      name: 'admin-ui-storage',
    }
  )
);
