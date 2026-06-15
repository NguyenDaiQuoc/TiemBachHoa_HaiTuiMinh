import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, ChevronDown, Compass, Home, Layers, Menu, Moon, Package, Search, ShoppingBag, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '@/src/entities/cart/model/store';
import { useThemeStore } from '@/src/shared/store/theme-store';
import { Button } from '@/src/shared/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/src/shared/ui/sheet';
import { cn } from '@/src/shared/lib/utils';
import { SearchOverlay } from '@/src/features/search/ui/search-overlay';
import { CartDrawer } from '@/src/widgets/cart-drawer';
import { NotificationDropdown } from '@/src/shared/ui/notification-dropdown';
import { AccountDropdown } from './account-dropdown';
import { MegaMenu } from './mega-menu';

export const Header = () => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const totalItemsCount = useCartStore((state) => state.totalItems());

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<'shop' | 'collections' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const megaMenuCloseTimerRef = useRef<number | null>(null);
  const location = useLocation();

  useEffect(() => {
    setIsSearchOpen(false);
    setActiveMegaMenu(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (totalItemsCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [totalItemsCount]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveMegaMenu(null);
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    return () => {
      if (megaMenuCloseTimerRef.current) window.clearTimeout(megaMenuCloseTimerRef.current);
    };
  }, []);

  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setTimeout(() => {
      searchButtonRef.current?.focus();
    }, 200);
  }, []);

  const clearMegaMenuCloseTimer = () => {
    if (!megaMenuCloseTimerRef.current) return;
    window.clearTimeout(megaMenuCloseTimerRef.current);
    megaMenuCloseTimerRef.current = null;
  };

  const openMegaMenu = (type: 'shop' | 'collections') => {
    clearMegaMenuCloseTimer();
    setActiveMegaMenu(type);
  };

  const scheduleMegaMenuClose = () => {
    clearMegaMenuCloseTimer();
    megaMenuCloseTimerRef.current = window.setTimeout(() => setActiveMegaMenu(null), 180);
  };

  const toggleMegaMenu = (type: 'shop' | 'collections') => {
    clearMegaMenuCloseTimer();
    setActiveMegaMenu((prev) => (prev === type ? null : type));
  };

  const navItems = [
    { label: 'Cửa hàng', type: 'shop' as const, path: '/products', icon: <Home className="h-5 w-5" /> },
    { label: 'Khám phá', type: null, path: '/products', icon: <Compass className="h-5 w-5" /> },
    { label: 'Cẩm nang', type: null, path: '/blog', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Theo dõi', type: null, path: '/tracking', icon: <Package className="h-5 w-5" /> },
    { label: 'Bộ sưu tập', type: 'collections' as const, path: '/collections', icon: <Layers className="h-5 w-5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 min-w-0 items-center justify-between gap-2 px-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg border border-transparent transition-all hover:border-border/50 hover:bg-primary/5 sm:h-10 sm:w-10 md:hidden"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-[300px] border-r-border/50 bg-background/95 p-0 backdrop-blur-xl">
              <SheetHeader className="border-b border-border/50 p-6">
                <SheetTitle className="text-left">
                  <span className="flex flex-wrap items-end gap-x-2 text-primary">
                    <span className="font-heading text-lg font-semibold uppercase tracking-[0.16em] text-foreground">
                      Tiệm bách hoá
                    </span>
                    <span className="font-accent text-[1.9rem] leading-none text-primary">Hai Tụi Mình</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-8 p-6">
                <div className="space-y-2">
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground">Điều hướng</p>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      className="group flex items-center gap-4 rounded-2xl p-4 transition-all hover:bg-primary/5"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors group-hover:text-primary">
                        {item.icon}
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="space-y-4 border-t border-border/50 pt-8">
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground">Kênh bán hàng</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['Facebook', 'Instagram', 'Zalo', 'Shopee'].map((social) => (
                      <Button key={social} variant="outline" className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                        {social}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="group flex min-w-0 items-center gap-2" aria-label="Hai Tui Minh home">
            <span className="flex min-w-0 items-end gap-x-2 text-primary">
              <span className="hidden font-heading text-lg font-semibold uppercase tracking-[0.16em] text-foreground transition-colors group-hover:text-primary sm:inline">
                Tiệm bách hoá
              </span>
              <span className="shrink-0 whitespace-nowrap font-accent text-[1.05rem] leading-none text-primary min-[380px]:text-[1.18rem] sm:text-[1.75rem] lg:text-[1.95rem]">Hai Tụi Mình</span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center space-x-6 md:flex">
          {navItems.map((item) => (
            <div key={item.label} className="group relative" onMouseEnter={() => item.type && openMegaMenu(item.type)} onMouseLeave={() => item.type && scheduleMegaMenuClose()}>
              {item.type ? (
                <button
                  onClick={() => toggleMegaMenu(item.type)}
                  onFocus={() => openMegaMenu(item.type)}
                  className={cn(
                    'flex items-center gap-1.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                    activeMegaMenu === item.type ? 'text-primary' : 'text-foreground/60'
                  )}
                >
                  {item.label}
                  <ChevronDown className={cn('h-3 w-3 transition-transform', activeMegaMenu === item.type && 'rotate-180')} />
                  <span
                    className={cn(
                      'absolute bottom-0 left-0 h-[2px] w-full origin-left bg-primary transition-transform',
                      activeMegaMenu === item.type ? 'scale-x-100' : 'scale-x-0'
                    )}
                  />
                </button>
              ) : (
                <Link
                  to={item.path}
                  className="group relative overflow-hidden py-1 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 transition-all hover:text-foreground"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-primary transition-transform group-hover:scale-x-100" />
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden h-9 w-9 rounded-full border border-transparent transition-all hover:border-border/50 hover:bg-primary/5 min-[380px]:inline-flex sm:h-10 sm:w-10"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
              </motion.div>
            </AnimatePresence>
          </Button>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              ref={searchButtonRef}
              variant="ghost"
              size="icon"
              onClick={handleOpenSearch}
              className="flex h-9 w-9 rounded-full border border-transparent transition-all hover:border-border/50 hover:bg-primary/5 sm:h-10 sm:w-10"
              aria-label="Tìm kiếm"
            >
              <Search className="h-5 w-5" />
            </Button>

            <div className="hidden min-[380px]:block">
              <NotificationDropdown scope="user" />
            </div>

            <AccountDropdown />

            <motion.div
              className="group relative cursor-pointer"
              onClick={() => setIsCartOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isAnimating ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-full border border-transparent p-2 transition-all group-hover:border-border/50 group-hover:bg-primary/5 sm:p-2.5">
                <ShoppingBag className={cn('h-4 w-4 transition-colors sm:h-5 sm:w-5', totalItemsCount > 0 && 'text-primary')} />
              </div>
              <AnimatePresence>
                {totalItemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-black text-primary-foreground shadow-lg"
                  >
                    {totalItemsCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      <MegaMenu
        isOpen={!!activeMegaMenu}
        type={activeMegaMenu || 'shop'}
        onClose={() => setActiveMegaMenu(null)}
        onMouseEnter={clearMegaMenuCloseTimer}
        onMouseLeave={scheduleMegaMenuClose}
      />

      <CartDrawer isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
      <SearchOverlay isOpen={isSearchOpen} onClose={handleCloseSearch} />
    </header>
  );
};
