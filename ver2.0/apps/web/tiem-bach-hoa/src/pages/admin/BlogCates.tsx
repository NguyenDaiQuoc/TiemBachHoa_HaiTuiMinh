import React from "react";
import "../../../css/admin/blogcates.css";

const blogCategories = [
  { id: 1, name: "Công Thức & Mẹo Bếp", slug: "cong-thuc", posts: 12, status: "Hiển thị" },
  { id: 2, name: "Mẹo Vặt Cuộc Sống", slug: "meo-vat", posts: 15, status: "Hiển thị" },
  { id: 3, name: "Tin Tức & Xu Hướng", slug: "tin-tuc", posts: 8, status: "Hiển thị" },
  { id: 4, name: "Giới Thiệu Sản Phẩm", slug: "san-pham", posts: 5, status: "Ẩn" },
];

export default function AdminBlogCategoryPage() {
  const statusColors: { [key: string]: string } = {
    "Hiển thị": "status-show",
    "Ẩn": "status-hide",
  };

  return (
    <div className="admin-blog-wrapper">
      <div className="blog-container">
        <header className="blog-header">
          <h1 className="blog-title">Quản Lý Danh Mục Bài Viết (Blog)</h1>
          <button className="btn-add">
            <span className="btn-icon">➕</span> Thêm Danh Mục Mới
          </button>
        </header>

        <div className="filter-bar">
          <input type="text" placeholder="Tìm kiếm theo Tên Danh Mục..." className="filter-input" />
          <select className="filter-select">
            <option>Lọc theo Trạng Thái</option>
            <option>Hiển thị</option>
            <option>Ẩn</option>
          </select>
          <button className="btn-apply">Áp Dụng</button>
        </div>

        <div className="table-card">
          <table className="category-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Danh Mục</th>
                <th>Slug (URL)</th>
                <th>Số Bài Viết</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {blogCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td className="cat-name">{cat.name}</td>
                  <td className="cat-slug">{cat.slug}</td>
                  <td>{cat.posts} <span className="posts-label">bài</span></td>
                  <td>
                    <span className={`status-badge ${statusColors[cat.status]}`}>
                      {cat.status}
                    </span>
                  </td>
                  <td>
                    <button className="action-edit">Sửa</button>
                    <button className="action-delete">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-note">
            * Lưu ý: Slug (URL) nên được tối ưu hóa cho công cụ tìm kiếm (SEO).
          </div>
        </div>
      </div>
    </div>
  );
}

