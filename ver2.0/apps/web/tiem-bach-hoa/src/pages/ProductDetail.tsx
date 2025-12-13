import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/product-detail.css";
import { addToCart } from '../utils/cart';
import { showSuccess, showError, showInfo } from '../utils/toast';
import { Toaster } from 'react-hot-toast';
import { auth } from '../firebase';

// ⭐️ IMPORT DB VÀ THƯ VIỆN FIREBASE ⭐️
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
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
    console.log('🔍 DEBUG: db object:', db);
    console.log('🔍 DEBUG: Searching for slug:', productSlug);
    
    const productsRef = collection(db, "products");
    console.log('🔍 DEBUG: Collection ref path:', productsRef.path);
    
    const slugToSearch = productSlug.trim();
    const q = query(productsRef, where("slug", "==", slugToSearch));
    const querySnapshot = await getDocs(q);

    console.log('✅ Query result - Found:', querySnapshot.size, 'docs');

    if (querySnapshot.empty) {
      // Thử query với collection tên "product" (số ít)
      console.warn('⚠️ Trying with collection name "product" instead...');
      const altRef = collection(db, "product");
      const altQ = query(altRef, where("slug", "==", slugToSearch));
      const altSnapshot = await getDocs(altQ);
      
      console.log('✅ Alternative query result - Found:', altSnapshot.size, 'docs');
      
      if (!altSnapshot.empty) {
        const doc = altSnapshot.docs[0];
        console.log('✅ Product data (from "product"):', doc.data());
        const productData = mapProductFromFirestore(doc.id, doc.data());
        setProductDetail(productData);
        return;
      }
      
      console.error(`❌ Không tìm thấy sản phẩm với slug: ${slugToSearch}`);
      setProductDetail(null);
    } else {
      const doc = querySnapshot.docs[0];
      console.log('✅ Product data (from "products"):', doc.data());
      const productData = mapProductFromFirestore(doc.id, doc.data());
      setProductDetail(productData);
    }
  } catch (error) {
    console.error(`❌ Lỗi khi fetch chi tiết sản phẩm ${productSlug}:`, error);
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- useEffect để fetch data ---
  useEffect(() => {
    console.log('🔵 ProductDetail useEffect triggered');
    console.log('🔵 productSlug from URL:', productSlug);
    console.log('🔵 Firebase db object:', db);
    
    if (productSlug) {
      console.log('🔵 Calling fetchProductDetail with slug:', productSlug);
      fetchProductDetail(productSlug, setProductDetail, setLoading);
    } else {
      console.log('⚠️ No productSlug found in URL params');
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

  // Khi productDetail thay đổi, load reviews và related products
  useEffect(() => {
    const loadExtras = async () => {
      if (!productDetail) return;

      try {
        // Fetch reviews for this product
        const reviewsRef = collection(db, 'reviews');
        const reviewsQ = query(reviewsRef, where('productID', '==', productDetail.id), orderBy('createdAt', 'desc'));
        const reviewsSnap = await getDocs(reviewsQ);
        const revs: any[] = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setReviews(revs);
      } catch (err) {
        console.error('Error loading reviews:', err);
        setReviews([]);
      }

      try {
        // Related products: same top-level category (categorySlugs[0])
        const cat = (productDetail.categorySlugs && productDetail.categorySlugs[0]) || null;
        if (cat) {
          const productsRef = collection(db, 'products');
          const relatedQ = query(productsRef, where('categorySlugs', 'array-contains', cat), limit(6));
          const relatedSnap = await getDocs(relatedQ);
          const related = relatedSnap.docs
            .map(d => mapProductFromFirestore(d.id, d.data()))
            .filter(p => p.id !== productDetail.id);
          setRelatedProducts(related);
        } else {
          setRelatedProducts([]);
        }
      } catch (err) {
        console.error('Error loading related products:', err);
        setRelatedProducts([]);
      }

      // Check admin doc for current user to show inventory management button
      try {
        const u = auth.currentUser;
        if (u) {
          const adminDoc = await getDocs(collection(db, 'admins'));
          // simple check: if any admin doc has id == uid
          const found = adminDoc.docs.some(d => d.id === u.uid);
          setIsAdmin(found);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    loadExtras();
  }, [productDetail]);


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

  // Rating summary computed from reviews
  const ratingCount = reviews.length;
  const avgRating = ratingCount > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / ratingCount) : 0;
  const ratingStars = avgRating > 0 ? '⭐'.repeat(Math.max(1, Math.round(avgRating))) : '⭐️⭐️⭐️⭐️⭐️';

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
            <p className="font-semibold mb-2">{ratingStars} {avgRating.toFixed(1)}/5 ({ratingCount} đánh giá)</p>

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-600">Chưa có đánh giá cho sản phẩm này.</p>
            ) : (
              <div className="reviews-list">
                {reviews.map(r => {
                  const created = r.createdAt && (r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt));
                  return (
                    <div key={r.id} className="review-item">
                      <div className="review-header">
                        <strong>{r.userID || 'Khách'}</strong>
                        <span className="review-rating">{'⭐'.repeat(r.rating || 0)}</span>
                        <span className="review-date">{created ? created.toLocaleString() : ''}</span>
                      </div>
                      <div className="review-body">{r.comment || r.text || r.message || ''}</div>
                    </div>
                  );
                })}
              </div>
            )}
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
              <span className="stars">{ratingStars}</span>
              <span className="reviews">({ratingCount} đánh giá)</span>
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
                <button onClick={() => setQuantity(Math.min(selectedVariation?.stock || 999, quantity + 1))} disabled={isOutOfStock}>+</button>
              </div>

              <PrimaryButton
                className="btn-buy"
                onClick={async () => {
                  if (!auth.currentUser) {
                    showInfo('Vui lòng đăng nhập để thêm vào giỏ hàng');
                    setTimeout(() => navigate('/login'), 1500);
                    return;
                  }
                  
                  if (!selectedVariation) {
                    showError('Vui lòng chọn biến thể sản phẩm');
                    return;
                  }

                  try {
                    await addToCart({
                      productId: productDetail?.id || '',
                      name: productDetail?.name || '',
                      price: displayPrice,
                      qty: quantity,
                      image: displayImage,
                      variation: `${selectedVariation.color} / ${selectedVariation.size}`,
                      slug: productDetail?.slug || '',
                    });
                    showSuccess(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
                  } catch (error) {
                    console.error('Add to cart error:', error);
                    showError('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
                  }
                }}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Hết hàng" : "🛒 Thêm vào giỏ hàng"}
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

        {/* Sản phẩm liên quan */}
        {relatedProducts.length > 0 && (
          <>
            <h2 className="related-title">Sản Phẩm Khác Bạn Có Thể Thích</h2>
            <div className="related-products">
              {relatedProducts.map(p => (
                <div key={p.id} className="related-item" onClick={() => navigate(`/product-detail/${p.slug}`)} style={{cursor:'pointer'}}>
                  <img src={p.image[0]} alt={p.name} />
                  <div className="related-name">{p.name}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Admin quick link: Quản lý nhập hàng (nằm trên đầu trang khi admin) */}
        {isAdmin && (
          <div style={{marginTop: 12}}>
            <button className="btn-primary" onClick={() => navigate('/admin/inventory')}>Quản lý nhập hàng</button>
          </div>
        )}

      </div>

      <Toaster />
      <FloatingButtons />
      <Footer />
    </div>
  );
}