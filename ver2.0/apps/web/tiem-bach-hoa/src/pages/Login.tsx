import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/login.css";

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

// Form Login
function LoginForm() {
  return (
    <form className="auth-form">
      <AuthInput label="Email" placeholder="Địa chỉ email của bạn" type="email" required />
      <AuthInput label="Mật Khẩu" placeholder="Nhập mật khẩu" type="password" required />

      <div className="auth-options">
        <label className="auth-checkbox-label">
          <input type="checkbox" className="auth-checkbox" /> Ghi nhớ đăng nhập
        </label>
        <a href="#" className="auth-link">Quên mật khẩu?</a>
      </div>

      <button type="submit" className="auth-btn">Đăng Nhập</button>
    </form>
  );
}

// Main Login Page
export default function LoginPage() {
  return (
    <div className="auth-wrapper">
      <Header />
      <div className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Chào Mừng Trở Lại!</h1>
          <LoginForm />
        </div>
      </div>
      <FloatingButtons />
      <Footer />
    </div>
  );
}
