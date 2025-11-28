import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/promotions.css";

// --- Coupon Card ---
function CouponCard({ code, description, expires, isNewUser = false }) {
  const handleCopy = () => {
    alert(`Đã sao chép mã: ${code}`);
  };

  const daysLeft = expires === '31/12/2025' ? 50 : 7;

  return (
    <div className="coupon-card">
      {isNewUser && (
        <span className="coupon-new">🎉 Dành cho Thành viên mới</span>
      )}
      <div className="coupon-main">
        <div className="coupon-info">
          <h3 className="coupon-desc">{description}</h3>
          <p className="coupon-sub">Áp dụng cho mọi đơn hàng từ 500.000 VNĐ.</p>
        </div>
        <div className="coupon-code-area">
          <div className="coupon-code-box">{code}</div>
          <button onClick={handleCopy} className="coupon-copy">
            [Click để Sao chép]
          </button>
        </div>
      </div>
      <p className="coupon-expire">Hạn sử dụng: {expires} (Còn <b>{daysLeft}</b> ngày)</p>
    </div>
  );
}

// --- Promotions Page ---
export default function PromotionsPage() {
  const coupons = [
    { code: 'NHADUA20', description: 'Giảm 20% cho lần đầu mua sắm', expires: '31/12/2025', isNewUser: true },
    { code: 'FREESHIP11', description: 'Miễn phí vận chuyển toàn quốc', expires: '30/11/2025' },
    { code: 'BACHHOA10', description: 'Giảm 10% cho mặt hàng Bách hóa', expires: '15/12/2025' },
  ];

  const loyaltyPoints = 1250;
  const loyaltyTier = 'Thành Viên Vàng';

  return (
    <div className="promotions-wrapper">
      <Header />

      <div className="promotions-content">
        <h1 className="promotions-title">Khuyến Mãi & Ưu Đãi</h1>
        <p className="promotions-subtitle">
          Thu thập các mã giảm giá và khám phá các chương trình khách hàng thân thiết!
        </p>

        <div className="loyalty-card">
          <div>
            <h2 className="loyalty-title">Tài Khoản Thân Thiết Của Bạn</h2>
            <p>Hạng hiện tại: <span className="loyalty-tier">{loyaltyTier}</span></p>
          </div>
          <div className="loyalty-points">
            <p className="loyalty-label">Điểm Tích Lũy</p>
            <p className="loyalty-value">{loyaltyPoints}</p>
            <p className="loyalty-desc">(Đủ đổi voucher 50.000 VNĐ)</p>
          </div>
        </div>

        <h2 className="coupon-section-title">Mã Giảm Giá Đang Hoạt Động</h2>
        <div className="coupon-grid">
          {coupons.map((coupon, idx) => <CouponCard key={idx} {...coupon} />)}
        </div>

        <div className="promotions-cta">
          <h3 className="cta-title">Bạn muốn được giảm giá nhiều hơn?</h3>
          <p className="cta-sub">Tích lũy điểm để nâng hạng thành viên và nhận được các ưu đãi độc quyền hàng tháng!</p>
          <button className="btn-cta">Xem Chi Tiết Chương Trình Khách Hàng Thân Thiết</button>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}
