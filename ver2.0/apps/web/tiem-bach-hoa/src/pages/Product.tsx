import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
// Đảm bảo đường dẫn CSS của bạn đúng
import "../../css/product.css";
import { addToCart } from '../utils/cart';
import { showSuccess, showError, showInfo } from '../utils/toast';
import { auth } from '../firebase';
import LoginWarning from '../components/LoginWarning';
// Đảm bảo các component này có sẵn (Giả định bạn đã tạo)
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";

// ⭐️ IMPORT THƯ VIỆN VÀ DB TỪ FILE CONFIG ⭐️ (Giả định bạn có file firebase.ts/jsx)
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { fetchActiveDeals, applyDealsToPrice } from '../utils/deals';


// ===========================================
// 1. TYPE VÀ INTERFACE
// ===========================================

// Hàm Hỗ trợ: Định dạng Giá (Format Price)
const formatPrice = (price: number): string => {
  if (price === undefined || price === null) return "";
  return price.toLocaleString('vi-VN') + 'đ';
};

// Hàm Hỗ trợ: Chuyển chuỗi thành Slug (ví dụ: "Nến Thơm Organic" -> "nen-thom-organic")
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/đ/g, 'd') // Xử lý ký tự 'đ'
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
    .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
    .replace(/[^\w\-]+/g, '') // Loại bỏ tất cả ký tự không phải chữ, số hoặc gạch ngang
    .replace(/\-\-+/g, '-'); // Thay thế nhiều dấu gạch ngang bằng một
};

// Interface Dữ liệu Sản Phẩm (Map từ Firestore)
interface ProductData {
  id: string;
  name: string;
  image: string;
  oldPrice?: number;
  newPrice: number;
  discount?: number; // Phần trăm giảm giá
  tags: string[];
  categorySlugs: string[];
  createdAt: number; // Timestamp.toMillis()
  stock: number;
  description: string;
  // ⭐ CẬP NHẬT: Thêm trường slug ⭐
  slug: string;
  averageRating?: number;
  variations?: Array<{
    color: string;
    size: string;
    image: string;
    newPrice: number;
    oldPrice: number;
    stock: number;
  }>;
}

// Interface Dữ liệu Danh Mục (Giữ nguyên)
interface CategoryFilterItem {
  name: string;
  slug: string;
  product_count: number;
}

// Interface Lọc Giá (Giữ nguyên)
interface PriceFilterItem {
  name: string;
  min: number;
  max: number;
  count: number;
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'best-seller';


// ===========================================
// 2. HÀM HỖ TRỢ CHUYỂN ĐỔI DỮ LIỆU VÀ FIREBASE
// ===========================================

const mapCategoryFromFirestore = (doc: any): CategoryFilterItem => ({
  name: doc.name || 'Không tên',
  slug: doc.slug || 'khong-slug',
  product_count: doc.product_count || 0,
});

const mapProductFromFirestore = (docId: string, docData: any): ProductData => {
  const productName = docData.name || 'Sản phẩm không tên';
  const productSlug = docData.slug || slugify(productName); // ⭐ Lấy slug từ data hoặc tạo mới ⭐

  return {
    id: docId,
    name: productName,
    image: docData.image || '',
    oldPrice: docData.oldPrice || undefined,
    newPrice: docData.newPrice || 0,
    discount: docData.discount || undefined,
    tags: docData.tag || [],
    // Normalize categorySlugs: support array or comma-separated string stored by admin
    categorySlugs: ((): string[] => {
      const raw = docData.categorySlugs;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw.map((s: any) => String(s).trim()).filter(Boolean);
      if (typeof raw === 'string') return raw.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      return [];
    })(),
    stock: docData.stock || 0,
    description: docData.description || '',
    createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toMillis() : Date.now(),
    slug: productSlug, // ⭐ Gán slug vào ProductData ⭐
    averageRating: typeof docData.averageRating === 'number' ? docData.averageRating : 0,
  };
};

// Hàm sắp xếp dữ liệu Client-side (Giữ nguyên)
const sortProducts = (data: ProductData[], option: SortOption): ProductData[] => {
  let sorted = [...data];
  switch (option) {
    case 'price-asc':
      sorted.sort((a, b) => a.newPrice - b.newPrice);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.newPrice - a.newPrice);
      break;
    case 'newest':
      sorted.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case 'best-seller':
      // Giả định sắp xếp theo stock thấp nhất
      sorted.sort((a, b) => a.stock - b.stock);
      break;
  }
  return sorted;
};

