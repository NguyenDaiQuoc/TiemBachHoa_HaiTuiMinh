import React from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/analytics.css";

// --- Format tiền tệ ---
const formatCurrency = (amount) =>
  Number(amount).toLocaleString("vi-VN") + " VNĐ";

// --- Card KPI ---
function ReportMetricCard({ title, value, change, isMoney = false }) {
  const isPositive = change >= 0;
  const arrow = isPositive ? "▲" : "▼";

  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>

      <h3 className="metric-value">
        {isMoney ? formatCurrency(value) : value.toLocaleString("vi-VN")}
      </h3>

      <div className="metric-change">
        <span className={`change-number ${isPositive ? "pos" : "neg"}`}>
          {arrow} {Math.abs(change).toFixed(1)}%
        </span>
        <span className="change-sub">so với kỳ trước</span>
      </div>
    </div>
  );
}

// --- Biểu đồ Placeholder ---
function ChartPlaceholder({ title, type }) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>

      <div className="chart-box">
        <span className="chart-placeholder">
          [Biểu đồ {type} mô phỏng dữ liệu tại đây]
        </span>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function AdminReportsPage() {
  const kpiData = [
    { title: "Tổng Doanh Thu", value: 350800000, change: 22.5, isMoney: true },
    { title: "Tỷ lệ Chuyển Đổi", value: 3.1, change: 0.8, isMoney: false },
    { title: "Giá trị Đơn Hàng TB", value: 412000, change: -5.2, isMoney: true },
    { title: "Tổng Số Đơn Hàng", value: 850, change: 18.2, isMoney: false },
  ];

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <div className="reports-container">
        <header className="reports-header">
          <h1 className="reports-title">Báo Cáo & Phân Tích Tổng Hợp</h1>
        </header>

        {/* Bộ Lọc */}
        <div className="filter-bar">
          <span className="filter-label">Chọn Kỳ Báo Cáo:</span>

          <select className="filter-select">
            <option>30 Ngày Gần Nhất</option>
            <option>Tháng 10/2025</option>
            <option>Quý 3/2025</option>
            <option>Tùy chọn Ngày</option>
          </select>

          <button className="btn-view">Xem Báo Cáo</button>
          <button className="btn-export">Xuất File CSV ⬇️</button>
        </div>

        {/* KPI */}
        <div className="kpi-grid">
          {kpiData.map((item, i) => (
            <ReportMetricCard key={i} {...item} />
          ))}
        </div>

        {/* Charts + Table */}
        <div className="charts-grid">
          <div className="chart-full">
            <ChartPlaceholder
              title="Xu Hướng Doanh Thu & Số Đơn Hàng Theo Ngày"
              type="Đường"
            />
          </div>

          <div className="chart-small">
            <ChartPlaceholder
              title="Cơ Cấu Doanh Thu theo Danh Mục"
              type="Tròn"
            />
          </div>

          <div className="chart-medium">
            <ChartPlaceholder
              title="Khách Hàng Mới vs Quay Lại"
              type="Cột"
            />
          </div>

          <div className="table-wrapper">
            <h3 className="table-title">
              Top 5 Sản Phẩm Bán Chạy Nhất (Theo Doanh Thu)
            </h3>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Sản Phẩm</th>
                  <th>Doanh Thu</th>
                  <th>Số Lượng</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="rank-1">#1</td>
                  <td>Nến Thơm Organic Vỏ Cam Quế</td>
                  <td>{formatCurrency(65000000)}</td>
                  <td>420</td>
                </tr>

                <tr>
                  <td className="rank-2">#2</td>
                  <td>Set Muỗng Gỗ Sồi Tối Giản</td>
                  <td>{formatCurrency(48000000)}</td>
                  <td>192</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
