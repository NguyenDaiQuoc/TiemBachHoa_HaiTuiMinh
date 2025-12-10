// src/pages/Categories.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 1. IMPORT CÁC COMPONENT CHUNG
import Header from '../components/Header'; 
import Footer from '../components/Footer';
import FloatingButton from '../components/FloatingButtons';

// 2. IMPORT CÁC COMPONENT RIÊNG CỦA TRANG
import Sidebar from '../components/Sidebar'; 
import type { CategoryItem } from '../components/Sidebar';  
import CategoryContent from '../components/CategoryContent'; 

// 3. IMPORT CSS RIÊNG CỦA TRANG
import '../../css/categories.css'; 

export default function Categories() { // Đổi tên từ CategoriesPage thành Categories
    const location = useLocation();
    
    // State để lưu cây danh mục (chia sẻ giữa Sidebar và Content)
    const [categoryTree, setCategoryTree] = useState<CategoryItem[]>([]);
    
    // State để theo dõi slug đang hoạt động
    const [activeSlug, setActiveSlug] = useState<string | null>(null);

    // Lấy slug từ URL khi location thay đổi
    useEffect(() => {
        const pathSegments = location.pathname.split('/');
        // Lấy segment cuối cùng làm slug, nếu không có thì là null
        const currentSlug = pathSegments.length > 2 ? pathSegments[2] : null;
        
        setActiveSlug(currentSlug);
    }, [location.pathname]);

    return (
        <div className="main-app-container">
            {/* ⭐️ HEADER ⭐️ */}
            <Header /> 
            
            <main className="categories-page-container">
                <div className="categories-page-wrapper">
                    <h1 className="page-title">Danh mục & Sản phẩm</h1>
                    
                    <div className="content-layout">
                        {/* ⭐️ SIDEBAR ⭐️ */}
                        <Sidebar 
                            activeSlug={activeSlug} 
                            setActiveSlug={setActiveSlug}
                            categoryTree={categoryTree}
                            setCategoryTree={setCategoryTree}
                        />
                        
                        {/* ⭐️ CONTENT ⭐️ */}
                        <CategoryContent 
                            activeSlug={activeSlug} 
                            categoryTree={categoryTree}
                        />
                    </div>
                </div>
            </main>

            {/* ⭐️ FOOTER ⭐️ */}
            <Footer />
            
            {/* ⭐️ FLOATING BUTTON ⭐️ */}
            <FloatingButton />
        </div>
    );
}