// Hàm Hỗ trợ: Định dạng Slug thành Title (Giữ nguyên)
const formatSlugToTitle = (slug: string | undefined): string => {
  if (!slug) return "Tất cả Sản Phẩm";
  const title = slug.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return title;
};

// Hàm fetchCategories và fetchProducts (Giữ nguyên logic Firebase)

const fetchCategories = async (setCategoryList: (list: CategoryFilterItem[]) => void) => {
  try {
    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef);

    const querySnapshot = await getDocs(q);
    const fetchedCategories: CategoryFilterItem[] = querySnapshot.docs.map(doc =>
      mapCategoryFromFirestore(doc.data())
    );

    setCategoryList(fetchedCategories);
  } catch (error) {
    console.error("Lỗi khi fetch categories:", error);
    setCategoryList([]);
  }
};

const fetchProducts = async (
  slug: string | null,
  sort: SortOption,
  ratingFilter: number | null,
  setProducts: (data: ProductData[]) => void,
  setTotalProducts: (count: number) => void,
  setAllProductsForCounting: (data: ProductData[]) => void
) => {
  try {
    const productsRef = collection(db, "products");

    // 1. Dựng truy vấn cơ sở
    // Nếu slug là null => lấy toàn bộ sản phẩm, ngược lại lọc theo slug
    let productQuery = slug ? query(productsRef, where("categorySlugs", "array-contains", slug)) : query(productsRef);

    // Apply rating filter if provided (>= selected rating)
    if (ratingFilter !== null && ratingFilter !== undefined) {
      productQuery = query(productQuery, where('averageRating', '>=', ratingFilter));
    }

    // 2. Chỉ orderBy theo createdAt, các loại sắp xếp khác thực hiện Client-side
    if (sort === 'newest' || sort === 'best-seller') {
      productQuery = query(productQuery, orderBy("createdAt", "desc"));
    }

    const querySnapshot = await getDocs(productQuery);
    let fetchedData: ProductData[] = querySnapshot.docs.map(doc =>
      mapProductFromFirestore(doc.id, doc.data())
    );

    // 3. Sắp xếp Client-side cho các tùy chọn không được order trên Firebase
    const sortedData = sortProducts(fetchedData, sort);

    setProducts(sortedData);
    setTotalProducts(fetchedData.length);

    // Lưu trữ tập dữ liệu đã lọc theo danh mục này để đếm cho filter giá
    setAllProductsForCounting(sortedData);

  } catch (error) {
    console.error(`Lỗi khi fetch products cho slug ${slug}:`, error);
    setProducts([]);
    setTotalProducts(0);
    setAllProductsForCounting([]);
  }
};

