import { motion } from 'motion/react';
import { Truck, RotateCcw, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

interface PolicySection {
  title: string;
  content: string;
}

interface PolicyData {
  title: string;
  subtitle: string;
  icon: any;
  sections: PolicySection[];
}

const POLICIES: Record<string, PolicyData> = {
  'shipping': {
    title: 'CHÍNH SÁCH VẬN CHUYỂN',
    subtitle: 'Nhanh chóng - Tin cậy - An toàn',
    icon: Truck,
    sections: [
      { title: 'Phạm vi giao hàng', content: 'Tiệm giao hàng trên toàn quốc với sự hỗ trợ của các đơn vị vận chuyển hàng đầu như Giao Hàng Nhanh, J&T Express và Shopee Xpress.' },
      { title: 'Thời gian giao hàng', content: 'Nội thành TP.HCM: 1-2 ngày làm việc. Các tỉnh thành khác: 3-5 ngày làm việc. Thời gian giao hàng có thể thay đổi tùy thuộc vào điều kiện khách quan (thời tiết, lễ tết).' },
      { title: 'Phí vận chuyển', content: 'Phí vận chuyển được tính dựa trên trọng lượng đơn hàng và địa chỉ nhận hàng. Miễn phí vận chuyển cho đơn hàng từ 500.000đ.' },
      { title: 'Kiểm tra hàng hóa', content: 'Quý khách vui lòng kiểm tra hộp niêm phong trước khi nhận. Tiệm khuyến khích khách hàng quay video khi mở hộp để được hỗ trợ tốt nhất nếu có khiếu nại.' }
    ]
  },
  'return': {
    title: 'CHÍNH SÁCH ĐỔI TRẢ',
    subtitle: '7 ngày đổi trả không lo lắng',
    icon: RotateCcw,
    sections: [
      { title: 'Điều kiện đổi trả', content: 'Sản phẩm còn nguyên bao bì, nhãn mác, chưa qua sử dụng. Có lỗi kỹ thuật từ nhà sản xuất hoặc bị hư hỏng do vận chuyển.' },
      { title: 'Thời gian áp dụng', content: 'Trong vòng 7 ngày kể từ khi khách hàng nhận được hàng.' },
      { title: 'Quy trình đổi trả', content: 'Liên hệ Hotline hoặc Fanpage của Tiệm để cung cấp video/hình ảnh sản phẩm. Sau khi xác nhận, Tiệm sẽ hướng dẫn khách hàng gửi trả sản phẩm và tiến hành đổi mới hoặc hoàn tiền.' },
      { title: 'Sản phẩm không áp dụng', content: 'Các sản phẩm mỹ phẩm đã bóc niêm phong hoặc đã qua sử dụng vì lý do an toàn sức khỏe.' }
    ]
  },
  'privacy': {
    title: 'CHÍNH SÁCH BẢO MẬT',
    subtitle: 'An toàn dữ liệu khách hàng là ưu tiên',
    icon: ShieldCheck,
    sections: [
       { title: 'Thu thập thông tin', content: 'Tiệm chỉ thu thập thông tin cần thiết để xử lý đơn hàng: Họ tên, Số điện thoại, Địa chỉ giao hàng.' },
       { title: 'Mục đích sử dụng', content: 'Thông tin được sử dụng cho việc xử lý đơn hàng, chăm sóc khách hàng và gửi các thông tin ưu đãi nếu được khách hàng đồng ý.' },
       { title: 'Bảo mật thông tin', content: 'Dữ liệu khách hàng được lưu trữ an toàn và tuyệt đối không chia sẻ cho bên thứ ba ngoại trừ các đối tác vận chuyển.' }
    ]
  }
};

export const PolicyPage = ({ type }: { type: 'shipping' | 'return' | 'privacy' }) => {
  const policy = POLICIES[type];
  const Icon = policy.icon;

  return (
    <div className="py-20 px-4">
        <div className="container mx-auto max-w-4xl space-y-16">
          <div className="text-center space-y-6">
            <div className="size-20 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center mx-auto">
               <Icon className="w-10 h-10" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                {policy.title}
              </h1>
              <p className="text-muted-foreground font-medium text-lg italic uppercase tracking-widest">{policy.subtitle}</p>
            </div>
          </div>

          <div className="grid gap-6">
             {policy.sections.map((section, idx) => (
               <motion.div 
                 key={idx}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className="p-8 md:p-12 rounded-[3rem] bg-surface-default border border-border/50 hover:border-primary/20 transition-all flex flex-col md:flex-row gap-8"
               >
                 <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center shrink-0 font-black text-xs italic">
                    {String(idx + 1).padStart(2, '0')}
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">{section.title}</h2>
                    <p className="text-muted-foreground font-medium text-lg leading-relaxed">{section.content}</p>
                 </div>
               </motion.div>
             ))}
          </div>

          <div className="p-12 rounded-[3.5rem] bg-primary/5 border border-dashed border-primary/20 flex flex-col items-center text-center space-y-6">
             <div className="flex -space-x-4">
                {[1,2,3].map(i => (
                  <div key={i} className="size-12 rounded-full border-4 border-background bg-muted overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Avatar" />
                  </div>
                ))}
             </div>
             <div className="space-y-2">
                <p className="font-black italic uppercase tracking-tight">Vẫn còn điều chưa rõ?</p>
                <p className="text-sm text-muted-foreground font-medium">Đội ngũ chăm sóc khách hàng của chúng mình luôn sẵn sàng 24/7 để hỗ trợ bạn.</p>
             </div>
             <button className="h-14 px-8 rounded-full bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest italic flex items-center gap-3">
                TRÒ CHUYỆN VỚI TIỆM <ChevronRight className="w-4 h-4" />
             </button>
          </div>
        </div>
    </div>
  );
};
