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
    <div className="home-product-card cursor-pointer fade-in-section">
      <div className="home-product-image-wrapper">
        <div className="home-product-image-container">
          <img src={image} alt={name} className="home-product-image" />
        </div>
        {tag && <span className="home-product-tag">{tag}</span>}
      </div>
      <span className="home-product-name">{name}</span>
      <div className="home-product-price-row">
        <span className="home-product-price">{price}</span>
        {isSale && <span className="home-product-old-price">{oldPrice}</span>}
      </div>
    </div>
  );
}

// --- Component Card Danh mục ---
function CategoryCard({ image, name }: CategoryCardProps) {
  return (
    <div className="category-card cursor-pointer fade-in-section">
      <div className="category-image-wrapper">
        <img src={image} alt={name} className="category-image" />
      </div>
      <span className="category-name">{name}</span>
    </div>
  );
}

// ------------------- Button Xem Thêm (Custom CSS thuần) -------------------
function ViewMoreButton({ text, onClick }: { text: string; onClick: () => void }) {
    // SỬ DỤNG CLASS CSS: custom-view-more-button
    return (
        <button 
            onClick={onClick}
            // Class CSS thuần đã được thay đổi
            className="custom-view-more-button" 
        >
            {/* Tên nút */}
            {text} 
            
            {/* Icon mũi tên (thay cho ký tự ->) */}
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="arrow-icon" // Class CSS cho icon
            >
                <path d="M5 12l14 0" />
                <path d="M15 16l4 -4" />
                <path d="M15 8l4 4" />
            </svg>
        </button>
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

  const SALE_END_DATE = new Date();
  SALE_END_DATE.setDate(SALE_END_DATE.getDate() + 1);

  const calculateCountdown = () => {
    const now = new Date().getTime();
    const distance = SALE_END_DATE.getTime() - now;

    if (distance <= 0) return { days: 0, hours: 0, mins: 0, secs: 0 };

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((distance % (1000 * 60)) / 1000);

    return { days, hours, mins, secs };
  };

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const closedDate = localStorage.getItem(OVERLAY_KEY);

    if (closedDate != today) {
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

      {showFloating && (
        <div
          className={`floating-button ${floatingExpanded ? "expanded" : "collapsed"}`}
          onMouseEnter={() => setFloatingExpanded(true)}
          onMouseLeave={() => setFloatingExpanded(false)}
        >
          {!floatingExpanded && (
            <img
              src="/blackfriday.ico"
              alt="Black Friday"
              className="floating-icon collapsed"
              onClick={handleNavigate}
            />
          )}

          {floatingExpanded && (
            <div
              className="floating-panel expanded"
              style={{
                backgroundImage: "url('/sale_background.png')",
                alignItems: "center",
                backgroundSize: "cover",
                backgroundPosition: "center",
                
              }}
            >
              <button
                className="close-floating"
                onClick={(e) => {
                  e.stopPropagation();
                  setFloatingExpanded(false);
                }}
              >
                &times;
              </button>

              <div className="flash-sale-text">
                {/* Mừng BlackFriday - Giảm giá đến 60%<br /> */}
                Còn: {countdown.days}d {countdown.hours}h {countdown.mins}m {countdown.secs}s kết thúc giảm giá
              </div>
              <button onClick={handleNavigate} className="sale-redirect">
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
//         COMPONENT INDEX
// =========================
export default function TiemBachHoaIndex() {
  const navigate = useNavigate();

  const [products] = useState([
    { name: "Nến thơm thư giãn", price: "180.000đ", oldPrice: "200.000đ", tag: "Mới", image: "https://picsum.photos/100" },
    { name: "Bánh quy yến mạch", price: "150.000đ", oldPrice: "180.000đ", tag: "Hot", image: "https://picsum.photos/80" },
    { name: "Khăn quấn organic", price: "150.000đ", tag: null, image: "https://picsum.photos/20" },
  ]);

  const [categories] = useState([
    { name: "Hàng mới về", image: "https://picsum.photos/50" },
    { name: "Đồ công nghệ", image: "https://picsum.photos/70" },
    { name: "Chăm sóc cá nhân", image: "https://picsum.photos/30" },
    { name: "Vệ sinh nhà cửa", image: "https://picsum.photos/90" },
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-visible");
            entry.target.classList.remove("fade-out-section");
          } else {
            entry.target.classList.remove("fade-in-visible");
            entry.target.classList.add("fade-out-section");
          }
        });
      },
      { threshold: 0.2 }
    );

    const elements = document.querySelectorAll(".fade-in-section");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="wrapper">
      <Header />
      <OverlayBanner imageSrc="/images/blackfriday.png" />

      {/* HERO */}
      <div className="hero-wrapper cursor-pointer fade-in-section" onClick={() => navigate("/products")}>
        <img src="/images/hero-img.png" className="hero-img" alt="Hero" />
      </div>

      {/* Categories */}
      <div className="relative fade-in-section"> 
        <div className="home-section-header">
            <h2 className="category-title">Danh Mục Nổi Bật</h2>
            {/* BUTTON XEM THÊM DANH MỤC */}
            <ViewMoreButton text="Xem thêm" onClick={() => navigate("/categories")} />
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <div key={cat.name} onClick={() => navigate("/products")}>
              <CategoryCard {...cat} />
            </div>
          ))}
        </div>
      </div>

    

      {/* HOT SALES */}
      <div className="relative fade-in-section">
        <div className="home-section-header">
            <h2 className="home-section-title">Sản Phẩm Giảm Giá Sốc</h2>
            {/* BUTTON XEM THÊM SALE */}
            <ViewMoreButton text="Xem thêm" onClick={() => navigate("/sales")} />
        </div>
        <div className="home-product-wrapper">
          <div className="home-product-grid">
            {products.map((p, index) => (
              <div key={index} onClick={() => navigate("/products")}>
                <ProductCard {...p} />
              </div>
            ))}
          </div>
        </div>
      </div>

      

      {/* SẢN PHẨM MỚI */}
      <div className="relative fade-in-section">
        <div className="home-section-header">
            <h2 className="home-section-title">Sản Phẩm Mới</h2>
            {/* BUTTON XEM THÊM SẢN PHẨM MỚI */}
            <ViewMoreButton text="Xem thêm" onClick={() => navigate("/new-product")} />
        </div>
        <div className="home-product-wrapper">
          <div className="home-product-grid">
            {products.map((p, index) => (
              <div key={index} onClick={() => navigate("/products")}>
                <ProductCard {...p} />
              </div>
            ))}
          </div>
        </div>
      </div>

      

      {/* CÂU CHUYỆN */}
      <div className="story-wrapper fade-in-section">
        <div className="story-img">
          <img
            src="/images/story.png"
            alt="Story"
          />
        </div>
        <div className="story-content">
          <h2 className="story-title">Câu chuyện nhà Hai Đứa</h2>
          <p className="story-text">
            Tụi mình tin rằng một ngôi nhà đầy đủ tiện nghi và đồ dùng chất lượng giúp mỗi ngày trở của bạn nên dễ dàng và vui hơn 🫶...

          </p>
          <button className="story-button">Đọc thêm</button>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}