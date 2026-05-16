import { ProductGrid } from '@/src/widgets/product-grid';
import { Product } from '@/src/entities/product/model/types';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, BadgeCheck, Timer, Zap, Sparkles, Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { useState, useEffect } from 'react';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p1',
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
    preview: "https://images.unsplash.com/photo-1596462502278-27bfad8f63ef?q=80&w=800&auto=format&fit=crop",
    color: "rose"
  },
  {
    id: 'cat-tech',
    title: "Công Nghệ Thông Minh",
    tag: "GADGETS & TECH",
    image: "https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=1200&auto=format&fit=crop",
    preview: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
    color: "blue"
  },
  {
    id: 'cat-home',
    title: "Gia Dụng Tiện Ích",
    tag: "SMART HOME",
    image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=1200&auto=format&fit=crop",
    preview: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
    color: "amber"
  }
];

export const HomePage = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 45, s: 18 });
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (h === 0 && m === 0 && s === 0) {
            clearInterval(timer);
            return prev;
        }
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            m = 59;
            if (h > 0) h--;
          }
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNum = (n: number) => n.toString().padStart(2, '0');
  return (
      <div className="container mx-auto px-4 py-12 space-y-20">
        <section className="space-y-6 text-center py-10 md:py-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <span className="text-primary font-bold tracking-[0.3em] text-xs uppercase">Chính hãng • Giá tốt • Hiện đại</span>
          <h1 className="text-5xl md:text-8xl font-heading font-black text-foreground uppercase italic tracking-tighter leading-none">
            Tiệm Bách Hoá<br/><span className="text-primary">Hai Tụi Mình</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
            Điểm đến tin cậy cho Mỹ phẩm, Đồ gia dụng & Công nghệ. 
            Chúng mình mang đến những sản phẩm chất lượng nhất với giá thành cạnh tranh nhất thị trường.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <Link to="/search">
              <button className="w-full sm:w-auto bg-primary text-primary-foreground px-10 py-4 rounded-full font-black uppercase tracking-widest italic hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                MUA SẮM NGAY
              </button>
            </Link>
            <Link to="/collections">
              <button className="w-full sm:w-auto bg-background border-2 border-primary/20 text-foreground px-10 py-4 rounded-full font-black uppercase tracking-widest italic hover:border-primary/50 transition-all hover:bg-muted/50">
                KHÁM PHÁ BỘ SƯU TẬP
              </button>
            </Link>
          </div>
        </section>

        {/* Trust Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 border-y border-border/50">
          {[
            { icon: <ShieldCheck className="w-5 h-5" />, label: "Chính Hãng 100%", sub: "Cam kết nguồn gốc" },
            { icon: <Truck className="w-5 h-5" />, label: "Giao Hàng Nhanh", sub: "Xử lý trong 24h" },
            { icon: <RotateCcw className="w-5 h-5" />, label: "Đổi Trả Dễ Dàng", sub: "Trong vòng 7 ngày" },
            { icon: <BadgeCheck className="w-5 h-5" />, label: "Bảo Hành Tận Tâm", sub: "Hỗ trợ 24/7" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center md:items-start gap-3 text-center md:text-left p-4 rounded-2xl hover:bg-muted/30 transition-colors">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
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
        <section className="bg-foreground text-background rounded-[3rem] p-8 md:p-12 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] -mr-48 -mt-48 group-hover:bg-primary/30 transition-colors duration-1000" />
          
          <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-8 w-full">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full w-fit">
                  <Zap className="w-4 h-4 fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Deal Cháy Giờ Vàng</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                  Flash Sale<br/><span className="text-primary">Săn Deal 1/2 Giá</span>
                </h2>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex items-center gap-2 font-mono text-2xl md:text-4xl font-black italic">
                    <span className="bg-background/10 backdrop-blur-md px-3 py-1 rounded-xl">{formatNum(timeLeft.h)}</span>
                    <span className="text-primary">:</span>
                    <span className="bg-background/10 backdrop-blur-md px-3 py-1 rounded-xl">{formatNum(timeLeft.m)}</span>
                    <span className="text-primary">:</span>
                    <span className="bg-background/10 backdrop-blur-md px-3 py-1 rounded-xl">{formatNum(timeLeft.s)}</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    Kết thúc sau
                  </div>
                </div>
              </div>
              
              <Link to="/search" className="inline-block">
                <button className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                  Xem tất cả Deal <ArrowRight className="inline-block ml-2 w-5 h-5" />
                </button>
              </Link>
            </div>

            <div className="flex-1 w-full grid grid-cols-2 gap-4">
              {SAMPLE_PRODUCTS.slice(0, 2).map((product, i) => (
                <Link key={i} to={`/product/${product.id}`} className="block group/item">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-4 space-y-4 transition-all hover:bg-white/10">
                    <div className="aspect-square rounded-2xl overflow-hidden relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700" />
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-lg italic">
                        -50%
                      </div>
                    </div>
                    <div className="space-y-1 text-background">
                      <h3 className="text-xs font-black uppercase tracking-tight line-clamp-1 group-hover/item:text-primary transition-colors">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-primary italic">{(product.price / 2).toLocaleString('vi-VN')} đ</span>
                        <span className="text-[10px] line-through opacity-40 font-bold">{product.price.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-12 relative">
          <div className="flex items-end justify-between px-2">
            <div className="space-y-2">
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Lựa chọn tinh tuyển</span>
              <h2 className="text-3xl font-black uppercase tracking-tight italic">Danh mục nổi bật</h2>
            </div>
            <Link to="/collections" className="text-xs font-black uppercase tracking-widest text-primary hover:underline underline-offset-4 flex items-center gap-2 group">
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
               {CATEGORIES.map((col, idx) => (
                 <motion.div
                   key={idx}
                   whileHover={{ y: -10 }}
                   onMouseEnter={() => setHoveredCategory(col.id)}
                   onMouseLeave={() => setHoveredCategory(null)}
                   onFocus={() => setHoveredCategory(col.id)}
                   onBlur={() => setHoveredCategory(null)}
                   tabIndex={0}
                   className={cn(
                     "group rounded-[40px] overflow-hidden border border-border/50 transition-all hover:border-primary/20 cursor-pointer shadow-soft hover:shadow-2xl hover:shadow-primary/5 bg-background/80 backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-primary",
                     hoveredCategory && hoveredCategory !== col.id ? "opacity-40 grayscale-[0.5]" : "opacity-100"
                   )}
                 >
                   <div className="aspect-[4/5] overflow-hidden relative">
                     <img src={col.preview} alt={col.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
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
                     <h3 className="text-xl font-black uppercase tracking-tight italic leading-tight group-hover:text-primary transition-colors">{col.title}</h3>
                   </div>
                 </motion.div>
               ))}
             </div>
          </div>
        </section>

        <ProductGrid title="Sản phẩm hot tuần này" products={SAMPLE_PRODUCTS} />
        
        {/* Bestseller Ranking */}
        <section className="space-y-12">
          <div className="flex items-end justify-between px-2">
            <div className="space-y-2">
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Thứ hạng thực tế</span>
              <h2 className="text-3xl font-black uppercase tracking-tight italic">Bảng Xếp Hạng Bán Chạy</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              { category: "MỸ PHẨM", items: SAMPLE_PRODUCTS.slice(0, 3) },
              { category: "CÔNG NGHỆ", items: [SAMPLE_PRODUCTS[2], SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[4]] },
              { category: "GIA DỤNG", items: [SAMPLE_PRODUCTS[1], SAMPLE_PRODUCTS[4], SAMPLE_PRODUCTS[2]] },
            ].map((rank, i) => (
              <div key={i} className="p-8 rounded-[40px] border border-border/50 bg-surface-default hover:bg-surface-elevated transition-colors shadow-soft">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-8 pb-4 border-b border-primary/10">{rank.category}</h3>
                <div className="space-y-6">
                  {rank.items.map((item, idx) => (
                    <Link key={idx} to={`/product/${item.id}`} className="flex items-center gap-4 group/rank">
                      <span className="text-4xl font-black italic text-muted-foreground/20 group-hover/rank:text-primary/40 transition-colors w-12 tracking-tighter">0{idx + 1}</span>
                      <div className="size-16 rounded-2xl overflow-hidden flex-shrink-0 bg-muted">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover/rank:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs font-black uppercase tracking-tight line-clamp-1 group-hover/rank:text-primary transition-colors text-foreground">{item.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground italic uppercase">{(item.soldCount || 800) + (10 - idx * 2)} đã bán</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        
        <section className="bg-primary/5 rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-tight">Chất lượng thật,<br/>Giá trị thật.</h2>
            <p className="text-muted-foreground text-lg font-medium">
              "Tại Tiệm Bách Hoá Hai Tụi Mình, chúng mình cam kết mọi sản phẩm đều được kiểm tra kỹ lưỡng về nguồn gốc. Chúng mình không chỉ bán hàng, chúng mình trao gửi sự tin cậy."
            </p>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-black italic text-primary">TM</div>
              <div>
                <p className="font-bold uppercase text-xs tracking-widest">Tiệm Bách Hoá Hai Tụi Mình</p>
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
        <section className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?q=80&w=1954&auto=format&fit=crop" 
            alt="Promotion" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 p-8 md:p-20 flex flex-col justify-center space-y-6">
            <span className="text-primary font-black uppercase tracking-[0.4em] text-xs">Phụ nữ là để yêu thương</span>
            <h2 className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.85]">
              Mùa Yêu <br />
              <span className="text-primary italic">Ưu đãi đến 40%</span>
            </h2>
            <p className="text-white/60 max-w-md font-medium text-lg leading-relaxed">
              Dành riêng cho những đóa hồng rạng rỡ nhất. Miễn phí vận chuyển và quà tặng kèm mọi đơn hàng mỹ phẩm.
            </p>
            <Link to="/search?category=MỸ%20PHẨM" className="inline-block pt-4">
              <button className="bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-widest italic hover:bg-primary hover:text-white transition-all transform hover:scale-105">
                SĂN DEAL NGAY
              </button>
            </Link>
          </div>
        </section>
      </div>
  );
};
