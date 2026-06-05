import { motion } from 'motion/react';
import {
  Blocks,
  Building2,
  ChevronLeft,
  Gift,
  Globe2,
  LayoutDashboard,
  LineChart,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareMore,
  Moon,
  Package,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useThemeStore } from '@/src/shared/store/theme-store';
import { useAdminAuthStore } from '@/src/shared/model/admin-auth-store';
import { notificationKeys } from '@/src/shared/api/notification-api';
import { queryClient } from '@/src/shared/lib/react-query';
import { cn } from '@/src/shared/lib/utils';
import { useSupportUnreadStore } from '@/src/shared/model/support-unread-store';
import { Button } from '@/src/shared/ui/button';
import { useAdminUiStore } from '@/src/shared/store/admin-ui-store';
import { NotificationDropdown } from '@/src/shared/ui/notification-dropdown';
import { ScrollToTopButton } from '@/src/shared/ui/scroll-to-top-button';

const copy = {
  vi: {
    brand: 'Trung tâm quản trị',
    language: 'Ngôn ngữ',
    profile: 'Hồ sơ quản trị',
    notifications: 'Thông báo',
    searchPlaceholder: 'Tìm đơn hàng, sản phẩm, khách hàng...',
    emptySearch: 'Nhập từ khóa để tìm nhanh trong khu vực quản trị.',
    refreshed: 'Đã làm mới dữ liệu quản trị.',
    nav: {
      dashboard: 'Tổng quan',
      orders: 'Đơn hàng',
      products: 'Sản phẩm',
      categories: 'Danh mục',
      suppliers: 'Nhà cung cấp',
      marketing: 'Marketing',
      customers: 'Khách hàng',
      vouchers: 'Voucher',
      support: 'Tư vấn',
      analytics: 'Phân tích',
      settings: 'Cài đặt',
      storefront: 'Trang bán hàng',
      signOut: 'Đăng xuất',
      refresh: 'Làm mới dữ liệu',
      theme: 'Đổi giao diện',
    },
  },
  en: {
    brand: 'Admin Control Center',
    language: 'Language',
    profile: 'Admin profile',
    notifications: 'Notifications',
    searchPlaceholder: 'Search orders, products, customers...',
    emptySearch: 'Enter a keyword to search inside admin.',
    refreshed: 'Admin data refreshed.',
    nav: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      products: 'Products',
      categories: 'Categories',
      suppliers: 'Suppliers',
      marketing: 'Marketing',
      customers: 'Customers',
      vouchers: 'Vouchers',
      support: 'Support',
      analytics: 'Analytics',
      settings: 'Settings',
      storefront: 'Storefront',
      signOut: 'Sign out',
      refresh: 'Refresh data',
      theme: 'Change theme',
    },
  },
} as const;

export interface AdminOutletContext {
  refreshTick: number;
  triggerRefresh: () => void;
}