// Fetch counts per category slug by scanning all products
const fetchProductCounts = async (): Promise<Record<string, number>> => {
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef);
    const snapshot = await getDocs(q);
    const counts: Record<string, number> = {};
    snapshot.docs.forEach(d => {
      const data: any = d.data();
      const slugs: string[] = data.categorySlugs || [];
      slugs.forEach(s => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return counts;
  } catch (err) {
    console.error('fetchProductCounts error', err);
    return {};
  }
};


// ===========================================
// 3. COMPONENT ProductCard (ĐÃ CẬP NHẬT ĐIỀU HƯỚNG)
// ===========================================
function ProductCard({
  id,
  image,
  name,
  oldPrice,
  newPrice,
  discount,
  tags,
  isWished,
  handleToggleWishlist,
  handleAddToCart,
  handleBuyNow,
  navigate,
  slug // ⭐ Nhận slug ⭐
}: ProductData & {
  isWished: boolean;
  handleToggleWishlist: (productId: string) => void;
  handleAddToCart: (product: ProductData, event?: React.MouseEvent) => void;
  handleBuyNow: (product: ProductData) => void;
  navigate: (path: string) => void;
}) {
  const isSale = oldPrice !== undefined && oldPrice > newPrice && discount && discount > 0;
  const displayTag = isSale ? `-${discount}%` : (tags.length > 0 ? tags[0] : null);
  const WishIcon = isWished ? '❤️' : '🤍';

  const [appliedPrice, setAppliedPrice] = useState<number | null>(null);
  const [appliedDealName, setAppliedDealName] = useState<string | null>(null);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try {
        const deals = await fetchActiveDeals();
        const { price, applied } = applyDealsToPrice(newPrice, String(id), deals);
        if (!mounted) return;
        setAppliedPrice(price);
        setAppliedDealName(applied ? applied.name : null);
      } catch(e){ console.error('apply deals product card', e); }
    })();
    return ()=>{ mounted=false };
  }, [id, newPrice]);

  const baseProductData: ProductData = {
    id,
    name,
    image,
    newPrice,
    oldPrice,
    discount,
    tags,
    categorySlugs: [],
    createdAt: 0,
    stock: 0,
    description: "",
    slug // ⭐ Thêm slug vào baseProductData ⭐
  };

  // ⭐ LOGIC CẬP NHẬT: Click vào card => Điều hướng đến /product-detail/slug ⭐
  const handleCardClick = () => {
    navigate(`/product-detail/${slug}`);
  };


  return (
    <div className="product-card" onClick={handleCardClick}>
      <div className="product-card-image-wrapper">
        <img src={image} alt={name} className="product-card-image" />
        {displayTag && <span className="product-card-tag">{displayTag}</span>}

        <button
          className={`wishlist-btn ${isWished ? 'wished' : ''}`}
          // Ngăn chặn sự kiện click lan truyền ra card cha
          onClick={(e) => { e.stopPropagation(); handleToggleWishlist(id); }}
          title={isWished ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
        >
          {WishIcon}
        </button>
      </div>

      <span className="product-card-name">{name}</span>
      <div className="product-card-price-wrapper">
        {appliedPrice !== null && appliedPrice !== newPrice ? (
          <>
            <span className="product-card-price">{formatPrice(appliedPrice)}</span>
            <span className="product-card-oldprice">{formatPrice(newPrice)}</span>
            {appliedDealName ? <span className="product-card-dealbadge">{appliedDealName}</span> : null}
          </>
        ) : (
          <>
            <span className="product-card-price">{formatPrice(newPrice)}</span>
            {isSale && <span className="product-card-oldprice">{formatPrice(oldPrice!)}</span>}
          </>
        )}
      </div>

      {/* KHỐI CHỨA 2 NÚT HÀNH ĐỘNG MỚI */}
      <div className="product-card-actions">
        {/* Nút Thêm vào Giỏ (Chỉ Icon) */}
        <button
          className="add-to-cart-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart({ ...baseProductData, newPrice: appliedPrice !== null ? appliedPrice : baseProductData.newPrice }, e);
          }}
          title="Thêm vào giỏ hàng"
        >
          🛒
        </button>
        {/* Nút Mua Ngay */}
        <button
          className="buy-now-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleBuyNow({ ...baseProductData, newPrice: appliedPrice !== null ? appliedPrice : baseProductData.newPrice });
          }}
        >
          Mua Ngay
        </button>
      </div>
    </div>
  );
}

