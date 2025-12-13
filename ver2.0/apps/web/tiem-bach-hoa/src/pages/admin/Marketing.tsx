import React from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/marketing.css";

const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

const MarketingMetrics = () => {
  const totalCoupons = 18;
  const activeCampaigns = 3;
  const emailSubscribers = 1540;

  return (
    <div className="metrics-grid">
      <div className="metric-card border-primary">
        <p className="metric-label">Tổng Mã Giảm Giá</p>
        <h3 className="metric-value">{totalCoupons}</h3>
      </div>
      <div className="metric-card border-green">
        <p className="metric-label">Chiến Dịch Đang Chạy</p>
        <h3 className="metric-value text-green">{activeCampaigns}</h3>
      </div>
      <div className="metric-card border-blue">
        <p className="metric-label">Người Đăng Ký Email</p>
        <h3 className="metric-value text-blue">{emailSubscribers.toLocaleString('vi-VN')}</h3>
      </div>
    </div>
  );
};

const coupons = [
  { id: 'SALE15', name: 'Giảm 15% Toàn Bộ', type: 'Phần trăm', value: '15%', used: 120, limit: 500, status: 'Đang Hoạt Động' },
  { id: 'FREESHIP', name: 'Miễn Phí Vận Chuyển', type: 'Vận Chuyển', value: '0 VNĐ', used: 350, limit: 'Không giới hạn', status: 'Đang Hoạt Động' },
  { id: 'NEWUSER50K', name: 'Giảm 50.000 cho KH mới', type: 'Số tiền', value: '50,000 VNĐ', used: 25, limit: 50, status: 'Tạm Dừng' },
];

const statusColors = {
  'Đang Hoạt Động': 'status-active',
  'Tạm Dừng': 'status-paused',
  'Hết Hạn': 'status-expired',
};

export default function AdminMarketingPage() {
  const activeTab = "coupons";

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Quản Lý Marketing & Khuyến Mãi</h1>
        </header>

        <MarketingMetrics />

        <div className="tabs">
          <button className={`tab-item ${activeTab === 'coupons' ? 'active' : ''}`}>Mã Giảm Giá (Coupons)</button>
          <button className={`tab-item ${activeTab === 'emails' ? 'active' : ''}`}>Chiến Dịch Email</button>
          <button className={`tab-item ${activeTab === 'ads' ? 'active' : ''}`}>Công Cụ Quảng Cáo</button>
        </div>

        {activeTab === 'coupons' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Danh Sách Mã Giảm Giá</h2>
              <button className="btn-primary">
                <span className="icon">🏷️</span> Thêm Mã Mới
              </button>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Mã CODE</th>
                  <th>Tên Chiến Dịch</th>
                  <th>Loại</th>
                  <th>Giá Trị</th>
                  <th>Đã Dùng</th>
                  <th>Giới Hạn</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon.id}>
                    <td className="bold">{coupon.id}</td>
                    <td>{coupon.name}</td>
                    <td>{coupon.type}</td>
                    <td>{coupon.value}</td>
                    <td>{coupon.used}</td>
                    <td>{coupon.limit}</td>
                    <td><span className={`status ${statusColors[coupon.status]}`}>{coupon.status}</span></td>
                    <td className="actions">
                      <button className="action-edit">Sửa</button>
                      <button className="action-delete">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
