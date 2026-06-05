import { useMemo, useState } from 'react';
import { Bell, CheckCheck, CircleAlert, Gift, Info, Loader2, Package, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotificationCenter } from '@/src/shared/api/notification-api';
import { AppNotificationItem } from '@/src/shared/model/notification';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';

type NotificationScope = 'user' | 'admin';
type FilterMode = 'priority' | 'all' | 'unread';

const toneMap = {
  INFO: {
    className: 'border-border/60 bg-card',
    iconWrap: 'bg-slate-500/10 text-slate-500',
    icon: Info,
    label: 'Thông tin',
  },
  SUCCESS: {
    className: 'border-emerald-500/30 bg-emerald-500/5',
    iconWrap: 'bg-emerald-500/10 text-emerald-600',
    icon: ShieldCheck,
    label: 'Thành công',
  },
  WARNING: {
    className: 'border-amber-500/30 bg-amber-500/5',
    iconWrap: 'bg-amber-500/10 text-amber-600',
    icon: CircleAlert,
    label: 'Cảnh báo',
  },
  ORDER: {
    className: 'border-sky-500/30 bg-sky-500/5',
    iconWrap: 'bg-sky-500/10 text-sky-600',
    icon: Package,
    label: 'Đơn hàng',
  },
  PROMOTION: {
    className: 'border-fuchsia-500/30 bg-fuchsia-500/5',
    iconWrap: 'bg-fuchsia-500/10 text-fuchsia-600',
    icon: Gift,
    label: 'Ưu đãi',
  },
  STOCK: {
    className: 'border-orange-500/30 bg-orange-500/5',
    iconWrap: 'bg-orange-500/10 text-orange-600',
    icon: Package,
    label: 'Kho',
  },
  CUSTOMER: {
    className: 'border-cyan-500/30 bg-cyan-500/5',
    iconWrap: 'bg-cyan-500/10 text-cyan-600',
    icon: ShieldCheck,
    label: 'Khách hàng',
  },
  VOUCHER: {
    className: 'border-pink-500/30 bg-pink-500/5',
    iconWrap: 'bg-pink-500/10 text-pink-600',
    icon: Gift,
    label: 'Voucher',
  },
  SYSTEM: {
    className: 'border-violet-500/30 bg-violet-500/5',
    iconWrap: 'bg-violet-500/10 text-violet-600',
    icon: Sparkles,
    label: 'Hệ thống',
  },
} as const;

type NotificationCopy = {
  title: string;
  subtitle: string;
  empty: string;
  important: string;
  priority: string;
  unread: string;
  all: string;
  markAll: string;
  openError: string;
  updateError: string;
  updateSuccess: string;
  newLabel: string;
  priorityLabel: string;
  opened: string;
  openHint: string;
};

const copy: Record<NotificationScope, NotificationCopy> = {
  user: {
    title: 'Trung tâm thông báo',
    subtitle: 'Ưu tiên hiển thị đơn hàng, ưu đãi và các cập nhật thật sự quan trọng.',
    empty: 'Không có thông báo phù hợp với bộ lọc hiện tại.',
    important: 'Ưu tiên thông báo quan trọng',
    priority: 'Ưu tiên',
    unread: 'Chưa đọc',
    all: 'Tất cả',
    markAll: 'Đánh dấu tất cả',
    openError: 'Không thể mở thông báo',
    updateError: 'Không thể cập nhật thông báo',
    updateSuccess: 'Đã đánh dấu toàn bộ thông báo',
    newLabel: 'Mới',
    priorityLabel: 'Ưu tiên',
    opened: 'Đã xem',
    openHint: 'Nhấn để mở',
  },
  admin: {
    title: 'Thông báo quản trị',
    subtitle: 'Ưu tiên đơn hàng, kho, voucher và khách hàng; ẩn bớt các thông báo hệ thống ít giá trị.',
    empty: 'Không có thông báo phù hợp với bộ lọc hiện tại.',
    important: 'Ưu tiên thông báo quan trọng',
    priority: 'Ưu tiên',
    unread: 'Chưa đọc',
    all: 'Tất cả',
    markAll: 'Đánh dấu tất cả',
    openError: 'Không thể mở thông báo',
    updateError: 'Không thể cập nhật thông báo',
    updateSuccess: 'Đã đánh dấu toàn bộ thông báo',
    newLabel: 'Mới',
    priorityLabel: 'Ưu tiên',
    opened: 'Đã xem',
    openHint: 'Nhấn để mở',
  },
};

