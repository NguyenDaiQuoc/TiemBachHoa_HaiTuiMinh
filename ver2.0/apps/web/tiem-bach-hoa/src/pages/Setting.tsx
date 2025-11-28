// User Settings Page - Converted to minimal custom CSS classes
import React, { useState } from "react";
import "../../css/settings.css";

import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import SalesFloatingButton from "../components/SalesFloatingButton";

export default function UserSettingsPage() {
  const [activeTab, setActiveTab] = useState("account");

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
    </>
  );
}
