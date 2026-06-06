import React, { useEffect, useState } from 'react';
import { Card } from '@/src/shared/ui/card';
import { Button } from '@/src/shared/ui/button';
import { Heart, ShoppingBag, Loader2, Star, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/src/shared/store/wishlist-store';
import { productService } from '@/src/entities/product/api/product-service';
import { Product } from '@/src/entities/product/model/types';
import { getProductUrl } from '@/src/entities/product/lib/product-url';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '@/src/shared/store/cart-store';
import { toast } from 'sonner';

export const WishlistTab: React.FC = () => {
  const { ids, toggleItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ids.length > 0) {
      setIsLoading(true);
      Promise.all(ids.map((id) => productService.getProductById(id)))
        .then((results) => {
          setProducts(results.filter((p): p is Product => p !== undefined));
        })
        .finally(() => setIsLoading(false));
    } else {
      setProducts([]);
    }
  }, [ids]);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border/50 pb-6 md:flex-row md:items-center">
        <div>
          <h2 className="font-sans text-2xl font-black uppercase italic tracking-tight">DANH SÁCH YÊU THÍCH</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Những món quà bạn muốn sở hữu trong tương lai</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-2">
          <Heart className="h-4 w-4 fill-primary text-primary" />
          <span className="text-xs font-black text-primary">{products.length} SẢN PHẨM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {products.length > 0 ? (
            products.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group flex h-full flex-col overflow-hidden rounded-[32px] border-none bg-white/80 p-4 shadow-soft backdrop-blur-md transition-all hover:shadow-xl dark:bg-slate-900/80">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-muted/30">
                    <Link to={getProductUrl(item)} className="block h-full w-full">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </Link>
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-rose-500 shadow-lg backdrop-blur-md transition-all hover:scale-110 active:scale-95 dark:bg-slate-800/90"
                    >
                      <Heart className="h-5 w-5 fill-rose-500" />
                    </button>
                    {item.isNew && (
                      <div className="absolute left-4 top-4 rounded-lg bg-primary px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-primary/20">
                        Mới
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-1 flex-col justify-between space-y-4">
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary opacity-80">
                          {typeof item.category === 'object' ? item.category.name : item.category}
                        </p>
                        <div className="flex text-amber-400">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          <span className="ml-0.5 text-[9px] font-bold">4.9</span>
                        </div>
                      </div>
                      <h4 className="line-clamp-1 text-sm font-black uppercase italic tracking-tight leading-snug transition-colors group-hover:text-primary">{item.name}</h4>
                      <p className="mt-2 text-xl font-black italic tracking-tighter text-primary">{item.price.toLocaleString('vi-VN')}đ</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(item)}
                        className="h-12 flex-1 gap-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-95"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Cho vào giỏ
                      </Button>
                      <Link to={getProductUrl(item)} className="shrink-0">
                        <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-muted/30 shadow-sm transition-all hover:bg-primary hover:text-white">
                          <ArrowUpRight className="h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full w-full rounded-[48px] border border-dashed border-border/50 bg-white/30 py-24 text-center dark:bg-slate-900/30"
            >
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted/20">
                <Heart className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="mb-2 text-xl font-black uppercase italic tracking-tight">DANH SÁCH TRỐNG</h3>
              <p className="mx-auto mb-8 max-w-[280px] text-xs font-medium text-muted-foreground">Bạn chưa lưu sản phẩm nào. Hãy khám phá bộ sưu tập của chúng tôi để tìm món đồ yêu thích.</p>
              <Link to="/search">
                <Button className="h-14 rounded-2xl px-10 text-[11px] font-black uppercase italic tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  Khám phá ngay
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
