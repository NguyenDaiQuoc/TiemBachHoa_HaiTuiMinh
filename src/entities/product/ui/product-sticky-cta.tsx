import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';

interface StickyCTAProps {
  isVisible: boolean;
  name: string;
  price: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export const ProductStickyCTA = ({ isVisible, name, price, onAddToCart, onBuyNow }: StickyCTAProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-[60] bg-background/80 backdrop-blur-2xl border-t border-border/50 px-6 py-4 md:px-12 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
        >
          <div className="hidden md:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{name}</p>
            <p className="text-lg font-black tracking-tighter">
              {price.toLocaleString('vi-VN')} ₫
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center justify-between w-full md:hidden mb-2 px-2">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground truncate max-w-[200px]">{name}</p>
               <p className="text-sm font-black text-primary italic">
                 {price.toLocaleString('vi-VN')} ₫
               </p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <Button 
                variant="outline" 
                className="flex-1 md:w-48 h-14 rounded-[28px] border-2 border-border/50 font-black text-[10px] sm:text-xs hover:bg-foreground hover:text-background transition-all uppercase tracking-widest whitespace-nowrap"
                onClick={onAddToCart}
              >
                <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
                GIỎ HÀNG
              </Button>
              <Button 
                className="flex-2 md:w-48 h-14 rounded-[28px] bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] sm:text-xs transition-all uppercase tracking-widest"
                onClick={onBuyNow}
              >
                MUA NGAY
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
