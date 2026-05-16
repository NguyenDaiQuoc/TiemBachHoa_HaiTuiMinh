import React, { useState } from 'react';
import { Card } from '@/src/shared/ui/card';
import { Button } from '@/src/shared/ui/button';
import { Badge } from '@/src/shared/ui/badge';
import { 
  Package, 
  Truck, 
  ChevronRight, 
  Loader2, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/shared/lib/utils';
import { useOrders } from '@/src/entities/order/api/order-api';
import { motion, AnimatePresence } from 'motion/react';

const statusMap = {
  'PENDING': { label: 'Chờ xác nhận', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  'PROCESSING': { label: 'Đang xử lý', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Loader2 },
  'SHIPPED': { label: 'Đang vận chuyển', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Truck },
  'DELIVERED': { label: 'Đã giao hàng', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  'CANCELLED': { label: 'Đã hủy', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: XCircle },
};

export const OrdersTab: React.FC = () => {
  const { data: orders = [], isLoading } = useOrders();
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xử lý' },
    { id: 'PROCESSING', label: 'Đang chuẩn bị' },
    { id: 'SHIPPED', label: 'Đang giao' },
    { id: 'DELIVERED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' },
  ];

  const filteredOrders = orders.filter((order: any) => {
    const matchesStatus = activeFilter === 'ALL' || order.status === activeFilter;
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tight font-sans">ĐƠN HÀNG CỦA TÔI</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Theo dõi trạng thái các đơn hàng Hai Tụi Mình</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Mã đơn hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted/30 border-none text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeFilter === filter.id 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order: any) => {
              const statusInfo = statusMap[order.status as keyof typeof statusMap] || statusMap.PENDING;
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-6 rounded-[32px] border-none shadow-soft hover:shadow-xl transition-all duration-300 group bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                      <div className="flex gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border border-border/50 p-2 shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden shadow-sm">
                          {order.items?.[0]?.image ? (
                            <img src={order.items[0].image} alt={order.items[0].name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted/30">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-xl tracking-tighter italic text-primary uppercase">{order.orderNumber}</span>
                              <Badge variant="outline" className={cn("rounded-lg text-[8px] font-black uppercase tracking-widest px-2 py-0.5", statusInfo.color)}>
                                <statusInfo.icon className="h-2.5 w-2.5 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                              {new Date(order.createdAt).toLocaleDateString('vi-VN')} • {order.items?.length || 0} sản phẩm
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50 tracking-widest">Tổng:</span>
                                <span className="text-primary font-black italic tracking-tighter text-lg">{order.totalAmount.toLocaleString()}đ</span>
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Link to={`/tracking?id=${order.orderNumber}`} className="flex-1 lg:flex-none">
                          <Button variant="ghost" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-border/50 hover:bg-background/80">
                            <Truck className="w-4 h-4 mr-2" /> THEO DÕI
                          </Button>
                        </Link>
                        <Button className="flex-1 lg:flex-none h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95">
                          CHI TIẾT <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 bg-white/30 dark:bg-slate-900/30 rounded-[48px] border border-dashed border-border/50 overflow-hidden"
            >
              <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">KHÔNG TÌM THẤY ĐƠN HÀNG</h3>
              <p className="text-xs text-muted-foreground font-medium mb-8">Bạn chưa có đơn hàng nào phù hợp với bộ lọc này.</p>
              <Link to="/search">
                <Button className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest italic text-[11px] shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">MUA SẮM NGAY</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