const filterOptions = (t: NotificationCopy): Array<{ id: FilterMode; label: string }> => [
  { id: 'priority', label: t.priority },
  { id: 'unread', label: t.unread },
  { id: 'all', label: t.all },
];

const getTone = (type: string) => toneMap[type as keyof typeof toneMap] || toneMap.INFO;

const getNotificationCategory = (item: AppNotificationItem) => {
  const category = typeof item.metadata?.category === 'string' ? item.metadata.category : null;
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

const NotificationCard = ({
  item,
  onOpen,
  t,
}: {
  item: AppNotificationItem;
  onOpen: (item: AppNotificationItem) => void;
  t: NotificationCopy;
}) => {
  const tone = getTone(item.type);
  const Icon = tone.icon;
  const label = getNotificationLabel(item);

  return (
    <button
      onClick={() => onOpen(item)}
      className={cn(
        'w-full rounded-[28px] border p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md',
        tone.className,
        !item.isRead && 'ring-1 ring-primary/15'
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tone.iconWrap)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
            {!item.isRead && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                {t.newLabel}
              </span>
            )}
            {isPriorityNotification(item) && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                {t.priorityLabel}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-black">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.message}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[11px] font-medium text-muted-foreground">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
            <p className="text-[11px] font-bold text-primary">{item.isRead ? t.opened : t.openHint}</p>
          </div>
        </div>
      </div>
    </button>
  );
};

export const NotificationCenterPanel = ({ scope }: { scope: NotificationScope }) => {
  const navigate = useNavigate();
  const t = copy[scope];
  const [filter, setFilter] = useState<FilterMode>('priority');
  const query = useNotificationCenter(scope, true);
  const markOneMutation = useMarkNotificationRead(scope);
  const markAllMutation = useMarkAllNotificationsRead(scope);

  const items = query.data?.items || [];
  const unreadCount = query.data?.unreadCount || 0;
  const priorityCount = useMemo(() => items.filter(isPriorityNotification).length, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'priority') return items.filter(isPriorityNotification);
    if (filter === 'unread') return items.filter((item) => !item.isRead && isPriorityNotification(item));
    return items;
  }, [filter, items]);

  const handleOpen = async (item: AppNotificationItem) => {
    try {
      if (!item.isRead) {
        await markOneMutation.mutateAsync(item.id);
      }
      if (item.link) navigate(item.link);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.openError);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllMutation.mutateAsync();
      toast.success(t.updateSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.updateError);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
            <Bell className="h-3.5 w-3.5" />
            {t.important}
          </div>
          <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tighter">
            {t.title.split(' ')[0]} <span className="text-primary italic">{t.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm font-black">
            {t.priority}: <span className="text-primary">{priorityCount}</span>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm font-black">
            {t.unread}: <span className="text-primary">{unreadCount}</span>
          </div>
          <Button onClick={() => void handleMarkAll()} variant="outline" className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest">
            <CheckCheck className="mr-2 h-4 w-4" />
            {t.markAll}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-[28px] border border-border/50 bg-card p-3">
        {filterOptions(t).map((option) => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            className={cn(
              'rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all',
              filter === option.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">{t.empty}</div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <NotificationCard key={item.id} item={item} onOpen={handleOpen} t={t} />
          ))}
        </div>
      )}
    </div>
  );
};
