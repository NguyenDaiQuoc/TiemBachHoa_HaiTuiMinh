import React from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/vouchers.css";

// Format tiền tệ
const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// Component Metric Voucher
function VoucherMetrics() {
  const totalVouchers = 25;
  const activeVouchers = 15;
  const totalUsage = 850;

  return (
    <div className="metrics-grid">
      <div className="metric-card metric-total">
        <p className="metric-title">Tổng Số Mã Giảm Giá</p>
        <h3 className="metric-value">{totalVouchers}</h3>
      </div>
      <div className="metric-card metric-active">
        <p className="metric-title">Mã Đang Hoạt Động</p>
        <h3 className="metric-value">{activeVouchers}</h3>
      </div>
      <div className="metric-card metric-usage">
        <p className="metric-title">Tổng Lượt Sử Dụng</p>
        <h3 className="metric-value">{totalUsage.toLocaleString('vi-VN')}</h3>
      </div>
    </div>
  );
}

// Component chính: Admin Voucher Page
export default function AdminVoucherPage() {

  const vouchers = [
    { id: 'SALE30', description: 'Giảm 30% cho đơn hàng tối thiểu 500K', type: 'Phần trăm', value: '30%', used: 120, limit: 500, validity: 'Đến 30/11/2025', status: 'Đang Hoạt Động' },
    { id: 'FREESHIP11', description: 'Miễn Phí Vận Chuyển Toàn Quốc', type: 'Vận Chuyển', value: '0 VNĐ', used: 85, limit: 'Không giới hạn', validity: 'Đến 31/12/2025', status: 'Đang Hoạt Động' },
    { id: 'NEWUSER50K', description: 'Giảm 50.000 cho Khách hàng mới', type: 'Số tiền', value: '50,000 VNĐ', used: 50, limit: 50, validity: 'Đến 01/01/2026', status: 'Đã Hết Hạn' },
  ];

  const statusColors = {
    'Đang Hoạt Động': 'status-active',
    'Đã Hết Hạn': 'status-expired',
    'Tạm Dừng': 'status-paused',
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <main className="content">
        <header className="content-header">
          <h1 className="content-title">Quản Lý Voucher & Mã Giảm Giá</h1>
          <button className="btn-create">
            <span>🎟️</span> Tạo Mã Giảm Giá Mới
          </button>
        </header>

        <VoucherMetrics />

        <div className="filter-bar">
          <input type="text" placeholder="Tìm kiếm theo Mã CODE, Mô tả..." className="filter-input" />
          <select className="filter-select">
            <option>Lọc theo Trạng Thái</option>
            <option>Đang Hoạt Động</option>
            <option>Đã Hết Hạn</option>
            <option>Tạm Dừng</option>
          </select>
          <select className="filter-select">
            <option>Lọc theo Loại</option>
            <option>Phần trăm</option>
            <option>Số tiền</option>
            <option>Vận Chuyển</option>
          </select>
          <button className="btn-apply">Áp Dụng Bộ Lọc</button>
        </div>

        <div className="table-container">
          <table className="voucher-table">
            <thead>
              <tr>
                <th>Mã VOUCHER</th>
                <th>Mô Tả</th>
                <th>Loại</th>
                <th>Giá Trị</th>
                <th>Đã Dùng</th>
                <th>Giới Hạn</th>
                <th>Hiệu Lực</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => (
                <tr key={v.id} className="voucher-row">
                  <td className="voucher-id">{v.id}</td>
                  <td>{v.description}</td>
                  <td>{v.type}</td>
                  <td>{v.value}</td>
                  <td>{v.used}</td>
                  <td>{v.limit}</td>
                  <td className="validity">{v.validity}</td>
                  <td><span className={`status ${statusColors[v.status]}`}>{v.status}</span></td>
                  <td className="action-buttons">
                    <button className="btn-edit">Sửa</button>
                    <button className="btn-stop">Ngừng</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-pagination">
            <span>Hiển thị 1 - 20 trong tổng số 25 mã</span>
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
    </div>
  );
}
