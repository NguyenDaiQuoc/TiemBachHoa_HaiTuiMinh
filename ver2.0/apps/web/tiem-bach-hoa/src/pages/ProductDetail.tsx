import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/product-detail.css";

// ⭐️ IMPORT DB VÀ THƯ VIỆN FIREBASE ⭐️
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';


// --- TYPE VÀ INTERFACE MỚI ---

// Interface cho biến thể sản phẩm (Variation)
interface ProductVariation {
  // Các trường chi tiết từ Firestore
  skuID: number;
  color: string;
  size: string;
  stock: number;
  newPrice: number; // Giá riêng của biến thể
  oldPrice: number;
  discount: number;
  image: string; // Ảnh riêng của biến thể
  material: string;
  condition: string;
}

// Interface Dữ liệu Sản Phẩm
interface ProductData {
  id: string;
  name: string;
  image: string[]; // Lưu ý: image là mảng
  oldPrice: number;
  newPrice: number;
  discount: number;
  tags: string[];
  categorySlugs: string[];
  createdAt: number;
  stock: number; // Tổng stock
  description: string;
  slug: string;
  // ⭐ LẤY DỮ LIỆU TỪ TRƯỜNG `variations` ⭐
  variations: ProductVariation[];
}

// Hàm Hỗ trợ: Định dạng Giá
const formatPrice = (price: number | undefined): string => {
  if (price === undefined || price === null || isNaN(price)) return "0đ";
  return price.toLocaleString('vi-VN') + 'đ';
};


// --- HÀM HỖ TRỢ FIREBASE ---

// Hàm chuyển đổi dữ liệu từ Firestore (Đã cập nhật để lấy variations)
const mapProductFromFirestore = (docId: string, docData: DocumentData): ProductData => {
  const variationsData = (docData.variations as ProductVariation[] | undefined) || [];

  return {
    id: docId,
    name: docData.name || 'Sản phẩm không tên',
    image: (docData.image as string[] | undefined) || ['https://via.placeholder.com/600x600/E0E0E0?text=No+Image'],
    oldPrice: docData.oldPrice || 0,
    newPrice: docData.newPrice || 0,
    discount: docData.discount || 0,
    tags: docData.tag || [],
    categorySlugs: docData.categorySlugs || [],
    stock: docData.stock || 0,
    description: docData.description || 'Chưa có mô tả chi tiết.',
    slug: docData.slug || '',
    createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toMillis() : Date.now(),
    // ⭐ ÁNH XẠ CHÍNH XÁC TRƯỜNG variations ⭐
    variations: variationsData,
  };
};

// Hàm Fetch dữ liệu sản phẩm chi tiết (Giữ nguyên)
const fetchProductDetail = async (
  productSlug: string,
  setProductDetail: (data: ProductData | null) => void,
  setLoading: (loading: boolean) => void,
) => {
  setLoading(true);
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("slug", "==", productSlug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`Không tìm thấy sản phẩm với slug: ${productSlug}`);
      setProductDetail(null);
    } else {
      const doc = querySnapshot.docs[0];
      const productData = mapProductFromFirestore(doc.id, doc.data());
      setProductDetail(productData);
    }
  } catch (error) {
    console.error(`Lỗi khi fetch chi tiết sản phẩm ${productSlug}:`, error);
    setProductDetail(null);
  } finally {
    setLoading(false);
  }
};


// --- Button CTA & Tabs (Giữ nguyên) ---
function PrimaryButton({ children, className = "", onClick, disabled }: { children: React.ReactNode, className?: string, onClick?: () => void, disabled?: boolean }) {
  return (
    <button className={`btn-primary ${className}`} onClick={onClick} disabled={disabled}>{children}</button>
  );
}

