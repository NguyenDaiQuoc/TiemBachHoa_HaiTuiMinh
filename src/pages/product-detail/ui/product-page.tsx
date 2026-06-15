import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Eye,
  Flame,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  Package,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Timer,
  Truck,
  Video,
} from 'lucide-react';
import { productService } from '@/src/entities/product/api/product-service';
import { Product, ProductVariant } from '@/src/entities/product/model/types';
import { useRecentlyViewedStore } from '@/src/entities/product/model/recently-viewed-store';
import { ProductGallery } from '@/src/entities/product/ui/product-gallery';
import { ProductVariantSelector } from '@/src/entities/product/ui/product-variant-selector';
import { ProductStickyCTA } from '@/src/entities/product/ui/product-sticky-cta';
import { ProductCard } from '@/src/entities/product/ui/product-card';
import { getWarrantyLabel } from '@/src/entities/product/lib/warranty';
import { useCartStore } from '@/src/entities/cart/model/store';
import {
  CommunityReview,
  CommunityReviewMedia,
  trackProductView,
  useCreateProductReview,
  useProductReviews,
  useProductSocialProof,
  useToggleReviewHelpful,
} from '@/src/entities/community/api/community-api';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { Button } from '@/src/shared/ui/button';
import { cn } from '@/src/shared/lib/utils';
import { toast } from 'sonner';

const REVIEW_SORT_OPTIONS = [
  { id: 'recent', label: 'Mới nhất' },
  { id: 'helpful', label: 'Hữu ích nhất' },
  { id: 'highest', label: 'Điểm cao nhất' },
  { id: 'lowest', label: 'Điểm thấp nhất' },
] as const;

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const getCategoryLabel = (product: Product) => (typeof product.category === 'string' ? product.category : product.category?.name || 'Danh mục');

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const normalizeMediaFiles = async (files: FileList | null): Promise<CommunityReviewMedia[]> => {
  if (!files?.length) return [];
  const normalized = Array.from(files).slice(0, 4);

  return Promise.all(
    normalized.map(async (file) => ({
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: await readFileAsDataUrl(file),
    }))
  );
};

