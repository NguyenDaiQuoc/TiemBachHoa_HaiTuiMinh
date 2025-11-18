import React, { useState, useEffect } from "react";
import { FaFacebook, FaInstagram, FaMapMarkerAlt } from "react-icons/fa";

// --- Định nghĩa các giá trị Style ---
const COLORS = {
  primaryBg: "bg-[#E5D3BD]",
  secondaryBg: "bg-[#FBF8F5]",
  accentOrange: "bg-[#C75F4B]",
  accentGreen: "text-[#4A6D56]",
  textPrimary: "text-[#3C3C3C]",
};

// --- Kiểu dữ liệu cho props ---
type ProductCardProps = {
  image: string;
  name: string;
  price: string;
  oldPrice?: string;
  tag?: string | null;
};

type CategoryCardProps = {
  image: string;
  name: string;
};

// --- Component Card Sản Phẩm ---
function ProductCard({ image, name, price, oldPrice, tag }: ProductCardProps) {
  const isSale = oldPrice !== undefined;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <div className="product-image-container">
          <img src={image} alt={name} className="product-image" />
        </div>

        {tag && <span className="product-tag">{tag}</span>}
      </div>

      <span className="product-name">{name}</span>

      <div className="product-price-row">
        <span className="product-price">{price}</span>
        {isSale && <span className="product-old-price">{oldPrice}</span>}
      </div>
    </div>
  );
}

// --- Component Card Danh mục ---
function CategoryCard({ image, name }: CategoryCardProps) {
  return (
    <div className="category-card">
      <div className="category-image-wrapper">
        <img src={image} alt={name} className="category-image" />
      </div>

      <span className="category-name">{name}</span>
    </div>
  );
}

// =========================
//        COMPONENT INDEX
// =========================
export default function TiemBachHoaIndex() {
  // ─ STATE ─────────────────────────────────────
  const [searchValue, setSearchValue] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // ─ LOGIC BackToTop chỉ hiện khi OUT HERO SECTION ─────────
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = document.querySelector(".hero-wrapper")?.clientHeight || 500;

      if (window.scrollY > heroHeight - 100) setShowBackToTop(true);
      else setShowBackToTop(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─ GIỎ HÀNG TEST DATA ───────────────────────────────
  const cartItemsData = [
    { name: "Sản phẩm A", qty: 1, price: 100000, image: "https://picsum.photos/80" },
    { name: "Sản phẩm B", qty: 2, price: 50000, image: "https://picsum.photos/50" },
  ];

  const cartTotalCount = cartItemsData.reduce((sum, i) => sum + i.qty, 0);
  const cartTotalPrice = cartItemsData.reduce((sum, i) => sum + i.qty * i.price, 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // ─ DỮ LIỆU GIẢ ──────────────────────────────────────
  const products = [
    { name: "Nến thơm thư giãn", price: "180.000đ", oldPrice: "200.000đ", tag: "Mới", image: "https://picsum.photos/100" },
    { name: "Bánh quy yến mạch", price: "150.000đ", oldPrice: "180.000đ", tag: "Hot", image: "https://picsum.photos/80" },
    { name: "Khăn quấn organic", price: "150.000đ", tag: null, image: "https://picsum.photos/20" },
    { name: "Bộ bát đĩa gốm", price: "350.000đ", tag: null, image: "https://picsum.photos/30" },
  ];

  const categories = [
    { name: "Đồ dùng bếp", image: "https://picsum.photos/50" },
    { name: "Nhu yếu phẩm", image: "https://picsum.photos/70" },
    { name: "Gia vị & Thực phẩm", image: "https://picsum.photos/30" },
    { name: "Đồ uống & Trà", image: "https://picsum.photos/90" },
  ];

  return (
    <div className="wrapper">

      {/* HEADER */}
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
            <a href="/contact">Liên hệ</a>
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
                    <a href="/wishlist">❤️ Danh mục yêu thích</a>
                    <a href="/orders">Đơn mua hàng</a>
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
                    Giỏ hàng ({cartTotalCount} sản phẩm)
                  </div>

                  <ul className="cart-dropdown-list">
                    {cartItemsData.map((item, index) => (
                      <li key={index} className="cart-items">
                        <div className="cart-content">
                          <img src={item.image} alt={item.name} className="cart-img" />
                          <div>
                            <div className="cart-name">{item.name}</div>
                            <div className="cart-price">
                              SL: {item.qty} x {formatCurrency(item.price)}
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

      {/* HERO SECTION */}
      <div className="hero-wrapper">
        <img
          src="https://via.placeholder.com/300x500/E5D3BD?text=Hero%20Image"
          className="hero-img"
        />

        <div className="hero-overlay"></div>

        <div className="hero-content">
          <h1 className="hero-title">Những điều nhỏ xinh làm nên tổ ấm</h1>
          <button className="hero-button">Khám Phá Ngay</button>
        </div>
      </div>

      {/* DANH MỤC */}
      <div className="relative">
        <h2 className="category-title">Danh Mục Nổi Bật</h2>

        <a href="/categories" className="view-more-floating cate">
          Xem thêm →
        </a>

        <div className="category-grid">
          {categories.map((cat) => (
            <CategoryCard key={cat.name} {...cat} />
          ))}
        </div>
      </div>

      {/* HOT SALES */}
      <div className="relative">
        <h2 className="section-title">Sản Phẩm Giảm Giá Sốc</h2>

        <a href="/sale" className="view-more-floating sale">
          Xem thêm →
        </a>

        <div className="product-wrapper">
          <div className="product-grid">
            {products.map((p, index) => (
              <ProductCard key={index} {...p} />
            ))}
          </div>
        </div>
      </div>

      {/* SẢN PHẨM MỚI */}
      <div className="relative">
        <h2 className="section-title">Sản Phẩm Mới</h2>

        <a href="/products" className="view-more-floating">
          Xem thêm →
        </a>

        <div className="product-wrapper">
          <div className="product-grid">
            {products.map((p, index) => (
              <ProductCard key={index} {...p} />
            ))}
          </div>
        </div>
      </div>

      {/* CÂU CHUYỆN */}
      <div className="story-wrapper">
        <div className="story-img">
          <img src="https://via.placeholder.com/300x500/E5D3BD?text=Hero%20Image" />
        </div>

        <div className="story-content">
          <h2 className="story-title">Câu chuyện nhà Hai Đứa</h2>
          <p className="story-text">
            Tụi mình tin những điều nhỏ bé, chân thật tạo nên tổ ấm...
          </p>
          <button className="story-button">Đọc thêm</button>
        </div>
      </div>

      {/* FLOATING BUTTONS */}
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


      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-container">

          {/* GIỚI THIỆU */}
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
          

          {/* HỖ TRỢ KHÁCH HÀNG */}
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

          {/* VỀ TIỆM */}
          <div className="footer-section">
            <span className="footer-title">Về Tiệm</span>
            <ul className="footer-list">
              <li><a href="/about">Giới thiệu</a></li>
              <li><a href="/story">Câu chuyện</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/tips">Góc nội trợ & mẹo vặt cuộc sống</a></li>
            </ul>
          </div>

          {/* NHẬN BẢN TIN & THANH TOÁN */}
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

    </div>
  );
}
