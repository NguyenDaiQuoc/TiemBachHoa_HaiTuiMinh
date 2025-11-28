// React CheckoutPage (CSS removed from JSX)
// Import Header, Footer, FloatingButtons normally
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/checkout.css"

export default function CheckoutPage() {
  const cartItems = [
    { id: 1, name: "Nến Thơm Vỏ Cam Quế", price: 180000, quantity: 2 },
    { id: 2, name: "Bánh quy Yến mạch", price: 150000, quantity: 1 },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal > 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  return (
    <div className="checkout-wrapper">
      <Header />

      <div className="checkout-container">
        {/* Left */}
        <div className="checkout-left">
          <h1 className="checkout-title">Thanh Toán Đơn Hàng</h1>

          {/* Customer Info */}
          <section className="section-block">
            <h2 className="section-title">1. Thông Tin Nhận Hàng</h2>

            <div className="grid-2">
              <div className="form-group">
                <label>Họ và Tên *</label>
                <input type="text" placeholder="Ví dụ: Nguyễn Văn A" required />
              </div>

              <div className="form-group">
                <label>Số Điện Thoại *</label>
                <input type="tel" placeholder="Ví dụ: 090xxxxxxx" required />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Ví dụ: email@domain.com" />
            </div>

            <div className="form-group">
              <label>Địa Chỉ Chi Tiết *</label>
              <input type="text" placeholder="Số nhà, tên đường, phường/xã" required />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Tỉnh / Thành phố *</label>
                <input type="text" required />
              </div>

              <div className="form-group">
                <label>Quận / Huyện *</label>
                <input type="text" required />
              </div>
            </div>

            <div className="form-group">
              <label>Ghi Chú</label>
              <input type="text" placeholder="Ví dụ: Giao giờ hành chính" />
            </div>
          </section>

          {/* Shipping */}
          <section className="section-block">
            <h2 className="section-title">2. Phương Thức Vận Chuyển</h2>

            <div className="shipping-option">
              <label>
                <input type="radio" name="shipping" defaultChecked />
                Vận chuyển tiêu chuẩn (3-5 ngày)
              </label>
              <span>{shippingFee === 0 ? "Miễn phí" : shippingFee.toLocaleString() + " VNĐ"}</span>
            </div>
          </section>

          {/* Payment */}
          <section className="section-block">
            <h2 className="section-title">3. Phương Thức Thanh Toán</h2>

            <div className="payment-option">
              <label>
                <input type="radio" name="payment" defaultChecked /> COD - Thanh toán khi nhận hàng
              </label>
            </div>

            <div className="payment-option">
              <label>
                <input type="radio" name="payment" /> Chuyển khoản ngân hàng
              </label>
            </div>
          </section>
        </div>

        {/* Right */}
        <div className="checkout-right">
          <div className="summary-box">
            <h2 className="summary-title">Đơn Hàng Của Bạn ({cartItems.length} sản phẩm)</h2>

            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>{(item.price * item.quantity).toLocaleString()} VNĐ</span>
                </div>
              ))}
            </div>

            <div className="summary-line"><span>Tạm tính</span><span>{subtotal.toLocaleString()} VNĐ</span></div>
            <div className="summary-line"><span>Phí vận chuyển</span><span>{shippingFee === 0 ? "Miễn phí" : shippingFee.toLocaleString() + " VNĐ"}</span></div>
            <div className="summary-line"><span>Mã giảm giá</span><span>0 VNĐ</span></div>

            <div className="summary-total">
              <span>Tổng Thanh Toán</span>
              <span>{total.toLocaleString()} VNĐ</span>
            </div>

            <button className="btn-submit">Hoàn tất đặt hàng</button>
          </div>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}