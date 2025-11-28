import React from "react";
import "../../../css/admin/productcates.css";

// Dữ liệu mẫu Danh Mục
const categories = [
  { 
    id: 1, name: 'Trang Trí & Nội Thất', slug: 'trang-tri', products: 45, status: 'Hiển thị',
    children: [
      { id: 11, name: 'Nến Thơm', slug: 'nen-thom', products: 15, status: 'Hiển thị', children: [] },
      { id: 12, name: 'Bình Hoa & Gốm', slug: 'binh-hoa', products: 20, status: 'Hiển thị', children: [] },
    ]
  },
  { 
    id: 2, name: 'Thực Phẩm & Đồ Uống', slug: 'thuc-pham', products: 80, status: 'Hiển thị',
    children: [
      { id: 21, name: 'Trà Thảo Mộc', slug: 'tra-thao-moc', products: 30, status: 'Hiển thị', children: [] },
    ]
  },
  { id: 3, name: 'Chăm Sóc Cá Nhân', slug: 'cham-soc', products: 25, status: 'Ẩn', children: [] },
];

// Component hàng danh mục (hỗ trợ cấp con)
function CategoryRow({ category, level = 0 }) {
  const indent = level * 20;
  const statusClass = category.status === 'Hiển thị' ? 'status-visible' : 'status-hidden';

  return (
    <>
      <tr className="category-row">
        <td style={{ paddingLeft: `${20 + indent}px` }}>
          <span className="prefix">{level > 0 ? '↳' : '•'}</span>
          <span className="category-name">{category.name}</span>
        </td>
        <td>{category.slug}</td>
        <td>{category.products}</td>
        <td><span className={`status ${statusClass}`}>{category.status}</span></td>
        <td>
          <button className="btn-edit">Sửa</button>
          <button className="btn-delete">Xóa</button>
        </td>
      </tr>
      {category.children && category.children.map(child => (
        <CategoryRow key={child.id} category={child} level={level + 1} />
      ))}
    </>
  );
}

// Component chính: Admin Category Page
export default function AdminCategoryPage() {
  return (
    <div className="page-wrapper">
      <main className="content">
        <header className="content-header">
          <h1 className="content-title">Quản Lý Danh Mục Sản Phẩm</h1>
          <button className="btn-add-category">📁 Thêm Danh Mục Mới</button>
        </header>

        <div className="table-container">
          <table className="category-table">
            <thead>
              <tr>
                <th>Tên Danh Mục</th>
                <th>Slug (URL)</th>
                <th>Sản Phẩm</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => <CategoryRow key={cat.id} category={cat} />)}
            </tbody>
          </table>
          <div className="table-note">
            * Lưu ý: Cấu trúc danh mục phân cấp (cha/con). Dùng nút "Sửa" để thay đổi cấp độ hoặc danh mục cha.
          </div>
        </div>

        <div className="seo-tool">
          <h3>Công Cụ SEO Danh Mục</h3>
          <p>→ Mẹo: Đảm bảo trường <strong>Slug</strong> ngắn gọn, chứa từ khóa chính và không dấu để tối ưu hóa SEO.</p>
        </div>
      </main>
    </div>
  );
}
