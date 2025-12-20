import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase";
import "../../css/profile.css";

// --- Sidebar ---
function ProfileSidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'info', label: 'Thông Tin Cá Nhân', icon: '👤' },
    { id: 'orders', label: 'Quản Lý Đơn Hàng', icon: '📦' },
    { id: 'address', label: 'Sổ Địa Chỉ', icon: '📍' },
    { id: 'favorites', label: 'Sản Phẩm Yêu Thích', icon: '❤️' },
    { id: 'password', label: 'Đổi Mật Khẩu', icon: '🔒' },
  ];

  return (
    <div className="sidebar">
      <h3 className="sidebar-title">Quản Lý Tài Khoản</h3>
      <ul className="sidebar-menu">
        {menuItems.map(item => (
          <li key={item.id}>
            <button
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Nội dung: Thông tin cá nhân ---
function PersonalInfoContent() {
  return (
    <div className="content-card">
      <h2 className="content-title">Thông Tin Cá Nhân</h2>
      <div className="info-list">
        <div className="info-item">
          <p className="info-label">Họ và Tên</p>
          <p className="info-value">Nguyễn Thị An</p>
        </div>
        <div className="info-item">
          <p className="info-label">Email</p>
          <p className="info-value">an.nguyen@example.com</p>
        </div>
        <div className="info-item">
          <p className="info-label">Số Điện Thoại</p>
          <p className="info-value">090xxxxxxx</p>
        </div>
      </div>
      <button className="btn-edit">Chỉnh Sửa</button>
    </div>
  );
}

// --- Component chính ---
export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
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

  const renderContent = () => {
    switch (activeTab) {
      case 'info': return <PersonalInfoContent />;
      case 'orders': return <h2 className="content-heading">Quản Lý Đơn Hàng (List)</h2>;
      case 'address': return <h2 className="content-heading">Sổ Địa Chỉ Giao Hàng</h2>;
      case 'favorites': return <h2 className="content-heading">Danh Sách Yêu Thích</h2>;
      case 'password': return <h2 className="content-heading">Form Đổi Mật Khẩu</h2>;
      default: return <PersonalInfoContent />;
    }
  };

  return (
    <div className="profile-wrapper">
      <Header />

      <div className="profile-content">
        <h1 className="profile-title">Hồ Sơ Khách Hàng</h1>
        <div className="profile-main">
          <div className="profile-sidebar">
            <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <button className="btn-logout">ĐĂNG XUẤT</button>
          </div>
          <div className="profile-details">{renderContent()}</div>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để xem thông tin cá nhân"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </div>
  );
}
