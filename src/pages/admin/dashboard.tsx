import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MoreVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { adminService } from '@/src/entities/admin/api/admin-service';
import { AdminStats } from '@/src/entities/admin/model/types';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminService.getStats().then(data => {
      setStats(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Tổng quan <span className="text-primary italic">Hệ thống</span></h1>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mt-1 opacity-60">Cập nhật lúc: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="h-11 rounded-xl px-6 border-2 border-border font-black text-[10px] uppercase tracking-widest">Xuất báo cáo</Button>
          <Button className="h-11 rounded-xl px-6 bg-primary font-black text-[10px] uppercase tracking-widest">Cấu hình Dashboard</Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Doanh thu', value: formatCurrency(stats.revenue.total), growth: stats.revenue.growth, icon: DollarSign, color: 'primary' },
          { label: 'Đơn hàng', value: stats.orders.count, growth: stats.orders.growth, icon: ShoppingCart, color: 'blue' },
          { label: 'Khách hàng', value: stats.customers.count, growth: stats.customers.growth, icon: Users, color: 'purple' },
          { label: 'Sản phẩm', value: '124', growth: 12.5, icon: Package, color: 'orange' },
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface-default p-8 rounded-[32px] border border-border/50 shadow-xl shadow-black/[0.02] group hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center",
                item.color === 'primary' ? "bg-primary/10 text-primary" :
                item.color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                item.color === 'purple' ? "bg-purple-500/10 text-purple-500" :
                "bg-orange-500/10 text-orange-500"
              )}>
                <item.icon className="h-6 w-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
                item.growth >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {item.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(item.growth)}%
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mb-1">{item.label}</p>
            <p className="text-2xl font-black tracking-tight">{item.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-12 gap-10">
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8 bg-surface-default p-8 md:p-10 rounded-[40px] border border-border/50 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-4">
              Theo dõi <span className="text-primary italic">Doanh thu</span>
              <div className="h-1 bg-border/50 w-24 rounded-full" />
            </h3>
            <select className="bg-surface-sunken border-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none">
              <option>7 Ngày qua</option>
              <option>30 Ngày qua</option>
            </select>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenue.chart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.1)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900 }}
                  dy={10}
                  tickFormatter={(val) => val.split('-').pop()}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900 }}
                  tickFormatter={(val) => `${val/1000000}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--surface-elevated))', 
                    borderRadius: '24px', 
                    border: '1px solid hsl(var(--border) / 0.5)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    padding: '16px'
                  }}
                  itemStyle={{ fontWeight: 900, color: 'hsl(var(--primary))' }}
                  labelStyle={{ fontWeight: 900, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', fontSize: '10px', marginBottom: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-4 bg-muted/30 p-8 rounded-[40px] border border-border/50 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">TOP SẢN PHẨM</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
          </div>
          
          <div className="space-y-6 flex-1">
            {stats.popularProducts.map((product, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="h-14 w-14 rounded-2xl bg-surface-default border border-border/50 flex items-center justify-center p-2">
                   <img src={product.image || 'https://via.placeholder.com/100'} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[10px] uppercase tracking-wider truncate mb-1">{product.name}</p>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">{product.orders} Đơn hàng</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[10px] text-primary">{Math.floor(product.orders / stats.orders.count * 100)}%</p>
                  <div className="w-12 h-1 bg-border/50 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${product.orders / stats.orders.count * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 bg-surface-default rounded-[32px] border border-border/50 border-dashed">
             <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                   <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">Gợi ý tối ưu</p>
             </div>
             <p className="text-xs text-muted-foreground leading-relaxed">Sản phẩm <span className="font-black italic text-foreground">iPhone 15 Pro Max</span> đang có tỷ lệ chuyển đổi cao. Cân nhắc tăng ngân sách quảng cáo.</p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row - Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center gap-4">
                  ĐƠN HÀNG <span className="text-primary italic">MỚI NHẤT</span>
                  <div className="h-[2px] bg-border/20 w-12 rounded-full" />
               </h3>
               <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest h-8 px-4">Xem tất cả</Button>
            </div>
            
            <div className="bg-surface-default rounded-[40px] border border-border/50 overflow-hidden shadow-xl shadow-black/[0.01]">
               {[1,2,3,4].map((item) => (
                  <div key={item} className="flex items-center justify-between p-6 border-b border-border/30 last:border-none hover:bg-muted/30 transition-all cursor-pointer group">
                     <div className="flex items-center gap-5">
                        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                           <Clock className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-xs font-black uppercase tracking-wider">#ORD-2345{item}</p>
                           <p className="text-[10px] text-muted-foreground font-bold italic">Nguyễn Văn {item === 1 ? 'A' : item === 2 ? 'B' : 'C'}</p>
                        </div>
                     </div>
                     <div className="text-right flex items-center gap-10">
                        <div className="hidden sm:block">
                           <p className="text-xs font-black tracking-tight">{formatCurrency(1250000)}</p>
                           <p className="text-[9px] text-muted-foreground uppercase font-black opacity-60">Thanh toán qua CK</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-[0.1em]">
                           CHỜ XÁC NHẬN
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] italic">NHẬT KÝ <span className="text-primary italic">HÀNH ĐỘNG</span></h3>
            <div className="space-y-4">
               {[
                  { user: 'Admin 1', action: 'Cập nhật kho iPhone 15 Pro Max', time: '5 phút trước' },
                  { user: 'Quản lý', action: 'Xác nhận đơn hàng #ORD-123', time: '12 phút trước' },
                  { user: 'System', action: 'Đã sao lưu dữ liệu hệ thống', time: '1 giờ trước' },
               ].map((log, idx) => (
                  <div key={idx} className="p-5 bg-surface-default rounded-3xl border border-border/50 flex items-start gap-4">
                     <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{log.time}</p>
                        <p className="text-xs">
                           <span className="font-black italic">{log.user}: </span>
                           <span className="text-muted-foreground">{log.action}</span>
                        </p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