function ProductTabs({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
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


// --- Component chính ---
export default function ProductDetailPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const navigate = useNavigate();

  // State cho UI
  const [activeTab, setActiveTab] = useState("Mô Tả Chi Tiết");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // State để lưu trữ dữ liệu sản phẩm
  const [productDetail, setProductDetail] = useState<ProductData | null>(null);

  // ⭐ State: Quản lý biến thể đang được chọn - Dùng skuID để nhận dạng ⭐
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  // --- useEffect để fetch data ---
  useEffect(() => {
    if (productSlug) {
      fetchProductDetail(productSlug, setProductDetail, setLoading);
    } else {
      setLoading(false);
      setProductDetail(null);
    }
  }, [productSlug]);

  // ⭐ useEffect: Cài đặt biến thể mặc định (Biến thể 1) sau khi fetch thành công ⭐
  useEffect(() => {
    if (productDetail && productDetail.variations.length > 0 && !selectedVariation) {
      // Mặc định chọn biến thể đầu tiên (biến thể 1)
      setSelectedVariation(productDetail.variations[0]);
      setQuantity(1); // Reset số lượng
    }
  }, [productDetail, selectedVariation]);


  // ⭐ Logic tính toán giá, tồn kho dựa trên Biến thể được chọn ⭐
  const displayPrice = selectedVariation ? selectedVariation.newPrice : (productDetail?.newPrice || 0);
  const displayOldPrice = selectedVariation ? selectedVariation.oldPrice : (productDetail?.oldPrice || 0);
  const isSale = displayOldPrice > displayPrice;
  const isOutOfStock = selectedVariation ? selectedVariation.stock <= 0 : true;
  const displayImage = selectedVariation ? selectedVariation.image : (productDetail?.image[0] || 'https://via.placeholder.com/600x600/E0E0E0?text=No+Image');


  // --- UI Loading/Error (Giữ nguyên) ---
  if (loading) {
    return (
      <div className="product-detail-wrapper">
        <Header />
        <div className="product-detail-content" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h1 className="product-detail-title">Đang tải chi tiết sản phẩm...</h1>
          <p>Vui lòng chờ giây lát.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!productDetail) {
    const productNameFromSlug = productSlug || "Sản phẩm";
    return (
      <div className="product-detail-wrapper">
        <Header />
        <div className="product-detail-content" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h1 className="product-detail-title">🚨 Không tìm thấy sản phẩm 🚨</h1>
          <p>Mã sản phẩm **"{productNameFromSlug}"** không được tìm thấy trong hệ thống.</p>
          <PrimaryButton className="mt-5" onClick={() => navigate('/categories/all/all')}>Quay lại trang sản phẩm</PrimaryButton>
        </div>
        <Footer />
      </div>
    );
  }


  // Gán dữ liệu sản phẩm sau khi tải thành công
  const { name, description, categorySlugs, variations } = productDetail;

  // --- Render Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "Thành Phần & Nguồn Gốc":
        return (
          <div className="tab-content tab-bg">
            <p className="font-semibold mb-2">Thành Phần & Thông số:</p>
            <ul className="list-disc ml-5 text-sm">
              <li>Màu Sắc: **{selectedVariation?.color || 'N/A'}**</li>
              <li>Kích Thước: **{selectedVariation?.size || 'N/A'}**</li>
              <li>Chất Liệu: **{selectedVariation?.material || 'N/A'}**</li>
              <li>Tình Trạng: **{selectedVariation?.condition || 'N/A'}**</li>
            </ul>
          </div>
        );
      case "Đánh Giá Khách Hàng":
        return (
          <div className="tab-content tab-border">
            <p className="font-semibold mb-2">⭐️⭐️⭐️⭐️⭐️ 4.9/5 (256 Đánh Giá)</p>
            <p className="text-sm text-gray-600">"Màu **{selectedVariation?.color || ''}** rất đẹp và chất liệu **{selectedVariation?.material || ''}** dày dặn." - Khách hàng</p>
          </div>
        );
      default:
        return (
          <div className="tab-content">
            <p className="mb-3">{description}</p>
            <p className="font-semibold mt-4">Thông số chung:</p>
            <ul className="list-disc ml-5 text-sm">
              <li>Mã SKU: **{selectedVariation?.skuID || 'N/A'}**</li>
              <li>Giảm giá: **{productDetail.discount}%**</li>
            </ul>
          </div>
        );
    }
  };


  // --- Main Render ---
  return (
    <div className="product-detail-wrapper">
      <Header />

      <div className="product-detail-content">
        {/* Breadcrumb (Giữ nguyên) */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Trang chủ</span> /
          <span onClick={() => navigate(`/categories/${categorySlugs[0] || 'all'}/all`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}> Sản phẩm</span> /
          {name}
        </div>

        <div className="product-detail-main">
          <div className="product-detail-images">
            <div className="main-image">
              {/* ⭐ SỬ DỤNG IMAGE CỦA VARIATION HOẶC IMAGE CHUNG ⭐ */}
              <img src={displayImage} alt={name} />
            </div>
            <div className="thumbs">
              {/* Hiển thị các ảnh phụ nếu có */}
              {productDetail.image.slice(0, 3).map((img, index) => (
                <div key={index} className="thumb" style={{ backgroundImage: `url(${img})` }}></div>
              ))}
            </div>
          </div>

          <div className="product-detail-info">
            <h1 className="product-detail-title">{name}</h1>

            <div className="product-detail-rating">
              <span className="stars">⭐️⭐️⭐️⭐️⭐️</span>
              <span className="reviews">({productDetail.ratingCount} đánh giá)</span>
            </div>

            <div className="price-section">
              {/* ⭐ HIỂN THỊ GIÁ CỦA BIẾN THỂ ĐƯỢC CHỌN ⭐ */}
              <span className="price">{formatPrice(displayPrice)}</span>
              {isSale && <span className="old-price">{formatPrice(displayOldPrice)}</span>}
            </div>

            <p className="product-detail-desc">
              {description}
            </p>

            {/* ⭐ HIỂN THỊ CÁC BIẾN THỂ (Dùng Màu sắc và Kích thước làm tên hiển thị) ⭐ */}
            {variations.length > 0 && (
              <div className="product-detail-flavors">
                <span className="label">Biến Thể (Màu/Size):</span>
                <div className="flavor-options">
                  {variations.map((variation) => {
                    const variantLabel = `${variation.color} / ${variation.size}`;
                    return (
                      <span
                        key={variation.skuID}
                        className={`flavor ${selectedVariation?.skuID === variation.skuID ? "selected" : ""} ${variation.stock <= 0 ? "out-of-stock" : ""}`}
                        onClick={() => {
                          if (variation.stock > 0) {
                            setSelectedVariation(variation);
                          }
                        }}
                      >
                        {variantLabel}
                        {variation.stock <= 0 && <span className="stock-label"> (Hết)</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hiển thị trạng thái kho hàng của biến thể được chọn */}
            {selectedVariation && (
              <div className="stock-status">
                Trạng thái:
                {isOutOfStock ? (
                  <span className="text-red-500 font-bold ml-2">Hết hàng</span>
                ) : (
                  <span className="text-green-600 ml-2">Còn {selectedVariation.stock} sản phẩm</span>
                )}
              </div>
            )}

            <div className="quantity-buy">
              <div className="quantity">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isOutOfStock}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} disabled={isOutOfStock}>+</button>
              </div>

              <PrimaryButton
                className="btn-buy"
                onClick={() => { console.log(`Thêm ${quantity} x ${name} (${selectedVariation?.color} / ${selectedVariation?.size}) vào giỏ hàng`); }}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
              </PrimaryButton>
            </div>

            <div className="product-detail-shipping">
              <p>🚚 Giao hàng toàn quốc</p>
              <p>🔄 Đổi trả 7 ngày nếu lỗi nhà sản xuất</p>
            </div>
          </div>
        </div>

        <div className="product-detail-tabs">
          <ProductTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          {renderTabContent()}
        </div>

        {/* Sản phẩm liên quan (Giữ nguyên) */}
        <h2 className="related-title">Sản Phẩm Khác Bạn Có Thể Thích</h2>
        <div className="related-products">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="related-item">Sản phẩm {i}</div>
          ))}
        </div>

      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}