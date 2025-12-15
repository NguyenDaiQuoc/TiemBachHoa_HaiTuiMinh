import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/wishlist.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase";

export default function WishlistPage() {
  const navigate = useNavigate();
  const [showLoginWarning, setShowLoginWarning] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setShowLoginWarning(true);
    }
  }, []);
  const wishlistItems = [
    { id: 1, name: "Nến Thơm Organic Vỏ Cam Quế", price: 250000, stock: 15 },
    { id: 2, name: "Bộ Muỗng Gỗ Sồi Tối Giản", price: 180000, stock: 0 },
    { id: 3, name: "Hộp Trà Hoa Cúc Tự Nhiên (50g)", price: 125000, stock: 40 },
    { id: 4, name: "Xà Phòng Thủ Công Than Tre", price: 80000, stock: 8 },
  ];

  const formatCurrency = (n) => Number(n).toLocaleString("vi-VN") + " VNĐ";

  return (
    <>
      <Header />
      <FloatingButtons />

      <div className="wishlist-wrapper">
        <h2 className="wishlist-title">
          Sản Phẩm Yêu Thích Của Tôi ({wishlistItems.length} món)
        </h2>

        {wishlistItems.length > 0 ? (
          <div className="wishlist-grid">
            {wishlistItems.map((product) => (
              <div key={product.id} className="wishlist-card">
                <div className="wishlist-img">
                  <span className="wishlist-img-icon">📸</span>
                </div>

                <div className="wishlist-info">
                  <h3 className="wishlist-name">{product.name}</h3>
                  <p className="wishlist-price">{formatCurrency(product.price)}</p>
                  <p className="wishlist-stock">
                    {product.stock > 0
                      ? `Còn hàng (${product.stock})`
                      : "Hết hàng"}
                  </p>
                </div>

                <div className="wishlist-actions">
                  <button className="remove-btn" title="Xóa khỏi danh sách">
                    ❌
                  </button>

                  <button
                    disabled={product.stock <= 0}
                    className={`add-btn ${product.stock <= 0 ? "disabled" : ""}`}
                  >
                    {product.stock > 0 ? "🛒 Thêm vào Giỏ" : "Hết Hàng"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="wishlist-empty">
            <span className="empty-icon">🥺</span>
            <p className="empty-title">Danh sách yêu thích của bạn đang trống!</p>
            <p className="empty-desc">
              Hãy tìm kiếm và lưu lại những món đồ bạn muốn mua sắm.
            </p>
            <button className="continue-btn">Tiếp Tục Mua Sắm</button>
          </div>
        )}

        {wishlistItems.length > 0 && (
          <div className="wishlist-clear">
            <button className="clear-btn">Xóa tất cả sản phẩm hết hàng</button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
