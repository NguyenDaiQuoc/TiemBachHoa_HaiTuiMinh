import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, HeartHandshake, PackageCheck, RotateCcw, ShieldCheck, Store, Truck } from 'lucide-react';
import { Seo, storeStructuredData } from '@/src/shared/lib/seo';

const PAGE_DATA = {
  store: {
    eyebrow: 'Store introduction',
    title: 'Tiệm nhỏ, tiêu chuẩn rõ ràng',
    description: 'Hai Tụi Mình chọn bán những sản phẩm có nguồn gốc minh bạch, dễ kiểm chứng và phù hợp nhu cầu sử dụng hằng ngày.',
    icon: Store,
    path: '/store',
    points: [
      { icon: PackageCheck, title: 'Danh mục gọn nhưng kỹ', body: 'Tập trung mỹ phẩm chính hãng, gia dụng tiện ích và đồ công nghệ đáng dùng.' },
      { icon: ShieldCheck, title: 'Kiểm tra trước khi giao', body: 'Mỗi đơn được kiểm tình trạng, phân loại và thông tin bảo hành trước khi đóng gói.' },
      { icon: HeartHandshake, title: 'Hậu mãi dễ nói chuyện', body: 'Khi có vấn đề, khách có thể liên hệ trực tiếp để được xử lý theo chính sách rõ ràng.' },
    ],
  },
  'why-buy': {
    eyebrow: 'Why buy from us',
    title: 'Vì sao chọn Hai Tụi Mình',
    description: 'Không chạy theo số lượng, tụi mình ưu tiên trải nghiệm mua hàng rõ ràng: giá thật, mô tả thật, chính sách thật.',
    icon: BadgeCheck,
    path: '/why-buy',
    points: [
      { icon: BadgeCheck, title: 'Thông tin minh bạch', body: 'Sản phẩm có giá, tồn kho, phân loại và mô tả được cập nhật để khách dễ quyết định.' },
      { icon: Truck, title: 'Giao hàng có theo dõi', body: 'Đơn hàng có trạng thái xử lý và hướng dẫn kiểm hàng khi nhận.' },
      { icon: RotateCcw, title: 'Đổi trả có điều kiện rõ', body: 'Chính sách đổi trả không viết mơ hồ, giúp khách biết cần chuẩn bị gì khi phát sinh lỗi.' },
    ],
  },
  guarantee: {
    eyebrow: 'Authentic guarantee',
    title: 'Cam kết hàng chính hãng',
    description: 'Mục tiêu của tiệm là bán ít nhưng đáng tin: ưu tiên nguồn cung rõ ràng, sản phẩm còn nguyên tình trạng và hỗ trợ sau mua.',
    icon: ShieldCheck,
    path: '/authentic-guarantee',
    points: [
      { icon: ShieldCheck, title: 'Nguồn gốc kiểm chứng', body: 'Ưu tiên hàng từ nhà phân phối, đại lý hoặc nguồn cung có thông tin đối chiếu.' },
      { icon: PackageCheck, title: 'Đóng gói giữ tình trạng', body: 'Sản phẩm được kiểm ngoại quan, niêm phong và phụ kiện trước khi gửi.' },
      { icon: HeartHandshake, title: 'Hỗ trợ khi nghi ngờ lỗi', body: 'Khách gửi hình ảnh hoặc video mở hộp để tiệm xác minh và xử lý nhanh hơn.' },
    ],
  },
} as const;

interface TrustPageProps {
  type: keyof typeof PAGE_DATA;
}

export const TrustPage = ({ type }: TrustPageProps) => {
  const page = PAGE_DATA[type];
  const Icon = page.icon;

  return (
    <div className="bg-background text-foreground">
      <Seo title={page.title} description={page.description} path={page.path} structuredData={storeStructuredData} />
      <section className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              <Icon className="h-4 w-4" /> {page.eyebrow}
            </span>
            <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">{page.title}</h1>
            <p className="max-w-2xl text-lg font-medium leading-8 text-muted-foreground">{page.description}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/products" className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-xs font-black uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90">
                Mua sắm ngay <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/contact" className="inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-background px-5 text-xs font-black uppercase tracking-widest transition-colors hover:bg-muted">
                Liên hệ tiệm
              </Link>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-border/60 bg-card p-6 shadow-soft md:p-8">
            <div className="grid gap-4">
              {page.points.map((point) => {
                const PointIcon = point.icon;
                return (
                  <div key={point.title} className="rounded-[1.5rem] border border-border/50 bg-background p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <PointIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black uppercase tracking-tight">{point.title}</h2>
                        <p className="mt-2 text-sm font-medium leading-7 text-muted-foreground">{point.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
