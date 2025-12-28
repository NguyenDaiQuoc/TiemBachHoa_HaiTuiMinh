import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/deals.css";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { adminDb as db } from '../../firebase';

const formatCurrency = (amount:any) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

function SaleDealsMetrics({deals}:{deals:any[]}) {
  const activeDeals = deals.filter(d => d.status === 'Đang Hoạt Động').length;
  const upcomingDeals = deals.filter(d => d.status === 'Sắp Diễn Ra').length;
  const salesThisMonth = deals.reduce((s, d) => s + (d.sales || 0), 0);

  return (
    <div className="metrics-grid">
      <div className="metric-card border-green">
        <p className="metric-label">Deals Đang Hoạt Động</p>
        <h3 className="metric-value green">{activeDeals}</h3>
      </div>
      <div className="metric-card border-blue">
        <p className="metric-label">Doanh Số Từ Deals (Tổng)</p>
        <h3 className="metric-value blue">{formatCurrency(salesThisMonth)}</h3>
      </div>
      <div className="metric-card border-yellow">
        <p className="metric-label">Deals Sắp Diễn Ra</p>
        <h3 className="metric-value yellow">{upcomingDeals}</h3>
      </div>
    </div>
  );
}

export default function AdminSaleDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('Tất cả');
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [newDeal, setNewDeal] = useState<any>({ name:'', startAt:'', endAt:'', target:'', discountType:'percent', discount:0, status:'Sắp Diễn Ra' });

  useEffect(()=>{
    setLoading(true);
    const q = query(collection(db, 'deals'), orderBy('startAt','desc'));
    const unsub = onSnapshot(q, snap => {
      const arr:any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setDeals(arr);
      setLoading(false);
    }, err=>{ console.error('deals listener', err); setLoading(false); });
    return ()=>unsub();
  }, []);

  const createDeal = async () => {
    try {
      await addDoc(collection(db, 'deals'), { ...newDeal, createdAt: new Date() });
      setShowCreate(false);
      setNewDeal({ name:'', startAt:'', endAt:'', target:'', discountType:'percent', discount:0, status:'Sắp Diễn Ra' });
    } catch (err) { console.error('createDeal', err); }
  };

  const stopDeal = async (d:any) => {
    if (!d?.id) return;
    try { await updateDoc(doc(db,'deals',d.id), { status: 'Đã Kết Thúc' }); } catch(e){console.error(e)}
  };

  const statusColors:any = {
    'Đang Hoạt Động': 'status-active',
    'Sắp Diễn Ra': 'status-upcoming',
    'Đã Kết Thúc': 'status-ended',
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Quản Lý Sự Kiện Bán Hàng & Deals</h1>
          <button className="btn-add" onClick={()=>setShowCreate(true)}><span className="btn-icon">🔥</span> Lên Kế Hoạch Deal Mới</button>
        </header>

        <SaleDealsMetrics deals={deals} />

        <div className="filter-bar">
          <input type="text" placeholder="Tìm kiếm theo Tên Deals, ID..." className="filter-input" />
          <select className="filter-select" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="Tất cả">Tất cả</option>
            <option value="Đang Hoạt Động">Đang Hoạt Động</option>
            <option value="Sắp Diễn Ra">Sắp Diễn Ra</option>
            <option value="Đã Kết Thúc">Đã Kết Thúc</option>
          </select>
          <button className="btn-apply">Áp Dụng Bộ Lọc</button>
        </div>

        <div className="table-card">
          <table className="deals-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Deals/Sale</th>
                <th>Thời Gian Bắt Đầu</th>
                <th>Thời Gian Kết Thúc</th>
                <th>Áp Dụng Cho</th>
                <th>Doanh Số</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{textAlign:'center'}}>Đang tải deals...</td></tr>
              ) : (
                deals.filter(d => filter === 'Tất cả' ? true : d.status === filter).map(deal => (
                  <tr key={deal.id}>
                    <td>{deal.id}</td>
                    <td className="deal-name">{deal.name}</td>
                    <td>{deal.startAt || ''}</td>
                    <td>{deal.endAt || ''}</td>
                    <td className="deal-target">{deal.target || ''}</td>
                    <td className="deal-sales">{deal.sales ? formatCurrency(deal.sales) : 'N/A'}</td>
                    <td><span className={`status-badge ${(statusColors as any)[deal.status]}`}>{deal.status}</span></td>
                    <td>
                      <button className="action-edit">Sửa/Chi tiết</button>
                      <button className="action-stop" onClick={()=>stopDeal(deal)}>Ngừng</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="table-note">
            * Lưu ý: Deals bán hàng phải được lập lịch chính xác để tự động kích hoạt và kết thúc.
          </div>
        </div>

        {showCreate ? (
          <div className="modal-overlay" onClick={()=>setShowCreate(false)}>
            <div className="modal-card" onClick={e=>e.stopPropagation()}>
              <h3>Tạo Deal Mới</h3>
              <div style={{display:'grid',gap:8}}>
                <input placeholder="Tên deal" value={newDeal.name} onChange={e=>setNewDeal({...newDeal, name:e.target.value})} />
                <input placeholder="Bắt đầu (ISO hoặc văn bản)" value={newDeal.startAt} onChange={e=>setNewDeal({...newDeal, startAt:e.target.value})} />
                <input placeholder="Kết thúc" value={newDeal.endAt} onChange={e=>setNewDeal({...newDeal, endAt:e.target.value})} />
                <input placeholder="Áp dụng cho (ví dụ: Tất cả sản phẩm)" value={newDeal.target} onChange={e=>setNewDeal({...newDeal, target:e.target.value})} />
                <div style={{display:'flex',gap:8}}>
                  <select value={newDeal.discountType} onChange={e=>setNewDeal({...newDeal, discountType:e.target.value})}>
                    <option value="percent">% giảm</option>
                    <option value="fixed">Giảm tiền</option>
                  </select>
                  <input type="number" value={newDeal.discount} onChange={e=>setNewDeal({...newDeal, discount:Number(e.target.value)})} />
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={createDeal}>Tạo</button>
                  <button onClick={()=>setShowCreate(false)}>Hủy</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
    </div>
  );
}