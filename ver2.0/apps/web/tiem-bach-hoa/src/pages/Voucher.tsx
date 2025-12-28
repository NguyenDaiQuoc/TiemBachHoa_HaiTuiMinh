// MyCouponsPage.jsx
import React from "react";
import "../../css/my-coupons.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";

function PersonalCouponCard({ coupon }: any) {
  const handleCopy = () => {
    alert(`Đã sao chép mã: ${coupon.code}`);
  };

  const isExpired = coupon.status === "Hết Hạn";
  const isUsed = coupon.status === "Đã Dùng";
  const isActive = coupon.status === "Sẵn Dùng";

  return (
    <div
      className={`coupon-card ${isActive ? "active" : ""} ${
        isExpired || isUsed ? "disabled" : ""
      }`}
    >
      <span
        className={`coupon-status ${
          isActive ? "status-green" : "status-gray"
        }`}
      >
        {coupon.status}
      </span>

      <div className="coupon-body">
        <div className="coupon-info">
          <h3 className={`coupon-title ${isActive ? "title-orange" : ""}`}>
            {coupon.description}
          </h3>
          <p className="coupon-min">Áp dụng cho đơn hàng {coupon.minOrder}.</p>
        </div>

        <div className="coupon-code-wrap">
          <div className="coupon-code-box">
            <p className={`coupon-code ${isActive ? "title-orange" : ""}`}>
              {coupon.code}
            </p>
          </div>

          {isActive ? (
            <button className="coupon-copy" onClick={handleCopy}>
              [Click để sao chép]
            </button>
          ) : (
            <p className="coupon-unavailable">Không khả dụng</p>
          )}
        </div>
      </div>

      <p className="coupon-expire">Hạn sử dụng: {coupon.expires}</p>
    </div>
  );
}

export default function MyCouponsPage() {
  const personalCoupons = [
    {
      id: 1,
      code: "BDAYNHADUA24",
      description: "Giảm 100.000 VNĐ mừng sinh nhật",
      expires: "31/12/2025",
      minOrder: "từ 350.000",
      status: "Sẵn Dùng",
    },
    {
      id: 2,
      code: "TICHDIEM50",
      description: "Voucher đổi từ 1000 điểm tích lũy",
      expires: "30/11/2025",
      minOrder: "từ 200.000",
      status: "Đã Dùng",
    },
    {
      id: 3,
      code: "BAUTRUHOAHONG",
      description: "Giảm 15% bù trừ sự cố đơn hàng",
      expires: "30/09/2025",
      minOrder: "từ 100.000",
      status: "Hết Hạn",
    },
  ];

  const activeFilter: string = "Sẵn Dùng";
  const filters = ["Sẵn Dùng", "Đã Dùng", "Hết Hạn", "Tất Cả"];

  const filteredCoupons = personalCoupons.filter(
    (c) => activeFilter === "Tất Cả" || c.status === activeFilter
  );

  return (
    <>
      <Header />
      <FloatingButtons />

      <div className="coupon-page">
        <h2 className="coupon-heading">Ví Mã Giảm Giá Của Tôi</h2>

        {/* Bộ lọc */}
        <div className="coupon-filter">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-item ${
                activeFilter === filter ? "filter-active" : ""
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Danh sách */}
        <div className="coupon-grid">
          {filteredCoupons.map((coupon) => (
            <PersonalCouponCard key={coupon.id} coupon={coupon} />
          ))}

          {filteredCoupons.length === 0 && (
            <div className="coupon-empty">
              <p>Không có mã giảm giá nào thuộc trạng thái "{activeFilter}"</p>
              <p className="empty-sub">Hãy xem trang Ưu Đãi để biết thêm!</p>
            </div>
          )}
        </div>

        <div className="coupon-more">
          <a href="#">→ Xem ưu đãi chung của Tiệm Bách Hóa Hai Tụi Mình</a>
        </div>
      </div>

      <Footer />
    </>
  );
}
