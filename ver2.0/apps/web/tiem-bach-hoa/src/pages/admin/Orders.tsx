import React from "react";
import "../../../css/admin/orders.css";

// Format tiền tệ
const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// --- Component Tóm Tắt Đơn Hàng ---
function OrderMetrics() {
  const totalOrdersToday = 52;
  const pendingOrders = 15;

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
        <h3 className="metric-value">67</h3>
      </div>
    </div>
  );
}

export default function AdminOrderPage() {
  const orders = [
    { id: 'DH202511001', customer: 'Nguyễn Văn A', date: '11/11/2025', total: 450000, payment: 'COD', status: 'Chờ Xử Lý' },
    { id: 'DH202511002', customer: 'Trần Thị B', date: '11/11/2025', total: 820000, payment: 'Chuyển Khoản', status: 'Đã Thanh Toán' },
    { id: 'DH202511003', customer: 'Lê Văn C', date: '10/11/2025', total: 150000, payment: 'Momo', status: 'Đã Giao Hàng' },
    { id: 'DH202511004', customer: 'Phạm Thị D', date: '09/11/2025', total: 500000, payment: 'COD', status: 'Đã Hủy' },
  ];

  const statusClass = {
    'Chờ Xử Lý': 'status-pending',
    'Đã Thanh Toán': 'status-paid',
    'Đã Giao Hàng': 'status-delivered',
    'Đã Hủy': 'status-cancelled',
  };

  return (
    <div className="page-wrapper">
      <main className="content">
        <header className="content-header">
          <h1 className="content-title">Quản Lý Đơn Hàng</h1>
        </header>

        <OrderMetrics />

        <div className="toolbar">
          <input type="text" placeholder="Tìm theo Mã Đơn Hàng, Tên Khách Hàng..." />
          <select>
            <option>Lọc theo Trạng Thái</option>
            <option>Chờ Xử Lý</option>
            <option>Đã Thanh Toán</option>
            <option>Đang Vận Chuyển</option>
            <option>Đã Hủy</option>
          </select>
          <button className="btn-apply">Áp Dụng</button>
          <button className="btn-add">Thêm Đơn Hàng</button>
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
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td className="total">{formatCurrency(order.total)}</td>
                  <td>{order.payment}</td>
                  <td><span className={`status ${statusClass[order.status]}`}>{order.status}</span></td>
                  <td className="actions">
                    <button className="edit-btn">Xem/Sửa</button>
                    <button className="delete-btn">Hủy</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Hiển thị 1 - 20 trong tổng số 1,250 đơn hàng</span>
          <div className="pages">
            <button>Trước</button>
            <button className="current">1</button>
            <button>2</button>
            <button>Sau</button>
          </div>
        </div>
      </main>
    </div>
  );
}

