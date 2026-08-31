import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, BadgeCheck, Flame, RotateCcw, ShieldCheck, Timer, Truck, Zap } from 'lucide-react';
import { ProductGrid } from '@/src/widgets/product-grid';
import { Product } from '@/src/entities/product/model/types';
import { getProductUrl } from '@/src/entities/product/lib/product-url';
import { productService } from '@/src/entities/product/api/product-service';
import { cn } from '@/src/shared/lib/utils';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
    slug: 'kem-duong-phuc-hoi-b5',
    name: 'Kem dưỡng phục hồi B5',
    price: 450000,
    oldPrice: 650000,
    description: 'Làm dịu và phục hồi da nhạy cảm, cấp ẩm sâu suốt 24h.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
    category: 'Mỹ phẩm',
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
    description: 'Âm thanh đa hướng mạnh mẽ trong thiết kế biểu tượng.',
    image: 'https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=800&auto=format&fit=crop',
    category: 'Công nghệ',
    stock: 2,
    soldCount: 450,
  } as any,
  {
    id: 'p3',
    slug: 'may-loc-khong-khi-mi-air',
    name: 'Máy lọc không khí Mi Air',
    price: 2990000,
    oldPrice: 3590000,
    description: 'Thiết kế tối giản, lọc HEPA cho không gian trong lành.',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=800&auto=format&fit=crop',
    category: 'Gia dụng',
    isNew: true,
    soldCount: 89,
  } as any,
  {
    id: 'p4',
    slug: 'sua-rua-mat-tao-bot-tra-xanh',
    name: 'Sữa rửa mặt tạo bọt trà xanh',
    price: 280000,
    oldPrice: 390000,
    description: 'Làm sạch nhẹ nhàng, kháng khuẩn và hỗ trợ ngừa mụn.',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop',
    category: 'Mỹ phẩm',
    isNew: true,
    soldCount: 2300,
  } as any,
  {
    id: 'p5',
    slug: 'may-pha-ca-phe-mini-tien-loi',
    name: 'Máy pha cà phê mini tiện lợi',
    price: 1550000,
    oldPrice: 2190000,
    description: 'Thưởng thức cà phê tại nhà chỉ trong 30 giây.',
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?q=80&w=800&auto=format&fit=crop',
    category: 'Gia dụng',
    soldCount: 124,
  } as any,
];

