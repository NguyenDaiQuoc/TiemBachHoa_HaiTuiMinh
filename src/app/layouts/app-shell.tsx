import { Suspense, lazy, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { Header } from '@/src/widgets/header';
import { Footer } from '@/src/widgets/footer';
import { cn } from '@/src/shared/lib/utils';

const FloatingActions = lazy(() =>
  import('@/src/widgets/floating-actions').then((module) => ({ default: module.FloatingActions }))
);

export const AppShell = () => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const raf = window.requestAnimationFrame(() => {
      main.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#app-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <Header />
      <main
        id="app-main-content"
        ref={mainRef}
        tabIndex={-1}
        className={cn(
          'flex-1 outline-none bg-background text-foreground',
          reduceMotion ? 'transition-none' : 'transition-colors duration-300'
        )}
      >
        <Outlet />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <FloatingActions />
      </Suspense>
    </div>
  );
};
