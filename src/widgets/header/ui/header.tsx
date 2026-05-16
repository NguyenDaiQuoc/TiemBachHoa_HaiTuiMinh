import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Compass, Home, Layers, Menu, Moon, Package, Search, ShoppingBag, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '@/src/entities/cart/model/store';
import { useThemeStore } from '@/src/shared/store/theme-store';
import { Button } from '@/src/shared/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/src/shared/ui/sheet';
import { cn } from '@/src/shared/lib/utils';
import { SearchOverlay } from '@/src/features/search/ui/search-overlay';
import { CartDrawer } from '@/src/widgets/cart-drawer';
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

  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setTimeout(() => {
      searchButtonRef.current?.focus();
    }, 200);
  }, []);

  const toggleMegaMenu = (type: 'shop' | 'collections') => {
    setActiveMegaMenu((prev) => (prev === type ? null : type));
  };

  const navItems = [
    { label: 'CỬA HÀNG', type: 'shop' as const, path: '/products', icon: <Home className="h-5 w-5" /> },
    { label: 'KHÁM PHÁ', type: null, path: '/products', icon: <Compass className="h-5 w-5" /> },
    { label: 'THEO DÕI', type: null, path: '/tracking', icon: <Package className="h-5 w-5" /> },
    { label: 'BỘ SƯU TẬP', type: 'collections' as const, path: '/collections', icon: <Layers className="h-5 w-5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-lg border border-transparent transition-all hover:border-border/50 hover:bg-primary/5 md:hidden"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-[300px] border-r-border/50 bg-background/95 p-0 backdrop-blur-xl">
              <SheetHeader className="border-b border-border/50 p-6">
                <SheetTitle className="text-left">
                  <span className="font-heading text-xl font-black uppercase tracking-tight text-primary italic">
                    TIỆM BÁCH HOÁ HAI TỤI MÌNH
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-8 p-6">
                <div className="space-y-2">
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground">
                    Điều hướng
                  </p>
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
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[.3em] text-muted-foreground">
                    Kênh bán hàng
                  </p>
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

          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-heading text-xl font-black uppercase tracking-tight text-primary italic">
              TIỆM BÁCH HOÁ HAI TỤI MÌNH
            </span>
          </Link>
        </div>

        <nav className="hidden items-center space-x-6 md:flex">
          {navItems.map((item) => (
            <div key={item.label} className="group relative">
              {item.type ? (
                <button
                  onClick={() => toggleMegaMenu(item.type)}
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

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-full border border-transparent transition-all hover:border-border/50 hover:bg-primary/5"
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

          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              ref={searchButtonRef}
              variant="ghost"
              size="icon"
              onClick={handleOpenSearch}
              className="flex h-10 w-10 rounded-full border border-transparent transition-all hover:border-border/50 hover:bg-primary/5"
              aria-label="Tìm kiếm"
            >
              <Search className="h-5 w-5" />
            </Button>

            <AccountDropdown />

            <motion.div
              className="group relative cursor-pointer"
              onClick={() => setIsCartOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isAnimating ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-full border border-transparent p-2.5 transition-all group-hover:border-border/50 group-hover:bg-primary/5">
                <ShoppingBag className={cn('h-5 w-5 transition-colors', totalItemsCount > 0 && 'text-primary')} />
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

      <MegaMenu isOpen={!!activeMegaMenu} type={activeMegaMenu || 'shop'} onClose={() => setActiveMegaMenu(null)} />

      <CartDrawer isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
      <SearchOverlay isOpen={isSearchOpen} onClose={handleCloseSearch} />
    </header>
  );
};
