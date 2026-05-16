import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const initializeTheme = () => {
  const storageKey = 'theme-storage';
  let theme: 'light' | 'dark' = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    if (storedTheme) {
      const parsed = JSON.parse(storedTheme) as { state?: { theme?: 'light' | 'dark' } };
      if (parsed.state?.theme === 'light' || parsed.state?.theme === 'dark') {
        theme = parsed.state.theme;
      }
    }
  } catch {
    window.localStorage.removeItem(storageKey);
  }

  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
};

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
