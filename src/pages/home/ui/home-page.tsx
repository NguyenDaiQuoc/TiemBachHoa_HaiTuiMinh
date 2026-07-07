import { ProductGrid } from '@/src/widgets/product-grid';
import { Product } from '@/src/entities/product/model/types';
import { getProductUrl } from '@/src/entities/product/lib/product-url';
import { productService } from '@/src/entities/product/api/product-service';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, BadgeCheck, Timer, Zap, Sparkles, Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { useState, useEffect } from 'react';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    slug: 'kem-duong-phuc-hoi-b5',
    name: 'Kem Dưỡng Phục Hồi B5',
    price: 450000,
    oldPrice: 650000,
    description: 'Làm dịu và phục hồi da nhạy cảm, cấp ẩm sâu suốt 24h.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
    category: 'MỸ PHẨM',
    isNew: true,
    stock: 5,
    soldCount: 1242,
    rating: 4.8,
    reviewCount: 156,
  } as any,
  {
    id: 'p2',
    slug: 'loa-bluetooth-marshall-emberton',
    name: 'Loa Bluetooth Marshall Emberton',
    price: 3650000,
    oldPrice: 4200000,
    description: 'Âm thanh đa hướng mạnh mẽ trong thiết kế mang tính biểu tượng.',
    image: 'https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=800&auto=format&fit=crop',
    category: 'CÔNG NGHỆ',
    stock: 2,
    soldCount: 450,
  } as any,
  {
    id: 'p3',
    slug: 'may-loc-khong-khi-mi-air',
    name: 'Máy Lọc Không Khí Mi Air',
    price: 2990000,
    description: 'Thiết kế tối giản, công nghệ lọc HEPA tiên tiến cho ngôi nhà trong lành.',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=800&auto=format&fit=crop',
    category: 'GIA DỤNG',
    isNew: true,
    soldCount: 89,
  } as any,
  {
    id: 'p4',
    slug: 'sua-rua-mat-tao-bot-chiet-xuat-tra-xanh',
    name: 'Sữa Rửa Mặt Tạo Bọt Chiết Xuất Trà Xanh',
    price: 280000,
    description: 'Làm sạch nhẹ nhàng, kháng khuẩn và ngừa mụn hiệu quả.',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop',
    category: 'MỸ PHẨM',
    isNew: true,
    soldCount: 2300,
  } as any,
  {
    id: 'p5',
    slug: 'may-pha-ca-phe-mini-tien-loi',
    name: 'Máy Pha Cà Phê Mini Tiện Lợi',
    price: 1550000,
    description: 'Thưởng thức cà phê chuẩn vị tại nhà chỉ trong 30 giây.',
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?q=80&w=800&auto=format&fit=crop',
    category: 'GIA DỤNG',
    soldCount: 124,
  } as any,
];

const CATEGORIES = [
  {
    id: 'cat-cosmetics',
    title: "Mỹ Phẩm Chính Hãng",
    tag: "SKINCARE & BEAUTY",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200&auto=format&fit=crop",
    preview: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop",
    fallback: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop",
    color: "rose",
    slug: 'my-pham'
  },
  {
    id: 'cat-tech',
    title: "Công Nghệ Thông Minh",
    tag: "GADGETS & TECH",
    image: "https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=1200&auto=format&fit=crop",
    preview: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
    fallback: "https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=800&auto=format&fit=crop",
    color: "blue",
    slug: 'cong-nghe'
  },
  {
    id: 'cat-home',
    title: "Gia Dụng Tiện Ích",
    tag: "SMART HOME",
    image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=1200&auto=format&fit=crop",
    preview: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
    fallback: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=800&auto=format&fit=crop",
    color: "amber",
    slug: 'gia-dung'
  }
];

type ActiveCampaignResponse = {
  campaign: {
    id: string;
    name: string;
    slug: string;
    type: 'FLASH_SALE' | 'DEAL' | 'PROMOTION';
    description?: string | null;
    bannerImage?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
  };
  products: Product[];
};

const getTimeLeft = (endsAt?: string | null) => {
  if (!endsAt) return { h: 0, m: 0, s: 0, totalMs: 0 };
  const totalMs = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
    totalMs,
  };
};

const isCampaignCurrentlyRunning = (campaign?: ActiveCampaignResponse['campaign'] | null) => {
  if (!campaign) return false;
  const now = Date.now();
  const startsAt = campaign.startsAt ? new Date(campaign.startsAt).getTime() : null;
  const endsAt = campaign.endsAt ? new Date(campaign.endsAt).getTime() : null;
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt > now);
};

