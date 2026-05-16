import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Instagram, Facebook, MessageCircle, Phone, Mail, MapPin } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

const FOOTER_SECTIONS = [
  {
    title: "MUA SẮM",
    links: [
      { label: "Bộ sưu tập", href: "/collections" },
      { label: "Sản phẩm mới", href: "/search?sort=newest" },
      { label: "Bán chạy nhất", href: "/search?sort=popular" },
      { label: "Flash Sale", href: "/#flash-sale" },
    ]
  },
  {
    title: "DỊCH VỤ KHÁCH HÀNG",
    links: [
      { label: "Trung tâm trợ giúp (FAQ)", href: "/faq" },
      { label: "Chính sách vận chuyển", href: "/shipping-policy" },
      { label: "Chính sách đổi trả", href: "/return-policy" },
      { label: "Phương thức thanh toán", href: "/faq#payment" },
    ]
  },
  {
    title: "VỀ CHÚNG MÌNH",
    links: [
      { label: "Câu chuyện thương hiệu", href: "/about" },
      { label: "Liên hệ", href: "/contact" },
      { label: "Tuyển dụng", href: "/about#careers" },
      { label: "Chính sách bảo mật", href: "/privacy-policy" },
    ]
  }
];

export const Footer = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <footer className="border-t bg-muted/30 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="inline-block">
              <h3 className="font-heading font-black text-2xl italic text-primary tracking-tighter">HAI TỤI MÌNH</h3>
            </Link>
            <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed">
              Tiệm Bách Hoá Hai Tụi Mình – Chuyên mỹ phẩm chính hãng, đồ gia dụng thông minh và phụ kiện công nghệ chất lượng cao. Chúng mình tin rằng mỗi sản phẩm là một lời cam kết về giá trị thực.
            </p>
            <div className="flex gap-4">
               {[
                 { icon: Instagram, href: "#" },
                 { icon: Facebook, href: "#" },
                 { icon: MessageCircle, href: "#" }
               ].map((social, idx) => (
                 <a 
                   key={idx} 
                   href={social.href} 
                   className="size-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all group"
                 >
                   <social.icon className="size-5 group-hover:scale-110 transition-transform" />
                 </a>
               ))}
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-4">
                <button 
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full md:cursor-default group"
                >
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-foreground/70">{section.title}</h4>
                  <ChevronDown className={cn(
                    "size-4 md:hidden transition-transform",
                    openSections[section.title] ? "rotate-180" : ""
                  )} />
                </button>
                
                <div className={cn(
                  "overflow-hidden transition-all duration-300 md:h-auto",
                  openSections[section.title] ? "max-h-60 opacity-100" : "max-h-0 opacity-0 md:max-h-full md:opacity-100"
                )}>
                  <ul className="space-y-3 pt-2 md:pt-0">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link 
                          to={link.href} 
                          className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-2 group"
                        >
                          <span className="w-0 h-[1px] bg-primary group-hover:w-3 transition-all duration-300" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Banner */}
        <div className="p-8 md:p-12 rounded-[3rem] bg-background border border-border/50 grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 shadow-soft">
           <div className="flex items-center gap-6 group">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                 <Phone className="size-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mua hàng nhanh</p>
                 <p className="font-black italic text-lg tracking-tight">0123.456.789</p>
              </div>
           </div>
           <div className="flex items-center gap-6 group">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                 <Mail className="size-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phản hồi & Khiếu nại</p>
                 <p className="font-black italic text-lg tracking-tight">hello@haituiminh.vn</p>
              </div>
           </div>
           <div className="flex items-center gap-6 group">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                 <MapPin className="size-6" />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Địa chỉ cửa hàng</p>
                 <p className="font-black italic text-lg tracking-tight">Quận 1, TP. HCM</p>
              </div>
           </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap justify-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border/50">
                <span className="text-[10px] font-black uppercase italic tracking-tighter">COD</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border/50">
                <span className="text-[10px] font-black uppercase italic tracking-tighter">Bảo hành 1 đổi 1</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border/50">
                <span className="text-[10px] font-black uppercase italic tracking-tighter">Gửi hàng toàn quốc</span>
             </div>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">© 2026 Tiệm Bách Hoá Hai Tụi Mình. Crafted with ♡</p>
            <p className="text-[9px] text-muted-foreground/30 uppercase font-black">Powered by Antigravity Engine</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
