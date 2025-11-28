import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/faq.css";

export default function FAQPage() {
  const faqData = [
    {
      category: "Vận Chuyển & Giao Nhận",
      questions: [
        {
          q: "Thời gian giao hàng tiêu chuẩn là bao lâu?",
          a: "Đơn hàng nội thành Hà Nội/TP.HCM thường được giao trong 1-2 ngày...",
        },
        {
          q: "Tiệm Bách Hóa có miễn phí vận chuyển không?",
          a: "Miễn phí cho đơn hàng từ 500.000 VNĐ trở lên.",
        },
        {
          q: "Tôi có thể theo dõi đơn hàng bằng cách nào?",
          a: "Bạn sẽ nhận được mã vận đơn qua email sau khi gửi hàng.",
        },
      ],
    },
    {
      category: "Thanh Toán & Hóa Đơn",
      questions: [
        {
          q: "Tiệm Bách Hóa chấp nhận thanh toán nào?",
          a: "Visa/Mastercard, chuyển khoản và COD.",
        },
        {
          q: "Có nhận hóa đơn VAT không?",
          a: "Có. Vui lòng cung cấp thông tin trong ghi chú đơn hàng.",
        },
      ],
    },
    {
      category: "Đổi Trả & Bảo Hành",
      questions: [
        {
          q: "Chính sách đổi trả như thế nào?",
          a: "Đổi trả trong 7 ngày nếu sản phẩm còn nguyên tem mác.",
        },
        {
          q: "Gốm sứ có bảo hành không?",
          a: "Không bảo hành vỡ, nhưng hỗ trợ nếu có video mở hộp.",
        },
      ],
    },
  ];

  const [activeCategory, setActiveCategory] = useState(faqData[0].category);
  const activeQuestions = faqData.find((c) => c.category === activeCategory)?.questions || [];

  return (
    <div className="faq-page">
      <Header />

      <div className="faq-container">
        {/* Title */}
        <header className="faq-header">
          <h1 className="faq-title">Câu Hỏi Thường Gặp (FAQs)</h1>
          <p className="faq-subtitle">
            Tìm câu trả lời cho mọi thắc mắc về sản phẩm và dịch vụ.
          </p>
        </header>

        {/* Search Bar */}
        <div className="faq-search-box">
          <input type="search" placeholder="Tìm kiếm câu trả lời..." className="faq-search" />
        </div>

        <div className="faq-content">
          {/* Left Sidebar */}
          <aside className="faq-sidebar">
            <h2 className="sidebar-title">Chủ Đề</h2>
            <nav className="sidebar-list">
              {faqData.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveCategory(cat.category)}
                  className={`sidebar-item ${activeCategory === cat.category ? "active" : ""}`}
                >
                  {cat.category} ({cat.questions.length})
                </button>
              ))}
            </nav>
          </aside>

          {/* Right Content */}
          <section className="faq-questions">
            <h2 className="category-title">{activeCategory}</h2>
            <div className="question-list">
              {activeQuestions.map((item, index) => (
                <AccordionItem key={index} question={item.q} answer={item.a} />
              ))}
            </div>

            {activeQuestions.length === 0 && (
              <div className="empty-text">Không tìm thấy câu hỏi nào.</div>
            )}
          </section>
        </div>

        {/* CTA */}
        <div className="faq-cta">
          <h3 className="cta-title">Vẫn chưa tìm thấy câu trả lời?</h3>
          <p className="cta-text">Liên hệ đội ngũ hỗ trợ của chúng tôi.</p>
          <button className="cta-button">Gửi Yêu Cầu Hỗ Trợ</button>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(!open)}>
        <span>{question}</span>
        <span className="faq-toggle">{open ? "−" : "+"}</span>
      </button>

      {open && <div className="faq-answer">{answer}</div>}
    </div>
  );
}
