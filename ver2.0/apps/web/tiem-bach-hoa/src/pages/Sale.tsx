// SalePage.jsx
import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/sale.css";

export default function SalePage() {
  const products = [
    {
      id: 1,
      name: "Bộ Hộp Nhựa Lock&Lock 12 Món",
      price: 269000,
      oldPrice: 340000,
      image: "/images/product1.jpg",
    },
    {
      id: 2,
      name: "Sáp Thơm Ô Tô Little Trees",
      price: 45000,
      oldPrice: 65000,
      image: "/images/product2.jpg",
    },
    {
      id: 3,
      name: "Tai Nghe Bluetooth Xiaomi",
      price: 159000,
      oldPrice: 220000,
      image: "/images/product3.jpg",
    },
    {
      id: 4,
      name: "Bàn Chải Điện Colgate ProClean",
      price: 199000,
      oldPrice: 260000,
      image: "/images/product4.jpg",
    },
  ];

  return (
    <>
      <Header />

      <div className="page-container">
        {/* Banner */}
        <div className="banner">
          <h1 className="banner-title">Siêu Ưu Đãi Tháng Này</h1>
          <p className="banner-desc">
            Sản phẩm gia dụng – đồ cá nhân – mỹ phẩm – đồ điện tử…  
            Giá rẻ hơn Bách Hoá Xanh & tạp hoá lẻ.
          </p>
        </div>

        {/* Product List */}
        <div className="product-grid">
          {products.map((item) => (
            <div className="product-card" key={item.id}>
              <div className="product-img">
                <img src={item.image} alt={item.name} />
              </div>

              <div className="product-info">
                <h3 className="product-name">{item.name}</h3>

                <div className="product-price">
                  <span className="price-new">
                    {item.price.toLocaleString()}₫
                  </span>
                  <span className="price-old">
                    {item.oldPrice.toLocaleString()}₫
                  </span>
                </div>

                <button className="btn-buy">Thêm vào giỏ</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FloatingButtons />
      <Footer />
    </>
  );
}
