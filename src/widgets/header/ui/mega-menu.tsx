import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, ChevronRight, Clock, Gift, Star, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/shared/lib/utils';

interface MegaMenuProps {
  isOpen: boolean;
  type: 'shop' | 'collections';
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MegaMenu = ({ isOpen, type, onClose, onMouseEnter, onMouseLeave }: MegaMenuProps) => {
  const shopItems = [
    {
      title: 'Mỹ phẩm chính hãng',
      description: 'Skincare, makeup và chăm sóc cơ thể từ các thương hiệu uy tín',
      icon: <Star className="h-5 w-5 text-amber-500" />,
      items: [
        { label: 'Kem chống nắng', subcategory: 'Kem chống nắng' },
        { label: 'Tẩy trang & sữa rửa mặt', subcategory: 'Tẩy trang' },
        { label: 'Serum phục hồi', subcategory: 'Serum phục hồi' },
        { label: 'Kem dưỡng ẩm', subcategory: 'Kem dưỡng ẩm' },
      ],
      color: 'from-amber-500/10 to-amber-500/5',
      accent: 'bg-amber-500',
      category: 'my-pham',
    },
    {
      title: 'CÔNG NGHỆ THÔNG MINH',
      description: 'Phụ kiện công nghệ chính hãng, bền bỉ và đáng tiền',
      icon: <Zap className="h-5 w-5 text-blue-500" />,
      items: [
        { label: 'Sạc nhanh', subcategory: 'Sạc nhanh' },
        { label: 'Tai nghe', subcategory: 'Tai nghe' },
        { label: 'Cáp sạc bền', subcategory: 'Cáp sạc' },
        { label: 'Hub chuyển đổi đa năng', subcategory: 'Hub chuyển đổi' },
      ],
      color: 'from-blue-500/10 to-blue-500/5',
      accent: 'bg-blue-500',
      category: 'cong-nghe',
    },
    {
      title: 'GIA DỤNG TIỆN ÍCH',
      description: 'Đồ gia dụng hiện đại cho nhịp sống gọn gàng và tiện nghi',
      icon: <TrendingUp className="h-5 w-5 text-rose-500" />,
      items: [
        { label: 'Máy lọc không khí', subcategory: 'Máy lọc không khí' },
        { label: 'Máy pha cà phê mini', subcategory: 'Máy pha cà phê' },
        { label: 'Nồi chiên không dầu', subcategory: 'Nồi chiên không dầu' },
        { label: 'Bình giữ nhiệt', subcategory: 'Bình giữ nhiệt' },
      ],
      color: 'from-rose-500/10 to-rose-500/5',
      accent: 'bg-rose-500',
      category: 'gia-dung',
    },
  ];

  const collectionItems = [
    {
      title: 'CÔNG NGHỆ HOT',
      description: 'Những món đồ công nghệ đang được săn đón nhiều nhất',
      image: 'https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=400&h=300&fit=crop',
      tag: 'TRENDING',
      category: 'cong-nghe',
    },
    {
      title: 'MỸ PHẨM BÁN CHẠY',
      description: 'Tuyển tập chăm sóc da chính hãng được mua nhiều tuần này',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&h=300&fit=crop',
      tag: 'AUTHENTIC',
      category: 'my-pham',
    },
    {
      title: 'GIA DỤNG THÔNG MINH',
      description: 'Nâng tầm không gian sống với những món đồ tiện ích',
      image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=400&h=300&fit=crop',
      tag: 'PREMIUM',
      category: 'gia-dung',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 top-16 z-40 bg-black/10 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="fixed left-0 right-0 top-16 z-50 overflow-hidden border-b border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="container mx-auto px-6 py-12">
              {type === 'shop' ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  {shopItems.map((category) => (
                    <div
                      key={category.title}
                      className={cn(
                        'block rounded-[32px] border border-border/50 bg-gradient-to-br p-8 transition-all group hover:border-primary/30',
                        category.color
                      )}
                    >
                      <Link to={`/products?category=${encodeURIComponent(category.category)}`} onClick={onClose} className="block">
                        <div className="mb-6 flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background shadow-lg transition-transform duration-500 group-hover:scale-110">
                            {category.icon}
                          </div>
                          <ArrowUpRight className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>

                        <h3 className="mb-2 text-sm font-black uppercase tracking-tight">{category.title}</h3>
                      </Link>
                      <p className="mb-8 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {category.description}
                      </p>

                      <ul className="space-y-3">
                        {category.items.map((item) => (
                          <li key={item.label}>
                            <Link
                              to={`/products?category=${encodeURIComponent(category.category)}&brand=${encodeURIComponent(item.subcategory)}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                onClose();
                              }}
                              className="group/item flex items-center gap-2 rounded-lg py-1"
                            >
                              <div className={cn('h-1 w-1 rounded-full opacity-30 transition-opacity group-hover/item:opacity-100', category.accent)} />
                              <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 transition-colors group-hover/item:text-foreground">
                                {item.label}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                  {collectionItems.map((collection) => (
                    <Link
                      key={collection.title}
                      to={`/products?category=${encodeURIComponent(collection.category)}`}
                      onClick={onClose}
                      className="group relative block h-[320px] overflow-hidden rounded-[32px] border border-border/50 shadow-xl"
                    >
                      <img
                        src={collection.image}
                        alt={collection.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute left-6 top-6">
                        <span className="rounded-full border border-white/20 bg-primary/20 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
                          {collection.tag}
                        </span>
                      </div>

                      <div className="absolute bottom-8 left-8 right-8">
                        <h3 className="mb-2 text-xl font-black uppercase tracking-tight text-white">{collection.title}</h3>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">{collection.description}</p>

                        <div className="mt-6 flex -translate-x-4 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                          Khám phá ngay <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-border/50 pt-8">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hàng mới về mỗi ngày</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ưu đãi độc quyền thành viên</span>
                  </div>
                </div>

                <Link
                  to="/products"
                  onClick={onClose}
                  className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-[.2em] text-primary transition-all hover:underline underline-offset-8"
                >
                  XEM TẤT CẢ SẢN PHẨM
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
