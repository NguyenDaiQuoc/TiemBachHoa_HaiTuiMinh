import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/orders.css";
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Format tiền tệ
const formatCurrency = (amount: any) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// --- Component Tóm Tắt Đơn Hàng (derived from orders) ---
function OrderMetrics({ orders }: { orders: any[] }) {
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const toDate = (o: any) => {
    if (!o) return null;
    const v = o.createdAt;
    if (!v) return null;
    try {
      if (v.seconds) return new Date(v.seconds * 1000);
      return new Date(v);
    } catch {
      return null;
    }
  };

  const totalOrdersToday = orders.filter(o => {
    const d = toDate(o);
    return d && d >= todayStart && d <= todayEnd;
  }).length;

  const pendingOrders = orders.filter(o => (o.status || '').toString() === 'Chờ Xử Lý').length;

  const inTransit = orders.filter(o => (o.status || '').toString() === 'Đang Vận Chuyển').length;

  return (
    <div className="metrics-grid">
      <div className="metric-card primary">
        <p className="metric-title">Đơn Hàng Hôm Nay</p>
        <h3 className="metric-value">{totalOrdersToday}</h3>
      </div>
      <div className="metric-card urgent">
        <p className="metric-title">Đơn Chờ Xử Lý Gấp</p>
        <h3 className="metric-value">{pendingOrders}</h3>
      </div>
      <div className="metric-card processing">
        <p className="metric-title">Đơn Đang Vận Chuyển</p>
        <h3 className="metric-value">{inTransit}</h3>
      </div>
    </div>
  );
}

