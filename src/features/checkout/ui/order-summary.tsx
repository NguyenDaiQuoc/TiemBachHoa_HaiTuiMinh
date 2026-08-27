import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/src/entities/cart/model/store';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { ScrollArea } from '@/src/shared/ui/scroll-area';
import { Separator } from '@/src/shared/ui/separator';
import { calculateShippingPrice } from '@/src/entities/shipping/lib/shipping-engine';
import { useCheckoutStore } from '../model/checkout-store';

interface OrderSummaryProps {
  useCurrentOrder?: boolean;
}

const money = (value: number) => value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const isTestCheckoutOnly = (items: Array<{ slug?: string; quantity?: number }>) =>
  items.length === 1 && String(items[0]?.slug || '').trim().toLowerCase() === 'test';

export const OrderSummary = ({ useCurrentOrder = false }: OrderSummaryProps) => {
  const { items } = useCartStore();
  const {
    currentOrder,
    selectedShippingMethod,
    voucherCode,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
  } = useCheckoutStore();
  const [draftVoucherCode, setDraftVoucherCode] = useState(voucherCode);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  const orderForSummary = useCurrentOrder ? currentOrder : null;
  const displayItems = orderForSummary?.items?.length ? orderForSummary.items : items;
  const testCheckoutOnly = !orderForSummary && isTestCheckoutOnly(items);
  const shipping = orderForSummary ? orderForSummary.shippingFee : testCheckoutOnly ? 0 : selectedShippingMethod ? calculateShippingPrice(selectedShippingMethod) : 0;
  const subtotal = displayItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderMeta = (orderForSummary as any)?.checkoutMeta || {};
  const voucherDiscount = orderForSummary ? Number(orderMeta.voucherDiscount || 0) : testCheckoutOnly ? 0 : Number(appliedVoucher?.discount || 0);
  const total = orderForSummary ? orderForSummary.totalAmount : Math.max(0, subtotal - voucherDiscount) + shipping;

  const handleApplyVoucher = async () => {
    setIsApplyingVoucher(true);
    try {
      await applyVoucher(draftVoucherCode, items);
      toast.success('Đã áp dụng voucher');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể áp dụng voucher');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  return (
    <div className="sticky top-24 space-y-6 rounded-3xl bg-muted/30 p-6">
      <h3 className="font-heading text-xl font-bold">Tóm tắt đơn hàng</h3>

      <ScrollArea className="max-h-[300px] pr-4">
        <div className="space-y-4">
          {displayItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg border bg-background">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-bold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} x {money(item.price)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold">{money(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {!orderForSummary && !testCheckoutOnly && (
        <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            Voucher
          </div>
          {appliedVoucher ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/10 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-primary">{appliedVoucher.code}</p>
                <p className="truncate text-xs text-muted-foreground">{appliedVoucher.title}</p>
              </div>
              <button
                type="button"
                aria-label="Gỡ voucher"
                className="rounded-full p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
                onClick={removeVoucher}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={draftVoucherCode}
                onChange={(event) => setDraftVoucherCode(event.target.value)}
                placeholder="Nhập mã voucher"
                className="h-10 rounded-xl text-sm"
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-xl px-3 text-xs font-black"
                onClick={handleApplyVoucher}
                loading={isApplyingVoucher}
              >
                Áp dụng
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tạm tính</span>
          <span className="font-medium">{money(subtotal)}</span>
        </div>
        {voucherDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Voucher</span>
            <span className="font-bold text-primary">-{money(voucherDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Phí vận chuyển</span>
          <span className={shipping === 0 ? 'font-bold text-success' : 'font-medium'}>
            {shipping === 0 ? 'Miễn phí' : money(shipping)}
          </span>
        </div>
        <Separator className="bg-border/50" />
        <div className="flex justify-between text-xl font-black">
          <span>Tổng cộng</span>
          <span className="text-primary">{money(total)}</span>
        </div>
      </div>

      <p className="text-center text-[10px] uppercase leading-loose tracking-widest text-muted-foreground">
        Bằng cách đặt hàng, bạn đồng ý với <br />
        <span className="cursor-pointer underline">Điều khoản dịch vụ</span> của chúng tôi.
      </p>
    </div>
  );
};
