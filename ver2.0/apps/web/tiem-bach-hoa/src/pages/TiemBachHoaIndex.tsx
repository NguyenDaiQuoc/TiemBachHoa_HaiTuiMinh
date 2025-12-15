import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy, where, limit } from "firebase/firestore";
import { addToCart } from "../utils/cart";
import { showSuccess, showError } from "../utils/toast";

// --- Kiểu dữ liệu cho props ---
type ProductCardProps = {
  id: string;
  image: string;
  name: string;
  price: string;
  oldPrice?: string;
  tag?: string | null;
  onShowLoginWarning?: () => void;
};

type CategoryCardProps = {
  icon: string;
  name: string;
};

// --- Component Card Sản Phẩm ---
function ProductCard({ id, image, name, price, oldPrice, tag, onShowLoginWarning }: ProductCardProps) {
  const navigate = useNavigate();
  const isSale = oldPrice !== undefined;
  
  // Xử lý image có thể là string hoặc array
  let imageUrl = '';
  if (image) {
    if (Array.isArray(image) && image.length > 0) {
      imageUrl = image[0];
    } else if (typeof image === 'string') {
      imageUrl = image;
    }
  }

  // Parse giá từ string sang number (loại bỏ 'đ' và dấu phẩy)
  const priceNum = typeof price === 'string' ? parseFloat(price.replace(/[^đd.,\d]/g, '').replace(/,/g, '')) : (typeof price === 'number' ? price : 0);
  
  // Format giá để hiển thị
  const formatPrice = (p: string | number) => {
    if (typeof p === 'number') {
      return p.toLocaleString('vi-VN') + ' đ';
    }
    return p;
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('handleAddToCart called');
    console.log('auth.currentUser:', auth.currentUser);
    console.log('isAnonymous:', auth.currentUser?.isAnonymous);
    
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      console.log('Showing login warning');
      if (onShowLoginWarning) {
        onShowLoginWarning();
      } else {
        console.error('onShowLoginWarning is not defined!');
      }
      return;
    }

    try {
      await addToCart({
        productId: id,
        name: name,
        price: priceNum,
        qty: 1,
        image: imageUrl
      });
      showSuccess('Đã thêm vào giỏ hàng');
    } catch (error: any) {
      showError('Thêm giỏ hàng thất bại: ' + (error.message || ''));
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      if (onShowLoginWarning) onShowLoginWarning();
      return;
    }

    try {
      await addToCart({
        productId: id,
        name: name,
        price: priceNum,
        qty: 1,
        image: imageUrl
      });
      navigate('/cart');
    } catch (error: any) {
      showError('Có lỗi xảy ra: ' + (error.message || ''));
    }
  };

  return (
    <div className="home-product-card cursor-pointer">
      <div className="home-product-image-wrapper" onClick={() => navigate('/products')}>
        <div className="home-product-image-container">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name} 
              className="home-product-image"
              loading="lazy"
            />
          ) : (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '3rem', color: '#ccc'}}>
              📷
            </div>
          )}
        </div>
        {tag && <span className="home-product-tag">{tag}</span>}
      </div>
      <span className="home-product-name" onClick={() => navigate('/products')}>{name}</span>
      <div className="home-product-price-row">
        <span className="home-product-price">{formatPrice(price)}</span>
        {isSale && oldPrice && <span className="home-product-old-price">{formatPrice(oldPrice)}</span>}
      </div>
      
      {/* Nút Giỏ hàng và Mua ngay */}
      <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
        <button 
          onClick={handleAddToCart}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #C75F4B',
            background: '#fff',
            color: '#C75F4B',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#C75F4B';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#C75F4B';
          }}
        >
          🛒 Giỏ hàng
        </button>
        <button 
          onClick={handleBuyNow}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: '#C75F4B',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#a84d3d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#C75F4B';
          }}
        >
          Mua ngay
        </button>
      </div>
    </div>
  );
}

