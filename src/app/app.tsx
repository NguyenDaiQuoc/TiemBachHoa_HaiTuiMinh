import { BrowserRouter } from 'react-router-dom';
import { withQuery } from './providers/with-query';
import { withTheme } from './providers/with-theme';
import { Toaster } from '@/src/shared/ui/sonner';
import { AppRoutes } from './routes';

const AppRoot = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <AppRoutes />
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
};

export const App = withTheme(withQuery(AppRoot));
