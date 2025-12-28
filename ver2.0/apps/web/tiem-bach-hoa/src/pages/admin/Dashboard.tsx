import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuth as auth, adminDb as db } from "../../firebase-admin";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
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
import { showError } from '../../utils/toast';

// ⭐️ IMPORT SIDEBAR MỚI ⭐️
import AdminSidebar from "../../components/admin/Sidebar"; 

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
    <div className="dashboard-metric-card">
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
      <div className="dashboard-chart-card">
        <h3 className="dashboard-chart-title">{title}</h3>
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

// --- DASHBOARD PAGE ---
export default function Dashboard() { // Đã đổi tên thành Dashboard
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("Admin");
  const [totalFavorites, setTotalFavorites] = useState<number | null>(null);
  const [topFavProducts, setTopFavProducts] = useState<Array<{ productId: string; count: number; name?: string; image?: string }>>([]);

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

  useEffect(() => {
    // Fetch favorites metrics (top favorited products, total favorites)
    const fetchFavMetrics = async () => {
      try {
        const favSnap = await getDocs(collection(db, 'favorites'));
        setTotalFavorites(favSnap.size);

        const counts: Record<string, number> = {};
        favSnap.docs.forEach(d => {
          const data: any = d.data();
          const pid = data.productId;
          if (!pid) return;
          counts[pid] = (counts[pid] || 0) + 1;
        });

        const entries = Object.entries(counts).map(([productId, count]) => ({ productId, count }));
        entries.sort((a, b) => b.count - a.count);
        const top = entries.slice(0, 5);

        // Resolve product names/images for top products if available
        const withMeta = await Promise.all(top.map(async (t) => {
          try {
            const pSnap = await getDoc(doc(db, 'products', t.productId));
            if (pSnap.exists()) {
              const d: any = pSnap.data();
              return { ...t, name: d.name || t.productId, image: d.image || '' };
            }
            return { ...t, name: t.productId, image: '' };
          } catch (e) {
            return { ...t, name: t.productId, image: '' };
          }
        }));

        setTopFavProducts(withMeta as any);
      } catch (err) {
        console.error('fetchFavMetrics error', err);
      }
    };

    fetchFavMetrics();
  }, []);

  // --- KPI ---
  const [kpiData, setKpiData] = React.useState<Array<{ title: string; value: number; change: number; isMoney?: boolean }>>([]);

  useEffect(() => {
    const computeKpis = async () => {
      try {
        // Month start / end
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // Fetch orders in month
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        let totalRevenue = 0;
        let ordersThisMonth = 0;
        let paidOrders = 0;
        const customersSet = new Set<string>();

        orders.forEach((o: any) => {
          const created = o.createdAt;
          let createdTs = 0;
          if (created && created.seconds) createdTs = created.seconds * 1000;
          else if (created) createdTs = new Date(created).getTime();
          if (createdTs >= monthStart.getTime() && createdTs < monthEnd.getTime()) {
            ordersThisMonth++;
            totalRevenue += Number(o.total || o.amount || 0) || 0;
            if ((o.status || '').toString().includes('Thanh Toán') || (o.status || '').toString().includes('Đã')) paidOrders++;
          }
          if (o.userID || o.userId || o.customerId) customersSet.add(o.userID || o.userId || o.customerId || (o.customerEmail || ''));
        });

        // New customers this month
        const usersSnap = await getDocs(collection(db, 'users'));
        const newCustomers = usersSnap.docs.filter(d => {
          const u = d.data();
          const c = u.createdAt;
          let t = 0;
          if (!c) return false;
          if (c.seconds) t = c.seconds * 1000; else t = new Date(c).getTime();
          return t >= monthStart.getTime() && t < monthEnd.getTime();
        }).length;

        const conversion = ordersThisMonth === 0 ? 0 : Math.round((paidOrders / ordersThisMonth) * 100);

        setKpiData([
          { title: 'Tổng Doanh Thu (Tháng này)', value: totalRevenue, change: 0, isMoney: true },
          { title: 'Số Lượng Đơn Hàng', value: ordersThisMonth, change: 0 },
          { title: 'Khách Hàng Mới', value: newCustomers, change: 0 },
          { title: 'Tỉ Lệ Chuyển Đổi (%)', value: conversion, change: 0 },
        ]);
      } catch (err) {
        console.error('compute KPI error', err);
        showError('Không thể tải số liệu Dashboard');
      }
    };

    computeKpis();
  }, []);

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
      {/* ⭐️ SỬ DỤNG COMPONENT SIDEBAR ĐÃ TÁCH ⭐️ */}
      <AdminSidebar /> 

      <div className="dashboard-content">
        <header className="dashboard-header">
          <h2 className="dashboard-title">Tổng Quan Hoạt Động</h2>
          <span className="dashboard-greeting">
            Xin chào, {adminName} (Phiên bản Flash 2.5)
          </span>
        </header>

        <div className="dashboard-kpi-grid">
          {kpiData.map((d, i) => <MetricCard key={i} {...d} />)}
          <div className="dashboard-metric-card">
            <p className="metric-title">Tổng Yêu Thích</p>
            <h3 className="metric-value">{totalFavorites !== null ? totalFavorites.toLocaleString('vi-VN') : '—'}</h3>
            <div className="metric-change-subtext">Số lượt thêm vào yêu thích</div>
          </div>
        </div>

        <div className="dashboard-charts-grid">
          <div className="charts-main">
            <ChartPlaceholder title="Biểu Đồ Doanh Thu 6 Tháng Gần Nhất" type="line" />
          </div>

          <div className="top-products-card">
            <h3 className="top-products-title">Top 5 Sản Phẩm Bán Chạy (Tháng)</h3>
            <ul className="top-products-list">
              {topFavProducts.length > 0 ? topFavProducts.map((p) => (
                <li key={p.productId} className="top-product-item">
                  {p.image ? <img src={p.image} className="top-product-image" /> : <div style={{width:48,height:48,background:'#f3f4f6'}}/>}
                  <div className="top-product-info">
                    <p className="top-product-name">{p.name}</p>
                    <p className="top-product-codes">Lượt yêu thích: {p.count}</p>
                  </div>
                </li>
              )) : (
                <li className="top-product-item">Chưa có dữ liệu yêu thích</li>
              )}
            </ul>
          </div>

          <div className="charts-side">
            <ChartPlaceholder title="Phân Tích Kênh Bán Hàng" type="pie" />
          </div>

          <div className="orders-card">
            <h3 className="orders-title">5 Đơn Hàng Cần Xử Lý Gấp</h3>
            <table className="dashboard-orders-table">
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