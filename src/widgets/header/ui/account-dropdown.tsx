import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, ChevronRight, Eye, Trophy, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/shared/ui/dropdown-menu';
import { Button } from '@/src/shared/ui/button';
import { notificationKeys } from '@/src/shared/api/notification-api';
import { queryClient } from '@/src/shared/lib/react-query';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { useSupportUnreadStore } from '@/src/shared/model/support-unread-store';
import { useWishlistStore } from '@/src/shared/store/wishlist-store';
import { cn, formatCurrencyVND } from '@/src/shared/lib/utils';
import { calculateLoyalty } from '@/src/entities/user/lib/loyalty';

const isAdminRole = (role?: string) => role === 'ADMIN' || role === 'SUPERADMIN' || role === 'STAFF';

export const AccountDropdown = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const resetUserUnread = useSupportUnreadStore((state) => state.resetUserUnread);
  const wishlistCount = useWishlistStore((state) => state.ids.length);
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const loyalty = React.useMemo(() => calculateLoyalty(user?.membershipPoints || 0), [user?.membershipPoints]);
  const { currentTier, nextTier, progress, estimatedSavings } = loyalty;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network error and clear local auth anyway
    }
    logout();
    resetUserUnread();
    queryClient.setQueryData(notificationKeys.scope('user'), { items: [], unreadCount: 0 });
    queryClient.removeQueries({ queryKey: notificationKeys.scope('user') });
    navigate('/');
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      timeoutRef.current = setTimeout(() => setIsOpen(false), 300);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) {
    return (
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-transparent outline-none transition-all hover:border-border/50 hover:bg-primary/5">
            <User className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[100] mt-2 w-72 rounded-[24px] border border-border/50 bg-background/95 p-4 shadow-2xl outline-none backdrop-blur-xl">
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tài khoản</p>
                <h3 className="mt-2 text-lg font-black uppercase tracking-tight">Chào mừng bạn</h3>
                <p className="mt-1 text-sm text-muted-foreground">Đăng nhập để theo dõi đơn hàng, lưu sản phẩm yêu thích và nhận ưu đãi riêng.</p>
              </div>
            </DropdownMenuLabel>

            <div className="mt-4 grid gap-3">
              <Button onClick={() => navigate('/login')} className="h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Đăng nhập
              </Button>
              <Button variant="outline" onClick={() => navigate('/register')} className="h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Đăng ký
              </Button>
            </div>

            <DropdownMenuSeparator className="my-4 opacity-50" />

            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuItem className="h-10 cursor-pointer rounded-xl focus:bg-primary/5 group" onClick={() => navigate('/products')}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Khám phá sản phẩm</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="h-10 cursor-pointer rounded-xl focus:bg-primary/5 group" onClick={() => navigate('/community')}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 transition-transform group-hover:scale-110">
                  <Heart className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Vào cộng đồng</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-transparent outline-none transition-all hover:border-border/50 hover:bg-primary/5">
          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-black uppercase italic text-primary">
            {user.avatar ? <img src={user.avatar} alt={user.name || ''} className="h-full w-full object-cover" /> : user.name?.[0] || user.email[0]}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[100] mt-2 w-80 rounded-[24px] border border-border/50 bg-background/95 p-4 shadow-2xl outline-none backdrop-blur-xl">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 p-2">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-xl font-black uppercase italic text-primary">
                  {user.avatar ? <img src={user.avatar} alt={user.name || ''} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" /> : user.name?.[0] || user.email[0]}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-black uppercase tracking-tight">{user.name || 'Thành viên'}</p>
                  <p className="max-w-[180px] truncate text-[10px] font-medium text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <div className="mt-4 cursor-pointer space-y-3 rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50" onClick={() => navigate('/profile/membership')}>
            <div className="flex items-center justify-between">
              <div className={cn('rounded-full border border-border/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest', currentTier.color, currentTier.bg)}>
                Thành viên {currentTier.name}
              </div>
              <div className="group flex items-center gap-1 text-[9px] font-black uppercase tracking-widest italic text-primary transition-transform hover:translate-x-1">
                Đặc quyền <ChevronRight className="h-3 w-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="uppercase text-muted-foreground opacity-60">{nextTier ? `Tiến trình lên hạng ${nextTier.name}` : 'Bạn đã đạt hạng tối đa'}</span>
                <span className="text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div style={{ width: `${progress}%` }} className="h-full bg-primary transition-all duration-1000" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground">
                Tiết kiệm ước tính: <span className="text-foreground">{formatCurrencyVND(estimatedSavings)}</span>
              </p>
            </div>
          </div>

          <DropdownMenuSeparator className="my-3 opacity-50" />

          <DropdownMenuGroup className="space-y-1">
            {isAdminRole(user.role) && (
              <DropdownMenuItem className="h-10 cursor-pointer rounded-xl focus:bg-primary/5 group" onClick={() => navigate('/admin')}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 transition-transform group-hover:scale-110">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Vào trang quản trị</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="h-10 cursor-pointer rounded-xl focus:bg-primary/5 group" onClick={() => navigate('/profile')}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 transition-transform group-hover:scale-110">
                <User className="h-4 w-4 text-indigo-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Thông tin cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 cursor-pointer rounded-xl focus:bg-primary/5 group" onClick={() => navigate('/profile/orders')}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 transition-transform group-hover:scale-110">
                <Package className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Đơn hàng của tôi</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 cursor-pointer rounded-xl focus:bg-primary/5 group" onClick={() => navigate('/profile/wishlist')}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 transition-transform group-hover:scale-110">
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Danh sách yêu thích</span>
              {wishlistCount > 0 && <span className="ml-auto rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-black text-rose-500">{wishlistCount}</span>}
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 cursor-pointer rounded-xl focus:bg-primary/5 group" onClick={() => navigate('/profile/recently-viewed')}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 transition-transform group-hover:scale-110">
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Đã xem gần đây</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-3 opacity-50" />

          <DropdownMenuGroup className="space-y-1">
            <DropdownMenuItem className="h-10 cursor-pointer rounded-xl focus:bg-primary/5 group" onClick={() => navigate('/profile/membership')}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 transition-transform group-hover:scale-110">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Hạng thành viên</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 cursor-pointer rounded-xl focus:bg-primary/5 group" onClick={() => navigate('/profile/settings')}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted transition-transform group-hover:scale-110">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Cài đặt tài khoản</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 cursor-pointer rounded-xl text-destructive focus:bg-destructive/5 group" onClick={() => void handleLogout()}>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 transition-transform group-hover:scale-110">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
