// src/components/CategoryContent.tsx

import React, { useMemo } from 'react';
import type { CategoryItem } from './Sidebar';
import '../../css/categorycontent.css'; // Đường dẫn đến file CSS
// ⭐️ IMPORT THÊM Link từ React Router DOM ⭐️
import { Link } from 'react-router-dom';

// Dữ liệu giả định cho sản phẩm
const dummyProducts = [
    { id: 1, name: "Sữa tắm On The Body", image: "https://picsum.photos/300/300?random=1", price: "100.000đ" },
    { id: 2, name: "Kem chống nắng Biore", image: "https://picsum.photos/300/300?random=2", price: "150.000đ" },
    { id: 3, name: "Sữa rửa mặt Cetaphil", image: "https://picsum.photos/300/300?random=3", price: "200.000đ" },
    { id: 4, name: "Bàn chải Colgate", image: "https://picsum.photos/300/300?random=4", price: "120.000đ" }, // Sản phẩm thứ 4 bị cắt
];

function ProductCard({ product }: { product: typeof dummyProducts[0] }) {
    return (
        <div className="cate-product-card">
            <div className="product-image-wrapper">
                <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                />
            </div>
            <h4 className="product-name">{product.name}</h4>
            <p className="product-price">{product.price}</p>
            <button className="add-to-cart-btn">
                🛒 Thêm vào giỏ
            </button>
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
    // Giới hạn 3 sản phẩm đầu tiên
    const productsToShow = dummyProducts.slice(0, 3);

    return (
        <div className="category-content-container product-view">
            <h2 className="content-title product-title">{displayTitle}</h2>

            <h3 className="content-subtitle">Sản phẩm nổi bật </h3>

            <div className="cate-product-grid">
                {productsToShow.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>

            {/* ⭐️ THAY THẾ thẻ <a> BẰNG component Link ⭐️ */}
            <Link to={`/categories/${activeSlug}/all`} className="view-all-link">
                Xem tất cả sản phẩm thuộc {displayTitle} →
            </Link>
        </div>
    );
}