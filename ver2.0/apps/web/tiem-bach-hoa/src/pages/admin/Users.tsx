import React from "react";
import "../../../css/admin/users.css";

// Format tiền tệ
const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// Component Metric Khách Hàng
function CustomerMetrics() {
  const totalCustomers = 5238;
  const newCustomersThisMonth = 120;

  return (
    <div className="metrics-grid">
      <div className="metric-card metric-total">
        <p className="metric-title">Tổng Số Khách Hàng</p>
        <h3 className="metric-value">{totalCustomers.toLocaleString('vi-VN')}</h3>
      </div>
      <div className="metric-card metric-new">
        <p className="metric-title">Khách Hàng Mới (Tháng)</p>
        <h3 className="metric-value">+{newCustomersThisMonth}</h3>
      </div>
      <div className="metric-card metric-vip">
        <p className="metric-title">Khách Hàng Vàng/Kim Cương</p>
        <h3 className="metric-value">158</h3>
      </div>
    </div>
  );
}

// Component chính: Admin Customer Page
export default function AdminCustomerPage() {

  const customers = [
    { id: 1001, name: 'Nguyễn Thị An', email: 'an.nguyen@email.com', joined: '01/01/2025', orders: 12, totalSpend: 5500000, status: 'Vàng' },
    { id: 1002, name: 'Trần Văn Bách', email: 'bach.t@email.com', joined: '15/03/2025', orders: 2, totalSpend: 320000, status: 'Thường' },
    { id: 1003, name: 'Lê Thanh Cẩm', email: 'cam.le@email.com', joined: '10/11/2025', orders: 1, totalSpend: 150000, status: 'Mới' },
    { id: 1004, name: 'Hoàng Đình Dũng', email: 'dung.hoang@email.com', joined: '20/02/2025', orders: 8, totalSpend: 2800000, status: 'Bạc' },
  ];

  const statusColors = {
    'Vàng': 'status-gold',
    'Bạc': 'status-silver',
    'Thường': 'status-regular',
    'Mới': 'status-new',
  };

  return (
    <div className="page-wrapper">
      <main className="content">
        <header className="content-header">
          <h1 className="content-title">Quản Lý Khách Hàng</h1>
        </header>

        <CustomerMetrics />

        <div className="filter-bar">
          <input type="text" placeholder="Tìm kiếm theo Tên, Email hoặc ID..." className="filter-input" />
          <select className="filter-select">
            <option>Lọc theo Hạng</option>
            <option>Vàng</option>
            <option>Bạc</option>
            <option>Thường</option>
          </select>
          <button className="btn-search">Tìm Kiếm</button>
          <button className="btn-export">Xuất Excel 📊</button>
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
                <th>Tổng Chi Tiêu</th>
                <th>Hạng</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(cust => (
                <tr key={cust.id} className="customer-row">
                  <td>{cust.id}</td>
                  <td>{cust.name}</td>
                  <td>{cust.email}</td>
                  <td>{cust.joined}</td>
                  <td>{cust.orders}</td>
                  <td className="total-spend">{formatCurrency(cust.totalSpend)}</td>
                  <td><span className={`status ${statusColors[cust.status]}`}>{cust.status}</span></td>
                  <td><button className="btn-detail">Xem Chi Tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-pagination">
            <span>Hiển thị 1 - 20 trong tổng số 5,238 khách hàng</span>
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
  );
}
