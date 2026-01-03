import React, { useState, useEffect } from "react";
import "../../../css/admin/adminindex.css";
import { useNavigate } from "react-router-dom";
import { adminAuth as auth, adminDb as db } from "../../firebase-admin";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fade, setFade] = useState(true); // hiệu ứng fade-in/out
  const navigate = useNavigate();

  const LOGIN_KEY = "adminLoginInfo";

  // --- Kiểm tra trạng thái login khi load trang ---
  useEffect(() => {
    const saved = localStorage.getItem(LOGIN_KEY);
    if (saved) {
      const info = JSON.parse(saved);
      const now = new Date().getTime();
      if (now < info.expiry) {
        // Còn hạn → fade-out rồi chuyển hướng
        setFade(false);
        setTimeout(() => navigate("/admin/dashboard"), 100); // 0.3s fade
      } else {
        localStorage.removeItem(LOGIN_KEY);
      }
    }
  }, [navigate]);

  // --- Load email nếu trước đó tick ghi nhớ ---
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedAdminEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      if (adminDoc.exists() && adminDoc.data().role === "admin") {
        // --- Ghi nhớ email ---
        if (rememberMe) {
          // --- Ghi nhớ đăng nhập 7 ngày ---
          const expiry = new Date().getTime() + 24 * 60 * 60 * 1000 * 7;
          localStorage.setItem(LOGIN_KEY, JSON.stringify({ uid: user.uid, expiry }));
          localStorage.setItem("rememberedAdminEmail", email);
        } else {
          // ❗Không ghi nhớ → lưu chỉ trong sessionStorage
          sessionStorage.setItem("sessionAdmin", JSON.stringify({ uid: user.uid }));
          localStorage.removeItem("rememberedAdminEmail");
        }


        // Fade-out + navigate
        setFade(false);
        setTimeout(() => navigate("/admin/dashboard"), 300); // 0.3s fade
      } else {
        setError("Bạn không có quyền admin.");
        await auth.signOut();
      }
    } catch (err: any) {
      console.error(err);
      setError("Đăng nhập thất bại: " + err.message);
    }
  };

  return (
    <div className={`login-page ${fade ? "fade-in" : "fade-out"}`}>
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
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="form-group password-group">
              <label className="form-label">Mật Khẩu</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input password-input"
                required
                autoComplete="current-password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>

            {/* Lỗi */}
            {error && <div className="form-error">{error}</div>}

            {/* Ghi nhớ + Quên mật khẩu */}
            <div className="form-options">
              <div className="remember-container">
                <input
                  type="checkbox"
                  id="remember"
                  className="remember-checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="remember" className="remember-label">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <a href="/admin/forgotpassword" className="forgot-password">
                Quên mật khẩu?
              </a>
            </div>

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
