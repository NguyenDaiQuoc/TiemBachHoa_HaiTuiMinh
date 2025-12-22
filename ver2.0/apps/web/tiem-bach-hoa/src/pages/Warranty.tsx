// WarrantyPolicyPage.jsx
import React from "react";
import "../../css/warranty.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import SalesFloatingButton from "../components/SalesFloatingButton";

export default function WarrantyPolicyPage() {
  return (
    <>
      <Header />
      <FloatingButtons />
      <SalesFloatingButton show={true} ctaLink="/sale" />

      <div className="wp-wrapper">
        <div className="wp-container">
          <h1 className="wp-title">Chính Sách Bảo Hành Sản Phẩm</h1>
          <p className="wp-subtitle">
            Cam kết chất lượng và hỗ trợ kỹ thuật lâu dài cho các sản phẩm của bạn.
          </p>

          {/* Khung Nội dung */}
          <div className="wp-box">
            {/* SECTION 1 */}
            <div className="wp-section">
              <h2 className="wp-section-title">1. Quy Định Chung về Bảo Hành</h2>

              <ul className="wp-list">
                <li>
                  <b>Phạm vi áp dụng:</b> Áp dụng cho các sản phẩm có thời hạn bảo hành được ghi rõ
                  trên mô tả sản phẩm (ví dụ: máy xay mini, máy lọc nước, đồ gia dụng điện tử...).
                </li>
                <li>
                  <b>Thời hạn:</b> Thời hạn bảo hành được tính từ ngày khách hàng nhận được sản phẩm.
                </li>
                <li>
                  <b>Yêu cầu:</b> Khách hàng cần cung cấp Mã Đơn Hàng hoặc Phiếu Bảo Hành khi yêu cầu hỗ trợ.
                </li>
              </ul>

              <div className="wp-note">
                <b>Lưu ý:</b> Các mặt hàng tiêu dùng nhanh (nến, xà phòng, v.v.) không áp dụng chính sách bảo hành.
              </div>
            </div>

            {/* SECTION 2 */}
            <div className="wp-section">
              <h2 className="wp-section-title">2. Điều Kiện Được Bảo Hành Miễn Phí</h2>

              <ul className="wp-list">
                <li>Sản phẩm gặp lỗi kỹ thuật do nhà sản xuất.</li>
                <li>Sản phẩm còn trong thời hạn bảo hành.</li>
                <li>Lỗi không thuộc các trường hợp từ chối bảo hành.</li>
                <li>Số serial và tem niêm phong còn nguyên vẹn.</li>
              </ul>
            </div>

            {/* SECTION 3 */}
            <div className="wp-section">
              <h2 className="wp-section-title">3. Các Trường Hợp Từ Chối Bảo Hành</h2>

              <ul className="wp-list">
                <li>Sản phẩm hỏng do thiên tai, cháy nổ hoặc sử dụng sai hướng dẫn.</li>
                <li>Khách hàng tự ý sửa chữa sản phẩm tại nơi không được ủy quyền.</li>
                <li>Sản phẩm đã hết thời hạn bảo hành.</li>
                <li>
                  Các bộ phận hao mòn tự nhiên (pin, lưỡi dao...) không nằm trong cam kết bảo hành.
                </li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="wp-support">
            <p>Nếu bạn cần gửi sản phẩm đi bảo hành hoặc cần hỗ trợ kỹ thuật:</p>
            <a href="#" className="wp-btn">
              LIÊN HỆ TRUNG TÂM BẢO HÀNH
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
