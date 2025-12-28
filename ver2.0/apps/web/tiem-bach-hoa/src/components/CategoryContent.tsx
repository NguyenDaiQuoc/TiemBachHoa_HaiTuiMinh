// src/components/CategoryContent.tsx

import React, { useMemo, useState, useEffect } from 'react';
import type { CategoryItem } from './Sidebar';
import '../../css/categorycontent.css'; // Đường dẫn đến file CSS
// ⭐️ IMPORT THÊM Link từ React Router DOM ⭐️
import { Link, useNavigate } from 'react-router-dom';
import LoginWarning from './LoginWarning';
import { db } from '../firebase';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { addToCart } from '../utils/cart';
import { showSuccess, showError } from '../utils/toast';

// When a real backend exists we fetch products for the category and compute a featured (best-selling) product

function ProductCard({ product, currentUser, onShowLoginWarning }: { product: any, currentUser: any, onShowLoginWarning?: () => void }) {
    const navigate = useNavigate();

    const priceVal = typeof product.price === 'number' ? product.price : Number(product.price || 0);
    const oldPriceVal = typeof product.oldPrice === 'number' ? product.oldPrice : (product.oldPrice ? Number(product.oldPrice) : undefined);
    const formatPrice = (v: number | undefined) => v == null ? '' : v.toLocaleString('vi-VN') + ' đ';

    // Always show as available - products loaded from Firestore are already filtered
    const isAvailable = true;

    // normalize image field
    const imageUrl = Array.isArray(product.image) ? (product.image[0] || '') : (typeof product.image === 'string' ? product.image : '');

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('[CategoryContent ProductCard] Add to cart clicked', { 
            hasCurrentUser: !!currentUser, 
            isAnonymous: currentUser?.isAnonymous,
            productId: product.id 
        });
        // Check currentUser from prop (from parent state listener)
        if (!currentUser || (currentUser as any).isAnonymous) {
            console.log('[CategoryContent ProductCard] User not logged in, showing warning');
            if (onShowLoginWarning) onShowLoginWarning();
            return;
        }

        // Animation effect - fly image to cart icon
        const target = e.currentTarget as HTMLElement;
        const img = target.closest('.cate-product-card')?.querySelector('img');
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

        try {
            await addToCart({ productId: product.id, name: product.name, price: priceVal, qty: 1, image: imageUrl });
            showSuccess('Đã thêm vào giỏ hàng');
        } catch (err: any) {
            showError('Thêm giỏ hàng thất bại: ' + (err?.message || err));
        }
    };

    const handleBuyNow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('[CategoryContent ProductCard] Buy now clicked', { 
            hasCurrentUser: !!currentUser, 
            isAnonymous: currentUser?.isAnonymous,
            productId: product.id 
        });
        // Check currentUser from prop (from parent state listener)
        if (!currentUser || (currentUser as any).isAnonymous) {
            console.log('[CategoryContent ProductCard] User not logged in, showing warning');
            if (onShowLoginWarning) onShowLoginWarning();
            return;
        }

        // Animation effect - fly image to cart icon
        const target = e.currentTarget as HTMLElement;
        const img = target.closest('.cate-product-card')?.querySelector('img');
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

        try {
            await addToCart({ productId: product.id, name: product.name, price: priceVal, qty: 1, image: imageUrl });
            navigate('/cart');
        } catch (err: any) {
            showError('Có lỗi xảy ra: ' + (err?.message || err));
        }
    };

    return (
        <div className="cate-product-card">
            <div className="product-image-wrapper" style={{cursor: 'pointer'}} onClick={() => navigate(`/product-detail/${product.slug || product.id}`)}>
                {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="product-image" />
                ) : (
                    <div style={{width: '100%', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f7'}}>📷</div>
                )}
            </div>

            <div style={{padding: '8px 12px'}}>
                <h4 className="product-name" style={{margin: '6px 0', cursor: 'pointer'}} onClick={() => navigate(`/product-detail/${product.slug || product.id}`)}>{product.name}</h4>

                <div style={{display: 'flex', gap: 8, alignItems: 'baseline'}}>
                    <div className="product-price" style={{fontWeight: 700, color: '#C75F4B'}}>{formatPrice(priceVal)}</div>
                    {oldPriceVal != null && (
                        <div className="product-old-price" style={{textDecoration: 'line-through', color: '#888', fontSize: '0.9rem'}}>{formatPrice(oldPriceVal)}</div>
                    )}
                </div>
{/* 
                <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
                    <div style={{fontSize:'0.85rem',padding:'4px 8px',borderRadius:6,background:isAvailable ? '#E6FFFA' : '#FFF5F5',color:isAvailable ? '#047857' : '#EF4444',border:isAvailable ? '1px solid #C6F6D5' : '1px solid #FECACA'}}>{product.status || 'Đang cập nhật'}</div>
                </div> */}

                <div style={{display:'flex',gap:8,marginTop:10}}>
                    <button disabled={!isAvailable} onClick={handleAddToCart} style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid #C75F4B',background:'#fff',color:'#C75F4B'}}>🛒 Thêm giỏ hàng</button>
                    <button disabled={!isAvailable} onClick={handleBuyNow} style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:isAvailable?'#C75F4B':'#F3F4F6',color:isAvailable?'#fff':'#9CA3AF'}}>Mua ngay</button>
                </div>
                {/* LoginWarning is controlled at page level to avoid multiple mount/unmount flicker */}
            </div>
        </div>
    );
}

