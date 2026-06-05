import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

const FOOTER_SECTIONS = [
  {
    title: 'MUA SẮM',
    links: [
      { label: 'Bộ sưu tập', href: '/collections' },
      { label: 'Sản phẩm mới', href: '/search?sort=newest' },
      { label: 'Bán chạy nhất', href: '/search?sort=popular' },
      { label: 'Flash Sale', href: '/#flash-sale' },
    ],
  },
  {
    title: 'DỊCH VỤ KHÁCH HÀNG',
    links: [
      { label: 'Trung tâm trợ giúp (FAQ)', href: '/faq' },
      { label: 'Chính sách vận chuyển', href: '/shipping-policy' },
      { label: 'Chính sách đổi trả', href: '/return-policy' },
      { label: 'Phương thức thanh toán', href: '/faq#payment' },
    ],
  },
  {
    title: 'VỀ CHÚNG MÌNH',
    links: [
      { label: 'Câu chuyện thương hiệu', href: '/about' },
      { label: 'Liên hệ', href: '/contact' },
      { label: 'Tuyển dụng', href: '/about#careers' },
      { label: 'Chính sách bảo mật', href: '/privacy-policy' },
    ],
  },
];

export const Footer = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <footer className="border-t bg-muted/30 pb-8 pt-16">
      <div className="container mx-auto px-4">
        <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <Link to="/" className="inline-block">
              <h3 className="font-heading text-2xl font-black italic tracking-tighter text-primary">HAI TỤI MÌNH</h3>
            </Link>
            <p className="max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
              Tiệm Bách Hoá Hai Tụi Mình chuyên mỹ phẩm chính hãng, đồ gia dụng tiện ích và sản phẩm công nghệ với mức giá cạnh tranh, minh bạch và đáng tin cậy.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Instagram, href: '#' },
                { icon: Facebook, href: '#' },
                { icon: MessageCircle, href: '#' },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  className="flex size-10 items-center justify-center rounded-xl border border-border/50 bg-background text-muted-foreground transition-all hover:border-primary hover:bg-primary hover:text-white"
                >
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:col-span-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-4">
                <button onClick={() => toggleSection(section.title)} className="group flex w-full items-center justify-between md:cursor-default">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">{section.title}</h4>
                  <ChevronDown className={cn('size-4 transition-transform md:hidden', openSections[section.title] ? 'rotate-180' : '')} />
                </button>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300 md:h-auto',
                    openSections[section.title] ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 md:max-h-full md:opacity-100'
                  )}
                >
                  <ul className="space-y-3 pt-2 md:pt-0">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link to={link.href} className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                          <span className="h-[1px] w-0 bg-primary transition-all duration-300 group-hover:w-3" />
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

        <div className="mb-16 grid grid-cols-1 gap-8 rounded-[3rem] border border-border/50 bg-background p-8 shadow-soft md:grid-cols-3 md:p-12">
          <div className="group flex items-center gap-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
              <Phone className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mua hàng nhanh</p>
              <p className="text-lg font-black italic tracking-tight">0931.454.176</p>
            </div>
          </div>
          <div className="group flex items-center gap-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
              <Mail className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phản hồi & Khiếu nại</p>
              <p className="text-lg font-black italic tracking-tight">hello@haituiminh.vn</p>
            </div>
          </div>
          <div className="group flex items-center gap-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white">
              <MapPin className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Địa chỉ cửa hàng</p>
              <p className="text-lg font-black italic leading-tight tracking-tight">82/1E ấp Xuân Thới Đông 3, xã Xuân Thới Đông, Hóc Môn, TP.HCM</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t pt-8 md:flex-row">
          <div className="flex flex-wrap justify-center gap-4">
            <div className="rounded-xl border border-border/50 bg-background px-3 py-1.5">
              <span className="text-[10px] font-black uppercase italic tracking-tighter">COD</span>
            </div>
            <div className="rounded-xl border border-border/50 bg-background px-3 py-1.5">
              <span className="text-[10px] font-black uppercase italic tracking-tighter">Bảo hành 1 đổi 1</span>
            </div>
            <div className="rounded-xl border border-border/50 bg-background px-3 py-1.5">
              <span className="text-[10px] font-black uppercase italic tracking-tighter">Gửi hàng toàn quốc</span>
            </div>
          </div>
          <div className="space-y-1 text-center md:text-right">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">© 2026 Tiệm Bách Hoá Hai Tụi Mình</p>
            <p className="text-[9px] font-black uppercase text-muted-foreground/30">Powered by Antigravity Engine</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
