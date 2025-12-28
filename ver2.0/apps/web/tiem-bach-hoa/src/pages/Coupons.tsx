import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/my-coupons.css";
import { auth } from "../firebase-auth";
import { db } from "../firebase-firestore";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import LoginWarning from "../components/LoginWarning";
import { showError, showInfo, showSuccess } from "../utils/toast";

interface Voucher {
  id: string;
  code: string;
  title?: string;
  description?: string;
  status?: string;
  discountType?: "percent" | "fixed";
  discount?: number;
  minOrder?: number;
  usageLimit?: number;
  usedCount?: number;
  startAt?: any;
  endAt?: any;
}

function isActive(v: Voucher, nowMs: number): boolean {
  const statusActive = (v.status || "").toLowerCase().includes("đang") || (v.status || "").toLowerCase().includes("active");
  const startMs = v.startAt && v.startAt.seconds ? v.startAt.seconds * 1000 : typeof v.startAt === "number" ? v.startAt : 0;
  const endMs = v.endAt && v.endAt.seconds ? v.endAt.seconds * 1000 : typeof v.endAt === "number" ? v.endAt : Infinity;
  const withinWindow = nowMs >= startMs && nowMs <= endMs;
  return (statusActive || !v.status) && withinWindow;
}

export default function Coupons() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginWarning, setShowLoginWarning] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const vouchersRef = collection(db, "vouchers");
        const q = query(vouchersRef, orderBy("startAt", "desc"));
        const snap = await getDocs(q);
        const arr: Voucher[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setVouchers(arr);
      } catch (e: any) {
        console.warn("Load vouchers failed", e?.message || e);
        setVouchers([]);
      }
    };
    load();
  }, []);

  const nowMs = Date.now();
  const activeList = useMemo(() => vouchers.filter((v) => isActive(v, nowMs)), [vouchers, nowMs]);
  const expiredList = useMemo(() => vouchers.filter((v) => !isActive(v, nowMs)), [vouchers, nowMs]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showSuccess("Đã sao chép mã: " + code);
    } catch {
      showInfo("Sao chép không khả dụng — hãy tự copy mã " + code);
    }
  };

  const applyCoupon = (v: Voucher) => {
    if (!currentUser || (currentUser as any).isAnonymous) {
      setShowLoginWarning(true);
      return;
    }
    try {
      localStorage.setItem(
        "selected_coupon",
        JSON.stringify({ code: v.code, discountType: v.discountType, discount: v.discount, minOrder: v.minOrder })
      );
      showSuccess("Đã chọn mã " + v.code + " — sẽ áp dụng khi thanh toán");
    } catch (e) {
      showError("Không thể lưu mã — thử lại");
    }
  };

  const renderItem = (v: Voucher) => {
    const title = v.title || "Mã giảm giá " + (v.code || "");
    const desc = v.description || "Mã giảm giá đặc biệt";
    const typeLabel = v.discountType === "percent" ? `${v.discount || 0}%` : `${(v.discount || 0).toLocaleString("vi-VN")}đ`;
    const minOrderLabel = v.minOrder ? `Đơn tối thiểu ${(v.minOrder || 0).toLocaleString("vi-VN")}đ` : "Không yêu cầu tối thiểu";
    const expired = activeTab === "expired";

    return (
      <div key={v.id} className={`coupon-card ${expired ? "disabled" : "active"}`}>
        <div className="coupon-body">
          <div className="coupon-info">
            <h3 className={`coupon-title ${!expired ? "title-orange" : ""}`}>{title}</h3>
            <p className="coupon-min">{minOrderLabel}</p>
            <p className="coupon-min">Ưu đãi: {typeLabel}</p>
            <p className="coupon-min">{desc}</p>
          </div>

          <div className="coupon-code-wrap">
            <div className="coupon-code-box">
              <p className={`coupon-code ${!expired ? "title-orange" : ""}`}>{v.code || "N/A"}</p>
            </div>
            {!expired ? (
              <button className="coupon-copy" onClick={() => copyCode(v.code)}>📋 Sao chép</button>
            ) : (
              <p className="coupon-unavailable">Không khả dụng</p>
            )}
            <button className="coupon-copy" onClick={() => applyCoupon(v)}>✓ Áp dụng</button>
          </div>
        </div>
        <p className="coupon-expire">
          Hạn sử dụng: {v.endAt?.seconds ? new Date(v.endAt.seconds * 1000).toLocaleDateString("vi-VN") : "—"}
        </p>
      </div>
    );
  };

  const displayList = activeTab === "active" ? activeList : expiredList;

  return (
    <div className="main-app-container">
      <Header />
      <main className="coupon-page">
        <h2 className="coupon-heading">Mã giảm giá dành cho bạn</h2>

        <div className="coupon-filter">
          <button className={`filter-item ${activeTab === "active" ? "filter-active" : ""}`} onClick={() => setActiveTab("active")}>
            Đang hoạt động
          </button>
          <button className={`filter-item ${activeTab === "expired" ? "filter-active" : ""}`} onClick={() => setActiveTab("expired")}>
            Hết hạn
          </button>
        </div>

        <div className="coupon-grid">
          {displayList.map(renderItem)}
          {displayList.length === 0 && (
            <div className="coupon-empty">
              <p>Không có mã phù hợp</p>
              <p className="empty-sub">Hãy quay lại sau khi có chương trình mới nhé!</p>
            </div>
          )}
        </div>
      </main>
      <FloatingButtons />
      <Footer />
      {showLoginWarning && (
        <LoginWarning message="Vui lòng đăng nhập để áp dụng mã giảm giá" onClose={() => setShowLoginWarning(false)} />
      )}
    </div>
  );
}
