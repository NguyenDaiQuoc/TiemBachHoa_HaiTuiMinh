import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/aboutus.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";

export default function AboutUsPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <FloatingButtons />

      <div className="about-wrapper">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero-content">
            <h1 className="about-hero-title">
              Tiệm Bách Hóa Hai Tụi Mình
            </h1>
            <p className="about-hero-tagline">
              Mua Sắm Thông Minh, Giá Tốt, Chất Lượng Đảm Bảo
            </p>
            <p className="about-hero-description">
              Chúng tôi mang đến những sản phẩm <strong>gia dụng, đồ dùng cá nhân, mỹ phẩm và đồ điện tử chính hãng</strong> với giá cả cạnh tranh, 
              thấp hơn 10-20% so với thị trường mà vẫn đảm bảo chất lượng.
            </p>
          </div>
          <div className="about-hero-image">
            <img 
              src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1000&q=80" 
              alt="Tiệm Bách Hóa" 
            />
          </div>
        </section>

        {/* Mission Section */}
        <section className="about-mission">
          <div className="about-mission-container">
            <h2 className="about-section-title">Sứ Mệnh Của Chúng Tôi</h2>
            <p className="about-mission-text">
              Tại <strong>Tiệm Bách Hóa Hai Tụi Mình</strong>, chúng tôi tin rằng mọi gia đình Việt đều xứng đáng 
              được sử dụng những sản phẩm chất lượng cao mà không phải trả giá quá đắt. 
              Chúng tôi cam kết tìm kiếm, tuyển chọn và cung cấp những sản phẩm tốt nhất với mức giá hợp lý nhất.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="about-values">
          <h2 className="about-section-title">Tại Sao Chọn Chúng Tôi</h2>
          <div className="about-values-grid">
            <div className="about-value-card">
              <div className="about-value-icon">🏷️</div>
              <h3 className="about-value-title">Giá Cạnh Tranh</h3>
              <p className="about-value-text">
                Cam kết giá tốt nhất thị trường. So sánh và thấy sự khác biệt!
              </p>
            </div>

            <div className="about-value-card">
              <div className="about-value-icon">✅</div>
              <h3 className="about-value-title">Chính Hãng 100%</h3>
              <p className="about-value-text">
                Mọi sản phẩm đều có tem bảo hành, hóa đơn VAT và được kiểm định chất lượng.
              </p>
            </div>

            <div className="about-value-card">
              <div className="about-value-icon">🚚</div>
              <h3 className="about-value-title">Giao Hàng Nhanh</h3>
              <p className="about-value-text">
                Miễn phí vận chuyển cho đơn từ 500k. Giao hàng trong 1-3 ngày.
              </p>
            </div>

            <div className="about-value-card">
              <div className="about-value-icon">🔄</div>
              <h3 className="about-value-title">Đổi Trả Dễ Dàng</h3>
              <p className="about-value-text">
                Chính sách đổi trả trong 7 ngày nếu sản phẩm có vấn đề.
              </p>
            </div>

            <div className="about-value-card">
              <div className="about-value-icon">💳</div>
              <h3 className="about-value-title">Thanh Toán Linh Hoạt</h3>
              <p className="about-value-text">
                Hỗ trợ COD, chuyển khoản, ví điện tử và thẻ tín dụng.
              </p>
            </div>

            <div className="about-value-card">
              <div className="about-value-icon">❤️</div>
              <h3 className="about-value-title">Tận Tâm</h3>
              <p className="about-value-text">
                Đội ngũ tư vấn nhiệt tình, sẵn sàng hỗ trợ 24/7.
              </p>
            </div>
          </div>
        </section>

        {/* Products Categories */}
        <section className="about-products">
          <h2 className="about-section-title">Danh Mục Sản Phẩm</h2>
          <div className="about-products-grid">
            <div className="about-product-category">
              <div className="about-product-icon">🏠</div>
              <h3 className="about-product-title">Gia Dụng</h3>
              <p className="about-product-desc">
                Nồi chiên, máy xay, bộ dao, dụng cụ nhà bếp...
              </p>
            </div>

            <div className="about-product-category">
              <div className="about-product-icon">💄</div>
              <h3 className="about-product-title">Mỹ Phẩm</h3>
              <p className="about-product-desc">
                Kem dưỡng, son môi, nước hoa chính hãng Hàn - Nhật - Âu
              </p>
            </div>

            <div className="about-product-category">
              <div className="about-product-icon">🔌</div>
              <h3 className="about-product-title">Đồ Điện Tử</h3>
              <p className="about-product-desc">
                Tai nghe, loa, chuột, bàn phím, phụ kiện công nghệ
              </p>
            </div>

            <div className="about-product-category">
              <div className="about-product-icon">🧴</div>
              <h3 className="about-product-title">Đồ Dùng Cá Nhân</h3>
              <p className="about-product-desc">
                Máy cạo râu, bàn chải điện, máy sấy tóc, máy massage
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="about-stats">
          <div className="about-stats-grid">
            <div className="about-stat-item">
              <div className="about-stat-number">10,000+</div>
              <div className="about-stat-label">Khách Hàng Tin Tưởng</div>
            </div>
            <div className="about-stat-item">
              <div className="about-stat-number">800+</div>
              <div className="about-stat-label">Sản Phẩm Đa Dạng</div>
            </div>
            <div className="about-stat-item">
              <div className="about-stat-number">98%</div>
              <div className="about-stat-label">Đánh Giá Tích Cực</div>
            </div>
            <div className="about-stat-item">
              <div className="about-stat-number">24/7</div>
              <div className="about-stat-label">Hỗ Trợ Khách Hàng</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-cta">
          <div className="about-cta-content">
            <h2 className="about-cta-title">Sẵn Sàng Khám Phá?</h2>
            <p className="about-cta-text">
              Hãy cùng chúng tôi mang những sản phẩm chất lượng và giá tốt vào tổ ấm của bạn!
            </p>
            <div className="about-cta-buttons">
              <button 
                className="about-cta-btn about-cta-btn-primary"
                onClick={() => navigate("/products")}
              >
                Xem Sản Phẩm
              </button>
              <button 
                className="about-cta-btn about-cta-btn-secondary"
                onClick={() => navigate("/story")}
              >
                Đọc Câu Chuyện
              </button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

