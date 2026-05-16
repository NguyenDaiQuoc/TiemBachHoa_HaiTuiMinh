import React from 'react';
import { Card } from '@/src/shared/ui/card';
import { Button } from '@/src/shared/ui/button';
import { Eye, ShoppingBag, Trash2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRecentlyViewedStore } from '@/src/entities/product/model/recently-viewed-store';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/shared/lib/utils';
import { useCartStore } from '@/src/shared/store/cart-store';
import { toast } from 'sonner';

export const RecentlyViewedTab: React.FC = () => {
  const { products, clear } = useRecentlyViewedStore();
  const { addItem } = useCartStore();

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight font-sans">SẢN PHẨM VỪA XEM</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Danh sách các sản phẩm bạn đã quan tâm gần đây</p>
        </div>
        {products.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clear}
            className="h-10 px-4 rounded-xl text-[10px] font-black italic uppercase tracking-widest text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> XÓA LỊCH SỬ
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {products.length > 0 ? (
            products.map((item, i) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group relative overflow-hidden rounded-[32px] border-none shadow-soft transition-all duration-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:shadow-xl h-full flex flex-col">
                  <Link to={`/product/${item.id}`} className="block relative aspect-square overflow-hidden bg-muted/30 p-4">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500" />
                  </Link>

                  <div className="p-5 space-y-4 flex flex-col flex-1">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-80">
                        {typeof item.category === 'object' ? item.category.name : item.category}
                      </p>
                      <h4 className="font-black italic uppercase tracking-tight text-sm line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h4>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <p className="text-xl font-black italic tracking-tighter text-primary">{item.price.toLocaleString()}đ</p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleAddToCart(item)}
                          size="icon" 
                          variant="ghost" 
                          className="rounded-xl h-10 w-10 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Button>
                        <Link to={`/product/${item.id}`}>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="rounded-xl h-10 w-10 bg-muted/30 text-muted-foreground hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-24 bg-white/30 dark:bg-slate-900/30 rounded-[48px] border border-dashed border-border/50 w-full"
            >
              <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                <Eye className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">LỊCH SỬ TRỐNG</h3>
              <p className="text-xs text-muted-foreground font-medium mb-8 max-w-[280px] mx-auto">Bạn chưa xem bất kỳ sản phẩm nào. Hãy khám phá và tìm sản phẩm ưng ý nhé!</p>
              <Link to="/search">
                <Button className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest italic text-[11px] shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">BẮT ĐẦU MUA SẮM</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
