import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import SalesFloatingButton from "../components/SalesFloatingButton";

import "../../css/address.css";

function AddressCard({ address, isDefault }) {
  return (
    <div className={`ab-card ${isDefault ? "ab-card-default" : ""}`}>
      <div className="ab-card-header">
        <h3 className="ab-card-title">
          {address.recipient}
          {isDefault && <span className="ab-badge-default">Mặc định</span>}
        </h3>

        <div className="ab-actions">
          <button className="ab-action-edit">Sửa</button>
          <span className="ab-divider">|</span>
          <button className="ab-action-delete">Xóa</button>
        </div>
      </div>

      <p className="ab-info"><strong>SĐT:</strong> {address.phone}</p>
      <p className="ab-info"><strong>Địa chỉ:</strong> {address.detail}</p>

      {!isDefault && (
        <button className="ab-set-default">Đặt làm mặc định</button>
      )}
    </div>
  );
}

export default function AddressBookPage() {
  const addresses = [
    {
      id: 1,
      recipient: "Nguyễn Thị An (Nhà Riêng)",
      phone: "090xxxxxxx",
      detail: "123 Đường Sạch Đẹp, Phường Tân Phong, Quận 7, TP.HCM",
      isDefault: true,
    },
    {
      id: 2,
      recipient: "Nguyễn Thị An (Văn Phòng)",
      phone: "090yyyyyyy",
      detail: "Tầng 5, Tòa nhà Xanh, Quận 1, TP.HCM",
      isDefault: false,
    },
  ];

  return (
    <>
      <Header />
      <FloatingButtons />
      {/* <SalesFloatingButton /> */}

      <div className="ab-wrapper">
        <h2 className="ab-title">Sổ Địa Chỉ Giao Hàng</h2>

        <button className="ab-add-btn">
          <span className="ab-add-icon">+</span> Thêm Địa Chỉ Mới
        </button>

        <div className="ab-grid">
          {addresses.map((item) => (
            <AddressCard key={item.id} address={item} isDefault={item.isDefault} />
          ))}
        </div>

        {addresses.length === 0 && (
          <div className="ab-empty-box">
            Bạn chưa lưu địa chỉ nào. Hãy thêm địa chỉ đầu tiên!
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
