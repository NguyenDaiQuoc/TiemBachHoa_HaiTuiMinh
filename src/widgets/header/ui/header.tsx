import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, ChevronDown, Gift, Layers, Menu, Moon, Package, Search, ShoppingBag, Sun, Store } from 'lucide-react';
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
import { AnnouncementBar } from './announcement-bar';

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
      const timer = window.setTimeout(() => setIsAnimating(false), 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
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

  const handleOpenSearch = useCallback(() => setIsSearchOpen(true), []);
  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    window.setTimeout(() => searchButtonRef.current?.focus(), 200);
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
    { label: 'Sản phẩm', type: 'shop' as const, path: '/products', icon: <Store className="h-5 w-5" /> },
    { label: 'Deal hôm nay', type: null, path: '/flash-sale', icon: <Gift className="h-5 w-5" /> },
    { label: 'Cẩm nang', type: null, path: '/blog', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Tra cứu đơn', type: null, path: '/tracking', icon: <Package className="h-5 w-5" /> },
    { label: 'Bộ sưu tập', type: 'collections' as const, path: '/collections', icon: <Layers className="h-5 w-5" /> },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-[70] w-full border-b border-primary/20 bg-card text-foreground shadow-[0_12px_34px_-28px_rgba(0,0,0,.8)]">
      <AnnouncementBar />
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-3 sm:px-5 lg:h-[4.8rem]">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl border border-border bg-card md:hidden"
                  aria-label="Mở menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-[330px] border-r-border bg-card p-0">
              <SheetHeader className="border-b border-border p-5">
                <SheetTitle className="text-left">
                  <span className="block text-xs font-black uppercase tracking-[0.16em] text-primary">Tiệm bách hóa</span>
                  <span className="font-accent text-3xl leading-tight text-primary">Hai Tụi Mình</span>
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-6 p-5">
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-primary/20 hover:bg-secondary"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">{item.icon}</div>
                      <span className="text-sm font-black uppercase tracking-[0.08em]">{item.label}</span>
                    </Link>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-border pt-5">
                  {['Facebook', 'Instagram', 'Zalo', 'Shopee'].map((social) => (
                    <Button key={social} variant="outline" className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                      {social}
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex min-w-0 shrink flex-col justify-center gap-1 py-1" aria-label="Hai Tụi Mình home">
            <span className="hidden text-[9px] font-black uppercase leading-none tracking-[0.12em] text-primary 2xl:block 2xl:text-xs">Tiệm bách hóa</span>
            <span className="block whitespace-nowrap font-accent text-[1.15rem] leading-[1.15] text-primary min-[390px]:text-[1.28rem] sm:text-[1.75rem] lg:text-[1.95rem] xl:text-[2.2rem]">
              Hai Tụi Mình
            </span>
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-1 lg:flex">
          {navItems.map((item) => (
            <div key={item.label} className="relative" onMouseEnter={() => item.type && openMegaMenu(item.type)} onMouseLeave={() => item.type && scheduleMegaMenuClose()}>
              {item.type ? (
                <button
                  type="button"
                  onClick={() => toggleMegaMenu(item.type)}
                  onFocus={() => openMegaMenu(item.type)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] transition-colors',
                    activeMegaMenu === item.type ? 'bg-secondary text-primary' : 'text-foreground hover:bg-secondary hover:text-primary'
                  )}
                >
                  {item.label}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', activeMegaMenu === item.type && 'rotate-180')} />
                </button>
              ) : (
                <Link
                  to={item.path}
                  className="block rounded-xl px-3 py-2.5 text-[12px] font-black uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-secondary hover:text-primary"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
          <Button
            ref={searchButtonRef}
            variant="ghost"
            size="icon"
            onClick={handleOpenSearch}
            className="h-10 w-10 rounded-xl border border-border bg-card transition-colors hover:border-primary/35 hover:bg-secondary sm:h-11 sm:w-11"
            aria-label="Tìm kiếm"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden h-11 w-11 rounded-xl border border-border bg-card transition-colors hover:border-primary/35 hover:bg-secondary sm:inline-flex"
            aria-label="Đổi giao diện sáng tối"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
          </Button>

          <div className="hidden sm:block">
            <NotificationDropdown scope="user" />
          </div>

          <AccountDropdown />

          <motion.button
            type="button"
            data-cart-target
            data-testid="cart-trigger"
            aria-label={totalItemsCount > 0 ? `Mở giỏ hàng, ${totalItemsCount} sản phẩm` : 'Mở giỏ hàng'}
            className="group relative z-[90] cursor-pointer"
            onClick={() => setIsCartOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            animate={isAnimating ? { scale: [1, 1.14, 1], rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-xl bg-accent p-2.5 text-white shadow-sm transition-colors group-hover:bg-accent/90 sm:p-3">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <AnimatePresence>
              {totalItemsCount > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1 text-[10px] font-black text-primary-foreground"
                >
                  {totalItemsCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
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