const ReviewCard = ({
  review,
  onHelpful,
  isPending,
}: {
  review: CommunityReview;
  onHelpful: (reviewId: string) => void;
  isPending: boolean;
}) => (
  <article className="space-y-4 rounded-[28px] border border-border/60 bg-card p-6 shadow-soft">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 font-black text-primary">
          {review.user.name.charAt(0)}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black">{review.user.name}</p>
            {review.verifiedPurchase && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                <ShieldCheck className="h-3 w-3" />
                Đã mua hàng
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-0.5 text-primary">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn('h-3.5 w-3.5', index < review.rating ? 'fill-current' : 'text-muted')}
                />
              ))}
            </div>
            <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </div>

    <p className="text-sm leading-relaxed text-foreground">{review.content}</p>

    {review.media.length > 0 && (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {review.media.map((media) => (
          <div key={media.url} className="overflow-hidden rounded-2xl border border-border/50 bg-background">
            {media.type === 'image' ? (
              <img src={media.url} alt="Ảnh đánh giá sản phẩm" className="h-28 w-full object-cover" loading="lazy" />
            ) : (
              <video src={media.url} className="h-28 w-full object-cover" controls preload="metadata" />
            )}
          </div>
        ))}
      </div>
    )}

    {review.sellerResponse && (
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Phản hồi từ cửa hàng</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{review.sellerResponse}</p>
      </div>
    )}

    <div className="flex items-center justify-between gap-4 pt-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => onHelpful(review.id)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors',
          review.isHelpfulByMe
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-border/60 bg-background text-muted-foreground hover:bg-muted'
        )}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        Hữu ích ({review.helpfulCount})
      </button>
    </div>
  </article>
);

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activePrice, setActivePrice] = useState(0);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [reviewSort, setReviewSort] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');
  const [reviewOnlyMedia, setReviewOnlyMedia] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewMedia, setReviewMedia] = useState<CommunityReviewMedia[]>([]);
  const galleryRef = useRef<HTMLDivElement>(null);

  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addProduct);
  const recentlyViewedProducts = useRecentlyViewedStore((state) => state.products);
  const addItem = useCartStore((state) => state.addItem);
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const canonicalProductKey = product?.id || id || '';

  const socialProofQuery = useProductSocialProof(canonicalProductKey);
  const reviewsQuery = useProductReviews(canonicalProductKey, { sort: reviewSort, withMedia: reviewOnlyMedia });
  const createReviewMutation = useCreateProductReview(canonicalProductKey);
  const helpfulMutation = useToggleReviewHelpful(canonicalProductKey);

  const reviewsSummary = reviewsQuery.data?.summary;
  const communityReviews = reviewsQuery.data?.reviews || [];

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    productService.getProductById(id).then((data) => {
      if (data) {
        setProduct(data);
        if (data.slug && id !== data.slug) {
          navigate(`/product/${encodeURIComponent(data.slug)}`, { replace: true });
        }
        setActivePrice(data.price);
        addRecentlyViewed(data);

        const initialVariants: Record<string, string> = {};
        data.variants?.forEach((group) => {
          initialVariants[group.type] = group.options[0]?.id;
        });
        setSelectedVariants(initialVariants);
      }

      setIsLoading(false);
    });
  }, [id, addRecentlyViewed, navigate]);

  useEffect(() => {
    if (!product?.id) return;
    trackProductView(product.id).catch(() => undefined);
  }, [product?.id]);

  useEffect(() => {
    const handleScroll = () => {
      if (!galleryRef.current) return;
      setIsStickyVisible(galleryRef.current.getBoundingClientRect().bottom < 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const recentlyViewed = useMemo(() => recentlyViewedProducts.filter((entry) => entry.id !== product?.id), [product?.id, recentlyViewedProducts]);

  const relatedProducts = useMemo(
    () => Array.from({ length: 4 }).map((_, index) => ({ ...product, id: `rel-${index}` })).filter(Boolean) as Product[],
    [product]
  );

  const handleVariantSelect = (type: string, variant: ProductVariant) => {
    setSelectedVariants((prev) => ({ ...prev, [type]: variant.id }));
    if (product) {
      setActivePrice(variant.promotionalPrice || variant.price || product.price);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ ...product, price: activePrice });
    toast.success('Đã thêm sản phẩm vào giỏ hàng');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleUploadMedia = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const nextMedia = await normalizeMediaFiles(event.target.files);
      setReviewMedia(nextMedia);
    } catch {
      toast.error('Không thể xử lý tệp đã chọn');
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đánh dấu hữu ích');
      return;
    }

    try {
      await helpfulMutation.mutateAsync(reviewId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật tương tác');
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để gửi đánh giá');
      return;
    }

    if (reviewContent.trim().length < 10) {
      toast.error('Nội dung đánh giá cần từ 10 ký tự trở lên');
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        rating: reviewRating,
        content: reviewContent.trim(),
        media: reviewMedia,
      });
      setReviewContent('');
      setReviewMedia([]);
      setReviewRating(5);
      toast.success('Gửi đánh giá thành công');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi đánh giá');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <h2 className="mb-4 text-4xl font-black uppercase tracking-tight">Không tìm thấy sản phẩm</h2>
        <Button onClick={() => navigate('/')} className="rounded-2xl">
          Quay lại cửa hàng
        </Button>
      </div>
    );
  }

  const warrantyLabel = getWarrantyLabel(product.tags);

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-14">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div ref={galleryRef} className="lg:col-span-7">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          <div className="space-y-8 lg:col-span-5">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  Chính hãng
                </span>
                <span className="rounded-full bg-card px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {getCategoryLabel(product)}
                </span>
                {warrantyLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Bảo hành {warrantyLabel}
                  </span>
                )}
                {product.isNew && <BadgeCheck className="h-5 w-5 text-primary" />}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Chuyên hàng chính hãng</p>
                <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-5xl">{product.name}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  <Star className="h-3 w-3 fill-current" />
                  {reviewsSummary?.average || product.rating || 0} ({reviewsSummary?.total || product.reviewCount || 0} đánh giá)
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {socialProofQuery.data?.viewersNow || 0} người đang xem
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Đã bán {product.soldCount >= 1000 ? `${(product.soldCount / 1000).toFixed(1)}k` : product.soldCount}
                </span>
              </div>
            </div>

            <div className="space-y-3 rounded-[28px] border border-border/60 bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-end gap-4">
                <span className="text-4xl font-black text-primary md:text-5xl">{formatCurrency(activePrice)}</span>
                {product.oldPrice && <span className="text-lg text-muted-foreground line-through">{formatCurrency(product.oldPrice)}</span>}
                {product.oldPrice && (
                  <span className="rounded-full bg-destructive/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-destructive">
                    -{Math.round((1 - activePrice / product.oldPrice) * 100)}%
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Miễn phí vận chuyển cho đơn từ 500.000đ
                </p>
                {product.stock <= 10 && (
                  <p className="inline-flex items-center gap-2 font-black text-destructive">
                    <Flame className="h-4 w-4" />
                    Chỉ còn {product.stock} sản phẩm
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <Timer className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Tốc độ đơn hàng</p>
                    <p className="mt-2 text-sm font-bold">
                      {socialProofQuery.data?.soldLastHour || 0} sản phẩm bán trong giờ qua
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <Truck className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Tín hiệu gần đây</p>
                    <p className="mt-2 text-sm font-bold">
                      {socialProofQuery.data?.latestPurchaseCity
                        ? `Vừa có đơn từ ${socialProofQuery.data.latestPurchaseCity}`
                        : 'Đang cập nhật tín hiệu mua hàng gần đây'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-border/60 bg-card p-6 shadow-soft">
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              {socialProofQuery.data?.trustSignals?.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {socialProofQuery.data.trustSignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-border/60 bg-background px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {product.variants?.length ? (
              <div className="space-y-8 border-y border-border/50 py-8">
                {product.variants.map((group) => (
                  <ProductVariantSelector
                    key={group.type}
                    type={group.type}
                    options={group.options}
                    selectedId={selectedVariants[group.type]}
                    onSelect={(variant) => handleVariantSelect(group.type, variant)}
                  />
                ))}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="h-14 rounded-[28px] bg-foreground text-sm font-black uppercase tracking-widest text-background hover:bg-foreground/90"
                >
                  Thêm giỏ hàng
                </Button>
                <Button
                  onClick={handleBuyNow}
                  className="h-14 rounded-[28px] text-sm font-black uppercase tracking-widest"
                >
                  Mua ngay
                </Button>
              </div>
              <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <button type="button" className="inline-flex items-center gap-2 transition-colors hover:text-primary">
                  <Heart className="h-4 w-4" />
                  Yêu thích
                </button>
                <button type="button" className="inline-flex items-center gap-2 transition-colors hover:text-primary">
                  <Share2 className="h-4 w-4" />
                  Chia sẻ
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <Truck className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Giao hàng dự kiến</p>
                    <p className="mt-2 text-sm font-bold">Giao trong 2-3 ngày làm việc</p>
                    <p className="mt-1 text-xs text-muted-foreground">Miễn phí cho đơn từ 500.000đ</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-border/60 bg-card p-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Đổi trả & bảo đảm</p>
                    <p className="mt-2 text-sm font-bold">7 ngày đổi trả nếu lỗi từ nhà sản xuất</p>
                    <p className="mt-1 text-xs text-muted-foreground">Hỗ trợ tận tâm từ cửa hàng</p>
                  </div>
                </div>
              </div>
            </div>

            {false && (
            <div className="rounded-[32px] border border-primary/15 bg-primary/5 p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Mua cùng để nhận ưu đãi</h3>
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <img src={product.image} alt={product.name} className="h-20 w-20 object-cover" />
                </div>
                <span className="text-xl font-black text-muted-foreground">+</span>
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <img
                    src={product.images[1] || product.image}
                    alt={`${product.name} gợi ý mua cùng`}
                    className="h-20 w-20 object-cover"
                  />
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Combo gợi ý</p>
                  <p className="mt-1 text-2xl font-black text-primary">{formatCurrency(activePrice + 120000)}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">Tiết kiệm 25.000đ</p>
                </div>
              </div>
              <Button className="mt-5 h-12 w-full rounded-2xl text-xs font-black uppercase tracking-widest">
                Mua cả combo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            )}
          </div>
        </div>

        <div className="mt-20 space-y-10">
          <div className="flex gap-8 overflow-x-auto border-b border-border/50 pb-px">
            {[
              { id: 'desc', label: 'Chi tiết sản phẩm' },
              { id: 'specs', label: 'Thông số kỹ thuật' },
              { id: 'reviews', label: `Đánh giá (${reviewsSummary?.total || product.reviewCount || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'desc' | 'specs' | 'reviews')}
                className={cn(
                  'relative whitespace-nowrap py-5 text-[11px] font-black uppercase tracking-widest transition-colors',
                  activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {activeTab === tab.id && <motion.div layoutId="product-tab" className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-primary" />}
              </button>
            ))}
          </div>

          {activeTab === 'desc' && (
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              className="grid gap-10 lg:grid-cols-[1fr_360px]"
            >
              <div className="space-y-8">
                <div className="rounded-[32px] border border-border/60 bg-card p-8 shadow-soft">
                  <p className="text-lg leading-relaxed text-foreground">{product.longDescription || product.description}</p>
                </div>
                <div className="rounded-[32px] border border-border/60 bg-card p-8 shadow-soft">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Điểm nổi bật</h3>
                  <ul className="mt-6 space-y-4">
                    {(product.features || []).map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-[32px] border border-border/60 bg-card p-6 shadow-soft">
                <img src={product.image} alt={product.name} className="w-full rounded-[28px] bg-background object-contain p-8" />
              </div>
            </motion.div>
          )}

          {activeTab === 'specs' && (
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-soft"
            >
              {(product.specifications || []).map((spec, index) => (
                <div
                  key={`${spec.label}-${index}`}
                  className={cn(
                    'flex items-center justify-between gap-6 border-b border-border/50 px-6 py-5 last:border-b-0',
                    index % 2 === 1 && 'bg-muted/20'
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{spec.label}</span>
                  <span className="text-sm font-bold text-foreground">{spec.value}</span>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-[32px] border border-border/60 bg-card p-8 shadow-soft">
                  <p className="text-6xl font-black text-primary">{reviewsSummary?.average || 0}</p>
                  <div className="mt-3 flex items-center gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={cn(
                          'h-4 w-4',
                          index < Math.round(reviewsSummary?.average || 0) ? 'fill-current' : 'text-muted'
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {reviewsSummary?.total || 0} đánh giá thực tế
                  </p>

                  <div className="mt-6 space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const total = reviewsSummary?.total || 0;
                      const count = reviewsSummary?.breakdown?.[star] || 0;
                      const width = total ? `${(count / total) * 100}%` : '0%';

                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="w-4 text-xs font-black">{star}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width }} />
                          </div>
                          <span className="w-8 text-right text-xs font-bold text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[32px] border border-border/60 bg-card p-8 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Đánh giá từ khách hàng</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight">Chia sẻ trải nghiệm thật</h3>
                    </div>
                    <Link
                      to="/community"
                      className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Vào cộng đồng
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-background p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Có media</p>
                      <p className="mt-2 text-2xl font-black text-primary">{reviewsSummary?.mediaCount || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-background p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sentiment tích cực</p>
                      <p className="mt-2 text-2xl font-black text-primary">{reviewsSummary?.sentiment?.positive || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-border/60 bg-card p-6 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setReviewSort(option.id)}
                        className={cn(
                          'rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors',
                          reviewSort === option.id
                            ? 'border-primary/30 bg-primary text-primary-foreground'
                            : 'border-border/60 bg-background text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewOnlyMedia((prev) => !prev)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors',
                      reviewOnlyMedia
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted'
                    )}
                  >
                    Chỉ xem có ảnh/video
                  </button>
                </div>
              </div>

              <div className="rounded-[32px] border border-border/60 bg-card p-6 shadow-soft">
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <h3 className="text-lg font-black">Viết đánh giá của bạn</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Bạn có thể chỉ cập nhật đúng phần muốn chia sẻ. Ảnh và video chỉ hiển thị sau khi gửi đánh giá thành công.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const nextRating = index + 1;
                      return (
                        <button
                          key={nextRating}
                          type="button"
                          onClick={() => setReviewRating(nextRating)}
                          className={cn(
                            'rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors',
                            reviewRating >= nextRating
                              ? 'border-primary/30 bg-primary/10 text-primary'
                              : 'border-border/60 bg-background text-muted-foreground hover:bg-muted'
                          )}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Star className={cn('h-3.5 w-3.5', reviewRating >= nextRating && 'fill-current')} />
                            {nextRating} sao
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    value={reviewContent}
                    onChange={(event) => setReviewContent(event.target.value)}
                    rows={5}
                    placeholder="Chia sẻ cảm nhận thực tế về sản phẩm, đóng gói, giao hàng hoặc hiệu quả sử dụng..."
                    className="w-full rounded-[24px] border border-border/60 bg-background px-5 py-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40"
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex cursor-pointer items-center justify-center gap-3 rounded-[24px] border border-dashed border-border/60 bg-background px-5 py-4 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                      <ImagePlus className="h-4 w-4" />
                      Tải ảnh đánh giá
                      <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUploadMedia} />
                    </label>
                    <div className="flex items-center gap-2 rounded-[24px] border border-border/60 bg-background px-5 py-4 text-sm text-muted-foreground">
                      <Video className="h-4 w-4 text-primary" />
                      Tối đa 4 ảnh/video, thân thiện cho di động
                    </div>
                  </div>

                  {reviewMedia.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {reviewMedia.map((media) => (
                        <div key={media.url} className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                          {media.type === 'image' ? (
                            <img src={media.url} alt="Xem trước media đánh giá" className="h-24 w-full object-cover" />
                          ) : (
                            <video src={media.url} className="h-24 w-full object-cover" controls preload="metadata" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      Nội dung tối thiểu 10 ký tự để hệ thống xử lý cảm xúc đánh giá chính xác hơn.
                    </p>
                    <Button
                      onClick={handleSubmitReview}
                      disabled={createReviewMutation.isPending}
                      className="rounded-2xl text-xs font-black uppercase tracking-widest"
                    >
                      {createReviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {reviewsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : communityReviews.length > 0 ? (
                  communityReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onHelpful={handleHelpful}
                      isPending={helpfulMutation.isPending}
                    />
                  ))
                ) : (
                  <div className="rounded-[32px] border border-dashed border-border/60 bg-card px-6 py-14 text-center">
                    <p className="text-lg font-black">Chưa có đánh giá phù hợp với bộ lọc hiện tại.</p>
                    <p className="mt-2 text-sm text-muted-foreground">Hãy thử đổi bộ lọc hoặc trở thành người đánh giá đầu tiên.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <section className="mt-24 space-y-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tight md:text-5xl">
              Có thể bạn <span className="text-primary italic">cũng thích</span>
            </h2>
            <Link
              to="/products"
              className="hidden h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition-colors hover:bg-muted md:inline-flex"
            >
              Xem tất cả
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {relatedProducts.map((entry) => (
              <ProductCard key={entry.id} product={entry} />
            ))}
          </div>
        </section>

        {recentlyViewed.length > 0 && (
          <section className="mt-24 space-y-10 pb-20">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tight md:text-5xl">
                Sản phẩm <span className="text-primary italic">vừa xem</span>
              </h2>
            </div>

            <div className="flex gap-6 overflow-x-auto px-1 pb-4 md:grid md:grid-cols-4 md:overflow-visible">
              {recentlyViewed.map((entry) => (
                <div key={entry.id} className="min-w-[280px] md:min-w-0">
                  <ProductCard product={entry} />
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
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <AnimatePresence>
        {!!socialProofQuery.data?.latestPurchaseCity && (
          <motion.div
            initial={reduceMotion ? undefined : { x: -80, opacity: 0 }}
            animate={reduceMotion ? undefined : { x: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { x: -80, opacity: 0 }}
            className="fixed bottom-24 left-4 z-50 md:left-6"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/90 p-3 shadow-xl backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Mua gần đây</p>
                <p className="text-xs font-bold">Vừa có đơn từ {socialProofQuery.data.latestPurchaseCity}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
