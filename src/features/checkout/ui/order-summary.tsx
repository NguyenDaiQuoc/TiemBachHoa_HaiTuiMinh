
import { useCartStore } from '@/src/entities/cart/model/store';
import { Separator } from '@/src/shared/ui/separator';
import { ScrollArea } from '@/src/shared/ui/scroll-area';
import { useCheckoutStore } from '../model/checkout-store';
import { calculateShippingPrice } from '@/src/entities/shipping/lib/shipping-engine';

export const OrderSummary = () => {
  const { items, totalPrice } = useCartStore();
  const { currentOrder, selectedShippingMethod } = useCheckoutStore();
  
  const displayItems = currentOrder?.items?.length ? currentOrder.items : items;
  const shipping = currentOrder ? currentOrder.shippingFee : selectedShippingMethod ? calculateShippingPrice(selectedShippingMethod) : 0;
  const total = currentOrder ? currentOrder.totalAmount : totalPrice() + shipping;
  const subtotal = Math.max(0, total - shipping);

  return (
    <div className="bg-muted/30 rounded-3xl p-6 space-y-6 sticky top-24">
      <h3 className="text-xl font-bold font-heading">Tóm tắt đơn hàng</h3>
      
      <ScrollArea className="max-h-[300px] pr-4">
        <div className="space-y-4">
          {displayItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="h-16 w-12 rounded-lg overflow-hidden border bg-background shrink-0">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} x {item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                </p>
              </div>
              <p className="font-bold text-sm shrink-0">
                {(item.price * item.quantity).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tạm tính</span>
          <span className="font-medium">{subtotal.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Phí vận chuyển</span>
          <span className={shipping === 0 ? "text-success font-bold" : "font-medium"}>
            {shipping === 0 ? "Miễn phí" : shipping.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
          </span>
        </div>
        <Separator className="bg-border/50" />
        <div className="flex justify-between text-xl font-black">
          <span>Tổng cộng</span>
          <span className="text-primary">{total.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest leading-loose">
        Bằng cách đặt hàng, bạn đồng ý với <br/> 
        <span className="underline cursor-pointer">Điều khoản dịch vụ</span> của chúng tôi.
      </p>
    </div>
  );
};