export const HomePage = () => {
  const [activeCampaigns, setActiveCampaigns] = useState<ActiveCampaignResponse[]>([]);
  const [activeDeals, setActiveDeals] = useState<ActiveCampaignResponse[]>([]);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [isCampaignOverlayOpen, setIsCampaignOverlayOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(null));
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    productService.getFilteredProducts({ sortBy: 'popular', limit: 12 }).then((data) => {
      if (active) setProducts(data);
    }).catch(() => {
      if (active) setProducts([]);
    });

    fetch('/api/campaigns/active?type=DEAL,FLASH_SALE,PROMOTION')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!active) return;
        const campaigns = Array.isArray(payload?.data?.campaigns)
          ? payload.data.campaigns
          : payload?.data?.campaign
            ? [payload.data]
            : [];
        const dealCampaigns = campaigns.filter((item) => ['DEAL', 'FLASH_SALE'].includes(item.campaign.type));
        setActiveCampaigns(campaigns);
        setActiveDeals(dealCampaigns);
        setActiveDealIndex(0);
        setIsCampaignOverlayOpen(true);
        setTimeLeft(getTimeLeft(dealCampaigns[0]?.campaign?.endsAt));
      })
      .catch(() => {
        if (active) setActiveDeals([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeDeal = activeDeals[activeDealIndex] || null;
  const activeOverlayCampaign = activeCampaigns.find((item) => item.campaign.type === 'PROMOTION' && Boolean(item.campaign.bannerImage) && isCampaignCurrentlyRunning(item.campaign)) || null;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(activeDeal?.campaign.endsAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeDeal?.campaign.endsAt]);

  useEffect(() => {
    if (activeDeals.length < 2) return undefined;
    const timer = setInterval(() => {
      setActiveDealIndex((index) => (index + 1) % activeDeals.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [activeDeals.length]);

  useEffect(() => {
    if (!activeOverlayCampaign || !isCampaignOverlayOpen) return undefined;
    const timer = window.setTimeout(() => setIsCampaignOverlayOpen(false), 9000);
    return () => window.clearTimeout(timer);
  }, [activeOverlayCampaign?.campaign.id, isCampaignOverlayOpen]);

  const formatNum = (n: number) => n.toString().padStart(2, '0');
  const displayProducts = products.length ? products : SAMPLE_PRODUCTS;
  const productsByCategory = (categorySlug: string, fallback: Product[]) => {
    const matched = displayProducts.filter((product) => {
      const category = product.category;
      if (typeof category === 'string') return category.toLowerCase().includes(categorySlug);
      return category?.slug === categorySlug || category?.name?.toLowerCase().includes(categorySlug.replace('-', ' '));
    });

    return (matched.length ? matched : fallback).slice(0, 3);
  };
  const dealProducts = activeDeal?.products || [];
  const dealLink = activeDeal?.campaign?.slug ? `/${activeDeal.campaign.slug}` : '/flash-sale';
  const showActiveDeal = Boolean(activeDeal && isCampaignCurrentlyRunning(activeDeal.campaign) && (!activeDeal.campaign.endsAt || timeLeft.totalMs > 0));
  return (
      <div className="warm-page">
      <div className="container mx-auto space-y-20 px-4 py-10 md:py-14">
        <AnimatePresence>
          {activeOverlayCampaign && isCampaignOverlayOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black/70 px-4 py-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/20 bg-background shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => setIsCampaignOverlayOpen(false)}
                  className="absolute right-3 top-3 z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-background/95 text-2xl font-black leading-none text-foreground shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Đóng banner khuyến mãi"
                >
                  ×
                </button>
                <Link to={`/${activeOverlayCampaign.campaign.slug}`} onClick={() => setIsCampaignOverlayOpen(false)} className="block">
                  <img src={activeOverlayCampaign.campaign.bannerImage || ''} alt={activeOverlayCampaign.campaign.name} className="h-auto max-h-[calc(100dvh-2rem)] w-full object-cover" />
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <section className="grid min-h-[calc(100dvh-7rem)] items-center gap-10 py-6 md:grid-cols-[1.02fr_.98fr] md:py-10">
          <div className="max-w-2xl space-y-7 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <span className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-primary">Chính hãng / Giá rõ / Giao nhanh</span>
          <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-7xl">
            Mua đồ đẹp, đồ tiện và đồ công nghệ đáng dùng.
          </h1>
          <p className="max-w-xl text-base font-medium leading-8 text-muted-foreground md:text-lg">
            Hai Tụi Mình chọn lọc mỹ phẩm, gia dụng và gadget có nguồn gốc rõ, bảo hành minh bạch, giá dễ kiểm tra.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link to="/products">
              <button className="w-full rounded-full bg-primary px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-95 sm:w-auto">
                Mua sắm ngay
              </button>
            </Link>
            <Link to="/products">
              <button className="w-full rounded-full border border-border/70 bg-card/90 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-foreground transition-all hover:border-primary/40 hover:bg-muted/60 sm:w-auto">
                Xem danh mục
              </button>
            </Link>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3 pt-3">
            {[
              ['500K+', 'Miễn phí vận chuyển'],
              ['24H', 'Xử lý đơn nhanh'],
              ['1 đổi 1', 'Theo chính sách'],
            ].map(([value, label]) => (
              <div key={value} className="rounded-2xl border border-border/60 bg-card/100 p-4 shadow-soft">
                <p className="text-lg font-black text-accent">{value}</p>
                <p className="mt-1 text-[11px] font-bold leading-5 text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          </div>
          <div className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-soft md:min-h-[560px]">
            <img
              src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1400&auto=format&fit=crop"
              alt="Sản phẩm chọn lọc tại Hai Tụi Mình"
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/100">Bộ chọn lọc tuần này</p>
              <h2 className="mt-3 max-w-md text-2xl font-black leading-tight md:text-4xl">Mỹ phẩm, đồ gia dụng và gadget có sẵn trong kho.</h2>
            </div>
          </div>
        </section>

        {/* Trust Row */}
        <section className="grid grid-cols-2 gap-4 rounded-[28px] border border-border/60 bg-card/90 p-4 shadow-soft md:grid-cols-4 md:p-6">
          {[
            { icon: <ShieldCheck className="w-5 h-5" />, label: "Chính Hãng 100%", sub: "Cam kết nguồn gốc" },
            { icon: <Truck className="w-5 h-5" />, label: "Giao Hàng Nhanh", sub: "Xử lý trong 24h" },
            { icon: <RotateCcw className="w-5 h-5" />, label: "Đổi Trả Dễ Dàng", sub: "Trong vòng 7 ngày" },
            { icon: <BadgeCheck className="w-5 h-5" />, label: "Bảo Hành Tận Tâm", sub: "Hỗ trợ 24/7" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition-colors hover:bg-muted/50 md:flex-row md:items-start md:text-left">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                {item.icon}
              </div>
              <div className="space-y-0.5">
                <p className="font-black uppercase text-[11px] tracking-tight">{item.label}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{item.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Flash Sale */}
        {showActiveDeal && activeDeal && (
        <section className="group relative overflow-hidden rounded-[32px] border border-primary/15 bg-card p-7 text-foreground shadow-soft md:p-12">
          <div className="absolute right-0 top-0 -mr-48 -mt-48 h-96 w-96 bg-primary/12 blur-[100px] transition-colors duration-1000 group-hover:bg-primary/18" />
          
          <motion.div
            key={activeDeal.campaign.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative z-10 flex flex-col lg:flex-row gap-12 items-center"
          >
            <div className="flex-1 space-y-8 w-full">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full w-fit">
                  <Zap className="w-4 h-4 fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Deal giờ vàng</span>
                </div>
                <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-foreground md:text-5xl">
                  {activeDeal.campaign.name}<br/><span className="text-primary">Săn Deal Giờ Vàng</span>
                </h2>
                {activeDeal.campaign.description && (
                  <p className="max-w-xl text-sm font-semibold leading-relaxed text-muted-foreground md:text-base">
                    {activeDeal.campaign.description}
                  </p>
                )}
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex items-center gap-2 font-mono text-2xl md:text-4xl font-black italic">
                    <span className="rounded-xl bg-primary/10 px-3 py-1 text-foreground backdrop-blur-md">{formatNum(timeLeft.h)}</span>
                    <span className="text-primary">:</span>
                    <span className="rounded-xl bg-primary/10 px-3 py-1 text-foreground backdrop-blur-md">{formatNum(timeLeft.m)}</span>
                    <span className="text-primary">:</span>
                    <span className="rounded-xl bg-primary/10 px-3 py-1 text-foreground backdrop-blur-md">{formatNum(timeLeft.s)}</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Kết thúc sau
                  </div>
                </div>
              </div>
              
              <div className="space-y-5">
                <Link to={dealLink} className="inline-block">
                  <button className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                    Xem tất cả Deal <ArrowRight className="inline-block ml-2 w-5 h-5" />
                  </button>
                </Link>
                {activeDeals.length > 1 && (
                  <div className="flex items-center gap-2" aria-label="Chọn deal đang hiển thị">
                    {activeDeals.map((deal, index) => (
                      <button
                        key={deal.campaign.id}
                        type="button"
                        onClick={() => setActiveDealIndex(index)}
                        className={cn(
                          'h-2.5 rounded-full transition-all',
                          index === activeDealIndex ? 'w-8 bg-primary' : 'w-2.5 bg-muted hover:bg-primary/30'
                        )}
                        aria-label={`Chuyển sang deal ${index + 1}`}
                        aria-current={index === activeDealIndex}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {dealProducts.length > 0 && (
            <div className="flex-1 w-full grid grid-cols-2 gap-4">
              {dealProducts.slice(0, 2).map((product, i) => (
                <Link key={product.id || i} to={getProductUrl(product)} className="block group/item">
                  <div className="space-y-4 rounded-3xl border border-border/60 bg-background p-4 shadow-sm transition-all hover:border-primary/25 hover:bg-surface-default">
                    <div className="aspect-square rounded-2xl overflow-hidden relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700" />
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-lg italic">
                        -50%
                      </div>
                    </div>
                    <div className="space-y-1 text-foreground">
                      <h3 className="text-xs font-black uppercase tracking-tight line-clamp-1 group-hover/item:text-primary transition-colors">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-primary">{(product.promotionalPrice || product.price / 2).toLocaleString('vi-VN')} đ</span>
                        <span className="text-[10px] font-bold text-muted-foreground line-through">{product.price.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            )}
          </motion.div>
        </section>
        )}
        <section className="relative space-y-10">
          <div className="flex items-end justify-between px-2">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Lựa chọn tinh tuyển</span>
              <h2 className="text-3xl font-black tracking-tight">Danh mục nổi bật</h2>
            </div>
            <Link to="/products" className="text-xs font-black uppercase tracking-widest text-primary hover:underline underline-offset-4 flex items-center gap-2 group">
              Xem tất cả <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="relative group/categories">
             {/* Background Immersive Plane */}
             <AnimatePresence mode="popLayout">
                {hoveredCategory && (
                   <motion.div
                      key={hoveredCategory}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-x-0 -inset-y-12 rounded-[3.5rem] overflow-hidden hidden lg:block"
                   >
                      <div className="absolute inset-0 bg-black/40 z-10" />
                      <img 
                         src={CATEGORIES.find(c => c.id === hoveredCategory)?.image} 
                         alt="Category Background" 
                         className="w-full h-full object-cover blur-sm opacity-60"
                      />
                   </motion.div>
                )}
             </AnimatePresence>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-20">
               {CATEGORIES.map((col) => (
                  <Link key={col.id} to={`/products?category=${encodeURIComponent(col.slug)}`} className="block">
                  <motion.div
                   whileHover={{ y: -10 }}
                   onMouseEnter={() => setHoveredCategory(col.id)}
                   onMouseLeave={() => setHoveredCategory(null)}
                   onFocus={() => setHoveredCategory(col.id)}
                   onBlur={() => setHoveredCategory(null)}
                   tabIndex={0}
                   className={cn(
                     "group cursor-pointer overflow-hidden rounded-[28px] border border-border/60 bg-card/100 shadow-soft outline-none backdrop-blur-xl transition-all hover:border-primary/25 hover:shadow-2xl hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-primary",
                     hoveredCategory && hoveredCategory !== col.id ? "opacity-40 grayscale-[0.5]" : "opacity-100"
                   )}
                 >
                   <div className="aspect-[4/5] overflow-hidden relative">
                     <img
                       src={col.preview}
                       alt={col.title}
                       referrerPolicy="no-referrer"
                       onError={(event) => {
                         event.currentTarget.src = col.fallback;
                       }}
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                     />
                     <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        <div className="size-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                           <ArrowRight className="w-5 h-5 -rotate-45" />
                        </div>
                     </div>
                   </div>
                   <div className="p-8 space-y-4">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{col.tag}</span>
                        <TrendingUp className="size-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                     <h3 className="text-xl font-black leading-tight tracking-tight transition-colors group-hover:text-primary">{col.title}</h3>
                   </div>
                  </motion.div>
                  </Link>
                ))}
             </div>
          </div>
        </section>

        <ProductGrid title="Sản phẩm hot tuần này" products={displayProducts} />
        
        {/* Bestseller Ranking */}
        <section className="space-y-12">
          <div className="flex items-end justify-between px-2">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Thứ hạng thực tế</span>
              <h2 className="text-3xl font-black tracking-tight">Bảng xếp hạng bán chạy</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { category: "MỸ PHẨM", items: productsByCategory('my-pham', SAMPLE_PRODUCTS.slice(0, 3)) },
              { category: "CÔNG NGHỆ", items: productsByCategory('cong-nghe', [SAMPLE_PRODUCTS[2], SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[4]]) },
              { category: "GIA DỤNG", items: productsByCategory('gia-dung', [SAMPLE_PRODUCTS[1], SAMPLE_PRODUCTS[4], SAMPLE_PRODUCTS[2]]) },
            ].map((rank, i) => (
              <div key={i} className="rounded-[28px] border border-border/60 bg-card/100 p-6 shadow-soft transition-colors hover:bg-surface-default md:p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-8 pb-4 border-b border-primary/10">{rank.category}</h3>
                <div className="space-y-6">
                  {rank.items.map((item, idx) => (
                    <Link key={idx} to={getProductUrl(item)} className="flex items-center gap-4 group/rank">
                      <span className="text-4xl font-black italic text-muted-foreground/20 group-hover/rank:text-primary/40 transition-colors w-12 tracking-tighter">0{idx + 1}</span>
                      <div className="size-16 rounded-2xl overflow-hidden flex-shrink-0 bg-muted">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover/rank:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs font-black uppercase tracking-tight line-clamp-1 group-hover/rank:text-primary transition-colors text-foreground">{item.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground italic uppercase">Đã bán {Number(item.soldCount ?? 0).toLocaleString('vi-VN')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        
        <section className="flex flex-col items-center gap-12 rounded-[32px] border border-primary/15 bg-primary/10 p-8 md:flex-row md:p-14">
          <div className="flex-1 space-y-6">
            <h2 className="text-4xl font-black leading-tight tracking-tight">Chất lượng thật,<br/>giá trị thật.</h2>
            <p className="text-muted-foreground text-lg font-medium">
              "Tại Tiệm Bách Hoá Hai Tụi Mình, chúng mình cam kết mọi sản phẩm đều được kiểm tra kỹ lưỡng về nguồn gốc. Chúng mình không chỉ bán hàng, chúng mình trao gửi sự tin cậy."
            </p>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-black italic text-primary">TM</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">Tiệm Bách Hoá Hai Tụi Mình</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black">Chính hãng • Hiện đại • Tận tâm</p>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full aspect-video md:aspect-square rounded-[48px] overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop" 
              alt="Brand Story"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </section>

        {/* Seasonal Promo */}
        <section className="group relative h-[400px] overflow-hidden rounded-[32px] md:h-[500px]">
          <img 
            src="https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?q=80&w=1954&auto=format&fit=crop" 
            alt="Promotion" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/100 via-black/40 to-transparent" />
          <div className="absolute inset-0 p-8 md:p-20 flex flex-col justify-center space-y-6">
            <span className="text-primary font-black uppercase tracking-[0.4em] text-xs">Phụ nữ là để yêu thương</span>
            <h2 className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.85]">
              Mùa Yêu <br />
              <span className="text-primary">Ưu đãi đến 40%</span>
            </h2>
            <p className="text-white/60 max-w-md font-medium text-lg leading-relaxed">
              Dành riêng cho những đóa hồng rạng rỡ nhất. Miễn phí vận chuyển và quà tặng kèm mọi đơn hàng mỹ phẩm.
            </p>
            <Link to="/products?category=my-pham" className="inline-block pt-4">
              <button className="rounded-full bg-white px-10 py-5 font-black uppercase tracking-widest text-black transition-all hover:scale-105 hover:bg-primary hover:text-white">
                Săn deal ngay
              </button>
            </Link>
          </div>
        </section>
      </div>
      </div>
  );
};
