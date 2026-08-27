import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

const FOOTER_SECTIONS = [
  {
    title: 'MUA SẮM',
    links: [
      { label: 'Bộ sưu tập', href: '/products' },
      { label: 'Sản phẩm mới', href: '/new-arrivals' },
      { label: 'Bán chạy nhất', href: '/products?sortBy=popular' },
      { label: 'Flash Sale', href: '/flash-sale' },
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
      { label: 'Vì sao chọn Hai Tụi Mình', href: '/why-buy' },
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
    <footer className="border-t border-border bg-secondary/55 pb-8 pt-12 text-foreground dark:bg-background">
      <div className="mx-auto max-w-[1500px] px-4">
        <div className="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-4">
            <Link to="/" className="inline-block">
              <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-primary">Tiệm bách hóa</span>
              <span className="font-accent text-3xl leading-none text-primary">Hai Tụi Mình</span>
            </Link>
            <p className="max-w-sm text-sm font-medium leading-relaxed text-muted-foreground">
              Tiệm Bách Hóa Hai Tụi Mình chuyên mỹ phẩm chính hãng, đồ gia dụng tiện ích và sản phẩm công nghệ với mức giá cạnh tranh, minh bạch và đáng tin cậy.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: 'https://www.instagram.com/' },
                { icon: Facebook, href: 'https://www.facebook.com/' },
                { icon: MessageCircle, href: 'https://zalo.me/0931454176' },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  target="_blank"
                  rel="noreferrer"
                >
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:col-span-8">
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

        <div className="mb-10 grid grid-cols-1 gap-5 rounded-3xl border border-border bg-card p-6 shadow-soft md:grid-cols-3 md:p-8">
          {[
            { icon: Phone, label: 'Mua hàng nhanh', value: '0931.454.176' },
            { icon: Mail, label: 'Phản hồi & Khiếu nại', value: 'hello@haituiminh.vn' },
            { icon: MapPin, label: 'Địa chỉ cửa hàng', value: '82/1E ấp Xuân Thới Đông 3, xã Xuân Thới Đông, Hóc Môn, TP.HCM' },
          ].map((item) => (
            <div key={item.label} className="group flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                <p className="text-base font-black leading-tight tracking-tight">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-5 border-t border-border pt-6 md:flex-row">
          <div className="flex flex-wrap justify-center gap-3">
            {['COD', 'Bảo hành 1 đổi 1', 'Gửi hàng toàn quốc'].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-card px-3 py-1.5">
                <span className="text-[10px] font-black uppercase tracking-tighter">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground md:text-right">
            © 2026 Tiệm Bách Hóa Hai Tụi Mình
          </p>
        </div>
      </div>
    </footer>
  );
};
