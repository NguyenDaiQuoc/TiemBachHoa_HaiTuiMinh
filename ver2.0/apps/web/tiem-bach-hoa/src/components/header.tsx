import React, { useState } from "react";

export default function Header() {
  const [searchValue, setSearchValue] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);

  const cartItemsData = [
    { name: "Sản phẩm A", qty: 1, price: 100000, image: "https://picsum.photos/80" },
    { name: "Sản phẩm B", qty: 2, price: 50000, image: "https://picsum.photos/50" },
  ];

  const cartTotalCount = cartItemsData.reduce((t, i) => t + i.qty, 0);
  const cartTotalPrice = cartItemsData.reduce((t, i) => t + i.qty * i.price, 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  return (
    <div className="header">
      <div className="header-container flex justify-between items-center p-4">

        {/* LOGO */}
        <a href="/" className="header-logo-text font-bold text-lg">
          Tiệm Bách Hóa Hai Tụi Mình
        </a>

        {/* MENU */}
        <div className="header-menu flex gap-6">
          <a href="/">Trang chủ</a>
          <a href="/products">Sản phẩm</a>
          <a href="/combo">Combo & Ưu đãi</a>
          <a href="/blog">Blog</a>
          <a href="/contact">Liên hệ</a>
        </div>

        {/* SEARCH + USER + CART */}
        <div className="header-icons">

          {/* SEARCH */}
          <div className="search-field">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>

          {/* USER */}
          <div
            className="relative"
            onMouseEnter={() => setIsUserDropdownOpen(true)}
            onMouseLeave={() => setIsUserDropdownOpen(false)}
          >
            <span className="user-icon">👤</span>

            {isUserDropdownOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-list">
                  <a href="/profile">Thông tin cá nhân</a>
                  <a href="/wishlist">❤️ Danh mục yêu thích</a>
                  <a href="/orders">Đơn mua hàng</a>
                  <a href="/coupons">Mã giảm giá</a>
                  <a className="user-logout">Đăng xuất</a>
                </div>
              </div>
            )}
          </div>

          {/* CART */}
          <div
            className="relative"
            onMouseEnter={() => setIsCartDropdownOpen(true)}
            onMouseLeave={() => setIsCartDropdownOpen(false)}
          >
            <span className="cart-dropdown">
              🛒
              {cartTotalCount > 0 && (
                <span className="cart-count">{cartTotalCount}</span>
              )}
            </span>

            {isCartDropdownOpen && (
              <div className="cart-dropdown-menu">
                <div className="cart-header">
                  Giỏ hàng ({cartTotalCount} SP)
                </div>

                <ul className="cart-dropdown-list">
                  {cartItemsData.map((item, index) => (
                    <li key={index} className="cart-items">
                      <div className="cart-content">
                        <img src={item.image} alt={item.name} className="cart-img" />
                        <div>
                          <div className="cart-name">{item.name}</div>
                          <div className="cart-price">
                            SL: {item.qty} x {formatCurrency(item.price)}
                          </div>
                        </div>
                      </div>
                      <span className="cart-total">
                        {formatCurrency(item.qty * item.price)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="cart-footer">
                  <div className="cart-totalprice">
                    <span>Tổng cộng:</span>
                    <span className="cart-totalprice-value">
                      {formatCurrency(cartTotalPrice)}
                    </span>
                  </div>

                  <button className="cart-checkout-button">
                    Xem Giỏ Hàng & Thanh Toán
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
