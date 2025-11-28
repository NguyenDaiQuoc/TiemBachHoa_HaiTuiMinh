import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/order-confirm.css";

// Format tiền tệ
const formatCurrency = (amount) => {
  const numericAmount = Number(amount) || 0;
  return numericAmount.toLocaleString('vi-VN') + ' VNĐ';
};
type OrderConfirmProps = {
  orderId?: string;
  totalAmount?: number;
  deliveryTime?: string;
};

export default function OrderConfirm({ orderId, totalAmount, deliveryTime }: OrderConfirmProps) {
  const orderItems = [
    { name: "Nến Thơm Organic Vỏ Cam Quế", price: 180000, quantity: 2 },
    { name: "Bánh quy Yến mạch (Hộp)", price: 150000, quantity: 1 },
  ];

  const shippingMethod = "Vận chuyển tiêu chuẩn (3-5 ngày)";
  const paymentMethod = "Thanh toán khi nhận hàng (COD)";


  return (
    <div className="thankyou-wrapper">
      <Header />

      <div className="thankyou-content">
        <div className="thankyou-card">
          {/* Icon Thành Công */}
          <div className="thankyou-icon">
            <span>✓</span>
          </div>

          <h1 className="thankyou-title">ĐẶT HÀNG THÀNH CÔNG!</h1>
          <p className="thankyou-subtitle">
            Cảm ơn bạn đã tin tưởng "Nhà Hai Đứa". Đơn hàng của bạn đang được xử lý.
          </p>

          <p className="thankyou-label">Mã đơn hàng của bạn:</p>
          <div className="thankyou-orderid">{orderId}</div>

          <div className="thankyou-summary">
            {/* Thông tin giao hàng */}
            <div>
              <h3 className="summary-title">Thông tin Giao hàng</h3>
              <p className="summary-item">Tên Khách Hàng: Trần Thị B</p>
              <p className="summary-item">SĐT: 090xxxxxxx</p>
              <p className="summary-item">Địa Chỉ: Số 123, đường Hai Bà Trưng, TP.HCM</p>
              <p className="summary-item">Dự kiến: {deliveryTime}</p>
            </div>

            {/* Chi tiết thanh toán */}
            <div>
              <h3 className="summary-title">Chi Tiết Thanh Toán</h3>
              <div className="summary-row">
                <span>Tổng Đơn Hàng:</span>
                <span className="highlight">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Vận Chuyển:</span>
                <span>{shippingMethod}</span>
              </div>
              <div className="summary-row">
                <span>Thanh Toán:</span>
                <span>{paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Hành động tiếp theo */}
          <div className="thankyou-actions">
            <button className="btn-primary">Theo Dõi Đơn Hàng</button>
            <button className="btn-secondary">Quay lại Trang Chủ</button>
          </div>
        </div>

        <p className="thankyou-note">
          Một email xác nhận chi tiết đã được gửi đến hộp thư của bạn.
        </p>
      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}
