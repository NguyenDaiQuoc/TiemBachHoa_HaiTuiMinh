import {
  Bell,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Gift,
  Info,
  Loader2,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotificationCenter } from '@/src/shared/api/notification-api';
import { AuthScope, useScopedAuthState } from '@/src/shared/model/auth-utils';
import { AppNotificationItem } from '@/src/shared/model/notification';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/src/shared/ui/dropdown-menu';

const toneMap = {
  INFO: {
    card: 'border-border/60 bg-card',
    iconWrap: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
    icon: Info,
    label: 'Thông tin',
  },
  SUCCESS: {
    card: 'border-emerald-500/30 bg-emerald-500/5',
    iconWrap: 'bg-emerald-500/10 text-emerald-600',
    icon: ShieldCheck,
    label: 'Thành công',
  },
  WARNING: {
    card: 'border-amber-500/30 bg-amber-500/5',
    iconWrap: 'bg-amber-500/10 text-amber-600',
    icon: CircleAlert,
    label: 'Cảnh báo',
  },
  ORDER: {
    card: 'border-sky-500/30 bg-sky-500/5',
    iconWrap: 'bg-sky-500/10 text-sky-600',
    icon: Package,
    label: 'Đơn hàng',
  },
  PROMOTION: {
    card: 'border-fuchsia-500/30 bg-fuchsia-500/5',
    iconWrap: 'bg-fuchsia-500/10 text-fuchsia-600',
    icon: Gift,
    label: 'Ưu đãi',
  },
  STOCK: {
    card: 'border-orange-500/30 bg-orange-500/5',
    iconWrap: 'bg-orange-500/10 text-orange-600',
    icon: Package,
    label: 'Kho',
  },
  CUSTOMER: {
    card: 'border-cyan-500/30 bg-cyan-500/5',
    iconWrap: 'bg-cyan-500/10 text-cyan-600',
    icon: ShieldCheck,
    label: 'Khách hàng',
  },
  VOUCHER: {
    card: 'border-pink-500/30 bg-pink-500/5',
    iconWrap: 'bg-pink-500/10 text-pink-600',
    icon: Gift,
    label: 'Voucher',
  },
  SYSTEM: {
    card: 'border-violet-500/30 bg-violet-500/5',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    icon: Sparkles,
    label: 'Hệ thống',
  },
} as const;

const getTone = (type: string) => toneMap[type as keyof typeof toneMap] || toneMap.INFO;

const getNotificationCategory = (item: AppNotificationItem) => {
  const category = typeof item.metadata?.category === 'string' ? item.metadata.category.toLowerCase() : null;
  if (category) return category;

  if (item.type === 'CUSTOMER') return 'customer';
  if (item.type === 'VOUCHER' || item.type === 'PROMOTION') return 'voucher';
  if (item.type === 'STOCK') return 'stock';
  if (item.type === 'ORDER') return 'order';
  return null;
};

const getNotificationLabel = (item: AppNotificationItem) => {
  const category = getNotificationCategory(item);
  if (category === 'stock') return 'Kho';
  if (category === 'customer') return 'Khách hàng';
  if (category === 'voucher') return 'Voucher';
  if (category === 'order') return 'Đơn hàng';
  return getTone(item.type).label;
};

const isPriorityNotification = (item: AppNotificationItem) => ['order', 'stock', 'voucher', 'customer'].includes(getNotificationCategory(item) || '');