// ===========================================
// 4. COMPONENT FilterSidebar (Giữ nguyên)
// ===========================================
function FilterSidebar({ categoryList, currentCategorySlug, priceFilters, handleFilterChange, ratingFilter, handleRatingChange, ratingCounts, selectedPriceFilter, handlePriceChange }: {
  categoryList: CategoryFilterItem[];
  currentCategorySlug: string | undefined;
  priceFilters: PriceFilterItem[];
  handleFilterChange: (slug: string) => void;
  ratingFilter: number | null;
  handleRatingChange: (r: number | null) => void;
  ratingCounts: { [key: number]: number };
  selectedPriceFilter?: PriceFilterItem | null;
  handlePriceChange?: (p: PriceFilterItem | null) => void;
}) {
  return (
    <div className="filter-sidebar">
      <h3 className="filter-title">Bộ Lọc</h3>

      {/* 1. DANH MỤC SẢN PHẨM */}
      <div className="filter-group">
        <p className="filter-group-title">Danh Mục Sản Phẩm</p>
        <ul className="filter-group-list">
          {categoryList.map((cat) => (
            <li key={cat.slug} className="filter-item">
              <input
                type="checkbox"
                id={cat.slug}
                className="filter-checkbox"
                checked={currentCategorySlug === cat.slug}
                onChange={() => handleFilterChange(cat.slug)}
              />
              <label htmlFor={cat.slug} className="filter-label">{cat.name} ({cat.product_count})</label>
            </li>
          ))}
        </ul>
        <hr className="filter-divider" />
      </div>

      {/* 2. MỨC GIÁ */}
      <div className="filter-group">
        <p className="filter-group-title">Mức Giá</p>
        <ul className="filter-group-list">
          {priceFilters.map((filter) => (
            <li key={filter.name} className="filter-item">
              <input
                type="checkbox"
                id={filter.name}
                className="filter-checkbox"
                checked={Boolean((typeof (selectedPriceFilter as any) !== 'undefined' && selectedPriceFilter && selectedPriceFilter.name === filter.name))}
                onChange={() => {
                  if (!handlePriceChange) return;
                  const currentlySelected = selectedPriceFilter && selectedPriceFilter.name === filter.name;
                  handlePriceChange(currentlySelected ? null : filter);
                }}
              />
              <label htmlFor={filter.name} className="filter-label">{filter.name} ({filter.count})</label>
            </li>
          ))}
        </ul>
        <hr className="filter-divider" />
      </div>

      {/* 3. ĐÁNH GIÁ (Rating Filter) */}
      <div className="filter-group">
        <p className="filter-group-title">Đánh Giá</p>
        <ul className="filter-group-list">
          <li className="filter-item">
            <input type="radio" name="rating-filter" id="rating-all" checked={ratingFilter === null} onChange={() => handleRatingChange(null)} />
            <label htmlFor="rating-all" className="filter-label">Tất cả</label>
          </li>
          <li className="filter-item">
            <input type="radio" name="rating-filter" id="rating-5" checked={ratingFilter === 5} onChange={() => handleRatingChange(5)} />
            <label htmlFor="rating-5" className="filter-label">⭐️ 5 ({ratingCounts[5] || 0} sản phẩm)</label>
          </li>
          <li className="filter-item">
            <input type="radio" name="rating-filter" id="rating-4" checked={ratingFilter === 4} onChange={() => handleRatingChange(4)} />
            <label htmlFor="rating-4" className="filter-label">⭐️ 4 trở lên ({ratingCounts[4] || 0} sản phẩm)</label>
          </li>
          <li className="filter-item">
            <input type="radio" name="rating-filter" id="rating-3" checked={ratingFilter === 3} onChange={() => handleRatingChange(3)} />
            <label htmlFor="rating-3" className="filter-label">⭐️ 3 trở lên ({ratingCounts[3] || 0} sản phẩm)</label>
          </li>
          <li className="filter-item">
            <input type="radio" name="rating-filter" id="rating-2" checked={ratingFilter === 2} onChange={() => handleRatingChange(2)} />
            <label htmlFor="rating-2" className="filter-label">⭐️ 2 trở lên ({ratingCounts[2] || 0} sản phẩm)</label>
          </li>
        </ul>
      </div>

      <button className="filter-apply-btn">Áp Dụng</button>
    </div>
  );
}

