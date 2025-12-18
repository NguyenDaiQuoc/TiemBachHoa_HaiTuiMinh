import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/users.css";
import { db } from "../../firebase";
import { collection, onSnapshot, query, orderBy, doc, where, Timestamp, getDocs, limit, orderBy as fbOrderBy, updateDoc } from 'firebase/firestore';

// (Formatting helpers are inside the component)

function CustomerMetrics({ users }: { users: any[] }) {
  const totalCustomers = users.length;
  const now = Date.now();
  const newCustomersThisMonth = users.filter(u => {
    const ts = u.createdAt;
    try {
      const t = ts && ts.toMillis ? ts.toMillis() : (ts ? new Date(ts).getTime() : 0);
      return now - t < 1000 * 60 * 60 * 24 * 30; // 30 days
    } catch {
      return false;
    }
  }).length;

  const vipCount = users.filter(u => {
    const vip = (u.vip || u.status || '').toString().toLowerCase();
    return vip.includes('vàng') || vip.includes('kim');
  }).length;

  return (
    <div className="metrics-grid">
      <div className="metric-card metric-total">
        <p className="metric-title">Tổng Số Khách Hàng</p>
        <h3 className="metric-value">{totalCustomers.toLocaleString('vi-VN')}</h3>
      </div>
      <div className="metric-card metric-new">
        <p className="metric-title">Khách Hàng Mới (30 ngày)</p>
        <h3 className="metric-value">+{newCustomersThisMonth}</h3>
      </div>
      <div className="metric-card metric-vip">
        <p className="metric-title">Khách Hàng Vàng/Kim Cương</p>
        <h3 className="metric-value">{vipCount}</h3>
      </div>
    </div>
  );
}