const CATEGORIES = [
  {
    title: 'Mỹ phẩm',
    sub: 'Skincare, làm sạch, chăm sóc cá nhân',
    slug: 'my-pham',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000&auto=format&fit=crop',
  },
  {
    title: 'Công nghệ',
    sub: 'Tai nghe, sạc, phụ kiện, thiết bị thông minh',
    slug: 'cong-nghe',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
  },
  {
    title: 'Gia dụng',
    sub: 'Đồ dùng nhà cửa, tiện ích sinh hoạt',
    slug: 'gia-dung',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop',
  },
  {
    title: 'Hàng mới về',
    sub: 'Lọc nhanh các món đang có sẵn trong kho',
    slug: 'hang-moi',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=1000&auto=format&fit=crop',
  },
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

const formatNum = (value: number) => value.toString().padStart(2, '0');
const formatPrice = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

export const HomePage = () => {
  const [activeDeals, setActiveDeals] = useState<ActiveCampaignResponse[]>([]);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(null));

  useEffect(() => {
    let active = true;
    productService
      .getFilteredProducts({ sortBy: 'popular', limit: 15 })
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch(() => {
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
        const runningCampaigns = campaigns.filter((item: ActiveCampaignResponse) => isCampaignCurrentlyRunning(item.campaign));
        const dealCampaigns = runningCampaigns.filter((item: ActiveCampaignResponse) => ['DEAL', 'FLASH_SALE'].includes(item.campaign.type));
        setActiveDeals(dealCampaigns);
        setActiveDealIndex(0);
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(activeDeal?.campaign.endsAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeDeal?.campaign.endsAt]);

  useEffect(() => {
    if (activeDeals.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveDealIndex((index) => (index + 1) % activeDeals.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [activeDeals.length]);

  const displayProducts = products.length ? products : SAMPLE_PRODUCTS;
  const dealProducts = activeDeal?.products?.length ? activeDeal.products : displayProducts.slice(0, 5);
  const dealLink = activeDeal?.campaign?.slug ? `/${activeDeal.campaign.slug}` : '/flash-sale';
  const showActiveDeal = Boolean(activeDeal && isCampaignCurrentlyRunning(activeDeal.campaign) && (!activeDeal.campaign.endsAt || timeLeft.totalMs > 0));

  return (
    <div className="warm-page">
      <div className="mx-auto max-w-[1500px] space-y-10 px-3 py-4 sm:px-5 md:py-6 lg:space-y-12">
        <section className="relative overflow-hidden rounded-3xl bg-primary text-white shadow-soft">
          <img
            src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=1600&auto=format&fit=crop"
            alt="Sản phẩm nổi bật tại Hai Tụi Mình"
            className="absolute inset-0 h-full w-full object-cover opacity-55"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/20" />
          <div className="relative flex min-h-[360px] max-w-3xl flex-col justify-center gap-5 p-6 sm:min-h-[430px] sm:p-9 lg:p-12">
            <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-primary">
              Deal ngon mỗi ngày
            </span>
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
              Sắm hàng chất, giá dễ chịu.
            </h1>
            <p className="max-w-lg text-base font-semibold leading-7 text-white/88 sm:text-lg">
              Hàng có sẵn, giá rõ, bảo hành minh bạch. Mua nhanh các món công nghệ, mỹ phẩm và gia dụng đang hot.
            </p>
            <div className="pt-1">
              <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg transition-transform hover:scale-[1.02]">
                Mua sắm ngay
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 rounded-3xl border border-border bg-card p-3 shadow-soft md:grid-cols-4">
          {[
            { icon: <ShieldCheck className="h-5 w-5" />, label: 'Chính hãng', sub: 'Nguồn gốc rõ' },
            { icon: <Truck className="h-5 w-5" />, label: 'Giao nhanh', sub: 'Xử lý trong ngày' },
            { icon: <RotateCcw className="h-5 w-5" />, label: 'Đổi trả', sub: 'Theo chính sách' },
            { icon: <BadgeCheck className="h-5 w-5" />, label: 'Bảo hành', sub: 'Tag rõ trên sản phẩm' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-secondary">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">{item.icon}</div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em]">{item.label}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{item.sub}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-primary pb-3">
            <h2 className="market-section-title">Danh mục nổi bật</h2>
            <Link to="/products" className="rounded-full border border-primary/25 bg-card px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-primary hover:bg-primary hover:text-primary-foreground">
              Xem cửa hàng
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                to={`/products?category=${encodeURIComponent(category.slug)}`}
                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:border-primary/35"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={category.image} alt={category.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-1 p-4">
                  <h3 className="text-base font-black text-foreground group-hover:text-primary">{category.title}</h3>
                  <p className="line-clamp-2 text-xs font-semibold leading-5 text-muted-foreground">{category.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {showActiveDeal && activeDeal && (
          <section className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-soft">
            <div className="flex flex-col gap-4 bg-primary p-5 text-white md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-primary">
                  <Flame className="h-4 w-4 fill-accent text-accent" />
                  Săn deal giờ vàng
                </div>
                <h2 className="text-2xl font-black leading-tight text-white md:text-4xl">{activeDeal.campaign.name}</h2>
                {activeDeal.campaign.description ? <p className="max-w-2xl text-sm font-semibold text-white/82">{activeDeal.campaign.description}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-white/80" />
                {[timeLeft.h, timeLeft.m, timeLeft.s].map((item, index) => (
                  <span key={index} className="rounded-xl bg-white px-3 py-2 font-mono text-lg font-black text-primary">
                    {formatNum(item)}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 md:grid-cols-3 lg:grid-cols-5">
              {dealProducts.slice(0, 5).map((product) => (
                <Link key={product.id} to={getProductUrl(product)} className="group rounded-2xl border border-border bg-background p-2 transition-all hover:border-primary/35 hover:bg-secondary">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-card">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                    <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-[10px] font-black text-white">HOT</span>
                  </div>
                  <div className="space-y-1.5 p-2">
                    <h3 className="line-clamp-2 min-h-[2.2rem] text-xs font-black leading-snug group-hover:text-primary">{product.name}</h3>
                    <p className="text-sm font-black text-accent">{formatPrice(product.promotionalPrice || product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="border-t border-border p-4 text-center">
              <Link to={dealLink} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white hover:bg-accent/90">
                Xem tất cả deal <ArrowRight className="h-4 w-4" />
              </Link>
              {activeDeals.length > 1 && (
                <div className="mt-4 flex justify-center gap-2" aria-label="Chọn deal đang hiển thị">
                  {activeDeals.map((deal, index) => (
                    <button
                      key={deal.campaign.id}
                      type="button"
                      onClick={() => setActiveDealIndex(index)}
                      className={cn('h-2.5 rounded-full transition-all', index === activeDealIndex ? 'w-8 bg-primary' : 'w-2.5 bg-muted hover:bg-primary/30')}
                      aria-label={`Chuyển sang deal ${index + 1}`}
                      aria-current={index === activeDealIndex}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <ProductGrid title="Sản phẩm hot tuần này" products={displayProducts} />

        <section className="grid gap-4 md:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-3xl bg-primary p-7 text-white shadow-soft md:p-10">
            <Zap className="mb-6 h-10 w-10 text-white" />
            <h2 className="text-3xl font-black leading-tight text-white md:text-4xl">Giá tốt hơn vì chọn hàng kỹ hơn.</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-white/82 md:text-base">
              Hai Tụi Mình tập trung sản phẩm có nhu cầu thật, so giá với sàn và giữ thông tin bảo hành rõ ngay từ card sản phẩm.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['60-70%', 'Mức giá mục tiêu so với nhiều sàn'],
              ['500K', 'Mốc miễn phí vận chuyển'],
              ['24H', 'Xử lý đơn trong ngày làm việc'],
            ].map(([value, label]) => (
              <div key={value} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <p className="text-3xl font-black text-accent">{value}</p>
                <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
