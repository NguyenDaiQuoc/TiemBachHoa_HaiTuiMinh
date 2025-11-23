import React, { useState } from "react";
import "../../../css/adminindex.css"; // CSS thuần mới
import { useNavigate } from "react-router-dom";
// import { auth, db } from "../../../../../../../firebase.js"; // file firebase.js / firebase.ts bạn tạo
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 1️⃣ Login với Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Kiểm tra role admin trong Firestore
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      if (adminDoc.exists() && adminDoc.data().role === "admin") {
        // Thành công → redirect đến dashboard
        alert("Đăng nhập thành công! Chuyển hướng đến Dashboard...");
        navigate("/dashboard"); // React Router
      } else {
        setError("Bạn không có quyền admin.");
        await auth.signOut(); // sign out nếu không phải admin
      }
    } catch (err: any) {
      console.error(err);
      setError("Đăng nhập thất bại: " + err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Cột Trái */}
        <div className="login-banner">
          <div className="login-brand">Tiệm Bách Hóa Hai Tụi Mình</div>
          <div className="login-subtitle">Hệ Thống Quản Trị (CMS)</div>
          <p className="login-banner-text">
            "Đăng nhập để quản lý và vận hành công việc kinh doanh của bạn."
          </p>
          <div className="login-icon">🛠️</div>
        </div>

        {/* Cột Phải: Form */}
        <div className="login-form-container">
          <header className="login-header">
            <h1 className="login-title">Đăng Nhập Quản Trị</h1>
            <p className="login-note">Chỉ dành cho nhân viên nội bộ.</p>
          </header>

          <form onSubmit={handleLogin} className="login-form">
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                placeholder="Nhập email admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Mật Khẩu</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Lỗi */}
            {error && <div className="form-error">{error}</div>}

            {/* Tùy chọn & Quên mật khẩu */}
            <div className="form-options">
              <div className="remember-container">
                <input type="checkbox" id="remember" className="remember-checkbox" />
                <label htmlFor="remember" className="remember-label">Ghi nhớ đăng nhập</label>
              </div>
              <a href="#" className="forgot-password">Quên mật khẩu?</a>
            </div>

            {/* Nút Đăng Nhập */}
            <button type="submit" className="login-button">
              ĐĂNG NHẬP
            </button>
          </form>

          <footer className="login-footer">
            © 2025 Tiệm Bách Hóa. Hệ thống CMS v1.0
          </footer>
        </div>
      </div>
    </div>
  );
}
