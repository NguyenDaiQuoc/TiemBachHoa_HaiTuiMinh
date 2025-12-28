import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import LoginWarning from "../components/LoginWarning";
import { auth } from "../firebase-auth";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, addDoc } from 'firebase/firestore';
import { showSuccess, showError } from '../utils/toast';
import "../../css/order-history.css";

// Format tiền tệ
const formatCurrency = (amount: any) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// Hàm lấy màu cho trạng thái
const getStatusColor = (status: any) => {
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
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Listen to auth state changes like Cart.tsx and subscribe to user's orders
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    const off = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setShowLoginWarning(true);
        setOrders([]);
        return;
      }
      setShowLoginWarning(false);
      // subscribe to orders for this user
      try {
        // Listen to both possible fields 'userId' and 'userID' (some orders use different casing)
        const q1 = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const q2 = query(collection(db, 'orders'), where('userID', '==', user.uid), orderBy('createdAt', 'desc'));

        const unsub1 = onSnapshot(q1, (snap) => {
          const docs: any[] = [];
          snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
          setOrders(prev => {
            // merge with prev (which may include from q2)
            const map = new Map<string, any>();
            prev.forEach(p => map.set(p.id, p));
            docs.forEach(d => map.set(d.id, d));
            return Array.from(map.values()).sort((a,b)=>((b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
          });
        }, (err) => { console.error('orders listen error (userId)', err); });

        const unsub2 = onSnapshot(q2, (snap) => {
          const docs: any[] = [];
          snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
          setOrders(prev => {
            const map = new Map<string, any>();
            prev.forEach(p => map.set(p.id, p));
            docs.forEach(d => map.set(d.id, d));
            return Array.from(map.values()).sort((a,b)=>((b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)));
          });
        }, (err) => { console.error('orders listen error (userID)', err); });

        return () => { unsub1(); unsub2(); };
      } catch (e) {
        console.error('orders subscribe error', e);
      }
    });
    return () => off();
  }, []);

  const [activeFilter, setActiveFilter] = useState<string>('Tất Cả');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;
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
              onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Danh Sách Đơn Hàng */}
        <div className="orders-list">
          {(() => {
            const matchesFilter = (orderStatus: string, filter: string) => {
              if (!filter || filter === 'Tất Cả') return true;
              const s = (orderStatus || '').toLowerCase();
              const f = filter.toLowerCase();
              if (f.includes('giao')) return s.includes('giao') || s.includes('vận');
              if (f.includes('hoàn')) return s.includes('hoàn') || s.includes('đã giao') || s.includes('completed');
              if (f.includes('hủy') || f.includes('huỷ')) return s.includes('hủy') || s.includes('đã hủy');
              return s === f;
            };

            const filtered = orders.filter(o => {
              if (activeFilter && activeFilter !== 'Tất Cả' && !matchesFilter(o.status || '', activeFilter)) return false;
              return true;
            });
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const startIndex = (currentPage - 1) * pageSize;
            return filtered.slice(startIndex, startIndex + pageSize).map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <p className="label">Mã Đơn Hàng</p>
                    <p className="value">{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="label">Ngày Đặt</p>
                    <p className="value">{order.createdAt ? (order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : new Date(order.createdAt).toLocaleString()) : ''}</p>
                  </div>
                </div>

                <div className="order-details">
                  <div>
                    <p className="order-items">
                      Sản phẩm: {Array.isArray(order.items) ? order.items.map((item:any) => `${item.name || item.title || item.productName} (x${item.quantity || item.qty || 1})`).join(', ') : ''}
                    </p>
                    <p className="order-total">Tổng Tiền: {formatCurrency(order.total || order.amount || 0)}</p>
                  </div>

                  <div className="order-actions">
                    <span className={`order-status ${getStatusColor(order.status)}`}>{order.status}</span>
                    <button className="order-btn" onClick={() => navigate(`/order-tracking?orderId=${encodeURIComponent(order.id)}`)}>Xem Chi Tiết</button>
                    {
                      (() => {
                        const s = (order.status || '').toString().toLowerCase();
                        const isDelivering = s.includes('giao') || s.includes('vận');
                        const isDelivered = s.includes('đã giao') || s.includes('hoàn');
                        const isCanceled = s.includes('hủy') || s.includes('huy');
                        const canCancel = !isDelivering && !isDelivered && !isCanceled;
                        return (
                          <>
                            <button
                              className={`order-btn cancel-btn ${canCancel ? '' : 'disabled'}`}
                              onClick={async () => {
                                if (!canCancel) {
                                  showError('Đơn hàng đang/đã giao hoặc đã huỷ — không thể huỷ. Vui lòng liên hệ hỗ trợ.');
                                  return;
                                }
                                const ok = window.confirm('Bạn có chắc muốn huỷ đơn này?');
                                if (!ok) return;
                                try {
                                  await updateDoc(doc(db, 'orders', order.id), { status: 'Đã Hủy', updatedAt: new Date() } as any);
                                  await addDoc(collection(db, 'orders', order.id, 'trackingEvents'), { ts: new Date(), status: 'Đã Hủy', note: 'Khách hàng huỷ đơn' });
                                  showSuccess('Đã huỷ đơn');
                                } catch (e: any) {
                                  console.error('cancel order error', e);
                                  if (e && e.code && (e.code.includes('permission') || e.message?.toLowerCase().includes('permission') || e.message?.toLowerCase().includes('missing'))) {
                                    showError('Không có quyền huỷ đơn: kiểm tra quyền Firestore hoặc liên hệ quản trị.');
                                  } else {
                                    showError('Huỷ đơn thất bại');
                                  }
                                }
                              }}
                            >Huỷ đơn</button>

                            {/* After delivered show Review / Return buttons */}
                            {isDelivered && (
                              <>
                                <button className="order-btn" onClick={() => navigate(`/review?orderId=${encodeURIComponent(order.id)}`)}>Đánh Giá</button>
                                <button className="order-btn" onClick={() => navigate(`/return?orderId=${encodeURIComponent(order.id)}`)}>Yêu Cầu Hoàn Hàng</button>
                              </>
                            )}
                          </>
                        );
                      })()
                    }
                  </div>

                  {/* Timeline moved to order detail / tracking view. */}
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Phân Trang */}
        <div className="pagination">
          {(() => {
            const matchesFilter = (orderStatus: string, filter: string) => {
              if (!filter || filter === 'Tất Cả') return true;
              const s = (orderStatus || '').toLowerCase();
              const f = filter.toLowerCase();
              if (f.includes('giao')) return s.includes('giao') || s.includes('vận');
              if (f.includes('hoàn')) return s.includes('hoàn') || s.includes('đã giao') || s.includes('completed');
              if (f.includes('hủy') || f.includes('huỷ')) return s.includes('hủy') || s.includes('đã hủy');
              return s === f;
            };

            const filtered = orders.filter(o => {
              if (activeFilter && activeFilter !== 'Tất Cả' && !matchesFilter(o.status || '', activeFilter)) return false;
              return true;
            });
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            return (
              <>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>← Trước</button>
                <span className="page-current">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Sau →</button>
              </>
            );
          })()}
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
