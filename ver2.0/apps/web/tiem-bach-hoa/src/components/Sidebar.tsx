// src/components/Sidebar.tsx

import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'; // 🌟 IMPORT THÊM query, orderBy, Timestamp 🌟
import { useNavigate } from 'react-router-dom';
import '../../css/sidebar.css';

// --- Kiểu dữ liệu (Type Definition) ---
export type CategoryItem = {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    parentId: string | null;
    children?: CategoryItem[];
    status?: string;
    product_count?: number;
    // 🌟 THÊM createdAt 🌟
    createdAt?: Timestamp; 
};

// Hàm xây dựng cây 2 cấp (Không thay đổi)
const buildCategoryTree = (list: CategoryItem[], parentId: string | null = null, currentLevel = 1): CategoryItem[] => {
    if (currentLevel > 2) return [];

    return list
        .filter(item => item.parentId === parentId)
        .map(item => ({
            ...item,
            children: currentLevel === 1 ? buildCategoryTree(list, item.id, currentLevel + 1) : [],
        }));
};

// Component con: TreeItem (Không thay đổi)
function TreeItem({ category, activeSlug, setActiveSlug, level = 0 }: {
    category: CategoryItem;
    activeSlug: string | null;
    setActiveSlug: (slug: string) => void;
    level?: number;
}) {
    const navigate = useNavigate();
    const isActive = activeSlug === category.slug;
    const hasChildren = category.children && category.children.length > 0;

    const [isOpen, setIsOpen] = useState(() => hasChildren && category.children!.some(c => c.slug === activeSlug));

    const baseClasses = `tree-item-link tree-level-${level}`;
    const activeClasses = 'active-item';
    const toggleClasses = `tree-toggle ${isOpen ? 'is-open' : ''}`;

    const handleItemClick = (e: React.MouseEvent) => {
        if (hasChildren) {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else {
            setActiveSlug(category.slug);
            navigate(`/categories/${category.slug}`);
        }
    };

    return (
        <li key={category.id} className="tree-item">
            <div
                className={`${baseClasses} ${isActive ? activeClasses : ''}`}
                onClick={handleItemClick}
            >
                {hasChildren && (
                    <span className={toggleClasses}>
                        ▶
                    </span>
                )}

                {category.icon && <img src={category.icon} className="item-icon" alt={category.name} />}

                <span className="item-name">{category.name}</span>
            </div>

            {hasChildren && isOpen && (
                <ul className="tree-submenu">
                    {category.children!.map(child => (
                        <TreeItem
                            key={child.id}
                            category={child}
                            activeSlug={activeSlug}
                            setActiveSlug={setActiveSlug}
                            level={level + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

// -------------------------------------------------------------
// Component Chính: Sidebar
// -------------------------------------------------------------
export default function Sidebar({ activeSlug, setActiveSlug, setCategoryTree, categoryTree }: {
    activeSlug: string | null;
    setActiveSlug: (slug: string) => void;
    setCategoryTree: (tree: CategoryItem[]) => void;
    categoryTree: CategoryItem[];
}) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // 🌟 THÊM truy vấn sắp xếp 🌟
                const categoriesRef = collection(db, "categories");
                // Sắp xếp theo createdAt tăng dần ('asc'): Bản ghi cũ nhất (thời gian nhỏ nhất) lên trước
                const q = query(categoriesRef, orderBy("createdAt", "asc")); 
                
                const querySnapshot = await getDocs(q);

                // If you want to override some slugs for nicer URLs, add them here
                const slugOverrides: Record<string, string> = {
                    'Khuyến mãi sốc': 'khuyen-mai'
                };

                const firestoreCategories: CategoryItem[] = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const parentId = data.parentId === 'null' ? null : data.parentId || null;
                    const name = data.name || 'Không tên';
                    const overriddenSlug = slugOverrides[name] || data.slug || doc.id;

                    return {
                        id: doc.id,
                        name,
                        slug: overriddenSlug,
                        icon: data.icon || undefined,
                        parentId: parentId,
                        status: data.status || 'visible',
                        product_count: data.product_count || 0,
                        createdAt: data.createdAt as Timestamp || undefined, // Lấy giá trị timestamp
                    };
                });

                // Lọc các mục không hiển thị
                const filteredList = firestoreCategories.filter(c => c.status !== 'hidden');
                
                // Xây dựng cây danh mục (Cấu trúc phân cấp 2 cấp)
                const tree = buildCategoryTree(filteredList, null);

                setCategoryTree(tree);
            } catch (err) {
                console.error("Lỗi khi tải danh mục Sidebar: ", err);
            } finally {
                setLoading(false);
            }
        };

        if (categoryTree.length === 0 && loading) {
            fetchCategories();
        } else {
            setLoading(false);
        }

    }, [setCategoryTree, categoryTree, loading]);

    if (loading) {
        return <div className="sidebar-loading">Đang tải danh mục...</div>;
    }

    return (
        <div className="sidebar-container">
            <h3 className="sidebar-title">DANH MỤC</h3>
            <ul className="tree-list">
                {categoryTree.map(cat => (
                    <TreeItem
                        key={cat.id}
                        category={cat}
                        activeSlug={activeSlug}
                        setActiveSlug={setActiveSlug}
                    />
                ))}
            </ul>
        </div>
    );
}