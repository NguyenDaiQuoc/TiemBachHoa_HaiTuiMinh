import React, { useState, useEffect } from "react";
import "../../css/contact.css";

// -------------------------
// Style Colors (Tailwind giữ nguyên)
// -------------------------
const COLORS = {
  primaryBg: "bg-[#E5D3BD]",
  secondaryBg: "bg-[#FBF8F5]",
  accentOrange: "bg-[#C75F4B]",
  accentGreen: "text-[#4A6D56]",
  textPrimary: "text-[#3C3C3C]",
};

// -------------------------
// Custom Input Component
// -------------------------
interface CustomInputProps {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  isTextArea?: boolean;
}

function CustomInput({
  label,
  placeholder,
  type = "text",
  required = false,
  isTextArea = false,
}: CustomInputProps) {
  return (
    <div className="contact-input-group">
      <label className={`contact-label ${COLORS.textPrimary}`}>
        {label} {required && <span className="required">*</span>}
      </label>

      {isTextArea ? (
        <textarea
          placeholder={placeholder}
          rows={5}
          required={required}
          className="contact-textarea"
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          required={required}
          className="contact-input"
        />
      )}
    </div>
  );
}

// -------------------------
// MAIN CONTACT PAGE
// -------------------------
export default function ContactPage() {
  const [searchValue, setSearchValue] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Logic hiện nút BackToTop
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowBackToTop(true);
      else setShowBackToTop(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fake Cart
  const cartItemsData = [
    { name: "Sản phẩm A", qty: 1, price: 100000, image: "https://picsum.photos/80" },
    { name: "Sản phẩm B", qty: 2, price: 50000, image: "https://picsum.photos/50" },
  ];

  const cartTotalCount = cartItemsData.reduce((s, i) => s + i.qty, 0);
  const cartTotalPrice = cartItemsData.reduce((s, i) => s + i.qty * i.price, 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  return (
    <div className="contact-wrapper">

      {/* ====================== HEADER ====================== */}
      <div className="header">
        <div className="header-container flex justify-between items-center p-4">
          <a href="/" className="header-logo-text font-bold text-lg">
            Tiệm Bách Hóa Hai Tụi Mình
          </a>

          {/* MENU */}
          <div className="header-menu flex gap-6">
            <a href="/">Trang chủ</a>
            <a href="/products">Sản phẩm</a>
            <a href="/combo">Combo & Ưu đãi</a>
            <a href="/blog">Blog</a>
            <a href="/contact" className="font-bold text-[#C75F4B]">Liên hệ</a>
          </div>

          {/* SEARCH + USER + CART */}
          <div className="header-icons">

            {/* SEARCH */}
            <div className="search-field">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>

            {/* USER */}
            <div
              className="relative"
              onMouseEnter={() => setIsUserDropdownOpen(true)}
              onMouseLeave={() => setIsUserDropdownOpen(false)}
            >
              <span className="user-icon">👤</span>

              {isUserDropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-list">
                    <a href="/profile">Thông tin cá nhân</a>
                    <a href="/wishlist">❤️ Yêu thích</a>
                    <a href="/orders">Đơn hàng</a>
                    <a href="/coupons">Mã giảm giá</a>
                    <a className="user-logout">Đăng xuất</a>
                  </div>
                </div>
              )}
            </div>

            {/* CART */}
            <div
              className="relative"
              onMouseEnter={() => setIsCartDropdownOpen(true)}
              onMouseLeave={() => setIsCartDropdownOpen(false)}
            >
              <span className="cart-dropdown">
                🛒
                {cartTotalCount > 0 && (
                  <span className="cart-count">{cartTotalCount}</span>
                )}
              </span>

              {isCartDropdownOpen && (
                <div className="cart-dropdown-menu">
                  <div className="cart-header">
                    Giỏ hàng ({cartTotalCount})
                  </div>

                  <ul className="cart-dropdown-list">
                    {cartItemsData.map((item, index) => (
                      <li key={index} className="cart-items">
                        <div className="cart-content">
                          <img src={item.image} alt={item.name} className="cart-img" />
                          <div>
                            <div className="cart-name">{item.name}</div>
                            <div className="cart-price">
                              SL: {item.qty} × {formatCurrency(item.price)}
                            </div>
                          </div>
                        </div>
                        <span className="cart-total">
                          {formatCurrency(item.qty * item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="cart-footer">
                    <div className="cart-totalprice">
                      <span>Tổng cộng:</span>
                      <span className="cart-totalprice-value">
                        {formatCurrency(cartTotalPrice)}
                      </span>
                    </div>

                    <button className="cart-checkout-button">
                      Xem Giỏ Hàng & Thanh Toán
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====================== CONTENT ====================== */}
      <main className="contact-container">
        <h1 className="contact-title">Liên Hệ Với Chúng Tôi</h1>

        <p className="contact-desc">
          “Nhà Hai Đứa” luôn sẵn sàng lắng nghe và hỗ trợ bạn.
        </p>

        <div className="contact-grid">

          {/* LEFT FORM */}
          <section className="contact-form-card">
            <h2 className="contact-form-title">Gửi Yêu Cầu Hỗ Trợ</h2>

            <form className="form-fields">

              <div className="form-grid-2">
                <CustomInput
                  label="Họ và Tên"
                  placeholder="Ví dụ: Trần Văn C"
                  required
                />
                <CustomInput
                  label="Email"
                  placeholder="Ví dụ: email@domain.com"
                  type="email"
                  required
                />
              </div>

              <CustomInput
                label="Số Điện Thoại"
                placeholder="090xxxxxxx"
                type="tel"
              />

              <CustomInput
                label="Tiêu đề"
                placeholder="Bạn cần hỗ trợ vấn đề gì?"
                required
              />

              <CustomInput
                label="Nội dung chi tiết"
                placeholder="Hãy mô tả chi tiết yêu cầu của bạn..."
                isTextArea
                required
              />

              <button type="submit" className="contact-submit-btn">
                Gửi Yêu Cầu
              </button>
            </form>
          </section>

          {/* RIGHT INFO */}
          <aside className="contact-right">
            <div className="contact-info-card">
              <h3 className="info-title">Thông Tin Liên Lạc</h3>

              <div className="info-list">
                <p><span>📞</span> <strong>Hotline:</strong> 090 123 4567</p>
                <p><span>📧</span> <strong>Email:</strong> support@nhahaidua.vn</p>
                <p><span>📍</span> <strong>Địa chỉ:</strong> 123 Đường Sạch Đẹp, Q.7, TP.HCM</p>
                <p className="worktime">Thời gian: 8h00 – 17h00 (T2 – T6)</p>
              </div>
            </div>

            <div className="contact-map-card">
              <h3 className="map-title">Văn Phòng / Kho Hàng</h3>

              <div className="map-wrapper">
                <iframe
                  className="map-iframe"
                  loading="lazy"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.164985242964!2d106.7017553!3d10.8007398!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528dabcac5809%3A0x8c953c0c8a57e4!2zUGjGsOG7nW5nIDEgLSBRdeG6rW4gNw!5e0!3m2!1svi!2s!4v1700000000000"
                ></iframe>
              </div>

              <p className="map-note">(Bản đồ chỉ đường thực tế)</p>
            </div>
          </aside>
        </div>
      </main>

      {/* ====================== FOOTER ====================== */}
      <footer className="site-footer">
        <div className="footer-container">

          <div className="footer-section">
            <span className="footer-title">Tiệm Bách Hóa Hai Tụi Mình</span>
            <p className="footer-text">
              Giao nhanh tận nơi. Cảm ơn bạn đã tin chọn cửa hàng của chúng mình.
            </p>
            <h4 className="footer-title">Liên kết</h4>

            <div className="social-container">
              <a
                target="_blank"
                href="https://www.facebook.com/profile.php?id=61576489061227"
                className="social-btn facebook"
              >
                <i className="fab fa-facebook-f"></i> Facebook
              </a>

              <a href="#" className="social-btn shopee">
                <i className="fab fa-shopee"></i> Shopee
              </a>

              <a href="#" className="social-btn tiktok">
                <i className="fab fa-tiktok"></i> TikTok
              </a>

              <a href="#" className="social-btn instagram">
                <i className="fab fa-instagram"></i> Instagram
              </a>
            </div>
          </div>

          <div className="footer-section">
            <span className="footer-title">Hỗ trợ khách hàng</span>
            <ul className="footer-list">
              <li><a href="/terms">Điều khoản và quy định chung</a></li>
              <li><a href="/return-policy">Chính sách đổi trả & hoàn tiền</a></li>
              <li><a href="/shipping-policy">Chính sách vận chuyển & giao nhận</a></li>
              <li><a href="/warranty">Chính sách bảo hành sản phẩm</a></li>
              <li><a href="/purchase-guide">Hướng dẫn mua hàng</a></li>
              <li><a href="/payment-methods">Quy định và hình thức thanh toán</a></li>
              <li><a href="/faq">Các câu hỏi thường gặp (FAQs)</a></li>
            </ul>

            <h4 className="footer-title mt-4">Hình thức thanh toán</h4>
            <div className="footer-icons">
              <img src="/images/payment-cod.png" alt="CoD" className="payment-icon" />
              <img src="/images/payment-banking.png" alt="Banking" className="payment-icon" />
              <img src="/images/payment-cash.png" alt="Tiền mặt" className="payment-icon" />
              <img src="/images/payment-zalopay.png" alt="ZaloPay" className="payment-icon" />
              <img src="/images/payment-momo.png" alt="Momo" className="payment-icon" />
              <img src="/images/payment-vnpay.png" alt="VNPay" className="payment-icon" />
            </div>
          </div>

          <div className="footer-section">
            <span className="footer-title">Về Tiệm</span>
            <ul className="footer-list">
              <li><a href="/about">Giới thiệu</a></li>
              <li><a href="/story">Câu chuyện</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/tips">Góc nội trợ & mẹo vặt cuộc sống</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <span className="footer-title">Nhận bản tin</span>
            <div className="newsletter">
              <input type="text" placeholder="Email của bạn" className="newsletter-input" />
              <button className="newsletter-button">Gửi</button>
            </div>
          </div>
        </div>

        <div className="footer_bottom">
          <p className="footer_copyright">© 2025 Bách Hóa Nhà Hai Đứa. All rights reserved.</p>
        </div>
      </footer>

      {/* ===================== FLOATING BUTTONS ===================== */}
      {/* KÉO LÊN ĐẦU TRANG */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="floating-backtotop"
        >
          ⬆
        </button>
      )}

      {/* CHAT ICON */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="floating-chat"
      >
        💬
      </button>

      {/* CHAT BOX */}
      {isChatOpen && (
        <div className="chat-box">
          <div className="chat-header">Chat với Nhà Hai Đứa</div>
          <div className="chat-body">👉 Tính năng chat đang phát triển...</div>
        </div>
      )}

      {/* SOCIAL FLOATING
      <div className="floating-social">
        <a href="https://facebook.com" target="_blank"><FaFacebook /></a>
        <a href="https://instagram.com" target="_blank"><FaInstagram /></a>
        <a href="https://maps.google.com" target="_blank"><FaMapMarkerAlt /></a>
      </div> */}
    </div>
  );
}
