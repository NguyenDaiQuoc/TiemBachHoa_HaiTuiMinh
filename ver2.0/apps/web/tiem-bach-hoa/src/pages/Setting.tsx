// User Settings Page - Converted to minimal custom CSS classes
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/settings.css";

import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import SalesFloatingButton from "../components/SalesFloatingButton";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase";

export default function UserSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Listen to auth state changes like Cart.tsx
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setShowLoginWarning(true);
      } else {
        setShowLoginWarning(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Nằm ngoài wrapper */}
      <Header />
      <FloatingButtons />
      {/* <SalesFloatingButton /> */}

      {/* Wrapper chính */}
      <div className="settings-page">
        <div className="settings-container">
          <h1 className="settings-title">⚙️ Cài Đặt Cá Nhân</h1>

          <div className="settings-layout">
            {/* Sidebar */}
            <div className="settings-sidebar">
              <button
                className={`settings-menu-item ${
                  activeTab === "account" ? "active" : ""
                }`}
                onClick={() => setActiveTab("account")}
              >
                Thông tin Tài khoản
              </button>

              <button
                className={`settings-menu-item ${
                  activeTab === "password" ? "active" : ""
                }`}
                onClick={() => setActiveTab("password")}
              >
                Đổi Mật khẩu
              </button>

              <button
                className={`settings-menu-item ${
                  activeTab === "preference" ? "active" : ""
                }`}
                onClick={() => setActiveTab("preference")}
              >
                Cài đặt Chung
              </button>

              <button
                className={`settings-menu-item ${
                  activeTab === "notifications" ? "active" : ""
                }`}
                onClick={() => setActiveTab("notifications")}
              >
                Thông báo
              </button>

              <button className="settings-delete-btn">Xóa Tài Khoản</button>
            </div>

            {/* Content */}
            <div className="settings-content">
              <p>/* Nội dung tab sẽ render ở đây (giả lập) */</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nằm ngoài wrapper */}
      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để truy cập cài đặt"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </>
  );
}
