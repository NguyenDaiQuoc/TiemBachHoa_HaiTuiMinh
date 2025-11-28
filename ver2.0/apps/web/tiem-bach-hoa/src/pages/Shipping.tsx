// ShippingPolicyPage.jsx
import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";

import "../../css/shipping-policy.css";

export default function ShippingPolicyPage() {
  return (
    <>
      <Header />

      <div className="ship-wrapper">
        {/* Header Title */}
        <div className="ship-topbar">
          <div className="ship-topbar-inner">
            <span className="ship-brand">Tiệm Bách Hóa Nhà Hai Đứa</span>
          </div>
        </div>

        {/* Content */}
        <div className="ship-container">
          <h1 className="ship-title">Chính Sách Vận Chuyển & Giao Nhận</h1>
          <p className="ship-subtitle">
            Chúng tôi luôn cố gắng giao hàng nhanh nhất và an toàn nhất đến tổ
            ấm của bạn.
          </p>

          <div className="ship-box">
            {/* SECTION 1 */}
            <div className="ship-section">
              <h2 className="ship-section-title">
                1. Phí Vận Chuyển & Miễn Phí Giao Hàng
              </h2>

              <ul className="ship-list">
                <li>
                  <b>Phí tiêu chuẩn:</b> Phí vận chuyển được tính dựa trên
                  trọng lượng, kích thước gói hàng và địa điểm nhận hàng.
                </li>
                <li>
                  <b>Miễn phí giao hàng:</b> Áp dụng cho mọi đơn hàng từ{" "}
                  <b>500.000 VNĐ</b> trở lên.
                </li>
              </ul>

              <div className="ship-alert">
                📦 Đơn hàng từ 500.000 VNĐ: MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC!
              </div>
            </div>

            {/* SECTION 2 */}
            <div className="ship-section">
              <h2 className="ship-section-title">
                2. Thời Gian Giao Hàng Dự Kiến
              </h2>

              <p className="ship-note">
                Thời gian xử lý đơn hàng: 01 ngày làm việc.
              </p>

              <table className="ship-table">
                <thead>
                  <tr>
                    <th>Khu Vực</th>
                    <th>Thời Gian Dự Kiến</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nội thành TP. Hồ Chí Minh</td>
                    <td>1 - 2 ngày làm việc</td>
                  </tr>
                  <tr>
                    <td>Các thành phố lớn (Hà Nội, Đà Nẵng,…)</td>
                    <td>2 - 4 ngày làm việc</td>
                  </tr>
                  <tr>
                    <td>Các tỉnh/thành phố khác</td>
                    <td>3 - 6 ngày làm việc</td>
                  </tr>
                </tbody>
              </table>

              <p className="ship-small">
                * Không tính Chủ Nhật, ngày lễ và thời gian xử lý đơn.
              </p>
            </div>

            {/* SECTION 3 */}
            <div className="ship-section">
              <h2 className="ship-section-title">3. Quy Trình Nhận Hàng</h2>

              <ol className="ship-list-number">
                <li>
                  <b>Kiểm tra hàng trước khi nhận:</b> Khách hàng có quyền kiểm
                  tra độ nguyên vẹn của bao bì và sản phẩm trước khi thanh toán.
                </li>
                <li>
                  <b>Xử lý sự cố:</b> Nếu phát hiện sản phẩm hư hỏng hoặc thiếu,
                  vui lòng từ chối nhận hàng và liên hệ hotline ngay.
                </li>
                <li>
                  <b>Thanh toán:</b> Thanh toán tiền hàng và phí vận chuyển (nếu
                  có) cho nhân viên giao hàng hoặc qua phương thức đã chọn.
                </li>
              </ol>
            </div>
          </div>

          {/* CTA */}
          <div className="ship-cta">
            <p>Theo dõi đơn hàng của bạn để biết chính xác thời gian nhận hàng:</p>

            <a href="#" className="ship-cta-btn">
              THEO DÕI ĐƠN HÀNG
            </a>
          </div>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
    </>
  );
}
