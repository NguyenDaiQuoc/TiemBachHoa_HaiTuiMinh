import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/users.css";
import { adminDb as db } from "../../firebase-admin";
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

  const prepareExportData = (rows: any[]) => {
    return rows.map(u => {
      const spend = monthlySpendMap[u.id] || 0;
      const { rank } = getRankFor(spend);
      return {
        'UID': u.id,
        'Tên khách': u.fullName || u.name || u.account || '',
        'Email': u.email || '',
        'Điện thoại': u.phone || '',
        'Chi tiêu tháng': spend,
        'Hạng': rank.name,
        'Chiết khấu (%)': rank.discount,
      };
    });
  };

  const handleExportExcel = (rows: any[]) => {
    const data = prepareExportData(rows);
    import('../../utils/exportUtils').then(m => m.exportToExcel(data, `khach-hang-${new Date().toISOString().slice(0,10)}`)).catch(err => console.error('Export failed', err));
  };

  const handleExportPDF = (rows: any[]) => {
    const data = prepareExportData(rows);
    const columns = ['UID', 'Tên khách', 'Email', 'Điện thoại', 'Chi tiêu tháng', 'Hạng', 'Chiết khấu (%)'];
    import('../../utils/exportUtils').then(m => m.exportToPDF(data, `khach-hang-${new Date().toISOString().slice(0,10)}`, columns, 'Danh Sách Khách Hàng')).catch(err => console.error('Export failed', err));
  };

  const handleExportCSV = (rows: any[]) => {
    const data = prepareExportData(rows);
    const columns = ['UID', 'Tên khách', 'Email', 'Điện thoại', 'Chi tiêu tháng', 'Hạng', 'Chiết khấu (%)'];
    import('../../utils/exportUtils').then(m => m.exportToCSV(data, `khach-hang-${new Date().toISOString().slice(0,10)}`, columns)).catch(err => console.error('Export failed', err));
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
            <button className="btn-export" onClick={()=>handleExportExcel(filtered)}>Xuất Excel 📊</button>
            <button className="btn-export" onClick={()=>handleExportPDF(filtered)}>Xuất PDF 📄</button>
            <button className="btn-export" onClick={()=>handleExportCSV(filtered)}>Xuất CSV 📋</button>
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
            <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxHeight:'80vh',overflowY:'auto',maxWidth:'600px'}}>
              <h3>Chi Tiết Khách Hàng: {selectedUser.fullName || selectedUser.account || selectedUser.id}</h3>
              
              {/* Thông tin cơ bản */}
              <div style={{marginTop:12,paddingBottom:12,borderBottom:'1px solid #eee'}}>
                <h4 style={{marginTop:0}}>Thông Tin Cơ Bản</h4>
                <div><strong>UID:</strong> {selectedUser.id}</div>
                <div><strong>Tên đầy đủ:</strong> {selectedUser.fullName || selectedUser.name || '-'}</div>
                <div><strong>Email:</strong> {selectedUser.email || '-'}</div>
                <div><strong>Điện thoại:</strong> {selectedUser.phone || selectedUser.mobile || '-'}</div>
                <div><strong>Địa chỉ:</strong> {selectedUser.address || selectedUser.shippingAddress || '-'}</div>
                <div><strong>Thành phố:</strong> {selectedUser.city || selectedUser.province || '-'}</div>
                <div><strong>Mã bưu chính:</strong> {selectedUser.postalCode || selectedUser.zipCode || '-'}</div>
              </div>

              {/* Thông tin tài khoản */}
              <div style={{marginTop:12,paddingBottom:12,borderBottom:'1px solid #eee'}}>
                <h4>Thông Tin Tài Khoản</h4>
                <div><strong>Trạng thái:</strong> {selectedUser.isDeactivated === 'blocked' ? <span style={{color:'red'}}>Đã chặn</span> : <span style={{color:'green'}}>Hoạt động</span>}</div>
                <div><strong>Ngày tham gia:</strong> {selectedUser.createdAt && selectedUser.createdAt.toDate ? selectedUser.createdAt.toDate().toLocaleDateString('vi-VN') : (selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN') : '-')}</div>
                <div><strong>Cập nhật lần cuối:</strong> {selectedUser.updatedAt && selectedUser.updatedAt.toDate ? selectedUser.updatedAt.toDate().toLocaleDateString('vi-VN') : '-'}</div>
              </div>

              {/* Thông tin giao dịch */}
              <div style={{marginTop:12,paddingBottom:12,borderBottom:'1px solid #eee'}}>
                <h4>Thông Tin Giao Dịch</h4>
                <div><strong>Chi tiêu tháng này:</strong> {formatVND(monthlySpendMap[selectedUser.id] || 0)}</div>
                <div><strong>Tổng chi tiêu:</strong> {selectedUser.totalSpent ? formatVND(selectedUser.totalSpent) : '-'}</div>
                <div><strong>Số đơn hàng:</strong> {selectedUser.ordersCount || selectedUser.orders || 0}</div>
                {(() => {
                  const spend = monthlySpendMap[selectedUser.id] || 0;
                  const { rank, next } = getRankFor(spend);
                  const need = next ? Math.max(0, next.threshold - spend) : 0;
                  return (
                    <>
                      <div><strong>Hạng hiện tại:</strong> {rank.name} ({rank.discount}% chiết khấu)</div>
                      {next && <div><strong>Cần thêm:</strong> {formatVND(need)} để lên {next.name}</div>}
                    </>
                  );
                })()}
              </div>

              {/* Đơn hàng gần đây */}
              <div style={{marginTop:12}}>
                <h4>Đơn Hàng Gần Đây</h4>
                {selectedUserOrders.length === 0 ? (
                  <div style={{color:'#666'}}>Không có đơn hàng nào</div>
                ) : (
                  <ul style={{listStyle:'none',padding:0,margin:0}}>
                    {selectedUserOrders.map(o=> (
                      <li key={o.id} style={{padding:8,borderBottom:'1px solid #f0f0f0'}}>
                        <div style={{fontWeight:600}}>{o.id}</div>
                        <div style={{fontSize:13,color:'#666'}}>{formatVND(Number(o.total||o.amount||o.subtotal||0))} · {o.status || 'Chờ xử lý'}</div>
                        <div style={{fontSize:12,color:'#999'}}>{o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString('vi-VN') : '-'}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ marginTop: 16 }}><button onClick={()=>setSelectedUser(null)} style={{padding:'8px 16px',borderRadius:6,background:'#c75f4b',color:'#fff',border:'none',cursor:'pointer'}}>Đóng</button></div>
            </div>
          </div>
        )}
    </div>
  );
}