export default function AdminOrderPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');

  useEffect(() => {
    setLoading(true);
    let unsub: (() => void) | null = null;

    const startListener = () => {
      // listen to orders collection in real-time, newest first
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(q, (snap) => {
        const docs: any[] = [];
        snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
        setOrders(docs);
        setLoading(false);
      }, (err) => {
        console.error('orders listener', err);
        setLoading(false);
      });
    };

    // Wait for auth state before starting listener to avoid permission errors
    const off = onAuthStateChanged(auth, (user) => {
      if (user) {
        startListener();
      } else {
        // not signed in - clear orders and stop loading
        setOrders([]);
        setLoading(false);
        if (unsub) { unsub(); unsub = null; }
      }
    });

    return () => {
      if (unsub) unsub();
      off();
    };
  }, []);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  const openOrder = (o:any) => setSelectedOrder(o);

  const statusClass = {
    'Chờ Xử Lý': 'status-pending',
    'Đã Thanh Toán': 'status-paid',
    'Đã Giao Hàng': 'status-delivered',
    'Đã Hủy': 'status-cancelled',
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <main className="content">
        <header className="content-header">
          <h1 className="content-title">Quản Lý Đơn Hàng</h1>
        </header>

  <OrderMetrics orders={orders} />

        <div className="toolbar">
          <input value={search} onChange={e=>setSearch(e.target.value)} type="text" placeholder="Tìm theo Mã Đơn Hàng, Tên Khách Hàng..." />
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="Tất cả">Lọc theo Trạng Thái</option>
            <option value="Chờ Xử Lý">Chờ Xử Lý</option>
            <option value="Đã Thanh Toán">Đã Thanh Toán</option>
            <option value="Đang Vận Chuyển">Đang Vận Chuyển</option>
            <option value="Đã Hủy">Đã Hủy</option>
          </select>
        </div>

        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Mã ĐH</th>
                <th>Khách Hàng</th>
                <th>Ngày Đặt</th>
                <th>Tổng Tiền</th>
                <th>TT Thanh Toán</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{textAlign:'center'}}>Đang tải đơn hàng...</td></tr>
              ) : (
                (() => {
                  const filtered = orders.filter(o => {
                    if (statusFilter && statusFilter !== 'Tất cả' && (o.status || '') !== statusFilter) return false;
                    if (!search) return true;
                    const q = search.trim().toLowerCase();
                    return String(o.id || '').toLowerCase().includes(q) || String(o.customerName || o.customer || '').toLowerCase().includes(q) || String(o.phone || '').includes(q);
                  });
                  const start = (currentPage - 1) * pageSize;
                  const pageItems = filtered.slice(start, start + pageSize);
                  return pageItems.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customerName || order.customer || order.userName || ''}</td>
                      <td>{order.createdAt ? new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleString() : ''}</td>
                      <td className="total">{formatCurrency(order.total || order.amount || 0)}</td>
                      <td>{order.paymentMethod || order.payment || '---'}</td>
                      <td><span className={`status ${(statusClass as any)[order.status || '']}`}>{order.status || 'Chờ Xử Lý'}</span></td>
                      <td className="actions">
                        <button className="edit-btn" onClick={()=>openOrder(order)}>Xem</button>
                      </td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          {(() => {
            const filtered = orders.filter(o => {
              if (statusFilter && statusFilter !== 'Tất cả' && (o.status || '') !== statusFilter) return false;
              if (!search) return true;
              const q = search.trim().toLowerCase();
              return String(o.id || '').toLowerCase().includes(q) || String(o.customerName || o.customer || '').toLowerCase().includes(q) || String(o.phone || '').includes(q);
            });
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const start = (currentPage - 1) * pageSize + 1;
            const end = Math.min(currentPage * pageSize, total);
            return (
              <>
                <span>Hiển thị {start} - {end} trong tổng số {total} đơn hàng</span>
                <div className="pages">
                  <button onClick={()=>setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage===1}>Trước</button>
                  {Array.from({length: totalPages}, (_,i)=>i+1).map(p=> (
                    <button key={p} onClick={()=>setCurrentPage(p)} className={p===currentPage?'current':''}>{p}</button>
                  ))}
                  <button onClick={()=>setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage===totalPages}>Sau</button>
                </div>
              </>
            )
          })()}
        </div>
        </main>
        {selectedOrder ? (
          <div className="modal-overlay" onClick={()=>setSelectedOrder(null)}>
            <div className="modal-card" onClick={e=>e.stopPropagation()}>
              <h3>Đơn {selectedOrder.id}</h3>
              <div><strong>Khách:</strong> {selectedOrder.customerName || selectedOrder.customer}</div>
              <div><strong>Tổng:</strong> {formatCurrency(selectedOrder.total || selectedOrder.amount || 0)}</div>
              <div className="order-details" style={{marginTop:12}}>
                <div><strong>Số điện thoại:</strong> {selectedOrder.phone || selectedOrder.mobile || '---'}</div>
                <div><strong>Địa chỉ giao hàng:</strong> {selectedOrder.address || selectedOrder.shippingAddress || selectedOrder.deliveryAddress || '---'}</div>
                <div><strong>Phương thức thanh toán:</strong> {selectedOrder.paymentMethod || selectedOrder.payment || '---'}</div>
                <div><strong>Trạng thái:</strong> <span className={`status ${(statusClass as any)[selectedOrder.status || '']}`}>{selectedOrder.status || 'Chờ Xử Lý'}</span></div>
                <div style={{marginTop:8}}>
                  <strong>Chi tiết sản phẩm:</strong>
                  <div style={{marginTop:6}}>
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                      <ul>
                        {selectedOrder.items.map((it:any, idx:number) => (
                          <li key={idx}>{it.name || it.title || it.productName} — SL: {it.quantity || it.qty || 1} — {formatCurrency(it.price || it.unitPrice || it.priceApplied || 0)}</li>
                        ))}
                      </ul>
                    ) : (<div>Không có thông tin sản phẩm chi tiết</div>)}
                  </div>
                </div>
              </div>
              <div style={{marginTop:12}}><button onClick={()=>setSelectedOrder(null)}>Đóng</button></div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

