import { Order, OrderStatus } from '@/src/entities/order/model/types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Truck, 
  Package, 
  User, 
  MapPin, 
  CreditCard,
  History,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';
import { useUpdateOrderStatus } from '@/src/entities/order/api/order-api';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, description: string }> = {
  PENDING: { 
    label: 'CHỜ XÁC NHẬN', 
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', 
    icon: Clock,
    description: 'Đơn hàng mới đang chờ quản trị viên phê duyệt.'
  },
  PROCESSING: { 
    label: 'ĐANG XỬ LÝ', 
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', 
    icon: AlertCircle,
    description: 'Sản phẩm đang được đóng gói và chuẩn bị xuất kho.'
  },
  SHIPPED: { 
    label: 'ĐANG GIAO', 
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', 
    icon: Truck,
    description: 'Đơn hàng đã được bàn giao cho đơn vị vận chuyển.'
  },
  DELIVERED: { 
    label: 'ĐÃ GIAO', 
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', 
    icon: CheckCircle2,
    description: 'Khách hàng đã nhận được hàng và hoàn tất thanh toán.'
  },
  CANCELLED: { 
    label: 'ĐÃ HỦY', 
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', 
    icon: XCircle,
    description: 'Đơn hàng đã bị hủy bởi khách hàng hoặc hệ thống.'
  }
};

interface OrderDetailProps {
  order: any; // Using any for now to handle backend response
  onClose: () => void;
}

export const OrderDetail = ({ order, onClose }: OrderDetailProps) => {
  const statusMutation = useUpdateOrderStatus();
  const currentStatus = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const Icon = currentStatus.icon;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await statusMutation.mutateAsync({ id: order.id, status: newStatus });
      toast.success('Đã cập nhật trạng thái đơn hàng');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Status Banner */}
      <div className={cn("p-6 rounded-[32px] border-2 flex flex-col sm:flex-row items-center gap-6", currentStatus.color)}>
        <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[10px] font-black tracking-[0.2em] opacity-80 mb-1">TRẠNG THÁI HIỆN TẠI</p>
          <h3 className="text-xl font-black">{currentStatus.label}</h3>
          <p className="text-[11px] font-bold opacity-70 mt-1">{currentStatus.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Items List */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CHI TIẾT KIỆN HÀNG</h4>
            <div className="bg-surface-default rounded-[32px] border border-border/50 divide-y divide-border/30 overflow-hidden">
              {order.items.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center gap-4 group">
                  <div className="h-16 w-16 rounded-xl bg-muted/30 border border-border/20 overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[11px] font-black uppercase tracking-tight truncate">{item.name}</h5>
                    <p className="text-[10px] text-muted-foreground font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} x {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
              <div className="p-6 bg-muted/10 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>TẠM TÍNH</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>PHÍ VẬN CHUYỂN</span>
                  <span>Miễn phí</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/50">
                  <span className="text-xs font-black uppercase tracking-widest">TỔNG CỘNG</span>
                  <span className="text-sm font-black text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Action Center */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TRẠM ĐIỀU HÀNH</h4>
            <div className="bg-surface-default p-6 rounded-[32px] border border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleStatusChange('PROCESSING')}
                disabled={order.status === 'PROCESSING'}
                className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/10 text-blue-600"
              >
                Xác nhận
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleStatusChange('SHIPPED')}
                disabled={order.status === 'SHIPPED'}
                className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/10 text-purple-600"
              >
                Giao hàng
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleStatusChange('DELIVERED')}
                disabled={order.status === 'DELIVERED'}
                className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 text-emerald-600"
              >
                Hoàn tất
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleStatusChange('CANCELLED')}
                disabled={order.status === 'CANCELLED'}
                className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10 text-rose-600"
              >
                Hủy đơn
              </Button>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          {/* Customer Info */}
          <section className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">KHÁCH HÀNG</h4>
             <div className="bg-surface-default p-6 rounded-[32px] border border-border/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase italic">
                    {order.user?.name?.[0] || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase italic truncate">{order.user?.name || 'Khách vãng lai'}</p>
                    <p className="text-[10px] text-muted-foreground font-bold truncate opacity-60">{order.user?.email}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/30 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">ĐỊA CHỈ GIAO HÀNG</p>
                      <p className="text-[10px] font-bold leading-relaxed">{order.shippingAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">PHƯƠNG THỨC</p>
                      <p className="text-[10px] font-bold">{order.shippingMethod}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">THANH TOÁN</p>
                      <p className="text-[10px] font-bold">{order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Thanh toán khi nhận hàng (COD)'}</p>
                    </div>
                  </div>
                </div>
             </div>
          </section>

          {/* Timeline Tracking */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">LỊCH SỬ VẬN ĐƠN</h4>
            <div className="bg-surface-default p-6 rounded-[32px] border border-border/50 space-y-6 relative overflow-hidden">
               <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-border/30" />
               
               <div className="relative flex gap-4">
                 <div className="h-4 w-4 rounded-full bg-primary mt-1 shadow-lg ring-4 ring-primary/20 z-10" />
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-tight">{currentStatus.label}</p>
                   <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{new Date(order.updatedAt).toLocaleString('vi-VN')}</p>
                 </div>
               </div>

               <div className="relative flex gap-4 opacity-40">
                 <div className="h-4 w-4 rounded-full bg-border mt-1 z-10" />
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-tight">ĐÃ TẠO ĐƠN HÀNG</p>
                   <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                 </div>
               </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-border/50">
         <p className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">ORDER TRACKING ID: {order.orderNumber}</p>
         <Button variant="ghost" onClick={onClose} className="h-10 rounded-xl px-4 font-black text-[10px] uppercase tracking-widest">
           Đóng chi tiết đơn hàng
         </Button>
      </div>
    </div>
  );
};
