import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, MessageCircle, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/src/shared/lib/utils';

const FAQS = [
  {
    category: "GIAO HÀNG",
    questions: [
      {
        q: "Thời gian giao hàng là bao lâu?",
        a: "Thông thường, đơn hàng sẽ được giao trong vòng 1-2 ngày đối với khu vực Nội thành và 3-5 ngày đối với các tỉnh thành khác."
      },
      {
        q: "Tôi có được kiểm tra hàng trước khi nhận không?",
        a: "Có, Tiệm luôn khuyến khích khách hàng kiểm tra sản phẩm trước khi thanh toán cho đơn hàng COD."
      }
    ]
  },
  {
    category: "ĐỔI TRẢ & BẢO HÀNH",
    questions: [
      {
        q: "Chính sách đổi trả của Tiệm như thế nào?",
        a: "Tiệm hỗ trợ đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm có lỗi từ nhà sản xuất hoặc bị hư hỏng trong quá trình vận chuyển."
      },
      {
        q: "Sản phẩm công nghệ có được bảo hành không?",
        a: "Tất cả sản phẩm công nghệ tại Tiệm đều được bảo hành chính hãng từ 6-12 tháng tùy thương hiệu."
      }
    ]
  },
  {
    category: "THANH TOÁN",
    questions: [
      {
        q: "Tiệm có những hình thức thanh toán nào?",
        a: "Tiệm hỗ trợ Thanh toán khi nhận hàng (COD), Chuyển khoản ngân hàng và các ví điện tử phổ biến."
      }
    ]
  }
];

export const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const filteredFaqs = FAQS.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
            CÂU HỎI <br />
            <span className="text-primary italic">THƯỜNG GẶP</span>
          </h1>
          <p className="text-muted-foreground font-medium text-lg max-w-md mx-auto">
            Mọi thứ bạn cần biết về mua sắm tại Tiệm Bách Hoá Hai Tụi Mình.
          </p>
        </div>

        <div className="relative mb-12 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm câu hỏi..."
            className="w-full h-16 pl-16 pr-6 rounded-3xl bg-surface-default border border-border/50 focus:border-primary/50 outline-none transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-12">
          {filteredFaqs.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary px-4">{cat.category}</h2>
              <div className="space-y-3">
                {cat.questions.map((q, qIdx) => {
                  const id = `${catIdx}-${qIdx}`;
                  const isOpen = openIndex === id;
                  return (
                    <div 
                      key={id}
                      className={cn(
                        "rounded-[32px] border border-border/50 overflow-hidden transition-all duration-500",
                        isOpen ? "bg-primary/5 border-primary/20" : "bg-surface-default hover:bg-surface-elevated"
                      )}
                    >
                      <button 
                        onClick={() => setOpenIndex(isOpen ? null : id)}
                        className="w-full p-6 md:p-8 flex items-center justify-between text-left gap-4"
                      >
                        <span className="font-black text-lg md:text-xl tracking-tight leading-tight">{q.q}</span>
                        <div className={cn(
                          "size-10 rounded-full border border-border/50 flex items-center justify-center transition-transform duration-500 shrink-0",
                          isOpen ? "rotate-180 bg-primary text-white border-primary" : ""
                        )}>
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          >
                            <div className="px-8 pb-8 text-muted-foreground font-medium text-lg leading-relaxed border-t border-primary/10 pt-6">
                              {q.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 p-12 rounded-[3rem] bg-foreground text-background text-center space-y-8">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Vẫn còn thắc mắc?</h2>
          <p className="font-medium opacity-70">Chúng mình luôn sẵn sàng lắng nghe và giải đáp mọi câu hỏi của bạn qua các kênh hỗ trợ.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://zalo.me/0931454176" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="font-black uppercase text-xs">CSKH Online</span>
            </a>
            <a href="tel:0931454176" className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors">
              <Phone className="w-5 h-5" />
              <span className="font-black uppercase text-xs">Hotline: 0931.454.176</span>
            </a>
          </div>
        </div>
    </div>
  );
};

