import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Phone, Sparkles, Truck, Tag, Gift, CalendarHeart } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

type Tone = 'freeship' | 'flash' | 'holiday' | 'member' | 'support';

type AnnouncementItem = {
  id: string;
  icon: typeof Truck;
  text: string;
  tone: Tone;
};

// Tin nền tảng — luôn hiển thị
const baseAnnouncements: AnnouncementItem[] = [
  { id: 'freeship', icon: Truck, text: 'Freeship đơn từ 500.000đ', tone: 'freeship' },
  { id: 'support', icon: Phone, text: 'Hotline: 0931 454 176', tone: 'support' },
  { id: 'return', icon: Tag, text: 'Đổi trả miễn phí 7 ngày', tone: 'member' },
];

// Sự kiện xoay vòng theo mùa / ngày đặc biệt
const holidayEvents: { match: (d: Date) => boolean; item: AnnouncementItem }[] = [
  {
    // 25 hằng tháng
    match: (d) => d.getDate() === 25,
    item: { id: 'flash-25', icon: Sparkles, text: 'Flash Sale ngày 25 — giảm đến 50%', tone: 'flash' },
  },
  {
    // Các ngày lễ lớn VN
    match: (d) => {
      const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return ['01-01', '02-14', '03-08', '04-30', '05-01', '09-02', '10-20', '11-20', '12-24', '12-25', '12-31'].includes(md);
    },
    item: { id: 'holiday', icon: CalendarHeart, text: 'Đại lễ — sale quà tặng cuối năm', tone: 'holiday' },
  },
];

const toneClass: Record<Tone, string> = {
  freeship: 'text-primary-foreground',
  flash: 'text-amber-100',
  holiday: 'text-rose-100',
  member: 'text-emerald-100',
  support: 'text-primary-foreground',
};

export const AnnouncementBar = () => {
  const [active, setActive] = useState<AnnouncementItem[]>(baseAnnouncements);

  useEffect(() => {
    const today = new Date();
    const events = holidayEvents.filter((e) => e.match(today)).map((e) => e.item);
    setActive([...baseAnnouncements, ...events]);
  }, []);

  return (
    <div className="relative bg-primary text-primary-foreground">
      {/* mobile: < sm, single rotating message */}
      <div className="flex h-9 items-center justify-center px-3 sm:hidden">
        <RotatingMessage items={active} />
      </div>

      {/* desktop: marquee */}
      <div className="mx-auto hidden h-9 max-w-[1500px] items-center px-5 sm:flex">
        <div className="pause-on-hover group flex min-w-0 flex-1 items-center overflow-hidden">
          <div className="flex w-max shrink-0 items-center gap-10 animate-marquee will-change-transform">
            {Array.from({ length: 2 }).map((_, group) => (
              <div key={group} className="flex items-center gap-10 whitespace-nowrap">
                {active.map((a) => {
                  const Icon = a.icon;
                  return (
                    <span
                      key={`${group}-${a.id}`}
                      className={cn('flex items-center gap-2 text-[11px] font-bold tracking-wide', toneClass[a.tone])}
                    >
                      <Icon className="h-3.5 w-3.5 opacity-90" aria-hidden />
                      {a.text}
                      <span className="mx-2 inline-block h-1 w-1 rounded-full bg-current opacity-50" />
                    </span>
                  );
                })}
                <span className="flex items-center gap-2 text-[11px] font-bold">
                  <Gift className="h-3.5 w-3.5 opacity-90" aria-hidden />
                  Ưu đãi độc quyền cho thành viên
                </span>
              </div>
            ))}
          </div>
        </div>
        <Link
          to="/tracking"
          className="ml-4 hidden shrink-0 whitespace-nowrap text-[11px] font-bold tracking-wide hover:underline md:inline"
        >
          Tra cứu đơn hàng
        </Link>
      </div>
    </div>
  );
};

const RotatingMessage = ({ items }: { items: AnnouncementItem[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [items.length]);

  const current = items[index];
  if (!current) return null;
  const Icon = current.icon;

  return (
    <div className="relative h-6 w-full max-w-[280px] overflow-hidden">
      {items.map((a, i) => {
        const ItemIcon = a.icon;
        const isActive = i === index;
        return (
          <span
            key={a.id}
            aria-hidden={!isActive}
            className={cn(
              'absolute inset-0 flex items-center justify-center gap-2 text-[12px] font-bold tracking-wide transition-all duration-500',
              toneClass[a.tone],
              isActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
            )}
          >
            <ItemIcon className="h-3.5 w-3.5" />
            {a.text}
          </span>
        );
      })}
      <span className="sr-only">
        <Icon /> {current.text}
      </span>
    </div>
  );
};
