import React, { useEffect, useState } from 'react';
import { Card } from '@/src/shared/ui/card';
import { Button } from '@/src/shared/ui/button';
import { Heart, ShoppingBag, Trash2, Loader2, Star, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/src/shared/store/wishlist-store';
import { productService } from '@/src/entities/product/api/product-service';
import { Product } from '@/src/entities/product/model/types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/shared/lib/utils';
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
      Promise.all(ids.map(id => productService.getProductById(id)))
        .then(results => {
          setProducts(results.filter((p): p is Product => p !== undefined));
        })
        .finally(() => setIsLoading(false));
    } else {
      setProducts([]);
    }
  }, [ids]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight font-sans">DANH SÁCH YÊU THÍCH</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Những món quà bạn muốn sở hữu trong tương lai</p>
        </div>
        <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary fill-primary" />
          <span className="text-xs font-black text-primary">{products.length} SẢN PHẨM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Card className="p-4 border-none shadow-soft group rounded-[32px] overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:shadow-xl transition-all h-full flex flex-col">
                  <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden bg-muted/30">
                    <Link to={`/product/${item.id}`} className="block w-full h-full">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    </Link>
                    <button 
                      onClick={() => toggleItem(item.id)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg flex items-center justify-center text-rose-500 hover:scale-110 active:scale-95 transition-all"
                    >
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </button>
                    {item.isNew && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg shadow-primary/20">
                        MỚI
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between flex-1 mt-4 space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-80">
                          {typeof item.category === 'object' ? item.category.name : item.category}
                        </p>
                        <div className="flex text-amber-400">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span className="text-[9px] font-bold ml-0.5">4.9</span>
                        </div>
                      </div>
                      <h4 className="font-black italic uppercase tracking-tight text-sm line-clamp-1 leading-snug group-hover:text-primary transition-colors">{item.name}</h4>
                      <p className="text-primary font-black italic mt-2 text-xl tracking-tighter">{item.price.toLocaleString()}đ</p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAddToCart(item)}
                        className="flex-1 h-12 rounded-2xl text-[10px] gap-2 font-black uppercase tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-95"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        CHO VÀO GIỎ
                      </Button>
                      <Link to={`/product/${item.id}`} className="shrink-0">
                        <Button 
                          variant="ghost" 
                          className="h-12 w-12 rounded-2xl bg-muted/30 hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          <ArrowUpRight className="w-5 h-5" />
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
              className="col-span-full text-center py-24 bg-white/30 dark:bg-slate-900/30 rounded-[48px] border border-dashed border-border/50 w-full"
            >
              <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">DANH SÁCH TRỐNG</h3>
              <p className="text-xs text-muted-foreground font-medium mb-8 max-w-[280px] mx-auto">Bạn chưa lưu sản phẩm nào. Hãy khám phá bộ sưu tập của chúng tôi để tìm món đồ yêu thích.</p>
              <Link to="/search">
                <Button className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest italic text-[11px] shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">KHÁM PHÁ NGAY</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
