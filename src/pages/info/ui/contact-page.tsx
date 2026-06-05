import { motion } from 'motion/react';
import { Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';

export const ContactPage = () => {
  return (
    <div>
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-6xl space-y-20">
          <div className="space-y-4 text-center">
            <h1 className="text-6xl font-black uppercase italic leading-[0.85] tracking-tighter md:text-8xl">
              LIÊN HỆ <br />
              <span className="text-primary italic">VỚI TIỆM</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg font-medium uppercase tracking-[0.2em] text-muted-foreground italic">
              Chúng mình luôn ở đây để lắng nghe và hỗ trợ bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 rounded-[3.5rem] border border-border/50 bg-surface-default p-8 md:p-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Gửi lời nhắn</h2>
                <p className="text-sm font-medium text-muted-foreground">Chúng mình sẽ phản hồi bạn sớm nhất có thể.</p>
              </div>

              <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="px-2 text-[10px] font-black uppercase tracking-widest">Họ tên của bạn</label>
                    <Input placeholder="Nguyễn Văn A" className="h-14 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="px-2 text-[10px] font-black uppercase tracking-widest">Số điện thoại</label>
                    <Input placeholder="0987 XXX XXX" className="h-14 rounded-2xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="px-2 text-[10px] font-black uppercase tracking-widest">Vấn đề cần hỗ trợ</label>
                  <Input placeholder="Ví dụ: Tư vấn mỹ phẩm, bảo hành..." className="h-14 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <label className="px-2 text-[10px] font-black uppercase tracking-widest">Nội dung chi tiết</label>
                  <textarea
                    placeholder="Hãy cho chúng mình biết thêm thông tin nhé..."
                    className="min-h-[150px] w-full rounded-3xl border border-border/50 bg-background p-6 text-sm font-medium outline-none transition-all focus:border-primary/50"
                  />
                </div>
                <Button className="group flex h-16 w-full items-center justify-center gap-3 rounded-full bg-primary text-xs font-black uppercase italic tracking-widest text-primary-foreground">
                  Gửi ngay cho tiệm <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Button>
              </form>
            </motion.div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[
                  { icon: MapPin, title: 'Địa chỉ', info: '82/1E ấp Xuân Thới Đông 3, xã Xuân Thới Đông, Hóc Môn, TP. Hồ Chí Minh' },
                  { icon: Phone, title: 'Hotline', info: '0931.454.176' },
                  { icon: Mail, title: 'Email', info: 'hello@haituiminh.vn' },
                  { icon: Clock, title: 'Giờ mở cửa', info: '09:00 - 21:00 (T2 - CN)' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-4 rounded-[32px] border border-primary/10 bg-primary/5 p-8 transition-colors hover:bg-primary/10"
                  >
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-white/50 text-primary dark:bg-black/50">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.title}</p>
                      <p className="text-lg font-black italic leading-tight tracking-tight">{item.info}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="group relative aspect-video overflow-hidden rounded-[3.5rem] border border-border/50 bg-muted md:aspect-[21/9]">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale transition-all duration-[2s] group-hover:rotate-1 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary/80 shadow-2xl shadow-primary/40 backdrop-blur-md animate-bounce">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 rounded-[3rem] border border-dashed border-border/50 p-8">
                <div className="space-y-1">
                  <p className="text-xl font-black uppercase italic tracking-tighter">Chat với chúng mình</p>
                  <p className="text-xs font-medium text-muted-foreground">Messenger, Instagram, Zalo</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex size-12 cursor-pointer items-center justify-center rounded-2xl border border-border/50 bg-surface-elevated transition-all hover:border-primary hover:bg-primary hover:text-white">
                    <MessageSquare className="h-5 w-5" />
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
