// SalePage.jsx - Trang hiển thị các Banner/Overlay khuyến mãi
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/sale.css";
import { db } from "../firebase-firestore";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  startDate?: any;
  endDate?: any;
  isActive: boolean;
  type: string;
}

export default function SalePage() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const bannersRef = collection(db, "banners");
        const q = query(bannersRef, where("isActive", "==", true), orderBy("startDate", "desc"));
        const snapshot = await getDocs(q);
        
        const bannerList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Banner[];
        
        setBanners(bannerList);
      } catch (error) {
        console.error("Error loading banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleBannerClick = (banner: Banner) => {
    if (banner.link) {
      if (banner.link.startsWith('http')) {
        window.open(banner.link, '_blank');
      } else {
        navigate(banner.link);
      }
    }
  };

  return (
    <>
      <Header />

      <div className="sale-page-container">
        {/* Hero Banner */}
        <div className="sale-hero-banner">
          <div className="sale-hero-content">
            <h1 className="sale-hero-title">🔥 Khuyến Mãi Hot 🔥</h1>
            <p className="sale-hero-desc">
              Cập nhật liên tục các chương trình khuyến mãi, ưu đãi đặc biệt dành riêng cho bạn!
            </p>
            <button className="sale-hero-btn" onClick={() => navigate("/categories/khuyen-mai")}>
              Xem Sản Phẩm Khuyến Mãi
            </button>
          </div>
          <div className="sale-hero-decoration">
            <div className="sale-circle sale-circle-1"></div>
            <div className="sale-circle sale-circle-2"></div>
            <div className="sale-circle sale-circle-3"></div>
          </div>
        </div>

        {/* Banners Grid */}
        {loading ? (
          <div className="sale-loading">
            <p>Đang tải các chương trình khuyến mãi...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="sale-empty">
            <div className="sale-empty-icon">📢</div>
            <h3>Chưa có chương trình khuyến mãi nào</h3>
            <p>Vui lòng quay lại sau để xem các ưu đãi mới nhất!</p>
            <button className="sale-empty-btn" onClick={() => navigate("/products")}>
              Xem Tất Cả Sản Phẩm
            </button>
          </div>
        ) : (
          <>
            <div className="sale-section-header">
              <h2 className="sale-section-title">Các Chương Trình Khuyến Mãi</h2>
              <p className="sale-section-subtitle">Click vào banner để xem chi tiết</p>
            </div>

            <div className="sale-banner-grid">
              {banners.map((banner) => (
                <div 
                  key={banner.id} 
                  className="sale-banner-card"
                  onClick={() => handleBannerClick(banner)}
                  style={{ cursor: banner.link ? 'pointer' : 'default' }}
                >
                  <div className="sale-banner-image">
                    <img src={banner.image} alt={banner.title} />
                    {banner.type && (
                      <span className="sale-banner-badge">{banner.type}</span>
                    )}
                  </div>
                  <div className="sale-banner-content">
                    <h3 className="sale-banner-title">{banner.title}</h3>
                    {banner.description && (
                      <p className="sale-banner-desc">{banner.description}</p>
                    )}
                    {banner.endDate && (
                      <div className="sale-banner-date">
                        <span className="sale-banner-date-icon">⏰</span>
                        Còn hạn đến: {new Date(banner.endDate.seconds * 1000).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    {banner.link && (
                      <button className="sale-banner-btn">
                        Xem Chi Tiết →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Call to Action */}
        <div className="sale-cta-section">
          <h2 className="sale-cta-title">Không Muốn Bỏ Lỡ Ưu Đãi?</h2>
          <p className="sale-cta-desc">
            Theo dõi chúng tôi để cập nhật các chương trình khuyến mãi mới nhất!
          </p>
          <div className="sale-cta-buttons">
            <button className="sale-cta-btn primary" onClick={() => navigate("/promotions")}>
              Xem Mã Giảm Giá
            </button>
            <button className="sale-cta-btn secondary" onClick={() => navigate("/categories/khuyen-mai")}>
              Sản Phẩm Sale
            </button>
          </div>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
    </>
  );
}
