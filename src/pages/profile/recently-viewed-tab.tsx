import React from 'react';
import { Card } from '@/src/shared/ui/card';
import { Button } from '@/src/shared/ui/button';
import { Eye, ShoppingBag, Trash2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRecentlyViewedStore } from '@/src/entities/product/model/recently-viewed-store';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '@/src/shared/store/cart-store';
import { toast } from 'sonner';
import type { Product } from '@/src/entities/product/model/types';
import { getProductUrl } from '@/src/entities/product/lib/product-url';

export const RecentlyViewedTab: React.FC = () => {
  const { products, clear } = useRecentlyViewedStore();
  const { addItem } = useCartStore();

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border/50 pb-6 md:flex-row md:items-center">
        <div>
          <h2 className="font-sans text-2xl font-black uppercase italic tracking-tight">SẢN PHẨM VỪA XEM</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Danh sách các sản phẩm bạn đã quan tâm gần đây</p>
        </div>
        {products.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="h-10 rounded-xl px-4 text-[10px] font-black uppercase italic tracking-widest text-muted-foreground transition-all hover:bg-rose-500/5 hover:text-rose-500"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Xóa lịch sử
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <Card className="group relative flex h-full flex-col overflow-hidden rounded-[32px] border-none bg-white/80 shadow-soft backdrop-blur-md transition-all duration-500 hover:shadow-xl dark:bg-slate-900/80">
                  <Link to={getProductUrl(item)} className="relative block aspect-square overflow-hidden bg-muted/30 p-4">
                    <img src={item.image} alt={item.name} className="h-full w-full rounded-2xl object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-primary/0 transition-colors duration-500 group-hover:bg-primary/5" />
                  </Link>

                  <div className="flex flex-1 flex-col space-y-4 p-5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary opacity-80">
                        {typeof item.category === 'object' ? item.category.name : item.category}
                      </p>
                      <h4 className="line-clamp-1 text-sm font-black uppercase italic tracking-tight transition-colors group-hover:text-primary">{item.name}</h4>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <p className="text-xl font-black italic tracking-tighter text-primary">{item.price.toLocaleString('vi-VN')}₫</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddToCart(item)}
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 rounded-xl bg-primary/5 text-primary shadow-sm transition-all hover:bg-primary hover:text-white"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </Button>
                        <Link to={getProductUrl(item)}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 rounded-xl bg-muted/30 text-muted-foreground shadow-sm transition-all hover:bg-primary hover:text-white"
                          >
                            <ArrowUpRight className="h-4 w-4" />
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
              className="col-span-full w-full rounded-[48px] border border-dashed border-border/50 bg-white/30 py-24 text-center dark:bg-slate-900/30"
            >
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/20">
                <Eye className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="mb-2 text-xl font-black uppercase italic tracking-tight">LỊCH SỬ TRỐNG</h3>
              <p className="mx-auto mb-8 max-w-[280px] text-xs font-medium text-muted-foreground">Bạn chưa xem bất kỳ sản phẩm nào. Hãy khám phá và tìm sản phẩm ưng ý nhé!</p>
              <Link to="/products">
                <Button className="h-14 rounded-2xl px-10 text-[11px] font-black uppercase italic tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  Bắt đầu mua sắm
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

