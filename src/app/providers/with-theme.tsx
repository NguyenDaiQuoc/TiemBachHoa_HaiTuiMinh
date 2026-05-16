import React, { useLayoutEffect } from 'react';
import { useThemeStore } from '@/src/shared/store/theme-store';

export const withTheme = (Component: React.ComponentType) => () => {
  const { theme, isHydrated } = useThemeStore();

  useLayoutEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <div
      className={theme}
      data-theme-ready={isHydrated}
      suppressHydrationWarning
    >
      <Component />
    </div>
  );
};
