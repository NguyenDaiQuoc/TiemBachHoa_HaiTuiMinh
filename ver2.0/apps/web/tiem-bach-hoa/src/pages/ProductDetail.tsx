import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import ImageLightbox from "../components/ImageLightbox";
import LoginWarning from "../components/LoginWarning";
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
  ingredients?: string; // Thành phần & nguồn gốc
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
    image: (docData.image as string[] | undefined) || ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect fill="%23E0E0E0" width="600" height="600"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="30" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'],
    oldPrice: docData.oldPrice || 0,
    newPrice: docData.newPrice || 0,
    discount: docData.discount || 0,
    tags: docData.tag || [],
    categorySlugs: docData.categorySlugs || [],
    stock: docData.stock || 0,
    description: docData.description || 'Chưa có mô tả chi tiết.',
    slug: docData.slug || '',
    ingredients: docData.ingredients || '',
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
  setPermissionDenied?: (v:boolean)=>void,
) => {
  setLoading(true);
  try {
    const productsRef = collection(db, "products");
    const slugToSearch = productSlug.trim();
    const q = query(productsRef, where("slug", "==", slugToSearch));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setProductDetail(null);
    } else {
      const doc = querySnapshot.docs[0];
      const productData = mapProductFromFirestore(doc.id, doc.data());
      setProductDetail(productData);
    }
  } catch (error) {
    console.error(`❌ Lỗi khi fetch chi tiết sản phẩm ${productSlug}:`, error);
    // If permission error, notify caller so UI can show helpful message
    const e: any = error;
    const msg = e && (e.code === 'permission-denied' || (e.message && typeof e.message === 'string' && e.message.toLowerCase().includes('permission')));
    if (msg && setPermissionDenied) setPermissionDenied(true);
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginWarning, setShowLoginWarning] = useState(false);

  // State để lưu trữ dữ liệu sản phẩm
  const [productDetail, setProductDetail] = useState<ProductData | null>(null);

  // ⭐ State: Quản lý biến thể đang được chọn - Dùng skuID để nhận dạng ⭐
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Listen to auth state changes like Cart.tsx
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // --- useEffect để fetch data ---
  useEffect(() => {
    // Scroll to top smoothly when component mounts or slug changes
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    if (productSlug) {
      setPermissionDenied(false);
      fetchProductDetail(productSlug, setProductDetail, setLoading, setPermissionDenied);
    } else {
      setLoading(false);
      setProductDetail(null);
    }
  }, [productSlug]);

  // ⭐ useEffect: Cài đặt biến thể mặc định (Biến thể 1) sau khi fetch thành công
  // Always reset selected variation when productDetail changes so images/prices update correctly
  useEffect(() => {
    if (productDetail) {
      if (productDetail.variations && productDetail.variations.length > 0) {
        const first = productDetail.variations[0];
        setSelectedVariation(first);
        setSelectedColor(first.color || null);
        setSelectedSize(first.size || null);
        setSelectedCondition(first.condition || null);
      } else {
        setSelectedVariation(null);
      }
      setQuantity(1); // Reset số lượng on each product load
    } else {
      setSelectedVariation(null);
      setQuantity(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productDetail]);

  // Derived attribute option sets with current filters
  const attributeOptions = useMemo(() => {
    if (!productDetail) return { colors: [], sizes: [], conditions: [] };
    const vars = productDetail.variations || [];

    const colors = new Set<string>();
    const sizes = new Set<string>();
    const conditions = new Set<string>();

    vars.forEach(v => {
      colors.add(v.color || '');
      sizes.add(v.size || '');
      conditions.add(v.condition || '');
    });

    return {
      colors: Array.from(colors).filter(c=>c !== '').sort(),
      sizes: Array.from(sizes).filter(s=>s !== '').sort(),
      conditions: Array.from(conditions).filter(c=>c !== '').sort(),
    };
  }, [productDetail]);

  // When attribute selections change, pick a matching variation (if any)
  useEffect(() => {
    if (!productDetail) return;
    const vars = productDetail.variations || [];
    const matched = vars.filter(v => {
      if (selectedColor && v.color !== selectedColor) return false;
      if (selectedSize && v.size !== selectedSize) return false;
      if (selectedCondition && v.condition !== selectedCondition) return false;
      return true;
    });
    if (matched.length > 0) {
      setSelectedVariation(matched[0]);
    }
  }, [selectedColor, selectedSize, selectedCondition, productDetail]);

  // Khi productDetail thay đổi, load reviews và related products
  useEffect(() => {
    const loadExtras = async () => {
      if (!productDetail) return;

      try {
        // Fetch reviews for this product
        const reviewsRef = collection(db, 'reviews');
        // Attempt server-side ordered query first (fast when index exists)
        try {
          const reviewsQ = query(reviewsRef, where('productID', '==', productDetail.id), orderBy('createdAt', 'desc'));
          const reviewsSnap = await getDocs(reviewsQ);
          const revs: any[] = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setReviews(revs);
        } catch (rqErr: any) {
          // If Firestore complains about missing index, fall back to a simple query and sort client-side
          // Fallback: fetch reviews for product without orderBy (less efficient) then sort locally
          try {
            const fallbackQ = query(reviewsRef, where('productID', '==', productDetail.id));
            const fallbackSnap = await getDocs(fallbackQ);
            const revs = fallbackSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .sort((a: any, b: any) => {
                const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return tb - ta;
              });
            setReviews(revs);
          } catch (fallbackErr: any) {
            console.error('Fallback reviews fetch failed:', fallbackErr);
            // If it's a permission error, log it but don't break the app
            if (fallbackErr?.code === 'permission-denied') {
              console.warn('Reviews collection requires Firestore rules update. Please deploy updated rules.');
            }
            setReviews([]);
          }
        }
      } catch (err: any) {
        console.error('Error loading reviews:', err);
        if (err?.code === 'permission-denied') {
          console.warn('Cannot access reviews collection. Please check Firestore security rules.');
        }
        setReviews([]);
      }

      try {
        // Related products: query each category slug and accumulate unique results.
        // This improves chance of finding enough related items and ensures same-category matches.
        const cats = productDetail.categorySlugs || [];
        const productsRef = collection(db, 'products');
        const accumulator: Record<string, ProductData> = {};

        for (let i = 0; i < Math.min(cats.length, 4); i++) {
          const cat = cats[i];
          try {
            const q = query(productsRef, where('categorySlugs', 'array-contains', cat), limit(8));
            const snap = await getDocs(q);
            snap.docs.forEach(d => {
              if (d.id === productDetail.id) return;
              const p = mapProductFromFirestore(d.id, d.data());
              // ensure shares at least one slug
              if ((p.categorySlugs || []).some(s => cats.includes(s))) {
                accumulator[p.id] = p;
              }
            });
          } catch (qErr) {
            console.warn('Related products query failed for category', cat, qErr);
            // continue with other categories
          }
        }

        // Convert accumulator to array, shuffle and take up to 6 items
        const allRelated = Object.values(accumulator);
        // simple shuffle
        for (let i = allRelated.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allRelated[i], allRelated[j]] = [allRelated[j], allRelated[i]];
        }

        setRelatedProducts(allRelated.slice(0, 6));
      } catch (err) {
        console.error('Error loading related products:', err);
        setRelatedProducts([]);
      }

      // Check admin doc for current user to show inventory management button
      try {
        // Prefer checking admin via custom claims in the ID token instead of reading the 'admins' collection
        // which may be restricted by security rules. This avoids permission errors in the client.
        const u = auth.currentUser;
        if (u) {
          const idTokenResult = await u.getIdTokenResult(true);
          const claims: any = idTokenResult.claims || {};
          const adminClaim = (claims.admin === true) || (claims.isAdmin === true) || (claims.role === 'admin');
          setIsAdmin(!!adminClaim);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking admin status (token claims):', err);
        setIsAdmin(false);
      }
    };

    loadExtras();
  }, [productDetail]);

  // Related products carousel refs / state
  const relatedContainerRef = useRef<HTMLDivElement | null>(null);
  const [relatedIndex, setRelatedIndex] = useState(0);

  const scrollRelatedTo = (index: number) => {
    const container = relatedContainerRef.current;
    if (!container) return;
    const children = container.children;
    if (!children || children.length === 0) return;
    const child = children[Math.max(0, Math.min(index, children.length - 1))] as HTMLElement;
    if (child) {
      // Use a smooth animated scroll (requestAnimationFrame) to reduce jerk
      const target = child.offsetLeft - (container.offsetWidth / 2) + (child.offsetWidth / 2);
      const start = container.scrollLeft;
      const distance = target - start;
      const duration = 420; // ms
      let startTime: number | null = null;

      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (ts: number) => {
        if (startTime === null) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeInOutCubic(progress);
        container.scrollLeft = start + distance * eased;
        if (progress < 1) window.requestAnimationFrame(step);
      };

      window.requestAnimationFrame(step);
    }
  };

  const nextRelated = () => {
    if (relatedProducts.length === 0) return;
    const next = (relatedIndex + 1) % relatedProducts.length; // Loop back to start
    setRelatedIndex(next);
    scrollRelatedTo(next);
  };

  const prevRelated = () => {
    if (relatedProducts.length === 0) return;
    const prev = (relatedIndex - 1 + relatedProducts.length) % relatedProducts.length; // Loop to end
    setRelatedIndex(prev);
    scrollRelatedTo(prev);
  };

  // Auto-scroll removed to prevent scroll jerk issues
  // Users can manually navigate using prev/next buttons


  // ⭐ Logic tính toán giá, tồn kho dựa trên Biến thể được chọn ⭐
  const displayPrice = selectedVariation ? selectedVariation.newPrice : (productDetail?.newPrice || 0);
  const displayOldPrice = selectedVariation ? selectedVariation.oldPrice : (productDetail?.oldPrice || 0);
  const isSale = displayOldPrice > displayPrice;
  const isOutOfStock = selectedVariation ? selectedVariation.stock <= 0 : true;
  const displayImage = selectedVariation ? selectedVariation.image : (productDetail?.image[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect fill="%23E0E0E0" width="600" height="600"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="30" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E');

  // ⭐ State cho hình ảnh chính đang được xem ⭐
  const [currentMainImage, setCurrentMainImage] = useState<string>(displayImage);
  
  // ⭐ State cho zoom effect ⭐
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ⭐ Thu thập TẤT CẢ hình ảnh từ variations + hình ảnh chính ⭐
  const allImages = useMemo(() => {
    if (!productDetail) return [];
    const images: string[] = [];
    
    // Thêm hình ảnh chính của sản phẩm
    if (productDetail.image && productDetail.image.length > 0) {
      images.push(...productDetail.image);
    }
    
    // Thêm hình ảnh từ tất cả biến thể
    if (productDetail.variations && productDetail.variations.length > 0) {
      productDetail.variations.forEach(variation => {
        if (variation.image && !images.includes(variation.image)) {
          images.push(variation.image);
        }
      });
    }
    
    // Loại bỏ duplicate và placeholder
    return [...new Set(images)].filter(img => img && !img.includes('placeholder'));
  }, [productDetail]);

  // ⭐ Cập nhật hình ảnh chính khi chọn variation ⭐
  useEffect(() => {
    setCurrentMainImage(displayImage);
  }, [displayImage]);

  // ⭐ Handler cho zoom effect ⭐
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleImageClick = () => {
    const currentIndex = allImages.indexOf(currentMainImage);
    setLightboxIndex(currentIndex >= 0 ? currentIndex : 0);
    setShowLightbox(true);
  };


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
    if (permissionDenied) {
      return (
        <div className="product-detail-wrapper">
          <Header />
          <div className="product-detail-content" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h1 className="product-detail-title">Quyền truy cập bị từ chối</h1>
            <p>Hiện tại bạn không có quyền xem dữ liệu sản phẩm. Vui lòng đăng nhập hoặc liên hệ quản trị viên.</p>
            <div style={{ marginTop: 16 }}>
              <PrimaryButton onClick={() => navigate('/login')}>Đăng nhập</PrimaryButton>
              <PrimaryButton className="ml-3" onClick={() => navigate('/')}>Về trang chủ</PrimaryButton>
            </div>
          </div>
          <Footer />
        </div>
      );
    }

    return (
      <div className="product-detail-wrapper">
        <Header />
        <div className="product-detail-content" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h1 className="product-detail-title">🚨 Không tìm thấy sản phẩm 🚨</h1>
          <p>Mã sản phẩm **"{productNameFromSlug}"** không được tìm thấy trong hệ thống.</p>
          <PrimaryButton className="mt-5" onClick={() => navigate('/products')}>Quay lại trang sản phẩm</PrimaryButton>
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
            {productDetail.ingredients && productDetail.ingredients.trim() ? (
              <div>
                <p className="font-semibold mb-2">Thành Phần & Nguồn Gốc:</p>
                <div className="text-sm whitespace-pre-line">{productDetail.ingredients}</div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Chưa có thông tin về thành phần & nguồn gốc.</p>
            )}
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
            <div className="whitespace-pre-line">{description}</div>
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
          <span onClick={() => navigate(`/products?category=${categorySlugs[0] || ''}`)} style={{ cursor: 'pointer', textDecoration: 'underline' }}> Sản phẩm</span> /
          {name}
        </div>

        <div className="product-detail-main">
          <div className="product-detail-images">
            <div 
              className="main-image"
              onMouseEnter={() => setShowZoom(true)}
              onMouseLeave={() => setShowZoom(false)}
              onMouseMove={handleMouseMove}
              onClick={handleImageClick}
            >
              {/* ⭐ HIỂN THỊ HÌNH ẢNH CHÍNH (có thể thay đổi khi click vào thumbs) ⭐ */}
              <img src={currentMainImage} alt={name} />
              
              {/* ⭐ ZOOM OVERLAY (hiển thị khi hover) ⭐ */}
              {showZoom && (
                <div className="zoom-overlay">
                  <div 
                    className="zoom-lens"
                    style={{
                      backgroundImage: `url(${currentMainImage})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: '150%'
                    }}
                  />
                  <div className="zoom-hint">🔍 Click để xem chi tiết</div>
                </div>
              )}
            </div>
            <div className="thumbs">
              {/* ⭐ HIỂN THỊ TẤT CẢ HÌNH ẢNH TỪ CÁC BIẾN THỂ ⭐ */}
              {allImages.map((img, index) => (
                <div 
                  key={index} 
                  className={`thumb ${currentMainImage === img ? 'thumb-active' : ''}`}
                  style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  onClick={() => setCurrentMainImage(img)}
                  title={`Hình ${index + 1}`}
                ></div>
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

            {/* <p className="product-detail-desc">
              {description}
            </p> */}

            {/* ⭐ HIỂN THỊ CÁC THUỘC TÍNH BIẾN THỂ (Color / Size / Condition) ⭐ */}
            {variations.length > 0 && (
              <div className="product-detail-attributes">
                <div style={{marginBottom:8}}><strong>Chọn thuộc tính:</strong></div>

                {/* Color */}
                {attributeOptions.colors.length > 0 && (
                  <div style={{marginBottom:8}}>
                    <div className="label">Màu:</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {attributeOptions.colors.map(col => {
                        // determine availability given other selections
                        const available = (productDetail.variations || []).some(v => (selectedSize ? v.size === selectedSize : true) && (selectedCondition ? v.condition === selectedCondition : true) && v.color === col && v.stock > 0);
                        return (
                          <button
                            key={col}
                            className={`attr-btn ${selectedColor === col ? 'selected' : ''} ${!available ? 'disabled' : ''}`}
                            disabled={!available}
                            title={!available ? 'Không có biến thể tương ứng' : col}
                            onClick={() => setSelectedColor(prev => prev === col ? null : col)}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size */}
                {attributeOptions.sizes.length > 0 && (
                  <div style={{marginBottom:8}}>
                    <div className="label">Kích thước:</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {attributeOptions.sizes.map(sz => {
                        const available = (productDetail.variations || []).some(v => (selectedColor ? v.color === selectedColor : true) && (selectedCondition ? v.condition === selectedCondition : true) && v.size === sz && v.stock > 0);
                        return (
                          <button
                            key={sz}
                            className={`attr-btn ${selectedSize === sz ? 'selected' : ''} ${!available ? 'disabled' : ''}`}
                            disabled={!available}
                            title={!available ? 'Không có biến thể tương ứng' : sz}
                            onClick={() => setSelectedSize(prev => prev === sz ? null : sz)}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Condition */}
                {attributeOptions.conditions.length > 0 && (
                  <div style={{marginBottom:8}}>
                    <div className="label">Tình trạng:</div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {attributeOptions.conditions.map(cond => {
                        const available = (productDetail.variations || []).some(v => (selectedColor ? v.color === selectedColor : true) && (selectedSize ? v.size === selectedSize : true) && v.condition === cond && v.stock > 0);
                        return (
                          <button
                            key={cond}
                            className={`attr-btn ${selectedCondition === cond ? 'selected' : ''} ${!available ? 'disabled' : ''}`}
                            disabled={!available}
                            title={!available ? 'Không có biến thể tương ứng' : cond}
                            onClick={() => setSelectedCondition(prev => prev === cond ? null : cond)}
                          >
                            {cond}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  // Use currentUser state instead of auth.currentUser directly
                  if (!currentUser) {
                    setShowLoginWarning(true);
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
                <div className="related-carousel" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button aria-label="previous" className="carousel-btn" onClick={prevRelated} style={{padding:8}}>‹</button>
                  <div
                    className="related-products"
                    ref={relatedContainerRef}
                    style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '8px 0' }}
                  >
                    {relatedProducts.map((p, idx) => (
                      <div
                        key={p.id}
                        className="related-item"
                        onClick={() => navigate(`/product-detail/${p.slug}`)}
                        style={{ cursor: 'pointer', minWidth: 180, scrollSnapAlign: 'center' }}
                        data-rel-index={idx}
                      >
                        <img src={p.image[0]} alt={p.name} />
                        <div className="related-name">{p.name}</div>
                      </div>
                    ))}
                  </div>
                  <button aria-label="next" className="carousel-btn" onClick={nextRelated} style={{padding:8}}>›</button>
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
      
      {/* ⭐ LIGHTBOX để xem ảnh phóng to ⭐ */}
      {showLightbox && (
        <ImageLightbox 
          images={allImages} 
          startIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
      
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
      
      <Footer />
    </div>
  );
}