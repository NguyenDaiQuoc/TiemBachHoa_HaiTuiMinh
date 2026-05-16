import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import { Star, ShieldCheck, Truck, RefreshCw, MessageCircle, Share2, Heart, ChevronRight, Check, Eye, Package, Info, AlertCircle, ShoppingBag, BadgeCheck, RotateCcw, Flame, Timer, Sparkles, ArrowRight } from 'lucide-react';
import { productService } from '@/src/entities/product/api/product-service';
import { Product, ProductVariant } from '@/src/entities/product/model/types';
import { useRecentlyViewedStore } from '@/src/entities/product/model/recently-viewed-store';
import { ProductGallery } from '@/src/entities/product/ui/product-gallery';
import { ProductVariantSelector } from '@/src/entities/product/ui/product-variant-selector';
import { ProductStickyCTA } from '@/src/entities/product/ui/product-sticky-cta';
import { ProductCard } from '@/src/entities/product/ui/product-card';
import { Button } from '@/src/shared/ui/button';
import { cn } from '@/src/shared/lib/utils';
import { toast } from 'sonner';

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addProduct);
  const recentlyViewed = useRecentlyViewedStore((state) => state.products.filter(p => p.id !== id));
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activePrice, setActivePrice] = useState(0);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 20) + 5);
  const [recentBuyer, setRecentBuyer] = useState<{name: string, time: string} | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Simulate viewer fluctuations and recent buyers
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => Math.max(3, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 5000);

    const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Minh D', 'Hoàng An'];
    const buyerInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setRecentBuyer({
          name: names[Math.floor(Math.random() * names.length)],
          time: 'vừa'
        });
        setTimeout(() => setRecentBuyer(null), 5000);
      }
    }, 15000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(buyerInterval);
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    productService.getProductById(id).then((data) => {
      if (data) {
        setProduct(data);
        setActivePrice(data.price);
        addRecentlyViewed(data);
        // Initialize variants
        const initialVariants: Record<string, string> = {};
        data.variants?.forEach(v => {
          initialVariants[v.type] = v.options[0].id;
        });
        setSelectedVariants(initialVariants);
      }
      setIsLoading(false);
    });
  }, [id, addRecentlyViewed]);

  useEffect(() => {
    const handleScroll = () => {
      if (galleryRef.current) {
        const rect = galleryRef.current.getBoundingClientRect();
        setIsStickyVisible(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleVariantSelect = (type: string, variant: ProductVariant) => {
    setSelectedVariants(prev => ({ ...prev, [type]: variant.id }));
    // In a real app, this would recalculate price based on all selected variants
    if (product) {
      setActivePrice(product.price + (variant.priceModifier || 0));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-default flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-surface-default flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter italic">KHÔNG TÌM THẤY SẢN PHẨM</h2>
        <Button onClick={() => navigate('/')} className="rounded-2xl">QUAY LẠI CỬA HÀNG</Button>
      </div>
    );
  }

  return (
    <div className="bg-surface-sunken font-sans">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Left: Gallery */}
          <div ref={galleryRef} className="lg:col-span-12 xl:col-span-7">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-10">
            {/* Header Info */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {product.isNew && (
                  <BadgeCheck className="w-5 h-5 text-primary fill-primary/10" />
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 text-yellow-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-yellow-400/20">
                  <Star className="h-3 w-3 fill-current" />
                  {product.rating} ({product.reviewCount} ĐÁNH GIÁ)
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest border border-primary/20">
                  <Eye className="h-3 w-3" />
                  {viewerCount} NGƯỜI ĐANG XEM
                </div>
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest italic bg-muted/50 px-3 py-1 rounded-lg">
                  ĐÃ BÁN {product.soldCount >= 1000 ? `${(product.soldCount / 1000).toFixed(1)}k` : product.soldCount}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Chuyên hàng chính hãng</p>
                <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tighter leading-[0.9] uppercase italic">
                  {product.name}
                </h1>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-black text-primary tracking-tighter italic">
                    {activePrice.toLocaleString('vi-VN')} <span className="text-xl not-italic tracking-normal">₫</span>
                  </span>
                  {product.oldPrice && (
                    <span className="text-xl text-muted-foreground line-through font-medium opacity-50">
                      {product.oldPrice.toLocaleString('vi-VN')} ₫
                    </span>
                  )}
                  {product.oldPrice && (
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black italic">
                      -{Math.round((1 - activePrice / product.oldPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <p className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                    <Package className="w-4 h-4" /> Miễn phí vận chuyển cho đơn hàng từ 500k
                  </p>
                  {product.stock && product.stock <= 10 && (
                    <p className="flex items-center gap-2 text-xs font-black text-rose-500 uppercase italic animate-pulse">
                      <Flame className="w-4 h-4 fill-current" /> Chỉ còn {product.stock} sản phẩm cuối cùng!
                    </p>
                  )}
                </div>
              </div>

              {/* Shipping Countdown */}
              <div className="p-4 bg-muted/50 rounded-2xl border border-border/50 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-primary" />
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-tight italic">Ưu đãi giao hàng</p>
                       <p className="text-xs font-bold">Đặt trong 02:45:18 tới để nhận vào Thứ Tư</p>
                    </div>
                 </div>
                 <div className="px-3 py-1 bg-background rounded-lg border border-border/50">
                    <span className="text-[9px] font-black uppercase italic text-primary">FAST shipping</span>
                 </div>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                {product.description}
              </p>
            </div>

            {/* Variants */}
            <div className="space-y-10 py-10 border-y border-border/50">
              {product.variants?.map((group) => (
                <ProductVariantSelector
                  key={group.type}
                  type={group.type}
                  options={group.options}
                  selectedId={selectedVariants[group.type]}
                  onSelect={(v) => handleVariantSelect(group.type, v)}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-16 rounded-[32px] bg-foreground hover:bg-foreground/90 text-background font-black text-sm uppercase tracking-widest">
                  THÊM GIỎ HÀNG
                </Button>
                <Button className="h-16 rounded-[32px] bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest">
                  MUA NGAY
                </Button>
              </div>
              <div className="flex items-center justify-between px-4">
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                  <Heart className="h-4 w-4" />
                  THÊM YÊU THÍCH
                </button>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                  <Share2 className="h-4 w-4" />
                  CHIA SẺ
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <div className="flex items-start gap-4 p-4 rounded-3xl border border-border/50 bg-surface-default hover:bg-surface-elevated transition-colors group">
                 <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                    <Truck className="w-5 h-5" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-tight italic">Giao hàng dự kiến</p>
                    <p className="text-xs font-bold">Giao trong 2-3 ngày làm việc</p>
                    <p className="text-[10px] text-muted-foreground font-medium italic">Miễn phí cho đơn từ 500k</p>
                 </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-3xl border border-border/50 bg-surface-default hover:bg-surface-elevated transition-colors group">
                 <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <RotateCcw className="w-5 h-5 text-rose-500" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-tight italic">Chính sách đổi trả</p>
                    <p className="text-xs font-bold">7 ngày đổi trả dễ dàng</p>
                    <p className="text-[10px] text-muted-foreground font-medium italic">Nếu có lỗi từ nhà sản xuất</p>
                 </div>
              </div>
            </div>

            {/* Frequently Bought Together (Combo) */}
            <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 space-y-6">
               <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-tight italic text-primary">Mua cùng để nhận ưu đãi</h3>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                     <div className="size-20 rounded-2xl border border-border/50 bg-background overflow-hidden relative group cursor-pointer">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover p-2" />
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Check className="w-5 h-5 text-primary" />
                        </div>
                     </div>
                     <span className="text-xl font-black text-muted-foreground">+</span>
                     <div className="size-20 rounded-2xl border border-border/50 bg-background overflow-hidden relative group cursor-pointer">
                        <img src="https://images.unsplash.com/photo-1596462502278-27bfad8f63ef?q=80&w=200&auto=format&fit=crop" alt="Complementary" className="w-full h-full object-cover p-2" />
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Check className="w-5 h-5 text-primary" />
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex-1 text-right">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Giá gói combo</p>
                     <p className="text-2xl font-black text-primary">{(activePrice + 120000).toLocaleString('vi-VN')} ₫</p>
                     <p className="text-[10px] font-bold text-emerald-600 uppercase">Tiết kiệm 25.000 ₫</p>
                  </div>
               </div>
               
               <Button className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest italic group">
                  MUA CẢ COMBO <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </Button>
            </div>

            <div className="p-6 rounded-[32px] bg-muted/30 border border-dashed border-border/50 space-y-4">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <p className="text-xs font-black uppercase tracking-tight italic">Cam kết từ Hai Tụi Mình</p>
               </div>
               <p className="text-[11px] text-muted-foreground leading-relaxed font-medium capitalize">
                  Sản phẩm chính hãng 100% • kiểm tra trước khi thanh toán • bảo hành uy tín • hỗ trợ đổi trả tận tâm.
               </p>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mt-32 space-y-12">
          <div className="flex border-b border-border/50 gap-12 overflow-x-auto pb-px">
            {[
              { id: 'desc', label: 'CHI TIẾT SẢN PHẨM' },
              { id: 'specs', label: 'THÔNG SỐ KỸ THUẬT' },
              { id: 'reviews', label: `ĐÁNH GIÁ (${product.reviewCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "relative py-6 text-[11px] font-black uppercase tracking-widest transition-colors whitespace-nowrap",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'desc' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl space-y-8"
              >
                <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                  <p className="text-xl font-medium text-foreground mb-8">
                    {product.longDescription}
                  </p>
                  <div className="grid md:grid-cols-2 gap-12 mt-12">
                     <div className="space-y-6">
                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Đặc điểm nổi bật</h3>
                        <ul className="space-y-4">
                           {product.features?.map((f, i) => (
                              <li key={i} className="flex items-start gap-3">
                                 <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-primary" />
                                 </div>
                                 <span className="text-sm font-medium">{f}</span>
                              </li>
                           ))}
                        </ul>
                     </div>
                     <div className="bg-muted rounded-[32px] p-8 aspect-square relative overflow-hidden">
                        <img src={product.image} alt="Feature" className="absolute inset-0 h-full w-full object-contain p-12 mix-blend-multiply dark:mix-blend-lighten opacity-80" />
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'specs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
              >
                <div className="rounded-[32px] border border-border/50 overflow-hidden bg-surface-default shadow-sm">
                  {product.specifications.map((spec, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex justify-between p-6 border-b border-border/50 last:border-none",
                        idx % 2 === 1 && "bg-muted/30"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{spec.label}</span>
                      <span className="text-xs font-black text-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="flex flex-col md:flex-row items-center gap-12 bg-surface-default p-10 rounded-[32px] border border-border/50 shadow-sm">
                   <div className="text-center md:text-left">
                      <p className="text-6xl font-black text-primary tracking-tighter mb-2">{product.rating}</p>
                      <div className="flex justify-center md:justify-start gap-1 mb-4">
                         {[1,2,3,4,5].map(i => (
                            <Star key={i} className={cn("h-4 w-4", i <= Math.floor(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/30")} />
                         ))}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">DỰA TRÊN {product.reviewCount} ĐÁNH GIÁ</p>
                   </div>
                   <div className="flex-1 space-y-4 w-full">
                      {[5,4,3,2,1].map(star => (
                         <div key={star} className="flex items-center gap-4">
                            <span className="text-[10px] font-black w-4">{star}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: star === 5 ? '80%' : star === 4 ? '15%' : '2%' }} />
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-8">
                  {product.reviews.map((review) => (
                    <div key={review.id} className="p-8 bg-surface-default rounded-[32px] border border-border/50 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-black uppercase tracking-tight">{review.user}</p>
                          <div className="flex items-center gap-4">
                             <div className="flex gap-0.5">
                               {[1,2,3,4,5].map(i => (
                                 <Star key={i} className={cn("h-3 w-3", i <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30")} />
                               ))}
                             </div>
                             <span className="text-[9px] font-bold text-muted-foreground">{review.date}</span>
                          </div>
                        </div>
                        {review.isVerified && (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 rounded-full">
                            <ShieldCheck className="h-3 w-3" />
                            <span className="text-[8px] font-black uppercase">ĐÃ XÁC MINH</span>
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <section className="mt-40 space-y-12">
           <div className="flex items-end justify-between px-2">
              <h2 className="text-4xl md:text-6xl font-black font-heading tracking-tighter uppercase leading-[0.85]">
                 CÓ THỂ BẠN <br />
                 <span className="text-primary italic">CŨNG THÍCH</span>
              </h2>
              <Button variant="ghost" className="hidden md:flex font-black text-xs tracking-widest uppercase items-center gap-2">
                 XEM TẤT CẢ <ChevronRight className="h-4 w-4" />
              </Button>
           </div>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                 <ProductCard key={i} product={{ ...product, id: `rel-${i}`, name: `${product.name} v${i}` }} />
              ))}
           </div>
        </section>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mt-40 space-y-12 pb-20">
            <div className="flex items-end justify-between px-2">
              <h2 className="text-4xl md:text-6xl font-black font-heading tracking-tighter uppercase leading-[0.85]">
                 SẢN PHẨM <br />
                 <span className="text-primary italic">VỪA XEM</span>
              </h2>
            </div>
            
            <div className="flex overflow-x-auto gap-6 -mx-4 px-4 pb-8 scrollbar-hide md:grid md:grid-cols-4 md:mx-0 md:px-0">
               {recentlyViewed.map((p) => (
                  <div key={p.id} className="min-w-[280px] md:min-w-0">
                    <ProductCard product={p} />
                  </div>
               ))}
            </div>
          </section>
        )}
      </div>

      <ProductStickyCTA
        isVisible={isStickyVisible}
        name={product.name}
        price={activePrice}
        onAddToCart={() => {}}
        onBuyNow={() => {}}
      />
      
      {/* Social Proof Notification */}
       <AnimatePresence>
         {recentBuyer && (
           <motion.div
             initial={{ x: -100, opacity: 0 }}
             animate={{ x: 20, opacity: 1 }}
             exit={{ x: -100, opacity: 0 }}
             className="fixed bottom-24 left-0 z-50 p-4"
           >
             <div className="bg-background/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-3 flex items-center gap-3 pr-6">
               <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                 <ShoppingBag className="w-5 h-5 text-primary" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-tight italic">Khách hàng vừa mua</p>
                 <p className="text-xs font-bold">{recentBuyer.name}</p>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};
