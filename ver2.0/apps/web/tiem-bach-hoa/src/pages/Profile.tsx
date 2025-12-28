import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase-auth";
import { db } from "../firebase-firestore";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection, query, where, orderBy, getDocs, deleteDoc } from "firebase/firestore";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { showSuccess, showError } from "../utils/toast";
import { addToCart as addToCartUtil } from "../utils/cart";
import { Toaster } from "react-hot-toast";
import "../../css/profile.css";

// --- Sidebar ---
function ProfileSidebar({ activeTab, setActiveTab }: any) {
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
function PersonalInfoContent({ userData, currentUser, onEdit, isEditing, onSave, onCancel, editData, setEditData }: any) {
  if (isEditing) {
    return (
      <div className="content-card">
        <h2 className="content-title">Chỉnh Sửa Thông Tin Cá Nhân</h2>
        <div className="info-list">
          <div className="info-item">
          <p className="info-value">{userData?.email || currentUser?.email || 'Chưa cập nhật'}</p>
            <input 
              type="text" 
              className="auth-input" 
              value={editData.account || ''} 
              onChange={(e) => setEditData({...editData, account: e.target.value})}
            />
          </div>
          <div className="info-item">
            <p className="info-label">Họ và Tên</p>
            <input 
              type="text" 
              className="auth-input" 
              value={editData.fullName || ''} 
              onChange={(e) => setEditData({...editData, fullName: e.target.value})}
            />
          </div>
          <div className="info-item">
            <p className="info-label">Email</p>
            <p className="info-value" style={{color: '#999'}}>{currentUser?.email || 'Chưa có email'} (không thể thay đổi)</p>
          </div>
          <div className="info-item">
            <p className="info-label">Số Điện Thoại</p>
            <input 
              type="tel" 
              className="auth-input" 
              value={editData.phone || ''} 
              onChange={(e) => setEditData({...editData, phone: e.target.value})}
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div className="info-item">
            <p className="info-label">Địa chỉ</p>
            <textarea 
              className="auth-input" 
              value={editData.address || ''} 
              onChange={(e) => setEditData({...editData, address: e.target.value})}
              placeholder="Nhập địa chỉ"
              rows={3}
            />
          </div>
        </div>
        <div style={{display: 'flex', gap: '12px', marginTop: '16px'}}>
          <button className="btn-edit" onClick={onSave}>Lưu Thay Đổi</button>
          <button className="btn-edit" onClick={onCancel} style={{background: '#ef4444', borderColor: '#ef4444'}}>Hủy</button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <h2 className="content-title">Thông Tin Cá Nhân</h2>
      <div className="info-list">
        <div className="info-item">
          <p className="info-label">Tên tài khoản</p>
          <p className="info-value">{userData?.account || 'Chưa cập nhật'}</p>
        </div>
        <div className="info-item">
          <p className="info-label">Họ và Tên</p>
          <p className="info-value">{userData?.fullName || 'Chưa cập nhật'}</p>
        </div>
        <div className="info-item">
          <p className="info-label">Email</p>
          <p className="info-value">{userData?.email || currentUser?.email || 'Chưa cập nhật'}</p>
        </div>
        <div className="info-item">
          <p className="info-label">Số Điện Thoại</p>
          <p className="info-value">{userData?.phone || 'Chưa cập nhật'}</p>
        </div>
        <div className="info-item">
          <p className="info-label">Địa chỉ</p>
          <p className="info-value">{userData?.address || 'Chưa cập nhật'}</p>
        </div>
        <div className="info-item">
          <p className="info-label">Trạng thái VIP</p>
          <p className="info-value">{userData?.vip || 'Thường'}</p>
        </div>
      </div>
      <button className="btn-edit" onClick={onEdit}>
        {!userData?.fullName ? 'Thêm Thông Tin' : 'Chỉnh Sửa'}
      </button>
    </div>
  );
}

// --- Nội dung: Sổ địa chỉ ---
function AddressContent({ userData, onEdit, isEditing, onSave, onCancel, editData, setEditData }: any) {
  if (isEditing) {
    return (
      <div className="content-card">
        <h2 className="content-title">Chỉnh Sửa Địa Chỉ</h2>
        <div className="info-list">
          <div className="info-item">
            <p className="info-label">Tên người nhận</p>
            <input 
              type="text" 
              className="auth-input" 
              value={editData.receiverName || ''} 
              onChange={(e) => setEditData({...editData, receiverName: e.target.value})}
              placeholder="Nhập tên người nhận hàng"
            />
          </div>
          <div className="info-item">
            <p className="info-label">Địa chỉ giao hàng</p>
            <textarea 
              className="auth-input" 
              value={editData.address || ''} 
              onChange={(e) => setEditData({...editData, address: e.target.value})}
              placeholder="Nhập địa chỉ chi tiết (số nhà, đường, phường, quận, thành phố)"
              rows={4}
            />
          </div>
          <div className="info-item">
            <p className="info-label">Số điện thoại liên hệ</p>
            <input 
              type="tel" 
              className="auth-input" 
              value={editData.phone || ''} 
              onChange={(e) => setEditData({...editData, phone: e.target.value})}
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
        <div style={{display: 'flex', gap: '12px', marginTop: '16px'}}>
          <button className="btn-edit" onClick={onSave}>Lưu Địa Chỉ</button>
          <button className="btn-edit" onClick={onCancel} style={{background: '#ef4444', borderColor: '#ef4444'}}>Hủy</button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <h2 className="content-title">Sổ Địa Chỉ Giao Hàng</h2>
      <div className="info-list">
        <div className="info-item">
          <p className="info-label">Tên người nhận</p>
          <p className="info-value">{userData?.receiverName || 'Chưa cập nhật'}</p>
        </div>
        <div className="info-item">
          <p className="info-label">Địa chỉ</p>
          <p className="info-value">{userData?.address || 'Chưa có địa chỉ'}</p>
        </div>
        <div className="info-item">
          <p className="info-label">Số điện thoại</p>
          <p className="info-value">{userData?.phone || 'Chưa cập nhật'}</p>
        </div>
      </div>
      <button className="btn-edit" onClick={onEdit}>
        {!userData?.address ? 'Thêm Địa Chỉ' : 'Chỉnh Sửa Địa Chỉ'}
      </button>
    </div>
  );
}

// --- Nội dung: Đổi mật khẩu ---
function PasswordContent({ onChangePassword }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [pwScore, setPwScore] = useState(0);

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++; // lowercase
    if (/[A-Z]/.test(pwd)) score++; // uppercase
    if (/[0-9]/.test(pwd)) score++; // number
    if (/[^a-zA-Z0-9]/.test(pwd)) score++; // special char
    return Math.min(score, 6);
  };

  const handleNewPasswordChange = (e: any) => {
    const pwd = e.target.value;
    setNewPassword(pwd);
    setPwScore(calculatePasswordStrength(pwd));
  };

  const handleSubmit = () => {
    setError('');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    onChangePassword(currentPassword, newPassword);
    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwScore(0);
  };

  return (
    <div className="content-card">
      <h2 className="content-title">Đổi Mật Khẩu</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="info-list">
          <div className="info-item">
            <p className="info-label">Mật khẩu hiện tại</p>
            <input 
              type="password" 
              className="auth-input" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
            />
          </div>
          <div className="info-item">
            <p className="info-label">Mật khẩu mới</p>
            <input 
              type="password" 
              className="auth-input" 
              value={newPassword} 
              onChange={handleNewPasswordChange}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              autoComplete="new-password"
            />
            {newPassword && (
              <div className="pw-strength" style={{marginTop: '8px'}}>
                <div className="pw-bar" data-score={pwScore} aria-hidden="true">
                  <div className="pw-fill" style={{ width: `${(pwScore/6)*100}%` }}></div>
                </div>
                <div className="pw-label" style={{fontSize: '13px', marginTop: '4px'}}>
                  Độ mạnh: {['Rất yếu','Yếu','Trung bình','Khá','Mạnh','Rất mạnh','Tuyệt vời'][pwScore]}
                </div>
                <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                  {!/[a-z]/.test(newPassword) && '• Cần có chữ thường '} 
                  {!/[A-Z]/.test(newPassword) && '• Cần có chữ HOA '} 
                  {!/[0-9]/.test(newPassword) && '• Cần có số '} 
                  {!/[^a-zA-Z0-9]/.test(newPassword) && '• Nên có ký tự đặc biệt '}
                  {newPassword.length < 8 && '• Nên dài hơn 8 ký tự'}
                </div>
              </div>
            )}
          </div>
          <div className="info-item">
            <p className="info-label">Xác nhận mật khẩu mới</p>
            <input 
              type="password" 
              className="auth-input" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
          </div>
        </div>
        {error && <p style={{color: 'red', marginTop: '8px'}}>{error}</p>}
        <button type="submit" className="btn-edit" style={{marginTop: '16px'}}>
          Đổi Mật Khẩu
        </button>
      </form>
    </div>
  );
}

// --- Nội dung: Quản lý đơn hàng ---
function OrdersContent({ orders, loading }: any) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Chờ Xử Lý': return '#f59e0b';
      case 'Đã Xác Nhận': return '#3b82f6';
      case 'Đang Giao': return '#8b5cf6';
      case 'Đã Giao': return '#10b981';
      case 'Đã Hủy': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="content-card">
        <h2 className="content-title">Quản Lý Đơn Hàng</h2>
        <p>Đang tải đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="content-card">
      <h2 className="content-title">Quản Lý Đơn Hàng ({orders.length} đơn)</h2>
      {orders.length === 0 ? (
        <div style={{textAlign: 'center', padding: '40px 20px'}}>
          <p style={{fontSize: '48px', marginBottom: '16px'}}>📦</p>
          <p style={{fontSize: '16px', color: '#666', marginBottom: '24px'}}>
            Bạn chưa có đơn hàng nào
          </p>
          <button className="btn-edit" onClick={() => navigate('/')}>
            Tiếp Tục Mua Sắm
          </button>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {orders.map((order: any) => (
            <div 
              key={order.id} 
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/order-tracking?orderId=${order.id}`)}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                <div>
                  <p style={{fontWeight: '600', marginBottom: '4px'}}>
                    Đơn hàng #{order.id.slice(0, 8)}
                  </p>
                  <p style={{fontSize: '14px', color: '#666'}}>
                    {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <p 
                    style={{
                      fontWeight: '600',
                      color: getStatusColor(order.status),
                      marginBottom: '4px'
                    }}
                  >
                    {order.status}
                  </p>
                  <p style={{fontWeight: '600', color: '#059669'}}>
                    {order.total?.toLocaleString()} VNĐ
                  </p>
                </div>
              </div>
              <div style={{borderTop: '1px solid #f3f4f6', paddingTop: '12px'}}>
                <p style={{fontSize: '14px', color: '#666', marginBottom: '8px'}}>
                  Sản phẩm: {order.items?.length || 0} món
                </p>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {(order.items || []).slice(0, 3).map((item: any, idx: number) => (
                    <span 
                      key={idx}
                      style={{
                        fontSize: '13px',
                        background: '#f3f4f6',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {item.name} x{item.quantity || item.qty}
                    </span>
                  ))}
                  {(order.items?.length || 0) > 3 && (
                    <span style={{fontSize: '13px', color: '#666'}}>
                      +{order.items.length - 3} sản phẩm khác
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Nội dung: Sản phẩm yêu thích ---
function FavoritesContent({ favorites, loading, onRemove, onAddToCart }: any) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="content-card">
        <h2 className="content-title">Sản Phẩm Yêu Thích</h2>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="content-card">
      <h2 className="content-title">Sản Phẩm Yêu Thích ({favorites.length} sản phẩm)</h2>
      {favorites.length === 0 ? (
        <div style={{textAlign: 'center', padding: '40px 20px'}}>
          <p style={{fontSize: '48px', marginBottom: '16px'}}>❤️</p>
          <p style={{fontSize: '16px', color: '#666', marginBottom: '24px'}}>
            Bạn chưa có sản phẩm yêu thích nào
          </p>
          <button className="btn-edit" onClick={() => navigate('/products')}>
            Khám Phá Sản Phẩm
          </button>
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px'}}>
          {favorites.map((fav: any) => (
            <div 
              key={fav.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                position: 'relative'
              }}
            >
              <button
                onClick={() => onRemove(fav.id)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                title="Xóa khỏi yêu thích"
              >
                ❌
              </button>
              <div 
                style={{
                  width: '100%',
                  height: '150px',
                  background: '#f3f4f6',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/product/${fav.productId}`)}
              >
                {fav.image ? (
                  <img src={fav.image} alt={fav.name} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px'}} />
                ) : (
                  <span style={{fontSize: '48px'}}>📦</span>
                )}
              </div>
              <h3 
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => navigate(`/product/${fav.productId}`)}
              >
                {fav.name}
              </h3>
              <p style={{fontSize: '16px', fontWeight: '600', color: '#059669', marginBottom: '12px'}}>
                {fav.price?.toLocaleString()} VNĐ
              </p>
              <button 
                className="btn-edit"
                onClick={() => onAddToCart(fav)}
                style={{width: '100%', padding: '8px', fontSize: '14px'}}
              >
                🛒 Thêm vào giỏ
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Component chính ---
export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Reset editing state when changing tabs
  useEffect(() => {
    setIsEditing(false);
    setEditData({});
  }, [activeTab]);

  // Fetch orders when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders' && currentUser && orders.length === 0) {
      fetchOrders();
    }
  }, [activeTab, currentUser]);

  // Fetch favorites when switching to favorites tab
  useEffect(() => {
    if (activeTab === 'favorites' && currentUser && favorites.length === 0) {
      fetchFavorites();
    }
  }, [activeTab, currentUser]);

  const fetchOrders = async () => {
    if (!currentUser) return;
    setOrdersLoading(true);
    try {
      const q = query(
        collection(db, 'orders'),
        where('userID', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error?.message?.includes('index')) {
        // Nếu thiếu index, lấy đơn hàng không sắp xếp
        try {
          const simpleQuery = query(
            collection(db, 'orders'),
            where('userID', '==', currentUser.uid)
          );
          const snapshot = await getDocs(simpleQuery);
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Sắp xếp thủ công
          ordersData.sort((a: any, b: any) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
          });
          setOrders(ordersData);
        } catch (err) {
          showError('Không thể tải đơn hàng');
        }
      } else {
        showError('Không thể tải đơn hàng');
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!currentUser) return;
    setFavoritesLoading(true);
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const favsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFavorites(favsData);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      showError('Không thể tải danh sách yêu thích');
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      showSuccess('Đã xóa khỏi danh sách yêu thích');
    } catch (error) {
      console.error('Error removing favorite:', error);
      showError('Không thể xóa sản phẩm');
    }
  };

  const handleAddToCart = async (favorite: any) => {
    if (!currentUser) {
      showError('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    try {
      // Use centralized cart helper to keep cart doc id and shape consistent
      await addToCartUtil({
        productId: favorite.productId,
        name: favorite.name,
        price: Number(favorite.price || 0),
        qty: 1,
        image: favorite.image || '',
        slug: favorite.slug || '',
        variation: favorite.variation || ''
      });
      showSuccess('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Không thể thêm vào giỏ hàng');
    }
  };

  // Listen to auth state changes and fetch user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (!user) {
        setShowLoginWarning(true);
        setLoading(false);
      } else {
        setShowLoginWarning(false);
        // Fetch user data from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            // Tạo document mới cho user
            const newUserData = {
              email: user.email,
              account: user.email?.split('@')[0] || '',
              fullName: user.displayName || '',
              phone: '',
              address: '',
              receiverName: '',
              profilePictureURL: user.photoURL || '',
              status: 'active',
              isDeactivated: 'none',
              vip: 'Thường',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await updateDoc(userDocRef, newUserData).catch(async () => {
              // Nếu updateDoc thất bại (document chưa tồn tại), dùng setDoc
              await setDoc(userDocRef, newUserData);
            });
            setUserData(newUserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditProfile = () => {
    setEditData({
      account: userData?.account || '',
      fullName: userData?.fullName || '',
      phone: userData?.phone || '',
      address: userData?.address || ''
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        account: editData.account,
        fullName: editData.fullName,
        phone: editData.phone,
        address: editData.address,
        updatedAt: serverTimestamp()
      });

      // Refresh user data
      const updatedDoc = await getDoc(userDocRef);
      if (updatedDoc.exists()) {
        setUserData(updatedDoc.data());
      }

      setIsEditing(false);
      showSuccess('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Không thể cập nhật thông tin. Vui lòng thử lại.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleEditAddress = () => {
    setEditData({
      receiverName: userData?.receiverName || '',
      address: userData?.address || '',
      phone: userData?.phone || ''
    });
    setIsEditing(true);
  };

  const handleSaveAddress = async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        receiverName: editData.receiverName,
        address: editData.address,
        phone: editData.phone,
        updatedAt: serverTimestamp()
      });

      // Refresh user data
      const updatedDoc = await getDoc(userDocRef);
      if (updatedDoc.exists()) {
        setUserData(updatedDoc.data());
      }

      setIsEditing(false);
      showSuccess('Cập nhật địa chỉ thành công!');
    } catch (error) {
      console.error('Error updating address:', error);
      showError('Không thể cập nhật địa chỉ. Vui lòng thử lại.');
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) {
      showError('Không tìm thấy thông tin người dùng');
      return;
    }

    try {
      // Reauthenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
      
      showSuccess('Đổi mật khẩu thành công!');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showError('Mật khẩu hiện tại không đúng');
      } else if (error.code === 'auth/weak-password') {
        showError('Mật khẩu mới quá yếu');
      } else {
        showError('Không thể đổi mật khẩu. Vui lòng thử lại.');
      }
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="content-card"><p>Đang tải thông tin...</p></div>;
    }

    switch (activeTab) {
      case 'info': 
        return (
          <PersonalInfoContent 
            userData={userData}
            currentUser={currentUser}
            onEdit={handleEditProfile}
            isEditing={isEditing}
            onSave={handleSaveProfile}
            onCancel={handleCancelEdit}
            editData={editData}
            setEditData={setEditData}
          />
        );
      case 'orders': 
        return <OrdersContent orders={orders} loading={ordersLoading} />;
      case 'address': 
        return (
          <AddressContent
            userData={userData}
            onEdit={handleEditAddress}
            isEditing={isEditing}
            onSave={handleSaveAddress}
            onCancel={handleCancelEdit}
            editData={editData}
            setEditData={setEditData}
          />
        );
      case 'favorites': 
        return (
          <FavoritesContent 
            favorites={favorites} 
            loading={favoritesLoading}
            onRemove={handleRemoveFavorite}
            onAddToCart={handleAddToCart}
          />
        );
      case 'password': 
        return <PasswordContent onChangePassword={handleChangePassword} />;
      default: 
        return (
          <PersonalInfoContent 
            userData={userData}
            currentUser={currentUser}
            onEdit={handleEditProfile}
            isEditing={isEditing}
            onSave={handleSaveProfile}
            onCancel={handleCancelEdit}
            editData={editData}
            setEditData={setEditData}
          />
        );
    }
  };

  return (
    <div className="profile-wrapper">
      <Header />
      <Toaster position="top-right" />

      <div className="profile-content">
        <h1 className="profile-title">Hồ Sơ Khách Hàng</h1>
        <div className="profile-main">
          <div className="profile-sidebar">
            <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <button className="btn-logout" onClick={handleLogout}>ĐĂNG XUẤT</button>
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
