import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/story.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";

export default function StoryPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <FloatingButtons />

      <div className="story-page-wrapper">
        {/* Hero Section */}
        <section className="story-hero">
          <div className="story-hero-overlay">
            <h1 className="story-hero-title">Câu Chuyện Hai Tụi Mình</h1>
            <p className="story-hero-subtitle">
              Hành trình từ hai người bạn đam mê, đến một cửa hàng với sứ mệnh mang giá trị thật đến mọi gia đình
            </p>
          </div>
        </section>

        {/* Story Content */}
        <div className="story-container">
          {/* Section 1: Khởi đầu */}
          <section className="story-section">
            <div className="story-section-content">
              <div className="story-text-block">
                <h2 className="story-section-title">🌟 Khởi Đầu Từ Đam Mê</h2>
                <p className="story-paragraph">
                  Năm 2023, hai chúng mình – Quốc và Xuân – là hai người bạn thân từ thời đại học. 
                  Quốc yêu thích công nghệ và luôn tìm kiếm những sản phẩm điện tử tiện ích với giá tốt. 
                  Còn Xuân thì đam mê mỹ phẩm và đồ gia dụng, thường xuyên săn sale để mang về những 
                  món đồ chất lượng cho gia đình.
                </p>
                <p className="story-paragraph">
                  Một ngày nọ, khi cùng nhau đi mua sắm, tụi mình nhận ra rằng nhiều sản phẩm tốt 
                  thường có giá cao bất hợp lý ở các cửa hàng lớn. Trong khi đó, nếu tìm đúng nguồn 
                  và mua với số lượng hợp lý, giá có thể rẻ hơn rất nhiều mà vẫn đảm bảo chính hãng.
                </p>
                <blockquote className="story-quote">
                  "Tại sao chúng ta không mở một cửa hàng, nơi mọi người có thể mua được 
                  hàng tốt với giá thật sự hợp lý?" - Xuân nói.
                </blockquote>
              </div>
              <div className="story-image-block">
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80" 
                  alt="Khởi đầu" 
                />
              </div>
            </div>
          </section>

          {/* Section 2: Định hình sứ mệnh */}
          <section className="story-section story-section-reverse">
            <div className="story-section-content">
              <div className="story-image-block">
                <img 
                  src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80" 
                  alt="Sứ mệnh" 
                />
              </div>
              <div className="story-text-block">
                <h2 className="story-section-title">💡 Định Hình Sứ Mệnh</h2>
                <p className="story-paragraph">
                  Và thế là "Tiệm Bách Hóa Hai Tụi Mình" ra đời. Không phải một siêu thị lớn, 
                  không phải chuỗi bán lẻ xa xỉ – mà là một nơi thân thiện, nơi mọi người có thể 
                  tìm thấy những sản phẩm thiết yếu cho cuộc sống hàng ngày:
                </p>
                <ul className="story-list">
                  <li>🏠 <strong>Gia dụng:</strong> Từ nồi chiên không dầu, máy xay sinh tố, đến bộ dao kéo nhà bếp</li>
                  <li>💄 <strong>Mỹ phẩm:</strong> Kem dưỡng da, son môi, nước hoa chính hãng</li>
                  <li>🔌 <strong>Đồ điện tử:</strong> Tai nghe, loa bluetooth, chuột không dây, sạc dự phòng</li>
                  <li>🧴 <strong>Đồ dùng cá nhân:</strong> Bàn chải điện, máy cạo râu, máy sấy tóc</li>
                </ul>
                <p className="story-paragraph">
                  Tất cả đều được tụi mình tuyển chọn kỹ lưỡng, kiểm tra nguồn gốc và đàm phán giá 
                  tốt nhất để khách hàng được hưởng lợi.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Giá trị cốt lõi */}
          <section className="story-values-section">
            <h2 className="story-section-title story-center-title">🎯 Giá Trị Cốt Lõi Của Tụi Mình</h2>
            <div className="story-values-grid">
              <div className="story-value-card">
                <div className="story-value-icon">🏷️</div>
                <h3 className="story-value-title">Giá Tốt Nhất</h3>
                <p className="story-value-text">
                  Cam kết giá cạnh tranh, thấp hơn thị trường 10-20% mà vẫn giữ chất lượng chính hãng.
                </p>
              </div>
              <div className="story-value-card">
                <div className="story-value-icon">✅</div>
                <h3 className="story-value-title">Chính Hãng 100%</h3>
                <p className="story-value-text">
                  Mỗi sản phẩm đều có tem bảo hành, hóa đơn VAT và cam kết đổi trả trong 7 ngày.
                </p>
              </div>
              <div className="story-value-card">
                <div className="story-value-icon">❤️</div>
                <h3 className="story-value-title">Tận Tâm</h3>
                <p className="story-value-text">
                  Tư vấn nhiệt tình, ship hàng nhanh chóng và luôn lắng nghe phản hồi từ khách hàng.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Timeline */}
          <section className="story-timeline-section">
            <h2 className="story-section-title story-center-title">📅 Hành Trình Phát Triển</h2>
            <div className="story-timeline">
              <div className="story-timeline-item">
                <div className="story-timeline-dot"></div>
                <div className="story-timeline-content">
                  <h4 className="story-timeline-title">Tháng 3/2023</h4>
                  <p className="story-timeline-text">
                    Ra mắt website đầu tiên với 50 sản phẩm. Bắt đầu với một kho nhỏ và 2 nhân viên.
                  </p>
                </div>
              </div>
              <div className="story-timeline-item">
                <div className="story-timeline-dot"></div>
                <div className="story-timeline-content">
                  <h4 className="story-timeline-title">Tháng 8/2023</h4>
                  <p className="story-timeline-text">
                    Đạt 1000+ đơn hàng đầu tiên. Mở rộng danh mục lên 300+ sản phẩm.
                  </p>
                </div>
              </div>
              <div className="story-timeline-item">
                <div className="story-timeline-dot"></div>
                <div className="story-timeline-content">
                  <h4 className="story-timeline-title">Tháng 12/2024</h4>
                  <p className="story-timeline-text">
                    Ra mắt chương trình VIP với 6 hạng thành viên và ưu đãi lên đến 7.5%.
                  </p>
                </div>
              </div>
              <div className="story-timeline-item">
                <div className="story-timeline-dot"></div>
                <div className="story-timeline-content">
                  <h4 className="story-timeline-title">Hiện tại - 2025</h4>
                  <p className="story-timeline-text">
                    Phục vụ 10,000+ khách hàng tin tưởng với 800+ sản phẩm đa dạng.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Team */}
          <section className="story-team-section">
            <h2 className="story-section-title story-center-title">👥 Đội Ngũ Của Chúng Tôi</h2>
            <div className="story-team-grid">
              <div className="story-team-card">
                <div className="story-team-avatar">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" 
                    alt="Quốc" 
                  />
                </div>
                <h3 className="story-team-name">Nguyễn Văn Quốc</h3>
                <p className="story-team-role">Đồng Sáng Lập & Giám Đốc Công Nghệ</p>
                <p className="story-team-bio">
                  Chuyên gia về điện tử và công nghệ. Đảm bảo website vận hành mượt mà và 
                  tìm kiếm những sản phẩm công nghệ tốt nhất.
                </p>
              </div>
              <div className="story-team-card">
                <div className="story-team-avatar">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80" 
                    alt="Xuân" 
                  />
                </div>
                <h3 className="story-team-name">Trần Thị Xuân</h3>
                <p className="story-team-role">Đồng Sáng Lập & Giám Đốc Vận Hành</p>
                <p className="story-team-bio">
                  Chuyên gia về mỹ phẩm và gia dụng. Đảm bảo chất lượng sản phẩm và 
                  chăm sóc khách hàng chu đáo.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="story-cta-section">
            <div className="story-cta-box">
              <h2 className="story-cta-title">Sẵn Sàng Mua Sắm Cùng Tụi Mình?</h2>
              <p className="story-cta-text">
                Hãy để chúng tôi đồng hành cùng bạn trong hành trình làm đẹp ngôi nhà, 
                chăm sóc bản thân và nâng cao chất lượng cuộc sống!
              </p>
              <div className="story-cta-buttons">
                <button 
                  className="story-cta-btn story-cta-btn-primary"
                  onClick={() => navigate("/products")}
                >
                  Khám Phá Sản Phẩm
                </button>
                <button 
                  className="story-cta-btn story-cta-btn-secondary"
                  onClick={() => navigate("/contact")}
                >
                  Liên Hệ Tụi Mình
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </>
  );
}
