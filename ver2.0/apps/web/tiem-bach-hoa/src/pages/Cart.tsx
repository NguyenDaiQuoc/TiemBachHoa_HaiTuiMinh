import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import SalesFloatingButton from "../components/SalesFloatingButton";
import "../../css/cart.css";

// ─── Cart Item Component ────────────────────────────────
function CartItem({ item, onQuantityChange, onRemove }) {
  const { id, name, price, quantity, image } = item;
  const itemTotal = (price * quantity).toLocaleString("vi-VN");

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        <img src={image} alt={name} />
      </div>

      <div className="cart-item-info">
        <h3 className="cart-item-name">{name}</h3>
        <p className="cart-item-price">
          Giá: {price.toLocaleString("vi-VN")} VNĐ
        </p>

        <button className="cart-remove-btn" onClick={() => onRemove(id)}>
          Xóa
        </button>
      </div>

      <div className="cart-item-qty">
        <button
          className="qty-btn"
          onClick={() => onQuantityChange(id, quantity - 1)}
        >
          -
        </button>

        <span className="qty-number">{quantity}</span>

        <button
          className="qty-btn"
          onClick={() => onQuantityChange(id, quantity + 1)}
        >
          +
        </button>
      </div>

      <div className="cart-item-total">{itemTotal} VNĐ</div>
    </div>
  );
}

// ─── Main Cart Page ─────────────────────────────────────
export default function CartPage() {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Nến Thơm Organic Vỏ Cam Quế",
      price: 180000,
      quantity: 2,
      image: "https://via.placeholder.com/100/E5D3BD?text=Nến",
    },
    {
      id: 2,
      name: "Bánh quy Yến mạch (Hộp)",
      price: 150000,
      quantity: 1,
      image: "https://via.placeholder.com/100/E5D3BD?text=Bánh",
    },
    {
      id: 3,
      name: "Bộ Gia Vị 5 Món",
      price: 320000,
      quantity: 1,
      image: "https://via.placeholder.com/100/E5D3BD?text=GiaVị",
    },
  ]);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const shippingFee = subtotal > 500000 ? 0 : 30000;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;

    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const formatCurrency = (amount) =>
    amount.toLocaleString("vi-VN") + " VNĐ";

  return (
    <>
      <Header />
      <FloatingButtons />
      {/* <SalesFloatingButton /> */}

      <div className="cart-wrapper">
        <h1 className="cart-title">Giỏ Hàng Của Bạn</h1>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            Giỏ hàng trống. Hãy thêm những điều nhỏ xinh vào tổ ấm của bạn!
          </div>
        ) : (
          <div className="cart-layout">
            {/* LEFT LIST */}
            <div className="cart-list">
              <div className="cart-header-row">
                <span className="col-product"></span>
                <span className="col-name">Sản phẩm</span>
                <span className="col-qty">Số lượng</span>
                <span className="col-total">Tổng</span>
              </div>

              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}

              <div className="cart-actions">
                <button className="cart-back-btn">← Tiếp tục mua sắm</button>

                <button
                  className="cart-clear-btn"
                  onClick={() => setCartItems([])}
                >
                  Xóa toàn bộ giỏ hàng
                </button>
              </div>
            </div>

            {/* RIGHT SUMMARY */}
            <div className="cart-summary">
              <h2 className="summary-title">Tóm Tắt Đơn Hàng</h2>

              <div className="summary-block">
                <div className="summary-row">
                  <span>Tạm tính ({cartItems.length} sản phẩm):</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="summary-row">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {shippingFee === 0
                      ? "Miễn phí"
                      : formatCurrency(shippingFee)}
                  </span>
                </div>

                <div className="summary-row">
                  <span>Giảm giá:</span>
                  <span className="discount">- {formatCurrency(discount)}</span>
                </div>
              </div>

              <div className="summary-total">
                <span>Tổng cộng:</span>
                <span className="total-price">{formatCurrency(total)}</span>
              </div>

              <button className="checkout-btn">
                Tiến Hành Thanh Toán
              </button>

              <p className="shipping-note">
                Miễn phí vận chuyển cho đơn hàng trên 500K
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