// ===========================================
// 5. COMPONENT CHÍNH ProductListingPage (Giữ nguyên logic)
// ===========================================
export default function ProductListingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Read category filter from query param: /products?category=slug
  const categoryParam = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get('category') || null;
    } catch (e) {
      return null;
    }
  }, [location.search]);

  // State Data
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryFilterItem[]>([]);
  const [allProductsForCounting, setAllProductsForCounting] = useState<ProductData[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [favoritesMap, setFavoritesMap] = useState<Record<string, string>>({}); // productId -> favoriteDocId
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<PriceFilterItem | null>(null);

  // State UI & Pagination
  const [currentCategoryName, setCurrentCategoryName] = useState("Hàng Mới Về");
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  // Listen to auth state changes like Cart.tsx
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) fetchUserFavorites(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserFavorites = async (uid: string) => {
    try {
      const q = query(collection(db, 'favorites'), where('userId', '==', uid));
      const snap = await getDocs(q);
      const productIds = new Set<string>();
      const map: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data: any = d.data();
        if (data.productId) {
          productIds.add(data.productId);
          map[data.productId] = d.id;
        }
      });
      setWishlist(productIds);
      setFavoritesMap(map);
    } catch (err) {
      console.error('fetchUserFavorites', err);
    }
  };

  // ----------------------------------------------------
  // I. LOGIC ĐẾM SẢN PHẨM THEO MỨC GIÁ (useMemo)
  // ----------------------------------------------------

  const priceFilters = useMemo(() => {
    const ranges: Omit<PriceFilterItem, 'count'>[] = [
      { name: "Dưới 100K", min: 0, max: 100000 },
      { name: "100K - 300K", min: 100000, max: 300000 },
      { name: "Trên 300K", min: 300000, max: Infinity },
    ];

    return ranges.map(range => {
      let count = 0;
      allProductsForCounting.forEach(p => {
        if (p.newPrice >= range.min && p.newPrice <= range.max) {
          count++;
        }
      });
      return { ...range, count };
    });
  }, [allProductsForCounting]);

  // Rating counts (for the current category/allProductsForCounting)
  const ratingCounts = useMemo(() => {
    const thresholds = [5,4,3,2];
    const counts: { [key:number]: number } = {};
    thresholds.forEach(t => counts[t] = 0);
    allProductsForCounting.forEach(p => {
      const r = typeof p.averageRating === 'number' ? p.averageRating : 0;
      thresholds.forEach(t => {
        if (r >= t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [allProductsForCounting]);

  // ----------------------------------------------------
  // II. USE EFFECTS (GỌI HÀM FIREBASE)
  // ----------------------------------------------------

  // Fetch Category List chỉ 1 lần và cập nhật counts
  useEffect(() => {
    (async () => {
      await fetchCategories(setCategoryList);
      const counts = await fetchProductCounts();
      // Merge counts vào categoryList hiện có (nếu có)
      setCategoryList(prev => prev.map(c => ({ ...c, product_count: counts[c.slug] || 0 })));
    })();
  }, []);

  // Fetch Products khi Slug/Sort thay đổi
  useEffect(() => {
    const currentSlug = categoryParam || null; // null => all products

    // Cập nhật TÊN DANH MỤC cho UI
    if (!currentSlug) {
      setCurrentCategoryName("Tất cả Sản Phẩm");
    } else {
      const foundCategory = categoryList.find(c => c.slug === currentSlug);
      const name = foundCategory?.name || formatSlugToTitle(currentSlug) || "Tất cả Sản Phẩm";
      setCurrentCategoryName(name);
    }

    // Gọi Fetch Products
    setLoading(true);
    setCurrentPage(1);
    fetchProducts(
      currentSlug,
      sortOption,
      ratingFilter,
      setProducts,
      setTotalProducts,
      setAllProductsForCounting
    ).finally(() => setLoading(false));

  }, [categoryParam, sortOption, categoryList, ratingFilter]);
  

  // ----------------------------------------------------
  // III. LOGIC THAO TÁC (ACTIONS)
  // ----------------------------------------------------

  const handleFilterChange = (slug: string) => {
    // Toggle category filter: nếu đang chọn cùng slug thì bỏ filter, ngược lại chọn slug mới
    try {
      const current = categoryParam || null;
      if (current === slug) {
        // remove category param -> show all products
        navigate('/products');
      } else {
        navigate(`/products?category=${slug}`);
      }
    } catch (err) {
      // fallback
      navigate(`/products?category=${slug}`);
    }
    setCurrentPage(1);
  };

  const handleRatingChange = (r: number | null) => {
    setRatingFilter(r);
    setCurrentPage(1);
  };

  const handlePriceChange = (p: PriceFilterItem | null) => {
    setSelectedPriceFilter(p);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOption = e.target.value as SortOption;
    setSortOption(newSortOption);
    setCurrentPage(1); // RESET VỀ TRANG 1
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!currentUser) {
      setShowLoginWarning(true);
      return;
    }

    // Find product data for metadata
    const product = products.find(p => p.id === productId);

    // If already wished -> remove
    if (wishlist.has(productId)) {
      const favId = favoritesMap[productId];
      try {
        if (favId) await deleteDoc(doc(db, 'favorites', favId));
        const newSet = new Set(wishlist);
        newSet.delete(productId);
        setWishlist(newSet);
        const newMap = { ...favoritesMap };
        delete newMap[productId];
        setFavoritesMap(newMap);
        showSuccess('Đã xóa khỏi yêu thích');
      } catch (err) {
        console.error('remove favorite error', err);
        showError('Không thể xóa yêu thích');
      }
      return;
    }

    // Add favorite
    try {
      const payload = {
        userId: currentUser.uid,
        productId,
        name: product?.name || '',
        price: product?.newPrice ?? product?.oldPrice ?? 0,
        image: product?.image || '',
        slug: product?.slug || '',
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'favorites'), payload as any);
      const newSet = new Set(wishlist);
      newSet.add(productId);
      setWishlist(newSet);
      setFavoritesMap({ ...favoritesMap, [productId]: ref.id });
      showSuccess('Đã thêm vào yêu thích');
    } catch (err) {
      console.error('add favorite error', err);
      showError('Không thể thêm yêu thích');
    }
  };

  const handleAddToCart = async (product: ProductData, event?: React.MouseEvent) => {
    // Use currentUser state instead of auth.currentUser directly
    if (!currentUser) {
      setShowLoginWarning(true);
      return;
    }

    // Animation effect
    if (event) {
      const target = event.currentTarget as HTMLElement;
      const img = target.closest('.product-card')?.querySelector('img');
      if (img) {
        const clone = img.cloneNode(true) as HTMLElement;
        clone.style.position = 'fixed';
        clone.style.zIndex = '9999';
        clone.style.width = '80px';
        clone.style.height = '80px';
        clone.style.objectFit = 'cover';
        clone.style.borderRadius = '8px';
        
        const rect = img.getBoundingClientRect();
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.classList.add('fly-to-cart');
        
        document.body.appendChild(clone);
        setTimeout(() => clone.remove(), 800);
      }
    }

    // Use first variation if available, otherwise use base product
    const variation = product.variations && product.variations.length > 0 ? product.variations[0] : null;
    
    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: variation ? variation.newPrice : product.newPrice,
        qty: 1,
        image: variation ? variation.image : (product.image || ''),
        variation: variation ? `${variation.color} / ${variation.size}` : '',
        slug: product.slug,
      });
      showSuccess(`Đã thêm ${product.name} vào giỏ hàng!`);
    } catch (error) {
      console.error('Add to cart error:', error);
      showError('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
    }
  };

  // LOGIC MUA NGAY: Thêm vào giỏ và chuyển hướng đến trang checkout
  const handleBuyNow = (product: ProductData) => {
    // Logic thêm vào giỏ hàng

    // Điều hướng
    navigate('/checkout');
  };


  // ----------------------------------------------------
  // IV. LOGIC PHÂN TRANG & RENDER UI
  // ----------------------------------------------------

  // Apply price filter client-side on the fetched `products` list
  const filteredProducts = useMemo(() => {
    if (!selectedPriceFilter) return products;
    return products.filter(p => {
      const v = p.newPrice || 0;
      const min = selectedPriceFilter.min || 0;
      const max = selectedPriceFilter.max === Infinity ? Infinity : (selectedPriceFilter.max || Infinity);
      return v >= min && v <= max;
    });
  }, [products, selectedPriceFilter]);

  const filteredTotal = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / productsPerPage));
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading) {
    return (
      <div className="product-page"><Header /><main className="product-main"><h1 className="product-category-title">Đang tải...</h1><p style={{ textAlign: 'center', padding: '50px' }}>Đang tải sản phẩm và bộ lọc...</p></main><Footer /></div>
    );
  }

  return (
    <div className="product-page">
      <Header />
      <main className="product-main">
        <div className="breadcrumb">Trang chủ / Sản phẩm / {currentCategoryName}</div>
        <h1 className="product-category-title">{currentCategoryName}</h1>

        <div className="product-content">
          <aside className="product-filter">
            <FilterSidebar
              categoryList={categoryList}
              currentCategorySlug={categoryParam || undefined}
              handleFilterChange={handleFilterChange}
              priceFilters={priceFilters}
              ratingFilter={ratingFilter}
              handleRatingChange={handleRatingChange}
              ratingCounts={ratingCounts}
              selectedPriceFilter={selectedPriceFilter}
              handlePriceChange={handlePriceChange}
            />
          </aside>

          <section className="product-list-section">
            <div className="product-list-top">
              {(() => {
                const displayStart = filteredTotal === 0 ? 0 : indexOfFirstProduct + 1;
                const displayEnd = filteredTotal === 0 ? 0 : indexOfFirstProduct + currentProducts.length;
                return <span className="product-count">Hiển thị {displayStart} - {displayEnd} trên {filteredTotal} sản phẩm</span>;
              })()}
              <div className="product-sort">
                <label htmlFor="sort">Sắp xếp theo:</label>
                <select id="sort" className="product-sort-select" value={sortOption} onChange={handleSortChange}>
                  <option value="newest">Hàng Mới Về</option>
                  <option value="price-asc">Giá: Thấp đến Cao</option>
                  <option value="price-desc">Giá: Cao đến Thấp</option>
                  <option value="best-seller">Bán Chạy Nhất</option>
                </select>
              </div>
            </div>

            <div className="product-grid">
              {currentProducts.length === 0 ? (
                <div style={{padding:40,textAlign:'center',color:'#666'}}>Xin lỗi, hiện tại không có sản phẩm nào thuộc bộ lọc này. Hãy thử bỏ chọn bộ lọc hoặc chọn danh mục khác.</div>
              ) : (
                currentProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    {...p}
                    isWished={wishlist.has(p.id)}
                    handleToggleWishlist={handleToggleWishlist}
                    handleAddToCart={handleAddToCart}
                    handleBuyNow={handleBuyNow}
                    navigate={navigate}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="product-pagination">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={page === currentPage ? "product-pagination-current" : ""}
                  >
                    {page}
                  </button>
                ))}
                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>→</button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
      <FloatingButtons />
      {showLoginWarning && (
        <LoginWarning 
          message="Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng"
          onClose={() => setShowLoginWarning(false)}
        />
      )}
    </div>
  );
}