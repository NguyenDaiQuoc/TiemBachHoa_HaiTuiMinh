import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckoutForm } from './checkout-form';
import { PaymentMethodSelector } from './payment-method-selector';
import { ShippingMethodSelector } from './shipping-method-selector';
import { useCheckoutStore } from '../model/checkout-store';
import { useCartStore } from '@/src/entities/cart/model/store';
import { Button } from '@/src/shared/ui/button';
import { ShoppingBag, ChevronLeft, Lock } from 'lucide-react';
import { OrderSummary } from './order-summary';
import { toast } from 'sonner';
import { cn } from '@/src/shared/lib/utils';
import { PaymentVerification } from './payment-verification';

export const CheckoutFlow = () => {
  const [step, setStep] = useState(1);
  const {
    selectedPaymentMethod,
    setPaymentMethod,
    selectedShippingMethod,
    setShippingMethod,
    createOrder,
    currentOrder,
  } = useCheckoutStore();

  const { items, totalPrice, clearCart } = useCartStore();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateOrder = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán');
      return;
    }

    if (!selectedShippingMethod) {
      toast.error('Vui lòng chọn phương thức giao hàng');
      return;
    }

    setIsCreating(true);
    try {
      await createOrder(items, totalPrice());
      clearCart();
      toast.success('Đơn hàng đã được khởi tạo!');
      setStep(3);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsCreating(false);
    }
  };

  if (items.length === 0 && !currentOrder) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-2xl font-bold">Giỏ hàng của bạn đang trống</h2>
        <Button onClick={() => (window.location.href = '/')} className="rounded-full">
          VỀ TRANG CHỦ
        </Button>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-12">
      <div className="mb-4 flex items-center justify-between lg:col-span-12">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground md:text-sm">
          <span className={cn('flex items-center gap-2', step >= 1 && 'font-bold text-primary')}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-[10px]">1</span>
            THÔNG TIN
          </span>
          <span className="h-px w-6 bg-border" />
          <span className={cn('flex items-center gap-2', step >= 2 && 'font-bold text-primary')}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-[10px]">2</span>
            THANH TOÁN
          </span>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
          <Lock className="h-3 w-3" />
          BẢO MẬT SSL
        </div>
      </div>

      <div className="space-y-8 lg:col-span-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <CheckoutForm onSuccess={() => setStep(2)} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
              <button onClick={() => setStep(1)} className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Quay lại thông tin giao hàng
              </button>

              <div className="space-y-8">
                <ShippingMethodSelector selected={selectedShippingMethod} onSelect={setShippingMethod} />
                <PaymentMethodSelector selected={selectedPaymentMethod} onSelect={setPaymentMethod} />
              </div>

              <Button onClick={handleCreateOrder} className="h-14 w-full rounded-full text-lg font-black shadow-xl shadow-primary/20" loading={isCreating}>
                ĐẶT HÀNG NGAY
              </Button>
            </motion.div>
          )}

          {step === 3 && currentOrder && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <PaymentVerification order={currentOrder} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="lg:col-span-4">
        <OrderSummary useCurrentOrder={step === 3} />
      </div>
    </div>
  );
};
