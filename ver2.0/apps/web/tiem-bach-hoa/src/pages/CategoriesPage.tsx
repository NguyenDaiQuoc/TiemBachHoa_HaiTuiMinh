import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar'; // Điều chỉnh đường dẫn
import CategoryContent from '../components/CategoryContent'; // Điều chỉnh đường dẫn

// Giả định kiểu dữ liệu CategoryItem (cần định nghĩa lại ở đây nếu không dùng file .d.ts)
type CategoryItem = {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    parentId: string | null;
    children?: CategoryItem[];
};

export default function CategoriesPage() {
    // Trạng thái đồng bộ danh mục đang được chọn (active node)
    const [activeSlug, setActiveSlug] = useState<string | null>(null); 
    
    // Trạng thái lưu trữ toàn bộ cây danh mục từ Firestore
    const [categoryTree, setCategoryTree] = useState<CategoryItem[]>([]); 

    // Logic: Khởi tạo activeSlug nếu có trong URL hoặc mặc định
    useEffect(() => {
        // Ví dụ: Lấy slug từ URL
        const path = window.location.pathname;
        if (path.startsWith('/categories/')) {
            const slugFromUrl = path.split('/').pop();
            if (slugFromUrl) {
                setActiveSlug(slugFromUrl);
            }
        }
    }, []);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <h1 className="text-4xl font-extrabold text-[#3C3C3C] mb-8">Trang Mua Sắm Theo Danh Mục</h1>
            <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
                
                {/* 1. Sidebar (Truyền setter để Sidebar cập nhật Tree) */}
                <Sidebar 
                    activeSlug={activeSlug} 
                    setActiveSlug={setActiveSlug} 
                    setCategoryTree={setCategoryTree} // Truyền hàm setCategoryTree xuống
                    categoryTree={categoryTree} // Truyền categoryTree xuống
                />

                {/* 2. Content (Truyền Tree để Content kiểm tra Parent/Child) */}
                <CategoryContent 
                    activeSlug={activeSlug} 
                    categoryTree={categoryTree} 
                /> 
                
            </div>
        </div>
    );
}