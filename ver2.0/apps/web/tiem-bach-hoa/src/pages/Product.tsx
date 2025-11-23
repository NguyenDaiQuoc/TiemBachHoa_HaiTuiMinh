import React from "react";
import "../../css/product.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";

// --- Component ProductCard ---
function ProductCard({ image, name, price, oldPrice, tag }: any) {
  const isSale = oldPrice !== undefined;

  return (
    <div className="product-card">
      <div className="product-card-image-wrapper">
        <img src={image} alt={name} className="product-card-image" />
        {tag && <span className="product-card-tag">{tag}</span>}
      </div>
      <span className="product-card-name">{name}</span>
      <div className="product-card-price-wrapper">
        <span className="product-card-price">{price}</span>
        {isSale && <span className="product-card-oldprice">{oldPrice}</span>}
      </div>
    </div>
  );
}

// --- Component FilterSidebar ---
function FilterSidebar() {
  const filterGroups = [
    { title: "Danh Mục Chính", items: ["Thực phẩm khô", "Gia vị", "Đồ dùng bếp", "Nến & Trang trí"] },
    { title: "Mức Giá", items: ["Dưới 100K", "100K - 300K", "Trên 300K"] },
    { title: "Đánh Giá", items: ["⭐️⭐️⭐️⭐️⭐️", "⭐️⭐️⭐️⭐️ trở lên"] },
  ];

  return (
    <div className="filter-sidebar">
      <h3 className="filter-title">Bộ Lọc</h3>
      {filterGroups.map((group) => (
        <div key={group.title} className="filter-group">
          <p className="filter-group-title">{group.title}</p>
          <ul className="filter-group-list">
            {group.items.map((item) => (
              <li key={item} className="filter-item">
                <input type="checkbox" id={item} className="filter-checkbox" />
                <label htmlFor={item} className="filter-label">{item}</label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button className="filter-apply-btn">Áp Dụng</button>
    </div>
  );
}

// --- Component Chính ---
interface ProductListingPageProps {
  categoryTitle?: string;
  totalProducts?: number;
}

export default function ProductListingPage({ categoryTitle = "Hàng Mới Về", totalProducts = 48 }: ProductListingPageProps) {
  const baseProducts = [
    { name: "Nến thơm Organic Vỏ Cam", price: "180.000đ", oldPrice: "200.000đ", tag: "Mới", image: "https://via.placeholder.com/300/FBF8F5?text=SP1" },
    { name: "Bánh quy Yến mạch (Hộp)", price: "150.000đ", oldPrice: undefined, tag: null, image: "https://via.placeholder.com/300/FBF8F5?text=SP2" },
    { name: "Khăn lau bếp Linen", price: "85.000đ", oldPrice: undefined, tag: null, image: "https://via.placeholder.com/300/FBF8F5?text=SP3" },
    { name: "Bộ gia vị 5 món", price: "320.000đ", oldPrice: "350.000đ", tag: "Sale", image: "https://via.placeholder.com/300/FBF8F5?text=SP4" },
  ];

  const additionalProducts = baseProducts.slice(0, 4).map((p, i) => ({
    ...p,
    name: p.name + " (Hộp Quà)",
    tag: "New",
    image: `https://via.placeholder.com/300/FBF8F5?text=SP${i + 5}`,
  }));

  const sampleProducts = [...baseProducts, ...additionalProducts];

  return (
    <div className="product-page">
      <Header />

      <main className="product-main">
        <div className="breadcrumb">Trang chủ / Sản phẩm / {categoryTitle}</div>
        <h1 className="product-category-title">{categoryTitle}</h1>

        <div className="product-content">
          <aside className="product-filter">
            <FilterSidebar />
          </aside>
          <section className="product-list-section">
            <div className="product-list-top">
              <span className="product-count">Hiển thị 12 trên {totalProducts} sản phẩm</span>
              <div className="product-sort">
                <label htmlFor="sort">Sắp xếp theo:</label>
                <select id="sort" className="product-sort-select">
                  <option>Hàng Mới Về</option>
                  <option>Giá: Thấp đến Cao</option>
                  <option>Giá: Cao đến Thấp</option>
                  <option>Bán Chạy Nhất</option>
                </select>
              </div>
            </div>

            <div className="product-grid">
              {sampleProducts.map((p, i) => (
                <ProductCard key={i} {...p} />
              ))}
            </div>

            <div className="pagination">
              <button>←</button>
              <button className="pagination-current">1</button>
              <button>2</button>
              <button>3</button>
              <button>→</button>
            </div>
          </section>
          
        </div>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
