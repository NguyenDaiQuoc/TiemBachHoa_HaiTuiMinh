// AboutUsPage.jsx
import React from "react";
import "../../css/aboutus.css"
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AboutUsPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header tách riêng */}
      <Header />

      {/* Wrapper chỉ chứa nội dung */}
      <div className="about-wrapper">
        
        {/* Hero */}
        <div className="about-hero">
          <div className="about-hero-box">
            <div className="about-hero-left">
              <h1 className="about-hero-title">
                Tiệm Bách Hóa Hai Tụi Mình – Mua Sắm Thông Minh, Giá Tốt
              </h1>
              <p className="about-hero-text">
                Chúng tôi mang đến những sản phẩm gia dụng, đồ dùng cá nhân, mỹ phẩm
                và đồ điện tử chính hãng với <strong>giá cả cạnh tranh</strong>, thấp hơn nhiều
                so với các bách hóa xanh hay tạp hóa bán lẻ...
              </p>
            </div>

            <div className="about-hero-right">Hình ảnh sản phẩm nổi bật</div>
          </div>
        </div>

        {/* Values */}
        <div className="about-values">
          <h2 className="about-section-title">Tại Sao Chọn Chúng Tôi</h2>
          <div className="about-values-grid">
            <div className="about-value-card">
              <span className="about-value-icon">🏷️</span>
              <h3 className="about-value-title">Giá Cạnh Tranh</h3>
              <p className="about-value-text">
                Luôn cam kết giá tốt nhất, giúp bạn tiết kiệm mà vẫn mua được sản phẩm chính hãng.
              </p>
            </div>
            <div className="about-value-card">
              <span className="about-value-icon">🛒</span>
              <h3 className="about-value-title">Đa Dạng & Tiện Lợi</h3>
              <p className="about-value-text">
                Gia dụng, đồ dùng cá nhân, mỹ phẩm và điện tử – tất cả trong một nơi.
              </p>
            </div>
            <div className="about-value-card">
              <span className="about-value-icon">✅</span>
              <h3 className="about-value-title">Chất Lượng & Chính Hãng</h3>
              <p className="about-value-text">
                Sản phẩm được kiểm định, đảm bảo chính hãng và bền bỉ.
              </p>
            </div>
          </div>
        </div>

        {/* Founders */}
        <div className="about-founders-section">
          <div className="about-founders-box">
            <div className="about-founders-image">Ảnh Quốc & Xuân</div>
            <div className="about-founders-text">
              <h2 className="about-founders-title">Giới Thiệu "Hai Tụi Mình"</h2>
              <p>
                Chúng tôi – Quốc và Xuân – là hai người đam mê công nghệ và tiện ích gia đình...
              </p>
              <p className="about-founders-sign">— Quốc & Xuân, Đồng Sáng Lập</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="about-cta">
          <h2 className="about-section-title">Bắt Đầu Khám Phá Ngay</h2>
          <p className="about-cta-text">
            Hãy cùng chúng tôi mang những sản phẩm chất lượng và giá tốt vào tổ ấm của bạn.
          </p>
          <button className="about-cta-btn" onClick={() => navigate("/products")}>
            Xem Tất Cả Sản Phẩm
          </button>
        </div>

      </div>

      {/* Footer tách riêng */}
      <Footer />
    </div>
  );
}
