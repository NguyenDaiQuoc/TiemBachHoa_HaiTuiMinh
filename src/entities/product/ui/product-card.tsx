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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdding || showSuccess) return;
    
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

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleItem(product.id);
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      layout
      className="relative"
      onClick={() => navigate(getProductUrl(product))}
      data-testid={productTestId}
    >
      <Card className={cn(
        "overflow-hidden border-border/50 shadow-soft group cursor-pointer transition-all duration-500",
        showSuccess ? "ring-2 ring-primary/50 bg-primary/10" : "bg-card hover:bg-surface-elevated"
      )}>
        <div className="relative overflow-hidden">
          <AspectRatio ratio={4 / 5}>
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          </AspectRatio>
          
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
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-black uppercase text-[9px] tracking-[0.2em] px-2.5 py-1 z-20 rounded-lg">
              NEW
            </Badge>
          )}

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-20">
            <Button 
              size="icon-sm" 
              variant="secondary" 
              className="rounded-full shadow-lg bg-surface-elevated/90 backdrop-blur-md border border-border/50 hover:bg-surface-elevated"
              onClick={handleToggleWishlist}
              aria-label={`${isWishlisted ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'} ${product.name}`}
            >
              <Heart className={cn("h-4 w-4 transition-colors", isWishlisted && "fill-destructive text-destructive")} />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20">
            <Button 
              className={cn(
                "w-full rounded-2xl transition-all duration-300 font-black tracking-widest h-11 text-[10px] uppercase",
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
        </div>
        
        <CardContent className="p-4 space-y-2 bg-card group-hover:bg-surface-elevated transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] font-black">
              {categoryLabel}
            </p>
            {product.soldCount && product.soldCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                <span className="size-1 bg-primary rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-primary italic uppercase tracking-tighter">Đã bán {product.soldCount >= 1000 ? `${(product.soldCount / 1000).toFixed(1)}k` : product.soldCount}</span>
              </div>
            )}
          </div>
          <motion.h3 
            className="font-heading font-black text-sm line-clamp-1 group-hover:text-primary transition-colors text-foreground"
          >
            {product.name}
          </motion.h3>
          
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1.5">
               <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                 <Check className="h-2.5 w-2.5 text-emerald-500" />
                 <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Chính hãng</span>
               </div>
               {product.stock && product.stock <= 5 && (
                  <span className="text-[8px] font-black text-rose-500 uppercase italic">Sắp hết!</span>
               )}
               {warrantyLabel && (
                 <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/15">
                   <ShieldCheck className="h-2.5 w-2.5 text-primary" />
                   <span className="text-[8px] font-black text-primary uppercase tracking-tighter">BH {warrantyLabel}</span>
                 </div>
               )}
            </div>
            {product.reviewCount && product.reviewCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-amber-500">★</span>
                <span className="text-[9px] font-bold text-muted-foreground/80">{product.rating || '4.9'}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="px-4 pb-5 pt-0 bg-card group-hover:bg-surface-elevated transition-colors">
          <p className="font-heading font-black text-base text-accent italic">
            {product.price.toLocaleString('vi-VN')} <span className="text-[10px] not-italic opacity-55">VND</span>
          </p>
        </CardFooter>
      </Card>
      
      <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';