// -------------------------------------------------------------
// Hàm Hỗ trợ 1: Tìm Tên Danh Mục (Giữ nguyên)
// -------------------------------------------------------------
const findCategoryName = (slug: string | null, categories: CategoryItem[]): string | null => {
    if (!slug || categories.length === 0) return null;

    const search = (currentSlug: string, list: CategoryItem[]): string | undefined => {
        for (const cat of list) {
            if (cat.slug === currentSlug) {
                return cat.name;
            }
            if (cat.children && cat.children.length > 0) {
                const result = search(currentSlug, cat.children);
                if (result) return result;
            }
        }
        return undefined;
    };

    const name = search(slug, categories);
    // Nếu không tìm thấy, fallback về slug được định dạng
    return name || slug.replace(/-/g, ' ').toUpperCase();
};

// -------------------------------------------------------------
// Hàm Hỗ trợ 2: Kiểm tra Danh mục Cha (Giữ nguyên)
// -------------------------------------------------------------
const isParentSlug = (slug: string | null, categories: CategoryItem[]): boolean => {
    if (!slug || categories.length === 0) return false;

    const findCategory = (currentSlug: string, list: CategoryItem[]): boolean | undefined => {
        for (const cat of list) {
            if (cat.slug === currentSlug) {
                return cat.children && cat.children.length > 0;
            }
            if (cat.children && cat.children.length > 0) {
                const result = findCategory(currentSlug, cat.children);
                if (result !== undefined) return result;
            }
        }
        return undefined;
    };

    return findCategory(slug, categories) || false;
};


