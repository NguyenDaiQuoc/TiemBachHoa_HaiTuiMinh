import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/register.css";

// Input component dùng chung
function AuthInput({ label, placeholder, type = "text", required = false }) {
  return (
    <div className="auth-input-group">
      <label className="auth-label">
        {label} {required && <span className="auth-required">*</span>}
      </label>
      <input type={type} placeholder={placeholder} required={required} className="auth-input" />
    </div>
  );
}

// Form Register
function RegisterForm() {
  return (
    <form className="auth-form">
      <AuthInput label="Họ và Tên" placeholder="Ví dụ: Nguyễn Văn A" required />
      <AuthInput label="Email" placeholder="Địa chỉ email hợp lệ" type="email" required />
      <AuthInput label="Mật Khẩu" placeholder="Tối thiểu 6 ký tự" type="password" required />
      <AuthInput label="Xác nhận Mật Khẩu" placeholder="Nhập lại mật khẩu" type="password" required />

      <div className="auth-terms">
        <input type="checkbox" required className="auth-checkbox" />
        <label>
          Tôi đồng ý với <a href="#" className="auth-link">Điều khoản dịch vụ</a> và <a href="#" className="auth-link">Chính sách bảo mật</a>.
        </label>
      </div>

      <button type="submit" className="auth-btn">Đăng Ký</button>
    </form>
  );
}

// Main Register Page
export default function RegisterPage() {
  return (
    <div className="auth-wrapper">
      <Header />
      <div className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Gia Nhập Ngôi Nhà Ấm Cúng</h1>
          <RegisterForm />
        </div>
      </div>
      <FloatingButtons />
      <Footer />
    </div>
  );
}
