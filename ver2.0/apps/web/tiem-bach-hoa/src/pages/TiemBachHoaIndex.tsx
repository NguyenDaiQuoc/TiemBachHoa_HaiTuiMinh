import React, { useState } from "react";
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
//    COMPONENT CHÍNH
// =========================
export default function TiemBachHoaIndex() {
  // ─── State bị thiếu (đã bổ sung) ───────────────────────────
  const [searchValue, setSearchValue] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);

  const cartItemsData = [
    { name: "Sản phẩm A", qty: 1, price: 100000, image: "https://picsum.photos/80" },
    { name: "Sản phẩm B", qty: 2, price: 50000, image: "https://picsum.photos/50" },
  ];

  const cartTotalCount = cartItemsData.reduce((sum, i) => sum + i.qty, 0);
  const cartTotalPrice = cartItemsData.reduce((sum, i) => sum + i.qty * i.price, 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // ───────────────────────────────────────────────────────────

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
                <div
                  className={`user-dropdown `}
                >
                  {/* <div className="user-dropdown-header">Tài khoản của tôi</div> */}
                  <div className="user-dropdown-list">
                    <a href="/profile">Thông tin cá nhân</a>
                    <a href="/wishlist">❤️ Danh mục yêu thích</a>
                    <a href="/orders">Đơn mua hàng</a>
                    <a href="/coupons">Mã giảm giá</a>
                    <a className="user-logout">
                      Đăng xuất
                    </a>
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
                  <span className="cart-count">
                    {cartTotalCount}
                  </span>
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
                      <span className="cart-totalprice-value">{formatCurrency(cartTotalPrice)}</span>
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
          <h1 className="hero-title">
            Những điều nhỏ xinh làm nên tổ ấm
          </h1>
          <button className={`hero-button`}>
            Khám Phá Ngay
          </button>
        </div>
      </div>

      {/* <!-- DANH MỤC --> */}
      <div className="relative">
        <h2 className="category-title">Danh Mục Nổi Bật</h2>

        <a
          href="/categories"
          className="view-more-floating"
        >
          Xem thêm →
        </a>

        <div className="category-grid">
          {categories.map((cat) => (
            <CategoryCard key={cat.name} {...cat} />
          ))}
        </div>
      </div>


      {/*SẢN PHẨM HOT SALES*/}
      <div className="relative">
        <h2 className="section-title">Sản Phẩm Giảm Giá Sốc</h2>

        <a
          href="/sale"
          className="view-more-floating"
        >
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


      {/* SẢN PHẨM MỚI*/}
      <div className="relative">
        <h2 className="section-title">Sản Phẩm Mới</h2>

        <a
          href="/products"
          className="view-more-floating"
        >
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
          <img   src="https://via.placeholder.com/300x500/E5D3BD?text=Hero%20Image"  />
        </div>

        <div className="story-content">
          <h2 className="story-title">Câu chuyện nhà Hai Đứa</h2>
          <p className="story-text">
            Tụi mình tin những điều nhỏ bé, chân thật tạo nên tổ ấm...
          </p>
          <button className="story-button">Đọc thêm</button>
        </div>
      </div>


      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-section">
            <span className="footer-title">Tiệm Bách Hóa</span>
            <p>Địa chỉ: 55 Lý Tự Trọng</p>
            <p>Hotline: 090xxxxxx</p>
          </div>
          <div className="footer-section">
            <span className="footer-title">Hỗ trợ khách hàng</span>
            <ul className="footer-list">
              <li>Chính sách đổi trả</li>
              <li>Hướng dẫn mua hàng</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div className="footer-section">
            <span className="footer-title">Về Tiệm</span>
            <ul className="footer-list">
              <li>Giới thiệu</li>
              <li>Blog</li>
            </ul>
          </div>
          <div className="footer-section">
            <span className="footer-title">Nhận bản tin</span>
            <div className="newsletter">
              <input type="text" placeholder="Email của bạn" className="newsletter-input" />
              <button className="newsletter-button">Gửi</button>
            </div>
            <div className="footer-icons">
              <FaFacebook />
              <FaInstagram />
              <FaMapMarkerAlt />
            </div>
          </div>
        </div>
      </footer>


    </div>
  );
}
