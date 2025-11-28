import React from "react";
import "../../css/categories.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import SalesFloatingButton from "../components/SalesFloatingButton";

const mainCategories = [
  {
    name: "Đồ Điện Tử Gia Dụng",
    description: "Thiết bị gia đình hiện đại: TV, nồi chiên, máy hút bụi, đồ điện tử chính hãng.",
    icon: "🔌",
    imageUrl: "https://via.placeholder.com/600x400/E5D3BD?text=Dien+Tu",
    subCategories: ["Máy Sấy Tóc", "Bàn Ủi Hơi Nước", "Máy Hút Bụi Robot"],
  },
  {
    name: "Đồ Dùng Cá Nhân",
    description: "Các sản phẩm thiết yếu hàng ngày: khăn tắm, dao cạo, bàn chải điện...",
    icon: "🧼",
    imageUrl: "https://via.placeholder.com/600x400/E5D3BD?text=Ca+Nhan",
    subCategories: ["Dụng Cụ Cạo Râu", "Khăn Tắm Cao Cấp", "Bàn Chải Điện"],
  },
  {
    name: "Mỹ Phẩm & Chăm Sóc Da",
    description: "Kem dưỡng, serum, son môi, sản phẩm chính hãng – giá cạnh tranh.",
    icon: "💄",
    imageUrl: "https://via.placeholder.com/600x400/E5D3BD?text=My+Pham",
    subCategories: ["Kem Dưỡng Da", "Son Môi", "Mặt Nạ"],
  },
  {
    name: "Gia Dụng Bếp & Dụng Cụ Nhà",
    description: "Nồi chảo chống dính, bộ bát đĩa, dụng cụ nấu ăn – chất lượng bền bỉ.",
    icon: "🍲",
    imageUrl: "https://via.placeholder.com/600x400/E5D3BD?text=Gia+Dung+Bep",
    subCategories: ["Bộ Nồi Chảo", "Bát Đĩa Gốm", "Dụng Cụ Nướng"],
  },
];

export default function ProductCategoriesPage() {
  return (
    <>
      <Header />
      <FloatingButtons />
      {/* <SalesFloatingButton /> */}

      <div className="pc-page">

        <div className="pc-container">

          <header className="pc-header">
            <h1 className="pc-title">Khám Phá Danh Mục Sản Phẩm</h1>
            <p className="pc-subtitle">
              Tìm kiếm mọi sản phẩm chính hãng – gia dụng, điện tử, mỹ phẩm – giá tốt nhất thị trường!
            </p>
          </header>

          <div className="pc-layout">

            {/* Sidebar */}
            <div className="pc-sidebar">
              <h3 className="pc-sidebar-title">Tất Cả Nhóm Hàng</h3>

              <nav className="pc-sidebar-nav">
                {mainCategories.map((cat, index) => (
                  <a
                    key={index}
                    href={`#${cat.name.replace(/\s/g, "-")}`}
                    className="pc-sidebar-link"
                  >
                    <span>{cat.icon}</span> {cat.name}
                  </a>
                ))}
              </nav>

              <button className="pc-button-orange">Xem Tất Cả Sản Phẩm</button>
            </div>

            {/* Main Content */}
            <div className="pc-content">
              {mainCategories.map((cat, index) => (
                <section
                  key={index}
                  id={cat.name.replace(/\s/g, "-")}
                  className="pc-card"
                >
                  {/* Header */}
                  <div className="pc-card-header">
                    <h2 className="pc-card-title">
                      {cat.icon} {cat.name}
                    </h2>
                    <a className="pc-view-all" href="#">
                      Xem tất cả ({cat.subCategories.length} nhóm)
                    </a>
                  </div>

                  {/* Description + sub categories */}
                  <div className="pc-card-body">
                    <p className="pc-desc">{cat.description}</p>

                    <div className="pc-subgrid">
                      {cat.subCategories.map((sub, idx) => (
                        <div key={idx} className="pc-subitem">
                          <div className="pc-subicon">
                            {idx % 3 === 0 ? "✨" : idx % 3 === 1 ? "💖" : "💡"}
                          </div>
                          <span className="pc-subname">{sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="pc-image-wrap">
                    <img src={cat.imageUrl} alt={cat.name} />
                  </div>
                </section>
              ))}
            </div>

          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
