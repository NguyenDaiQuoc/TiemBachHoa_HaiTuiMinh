import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";

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
    <div className="product-card cursor-pointer">
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
    <div className="category-card cursor-pointer">
      <div className="category-image-wrapper">
        <img src={image} alt={name} className="category-image" />
      </div>
      <span className="category-name">{name}</span>
    </div>
  );
}

// ------------------- Overlay Banner + Floating -------------------
const OVERLAY_KEY = "overlayClosedDate";

function OverlayBanner({ imageSrc }: { imageSrc: string }) {
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(false);
  const [fadeClass, setFadeClass] = useState("opacity-0");
  const [showFloating, setShowFloating] = useState(false);
  const [floatingExpanded, setFloatingExpanded] = useState(false);

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });

  // --- Thời gian đếm ngược --- //
  const SALE_END_DATE = new Date();
  SALE_END_DATE.setDate(SALE_END_DATE.getDate() + 1); // ví dụ: kết thúc sau 1 ngày

  const calculateCountdown = () => {
    const now = new Date().getTime();
    const distance = SALE_END_DATE.getTime() - now;

    if (distance <= 0) {
      return { days: 0, hours: 0, mins: 0, secs: 0 };
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((distance % (1000 * 60)) / 1000);

    return { days, hours, mins, secs };
  };

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const closedDate = localStorage.getItem(OVERLAY_KEY);

    if (closedDate == today) {
      setShowOverlay(true);
      setTimeout(() => setFadeClass("opacity-100 transition-opacity duration-500"), 50);

      const timer = setTimeout(() => closeOverlay(), 7000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timer;
    if (showFloating) {
      interval = setInterval(() => setCountdown(calculateCountdown()), 1000);
    }
    return () => clearInterval(interval);
  }, [showFloating]);

  const closeOverlay = () => {
    setFadeClass("opacity-0 transition-opacity duration-500");
    setTimeout(() => {
      setShowOverlay(false);
      setShowFloating(true);
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(OVERLAY_KEY, today);
    }, 500);
  };

  const handleNavigate = () => {
    navigate("/sales");
    setShowFloating(false);
  };

  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          className={`modal-overlay ${fadeClass}`}
          style={{ backdropFilter: "blur(2px)" }}
          onClick={handleNavigate}
        >
          <div className="relative">
            <img src={imageSrc} alt="Overlay Banner" className="image-card cursor-pointer" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeOverlay();
              }}
              className="close-button"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Floating mini icon trái */}
      {showFloating && (
        <div
          className={`floating-button ${floatingExpanded ? "expanded" : "collapsed"}`}
          onMouseEnter={() => setFloatingExpanded(true)}
          onMouseLeave={() => setFloatingExpanded(false)}
        >
          {/* Icon thu nhỏ */}
          {!floatingExpanded && (
            <img
              src="/blackfriday.ico"
              alt="Black Friday"
              className="floating-icon collapsed"
              onClick={handleNavigate}
            />
          )}

          {/* Panel mở rộng */}
          {floatingExpanded && (
            <div className="floating-panel expanded">

              {/* Nút X */}
              <button
                className="close-floating"
                onClick={(e) => {
                  e.stopPropagation();
                  setFloatingExpanded(false);
                }}
              >
                &times;
              </button>

              {/* Icon lớn */}
              {/* <img
                src="/blackfriday.ico"
                alt="Black Friday"
                className="floating-icon expanded"
                onClick={handleNavigate}
              /> */}

              {/* Countdown */}
              <div className="flash-sale-text">
                Mừng BlackFriday - Giảm giá đến 60%<br />
                Còn: {countdown.days}d {countdown.hours}h {countdown.mins}m {countdown.secs}s kết thúc giảm giá
              </div>
              <button
                onClick={handleNavigate}
                className="sale-redirect"
              >
                Mua sắm ngay →
              </button>

            </div>
          )}
        </div>
      )}


    </>
  );
}

// =========================
//        COMPONENT INDEX
// =========================
export default function TiemBachHoaIndex() {
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = document.querySelector(".hero-wrapper")?.clientHeight || 500;
      setShowBackToTop(window.scrollY > heroHeight - 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartItemsData = [
    { name: "Sản phẩm A", qty: 1, price: 100000, image: "https://picsum.photos/80" },
    { name: "Sản phẩm B", qty: 2, price: 50000, image: "https://picsum.photos/50" },
  ];

  const products = [
    { name: "Nến thơm thư giãn", price: "180.000đ", oldPrice: "200.000đ", tag: "Mới", image: "https://picsum.photos/100" },
    { name: "Bánh quy yến mạch", price: "150.000đ", oldPrice: "180.000đ", tag: "Hot", image: "https://picsum.photos/80" },
    { name: "Khăn quấn organic", price: "150.000đ", tag: null, image: "https://picsum.photos/20" },
  ];

  const categories = [
    { name: "Hàng mới về", image: "https://picsum.photos/50" },
    { name: "Đồ công nghệ", image: "https://picsum.photos/70" },
    { name: "Chăm sóc cá nhân", image: "https://picsum.photos/30" },
    { name: "Vệ sinh nhà cửa", image: "https://picsum.photos/90" },
  ];

  return (
    <div className="wrapper">
      <Header />

      {/* Overlay Banner global */}
      <OverlayBanner imageSrc="/images/blackfriday.png" />

      {/* HERO SECTION */}
      <div className="hero-wrapper cursor-pointer" onClick={() => navigate("/products")}>
        <img src="/images/hero-img.png" className="hero-img" alt="Hero" />
        <div className="hero-overlay" style={{ pointerEvents: "none" }}></div>
      </div>

      {/* DANH MỤC */}
      <div className="relative">
        <h2 className="category-title">Danh Mục Nổi Bật</h2>
        <a href="/categories" className="view-more-floating cate">
          Xem thêm →
        </a>
        <div className="category-grid">
          {categories.map((cat) => (
            <div key={cat.name} onClick={() => navigate("/products")}>
              <CategoryCard {...cat} />
            </div>
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
              <div key={index} onClick={() => navigate("/products")}>
                <ProductCard {...p} />
              </div>
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
              <div key={index} onClick={() => navigate("/products")}>
                <ProductCard {...p} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CÂU CHUYỆN */}
      <div className="story-wrapper">
        <div className="story-img">
          <img
            src="https://via.placeholder.com/300x500/E5D3BD?text=Hero%20Image"
            alt="Story"
          />
        </div>
        <div className="story-content">
          <h2 className="story-title">Câu chuyện nhà Hai Đứa</h2>
          <p className="story-text">
            Tụi mình tin những điều nhỏ bé, chân thật tạo nên tổ ấm...
          </p>
          <button className="story-button">Đọc thêm</button>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}
