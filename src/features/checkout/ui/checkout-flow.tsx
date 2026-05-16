
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
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
  const { 
    selectedPaymentMethod, 
    setPaymentMethod,
    selectedShippingMethod,
    setShippingMethod,
    createOrder,
    currentOrder
  } = useCheckoutStore();
  
  const { items, totalPrice } = useCartStore();
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
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate order creation
    
    try {
      createOrder(items, totalPrice());
      toast.success('Đơn hàng đã được khởi tạo!');
      setStep(3); // 3: Verification / Success
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsCreating(false);
    }
  };

  if (items.length === 0 && !currentOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold font-heading">Giỏ hàng của bạn đang trống</h2>
        <Button onClick={() => window.location.href = '/'} className="rounded-full">
          VỀ TRANG CHỦ
        </Button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-12 mb-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-muted-foreground">
          <span className={cn("flex items-center gap-2", step >= 1 && "text-primary font-bold")}>
            <span className="h-6 w-6 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
            THÔNG TIN
          </span>
          <span className="h-px w-6 bg-border" />
          <span className={cn("flex items-center gap-2", step >= 2 && "text-primary font-bold")}>
            <span className="h-6 w-6 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
            THANH TOÁN
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Lock className="h-3 w-3" />
          BẢO MẬT SSL
        </div>
      </div>

      <div className="lg:col-span-8 space-y-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CheckoutForm onSuccess={() => setStep(2)} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-10"
            >
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Quay lại thông tin giao hàng
              </button>

              <div className="space-y-8">
                <ShippingMethodSelector 
                  selected={selectedShippingMethod} 
                  onSelect={setShippingMethod} 
                />
                
                <PaymentMethodSelector 
                  selected={selectedPaymentMethod} 
                  onSelect={setPaymentMethod} 
                />
              </div>

              <Button 
                onClick={handleCreateOrder} 
                className="w-full h-14 rounded-full text-lg font-black shadow-xl shadow-primary/20"
                loading={isCreating}
              >
                ĐẶT HÀNG NGAY
              </Button>
            </motion.div>
          )}

          {step === 3 && currentOrder && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <PaymentVerification order={currentOrder} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="lg:col-span-4">
        <OrderSummary />
      </div>
    </div>
  );
};
