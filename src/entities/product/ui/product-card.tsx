import { memo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Check, ShieldCheck, Zap } from 'lucide-react';
import { Product } from '../model/types';
import { useCartStore } from '@/src/entities/cart/model/store';
import { useWishlistStore } from '@/src/shared/store/wishlist-store';
import { getProductUrl } from '../lib/product-url';
import { getWarrantyLabel } from '../lib/warranty';
import { toast } from 'sonner';
import { cn } from '@/src/shared/lib/utils';

interface ProductCardProps {
  product: Product;
}

const formatPrice = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export const ProductCard = memo(({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { toggleItem, hasItem } = useWishlistStore();
  const isWishlisted = hasItem(product.id);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categoryLabel = typeof product.category === 'object' ? product.category?.name || 'Danh mục' : product.category || 'Danh mục';
  const warrantyLabel = getWarrantyLabel(product.tags);
  const isSoldOut = typeof product.stock === 'number' && product.stock <= 0;
  const soldCount = typeof product.soldCount === 'number' ? product.soldCount : 0;
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  const handleAddToCart = async (event: MouseEvent) => {
    event.stopPropagation();
    if (isSoldOut || isAdding || showSuccess) return;

    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 260));
    addItem(product);
    setIsAdding(false);
    setShowSuccess(true);

    toast.success('Đã thêm vào giỏ hàng', {
      id: `cart-${product.id}`,
      duration: 1800,
      description: product.name,
    });

    window.setTimeout(() => setShowSuccess(false), 1600);
  };

  const handleBuyNow = (event: MouseEvent) => {
    event.stopPropagation();
    if (isSoldOut || isAdding) return;
    addItem(product);
    navigate('/checkout');
  };

  const handleToggleWishlist = (event: MouseEvent) => {
    event.stopPropagation();
    toggleItem(product.id);
  };

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_28px_-24px_rgba(0,0,0,.65)] transition-all hover:border-primary/40 hover:shadow-[0_22px_44px_-30px_rgba(8,113,95,.65)]"
      onClick={() => navigate(getProductUrl(product))}
      data-testid={`product-card-${product.slug || product.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-card">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={cn('h-full w-full object-cover transition-transform duration-500 group-hover:scale-105', isSoldOut && 'grayscale')}
        />

        <div className="absolute left-2 top-2 z-20 flex flex-col gap-1.5">
          {discount ? (
            <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-black text-white shadow-sm">-{discount}%</span>
          ) : product.isNew ? (
            <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-black text-white shadow-sm">NEW</span>
          ) : null}
          {!isSoldOut && product.stock && product.stock <= 5 ? (
            <span className="rounded-full bg-yellow-300 px-2 py-1 text-[9px] font-black uppercase text-neutral-900">Sắp hết</span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={`${isWishlisted ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'} ${product.name}`}
          className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-sm transition-colors hover:bg-card"
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-accent text-accent')} />
        </button>

        {isSoldOut && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/75 backdrop-blur-[1px]">
            <div className="rotate-[-8deg] rounded-xl border-2 border-accent bg-card px-4 py-2 text-center text-sm font-black uppercase text-accent shadow-lg">
              Đã bán hết
            </div>
          </div>
        )}

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-primary/15 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ scale: 0.65 }}
                animate={{ scale: 1 }}
                className="rounded-full bg-card p-3 text-primary shadow-xl"
              >
                <Check className="h-7 w-7 stroke-[3px]" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSoldOut && (
          <div className="absolute inset-x-2 bottom-2 z-30 grid translate-y-4 grid-cols-2 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleBuyNow}
              data-testid={`buy-now-${product.slug || product.id}`}
              className="h-10 rounded-xl bg-card text-[10px] font-black uppercase tracking-[0.08em] text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Mua ngay
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              data-testid={`add-to-cart-${product.slug || product.id}`}
              disabled={isAdding}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-80"
            >
              {isAdding ? <Zap className="h-3.5 w-3.5 animate-pulse" /> : <ShoppingBag className="h-3.5 w-3.5" />}
              Thêm
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="line-clamp-1 text-[10px] font-black uppercase tracking-[0.08em] text-muted-foreground">{categoryLabel}</span>
          <span className="whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-[9px] font-black text-primary">Đã bán {soldCount}</span>
        </div>

        <h3 className="line-clamp-2 min-h-[2.35rem] text-[13px] font-extrabold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-sm">
          {product.name}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase text-primary">Chính hãng</span>
          {warrantyLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-black uppercase text-primary">
              <ShieldCheck className="h-3 w-3" />
              BH {warrantyLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-2 pt-1">
          {isSoldOut ? (
            <span className="text-sm font-black uppercase text-muted-foreground">Tạm hết hàng</span>
          ) : (
            <>
              <span className="text-[15px] font-black text-accent sm:text-base">{formatPrice(product.price)}</span>
              {product.oldPrice && product.oldPrice > product.price ? (
                <span className="text-[11px] font-semibold text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
});

ProductCard.displayName = 'ProductCard';
