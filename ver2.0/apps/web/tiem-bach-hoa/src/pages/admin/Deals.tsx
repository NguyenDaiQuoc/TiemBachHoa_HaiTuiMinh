import React from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/deals.css";

const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

const saleDeals = [
  { id: 'FS20251125', name: 'Flash Sale Giờ Vàng (20:00 - 22:00)', startDate: '25/11/2025 20:00', endDate: '25/11/2025 22:00', target: 'Tất cả sản phẩm', sales: 45000000, status: 'Đang Hoạt Động' },
  { id: 'B1G1_MUG', name: 'Mua 1 Tặng 1: Cốc Sứ Minimal', startDate: '15/11/2025', endDate: '20/11/2025', target: 'Nhóm sản phẩm Cốc', sales: 0, status: 'Sắp Diễn Ra' },
  { id: 'ENDSEASONSALE', name: 'End of Season Clearance Sale', startDate: '01/10/2025', endDate: '31/10/2025', target: 'Danh mục Cũ', sales: 125000000, status: 'Đã Kết Thúc' },
];

function SaleDealsMetrics() {
  const activeDeals = 1;
  const upcomingDeals = 3;
  const salesThisMonth = 250000000;

  return (
    <div className="metrics-grid">
      <div className="metric-card border-green">
        <p className="metric-label">Deals Đang Hoạt Động</p>
        <h3 className="metric-value green">{activeDeals}</h3>
      </div>
      <div className="metric-card border-blue">
        <p className="metric-label">Doanh Số Từ Deals (Tháng)</p>
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
  const statusColors = {
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
          <button className="btn-add"><span className="btn-icon">🔥</span> Lên Kế Hoạch Deal Mới</button>
        </header>

        <SaleDealsMetrics />

        <div className="filter-bar">
          <input type="text" placeholder="Tìm kiếm theo Tên Deals, ID..." className="filter-input" />
          <select className="filter-select">
            <option>Lọc theo Trạng Thái</option>
            <option>Đang Hoạt Động</option>
            <option>Sắp Diễn Ra</option>
            <option>Đã Kết Thúc</option>
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
              {saleDeals.map(deal => (
                <tr key={deal.id}>
                  <td>{deal.id}</td>
                  <td className="deal-name">{deal.name}</td>
                  <td>{deal.startDate}</td>
                  <td>{deal.endDate}</td>
                  <td className="deal-target">{deal.target}</td>
                  <td className="deal-sales">{deal.sales > 0 ? formatCurrency(deal.sales) : 'N/A'}</td>
                  <td><span className={`status-badge ${statusColors[deal.status]}`}>{deal.status}</span></td>
                  <td>
                    <button className="action-edit">Sửa/Chi tiết</button>
                    <button className="action-stop">Ngừng</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-note">
            * Lưu ý: Deals bán hàng phải được lập lịch chính xác để tự động kích hoạt và kết thúc.
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}