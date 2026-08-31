import React, { useState } from 'react';
import { Card } from '@/src/shared/ui/card';
import { Button } from '@/src/shared/ui/button';
import { Badge } from '@/src/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/ui/dialog';
import { EmptyState } from '@/src/shared/ui/empty-state';
import { LoadingState } from '@/src/shared/ui/loading-state';
import {
  Package,
  Truck,
  ChevronRight,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingCart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatCurrencyVND } from '@/src/shared/lib/utils';
import { useOrders } from '@/src/entities/order/api/order-api';
import { useCartStore } from '@/src/entities/cart/model/store';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const statusMap = {
  'PENDING': { label: 'Chờ xác nhận', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  'PROCESSING': { label: 'Đang xử lý', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Loader2 },
  'SHIPPED': { label: 'Đang vận chuyển', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Truck },
  'DELIVERED': { label: 'Đã giao hàng', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  'CANCELLED': { label: 'Đã hủy', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: XCircle },
};

const paymentMethodLabels: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  MOMO: 'Ví MoMo',
  ZALOPAY: 'ZaloPay',
  VNPAY: 'VNPay',
};

export const OrdersTab: React.FC = () => {
  const { data: orders = [], isLoading } = useOrders();
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const restoreItems = useCartStore((state) => state.restoreItems);

  const handleBuyAgain = async (item: any) => {
    const productId = item.productId || item.id;
    if (!productId) {
      toast.error('Không tìm thấy sản phẩm để mua lại');
      return;
    }

    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || payload?.message || 'Sản phẩm không còn khả dụng');
      restoreItems([{ ...payload.data, quantity: Number(item.quantity) || 1 }]);
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
    } catch (error: any) {
      toast.error(error.message || 'Không thể mua lại sản phẩm này');
    }
  };

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
        <LoadingState size="md" label="Đang tải đơn hàng" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tight font-sans">ĐƠN HÀNG CỦA TÔI</h2>
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
                                <span className="text-primary font-black italic tracking-tighter text-lg">{order.totalAmount.toLocaleString()}₫</span>
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Link to={`/tracking?code=${encodeURIComponent(order.orderNumber || order.id)}`} className="flex-1 lg:flex-none">
                          <Button variant="ghost" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-border/50 hover:bg-background/80">
                            <Truck className="w-4 h-4 mr-2" /> THEO DÕI
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="flex-1 lg:flex-none h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
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
            >
              <EmptyState
                icon={Package}
                title="KHÔNG TÌM THẤY ĐƠN HÀNG"
                description="Bạn chưa có đơn hàng nào phù hợp với bộ lọc này."
                size="lg"
                tone="soft"
                action={
                  <Link to="/products">
                    <Button className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest italic text-[11px] shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">MUA SẮM NGAY</Button>
                  </Link>
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-none bg-card p-6 shadow-2xl sm:max-w-3xl sm:p-8">
          {selectedOrder ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
                  Chi tiết đơn {selectedOrder.orderNumber}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Trạng thái</p>
                  <p className="mt-2 text-sm font-black uppercase">{statusMap[selectedOrder.status as keyof typeof statusMap]?.label || selectedOrder.status}</p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Thanh toán</p>
                  <p className="mt-2 text-sm font-black uppercase">{selectedOrder.paymentStatus || 'Đang cập nhật'}</p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Phương thức</p>
                  <p className="mt-2 text-sm font-black uppercase">{paymentMethodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod || 'Đang cập nhật'}</p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ngày đặt</p>
                  <p className="mt-2 text-sm font-black uppercase">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sản phẩm trong đơn</p>
                {(selectedOrder.items || []).map((item: any, index: number) => (
                  <div key={`${item.id || item.productId || index}`} className="flex gap-4 rounded-2xl border border-border/50 bg-background/50 p-4">
                    <Link to={`/product/${encodeURIComponent(item.productId || item.slug || item.id)}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/40 transition hover:opacity-80">
                      {item.image ? <img src={item.image} alt={item.name || 'Sản phẩm'} className="h-full w-full object-cover" /> : <Package className="m-5 h-6 w-6 text-muted-foreground" />}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/product/${encodeURIComponent(item.productId || item.slug || item.id)}`} className="line-clamp-2 text-sm font-black text-foreground transition hover:text-primary">
                        {item.name || item.productName || 'Sản phẩm'}
                      </Link>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        SL: {item.quantity || 1} • {formatCurrencyVND(Number(item.price || item.unitPrice || 0))}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="text-sm font-black text-primary">
                        {formatCurrencyVND(Number(item.total || item.subtotal || (Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1))))}
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleBuyAgain(item)} className="h-8 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Mua lại
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tổng thanh toán</p>
                  <p className="text-2xl font-black text-primary">{formatCurrencyVND(Number(selectedOrder.totalAmount || 0))}</p>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setSelectedOrder(null)} className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                    Đóng
                  </Button>
                  <Link to={`/tracking?code=${encodeURIComponent(selectedOrder.orderNumber || selectedOrder.id)}`}>
                    <Button className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                      <Truck className="mr-2 h-4 w-4" /> Theo dõi
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
