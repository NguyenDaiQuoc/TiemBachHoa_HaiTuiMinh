import React, { useState, useEffect } from "react";

export default function FloatingButtons() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Hiện nút Back to Top khi scroll qua Hero
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight =
        document.querySelector(".hero-wrapper")?.clientHeight || 500;

      setShowBackToTop(window.scrollY > heroHeight - 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="floating-buttons">

      {/* BACK TO TOP */}
      {showBackToTop && (
        <div
          className="float-btn backtotop"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ⬆
        </div>
      )}

      {/* ZALO */}
      <a
        href="https://zalo.me/0931454176"
        target="_blank"
        className="float-btn zalo"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
          alt="Zalo"
        />
      </a>

      {/* MESSENGER */}
      <a
        href="https://m.me/61576489061227"
        target="_blank"
        className="float-btn messenger"
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/63/Facebook_Messenger_logo_2025.svg"
          alt="Messenger"
        />
      </a>

      {/* CHATBOT */}
      <div className="chatbot-wrapper">
        <span className="chatbot-tooltip">Chat với Chat Bot</span>

        <div
          className="float-btn chatbot-btn"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          💬
        </div>

        {isChatOpen && (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <span>Chat với Hai Tụi Mình</span>
              <button onClick={() => setIsChatOpen(false)}>✖</button>
            </div>

            <div className="chatbot-body">
              <div className="chatbot-message bot">
                Xin chào 👋 Bạn muốn tìm sản phẩm nào ạ?
              </div>
            </div>

            <div className="chatbot-input-wrapper">
              <input className="chatbot-input" placeholder="Nhập tin nhắn..." />
              <button className="chatbot-send">Gửi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
