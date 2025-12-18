// React CheckoutPage (CSS removed from JSX)
// Import Header, Footer, FloatingButtons normally
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase";
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { clearCart } from '../utils/cart';
import { fetchActiveDeals, applyDealsToPrice } from '../utils/deals';
import "../../css/checkout.css"

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loadingCart, setLoadingCart] = useState<boolean>(true);

  // form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setShowLoginWarning(true);
    }
  }, []);
  // Load cart from Firestore (single read)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setCartItems([]);
      setLoadingCart(false);
      return;
    }

    (async () => {
      try {
        const cartRef = doc(db, 'cart', user.uid);
        const snap = await getDoc(cartRef);
        const items = snap.exists() ? (snap.data().items || []) : [];

        // apply active deals (client-side)
        const deals = await fetchActiveDeals();
        const applied = items.map((it:any) => {
          const { price } = applyDealsToPrice(it.price, String(it.productId || it.id || ''), deals);
          return { ...it, appliedPrice: price };
        });

        setCartItems(applied);
      } catch (err) {
        console.error('load cart in checkout', err);
        setCartItems([]);
      } finally {
        setLoadingCart(false);
      }
    })();
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.appliedPrice || item.price) * (item.quantity || item.qty || 1), 0);
  const shippingFee = subtotal > 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  return (
    <div className="checkout-wrapper">
      <Header />

      <div className="checkout-container">
        {/* Left */}
        <div className="checkout-left">
          <h1 className="checkout-title">Thanh Toán Đơn Hàng</h1>

          {/* Customer Info */}
          <section className="section-block">
            <h2 className="section-title">1. Thông Tin Nhận Hàng</h2>

            <div className="grid-2">
              <div className="form-group">
                <label>Họ và Tên *</label>
                <input value={fullName} onChange={e=>setFullName(e.target.value)} type="text" placeholder="Ví dụ: Nguyễn Văn A" required />
              </div>

              <div className="form-group">
                <label>Số Điện Thoại *</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="Ví dụ: 090xxxxxxx" required />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Ví dụ: email@domain.com" />
            </div>

            <div className="form-group">
              <label>Địa Chỉ Chi Tiết *</label>
              <input value={address} onChange={e=>setAddress(e.target.value)} type="text" placeholder="Số nhà, tên đường, phường/xã" required />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Tỉnh / Thành phố *</label>
                <input value={city} onChange={e=>setCity(e.target.value)} type="text" required />
              </div>

              <div className="form-group">
                <label>Quận / Huyện *</label>
                <input value={district} onChange={e=>setDistrict(e.target.value)} type="text" required />
              </div>
            </div>

            <div className="form-group">
              <label>Ghi Chú</label>
              <input value={notes} onChange={e=>setNotes(e.target.value)} type="text" placeholder="Ví dụ: Giao giờ hành chính" />
            </div>
          </section>

          {/* Shipping */}
          <section className="section-block">
            <h2 className="section-title">2. Phương Thức Vận Chuyển</h2>

            <div className="shipping-option">
              <label>
                <input type="radio" name="shipping" defaultChecked />
                Vận chuyển tiêu chuẩn (3-5 ngày)
              </label>
              <span>{shippingFee === 0 ? "Miễn phí" : shippingFee.toLocaleString() + " VNĐ"}</span>
            </div>
          </section>

          {/* Payment */}
          <section className="section-block">
            <h2 className="section-title">3. Phương Thức Thanh Toán</h2>

            <div className="payment-option">
              <label>
                <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={()=>setPaymentMethod('COD')} /> COD - Thanh toán khi nhận hàng
              </label>
            </div>

            <div className="payment-option">
              <label>
                <input type="radio" name="payment" checked={paymentMethod === 'BANK'} onChange={()=>setPaymentMethod('BANK')} /> Chuyển khoản ngân hàng
              </label>
            </div>
          </section>
        </div>

        {/* Right */}
        <div className="checkout-right">
          <div className="summary-box">
            <h2 className="summary-title">Đơn Hàng Của Bạn ({cartItems.length} sản phẩm)</h2>

            <div className="summary-items">
              {loadingCart ? (
                <div>Đang tải giỏ hàng...</div>
              ) : cartItems.map((item) => (
                <div key={item.productId || item.id} className="summary-item">
                  <span>
                    {item.name} x {item.quantity || item.qty}
                  </span>
                  <span>{((item.appliedPrice || item.price) * (item.quantity || item.qty)).toLocaleString()} VNĐ</span>
                </div>
              ))}
            </div>

            <div className="summary-line"><span>Tạm tính</span><span>{subtotal.toLocaleString()} VNĐ</span></div>
            <div className="summary-line"><span>Phí vận chuyển</span><span>{shippingFee === 0 ? "Miễn phí" : shippingFee.toLocaleString() + " VNĐ"}</span></div>
            <div className="summary-line"><span>Mã giảm giá</span><span>0 VNĐ</span></div>

            <div className="summary-total">
              <span>Tổng Thanh Toán</span>
              <span>{total.toLocaleString()} VNĐ</span>
            </div>

            <button className="btn-submit" disabled={isSubmitting} onClick={async ()=>{
              // basic validation + prevent double submit
              if (isSubmitting) return;
              const user = auth.currentUser;
              if (!user) { setShowLoginWarning(true); return; }
              if (!fullName || !phone || !address) { alert('Vui lòng điền tên, số điện thoại và địa chỉ'); return; }
              setIsSubmitting(true);
              try {
                // Check if user is blocked in users collection
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && (userDocSnap.data() as any).isDeactivated === 'blocked') {
                  alert('Tài khoản của bạn đang bị chặn. Vui lòng liên hệ CSKH để được hỗ trợ.');
                  setIsSubmitting(false);
                  return;
                }
                const orderData = {
                  userID: user.uid,
                  customerName: fullName,
                  phone,
                  email,
                  address,
                  city,
                  district,
                  notes,
                  items: cartItems,
                  subtotal,
                  shippingFee,
                  total,
                  paymentMethod,
                  status: 'Chờ Xử Lý',
                  createdAt: serverTimestamp(),
                };

                const docRef = await addDoc(collection(db,'orders'), orderData);

                // clear cart
                await clearCart();

                // navigate to confirmation page and pass orderId so OrderConfirm can load full details
                navigate(`/order-confirm?orderId=${docRef.id}`);
              } catch (err) {
                console.error('create order', err);
                alert('Không thể tạo đơn hàng. Vui lòng thử lại.');
                setIsSubmitting(false);
              }
            }}>{isSubmitting ? 'Đang gửi đơn...' : 'Hoàn tất đặt hàng'}</button>
          </div>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để tiến hành thanh toán"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </div>
  );
}