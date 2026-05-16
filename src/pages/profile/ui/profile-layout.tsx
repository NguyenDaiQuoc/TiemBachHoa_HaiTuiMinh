import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  User, 
  MapPin, 
  Package, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  Bell,
  Heart,
  Eye,
  Trophy,
  Menu,
  Settings
} from 'lucide-react';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { Card } from '@/src/shared/ui/card';
import { cn } from '@/src/shared/lib/utils';
import { MobileProfileNav } from './mobile-profile-nav';
import { Button } from '@/src/shared/ui/button';

import { calculateLoyalty } from '@/src/entities/user/lib/loyalty';

export const ProfileLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const loyalty = React.useMemo(() => calculateLoyalty(user?.membershipPoints || 0), [user?.membershipPoints]);
  const { currentTier, progress } = loyalty;

  if (!user) {
    return null;
  }

  const menuItems = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User, path: '/profile' },
    { id: 'orders', label: 'Lịch sử đơn hàng', icon: Package, path: '/profile/orders' },
    { id: 'wishlist', label: 'Danh sách yêu thích', icon: Heart, path: '/profile/wishlist' },
    { id: 'recent', label: 'Sản phẩm vừa xem', icon: Eye, path: '/profile/recently-viewed' },
    { id: 'membership', label: 'Hạng thành viên', icon: Trophy, path: '/profile/membership' },
    { id: 'addresses', label: 'Địa chỉ của tôi', icon: MapPin, path: '/profile/addresses' },
    { id: 'security', label: 'Mật khẩu & Bảo mật', icon: ShieldCheck, path: '/profile/security' },
    { id: 'settings', label: 'Cài đặt thông báo', icon: Bell, path: '/profile/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentPath = location.pathname;
  const currentTitle = menuItems.find(item => item.path === currentPath)?.label || 'Quản lý tài khoản';

  return (
    <div className="bg-background pt-10 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between bg-card border border-border/50 p-4 rounded-[24px] shadow-soft mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-primary" />}
             </div>
             <div>
                <h3 className="text-xs font-black uppercase tracking-tight italic leading-none">{user.name || 'User'}</h3>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{currentTitle}</p>
             </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileNavOpen(true)}
            className="rounded-xl h-10 w-10 bg-muted/30 hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <Card className="p-6 overflow-hidden relative group border border-border/50 shadow-soft bg-card/90 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="relative flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-background shadow-xl overflow-hidden group-hover:scale-105 transition-transform">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-primary italic uppercase">
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black uppercase italic tracking-tight truncate w-full">{user.name || 'Người dùng'}</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 truncate w-full">{user.email}</p>
              
              <div className="mt-6 w-full p-4 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/profile/membership')}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", currentTier.color)}>Hạng {currentTier.name}</span>
                  <span className="text-[9px] font-black text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={reduceMotion ? false : { width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary"
                  />
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
                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-2" 
                      : "hover:bg-card border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 opacity-50 transition-transform group-hover:translate-x-1",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                </Link>
              );
            })}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-300 mt-4 group"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-xs font-black uppercase tracking-widest">Đăng xuất</span>
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="lg:col-span-9 min-h-[600px]">
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

      <MobileProfileNav 
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        menuItems={menuItems}
        onLogout={handleLogout}
      />
    </div>
  );
};
