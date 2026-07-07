import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../model/types';
import { Card, CardContent, CardFooter } from '@/src/shared/ui/card';
import { Badge } from '@/src/shared/ui/badge';
import { AspectRatio } from '@/src/shared/ui/aspect-ratio';
import { ShoppingBag, Heart, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '@/src/entities/cart/model/store';
import { useWishlistStore } from '@/src/shared/store/wishlist-store';
import { getProductUrl } from '../lib/product-url';
import { getWarrantyLabel } from '../lib/warranty';
import { toast } from 'sonner';
import { cn } from "@shared/lib/utils";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { toggleItem, hasItem } = useWishlistStore();
  const isWishlisted = hasItem(product.id);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const categoryLabel = typeof product.category === 'object' ? product.category?.name || 'Danh mục' : product.category || 'Danh mục';
  const warrantyLabel = getWarrantyLabel(product.tags);
  const productTestId = `product-card-${product.slug || product.id}`;
  const isSoldOut = typeof product.stock === 'number' && product.stock <= 0;
  const soldCount = typeof product.soldCount === 'number' ? product.soldCount : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldOut || isAdding || showSuccess) return;
    
    setIsAdding(true);
    
    // Tactile delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    addItem(product);
    setIsAdding(false);
    setShowSuccess(true);
    
    toast.success(`Đã thêm vào giỏ hàng`, {
      id: `cart-${product.id}`,
      duration: 2000,
      description: product.name,
    });

    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldOut || isAdding) return;

    addItem(product);
    navigate('/checkout');
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleItem(product.id);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      layout
      className="relative"
      onClick={() => navigate(getProductUrl(product))}
      data-testid={productTestId}
    >
      <Card className={cn(
        "group cursor-pointer overflow-hidden border-border/60 bg-card/90 shadow-soft transition-all duration-500 hover:border-primary/25 hover:shadow-[0_24px_60px_-36px_hsl(var(--primary))]",
        showSuccess && "ring-2 ring-primary/50 bg-primary/10"
      )}>
        <div className="relative overflow-hidden bg-muted/50">
          <AspectRatio ratio={4 / 5}>
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className={cn(
                'h-full w-full object-cover transition-transform duration-700 group-hover:scale-105',
                isSoldOut && 'grayscale'
              )}
              referrerPolicy="no-referrer"
            />
          </AspectRatio>

          {isSoldOut && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
              <div className="rounded-2xl border border-border/70 bg-card/95 px-4 py-3 text-center shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Sản phẩm</p>
                <p className="mt-1 text-base font-black uppercase text-foreground">Đã bán hết</p>
              </div>
            </div>
          )}
          
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-10"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="bg-surface-elevated rounded-full p-4 shadow-2xl"
                >
                  <Check className="h-8 w-8 text-primary stroke-[3px]" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ y: 0, opacity: 0, scale: 0.5 }}
                animate={{ y: -100, x: 100, opacity: [0, 1, 0], scale: [0.5, 1, 0.2] }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
              >
                <div className="bg-primary size-4 rounded-sm rotate-12 shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {product.isNew && (
            <Badge className="absolute left-3 top-3 z-20 rounded-full bg-primary px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-primary-foreground">
              NEW
            </Badge>
          )}

          <div className="absolute right-3 top-3 z-20 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Button 
              size="icon-sm" 
              variant="secondary" 
              className="rounded-full border border-border/50 bg-card/90 shadow-lg backdrop-blur-md hover:bg-surface-elevated"
              onClick={handleToggleWishlist}
              aria-label={`${isWishlisted ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'} ${product.name}`}
            >
              <Heart className={cn("h-4 w-4 transition-colors", isWishlisted && "fill-destructive text-destructive")} />
            </Button>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 transition-transform duration-500 group-hover:translate-y-0">
            {isSoldOut ? (
              <Button
                className="h-11 w-full rounded-xl bg-muted text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground"
                disabled
              >
                Đã bán hết
              </Button>
            ) : (
              <div className="grid gap-2">
                <Button
                  className="h-10 w-full rounded-xl bg-foreground text-[10px] font-black uppercase tracking-[0.12em] text-background hover:bg-foreground/90"
                  onClick={handleBuyNow}
                  data-testid={`buy-now-${product.slug || product.id}`}
                  aria-label={`Mua ngay ${product.name}`}
                >
                  Mua ngay
                </Button>
                <Button
                  className={cn(
                    "h-10 w-full rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300",
                    showSuccess ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={handleAddToCart}
                  data-testid={`add-to-cart-${product.slug || product.id}`}
                  aria-label={`Thêm ${product.name} vào giỏ hàng`}
                  loading={isAdding}
                  success={showSuccess}
                >
                  <ShoppingBag className="h-4 w-4" />
                  THÊM VÀO GIỎ
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <CardContent className="space-y-3 bg-card p-4 transition-colors group-hover:bg-surface-default">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              {categoryLabel}
            </p>
            {typeof product.soldCount === 'number' && (
              <div className="flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5">
                <span className="size-1 bg-primary rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase text-primary">Đã bán {soldCount >= 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount}</span>
              </div>
            )}
          </div>
          <motion.h3 
            className="line-clamp-2 min-h-[2.65rem] text-sm font-extrabold leading-snug text-foreground transition-colors group-hover:text-primary"
          >
            {product.name}
          </motion.h3>
          
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1.5">
               <div className="flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-1.5 py-0.5">
                 <Check className="h-2.5 w-2.5 text-accent" />
                 <span className="text-[8px] font-black uppercase text-accent">Chính hãng</span>
               </div>
               {!isSoldOut && product.stock && product.stock <= 5 && (
                  <span className="text-[8px] font-black uppercase text-rose-500">Sắp hết</span>
               )}
               {warrantyLabel && (
                 <div className="flex items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-1.5 py-0.5">
                   <ShieldCheck className="h-2.5 w-2.5 text-primary" />
                   <span className="text-[8px] font-black text-primary uppercase tracking-tighter">BH {warrantyLabel}</span>
                 </div>
               )}
            </div>
            {product.reviewCount && product.reviewCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-500">★</span>
                <span className="text-[9px] font-bold text-muted-foreground">{product.rating || '4.9'}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-card px-4 pb-5 pt-0 transition-colors group-hover:bg-surface-default">
          {isSoldOut ? (
            <p className="text-sm font-black uppercase tracking-[0.12em] text-muted-foreground">Tạm hết hàng</p>
          ) : (
            <p className="text-base font-black text-accent">
              {product.price.toLocaleString('vi-VN')} <span className="text-[10px] opacity-55">đ</span>
            </p>
          )}
        </CardFooter>
      </Card>
      
      <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-primary/10 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';
