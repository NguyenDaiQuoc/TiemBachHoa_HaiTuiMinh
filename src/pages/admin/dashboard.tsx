import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  DollarSign,
  Download,
  Gift,
  Loader2,
  MoreVertical,
  Package,
  Settings2,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminService } from '@/src/entities/admin/api/admin-service';
import { AdminStats } from '@/src/entities/admin/model/types';
import type { AdminOutletContext } from '@/src/app/layouts/admin-layout';
import { cn } from '@/src/shared/lib/utils';
import { useAdminUiStore } from '@/src/shared/store/admin-ui-store';
import { Button } from '@/src/shared/ui/button';

const copy = {
  vi: {
    title: 'Tổng quan hệ thống',
    updatedAt: 'Cập nhật lúc',
    exportReport: 'Xuất báo cáo',
    configDashboard: 'Cấu hình dashboard',
    revenue: 'Doanh thu',
    orders: 'Đơn hàng',
    customers: 'Khách hàng',
    products: 'Sản phẩm',
    vouchers: 'Voucher',
    active: 'đang bật',
    revenueTracking: 'Theo dõi doanh thu',
    topProducts: 'Top sản phẩm',
    optimizationHint: 'Gợi ý tối ưu',
    lowStockHintStart: 'Hiện có',
    lowStockHintMid: 'sản phẩm sắp hết hàng và',
    lowStockHintEnd: 'voucher đang hoạt động. Nên cân bằng giữa khuyến mãi và tồn kho để tránh hụt hàng.',
    latestOrders: 'Đơn hàng mới nhất',
    viewAll: 'Xem tất cả',
    actionLog: 'Nhật ký hành động',
    authLog: 'Đăng nhập / đăng xuất',
    operationLog: 'Hành động vận hành',
    guest: 'Khách hàng',
    orderUnit: 'đơn hàng',
  },
  en: {
    title: 'System overview',
    updatedAt: 'Updated at',
    exportReport: 'Export report',
    configDashboard: 'Dashboard settings',
    revenue: 'Revenue',
    orders: 'Orders',
    customers: 'Customers',
    products: 'Products',
    vouchers: 'Vouchers',
    active: 'active',
    revenueTracking: 'Revenue tracking',
    topProducts: 'Top products',
    optimizationHint: 'Optimization hint',
    lowStockHintStart: 'There are currently',
    lowStockHintMid: 'low-stock products and',
    lowStockHintEnd: 'active vouchers. Balance promotions with inventory to avoid stockouts.',
    latestOrders: 'Latest orders',
    viewAll: 'View all',
    actionLog: 'Activity log',
    authLog: 'Login / logout',
    operationLog: 'Operations',
    guest: 'Customer',
    orderUnit: 'orders',
  },
} as const;

