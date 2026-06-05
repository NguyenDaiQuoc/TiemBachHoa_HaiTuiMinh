import { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Package2, ShoppingCart, Users } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminService } from '@/src/entities/admin/api/admin-service';
import { AdminAnalytics as AdminAnalyticsType } from '@/src/entities/admin/model/types';
import { Button } from '@/src/shared/ui/button';

export const AdminAnalytics = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '365d'>('7d');
  const [analytics, setAnalytics] = useState<AdminAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    adminService
      .getAnalytics(period)
      .then((data) => {
        if (active) setAnalytics(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period]);

  if (isLoading || !analytics) {
    return <div className="flex min-h-[320px] items-center justify-center text-sm font-bold text-muted-foreground">Đang tải dữ liệu phân tích...</div>;
  }

  const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Phân tích <span className="text-primary italic">kinh doanh</span>
          </h1>
          <p className="mt-1 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">
            Theo dõi doanh thu, sản phẩm bán ra và hiệu quả vận hành theo thời gian
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '365d'] as const).map((value) => (
            <Button key={value} variant={period === value ? 'default' : 'outline'} onClick={() => setPeriod(value)} className="h-11 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest">
              {value}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Doanh thu', value: money(analytics.summary.revenue), icon: DollarSign },
          { label: 'Sản phẩm đã bán', value: analytics.summary.soldProducts.toLocaleString('vi-VN'), icon: Package2 },
          { label: 'Đơn hàng', value: analytics.summary.orders.toLocaleString('vi-VN'), icon: ShoppingCart },
          { label: 'Thu nhập ước tính', value: money(analytics.summary.profit), icon: BarChart3 },
        ].map((item) => (
          <div key={item.label} className="rounded-[28px] border border-border/50 bg-surface-default p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-xl font-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="min-w-0 rounded-[32px] border border-border/50 bg-surface-default p-6">
          <h2 className="mb-6 text-sm font-black uppercase tracking-widest">Doanh thu theo thời gian</h2>
          <div className="h-[320px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-[32px] border border-border/50 bg-surface-default p-6">
          <h2 className="mb-6 text-sm font-black uppercase tracking-widest">Sản phẩm bán ra mỗi ngày</h2>
          <div className="h-[320px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sold" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-[32px] border border-border/50 bg-surface-default p-6">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest">Sản phẩm bán tốt</h2>
          <div className="space-y-3">
            {analytics.bestSellingProducts.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-surface-sunken p-4">
                <div>
                  <p className="text-sm font-black">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.soldCount} sản phẩm đã bán</p>
                </div>
                <p className="text-sm font-black text-primary">{money(item.revenueEstimate)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-border/50 bg-surface-default p-6">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest">Khách hàng nổi bật</h2>
          <div className="space-y-3">
            {analytics.topCustomers.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-surface-sunken p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.totalOrders} đơn hàng</p>
                  </div>
                </div>
                <p className="text-sm font-black text-primary">{money(item.totalSpent)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
