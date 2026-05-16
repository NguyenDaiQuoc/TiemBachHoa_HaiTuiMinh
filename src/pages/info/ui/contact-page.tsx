import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';

export const ContactPage = () => {
  return (
    <div>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto space-y-20">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85]">
                LIÊN HỆ <br />
                <span className="text-primary italic">VỚI TIỆM</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto italic uppercase tracking-[0.2em]">
                Chúng mình luôn ở đây để lắng nghe và hỗ trợ bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Form */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 md:p-12 rounded-[3.5rem] bg-surface-default border border-border/50 space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Gửi lời nhắn</h2>
                  <p className="text-sm text-muted-foreground font-medium">Chúng mình sẽ phản hồi bạn sớm nhất có thể.</p>
                </div>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest px-2">Họ tên của bạn</label>
                      <Input placeholder="Nguyễn Văn A" className="h-14 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest px-2">Số điện thoại</label>
                      <Input placeholder="0987 XXX XXX" className="h-14 rounded-2xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-2">Vấn đề cần hỗ trợ</label>
                    <Input placeholder="Vd: Tư vấn mỹ phẩm, Bảo hành..." className="h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-2">Nội dung chi tiết</label>
                    <textarea 
                      placeholder="Hãy cho chúng mình biết thêm thông tin nhé..." 
                      className="w-full min-h-[150px] p-6 rounded-3xl bg-background border border-border/50 focus:border-primary/50 outline-none transition-all font-medium text-sm"
                    />
                  </div>
                  <Button className="w-full h-16 rounded-full bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest italic flex items-center justify-center gap-3 group">
                    GỬI NGAY CHO TIỆM <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </form>
              </motion.div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: MapPin, title: "Địa chỉ", info: "Quận 1, TP. Hồ Chí Minh" },
                    { icon: Phone, title: "Hotline", info: "0123.456.789" },
                    { icon: Mail, title: "Email", info: "hello@haituiminh.vn" },
                    { icon: Clock, title: "Giờ mở cửa", info: "09:00 - 21:00 (T2 - CN)" }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-8 rounded-[32px] bg-primary/5 border border-primary/10 space-y-4 hover:bg-primary/10 transition-colors"
                    >
                      <div className="size-12 rounded-2xl bg-white/50 dark:bg-black/50 text-primary flex items-center justify-center">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.title}</p>
                        <p className="font-black italic text-lg tracking-tight leading-tight">{item.info}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Map Preview Placeholder */}
                <div className="aspect-video md:aspect-[21/9] rounded-[3.5rem] bg-muted overflow-hidden relative border border-border/50 group">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-50 transition-all duration-[2s] group-hover:scale-110 group-hover:rotate-1" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                     <div className="size-16 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center animate-bounce shadow-2xl shadow-primary/40">
                        <MapPin className="w-8 h-8 text-white" />
                     </div>
                  </div>
                </div>

                <div className="p-8 rounded-[3rem] border border-dashed border-border/50 flex items-center justify-between gap-6">
                   <div className="space-y-1">
                      <p className="text-xl font-black italic uppercase tracking-tighter">Chat với chúng mình</p>
                      <p className="text-xs text-muted-foreground font-medium">Messenger, Instagram, Zalo</p>
                   </div>
                   <div className="flex gap-2">
                      <div className="size-12 rounded-2xl bg-surface-elevated border border-border/50 flex items-center justify-center cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-all">
                         <MessageSquare className="w-5 h-5" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};
