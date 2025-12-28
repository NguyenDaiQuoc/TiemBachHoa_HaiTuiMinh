import React from "react";
import "../../css/term.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";

export default function TermsAndConditionsPage() {
  return (
    <div className="terms-page">

      {/* Header */}
      <Header />

      {/* CONTENT */}
      <div className="terms-container">

        <h1 className="terms-title">Điều Khoản & Quy Định Chung</h1>
        <p className="terms-updated">Cập nhật lần cuối: 11/11/2025</p>
        <p className="terms-intro">
          Vui lòng đọc kỹ các điều khoản này trước khi sử dụng dịch vụ của
          Tiệm Bách Hóa Hai Tụi Mình. Việc bạn truy cập và sử dụng website đồng
          nghĩa với việc bạn đồng ý với toàn bộ nội dung dưới đây.
        </p>

        <div className="policy-box">

          {/* 1. Tài khoản */}
          <div className="policy-section">
            <h2 className="policy-heading">1. Quy Định về Tài Khoản</h2>
            <ul className="policy-list">
              <li><strong>Đăng ký tài khoản:</strong> Bạn phải cung cấp thông tin chính xác, đầy đủ và cập nhật.</li>
              <li><strong>Bảo mật:</strong> Bạn chịu trách nhiệm đối với mật khẩu và hoạt động trên tài khoản.</li>
              <li><strong>Hạn chế:</strong> Tiệm có quyền khóa tài khoản nếu phát hiện hành vi vi phạm.</li>
            </ul>
          </div>

          {/* 2. Giao dịch */}
          <div className="policy-section">
            <h2 className="policy-heading">2. Điều Khoản Giao Dịch và Đơn Hàng</h2>
            <ul className="policy-list">
              <li><strong>Xác nhận đơn hàng:</strong> Đơn hàng hợp lệ khi có email xác nhận từ Tiệm.</li>
              <li><strong>Giá sản phẩm:</strong> Giá có thể thay đổi mà không báo trước.</li>
              <li><strong>Hủy đơn hàng:</strong> Khách có thể hủy trước khi Tiệm chuyển qua bước đóng gói.</li>
            </ul>
          </div>

          {/* 3. Sở hữu trí tuệ */}
          <div className="policy-section">
            <h2 className="policy-heading">3. Sở Hữu Trí Tuệ</h2>
            <p className="policy-text">
              Tất cả nội dung (hình ảnh, văn bản, logo, video…) thuộc quyền sở hữu của Tiệm hoặc đối tác cấp phép.
              Nghiêm cấm sao chép khi chưa được cho phép bằng văn bản.
            </p>
          </div>

          {/* 4. Trách nhiệm */}
          <div className="policy-section">
            <h2 className="policy-heading">4. Giới Hạn Trách Nhiệm</h2>
            <p className="policy-text">
              Tiệm cung cấp dịch vụ tốt nhất có thể nhưng không chịu trách nhiệm cho các thiệt hại gián tiếp, ngẫu nhiên,
              trừ trường hợp luật định.
            </p>
          </div>

        </div>

        {/* CTA */}
        <div className="support-box">
          <p>Nếu có bất kỳ câu hỏi nào về Điều khoản, vui lòng liên hệ:</p>
          <a href="#" className="support-button">GỬI YÊU CẦU HỖ TRỢ</a>
        </div>
      </div>

      {/* Footer + Floating */}
      <Footer />
      <FloatingButtons />
    </div>
  );
}