export default function CategoryContent({ activeSlug, categoryTree }: { activeSlug: string | null, categoryTree: CategoryItem[] }) {
    const isParentNode = useMemo(() => isParentSlug(activeSlug, categoryTree), [activeSlug, categoryTree]);

    const displayTitle = useMemo(() => findCategoryName(activeSlug, categoryTree), [activeSlug, categoryTree]);

    const [products, setProducts] = useState<any[]>([]);
    // displayedProducts: up to 3 products to show as featured for this category
    const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
    const [showLoginWarning, setShowLoginWarning] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [authChecked, setAuthChecked] = useState(false);

    // Listen to auth state changes like Cart.tsx
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthChecked(true);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    // Load products for selected category (don't depend on currentUser to avoid re-loading on auth changes)
    useEffect(() => {
        if (!activeSlug) return;
        let mounted = true;
        (async () => {
            try {
                const pq = query(
                    collection(db, 'products'),
                    where('categorySlugs', 'array-contains', activeSlug),
                    orderBy('createdAt', 'desc'),
                    limit(20)
                );
                const ps = await getDocs(pq);
                const loaded = ps.docs.map(d => {
                    const data = d.data() as any;
                    const image = Array.isArray(data.image)
                        ? (data.image[0] || '')
                        : (typeof data.image === 'string' ? data.image : (data.imageUrl || data.thumbnail || ''));
                    const createdAt = data.createdAt;
                    const createdAtMs = createdAt && createdAt.seconds
                        ? createdAt.seconds * 1000
                        : (typeof createdAt === 'number' ? createdAt : 0);
                    return {
                        id: d.id,
                        slug: data.slug || d.id,
                        name: data.name || data.title || 'Sản phẩm',
                        image,
                        price: data.newPrice || data.price || 0,
                        oldPrice: data.oldPrice || undefined,
                        status: data.status || 'Đang bán',
                        stock: typeof data.stock === 'number' ? data.stock : (data.quantity || data.qty || 0),
                        createdAtMs,
                    };
                });
                if (!mounted) return;
                // Prefer products that are currently available ('Đang bán' or stock>0)
                const available = loaded.filter(p => (
                    p.status && p.status.toString() === 'Đang bán'
                ) || (typeof p.stock === 'number' && p.stock > 0));
                setProducts(available.length > 0 ? available : loaded);
            } catch (err) {
                console.warn('Failed to load category products (check Firestore rules or network)');
                setProducts([]);
            }
        })();
        return () => { mounted = false; };
    }, [activeSlug]);

    // Compute displayed products based on currentUser (auth state) - separate effect
    useEffect(() => {
        if (products.length === 0) {
            setDisplayedProducts([]);
            return;
        }

        const sourceForCounts = products;
        const ids = new Set(sourceForCounts.map((p:any) => p.id));

        // If the client is not authenticated, show 3 newest products
        if (!currentUser) {
            const newest = sourceForCounts.slice().sort((a:any,b:any) => (b.createdAtMs || 0) - (a.createdAtMs || 0)).slice(0,3);
            setDisplayedProducts(newest);
            return;
        }
            // compute displayed products for authenticated users

        // Authenticated: scan recent orders and compute counts for products in this category
        (async () => {
            try {
                const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(200));
                const ordersSnap = await getDocs(ordersQ);
                const counts: Record<string, number> = {};
                ordersSnap.docs.forEach(d => {
                    const od = d.data() as any;
                    const items = od.items || [];
                    items.forEach((it: any) => {
                        const pid = it.productId || it.id || it.product || null;
                        const qty = Number(it.quantity || it.qty || it.qtyOrdered || 1) || 0;
                        if (!pid) return;
                        if (!ids.has(pid)) return;
                        counts[pid] = (counts[pid] || 0) + qty;
                    });
                });

                // Sort source products by counts desc (tiebreaker: newest)
                const withCounts = sourceForCounts.map((p:any) => ({
                    ...p,
                    salesCount: counts[p.id] || 0
                }));
                withCounts.sort((a:any,b:any) => {
                    if ((b.salesCount || 0) !== (a.salesCount || 0)) return (b.salesCount || 0) - (a.salesCount || 0);
                    return (b.createdAtMs || 0) - (a.createdAtMs || 0);
                });
                // If none have salesCount > 0, fall back to newest 3
                const anySales = withCounts.some((p:any) => (p.salesCount || 0) > 0);
                const finalList = anySales ? withCounts : sourceForCounts.slice().sort((a:any,b:any) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
                setDisplayedProducts(finalList.slice(0,3));
            } catch (err) {
                console.warn('Failed to compute displayed products');
                setDisplayedProducts(sourceForCounts.slice(0,3));
            }
        })();
    }, [products, currentUser]);

    // Trường hợp 1: Chưa chọn hoặc chọn danh mục Cha
    if (!activeSlug || isParentNode) {
        return (
            <div className="category-content-container">
                <h2 className="content-default-title">Khám phá Danh Mục Sản phẩm 🛒</h2>
                <div className="content-default-message">
                    <p className="message-heading">Chọn một danh mục con để bắt đầu mua sắm!</p>
                    <p className="message-subheading">Vui lòng nhấp vào một **danh mục con** (Cấp 2) ở thanh bên trái.</p>
                    <div className="message-image-wrapper">




                        [Image of a retail store banner]


                    </div>
                </div>
            </div>
        );
    }

    // Trường hợp 2: Đã chọn danh mục Cấp 2 (Tải sản phẩm)
    // Giới hạn 3 sản phẩm đầu tiên; displayedProducts được tính ở effect phía trên

    // Show loading while checking auth
    if (!authChecked) {
        return (
            <div className="category-content-container product-view">
                <h2 className="content-title product-title">{displayTitle}</h2>
                <div style={{padding: '2rem', textAlign: 'center'}}>
                    <div style={{fontSize: '2rem', marginBottom: '1rem'}}>⏳</div>
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="category-content-container product-view">
            <h2 className="content-title product-title">{displayTitle}</h2>

            <h3 className="content-subtitle">Sản phẩm nổi bật </h3>

            <div className="cate-product-grid">
                {displayedProducts.map(p => (
                    <ProductCard key={p.id} product={p} currentUser={currentUser} onShowLoginWarning={() => setShowLoginWarning(true)} />
                ))}
            </div>

            {showLoginWarning && (
                <LoginWarning onClose={() => setShowLoginWarning(false)} />
            )}

            {/* ⭐️ THAY THẾ thẻ <a> BẰNG component Link ⭐️ */}
            <Link to={`/products?category=${activeSlug}`} className="view-all-link">
                Xem tất cả sản phẩm thuộc {displayTitle} →
            </Link>
        </div>
    );
}