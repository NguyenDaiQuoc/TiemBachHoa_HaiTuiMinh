import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Nothing404.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="nf-wrapper">
      <Header />

      {/* Content */}
      <div className="nf-container">
        <div className="nf-box">
          <h1 className="nf-code">404</h1>

          <h2 className="nf-title">Oops! Lạc đường rồi ạ...</h2>
          <p className="nf-desc">
            Dường như trang bạn tìm kiếm không tồn tại, hoặc đã chuyển đi nơi khác rồi.
            Đừng lo lắng! Hai Tụi Mình sẽ giúp bạn quay lại.
          </p>

          <div className="nf-icon">
            <img src="/images/404.png" alt="ErrorImg" />
          </div>

          {/* Buttons */}
          <div className="nf-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate("/")}
            >
              Về Trang Chủ Ngay
            </button>
            <button
              className="btn-outline"
              onClick={() => navigate("/categories/new-arrival")}
            >
              Khám Phá Hàng Mới
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="nf-search-area">
          <p className="nf-search-label">Hoặc bạn muốn tìm kiếm một món đồ xinh xắn?</p>

          <div className="nf-search-bar">
            <input type="text" placeholder="Tìm kiếm sản phẩm, danh mục..." />
            <button className="nf-search-btn">Tìm</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
