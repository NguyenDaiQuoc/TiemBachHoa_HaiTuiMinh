import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/forgot.css";

// --- Component Input ---
function AuthInput({ label, placeholder, type = "text", required = false }: any) {
  return (
    <div className="fp-input-group">
      <label className="fp-label">
        {label} {required && <span className="fp-required">*</span>}
      </label>
      <input type={type} placeholder={placeholder} required={required} className="fp-input" />
    </div>
  );
}

// --- Component chính ---
export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <div className="fp-wrapper">
      {/* Header */}
      <Header />

      {/* Content */}
      <div className="fp-content">
        <div className="fp-card">
          <h1 className="fp-title">Quên Mật Khẩu</h1>
          <p className="fp-subtitle">
            Vui lòng nhập email hoặc số điện thoại đã đăng ký để chúng tôi gửi liên kết khôi phục.
          </p>

          {isSent ? (
            <div className="fp-success">
              <span className="fp-success-icon">✅</span>
              <p className="fp-success-title">Liên kết khôi phục đã được gửi!</p>
              <p className="fp-success-text">
                Vui lòng kiểm tra hộp thư đến (bao gồm cả thư mục Spam) và làm theo hướng dẫn.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="fp-form">
              <AuthInput label="Email hoặc Số Điện Thoại" placeholder="Nhập Email hoặc SĐT" required />
              <button type="submit" className="fp-btn">
                Gửi Liên Kết Khôi Phục
              </button>
            </form>
          )}

          <div className="fp-back">
            <a href="#">← Quay lại Đăng Nhập</a>
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <FloatingButtons />

      {/* Footer */}
      <Footer />
    </div>
  );
}