const downloadJson = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { refreshTick } = useOutletContext<AdminOutletContext>();
  const locale = useAdminUiStore((state) => state.locale);
  const t = copy[locale];
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    adminService
      .getStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTick]);

  const nowLabel = useMemo(
    () =>
      new Date().toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale, stats]
  );

  if (isLoading || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: 'VND' }).format(value);

  const summaryCards = [
    { label: t.revenue, value: formatCurrency(stats.revenue.total), growth: stats.revenue.growth, icon: DollarSign, color: 'primary' },
    { label: t.orders, value: stats.orders.count, growth: stats.orders.growth, icon: ShoppingCart, color: 'blue' },
    { label: t.customers, value: stats.customers.count, growth: stats.customers.growth, icon: Users, color: 'purple' },
    { label: t.products, value: stats.products.count, growth: stats.products.growth, icon: Package, color: 'orange' },
    { label: t.vouchers, value: stats.vouchers.count, growth: stats.vouchers.active, icon: Gift, color: 'emerald' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            {t.title.split(' ')[0]} <span className="text-primary italic">{t.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="mt-1 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">
            {t.updatedAt}: {nowLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => downloadJson(`admin-dashboard-${Date.now()}.json`, stats)}
            className="h-11 rounded-xl border-2 border-border px-6 text-[10px] font-black uppercase tracking-widest"
          >
            <Download className="mr-2 h-4 w-4" />
            {t.exportReport}
          </Button>
          <Button onClick={() => navigate('/admin/settings')} className="h-11 rounded-xl bg-primary px-6 text-[10px] font-black uppercase tracking-widest">
            <Settings2 className="mr-2 h-4 w-4" />
            {t.configDashboard}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="group rounded-[32px] border border-border/50 bg-surface-default p-8 shadow-xl shadow-black/[0.02] transition-all hover:scale-[1.02]"
          >
            <div className="mb-6 flex items-center justify-between">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl',
                  item.color === 'primary'
                    ? 'bg-primary/10 text-primary'
                    : item.color === 'blue'
                      ? 'bg-blue-500/10 text-blue-500'
                      : item.color === 'purple'
                        ? 'bg-violet-500/10 text-violet-500'
                        : item.color === 'emerald'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-orange-500/10 text-orange-500'
                )}
              >
                <item.icon className="h-6 w-6" />
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 text-[10px] font-black uppercase tracking-widest',
                  typeof item.growth === 'number' && item.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'
                )}
              >
                {typeof item.growth === 'number' && item.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {item.label === t.vouchers ? `${item.growth} ${t.active}` : `${Math.abs(Number(item.growth))}%`}
              </div>
            </div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{item.label}</p>
            <p className="text-2xl font-black tracking-tight">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="relative min-w-0 overflow-hidden rounded-[40px] border border-border/50 bg-surface-default p-8 shadow-2xl lg:col-span-8 md:p-10">
          <div className="mb-10 flex items-center justify-between">
            <h3 className="flex items-center gap-4 text-xl font-black uppercase italic tracking-tight">
              {t.revenueTracking.split(' ')[0]} <span className="text-primary italic">{t.revenueTracking.split(' ').slice(1).join(' ')}</span>
              <div className="h-1 w-24 rounded-full bg-border/50" />
            </h3>
          </div>

          <div className="h-[400px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenue.chart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.1)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} dy={10} tickFormatter={(val) => val.split('-').pop() || val} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} tickFormatter={(val) => `${Math.round(val / 1000000)}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderRadius: '24px',
                    border: '1px solid hsl(var(--border) / 0.5)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    padding: '16px',
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col rounded-[40px] border border-border/50 bg-muted/30 p-8 lg:col-span-4">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.topProducts}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/products')}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-6">
            {stats.popularProducts.map((product) => (
              <button key={product.id} onClick={() => navigate('/admin/products')} className="group flex w-full items-center gap-4 text-left">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-surface-default p-2">
                  <img src={product.image || 'https://via.placeholder.com/100'} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate text-[10px] font-black uppercase tracking-wider">{product.name}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                    {product.orders} {t.orderUnit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-primary">{stats.orders.count ? Math.floor((product.orders / stats.orders.count) * 100) : 0}%</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 rounded-[32px] border border-dashed border-border/50 bg-surface-default p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">{t.optimizationHint}</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t.lowStockHintStart} <span className="font-black text-foreground">{stats.products.lowStockCount}</span> {t.lowStockHintMid}{' '}
              <span className="font-black text-foreground">{stats.vouchers.active}</span> {t.lowStockHintEnd}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-4 text-[10px] font-black uppercase italic tracking-[0.2em]">
              {t.latestOrders.split(' ')[0]} <span className="text-primary italic">{t.latestOrders.split(' ').slice(1).join(' ')}</span>
              <div className="h-[2px] w-12 rounded-full bg-border/20" />
            </h3>
            <Button variant="ghost" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest" onClick={() => navigate('/admin/orders')}>
              {t.viewAll}
            </Button>
          </div>

          <div className="overflow-hidden rounded-[40px] border border-border/50 bg-surface-default shadow-xl shadow-black/[0.01]">
            {stats.recentOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate('/admin/orders')}
                className="group flex w-full items-center justify-between border-b border-border/30 p-6 text-left transition-all hover:bg-muted/30 last:border-none"
              >
                <div className="flex items-center gap-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">{order.orderNumber}</p>
                    <p className="text-[10px] font-bold italic text-muted-foreground">{order.customerName || t.guest}</p>
                  </div>
                </div>
                <div className="flex items-center gap-10 text-right">
                  <div className="hidden sm:block">
                    <p className="text-xs font-black tracking-tight">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">{order.paymentStatus}</p>
                  </div>
                  <div className="rounded-full bg-amber-500/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-amber-500">{order.status}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase italic tracking-[0.2em]">
            {t.actionLog.split(' ')[0]} <span className="text-primary italic">{t.actionLog.split(' ').slice(1).join(' ')}</span>
          </h3>

          <div className="space-y-3 rounded-[28px] border border-border/50 bg-surface-default p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.authLog}</p>
              <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {stats.authLogs.length}
              </span>
            </div>
            <div className="space-y-3">
              {stats.authLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 p-4 text-xs text-muted-foreground">Không có bản ghi gần đây.</div>
              ) : (
                stats.authLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 rounded-2xl border border-border/50 bg-background p-4">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-sky-500" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground opacity-60">{log.timeLabel}</p>
                      <p className="text-xs">
                        <span className="font-black italic">{log.user}: </span>
                        <span className="text-muted-foreground">{log.action}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-[28px] border border-border/50 bg-surface-default p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.operationLog}</p>
              <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {stats.actionLogs.length}
              </span>
            </div>
            <div className="space-y-3">
              {stats.actionLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 p-4 text-xs text-muted-foreground">Không có bản ghi gần đây.</div>
              ) : (
                stats.actionLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 rounded-2xl border border-border/50 bg-background p-4">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground opacity-60">{log.timeLabel}</p>
                      <p className="text-xs">
                        <span className="font-black italic">{log.user}: </span>
                        <span className="text-muted-foreground">{log.action}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
