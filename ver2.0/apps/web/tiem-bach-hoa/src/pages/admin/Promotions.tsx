import React from "react";
import "../../../css/admin/promotions.css";

// Format tiền tệ
const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// Dữ liệu mẫu Chương trình Ưu đãi
const promotions = [
  { id: 'PRM20251101', name: 'Black Friday Sale (Giảm 30%)', type: 'Giảm giá chung', startDate: '25/11/2025', endDate: '30/11/2025', sales: 58000000, status: 'Sắp Diễn Ra' },
  { id: 'PRM20251005', name: 'Miễn Phí Vận Chuyển (Thứ 6)', type: 'Vận chuyển', startDate: '01/10/2025', endDate: '31/12/2025', sales: 0, status: 'Đang Hoạt Động' },
  { id: 'PRM20250901', name: 'Ưu Đãi Khách Hàng Thân Thiết (VIP)', type: 'Khách hàng', startDate: '01/09/2025', endDate: '30/09/2025', sales: 32000000, status: 'Đã Kết Thúc' },
];

// Component Metric Tóm Tắt Ưu Đãi
function PromotionMetrics() {
  const activePromotions = 2;
  const totalRevenueLastWeek = 120000000;

  return (
    <div className="metrics-grid">
      <div className="metric-card metric-active">
        <p className="metric-title">CT Ưu Đãi Đang Chạy</p>
        <h3 className="metric-value">{activePromotions}</h3>
      </div>
      <div className="metric-card metric-sales">
        <p className="metric-title">Doanh Số Từ Ưu Đãi (Tuần)</p>
        <h3 className="metric-value">{formatCurrency(totalRevenueLastWeek)}</h3>
      </div>
      <div className="metric-card metric-upcoming">
        <p className="metric-title">Chương Trình Sắp Diễn Ra</p>
        <h3 className="metric-value">1</h3>
      </div>
    </div>
  );
}

// Component chính: Admin Promotion Page
export default function AdminPromotionPage() {
  const statusColors = {
    'Đang Hoạt Động': 'status-active',
    'Sắp Diễn Ra': 'status-upcoming',
    'Đã Kết Thúc': 'status-ended',
  };

  return (
    <div className="page-wrapper">
      <main className="content">
        <header className="content-header">
          <h1 className="content-title">Quản Lý Chương Trình Ưu Đãi</h1>
          <button className="btn-add-promotion">✨ Tạo CT Ưu Đãi Mới</button>
        </header>

        <PromotionMetrics />

        <div className="filter-bar">
          <input type="text" placeholder="Tìm kiếm theo Tên chương trình, ID..." className="filter-input" />
          <select className="filter-select">
            <option>Lọc theo Trạng Thái</option>
            <option>Đang Hoạt Động</option>
            <option>Sắp Diễn Ra</option>
            <option>Đã Kết Thúc</option>
          </select>
          <button className="btn-apply">Áp Dụng Bộ Lọc</button>
        </div>

        <div className="table-container">
          <table className="promotion-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Chương Trình</th>
                <th>Loại</th>
                <th>Ngày Bắt Đầu</th>
                <th>Ngày Kết Thúc</th>
                <th>Doanh Số Ưu Đãi</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(prm => (
                <tr key={prm.id} className="promotion-row">
                  <td>{prm.id}</td>
                  <td className="promo-name">{prm.name}</td>
                  <td>{prm.type}</td>
                  <td>{prm.startDate}</td>
                  <td>{prm.endDate}</td>
                  <td className="promo-sales">{prm.sales > 0 ? formatCurrency(prm.sales) : 'N/A'}</td>
                  <td><span className={`status ${statusColors[prm.status]}`}>{prm.status}</span></td>
                  <td>
                    <button className="btn-edit">Xem/Sửa</button>
                    <button className="btn-stop">Ngừng</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-note">
            * Lưu ý: Mục "Doanh Số Ưu Đãi" chỉ tính doanh thu trực tiếp từ sản phẩm được giảm giá.
          </div>
        </div>
      </main>
    </div>
  );
}
