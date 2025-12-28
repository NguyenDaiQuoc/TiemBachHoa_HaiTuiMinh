import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import AdminSidebar from "../../components/admin/Sidebar";
import { adminDb as db } from "../../firebase-admin";
import "../../../css/admin/analytics.css";

const formatCurrency = (amount: number) =>
  Number(amount || 0).toLocaleString("vi-VN") + " VNĐ";

const toDate = (v: any): Date | null => {
  if (!v) return null;
  if (v.toDate) return v.toDate();
  if (v.seconds) return new Date(v.seconds * 1000);
  const num = Number(v);
  if (!Number.isNaN(num) && num > 0) return new Date(num);
  return null;
};

const percentChange = (current: number, previous: number) => {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

function ReportMetricCard({
  title,
  value,
  change,
  isMoney = false,
  suffix = "",
}: {
  title: string;
  value: number;
  change: number;
  isMoney?: boolean;
  suffix?: string;
}) {
  const isPositive = change >= 0;
  const arrow = isPositive ? "▲" : "▼";
  const displayValue = isMoney
    ? formatCurrency(value)
    : suffix
    ? `${value.toFixed(1)}${suffix}`
    : value.toLocaleString("vi-VN");

  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>
      <h3 className="metric-value">{displayValue}</h3>
      <div className="metric-change">
        <span className={`change-number ${isPositive ? "pos" : "neg"}`}>
          {arrow} {Math.abs(change).toFixed(1)}%
        </span>
        <span className="change-sub">so với kỳ trước</span>
      </div>
    </div>
  );
}

