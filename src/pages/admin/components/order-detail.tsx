import { CheckCircle2, Clock, CreditCard, MapPin, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateOrderStatus } from '@/src/entities/order/api/order-api';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  PENDING: {
    label: 'CH\u1edc X\u00c1C NH\u1eacN',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    icon: Clock,
    description: '\u0110\u01a1n h\u00e0ng m\u1edbi \u0111ang ch\u1edd qu\u1ea3n tr\u1ecb vi\u00ean ph\u00ea duy\u1ec7t.',
  },
  PROCESSING: {
    label: '\u0110ANG X\u1eec L\u00dd',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    icon: Clock,
    description: 'S\u1ea3n ph\u1ea9m \u0111ang \u0111\u01b0\u1ee3c \u0111\u00f3ng g\u00f3i v\u00e0 chu\u1ea9n b\u1ecb xu\u1ea5t kho.',
  },
  SHIPPED: {
    label: '\u0110ANG GIAO',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    icon: Truck,
    description: '\u0110\u01a1n h\u00e0ng \u0111\u00e3 \u0111\u01b0\u1ee3c b\u00e0n giao cho \u0111\u01a1n v\u1ecb v\u1eadn chuy\u1ec3n.',
  },
  DELIVERED: {
    label: '\u0110\u00c3 GIAO',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    icon: CheckCircle2,
    description: 'Kh\u00e1ch h\u00e0ng \u0111\u00e3 nh\u1eadn \u0111\u01b0\u1ee3c h\u00e0ng v\u00e0 ho\u00e0n t\u1ea5t thanh to\u00e1n.',
  },
  CANCELLED: {
    label: '\u0110\u00c3 H\u1ee6Y',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    icon: XCircle,
    description: '\u0110\u01a1n h\u00e0ng \u0111\u00e3 b\u1ecb h\u1ee7y b\u1edfi kh\u00e1ch h\u00e0ng ho\u1eb7c h\u1ec7 th\u1ed1ng.',
  },
};

interface OrderDetailProps {
  order: any;
  onClose: () => void;
  onUpdated?: () => void;
}

export const OrderDetail = ({ order, onClose, onUpdated }: OrderDetailProps) => {
  const statusMutation = useUpdateOrderStatus();
  const currentStatus = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const Icon = currentStatus.icon;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await statusMutation.mutateAsync({ id: order.id, status: newStatus });
      toast.success('\u0110\u00e3 c\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i \u0111\u01a1n h\u00e0ng');
      onUpdated?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className={cn('flex flex-col items-center gap-6 rounded-[32px] border-2 p-6 sm:flex-row', currentStatus.color)}>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20">
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="mb-1 text-[10px] font-black tracking-[0.2em] opacity-80">TR\u1ea0NG TH\u00c1I HI\u1ec6N T\u1ea0I</p>
          <h3 className="text-xl font-black">{currentStatus.label}</h3>
          <p className="mt-1 text-[11px] font-bold opacity-70">{currentStatus.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">CHI TI\u1ebeT KI\u1ec6N H\u00c0NG</h4>
            <div className="overflow-hidden rounded-[32px] border border-border/50 bg-surface-default">
              {order.items.map((item: any) => (
                <div key={item.id} className="group flex items-center gap-4 border-b border-border/30 p-4 last:border-none">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/20 bg-muted/30">
                    <img src={item.image} alt={item.name} className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-[11px] font-black uppercase tracking-tight">{item.name}</h5>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
              <div className="space-y-2 bg-muted/10 p-6">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>T\u1ea0M T\u00cdNH</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>PH\u00cd V\u1eacN CHUY\u1ec2N</span>
                  <span>Mi\u1ec5n ph\u00ed</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2">
                  <span className="text-xs font-black uppercase tracking-widest">T\u1ed4NG C\u1ed8NG</span>
                  <span className="text-sm font-black text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">TR\u1ea0M \u0110I\u1ec0U H\u00c0NH</h4>
            <div className="grid grid-cols-2 gap-3 rounded-[32px] border border-border/50 bg-surface-default p-6 sm:grid-cols-4">
              <Button variant="outline" onClick={() => handleStatusChange('PROCESSING')} disabled={order.status === 'PROCESSING'} className="h-12 rounded-xl bg-blue-500/5 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-500/10">
                X\u00e1c nh\u1eadn
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange('SHIPPED')} disabled={order.status === 'SHIPPED'} className="h-12 rounded-xl bg-purple-500/5 text-[9px] font-black uppercase tracking-widest text-purple-600 hover:bg-purple-500/10">
                Giao h\u00e0ng
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange('DELIVERED')} disabled={order.status === 'DELIVERED'} className="h-12 rounded-xl bg-emerald-500/5 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/10">
                Ho\u00e0n t\u1ea5t
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange('CANCELLED')} disabled={order.status === 'CANCELLED'} className="h-12 rounded-xl bg-rose-500/5 text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-500/10">
                H\u1ee7y \u0111\u01a1n
              </Button>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">KH\u00c1CH H\u00c0NG</h4>
            <div className="space-y-4 rounded-[32px] border border-border/50 bg-surface-default p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-black uppercase text-primary">
                  {order.user?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase italic">{order.user?.name || 'Kh\u00e1ch v\u00e3ng lai'}</p>
                  <p className="truncate text-[10px] font-bold text-muted-foreground opacity-60">{order.user?.email}</p>
                </div>
              </div>
              <div className="space-y-3 border-t border-border/30 pt-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">\u0110\u1ecaA CH\u1ec8 GIAO H\u00c0NG</p>
                    <p className="text-[10px] font-bold leading-relaxed">{order.shippingAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">PH\u01af\u01a0NG TH\u1ee8C</p>
                    <p className="text-[10px] font-bold">{order.shippingMethod}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <div>
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">THANH TO\u00c1N</p>
                    <p className="text-[10px] font-bold">{order.paymentStatus === 'PAID' ? '\u0110\u00e3 thanh to\u00e1n' : 'Thanh to\u00e1n khi nh\u1eadn h\u00e0ng (COD)'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">L\u1ecaCH S\u1eec V\u1eacN \u0110\u01a0N</h4>
            <div className="relative space-y-6 overflow-hidden rounded-[32px] border border-border/50 bg-surface-default p-6">
              <div className="absolute bottom-6 left-8 top-6 w-0.5 bg-border/30" />
              <div className="relative flex gap-4">
                <div className="z-10 mt-1 h-4 w-4 rounded-full bg-primary ring-4 ring-primary/20" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight">{currentStatus.label}</p>
                  <p className="mt-0.5 text-[9px] font-bold text-muted-foreground">{new Date(order.updatedAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
              <div className="relative flex gap-4 opacity-40">
                <div className="z-10 mt-1 h-4 w-4 rounded-full bg-border" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tight">\u0110\u00c3 T\u1ea0O \u0110\u01a0N H\u00c0NG</p>
                  <p className="mt-0.5 text-[9px] font-bold text-muted-foreground">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">ORDER TRACKING ID: {order.orderNumber}</p>
        <Button variant="ghost" onClick={onClose} className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
          \u0110\u00f3ng chi ti\u1ebft \u0111\u01a1n h\u00e0ng
        </Button>
      </div>
    </div>
  );
};