const copy = {
  user: {
    empty: 'Chưa có thông báo mới.',
    guestTitle: 'Đăng nhập để xem thông báo',
    guestMessage: 'Đơn hàng, ưu đãi và các cập nhật tài khoản sẽ hiển thị tại đây.',
    title: 'Thông báo của bạn',
    markAll: 'Đánh dấu tất cả',
    login: 'Đăng nhập',
    viewAll: 'Xem tất cả thông báo',
  },
  admin: {
    empty: 'Chưa có thông báo quản trị mới.',
    guestTitle: 'Không thể tải thông báo',
    guestMessage: 'Bạn cần đăng nhập bằng tài khoản quản trị để xem cảnh báo hệ thống.',
    title: 'Thông báo quản trị',
    markAll: 'Đánh dấu tất cả',
    login: 'Đăng nhập',
    viewAll: 'Xem tất cả thông báo',
  },
} as const;

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const NotificationItemButton = ({ item, onClick }: { item: AppNotificationItem; onClick: (item: AppNotificationItem) => void }) => {
  const tone = getTone(item.type);
  const Icon = tone.icon;
  const label = getNotificationLabel(item);

  return (
    <button
      onClick={() => onClick(item)}
      className={cn(
        'w-full rounded-3xl border p-4 text-left transition-all hover:border-primary/30 hover:shadow-md',
        tone.card,
        !item.isRead && 'ring-1 ring-primary/15'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', tone.iconWrap)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
            {!item.isRead && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">Mới</span>
            )}
          </div>
          <p className="mt-2 line-clamp-1 text-sm font-black">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.message}</p>
          <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span>{formatTime(item.createdAt)}</span>
            <span className="font-bold text-primary">{item.isRead ? 'Đã xem' : 'Nhấn để mở'}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export const NotificationDropdown = ({ scope }: { scope: AuthScope }) => {
  const navigate = useNavigate();
  const { token, user } = useScopedAuthState(scope);
  const t = copy[scope];
  const query = useNotificationCenter(scope, !!token);
  const markOneMutation = useMarkNotificationRead(scope);
  const markAllMutation = useMarkAllNotificationsRead(scope);

  const items = query.data?.items || [];
  const prioritizedItems = items.filter(isPriorityNotification);
  const visibleUnreadCount = prioritizedItems.filter((item) => !item.isRead).length;
  const guestRoute = scope === 'admin' ? '/admin/login' : '/login';
  const viewAllRoute = scope === 'admin' ? '/admin/notifications' : '/profile/notifications';

  const handleNotificationClick = async (item: AppNotificationItem) => {
    try {
      if (!item.isRead) {
        await markOneMutation.mutateAsync(item.id);
      }
      navigate(scope === 'user' && (item.type === 'VOUCHER' || item.type === 'PROMOTION') ? '/profile/vouchers' : (item.link || viewAllRoute));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể mở thông báo');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllMutation.mutateAsync();
      toast.success('Đã đánh dấu toàn bộ thông báo');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật thông báo');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-10 w-10 items-center justify-center rounded-full border border-transparent outline-none transition-all hover:border-border/50 hover:bg-primary/5">
        <Bell className="h-5 w-5" />
        {visibleUnreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">
            {visibleUnreadCount > 9 ? '9+' : visibleUnreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="z-[100] mt-2 w-[380px] rounded-[28px] border border-border/50 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
        <DropdownMenuLabel className="flex items-start justify-between gap-3 p-0">
          <div className="min-w-0">
            <p className="text-sm font-black">{t.title}</p>
            {!!user && <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>}
          </div>

          {!!token && prioritizedItems.length > 0 && (
            <Button variant="ghost" onClick={() => void handleMarkAll()} className="h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest">
              <CheckCheck className="mr-1 h-4 w-4" />
              {t.markAll}
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-3" />

        {!token ? (
          <div className="space-y-3 rounded-3xl border border-border/50 bg-muted/20 p-4">
            <p className="text-sm font-black">{t.guestTitle}</p>
            <p className="text-sm text-muted-foreground">{t.guestMessage}</p>
            <Button onClick={() => navigate(guestRoute)} className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
              {t.login}
            </Button>
          </div>
        ) : query.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : prioritizedItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t.empty}</div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {prioritizedItems.slice(0, 6).map((item) => (
                <NotificationItemButton key={item.id} item={item} onClick={handleNotificationClick} />
              ))}
            </div>

            <DropdownMenuSeparator className="my-0" />

            <Button variant="outline" onClick={() => navigate(viewAllRoute)} className="h-11 w-full rounded-2xl text-[10px] font-black uppercase tracking-[0.22em]">
              {t.viewAll}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