function MiniBar({
  data,
}: {
  data: { label: string; value: number; hint?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mini-bar">
      {data.map((d) => (
        <div key={d.label} className="mini-bar__item" title={d.hint || d.label}>
          <div
            className="mini-bar__bar"
            style={{ height: `${(d.value / max) * 100 || 4}%` }}
          />
          <div className="mini-bar__label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (!mounted) return;
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(docs);
      } catch (e: any) {
        if (!mounted) return;
        setError("Không tải được dữ liệu báo cáo, vui lòng thử lại.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filterByRange = (list: any[], days: string) => {
    if (days === "all") return list;
    const dayNum = Number(days) || 30;
    const since = Date.now() - dayNum * 24 * 60 * 60 * 1000;
    return list.filter((o) => {
      const d = toDate((o as any).createdAt);
      return d && d.getTime() >= since;
    });
  };

  const filteredOrders = useMemo(
    () => filterByRange(orders, range),
    [orders, range]
  );

  const previousOrders = useMemo(() => {
    if (range === "all") return [];
    const days = Number(range) || 30;
    const now = Date.now();
    const start = now - days * 24 * 60 * 60 * 1000;
    const prevStart = start - days * 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      const d = toDate(o.createdAt);
      if (!d) return false;
      const t = d.getTime();
      return t >= prevStart && t < start;
    });
  }, [orders, range]);

  const sumRevenue = (list: any[]) =>
    list.reduce((acc, o) => acc + Number(o.total || o.amount || 0), 0);

  const totalRevenue = sumRevenue(filteredOrders);
  const prevRevenue = sumRevenue(previousOrders);
  const totalOrders = filteredOrders.length;
  const prevOrders = previousOrders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const prevAvgOrderValue = prevOrders ? prevRevenue / prevOrders : 0;

  const paidOrders = filteredOrders.filter((o) =>
    String(o.status || "").includes("Thanh Toán")
  ).length;
  const prevPaidOrders = previousOrders.filter((o) =>
    String(o.status || "").includes("Thanh Toán")
  ).length;
  const paymentRate = totalOrders ? (paidOrders / totalOrders) * 100 : 0;
  const prevPaymentRate = prevOrders ? (prevPaidOrders / prevOrders) * 100 : 0;

  const deliveredOrders = filteredOrders.filter((o) =>
    String(o.status || "").includes("Giao")
  ).length;
  const deliveryRate = totalOrders ? (deliveredOrders / totalOrders) * 100 : 0;

  const kpiData = [
    {
      title: "Tổng Doanh Thu",
      value: totalRevenue,
      change: percentChange(totalRevenue, prevRevenue),
      isMoney: true,
    },
    {
      title: "Tổng Số Đơn Hàng",
      value: totalOrders,
      change: percentChange(totalOrders, prevOrders),
    },
    {
      title: "Giá trị Đơn Hàng TB",
      value: avgOrderValue,
      change: percentChange(avgOrderValue, prevAvgOrderValue),
      isMoney: true,
    },
    {
      title: "Tỷ lệ Thanh Toán",
      value: paymentRate,
      change: percentChange(paymentRate, prevPaymentRate),
      suffix: "%",
    },
  ];

  const ordersByDay = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const d = toDate(o.createdAt);
      if (!d) return;
      const key = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + Number(o.total || o.amount || 0));
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({
        label: label.slice(5),
        value,
        hint: `Doanh thu ${label}: ${formatCurrency(value)}`,
      }))
      .sort((a, b) => (a.label > b.label ? 1 : -1))
      .slice(-12);
  }, [filteredOrders]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        const cat =
          it.category || it.categoryName || it.catName || it.group || "Khác";
        const qty = Number(it.quantity || it.qty || 1);
        const price = Number(
          it.price || it.unitPrice || it.priceApplied || o.total || 0
        );
        map.set(cat, (map.get(cat) || 0) + qty * price);
      });
    });
    const entries = Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    const total = entries.reduce((s, e) => s + e.value, 0) || 1;
    return entries.slice(0, 6).map((e) => ({
      ...e,
      percent: Math.round((e.value / total) * 100),
    }));
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { revenue: number; qty: number }>();
    filteredOrders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it: any) => {
        const name = it.name || it.title || it.productName || "Sản phẩm";
        const qty = Number(it.quantity || it.qty || 1);
        const price = Number(it.price || it.unitPrice || it.priceApplied || 0);
        const prev = map.get(name) || { revenue: 0, qty: 0 };
        map.set(name, {
          revenue: prev.revenue + qty * price,
          qty: prev.qty + qty,
        });
      });
    });
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  const customerStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const key =
        o.userID || o.userId || o.customerId || o.phone || o.email || "";
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    const values = Array.from(map.values());
    const newCustomers = values.filter((c) => c === 1).length;
    const returningCustomers = values.filter((c) => c > 1).length;
    return { newCustomers, returningCustomers };
  }, [filteredOrders]);

  const prepareExportData = () => {
    return filteredOrders.map((o) => {
      const created = toDate(o.createdAt);
      return {
        'Mã đơn': o.id,
        'Khách hàng': o.customerName || o.customer || o.userName || '',
        'Điện thoại': o.phone || '',
        'Tổng tiền': Number(o.total || o.amount || 0),
        'Trạng thái': o.status || '',
        'Ngày đặt': created ? created.toLocaleDateString('vi-VN') : '',
      };
    });
  };

  const handleExportExcel = () => {
    const data = prepareExportData();
    import('../../utils/exportUtils').then(m => m.exportToExcel(data, `bao-cao-don-hang-${range}-ngay`)).catch(err => console.error('Export failed', err));
  };

  const handleExportPDF = () => {
    const data = prepareExportData();
    const columns = ['Mã đơn', 'Khách hàng', 'Điện thoại', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'];
    import('../../utils/exportUtils').then(m => m.exportToPDF(data, `bao-cao-don-hang-${range}-ngay`, columns, 'Báo Cáo Đơn Hàng')).catch(err => console.error('Export failed', err));
  };

  const handleExportCSV = () => {
    const data = prepareExportData();
    const columns = ['Mã đơn', 'Khách hàng', 'Điện thoại', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'];
    import('../../utils/exportUtils').then(m => m.exportToCSV(data, `bao-cao-don-hang-${range}-ngay`, columns)).catch(err => console.error('Export failed', err));
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <div className="reports-container">
          <header className="reports-header">
            <div>
              <h1 className="reports-title">Báo Cáo &amp; Analytics</h1>
              <div className="reports-sub">Tổng hợp số liệu trực tiếp từ đơn hàng</div>
            </div>
            {orders.length > 0 && (
              <div className="reports-sub">Cập nhật: {new Date().toLocaleString("vi-VN")}</div>
            )}
          </header>

          <div className="filter-bar">
            <span className="filter-label">Chọn kỳ báo cáo:</span>
            <select
              className="filter-select"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="30">30 ngày gần nhất</option>
              <option value="90">90 ngày gần nhất</option>
              <option value="365">12 tháng gần nhất</option>
              <option value="all">Toàn bộ dữ liệu</option>
            </select>

            <button className="btn-view" onClick={handleExportExcel}>
              Xuất Excel 📊
            </button>
            <button className="btn-view" onClick={handleExportPDF}>
              Xuất PDF 📄
            </button>
            <button className="btn-view" onClick={handleExportCSV}>
              Xuất CSV 📋
            </button>
          </div>

          {loading && <div className="report-placeholder">Đang tải dữ liệu...</div>}
          {error && <div className="report-error">{error}</div>}

          {!loading && !error && (
            <>
              <div className="kpi-grid">
                {kpiData.map((item, i) => (
                  <ReportMetricCard key={i} {...item} />
                ))}
              </div>

              <div className="charts-grid">
                <div className="chart-full chart-card">
                  <h3 className="chart-title">Xu hướng doanh thu theo ngày</h3>
                  {ordersByDay.length === 0 ? (
                    <div className="chart-placeholder">Chưa có dữ liệu theo ngày</div>
                  ) : (
                    <MiniBar data={ordersByDay} />
                  )}
                </div>

                <div className="chart-small chart-card">
                  <h3 className="chart-title">Cơ cấu doanh thu theo danh mục</h3>
                  {categoryBreakdown.length === 0 ? (
                    <div className="chart-placeholder">Chưa có dữ liệu danh mục</div>
                  ) : (
                    <div className="progress-list">
                      {categoryBreakdown.map((c) => (
                        <div key={c.label} className="progress-row">
                          <div className="progress-row__label">{c.label}</div>
                          <div className="progress-row__track">
                            <div
                              className="progress-row__fill"
                              style={{ width: `${c.percent}%` }}
                            />
                          </div>
                          <div className="progress-row__value">
                            {c.percent}% · {formatCurrency(c.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="chart-medium chart-card">
                  <h3 className="chart-title">Khách hàng mới vs quay lại</h3>
                  <div className="customer-grid">
                    <div className="customer-card">
                      <div className="customer-number">{customerStats.newCustomers}</div>
                      <div className="customer-label">Khách mới</div>
                    </div>
                    <div className="customer-card secondary">
                      <div className="customer-number">{customerStats.returningCustomers}</div>
                      <div className="customer-label">Khách quay lại</div>
                    </div>
                  </div>
                </div>

                <div className="table-wrapper">
                  <h3 className="table-title">Top sản phẩm bán chạy</h3>
                  {topProducts.length === 0 ? (
                    <div className="chart-placeholder">Chưa có dữ liệu sản phẩm</div>
                  ) : (
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Hạng</th>
                          <th>Sản phẩm</th>
                          <th>Doanh thu</th>
                          <th>Số lượng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p, idx) => (
                          <tr key={p.label}>
                            <td className={idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : ""}>#{idx + 1}</td>
                            <td>{p.label}</td>
                            <td>{formatCurrency(p.revenue)}</td>
                            <td>{p.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
