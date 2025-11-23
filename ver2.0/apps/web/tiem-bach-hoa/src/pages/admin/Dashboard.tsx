import React from "react";
import "../../../css/adminindex.css"; // CSS thuần mới

// --- Format tiền tệ ---
const formatCurrency = (amount: number) =>
  Number(amount).toLocaleString("vi-VN") + " VNĐ";

// --- Component Metric Card ---
interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  isMoney?: boolean;
}

function MetricCard({ title, value, change, isMoney = false }: MetricCardProps) {
  const isPositive = change >= 0;
  const arrow = isPositive ? "↑" : "↓";
  const changeClass = isPositive ? "metric-change-positive" : "metric-change-negative";

  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>
      <h3 className="metric-value">{isMoney ? formatCurrency(value) : value.toLocaleString("vi-VN")}</h3>
      <div className="metric-change-container">
        <span className={changeClass}>
          {arrow} {Math.abs(change).toLocaleString("vi-VN")}%
        </span>
        <span className="metric-change-subtext">so với tháng trước</span>
      </div>
    </div>
  );
}

// --- Component Chart Placeholder ---
interface ChartPlaceholderProps {
  title: string;
  type: string;
}

function ChartPlaceholder({ title, type }: ChartPlaceholderProps) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-placeholder">
        <span className="chart-placeholder-text">[Biểu đồ {type} mô phỏng dữ liệu tại đây]</span>
      </div>
    </div>
  );
}

// --- Component Sidebar ---
function AdminSidebar() {
  const menuItems = [
    { label: "Dashboard", icon: "🏠", active: true },
    { label: "Quản Lý Đơn Hàng", icon: "📦" },
    { label: "Sản Phẩm", icon: "🏷️" },
    { label: "Khách Hàng", icon: "👥" },
    { label: "Marketing", icon: "📢" },
    { label: "Báo Cáo", icon: "📊" },
    { label: "Cấu Hình", icon: "⚙️" },
  ];

  return (
    <div className="sidebar">
      <h1 className="sidebar-header">
        <span>ADMIN</span> Dashboard
      </h1>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.label}>
            <a href="#" className={`sidebar-menu-item ${item.active ? "active" : ""}`}>
              <span className="sidebar-menu-icon">{item.icon}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <button className="logout-button">
          <span>🚪</span> Đăng Xuất
        </button>
      </div>
    </div>
  );
}

// --- Component Admin Dashboard ---
export default function AdminDashboardPage() {
  const kpiData = [
    { title: "Tổng Doanh Thu (Tháng này)", value: 125400000, change: 15.2, isMoney: true },
    { title: "Số Lượng Đơn Hàng", value: 850, change: 8.5 },
    { title: "Khách Hàng Mới", value: 120, change: -2.1 },
    { title: "Tỉ Lệ Chuyển Đổi", value: 2.5, change: 0.5 },
  ];

  return (
    <div className="dashboard-container">
      <AdminSidebar />

      <div className="dashboard-content">
        <header className="dashboard-header">
          <h2 className="dashboard-title">Tổng Quan Hoạt Động</h2>
          <span className="dashboard-greeting">Xin chào, Admin Nguyễn (Phiên bản Flash 2.5)</span>
        </header>

        <div className="kpi-grid">
          {kpiData.map((data, index) => (
            <MetricCard key={index} {...data} />
          ))}
        </div>

        <div className="charts-grid">
          <div className="charts-main">
            <ChartPlaceholder title="Biểu Đồ Doanh Thu 6 Tháng Gần Nhất" type="Đường" />
          </div>

          <div className="top-products-card">
            <h3 className="top-products-title">Top 5 Sản Phẩm Bán Chạy (Tháng)</h3>
            <ol className="top-products-list">
              <li>Nến Thơm Organic Vỏ Cam Quế</li>
              <li>Hộp Trà Hoa Cúc Thư Giãn</li>
              <li>Set Muỗng Gỗ Sồi Tối Giản</li>
              <li>Túi Vải Canvas Tái Chế</li>
              <li>Xà Phòng Thủ Công Than Tre</li>
            </ol>
          </div>

          <div className="charts-side">
            <ChartPlaceholder title="Phân Tích Kênh Bán Hàng" type="Tròn" />
          </div>

          <div className="orders-card">
            <h3 className="orders-title">5 Đơn Hàng Cần Xử Lý Gấp</h3>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Khách Hàng</th>
                  <th>Tổng Tiền</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>NH20251115</td>
                  <td>Nguyễn Thị B</td>
                  <td>{formatCurrency(350000)}</td>
                  <td className="status-wait">Chờ TT</td>
                </tr>
                <tr>
                  <td>NH20251114</td>
                  <td>Trần Văn C</td>
                  <td>{formatCurrency(780000)}</td>
                  <td className="status-packing">Chờ Đóng Gói</td>
                </tr>
              </tbody>
            </table>
            <a href="#" className="view-all-orders">→ Xem Toàn Bộ Đơn Hàng</a>
          </div>
        </div>
      </div>
    </div>
  );
}
