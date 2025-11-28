import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/product-detail.css";

// --- Button CTA ---
function PrimaryButton({ children, className = "" }) {
  return (
    <button className={`btn-primary ${className}`}>{children}</button>
  );
}

// --- Tabs điều hướng ---
function ProductTabs({ activeTab, setActiveTab }) {
  const tabs = ["Mô Tả Chi Tiết", "Thành Phần & Nguồn Gốc", "Đánh Giá Khách Hàng"];
  return (
    <div className="tabs-wrapper">
      {tabs.map(tab => (
        <span
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`tab-item ${activeTab === tab ? "tab-active" : ""}`}
        >
          {tab}
        </span>
      ))}
    </div>
  );
}
type ProductDetailProps = {
  productName?: string;
  price?: number;
  oldPrice?: number;
  description?: string;
  rating?: number;
};


// --- Component chính ---
export default function ProductDetailPage({ productName, price, oldPrice, description, rating } : ProductDetailProps) {
  const [activeTab, setActiveTab] = useState("Mô Tả Chi Tiết");
  const [quantity, setQuantity] = useState(1);
  const isSale = oldPrice !== undefined;

  const renderTabContent = () => {
    switch (activeTab) {
      case "Thành Phần & Nguồn Gốc":
        return (
          <div className="tab-content tab-bg">
            <p className="font-semibold mb-2">Thành Phần:</p>
            <ul className="list-disc ml-5 text-sm">
              <li>Sáp đậu nành 100% tự nhiên</li>
              <li>Tinh dầu vỏ Cam và Quế Organic</li>
              <li>Bấc Cotton không chì</li>
              <li>Không Paraben, không hóa chất độc hại</li>
            </ul>
          </div>
        );
      case "Đánh Giá Khách Hàng":
        return (
          <div className="tab-content tab-border">
            <p className="font-semibold mb-2">⭐️⭐️⭐️⭐️⭐️ 4.9/5 (256 Đánh Giá)</p>
            <p className="text-sm text-gray-600">"Mùi hương ấm áp và rất thư giãn..." - An Nguyễn</p>
          </div>
        );
      default:
        return (
          <div className="tab-content">
            <p className="mb-3">{description}</p>
            <p className="font-semibold mt-4">Hướng Dẫn Sử Dụng:</p>
            <ul className="list-disc ml-5 text-sm">
              <li>Đốt lần đầu tối thiểu 2 giờ để sáp tan đều</li>
              <li>Cắt bấc còn 0.5cm trước mỗi lần đốt</li>
            </ul>
          </div>
        );
    }
  };

  return (
    <div className="product-wrapper">
      <Header />

      <div className="product-content">
        <div className="breadcrumb">Trang chủ / Nến Thơm / {productName}</div>

        <div className="product-main">
          <div className="product-images">
            <div className="main-image">
              <img src="https://via.placeholder.com/600x600/E5D3BD?text=Nến+Thơm+Organic" alt={productName} />
            </div>
            <div className="thumbs">
              {[1,2,3].map(i => <div key={i} className="thumb"></div>)}
            </div>
          </div>

          <div className="product-info">
            <h1 className="product-title">{productName}</h1>
            <div className="product-rating">
              <span className="stars">⭐️⭐️⭐️⭐️⭐️</span>
              <span className="reviews">(256 đánh giá)</span>
            </div>

            <div className="price-section">
              <span className="price">{price}</span>
              {isSale && <span className="old-price">{oldPrice}</span>}
            </div>

            <p className="product-desc">
              Nến thơm thư giãn với tinh dầu thiên nhiên, không hóa chất...
            </p>

            <div className="product-flavors">
              <span className="label">Mùi Hương:</span>
              <div className="flavor-options">
                <span className="flavor selected">Cam Quế</span>
                <span className="flavor">Oải Hương</span>
                <span className="flavor">Trà Xanh</span>
              </div>
            </div>

            <div className="quantity-buy">
              <div className="quantity">
                <button onClick={() => setQuantity(Math.max(1, quantity-1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity+1)}>+</button>
              </div>
              <PrimaryButton className="btn-buy">Thêm vào giỏ hàng</PrimaryButton>
            </div>

            <div className="product-shipping">
              <p>🚚 Giao hàng toàn quốc</p>
              <p>🔄 Đổi trả 7 ngày nếu lỗi nhà sản xuất</p>
            </div>
          </div>
        </div>

        <div className="product-tabs">
          <ProductTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          {renderTabContent()}
        </div>

        <h2 className="related-title">Sản Phẩm Khác Bạn Có Thể Thích</h2>
        <div className="related-products">
          {[1,2,3,4].map(i => (
            <div key={i} className="related-item">Sản phẩm {i}</div>
          ))}
        </div>

      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}
