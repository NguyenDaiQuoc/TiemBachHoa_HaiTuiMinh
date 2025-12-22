import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase";
import "../../css/payment.css";

// Hàm lấy Icon theo loại thẻ
const getCardIcon = (type: any) => {
    switch (type.toLowerCase()) {
        case 'visa':
        case 'mastercard':
        case 'jcb':
            return '💳';
        case 'momo':
            return '📲';
        default:
            return '💰';
    }
};

// --- Component Thẻ Phương Thức Thanh Toán ---
function PaymentCard({ method, isDefault }: any) {
  return (
    <div className={`card-wrapper ${isDefault ? 'card-default' : ''}`}>
      <div className="card-header">
        <div className="card-info">
          <span className="card-icon">{getCardIcon(method.type)}</span>
          <h3 className="card-name">
            {method.name}
            {isDefault && <span className="card-default-label">Mặc định</span>}
          </h3>
        </div>
        <div className="card-actions">
          <button className="action-edit">Sửa</button>
          <span>|</span>
          <button className="action-delete">Xóa</button>
        </div>
      </div>

      <p className="card-text">Loại thẻ: {method.type}</p>
      {method.last4 && <p className="card-text">Số cuối: **** **** **** {method.last4}</p>}
      {method.expiry && <p className="card-text">Hạn sử dụng: {method.expiry}</p>}

      {!isDefault && <button className="btn-set-default">Đặt làm mặc định</button>}
    </div>
  );
}

// --- Component Chính ---
export default function PaymentMethodsPage() {
  const navigate = useNavigate();
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
  const paymentMethods = [
    { id: 1, name: 'Thẻ Visa - Nguyễn V. A', type: 'Visa', last4: '4567', expiry: '12/28', isDefault: true },
    { id: 2, name: 'Ví Điện Tử MoMo', type: 'Momo', last4: '090xxxxxxx', expiry: 'N/A', isDefault: false },
  ];

  return (
    <div className="payment-wrapper">
      <Header />

      <div className="payment-content">
        <h2>Quản Lý Phương Thức Thanh Toán</h2>

        <div className="payment-trust">
          <span>🛡️</span>
          <p>Mọi thông tin thanh toán đều được mã hóa và bảo mật theo tiêu chuẩn PCI DSS.</p>
        </div>

        <div className="payment-add">
          <button className="btn-add">
            <span>+</span> Thêm Phương Thức Thanh Toán Mới
          </button>
        </div>

        <div className="payment-list">
          {paymentMethods.length > 0
            ? paymentMethods.map((method) => <PaymentCard key={method.id} method={method} isDefault={method.isDefault} />)
            : <div className="payment-empty"><p>Bạn chưa lưu phương thức thanh toán nào.</p></div>
          }
        </div>

        <p className="payment-note">
          * Lưu ý: Phương thức thanh toán khi nhận hàng (COD) luôn khả dụng và không cần lưu ở đây.
        </p>
      </div>

      <FloatingButtons />
      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để quản lý phương thức thanh toán"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </div>
  );
}
