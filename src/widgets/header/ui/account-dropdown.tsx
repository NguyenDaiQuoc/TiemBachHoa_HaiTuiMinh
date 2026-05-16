import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, ChevronRight, Eye, Trophy } from 'lucide-react';
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
import { useAuthStore } from '@/src/shared/model/auth-store';
import { useWishlistStore } from '@/src/shared/store/wishlist-store';
import { cn, formatCurrencyVND } from '@/src/shared/lib/utils';
import { calculateLoyalty } from '@/src/entities/user/lib/loyalty';

export const AccountDropdown = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const wishlistCount = useWishlistStore((state) => state.ids.length);
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const loyalty = React.useMemo(() => calculateLoyalty(user?.membershipPoints || 0), [user?.membershipPoints]);
  const { currentTier, nextTier, progress, estimatedSavings } = loyalty;

  const handleLogout = () => {
    logout();
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
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-primary/5 transition-all w-10 h-10 border border-transparent hover:border-border/50"
        onClick={() => navigate('/login')}
        aria-label="Đăng nhập"
      >
        <User className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger className="rounded-full hover:bg-primary/5 transition-all w-10 h-10 border border-transparent hover:border-border/50 overflow-hidden outline-none flex items-center justify-center cursor-pointer">
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-xs uppercase italic">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name || ''} className="w-full h-full object-cover" />
            ) : (
              user.name?.[0] || user.email[0]
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 p-4 rounded-[24px] border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl mt-2 outline-none z-[100]"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 p-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl italic uppercase overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name || ''} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                  ) : (
                    user.name?.[0] || user.email[0]
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-black uppercase tracking-tight">{user.name || 'Thành viên'}</p>
                  <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[180px]">{user.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <div
            className="mt-4 p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/profile/membership')}
          >
            <div className="flex items-center justify-between">
              <div className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-border/50', currentTier.color, currentTier.bg)}>
                Thành viên {currentTier.name}
              </div>
              <div className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest italic group hover:translate-x-1 transition-transform">
                Đặc quyền <ChevronRight className="h-3 w-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-muted-foreground uppercase opacity-60">
                  {nextTier ? `Tiến trình lên hạng ${nextTier.name}` : 'Bạn đã đạt hạng tối đa'}
                </span>
                <span className="text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div style={{ width: `${progress}%` }} className="h-full bg-primary transition-all duration-1000" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground">
                Tiết kiệm ước tính: <span className="text-foreground">{formatCurrencyVND(estimatedSavings)}</span>
              </p>
            </div>
          </div>

          <DropdownMenuSeparator className="my-3 opacity-50" />

          <DropdownMenuGroup className="space-y-1">
            <DropdownMenuItem className="h-10 rounded-xl focus:bg-primary/5 cursor-pointer group" onClick={() => navigate('/profile')}>
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="h-4 w-4 text-indigo-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Thông tin cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 rounded-xl focus:bg-primary/5 cursor-pointer group" onClick={() => navigate('/profile/orders')}>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Đơn hàng của tôi</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 rounded-xl focus:bg-primary/5 cursor-pointer group" onClick={() => navigate('/profile/wishlist')}>
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Danh sách yêu thích</span>
              {wishlistCount > 0 && (
                <span className="ml-auto text-[10px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md">{wishlistCount}</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 rounded-xl focus:bg-primary/5 cursor-pointer group" onClick={() => navigate('/profile/recently-viewed')}>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Đã xem gần đây</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-3 opacity-50" />

          <DropdownMenuGroup className="space-y-1">
            <DropdownMenuItem className="h-10 rounded-xl focus:bg-primary/5 cursor-pointer group" onClick={() => navigate('/profile/membership')}>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Hạng thành viên</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 rounded-xl focus:bg-primary/5 cursor-pointer group" onClick={() => navigate('/profile/settings')}>
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Cài đặt tài khoản</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 rounded-xl focus:bg-destructive/5 text-destructive cursor-pointer group" onClick={handleLogout}>
              <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
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