// --- Component Card Danh mục ---
function CategoryCard({ icon, name }: CategoryCardProps) {
  // Kiểm tra xem icon có phải là URL ảnh không
  const isImagePath = (iconString: string): boolean => {
    if (!iconString) return false;
    const cleanString = iconString.toLowerCase();
    return /\.(png|jpe?g|svg|gif|webp|ico)(\?|$)/i.test(cleanString) || 
           iconString.startsWith('http://') || 
           iconString.startsWith('https://') ||
           iconString.startsWith('/');
  };
  
  const defaultIcons: Record<string, string> = {
    "Hàng mới về": "🆕",
    "Khuyến mãi sốc": "🔥",
    "Hàng 2nd": "♻️",
    "Đồ công nghệ": "💻"
  };
  
  const displayIcon = icon || defaultIcons[name] || '📦';
  const isImage = isImagePath(displayIcon);
  
  return (
    <div className="category-card cursor-pointer">
      <div className="category-image-wrapper">
        {isImage ? (
          <img 
            src={displayIcon} 
            alt={name} 
            className="category-image"
          />
        ) : (
          <div className="category-icon" style={{fontSize: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%'}}>
            {displayIcon}
          </div>
        )}
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

  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [saleProducts, setSaleProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Debug: log khi showLoginWarning thay đổi
  useEffect(() => {
    console.log('showLoginWarning changed to:', showLoginWarning);
    console.trace('Stack trace:');
  }, [showLoginWarning]);

  // default categories order (fallback)
  const defaultCategories = [
    { name: "Hàng mới về", icon: "🆕" },
    { name: "Khuyến mãi sốc", icon: "🔥" },
    { name: "Hàng 2nd", icon: "♻️" },
    { name: "Đồ công nghệ", icon: "💻" }
  ];

  // fetch products and categories from Firestore
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Lấy sản phẩm mới: sắp xếp theo createdAt desc, limit 4
        const newProductsQuery = query(
          collection(db, 'products'), 
          orderBy('createdAt', 'desc'), 
          limit(4)
        );
        const newProductsSnapshot = await getDocs(newProductsQuery);
        const loadedNewProducts = newProductsSnapshot.docs.map(d => {
          const data = d.data() as any;
          // Lấy image - có thể là array hoặc string
          let imageUrl = '';
          if (Array.isArray(data.image) && data.image.length > 0) {
            imageUrl = data.image[0];
          } else if (typeof data.image === 'string') {
            imageUrl = data.image;
          } else {
            imageUrl = data.imageUrl || data.thumbnail || data.images?.[0] || '';
          }
          
          return {
            id: d.id,
            image: imageUrl,
            name: data.name || data.productName || data.title || 'Sản phẩm',
            price: data.newPrice || data.price || data.currentPrice || 0,
            oldPrice: data.oldPrice || data.originalPrice || undefined,
            tag: 'Mới'
          };
        });
        console.log('Loaded new products:', loadedNewProducts);
        if (mounted) setNewProducts(loadedNewProducts);
      } catch (e) {
        console.warn('Failed to load new products', e);
        if (mounted) setNewProducts([]);
      }

      try {
        // Lấy sản phẩm giảm giá: lấy tất cả sản phẩm mới, filter ở client side để tránh cần composite index
        const saleProductsQuery = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(20) // Lấy nhiều hơn để filter
        );
        const saleProductsSnapshot = await getDocs(saleProductsQuery);
        const allProducts = saleProductsSnapshot.docs.map(d => {
          const data = d.data() as any;
          // Lấy image - có thể là array hoặc string
          let imageUrl = '';
          if (Array.isArray(data.image) && data.image.length > 0) {
            imageUrl = data.image[0];
          } else if (typeof data.image === 'string') {
            imageUrl = data.image;
          } else {
            imageUrl = data.imageUrl || data.thumbnail || data.images?.[0] || '';
          }
          
          return {
            id: d.id,
            image: imageUrl,
            name: data.name || data.productName || data.title || 'Sản phẩm',
            price: data.newPrice || data.price || data.currentPrice || 0,
            oldPrice: data.oldPrice || data.originalPrice || undefined,
            tag: 'Sale',
            hasOldPrice: !!(data.oldPrice || data.originalPrice)
          };
        });
        // Filter chỉ lấy sản phẩm có oldPrice, limit 4
        const loadedSaleProducts = allProducts.filter(p => p.hasOldPrice).slice(0, 4);
        console.log('Loaded sale products:', loadedSaleProducts);
        if (mounted) setSaleProducts(loadedSaleProducts);
      } catch (e) {
        console.warn('Failed to load sale products', e);
        if (mounted) setSaleProducts([]);
      }

      try {
        // categories: attempt to load and then sort to keep defaults order first
        const cq = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const cs = await getDocs(cq);
        const loadedCats = cs.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || data.categoryName || data.title || 'Danh mục',
            icon: data.icon || data.image || data.imageUrl || data.thumbnail || ''
          };
        });
        console.log('Loaded categories:', loadedCats);
        if (loadedCats.length === 0) {
          if (mounted) setCategories(defaultCategories);
        } else {
          // Ensure the four primary categories appear first (if present in DB)
          const preferredNames = ["Hàng mới về", "Khuyến mãi sốc", "Hàng 2nd", "Đồ công nghệ"];
          const preferred = preferredNames.map(name => loadedCats.find((c:any) => c.name === name)).filter(Boolean);
          const others = loadedCats.filter((c:any) => !preferredNames.includes(c.name));
          if (mounted) setCategories([...preferred, ...others]);
        }
      } catch (e) {
        console.warn('Failed to load categories, using defaults', e);
        if (mounted) setCategories(defaultCategories);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Kiễm tra đăng nhập khi component mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
            {saleProducts.length === 0 ? (
              <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: '#666'}}>
                Chưa có sản phẩm giảm giá
              </div>
            ) : (
              saleProducts.map((p, index) => (
                <div key={p.id || index}>
                  <ProductCard id={p.id} {...p} onShowLoginWarning={() => setShowLoginWarning(true)} />
                </div>
              ))
            )}
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
            {newProducts.length === 0 ? (
              <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: '#666'}}>
                Chưa có sản phẩm mới
              </div>
            ) : (
              newProducts.map((p, index) => (
                <div key={p.id || index}>
                  <ProductCard id={p.id} {...p} onShowLoginWarning={() => setShowLoginWarning(true)} />
                </div>
              ))
            )}
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
      <Toaster />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </div>
  );
}