import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";
import "../../../css/admin/dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

// --- FORMAT TIỀN ---
const formatCurrency = (amount: number) =>
  Number(amount).toLocaleString("vi-VN") + " VNĐ";

// --- KPI COMPONENT ---
interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  isMoney?: boolean;
}

function MetricCard({ title, value, change, isMoney = false }: MetricCardProps) {
  const isPositive = change >= 0;
  const arrow = isPositive ? "↑" : "↓";
  const changeClass = isPositive
    ? "metric-change-positive"
    : "metric-change-negative";

  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>
      <h3 className="metric-value">
        {isMoney
          ? formatCurrency(value)
          : value.toLocaleString("vi-VN")}
      </h3>
      <div className="metric-change-container">
        <span className={changeClass}>
          {arrow} {Math.abs(change)}%
        </span>
        <span className="metric-change-subtext">so với tháng trước</span>
      </div>
    </div>
  );
}

// --- BIỂU ĐỒ ---
function ChartPlaceholder({ title, type }: { title: string; type: "line" | "pie" }) {
  if (type === "line") {
    const data = {
      labels: ["Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11"],
      datasets: [
        {
          label: "Doanh Thu",
          data: [5000000, 12000000, 9000000, 15000000, 12500000, 13000000],
          borderColor: "#4A6D56",
          backgroundColor: "rgba(74,109,86,0.2)",
          tension: 0.3,
        },
      ],
    };
    return (
      <div className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <Line data={data} />
      </div>
    );
  } else {
    const data = {
      labels: ["Online", "Cửa Hàng", "Đối tác"],
      datasets: [
        {
          label: "Kênh Bán Hàng",
          data: [45, 35, 20],
          backgroundColor: ["#4A6D56", "#C75F4B", "#F4A261"],
        },
      ],
    };
    return (
      <div className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <Pie data={data} />
      </div>
    );
  }
}

// --- SIDEBAR ---
function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminLoginInfo");
    auth.signOut();
    navigate("/admin");
  };

  const menuItems = [
    { label: "Dashboard", icon: "🏠", path: "/dashboard" },
    { label: "Quản Lý Đơn Hàng", icon: "📦", path: "/orders" },
    { label: "Sản Phẩm", icon: "🏷️", path: "/products" },
    { label: "Khách Hàng", icon: "👥", path: "/customers" },
    { label: "Marketing", icon: "📢", path: "/marketing" },
    { label: "Báo Cáo", icon: "📊", path: "/reports" },
    { label: "Cấu Hình", icon: "⚙️", path: "/settings" },
  ];

  return (
    <div className="sidebar">
      <h1 className="sidebar-header"><span>ADMIN</span> Dashboard</h1>
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.label}>
            <a href={item.path} className="sidebar-menu-item">
              <span className="sidebar-menu-icon">{item.icon}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          <span>🚪</span> Đăng Xuất
        </button>
      </div>
    </div>
  );
}

// --- DASHBOARD PAGE ---
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    // 1) Kiểm tra session Firebase (luôn luôn có)
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Không có session → Quay về đăng nhập
        navigate("/admin");
        return;
      }

      // 2) Kiểm tra xem user có chọn “ghi nhớ đăng nhập” hay không
      const saved = localStorage.getItem("adminLoginInfo");

      if (saved) {
        // --- TRƯỜNG HỢP GHI NHỚ ---
        const info = JSON.parse(saved);
        if (Date.now() > info.expiry) {
          localStorage.removeItem("adminLoginInfo");
          navigate("/admin");
          return;
        }
      }
      // Nếu không lưu → vẫn cho vào (chỉ giữ trong phiên)

      // 3) Lấy tên admin
      const snap = await getDoc(doc(db, "admins", user.uid));
      if (snap.exists()) setAdminName(snap.data().name || "Admin");
    });

    return () => unsubscribe();
  }, [navigate]);

  // --- KPI ---
  const kpiData = [
    { title: "Tổng Doanh Thu (Tháng này)", value: 125400000, change: 15.2, isMoney: true },
    { title: "Số Lượng Đơn Hàng", value: 850, change: 8.5 },
    { title: "Khách Hàng Mới", value: 120, change: -2.1 },
    { title: "Tỉ Lệ Chuyển Đổi", value: 2.5, change: 0.5 },
  ];

  // --- TOP PRODUCTS ---
  const topProducts = [
    { name: "Nến Thơm Organic Vỏ Cam Quế", image: "/images/candle.jpg", categoryCode: "C001", productCode: "P001" },
    { name: "Hộp Trà Hoa Cúc Thư Giãn", image: "/images/tea.jpg", categoryCode: "C002", productCode: "P002" },
    { name: "Set Muỗng Gỗ Sồi Tối Giản", image: "/images/spoon.jpg", categoryCode: "C003", productCode: "P003" },
    { name: "Túi Vải Canvas Tái Chế", image: "/images/bag.jpg", categoryCode: "C004", productCode: "P004" },
    { name: "Xà Phòng Thủ Công Than Tre", image: "/images/soap.jpg", categoryCode: "C005", productCode: "P005" },
  ];

  return (
    <div className="dashboard-container">
      <AdminSidebar />

      <div className="dashboard-content">
        <header className="dashboard-header">
          <h2 className="dashboard-title">Tổng Quan Hoạt Động</h2>
          <span className="dashboard-greeting">
            Xin chào, {adminName} (Phiên bản Flash 2.5)
          </span>
        </header>

        <div className="kpi-grid">
          {kpiData.map((d, i) => <MetricCard key={i} {...d} />)}
        </div>

        <div className="charts-grid">
          <div className="charts-main">
            <ChartPlaceholder title="Biểu Đồ Doanh Thu 6 Tháng Gần Nhất" type="line" />
          </div>

          <div className="top-products-card">
            <h3 className="top-products-title">Top 5 Sản Phẩm Bán Chạy (Tháng)</h3>
            <ul className="top-products-list">
              {topProducts.map((p) => (
                <li key={p.productCode} className="top-product-item">
                  <img src={p.image} className="top-product-image" />
                  <div className="top-product-info">
                    <p className="top-product-name">{p.name}</p>
                    <p className="top-product-codes">
                      Danh mục: {p.categoryCode} | Mã SP: {p.productCode}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="charts-side">
            <ChartPlaceholder title="Phân Tích Kênh Bán Hàng" type="pie" />
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
            <a href="/orders" className="view-all-orders">
              → Xem Toàn Bộ Đơn Hàng
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
