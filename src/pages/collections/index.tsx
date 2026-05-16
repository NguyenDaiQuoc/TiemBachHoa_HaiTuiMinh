import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Sparkles, 
  ShoppingBag, 
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Gift
} from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/src/shared/ui/button';

const COLLECTIONS = [
  {
    id: 'c1',
    title: 'Mỹ Phẩm Nội Địa',
    subtitle: 'Chăm sóc làn da Việt',
    description: 'Tuyển chọn các dòng mỹ phẩm chính hãng, phù hợp với làn da và khí hậu Việt Nam từ các thương hiệu uy tín.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop',
    itemCount: 156,
    color: 'from-rose-500/20 to-rose-500/5',
    tag: 'BEST SELLER'
  },
  {
    id: 'c2',
    title: 'Gia Dụng Tiện Ích',
    subtitle: 'Nhà gọn, đời vui',
    description: 'Những món đồ gia dụng thông minh giúp tối ưu không gian sống và tiết kiệm thời gian cho gia đình bạn.',
    image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=800&auto=format&fit=crop',
    itemCount: 92,
    color: 'from-amber-500/20 to-amber-500/5',
    tag: 'NEW TREND'
  },
  {
    id: 'c3',
    title: 'Công Nghệ Hot',
    subtitle: 'Dẫn đầu xu hướng',
    description: 'Phụ kiện công nghệ, đồ chơi gadgets hiện đại giúp bạn kết nối và giải trí đỉnh cao mọi lúc mọi nơi.',
    image: 'https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=800&auto=format&fit=crop',
    itemCount: 245,
    color: 'from-blue-500/20 to-blue-500/5',
    tag: 'HIGHTECH'
  },
  {
    id: 'c4',
    title: 'Đồ Hot TikTok',
    subtitle: 'Săn deal cực cháy',
    description: 'Bắt kịp những xu hướng mới nhất từ mạng xã hội với những sản phẩm độc đáo và thú vị.',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop',
    itemCount: 78,
    color: 'from-purple-500/20 to-purple-500/5',
    tag: 'TRENDING'
  }
];

export const CollectionsPage = () => {
  return (
    <div className="bg-background">
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=2000&auto=format&fit=crop" 
               className="w-full h-full object-cover opacity-30 dark:opacity-20"
               alt="Collections Hero"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl space-y-6"
            >
              <div className="inline-flex py-1.5 px-4 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                Khám phá bách hóa
              </div>
              <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tight leading-[0.9] italic">
                Bộ Sưu Tập <br /> <span className="text-primary">Tinh Tuyển</span>
              </h1>
              <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">
                Chúng mình tin rằng mỗi món đồ đều có một câu chuyện riêng. Hãy cùng khám phá những bộ sưu tập được "Hai Tụi Mình" lựa chọn với tất cả sự tận tâm.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Discovery Grid */}
        <section className="container mx-auto px-6 py-24">
          <div className="flex items-end justify-between mb-16">
            <div className="space-y-2">
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Discovery</span>
              <h2 className="text-3xl font-black uppercase tracking-tight italic">Tâm điểm mua sắm</h2>
            </div>
            <div className="hidden md:flex gap-4">
               {[Award, TrendingUp, Zap, Gift].map((Icon, idx) => (
                 <div key={idx} className="h-10 w-10 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground">
                   <Icon className="h-5 w-5" />
                 </div>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {COLLECTIONS.map((col, idx) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "group relative h-[500px] rounded-[48px] overflow-hidden border border-border/50 bg-gradient-to-br transition-all hover:border-primary/20",
                  col.color
                )}
              >
                <div className="absolute inset-0 z-0">
                  <img 
                    src={col.image} 
                    alt={col.title}
                    className="w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:scale-110 transition-transform duration-1000"
                  />
                </div>

                <div className="relative z-10 h-full p-12 flex flex-col justify-between">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-background/50 backdrop-blur-md border border-white/20 text-foreground text-[8px] font-black uppercase tracking-widest shadow-sm">
                      {col.tag}
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-black text-primary uppercase tracking-widest italic mb-1">{col.subtitle}</p>
                      <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{col.title}</h3>
                    </div>
                    
                    <p className="text-sm text-foreground/70 font-medium leading-relaxed max-w-sm">
                      {col.description}
                    </p>

                    <Link 
                      to="/search" 
                      className="inline-flex items-center gap-3 h-14 px-8 rounded-2xl bg-foreground text-background font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all group/btn"
                    >
                      XEM BỘ SƯU TẬP 
                      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Categories Carousel Simulation */}
        <section className="bg-muted/30 py-24 overflow-hidden">
          <div className="container mx-auto px-6 mb-12">
            <h2 className="text-2xl font-black uppercase tracking-tight italic">Danh mục phổ biến</h2>
          </div>
          
          <div className="flex gap-6 overflow-x-auto px-[10%] pb-12 snap-x scrollbar-hide">
            {['Skincare', 'Electronics', 'Home Decor', 'Accessories', 'Local Food', 'Fragrances'].map((cat, idx) => (
              <motion.div 
                key={cat}
                whileHover={{ y: -10 }}
                className="flex-shrink-0 w-64 h-80 rounded-[32px] bg-background border border-border/50 p-8 flex flex-col justify-between snap-center group cursor-pointer hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black italic">
                   {idx + 1}
                </div>
                <div>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Explore</p>
                   <h4 className="text-xl font-black uppercase tracking-tight italic">{cat}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24">
           <div className="relative rounded-[64px] bg-primary h-[400px] flex items-center justify-center text-center overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="relative z-10 max-w-2xl px-8 space-y-8">
                 <h2 className="text-4xl md:text-6xl font-black text-primary-foreground uppercase tracking-tighter leading-none italic">
                   Gia nhập <br /> Cộng đồng VIP
                 </h2>
                 <p className="text-primary-foreground/80 font-medium">
                   Nhận ưu đãi độc quyền, tích điểm thăng hạng và là người đầu tiên trải nghiệm những bộ sưu tập giới hạn từ Hai Tụi Mình.
                 </p>
                 <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-primary font-black text-xs uppercase tracking-widest shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all">
                    Đăng ký ngay
                 </Button>
              </div>
           </div>
        </section>
    </div>
  );
};
