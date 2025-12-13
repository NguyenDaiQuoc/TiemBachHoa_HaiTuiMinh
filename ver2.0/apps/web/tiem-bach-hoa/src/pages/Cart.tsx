import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
// import SalesFloatingButton from "../components/SalesFloatingButton";
import "../../css/cart.css";
import { auth, db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { removeFromCart, clearCart } from "../utils/cart";
import { showSuccess, showError } from "../utils/toast";
import { Toaster } from "react-hot-toast";

// ─── Cart Item Component ────────────────────────────────
function CartItem({ item, onQuantityChange, onRemove }: any) {
  const { productId, name, price, qty, image, variation } = item;
  const itemTotal = (price * qty).toLocaleString("vi-VN");

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        <img src={image || "https://via.placeholder.com/100"} alt={name} />
      </div>

      <div className="cart-item-info">
        <h3 className="cart-item-name">{name}</h3>
        {variation && (
          <p className="cart-item-variation">
            {variation.color && `Màu: ${variation.color}`}
            {variation.size && ` • Size: ${variation.size}`}
          </p>
        )}
        <p className="cart-item-price">
          Giá: {price.toLocaleString("vi-VN")} VNĐ
        </p>

        <button className="cart-remove-btn" onClick={() => onRemove(productId)}>
          Xóa
        </button>
      </div>

      <div className="cart-item-qty">
        <button
          className="qty-btn"
          onClick={() => onQuantityChange(productId, qty - 1)}
        >
          -
        </button>

        <span className="qty-number">{qty}</span>

        <button
          className="qty-btn"
          onClick={() => onQuantityChange(productId, qty + 1)}
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
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to cart from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      setCartItems([]);
      return;
    }

    const cartRef = doc(db, "cart", user.uid);
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCartItems(data.items || []);
      } else {
        setCartItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const subtotal = cartItems.reduce(
    (acc: number, item: any) => acc + item.price * item.qty,
    0
  );

  const shippingFee = subtotal > 500000 ? 0 : 30000;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const user = auth.currentUser;
    if (!user) return;

    const updatedItems = cartItems.map((item: any) =>
      item.productId === productId ? { ...item, qty: newQuantity } : item
    );

    try {
      const cartRef = doc(db, "cart", user.uid);
      await setDoc(cartRef, {
        userID: user.uid,
        items: updatedItems,
        lastUpdated: new Date(),
      });
      showSuccess("Đã cập nhật số lượng");
    } catch (error) {
      console.error("Error updating quantity:", error);
      showError("Không thể cập nhật số lượng");
    }
  };

  const handleRemoveItem = async (productId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const itemIndex = cartItems.findIndex((item: any) => item.productId === productId);
      if (itemIndex !== -1) {
        await removeFromCart(itemIndex);
        showSuccess("Đã xóa sản phẩm khỏi giỏ hàng");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      showError("Không thể xóa sản phẩm");
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      showSuccess("Đã xóa toàn bộ giỏ hàng");
    } catch (error) {
      console.error("Error clearing cart:", error);
      showError("Không thể xóa giỏ hàng");
    }
  };

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("vi-VN") + " VNĐ";

  return (
    <>
      <Header />
      <FloatingButtons />
      {/* <SalesFloatingButton show={true} ctaLink="/sale" /> */}
      <Toaster />

      <div className="cart-wrapper">
        <h1 className="cart-title">Giỏ Hàng Của Bạn</h1>

        {loading ? (
          <div className="cart-empty">Đang tải giỏ hàng...</div>
        ) : cartItems.length === 0 ? (
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

              {cartItems.map((item: any, index: number) => (
                <CartItem
                  key={item.productId || index}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}

              <div className="cart-actions">
                <button 
                  className="cart-back-btn"
                  onClick={() => navigate(-1)}
                >
                  ← Tiếp tục mua sắm
                </button>

                <button
                  className="cart-clear-btn"
                  onClick={handleClearCart}
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

              <button 
                className="checkout-btn"
                onClick={() => navigate('/checkout')}
              >
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
