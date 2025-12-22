import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import "../../css/order-tracking.css";

// Format tiền tệ
const formatCurrency = (amount: any) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// --- Component Thanh Trạng Thái (Timeline) ---
function TrackingTimeline({ currentStep }: any) {
  const steps = [
    { name: "Đã Đặt Hàng", date: "11/11/2025" },
    { name: "Đang Xử Lý", date: "11/11/2025" },
    { name: "Đang Giao Hàng", date: "12/11/2025" },
    { name: "Đã Giao Thành Công", date: "" },
  ];
  const stepIndex = steps.findIndex(step => step.name === currentStep);

  return (
    <div className="timeline-wrapper">
      <div className="timeline-line"></div>
      {steps.map((step, index) => {
        const isActive = index <= stepIndex;
        return (
          <div key={step.name} className="timeline-step">
            <div className={`timeline-circle ${isActive ? 'active' : ''}`}>
              {isActive && <span>✓</span>}
            </div>
            <p className={`timeline-name ${isActive ? 'active' : ''}`}>{step.name}</p>
            {step.date && <p className={`timeline-date ${isActive ? 'active' : ''}`}>{step.date}</p>}
          </div>
        );
      })}
    </div>
  );
}

// --- Component Bản Đồ Vận Đơn ---
function LiveTrackingMapComponent({ currentLocation, ETA }: any) {
  const checkpoints = [
    { location: "Kho Xử Lý TP.HCM", status: "Đã rời khỏi", time: "11:00 AM" },
    { location: "Bưu cục Cầu Giấy, HN", status: "Đang trung chuyển", time: "08:00 AM" },
    { location: "Điểm giao nhận gần nhất", status: "Sẵn sàng giao", time: "" },
  ];

  return (
    <div className="map-wrapper">
      <h3 className="map-title">Hành Trình Vận Đơn Trực Tiếp</h3>

      <div className="map-box">
        <div className="map-placeholder">
          <p>Giao Diện Bản Đồ Mô Phỏng<br />(Tích hợp Google Maps / API)</p>
        </div>
        <div className="map-truck">🚚</div>
      </div>

      <div className="map-status">
        <div>
          <p>Vị trí hiện tại gần nhất:</p>
          <p className="highlight-green">{currentLocation}</p>
        </div>
        <div className="text-right">
          <p>Thời gian dự kiến nhận hàng (ETA):</p>
          <p className="highlight-orange">{ETA}</p>
        </div>
      </div>

      <div className="map-checkpoints">
        <h4>Lịch Sử Điểm Dừng Gần Nhất</h4>
        {checkpoints.map((point, index) => (
          <div key={index} className="checkpoint">
            <div className={`checkpoint-dot ${index === 0 ? 'highlight-orange' : ''}`}></div>
            <div>
              <p>{point.location} - <span className={index === 0 ? 'highlight-orange' : ''}>{point.status}</span></p>
              {point.time && <p className="checkpoint-time">Cập nhật lúc: {point.time}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
type OrderTrackingProps = {
  orderId?: string;
  currentStatus?: string;
  totalAmount?: number;
  currentLocation?: string;
  ETA?: string;
};


// --- Component Chính ---
export default function OrderTracking({ orderId, currentStatus, totalAmount, currentLocation, ETA }: OrderTrackingProps) {
  const navigate = useNavigate();
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Listen to auth state changes like Cart.tsx
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setShowLoginWarning(true);
      } else {
        setShowLoginWarning(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const shippingAddress = "Số 123, đường Hai Bà Trưng, Phường Bến Nghé, Q.1, TP.HCM";
  const orderItems = [
    { name: "Nến Thơm Organic Vỏ Cam Quế", price: 180000, quantity: 2 },
    { name: "Bánh quy Yến mạch (Hộp)", price: 150000, quantity: 1 },
  ];

  return (
    <div className="tracking-wrapper">
      <Header />

      <div className="tracking-content">
        <h1>Theo Dõi Đơn Hàng Của Bạn</h1>
        <p>Mã đơn hàng: <span className="highlight-green">{orderId}</span></p>

        {/* Timeline */}
        <div className="timeline-card">
          <h2>Trạng Thái Hiện Tại: {currentStatus}</h2>
          <TrackingTimeline currentStep={currentStatus} />
        </div>

        {/* Map */}
        <LiveTrackingMapComponent currentLocation={currentLocation} ETA={ETA} />

        {/* Chi tiết đơn hàng */}
        <div className="tracking-grid">
          <div className="tracking-info">
            <h3>Thông Tin Thanh Toán & Giao Nhận</h3>
            <p>Địa Chỉ Nhận: {shippingAddress}</p>
            <p>Hình Thức Thanh Toán: COD</p>
            <div className="summary">
              <div className="summary-row">
                <span>Tổng Sản Phẩm:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Phí Vận Chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <div className="summary-row total">
                <span>Tổng Tiền Thanh Toán:</span>
                <span className="highlight-green">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="tracking-products">
            <h3>Sản Phẩm Trong Đơn</h3>
            {orderItems.map((item, index) => (
              <div key={index} className="product-row">
                <span>{item.name} (x{item.quantity})</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tracking-support">
          <p>Bạn cần hỗ trợ thêm về đơn hàng? Đội ngũ Nhà Hai Đứa luôn sẵn sàng!</p>
          <button className="btn-support">Liên Hệ Hỗ Trợ (Zalo/Hotline)</button>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để theo dõi đơn hàng"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </div>
  );
}
