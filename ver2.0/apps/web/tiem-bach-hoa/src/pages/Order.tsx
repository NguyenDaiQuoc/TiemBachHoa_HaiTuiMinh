import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase";
import "../../css/order-history.css";

// Format tiền tệ
const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// Hàm lấy màu cho trạng thái
const getStatusColor = (status) => {
  switch (status) {
    case 'Đang Giao Hàng': return 'status-delivering';
    case 'Đã Hoàn Thành': return 'status-completed';
    case 'Đã Hủy': return 'status-canceled';
    default: return 'status-processing';
  }
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [showLoginWarning, setShowLoginWarning] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setShowLoginWarning(true);
    }
  }, []);
  const orders = [
    { id: 'NH20251111', date: '11/11/2025', total: 710000, status: 'Đang Giao Hàng', items: [{ name: 'Nến Thơm Organic', quantity: 2 }] },
    { id: 'NH20251025', date: '25/10/2025', total: 545000, status: 'Đã Hoàn Thành', items: [{ name: 'Hộp trà hoa cúc', quantity: 1 }, { name: 'Bánh quy', quantity: 1 }] },
    { id: 'NH20250901', date: '01/09/2025', total: 300000, status: 'Đã Hủy', items: [{ name: 'Xà phòng thủ công', quantity: 3 }] },
  ];

  const activeFilter = 'Tất Cả';
  const filters = ['Tất Cả', 'Đang Giao Hàng', 'Đã Hoàn Thành', 'Đã Hủy'];

  return (
    <div className="order-history-wrapper">
      <Header />

      <div className="order-history-content">
        <h2 className="page-title">Quản Lý Đơn Hàng Của Bạn</h2>

        {/* Bộ Lọc */}
        <div className="filters">
          {filters.map(filter => (
            <button
              key={filter}
              className={activeFilter === filter ? "filter-active" : "filter-inactive"}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Danh Sách Đơn Hàng */}
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <p className="label">Mã Đơn Hàng</p>
                  <p className="value">{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="label">Ngày Đặt</p>
                  <p className="value">{order.date}</p>
                </div>
              </div>

              <div className="order-details">
                <div>
                  <p className="order-items">
                    Sản phẩm: {order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                  </p>
                  <p className="order-total">Tổng Tiền: {formatCurrency(order.total)}</p>
                </div>

                <div className="order-actions">
                  <span className={`order-status ${getStatusColor(order.status)}`}>{order.status}</span>
                  <button className="order-btn">Xem Chi Tiết</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Phân Trang */}
        <div className="pagination">
          <button>← Trước</button>
          <span className="page-current">1</span>
          <button>2</button>
          <button>Sau →</button>
        </div>
      </div>

      <FloatingButtons />
      <Footer />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để xem lịch sử đơn hàng"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </div>
  );
}
