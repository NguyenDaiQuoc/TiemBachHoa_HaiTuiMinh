import { useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Filter, LayoutGrid, List, Loader2, Search as SearchIcon, Star, X } from 'lucide-react';
import { useProducts } from '@/src/entities/product/api/product-api';
import { Product } from '@/src/entities/product/model/types';
import { ProductCard } from '@/src/entities/product/ui/product-card';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';

const CATEGORY_OPTIONS = [
  { label: 'Mỹ phẩm chính hãng', value: 'my-pham' },
  { label: 'Đồ gia dụng', value: 'gia-dung' },
  { label: 'Đồ công nghệ', value: 'cong-nghe' },
];

const RATING_OPTIONS = [
  { label: 'Từ 5 sao', value: 5 },
  { label: 'Từ 4 sao', value: 4 },
  { label: 'Từ 3 sao', value: 3 },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'PHỔ BIẾN' },
  { id: 'newest', label: 'MỚI NHẤT' },
  { id: 'price-asc', label: 'GIÁ THẤP' },
  { id: 'price-desc', label: 'GIÁ CAO' },
] as const;

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isFlashSale = location.pathname === '/flash-sale';
  const isNewArrivals = location.pathname === '/new-arrivals';

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : null;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const sortBy = (searchParams.get('sortBy') as 'popular' | 'newest' | 'price-asc' | 'price-desc') || (isNewArrivals ? 'newest' : 'popular');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading, isFetching } = useProducts({
    query,
    category: category || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    minRating: minRating || undefined,
    sortBy,
    page,
    limit: 12,
  });

  const products = data?.items || [];
  const meta = data?.meta;

  const pageContent = useMemo(() => {
    if (isFlashSale) {
      return {
        eyebrow: 'ƯU ĐÃI GIỚI HẠN',
        title: 'DEAL CHÁY GIỜ VÀNG',
        accent: 'SĂN DEAL CẠNH TRANH',
        description: 'Tổng hợp những sản phẩm chính hãng đang có mức giá tốt nhất hôm nay tại Tiệm bách hoá Hai Tụi Mình.',
      };
    }

    if (isNewArrivals) {
      return {
        eyebrow: 'CẬP NHẬT MỖI NGÀY',
        title: 'HÀNG MỚI CẬP BẾN',
        accent: 'VỪA LÊN KỆ',
        description: 'Khám phá các sản phẩm mới về ở nhóm mỹ phẩm, gia dụng và công nghệ với mức giá cạnh tranh.',
      };
    }

    return {
      eyebrow: query ? 'KẾT QUẢ TÌM KIẾM' : 'KHÁM PHÁ CỬA HÀNG',
      title: query ? `"${query}"` : 'SẢN PHẨM CHÍNH HÃNG',
      accent: query ? `${products.length} KẾT QUẢ` : 'GIÁ TỐT MỖI NGÀY',
      description:
        'Chuyên mỹ phẩm chính hãng, đồ gia dụng tiện ích và đồ công nghệ chất lượng cao. Hiện tại Tiệm chưa kinh doanh thực phẩm.',
    };
  }, [isFlashSale, isNewArrivals, products.length, query]);

  const updateFilters = (updates: Record<string, string | number | null>) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    if (!('page' in updates)) {
      nextParams.set('page', '1');
    }

    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set('q', query);
    if (isNewArrivals) nextParams.set('sortBy', 'newest');
    setSearchParams(nextParams);
  };

  const totalPages = meta?.totalPages || 1;
  const currentCategoryLabel = CATEGORY_OPTIONS.find((option) => option.value === category)?.label;

  return (
    <div className="bg-background font-sans">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-12 rounded-[40px] border border-border/50 bg-card p-8 shadow-soft md:p-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                {pageContent.eyebrow}
              </p>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground md:text-6xl">
                {pageContent.title} <span className="text-primary italic">{pageContent.accent}</span>
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground">
                {pageContent.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {currentCategoryLabel && (
                  <span className="rounded-full bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    {currentCategoryLabel}
                  </span>
                )}
                {minRating && (
                  <span className="rounded-full bg-amber-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-600">
                    Từ {minRating} sao
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(true)}
                className="h-12 rounded-2xl border-2 bg-card px-6 text-xs font-black uppercase tracking-widest lg:hidden"
              >
                <Filter className="mr-2 h-4 w-4" /> Bộ lọc
              </Button>

              <div className="hidden items-center rounded-2xl border border-border/50 bg-card p-1 shadow-sm lg:flex">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={cn(
                    'rounded-xl p-2 transition-all',
                    viewMode === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={cn(
                    'rounded-xl p-2 transition-all',
                    viewMode === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24 space-y-10 rounded-[32px] border border-border/50 bg-card p-6 shadow-soft">
              <div className="space-y-6">
                <h3 className="border-b border-border/50 pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Danh mục
                </h3>
                <div className="space-y-3">
                  {CATEGORY_OPTIONS.map((option) => (
                    <label key={option.value} className="group flex cursor-pointer items-center gap-3">
                      <div
                        role="checkbox"
                        aria-checked={category === option.value}
                        tabIndex={0}
                        onClick={() => updateFilters({ category: category === option.value ? null : option.value })}
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all',
                          category === option.value ? 'border-primary bg-primary' : 'border-border/50 group-hover:border-primary/50'
                        )}
                      >
                        {category === option.value && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-black uppercase tracking-wider transition-colors',
                          category === option.value ? 'text-primary' : 'text-muted-foreground/80'
                        )}
                      >
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="border-b border-border/50 pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Khoảng giá
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-muted-foreground/60">Từ</span>
                    <input
                      type="number"
                      placeholder="100000"
                      defaultValue={minPrice || ''}
                      className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 text-xs font-black outline-none transition-all focus:border-primary/50"
                      onBlur={(event) => updateFilters({ minPrice: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-muted-foreground/60">Đến</span>
                    <input
                      type="number"
                      placeholder="5000000"
                      defaultValue={maxPrice || ''}
                      className="h-10 w-full rounded-xl border border-border/50 bg-background px-3 text-xs font-black outline-none transition-all focus:border-primary/50"
                      onBlur={(event) => updateFilters({ maxPrice: event.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="border-b border-border/50 pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Đánh giá
                </h3>
                <div className="space-y-3">
                  {RATING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFilters({ minRating: minRating === option.value ? null : option.value })}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all',
                        minRating === option.value
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-600'
                          : 'border-border/50 bg-background hover:border-amber-500/30 hover:bg-muted'
                      )}
                    >
                      <span className="text-xs font-black uppercase tracking-wider">{option.label}</span>
                      <span className="flex items-center gap-1 text-[10px] font-black">
                        {Array.from({ length: option.value }).map((_, index) => (
                          <Star key={index} className="h-3 w-3 fill-current" />
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="h-12 w-full rounded-2xl border-2 border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
              >
                Xóa các bộ lọc
              </Button>
            </div>
          </aside>

          <div className="space-y-8 lg:col-span-9">
            <div className="flex items-center justify-between overflow-x-auto rounded-2xl border border-border/50 bg-card p-1.5 shadow-sm no-scrollbar">
              <div className="flex min-w-max items-center gap-1.5">
                <span className="mr-2 border-r border-border/50 px-4 text-[10px] font-black uppercase text-muted-foreground/60">
                  Sắp xếp
                </span>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateFilters({ sortBy: option.id })}
                    className={cn(
                      'rounded-xl px-6 py-2.5 text-[10px] font-black tracking-widest transition-all',
                      sortBy === option.id ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {isFetching && <Loader2 className="mr-4 h-4 w-4 animate-spin text-primary" />}
            </div>

            <div className="flex items-center justify-between px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>
                Hiển thị {products.length} / {meta?.total || products.length} sản phẩm
              </span>
              <span>Trang {meta?.page || 1}</span>
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 gap-6 md:grid-cols-3"
                >
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="aspect-[3/4] rounded-[32px] bg-muted/20 animate-pulse" />
                  ))}
                </motion.div>
              ) : products.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1')}
                >
                  {products.map((product: Product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 rounded-[40px] border border-dashed border-border/50 bg-card py-20 text-center"
                >
                  <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-muted/20">
                    <SearchIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                    Không tìm thấy sản phẩm phù hợp
                  </h3>
                  <p className="mx-auto max-w-md text-muted-foreground/80">
                    Hãy thử thay đổi bộ lọc hoặc dùng từ khóa rộng hơn để tìm mỹ phẩm, đồ gia dụng hay sản phẩm công nghệ phù hợp hơn.
                  </p>
                  <Button onClick={clearAllFilters} className="h-12 rounded-2xl bg-foreground px-8 text-xs font-black uppercase tracking-widest text-background">
                    Đặt lại bộ lọc
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => updateFilters({ page: page - 1 })}
                  className="rounded-2xl"
                >
                  Trang trước
                </Button>
                {Array.from({ length: totalPages }).slice(0, 6).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => updateFilters({ page: pageNumber })}
                      className={cn(
                        'h-11 min-w-11 rounded-2xl border px-4 text-sm font-black transition-all',
                        page === pageNumber
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/50 bg-card text-foreground hover:border-primary/30 hover:bg-muted'
                      )}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => updateFilters({ page: page + 1 })}
                  className="rounded-2xl"
                >
                  Trang sau
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[101] max-h-[85vh] overflow-y-auto rounded-t-[40px] border-t border-border/50 bg-card p-8 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]"
            >
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase text-foreground">Bộ lọc sản phẩm</h3>
                <button onClick={() => setIsFilterOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Theo danh mục</h4>
                  <div className="flex flex-wrap gap-3">
                    {CATEGORY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateFilters({ category: category === option.value ? null : option.value })}
                        className={cn(
                          'rounded-2xl border-2 px-6 py-3 text-[10px] font-black tracking-widest transition-all',
                          category === option.value
                            ? 'border-primary bg-primary text-white'
                            : 'border-border/50 bg-background text-muted-foreground/80'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Đánh giá</h4>
                  <div className="space-y-3">
                    {RATING_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateFilters({ minRating: minRating === option.value ? null : option.value })}
                        className={cn(
                          'flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all',
                          minRating === option.value ? 'border-amber-500/40 bg-amber-500/10 text-amber-600' : 'border-border/50 bg-background'
                        )}
                      >
                        <span className="text-xs font-black uppercase tracking-widest">{option.label}</span>
                        <span className="flex items-center gap-1">
                          {Array.from({ length: option.value }).map((_, index) => (
                            <Star key={index} className="h-3 w-3 fill-current" />
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Khoảng giá</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Từ"
                      defaultValue={minPrice || ''}
                      onBlur={(event) => updateFilters({ minPrice: event.target.value })}
                      className="h-14 rounded-2xl border border-border/50 bg-background px-6 text-sm font-black outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Đến"
                      defaultValue={maxPrice || ''}
                      onBlur={(event) => updateFilters({ maxPrice: event.target.value })}
                      className="h-14 rounded-2xl border border-border/50 bg-background px-6 text-sm font-black outline-none"
                    />
                  </div>
                </div>

                <Button onClick={() => setIsFilterOpen(false)} className="h-16 w-full rounded-3xl bg-foreground text-xs font-black uppercase tracking-widest text-background">
                  Áp dụng bộ lọc
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