// Component chính: Admin Customer Page (dynamic)
export default function AdminCustomerPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [monthlySpendMap, setMonthlySpendMap] = useState<Record<string, number>>({});
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<any[]>([]);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    // try ordering by createdAt if available
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(arr as any[]);
    }, (err) => {
      console.error('Users listener error', err);
      // fallback: try listening without orderBy
      const unsub2 = onSnapshot(usersRef, (s2) => {
        setUsers(s2.docs.map(d=>({ id: d.id, ...d.data() })));
      });
      return () => unsub2();
    });
    return () => unsub();
  }, []);

  // --- listen to orders for the current month and aggregate spend per user ---
  useEffect(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const ts = Timestamp.fromDate(startOfMonth);
    try {
      const ordersRef = collection(db, 'orders');
      const oq = query(ordersRef, where('createdAt', '>=', ts));
      const unsub = onSnapshot(oq, (snap) => {
        const map: Record<string, number> = {};
        snap.docs.forEach(d => {
          const o: any = d.data();
          const uid = o.userID || o.userId || o.user || o.customerID || o.customerId || '';
          if (!uid) return;
          const amt = Number(o.total || o.amount || o.subtotal || 0) || 0;
          map[uid] = (map[uid] || 0) + amt;
        });
        setMonthlySpendMap(map);
      }, (err) => {
        console.error('orders monthly listener', err);
      });
      return () => unsub();
    } catch (e) {
      console.error('orders monthly listener init failed', e);
    }
  }, []);

  const RANKS = [
    { name: 'Thường', threshold: 0, discount: 0 },
    { name: 'Đồng', threshold: 500000, discount: 1 },
    { name: 'Bạc', threshold: 1000000, discount: 2.5 },
    { name: 'Vàng', threshold: 2000000, discount: 3.5 },
    { name: 'Bạch kim', threshold: 3000000, discount: 5 },
    { name: 'Kim cương', threshold: 5000000, discount: 7.5 },
  ];

  const getRankFor = (spend: number) => {
    let rank = RANKS[0];
    for (let i = 0; i < RANKS.length; i++) {
      if (spend >= RANKS[i].threshold) rank = RANKS[i];
    }
    const idx = RANKS.findIndex(r=>r.name===rank.name);
    const next = RANKS[idx+1] || null;
    return { rank, next };
  };

  const formatVND = (n: number) => n.toLocaleString('vi-VN') + ' VNĐ';

  const exportCSV = (rows: any[]) => {
    const headers = ['UID','Account','FullName','Email','Phone','Chi tieu thang','Hang','Discount'];
    const csv = [headers.join(',')].concat(rows.map(u => {
      const spend = monthlySpendMap[u.id] || 0;
      const { rank } = getRankFor(spend);
      return [u.id, '"'+(u.account||'')+'"','"'+(u.fullName||'')+'"', (u.email||''), (u.phone||''), spend, rank.name, rank.discount+'%'].join(',');
    })).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetails = async (u:any) => {
    setSelectedUser(u);
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userID', '==', u.id), fbOrderBy('createdAt','desc'), limit(10));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d=>({ id: d.id, ...d.data() }));
      setSelectedUserOrders(docs);
    } catch (e) {
      console.error('load user orders', e);
      setSelectedUserOrders([]);
    }
  };

  const toggleBlock = async (u:any) => {
    try {
      const newState = (u.isDeactivated === 'blocked') ? 'none' : 'blocked';
      await updateDoc(doc(db,'users',u.id), { isDeactivated: newState, updatedAt: Timestamp.now() });
    } catch (e:any) {
      console.error('toggle block', e);
      alert('Thao tác thất bại: ' + (e?.message || e));
    }
  };

  const filtered = useMemo(() => {
    const qStr = search.trim().toLowerCase();
    if (!qStr) return users;
    return users.filter(u => (
      (u.fullName || u.name || '').toString().toLowerCase().includes(qStr) ||
      (u.email || '').toString().toLowerCase().includes(qStr) ||
      (u.account || '').toString().toLowerCase().includes(qStr) ||
      (u.id || '').toString().toLowerCase().includes(qStr)
    ));
  }, [search, users]);

  // block/unblock handled by toggleBlock (below)

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <main className="content">
          <header className="content-header">
            <h1 className="content-title">Quản Lý Khách Hàng</h1>
          </header>

          <CustomerMetrics users={users} />

          <div className="filter-bar">
            <input type="text" placeholder="Tìm kiếm theo Tên, Email hoặc ID..." className="filter-input" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <select className="filter-select">
              <option value="">Lọc theo Hạng</option>
              <option value="vàng">Vàng</option>
              <option value="bạc">Bạc</option>
              <option value="thường">Thường</option>
            </select>
            <button className="btn-search">Tìm Kiếm</button>
            <button className="btn-export" onClick={()=>exportCSV(filtered)}>Xuất Excel 📊</button>
          </div>

          <div className="table-container">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên Khách Hàng</th>
                  <th>Email</th>
                  <th>Ngày Tham Gia</th>
                  <th>Đơn Hàng</th>
                  <th>Chi tiêu tháng</th>
                  <th>Hạng / Tiến độ</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="customer-row">
                    <td>{u.id}</td>
                    <td>{u.fullName || u.name || u.account || '-'}</td>
                    <td>{u.email || '-'}</td>
                    <td>{u.createdAt && u.createdAt.toDate ? u.createdAt.toDate().toLocaleDateString() : (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-')}</td>
                    <td>{u.ordersCount ?? u.orders ?? '-'}</td>
                    <td>{formatVND(monthlySpendMap[u.id] || 0)}</td>
                    <td>
                      {(() => {
                        const spend = monthlySpendMap[u.id] || 0;
                        const { rank, next } = getRankFor(spend);
                        
                        const need = next ? Math.max(0, next.threshold - spend) : 0;
                        const pct = next ? Math.min(100, Math.round((spend / next.threshold) * 100)) : 100;
                        return (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className="badge-rank">{rank.name}</span>
                              <small style={{ color: '#666' }}>{rank.discount}%</small>
                            </div>
                            <div style={{ height: 8, background: '#eee', borderRadius: 6, marginTop: 6 }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#4a90e2', borderRadius: 6 }} />
                            </div>
                            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                              {next ? `Cần ${need.toLocaleString('vi-VN')} VNĐ nữa để lên ${next.name}` : 'Đã đạt hạng cao nhất'}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td>
                      <button className="btn-detail" onClick={() => openDetails(u)}>Xem Chi Tiết</button>
                      <button className="btn-danger" onClick={() => toggleBlock(u)}>{u.isDeactivated==='blocked' ? 'Bỏ chặn' : 'Chặn'}</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 16 }}>Không có khách hàng nào khớp.</td></tr>
                )}
              </tbody>
            </table>

            <div className="table-pagination">
              <span>Hiển thị 1 - {Math.min(filtered.length, 20)} trong tổng số {users.length} khách hàng</span>
              <div className="pagination-buttons">
                <button>Trước</button>
                <span className="current-page">1</span>
                <button>2</button>
                <button>Sau</button>
              </div>
            </div>
          </div>
        </main>
      </div>
        {selectedUser && (
          <div className="modal-overlay" onClick={()=>setSelectedUser(null)}>
            <div className="modal-card" onClick={e=>e.stopPropagation()}>
              <h3>Khách hàng: {selectedUser.fullName || selectedUser.account || selectedUser.id}</h3>
              <div><strong>Email:</strong> {selectedUser.email || '-'}</div>
              <div><strong>Phone:</strong> {selectedUser.phone || '-'}</div>
              <div style={{ marginTop: 8 }}><strong>Chi tiêu tháng:</strong> {formatVND(monthlySpendMap[selectedUser.id] || 0)}</div>
              <div style={{ marginTop: 8 }}>
                <strong>Đơn hàng gần đây:</strong>
                <ul>
                  {selectedUserOrders.length === 0 ? <li>Không có đơn</li> : selectedUserOrders.map(o=> (
                    <li key={o.id}>{o.id} — {formatVND(Number(o.total||o.amount||o.subtotal||0))} — {o.status || ''}</li>
                  ))}
                </ul>
              </div>
              <div style={{ marginTop: 12 }}><button onClick={()=>setSelectedUser(null)}>Đóng</button></div>
            </div>
          </div>
        )}
    </div>
  );
}
