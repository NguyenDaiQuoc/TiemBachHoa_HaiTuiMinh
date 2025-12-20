import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">

        {/* GIỚI THIỆU */}
        <div className="footer-section">
          <span className="footer-title">Tiệm Bách Hóa Hai Tụi Mình</span>
          <p className="footer-text">
            Giao nhanh tận nơi. Cảm ơn bạn đã tin chọn cửa hàng của chúng mình.
          </p>
          <h4 className="footer-title">Liên kết</h4>

          <div className="social-container">
            <a
              target="_blank"
              href="https://www.facebook.com/profile.php?id=61576489061227"
              className="social-btn facebook"
            >
              <i className="fab fa-facebook-f"></i> Facebook
            </a>

            <a href="#" className="social-btn shopee">
              <i className="fab fa-shopee"></i> Shopee
            </a>

            <a href="#" className="social-btn tiktok">
              <i className="fab fa-tiktok"></i> TikTok
            </a>

            <a href="#" className="social-btn instagram">
              <i className="fab fa-instagram"></i> Instagram
            </a>
          </div>
        </div>

        {/* HỖ TRỢ KHÁCH HÀNG */}
        <div className="footer-section">
          <span className="footer-title">Hỗ trợ khách hàng</span>
          <ul className="footer-list">
            <li><a href="/general-terms">Điều khoản và quy định chung</a></li>
            <li><a href="/return-policy">Chính sách đổi trả & hoàn tiền</a></li>
            <li><a href="/shipping-policy">Chính sách vận chuyển & giao nhận</a></li>
            <li><a href="/warranty-policy">Chính sách bảo hành sản phẩm</a></li>
            <li><a href="/contact">Hướng dẫn mua hàng</a></li>
            <li><a href="/payment-method">Quy định và hình thức thanh toán</a></li>
            <li><a href="/faqs">Các câu hỏi thường gặp (FAQs)</a></li>
          </ul>

          <h4 className="footer-title mt-4">Hình thức thanh toán</h4>
          <div className="footer-icons">
            <img src="/images/payment-cod.png" alt="COD" className="payment-icon" title="Thanh toán khi nhận hàng (COD)" />
            <img src="/images/payment-banking.png" alt="Banking" className="payment-icon" title="Chuyển khoản ngân hàng" />
            <img src="/images/payment-cash.png" alt="Cash" className="payment-icon" title="Tiền mặt" />
            <img src="/images/payment-zalopay.png" alt="ZaloPay" className="payment-icon" title="ZaloPay" />
            <img src="/images/payment-momo.png" alt="Momo" className="payment-icon" title="Momo" />
            <img src="/images/payment-vnpay.png" alt="VNPay" className="payment-icon" title="VNPay QR / VNPay Gateway" />

          </div>
        </div>

        {/* VỀ TIỆM */}
        <div className="footer-section">
          <span className="footer-title">Về Tiệm</span>
          <ul className="footer-list">
            <li><a href="/about-us">Giới thiệu</a></li>
            <li><a href="/story">Câu chuyện</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/contact">Liên hệ</a></li>
          </ul>
        </div>

        {/* NHẬN BẢN TIN */}
        <div className="footer-section">
          <span className="footer-title">Nhận bản tin</span>
          <div className="newsletter">
            <input type="text" placeholder="Email của bạn" className="newsletter-input" />
            <button className="newsletter-button">Gửi</button>
          </div>
        </div>

      </div>

      <div className="footer_bottom">
        <p className="footer_copyright">
          © 2025 Bách Hóa Nhà Hai Đứa. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
