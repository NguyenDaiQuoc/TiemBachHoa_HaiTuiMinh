import { motion } from 'motion/react';
import { ShieldCheck, Sparkles, Heart, Rocket } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div>
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=2070&auto=format&fit=crop" 
            alt="About Hero" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 text-center space-y-6 px-4">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-primary font-black uppercase tracking-[0.4em] text-xs"
            >
              Câu chuyện về chúng mình
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.85]"
            >
              CHẤT LƯỢNG THẬT <br />
              <span className="text-primary italic">GIÁ TRỊ THẬT</span>
            </motion.h1>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-tight">
                  TẠI SAO LÀ <br />
                  TIÊM BÁCH HOÁ HAI TỤI MÌNH?
                </h2>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                  Bắt đầu từ niềm đam mê với những sản phẩm làm đẹp chính hãng và đồ gia dụng tiện ích, chúng mình – hai người bạn đồng hành – đã xây dựng nên "Tiệm Bách Hoá Hai Tụi Mình". 
                </p>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                  Mục tiêu của chúng mình không chỉ là bán hàng, mà là mang đến một điểm tựa niềm tin giữa thị trường đầy rẫy những lo âu về nguồn gốc sản phẩm.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-5xl font-black text-primary italic">100%</p>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Chính hãng</p>
                </div>
                <div className="space-y-2">
                  <p className="text-5xl font-black text-primary italic">5k+</p>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Khách hàng tin tưởng</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-[32px] overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1596462502278-27bfad8f63ef?q=80&w=800&auto=format&fit=crop" alt="Visual" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-[32px] bg-primary/10 flex items-center justify-center p-8 text-center">
                   <p className="font-black italic uppercase tracking-tighter text-primary">Chúng mình trao gửi sự tận tâm</p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="aspect-square rounded-[32px] bg-foreground text-background flex items-center justify-center p-8 text-center">
                   <p className="font-black italic uppercase tracking-tighter">Khách hàng là trọng tâm</p>
                </div>
                <div className="aspect-[3/4] rounded-[32px] overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop" alt="Visual" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Commitment */}
        <section className="bg-muted py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">CAM KẾT CỦA TIỆM</h2>
              <div className="h-1 w-20 bg-primary mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: ShieldCheck, title: "100% CHÍNH HÃNG", desc: "Mọi sản phẩm đều được kiểm định nguồn gốc rõ ràng và minh bạch." },
                { icon: Sparkles, title: "TUYỂN CHỌN KỸ", desc: "Chỉ những sản phẩm thực sự hiệu quả và chất lượng mới xuất hiện trên kệ." },
                { icon: Heart, title: "TẬN TÂM HỖ TRỢ", desc: "Tư vấn như một người bạn thực thụ, giúp bạn chọn sản phẩm phù hợp nhất." },
                { icon: Rocket, title: "GIAO HÀNG TỐC ĐỘ", desc: "Đóng gói cẩn thận và liên kết các đơn vị vận chuyển uy tín nhất." }
              ].map((item, idx) => (
                <div key={idx} className="p-8 rounded-[40px] bg-background border border-border/50 hover:border-primary/20 transition-all space-y-4 group">
                  <div className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-black italic text-lg uppercase tracking-tight">{item.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-24">
           <div className="container mx-auto px-4 text-center space-y-8">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                 ĐỒNG HÀNH CÙNG <br />
                 <span className="text-primary italic text-7xl md:text-9xl tracking-tighter block mt-2">CHÚNG MÌNH</span>
              </h2>
              <button className="h-16 px-12 rounded-full bg-foreground text-background font-black uppercase text-xs tracking-widest italic hover:bg-primary transition-colors">
                 LIÊN HỆ VỚI TIỆM
              </button>
           </div>
        </section>
    </div>
  );
};
