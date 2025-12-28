import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/wishlist.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase";
import { db } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { showSuccess, showError } from "../utils/toast";
import { addToCart as addToCartUtil } from "../utils/cart";

export default function WishlistPage() {
  const navigate = useNavigate();
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setShowLoginWarning(true);
        setWishlistItems([]);
        setLoading(false);
      } else {
        setShowLoginWarning(false);
        fetchFavorites(user.uid);
      }
    });
    return () => unsub();
  }, []);

  const fetchFavorites = async (uid: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'favorites'), where('userId', '==', uid));
      const snap = await getDocs(q);
      const favs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWishlistItems(favs);
    } catch (error: any) {
      console.error('Fetch wishlist error', error);
      showError('Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favId: string) => {
    try {
      await deleteDoc(doc(db, 'favorites', favId));
      setWishlistItems(wishlistItems.filter(w => w.id !== favId));
      showSuccess('Đã xóa khỏi danh sách yêu thích');
    } catch (error) {
      console.error('Remove favorite error', error);
      showError('Không thể xóa sản phẩm');
    }
  };

  const handleAddToCart = async (fav: any) => {
    if (!currentUser) {
      showError('Vui lòng đăng nhập để thêm vào giỏ hàng');
      setShowLoginWarning(true);
      return;
    }

    try {
      await addToCartUtil({
        productId: fav.productId,
        name: fav.name,
        price: Number(fav.price || 0),
        qty: 1,
        image: fav.image || '',
        slug: fav.slug || '',
        variation: fav.variation || ''
      });
      showSuccess('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Add to cart from wishlist error', error);
      showError('Không thể thêm vào giỏ hàng');
    }
  };

  const formatCurrency = (n: any) => Number(n).toLocaleString("vi-VN") + " VNĐ";

  return (
    <>
      <Header />
      <FloatingButtons />

      <div className="wishlist-wrapper">
        <h2 className="wishlist-title">Sản Phẩm Yêu Thích Của Tôi ({wishlistItems.length} món)</h2>

        {loading ? (
          <div style={{ padding: 30 }}>Đang tải danh sách yêu thích...</div>
        ) : wishlistItems.length > 0 ? (
          <div className="wishlist-grid">
            {wishlistItems.map((product) => (
              <div key={product.id} className="wishlist-card">
                <div className="wishlist-img">
                  {product.image ? <img src={product.image} alt={product.name} /> : <span className="wishlist-img-icon">📸</span>}
                </div>

                <div className="wishlist-info">
                  <h3 className="wishlist-name">{product.name}</h3>
                  <p className="wishlist-price">{formatCurrency(product.price)}</p>
                  <p className="wishlist-stock">{product.stock > 0 ? `Còn hàng (${product.stock})` : 'Hết hàng'}</p>
                </div>

                <div className="wishlist-actions">
                  <button className="remove-btn" title="Xóa khỏi danh sách" onClick={() => handleRemove(product.id)}>
                    ❌
                  </button>

                  <button
                    disabled={product.stock <= 0}
                    className={`add-btn ${product.stock <= 0 ? "disabled" : ""}`}
                    onClick={() => handleAddToCart(product)}
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
            <p className="empty-desc">Hãy tìm kiếm và lưu lại những món đồ bạn muốn mua sắm.</p>
            <button className="continue-btn" onClick={() => navigate('/products')}>Tiếp Tục Mua Sắm</button>
          </div>
        )}

      </div>

      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để xem danh sách yêu thích"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </>
  );
}