export const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { logout, token, user } = useAdminAuthStore();
  const locale = useAdminUiStore((state) => state.locale);
  const toggleLocale = useAdminUiStore((state) => state.toggleLocale);
  const incrementAdminUnread = useSupportUnreadStore((state) => state.incrementAdminUnread);
  const resetAdminUnread = useSupportUnreadStore((state) => state.resetAdminUnread);
  const t = copy[locale];

  const navItems = useMemo(
    () => [
      { icon: LayoutDashboard, label: t.nav.dashboard, path: '/admin' },
      { icon: ShoppingCart, label: t.nav.orders, path: '/admin/orders' },
      { icon: Package, label: t.nav.products, path: '/admin/products' },
      { icon: Blocks, label: t.nav.categories, path: '/admin/categories' },
      { icon: Building2, label: t.nav.suppliers, path: '/admin/suppliers' },
      { icon: Megaphone, label: t.nav.marketing, path: '/admin/marketing' },
      { icon: Users, label: t.nav.customers, path: '/admin/customers' },
      { icon: Gift, label: t.nav.vouchers, path: '/admin/vouchers' },
      { icon: MessageSquareMore, label: t.nav.support, path: '/admin/support' },
      { icon: LineChart, label: t.nav.analytics, path: '/admin/analytics' },
      { icon: Settings, label: t.nav.settings, path: '/admin/settings' },
    ],
    [t]
  );

  const titleMap = useMemo(
    () =>
      ({
        ...Object.fromEntries(navItems.map((item) => [item.path, item.label])),
        '/admin/profile': t.profile,
        '/admin/notifications': t.notifications,
      }) as Record<string, string>,
    [navItems, t.notifications, t.profile]
  );

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!token) {
      resetAdminUnread();
      return;
    }

    const stream = new EventSource(`/api/admin/support/stream?token=${encodeURIComponent(token)}`);

    const handleSupport = () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.scope('admin') });
      if (!location.pathname.startsWith('/admin/support')) {
        incrementAdminUnread();
      }
    };

    const handleError = () => {
      stream.close();
    };

    stream.addEventListener('support', handleSupport);
    stream.onerror = handleError;

    return () => {
      stream.removeEventListener('support', handleSupport);
      stream.onerror = null;
      stream.close();
    };
  }, [incrementAdminUnread, location.pathname, resetAdminUnread, token]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/support')) {
      resetAdminUnread();
    }
  }, [location.pathname, resetAdminUnread]);

  const handleRefresh = () => {
    setRefreshTick((prev) => prev + 1);
    toast.success(t.refreshed);
  };

  const handleQuickSearch = () => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      toast.info(t.emptySearch);
      return;
    }

    if (normalizedQuery.includes('order') || normalizedQuery.includes('đơn')) return navigate('/admin/orders');
    if (normalizedQuery.includes('product') || normalizedQuery.includes('sản') || normalizedQuery.includes('kho')) return navigate('/admin/products');
    if (normalizedQuery.includes('category') || normalizedQuery.includes('danh mục')) return navigate('/admin/categories');
    if (normalizedQuery.includes('supplier') || normalizedQuery.includes('nhà cung cấp') || normalizedQuery.includes('ncc')) return navigate('/admin/suppliers');
    if (normalizedQuery.includes('marketing') || normalizedQuery.includes('deal') || normalizedQuery.includes('flash') || normalizedQuery.includes('khuyến mãi'))
      return navigate('/admin/marketing');
    if (normalizedQuery.includes('customer') || normalizedQuery.includes('khách') || normalizedQuery.includes('user')) return navigate('/admin/customers');
    if (normalizedQuery.includes('voucher') || normalizedQuery.includes('mã') || normalizedQuery.includes('gift')) return navigate('/admin/vouchers');
    if (normalizedQuery.includes('support') || normalizedQuery.includes('chat') || normalizedQuery.includes('tư vấn')) return navigate('/admin/support');
    if (normalizedQuery.includes('analytic') || normalizedQuery.includes('phân') || normalizedQuery.includes('report')) return navigate('/admin/analytics');
    if (normalizedQuery.includes('notification') || normalizedQuery.includes('thông báo')) return navigate('/admin/notifications');
    navigate('/admin/settings');
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Local logout should still proceed.
    }

    logout();
    resetAdminUnread();
    queryClient.setQueryData(notificationKeys.scope('admin'), { items: [], unreadCount: 0 });
    queryClient.removeQueries({ queryKey: notificationKeys.scope('admin') });
    navigate('/admin/login');
  };

  const renderNavItem = (item: (typeof navItems)[number], closeMobile = false) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/admin'}
      onClick={() => {
        if (closeMobile) setIsMobileOpen(false);
      }}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-4 rounded-2xl p-4 transition-all duration-200',
          isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      }
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {isSidebarOpen || closeMobile ? (
        <span className="font-heading text-sm font-semibold tracking-wide">{item.label}</span>
      ) : (
        <div className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-lg bg-black px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white opacity-0 transition-opacity group-hover:opacity-100">
          {item.label}
        </div>
      )}
    </NavLink>
  );

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-surface-sunken font-sans selection:bg-primary selection:text-white">
      <motion.aside
        animate={{ width: isSidebarOpen ? 292 : 88 }}
        className={cn(
          'sticky top-0 z-50 hidden h-screen flex-col border-r border-border/50 bg-surface-default transition-all duration-300 lg:flex',
          !isSidebarOpen && 'items-center'
        )}
      >
        <div className="flex h-20 items-center justify-between overflow-hidden p-6">
          {isSidebarOpen ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">H</div>
              <div className="min-w-0">
                <p className="font-heading text-xl font-semibold tracking-tight text-foreground">{t.brand}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">HTM Admin</p>
              </div>
            </motion.div>
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">H</div>
          )}
        </div>

        <nav className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-4 py-6">{navItems.map((item) => renderNavItem(item))}</nav>

        <div className="space-y-2 border-t border-border/50 p-4">
          <Button
            variant="ghost"
            className={cn('h-12 w-full gap-4 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground', !isSidebarOpen && 'justify-center p-0')}
            onClick={toggleLocale}
          >
            <Globe2 className="h-5 w-5" />
            {isSidebarOpen && <span className="font-heading text-sm font-semibold">{t.language}: {locale.toUpperCase()}</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn('h-12 w-full gap-4 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground', !isSidebarOpen && 'justify-center p-0')}
            onClick={() => navigate('/')}
          >
            <Package className="h-5 w-5" />
            {isSidebarOpen && <span className="font-heading text-sm font-semibold">{t.nav.storefront}</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              'h-12 w-full gap-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
              !isSidebarOpen && 'justify-center p-0'
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="font-heading text-sm font-semibold">{t.nav.signOut}</span>}
          </Button>

          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="group mt-4 flex h-8 w-full items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }}>
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-40 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-surface-default/80 px-3 py-3 backdrop-blur-xl sm:px-4 lg:min-h-20 lg:px-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <div className="hidden md:block">
              <p className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">{titleMap[location.pathname] || t.nav.dashboard}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3 lg:flex-none lg:gap-4">
            <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-10 w-10 shrink-0 rounded-xl bg-surface-sunken sm:h-11 sm:w-11">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/support')} className="h-10 w-10 shrink-0 rounded-xl bg-surface-sunken sm:h-11 sm:w-11">
              <MessageSquareMore className="h-5 w-5 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10 shrink-0 rounded-xl bg-surface-sunken sm:h-11 sm:w-11">
              {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-primary" />}
            </Button>
            <div className="relative hidden xl:block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleQuickSearch()}
                placeholder={t.searchPlaceholder}
                className="h-11 w-64 rounded-xl bg-surface-sunken pl-10 pr-4 text-sm transition-all ring-primary/20 focus:ring-2 2xl:w-72"
              />
            </div>
            <div className="shrink-0 rounded-xl bg-surface-sunken p-0.5">
              <NotificationDropdown scope="admin" />
            </div>
            <button onClick={() => navigate('/admin/profile')} className="h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-primary/20 transition-all hover:ring-2 sm:h-11 sm:w-11">
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-semibold text-primary">
                {user?.avatar ? <img src={user.avatar} alt={user.name || 'Admin'} className="h-full w-full object-cover" /> : user?.name?.[0] || 'A'}
              </div>
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-10">
          <Outlet context={{ refreshTick, triggerRefresh: handleRefresh } satisfies AdminOutletContext} />
        </main>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <motion.div initial={{ x: -280 }} animate={{ x: 0 }} className="absolute bottom-0 left-0 top-0 flex w-[min(292px,86vw)] flex-col bg-surface-default shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-border/50 p-6">
              <div>
                <p className="font-heading text-xl font-semibold tracking-tight">{t.brand}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">HTM Admin</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto p-4">{navItems.map((item) => renderNavItem(item, true))}</nav>

            <div className="space-y-3 border-t border-border/50 p-6">
              <Button variant="outline" onClick={handleRefresh} className="h-12 w-full rounded-xl text-[11px] font-semibold">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.nav.refresh}
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/support')} className="h-12 w-full rounded-xl text-[11px] font-semibold">
                <MessageSquareMore className="mr-2 h-4 w-4" />
                {t.nav.support}
              </Button>
              <Button variant="outline" onClick={toggleTheme} className="h-12 w-full rounded-xl text-[11px] font-semibold">
                {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {t.nav.theme}
              </Button>
              <Button variant="outline" onClick={toggleLocale} className="h-12 w-full rounded-xl text-[11px] font-semibold">
                <Globe2 className="mr-2 h-4 w-4" />
                {t.language}: {locale.toUpperCase()}
              </Button>
              <Button onClick={handleSignOut} className="h-12 w-full rounded-xl bg-destructive text-[11px] font-semibold hover:bg-destructive/90">
                {t.nav.signOut}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-3 sm:bottom-6 sm:right-6">
        <Button
          type="button"
          size="icon"
          onClick={() => navigate('/admin/support')}
          className="h-12 w-12 rounded-full border border-border/60 bg-primary text-primary-foreground shadow-xl hover:bg-primary/90"
          aria-label={t.nav.support}
        >
          <MessageSquareMore className="h-5 w-5" />
        </Button>
        <ScrollToTopButton />
      </div>
    </div>
  );
};
