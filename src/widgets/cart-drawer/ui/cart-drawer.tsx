import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/src/shared/ui/sheet';
import { useCartStore } from '@/src/entities/cart/model/store';
import { Button } from '@/src/shared/ui/button';
import { Separator } from '@/src/shared/ui/separator';
import { ScrollArea } from '@/src/shared/ui/scroll-area';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartDrawer = ({ isOpen, onOpenChange }: CartDrawerProps) => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onOpenChange(false);
    navigate('/checkout');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-surface-elevated border-l border-border/50">
        <SheetHeader className="p-6 border-b border-border/50 bg-surface-elevated/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-heading font-black flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              GIỎ HÀNG <span className="text-muted-foreground/40 font-medium">({totalItems()})</span>
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 bg-surface-sunken/30">
          {items.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
              <div className="h-24 w-24 rounded-full bg-muted/20 flex items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/20" />
              </div>
              <p className="text-lg font-black text-muted-foreground/60 uppercase tracking-widest">Trống trơn...</p>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-2xl border-2 font-black text-xs px-8">
                TIẾP TỤC MUA SẮM
              </Button>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-4 p-4 rounded-3xl bg-surface-default shadow-sm border border-border/50 group"
                  >
                    <div className="h-24 w-20 rounded-2xl overflow-hidden shrink-0 border border-border/50 bg-muted">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-heading font-black text-sm line-clamp-1 text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-black">
                          {typeof item.category === 'object' ? item.category.name : item.category}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-surface-sunken p-1 rounded-xl border border-border/50">
                          <button 
                            className="h-8 w-8 flex items-center justify-center hover:bg-surface-default rounded-lg transition-colors"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-xs font-black min-w-8 text-center">{item.quantity}</span>
                          <button 
                            className="h-8 w-8 flex items-center justify-center hover:bg-surface-default rounded-lg transition-colors"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button 
                          className="p-2 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                          onClick={() => removeItem(item.id)}
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-primary">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <SheetFooter className="p-8 border-t border-border/50 bg-surface-elevated shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.2)]">
            <div className="w-full space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">TỔNG CỘNG TẠM TÍNH</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black font-heading text-primary">
                    {totalPrice().toLocaleString('vi-VN')}
                  </span>
                  <span className="text-xs font-black text-muted-foreground/60 uppercase">VND</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-16 text-xs font-black tracking-widest shadow-2xl shadow-primary/20 rounded-3xl group"
                onClick={handleCheckout}
              >
                TIẾP TỤC THANH TOÁN
                <motion.span 
                  animate={{ x: [0, 5, 0] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >→</motion.span>
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
