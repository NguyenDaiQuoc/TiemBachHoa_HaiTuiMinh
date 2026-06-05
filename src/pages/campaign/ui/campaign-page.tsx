import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Loader2, PackageSearch, ShoppingBag, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductCard } from '@/src/entities/product/ui/product-card';
import { useCampaign } from '@/src/entities/marketing/api/campaign-api';
import { cn } from '@/src/shared/lib/utils';

const typeLabels: Record<string, string> = {
  FLASH_SALE: 'Flash sale',
  DEAL: 'Deal nổi bật',
  PROMOTION: 'Khuyến mãi',
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const CampaignNotFound = ({ message }: { message?: string }) => (
  <div className="bg-background px-4 py-16">
    <div className="container mx-auto max-w-3xl rounded-lg border border-border bg-card p-8 text-center shadow-soft md:p-12">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-background text-primary">
        <PackageSearch className="h-8 w-8" />
      </div>
      <p className="mb-3 text-sm font-bold uppercase text-primary">Không tìm thấy chiến dịch</p>
      <h1 className="mb-4 text-3xl font-black text-foreground md:text-4xl">Link này chưa có chiến dịch đang bật</h1>
      <p className="mx-auto mb-8 max-w-xl text-sm leading-7 text-muted-foreground">
        {message || 'Chiến dịch có thể đã tắt, đổi slug hoặc chưa được lưu trong hệ thống.'}
      </p>
      <Link to="/products" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
        Xem sản phẩm đang bán
      </Link>
    </div>
  </div>
);

export const CampaignPage = () => {
  const { campaignSlug = '' } = useParams();
  const { data, error, isLoading } = useCampaign(campaignSlug);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm font-bold text-foreground shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Đang tải chiến dịch
        </div>
      </div>
    );
  }

  if (error || !data?.campaign) {
    return <CampaignNotFound message={error instanceof Error ? error.message : undefined} />;
  }

  const { campaign, products } = data;
  const startsAt = formatDate(campaign.startsAt);
  const endsAt = formatDate(campaign.endsAt);
  const hasBanner = Boolean(campaign.bannerImage);

  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border bg-card">
        {hasBanner ? (
          <img
            src={campaign.bannerImage || ''}
            alt={campaign.name}
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-card" />
        )}
        <div className={cn('absolute inset-0', hasBanner ? 'bg-[#3c3c3c]/55' : 'bg-transparent')} />

        <div className="container relative mx-auto flex min-h-[460px] max-w-7xl flex-col justify-end px-4 py-10 md:min-h-[560px] md:py-14">
          <Link to="/products" className="mb-auto inline-flex w-fit items-center gap-2 rounded-lg bg-background/90 px-4 py-2 text-xs font-bold text-foreground shadow-sm transition-colors hover:bg-background">
            <ArrowLeft className="h-4 w-4" />
            Quay lại cửa hàng
          </Link>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                <Tag className="h-4 w-4" />
                {typeLabels[campaign.type] || 'Chiến dịch'}
              </span>
              {(startsAt || endsAt) && (
                <span className="inline-flex items-center gap-2 rounded-lg bg-background/90 px-4 py-2 text-xs font-bold text-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {[startsAt, endsAt].filter(Boolean).join(' - ')}
                </span>
              )}
            </div>
            <h1 className={cn('text-4xl font-black leading-tight md:text-6xl', hasBanner ? 'text-white' : 'text-foreground')}>
              {campaign.name}
            </h1>
            {campaign.description && (
              <p className={cn('mt-5 max-w-2xl text-base font-medium leading-8 md:text-lg', hasBanner ? 'text-white/90' : 'text-muted-foreground')}>
                {campaign.description}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-bold uppercase text-primary">Sản phẩm trong chiến dịch</p>
            <h2 className="text-2xl font-black text-foreground md:text-3xl">Ưu đãi đang áp dụng</h2>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm">
            <ShoppingBag className="h-4 w-4 text-primary" />
            {products.length} sản phẩm
          </div>
        </div>

        {products.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
            <PackageSearch className="mx-auto mb-5 h-10 w-10 text-primary" />
            <h3 className="mb-3 text-xl font-black text-foreground">Chiến dịch chưa gắn sản phẩm</h3>
            <p className="mx-auto mb-7 max-w-xl text-sm leading-7 text-muted-foreground">
              Campaign đã có trang riêng, nhưng admin chưa chọn sản phẩm hoặc các sản phẩm đã tắt bán.
            </p>
            <Link to="/products" className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
              Xem toàn bộ sản phẩm
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

