import { CheckoutFlow } from '@/src/features/checkout/ui/checkout-flow';
import { motion } from 'motion/react';

export const CheckoutPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black font-heading tracking-tight">THANH TOÁN</h1>
            <p className="text-muted-foreground text-lg">Hoàn tất các bước cuối cùng để nhận hàng.</p>
          </div>
          
          <CheckoutFlow />
        </motion.div>
    </div>
  );
}
