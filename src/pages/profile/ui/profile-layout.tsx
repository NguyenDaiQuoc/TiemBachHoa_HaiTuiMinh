import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { User, MapPin, Package, ShieldCheck, LogOut, ChevronRight, Bell, Heart, Eye, Trophy, Menu, Settings, Gift } from 'lucide-react';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { Card } from '@/src/shared/ui/card';
import { cn } from '@/src/shared/lib/utils';
import { MobileProfileNav } from './mobile-profile-nav';
import { Button } from '@/src/shared/ui/button';
import { calculateLoyalty } from '@/src/entities/user/lib/loyalty';
import { notificationKeys } from '@/src/shared/api/notification-api';
import { queryClient } from '@/src/shared/lib/react-query';
import { useSupportUnreadStore } from '@/src/shared/model/support-unread-store';

export const ProfileLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const resetUserUnread = useSupportUnreadStore((state) => state.resetUserUnread);

  const loyalty = React.useMemo(() => calculateLoyalty(user?.membershipPoints || 0), [user?.membershipPoints]);
  const { currentTier, progress } = loyalty;

  if (!user) {
    return null;
  }

  const menuItems = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User, path: '/profile' },
    { id: 'notifications', label: 'Trung tâm thông báo', icon: Bell, path: '/profile/notifications' },
    { id: 'vouchers', label: 'Voucher của tôi', icon: Gift, path: '/profile/vouchers' },
    { id: 'orders', label: 'Lịch sử đơn hàng', icon: Package, path: '/profile/orders' },
    { id: 'wishlist', label: 'Danh sách yêu thích', icon: Heart, path: '/profile/wishlist' },
    { id: 'recent', label: 'Sản phẩm vừa xem', icon: Eye, path: '/profile/recently-viewed' },
    { id: 'membership', label: 'Hạng thành viên', icon: Trophy, path: '/profile/membership' },
    { id: 'addresses', label: 'Địa chỉ của tôi', icon: MapPin, path: '/profile/addresses' },
    { id: 'security', label: 'Mật khẩu & bảo mật', icon: ShieldCheck, path: '/profile/security' },
    { id: 'settings', label: 'Cài đặt thông báo', icon: Settings, path: '/profile/settings' },
  ];

  const handleLogout = () => {
    logout();
    resetUserUnread();
    queryClient.setQueryData(notificationKeys.scope('user'), { items: [], unreadCount: 0 });
    queryClient.removeQueries({ queryKey: notificationKeys.scope('user') });
    navigate('/');
  };

  const currentPath = location.pathname;
  const currentTitle = menuItems.find((item) => item.path === currentPath)?.label || 'Quản lý tài khoản';

  return (
    <div className="bg-background px-4 pb-20 pt-10 md:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="mb-4 flex items-center justify-between rounded-[24px] border border-border/50 bg-card p-4 shadow-soft lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
              {user.avatar ? <img src={user.avatar} alt={user.name || 'Người dùng'} className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold leading-none">{user.name || 'Khách hàng'}</h3>
              <p className="mt-1 text-xs tracking-wide text-muted-foreground">{currentTitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileNavOpen(true)} className="h-10 w-10 rounded-xl bg-muted/30 hover:bg-muted">
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <aside className="hidden space-y-6 lg:col-span-3 lg:block">
          <Card className="group relative overflow-hidden border border-border/50 bg-card/90 p-6 shadow-soft backdrop-blur-md">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5 transition-transform group-hover:scale-110" />
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 ring-4 ring-background shadow-xl transition-transform group-hover:scale-105">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || 'Người dùng'} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-heading text-3xl font-semibold text-primary">{user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}</span>
                )}
              </div>
              <h2 className="w-full truncate font-heading text-3xl font-semibold tracking-tight">{user.name || 'Người dùng'}</h2>
              <p className="mt-1 w-full truncate text-xs tracking-[0.18em] text-muted-foreground">{user.email}</p>

              <div
                className="mt-6 w-full cursor-pointer rounded-xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50 dark:bg-muted/10"
                onClick={() => navigate('/profile/membership')}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={cn('font-heading text-sm font-semibold', currentTier.color)}>Hạng {currentTier.name}</span>
                  <span className="text-xs font-semibold text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary" />
                </div>
              </div>
            </div>
          </Card>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path || (item.path !== '/profile' && currentPath.startsWith(item.path));
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-2xl p-4 transition-all duration-300',
                    isActive ? 'translate-x-2 bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'border border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span className="font-heading text-base font-semibold">{item.label}</span>
                  </div>
                  <ChevronRight
                    className={cn('h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1', isActive ? 'text-primary-foreground' : 'text-muted-foreground')}
                  />
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="group mt-4 flex w-full items-center gap-3 rounded-2xl p-4 text-rose-500 transition-all duration-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-heading text-base font-semibold">Đăng xuất</span>
            </button>
          </nav>
        </aside>

        <main className="min-h-[600px] lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileProfileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} menuItems={menuItems} onLogout={handleLogout} />
    </div>
  );
};
