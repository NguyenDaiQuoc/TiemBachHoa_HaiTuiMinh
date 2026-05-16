import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  theme: 'light' | 'dark';
  isHydrated: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setHydrated: (hydrated: boolean) => void;
}

const applyTheme = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
};

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';

  const storedTheme = window.localStorage.getItem('theme-storage');
  if (storedTheme) {
    try {
      const parsed = JSON.parse(storedTheme) as { state?: { theme?: 'light' | 'dark' } };
      if (parsed.state?.theme === 'light' || parsed.state?.theme === 'dark') {
        applyTheme(parsed.state.theme);
        return parsed.state.theme;
      }
    } catch {
      window.localStorage.removeItem('theme-storage');
    }
  }

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(systemTheme);
  return systemTheme;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      isHydrated: false,
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
        set({ theme: nextTheme });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyTheme(state.theme);
        state.setHydrated(true);
      },
    }
  )
);
