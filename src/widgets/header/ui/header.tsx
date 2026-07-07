import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, ChevronDown, Gift, Home, Layers, Menu, Moon, Package, Search, ShoppingBag, Sun } from 'lucide-react';
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
    { label: 'Sản phẩm', type: 'shop' as const, path: '/products', icon: <Home className="h-5 w-5" /> },
    { label: 'Ưu đãi', type: null, path: '/flash-sale', icon: <Gift className="h-5 w-5" /> },
    { label: 'Cẩm nang', type: null, path: '/blog', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Theo dõi', type: null, path: '/tracking', icon: <Package className="h-5 w-5" /> },
    { label: 'Bộ sưu tập', type: 'collections' as const, path: '/collections', icon: <Layers className="h-5 w-5" /> },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-[60] w-full border-b border-border/60 bg-background/96 px-3 py-2 shadow-[0_18px_60px_-42px_hsl(var(--primary))] backdrop-blur-2xl sm:px-5">
      <div className="mx-auto grid h-14 w-full min-w-0 grid-cols-[1fr_auto] items-center gap-3 px-1 sm:h-16 sm:px-2 lg:h-[4.35rem] lg:grid-cols-[minmax(360px,1fr)_auto_minmax(360px,1fr)] lg:gap-8 xl:px-4">
        <div className="flex min-w-0 items-center justify-start gap-2 sm:gap-4 lg:pl-1">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-border/60 bg-background/80 transition-all hover:border-primary/35 hover:bg-primary/10 sm:h-10 sm:w-10 md:hidden"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-[320px] border-r-border/60 bg-background/95 p-0 backdrop-blur-xl">
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
                      className="group flex items-center gap-4 rounded-2xl border border-transparent p-4 transition-all hover:border-primary/15 hover:bg-primary/10"
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

          <Link to="/" className="group flex min-w-0 items-center gap-2" aria-label="Hai Tụi Mình home">
            <span className="flex min-w-0 items-center gap-x-2 text-primary">
              <span className="hidden font-heading text-xs font-black uppercase tracking-[0.14em] text-foreground transition-colors group-hover:text-primary sm:inline lg:text-[13px]">
                Tiệm bách hoá
              </span>
              <span className="shrink-0 whitespace-nowrap pb-1 font-accent text-[1.18rem] leading-none text-primary min-[380px]:text-[1.28rem] sm:text-[1.9rem] lg:text-[2.45rem]">Hai Tụi Mình</span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center justify-self-center rounded-full border border-border/60 bg-background/75 px-3 py-2 shadow-soft md:flex">
          {navItems.map((item) => (
            <div key={item.label} className="group relative" onMouseEnter={() => item.type && openMegaMenu(item.type)} onMouseLeave={() => item.type && scheduleMegaMenuClose()}>
              {item.type ? (
                <button
                  onClick={() => toggleMegaMenu(item.type)}
                  onFocus={() => openMegaMenu(item.type)}
                  className={cn(
                    'relative flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all xl:text-xs',
                    activeMegaMenu === item.type ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/55 hover:text-foreground'
                  )}
                >
                  {item.label}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', activeMegaMenu === item.type && 'rotate-180')} />
                </button>
              ) : (
                <Link
                  to={item.path}
                  className="group relative overflow-hidden rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-foreground transition-all hover:bg-muted/55 hover:text-foreground xl:text-xs"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-3 lg:justify-self-end lg:pr-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden h-9 w-9 rounded-full border border-border/60 bg-background/80 transition-all hover:border-primary/35 hover:bg-primary/10 min-[380px]:inline-flex sm:h-11 sm:w-11"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-accent" />}
              </motion.div>
            </AnimatePresence>
          </Button>

          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/75 px-1.5 py-1 shadow-soft sm:gap-2">
            <Button
              ref={searchButtonRef}
              variant="ghost"
              size="icon"
              onClick={handleOpenSearch}
              className="flex h-9 w-9 rounded-full border border-border/60 bg-background/80 transition-all hover:border-primary/35 hover:bg-primary/10 sm:h-11 sm:w-11"
              aria-label="Tìm kiếm"
            >
              <Search className="h-5 w-5" />
            </Button>

            <div className="hidden min-[380px]:block">
              <NotificationDropdown scope="user" />
            </div>

            <AccountDropdown />

            <motion.button
              type="button"
              data-cart-target
              data-testid="cart-trigger"
              aria-label={totalItemsCount > 0 ? `Mở giỏ hàng, ${totalItemsCount} sản phẩm` : 'Mở giỏ hàng'}
              className="group relative cursor-pointer"
              onClick={() => setIsCartOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isAnimating ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-full border border-border/60 bg-background/80 p-2 transition-all group-hover:border-primary/35 group-hover:bg-primary/10 sm:p-3">
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
            </motion.button>
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
