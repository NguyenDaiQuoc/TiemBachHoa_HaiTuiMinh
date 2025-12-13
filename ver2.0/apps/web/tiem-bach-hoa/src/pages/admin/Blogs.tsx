import React from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/blogs.css";

const blogPosts = [
  { id: 'BL1001', title: '5 Công Thức Pha Trà Hoa Cúc Thư Giãn Tại Nhà', category: 'Công Thức', author: 'An Nhiên', date: '10/11/2025', views: 1540, status: 'Đã Xuất Bản' },
  { id: 'BL1002', title: 'Mẹo Tái Chế Vỏ Trứng Thân Thiện Môi Trường', category: 'Mẹo Vặt', author: 'Hải Đăng', date: '05/11/2025', views: 890, status: 'Bản Nháp' },
  { id: 'BL1003', title: 'Xu Hướng Nội Thất Tối Giản Mùa Đông 2026', category: 'Tin Tức', author: 'An Nhiên', date: '01/11/2025', views: 2120, status: 'Đã Xuất Bản' },
  { id: 'BL1004', title: 'Giới thiệu Bộ Muỗng Gỗ Sồi Cao Cấp', category: 'Sản Phẩm', author: 'Hải Đăng', date: '25/10/2025', views: 550, status: 'Chờ Duyệt' },
];

function BlogMetrics() {
  const totalPosts = 48;
  const published = 35;
  const drafts = 10;

  return (
    <div className="metrics-grid">
      <div className="metric-card border-primary">
        <p className="metric-label">Tổng Số Bài Viết</p>
        <h3 className="metric-value">{totalPosts}</h3>
      </div>
      <div className="metric-card border-green">
        <p className="metric-label">Bài Viết Đã Xuất Bản</p>
        <h3 className="metric-value green">{published}</h3>
      </div>
      <div className="metric-card border-gray">
        <p className="metric-label">Bản Nháp / Chờ Duyệt</p>
        <h3 className="metric-value gray">{drafts}</h3>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const statusColors = {
    'Đã Xuất Bản': 'status-published',
    'Bản Nháp': 'status-draft',
    'Chờ Duyệt': 'status-pending',
  };
  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <div className="blog-container">

          <header className="blog-header">
            <h1 className="blog-title">Quản Lý Bài Viết Blog</h1>
            <button className="btn-add"><span className="btn-icon">✏️</span> Viết Bài Mới</button>
          </header>

          <BlogMetrics />

          <div className="filter-bar">
            <input type="text" placeholder="Tìm kiếm theo Tiêu đề, Tác giả..." className="filter-input" />
            <select className="filter-select">
              <option>Lọc theo Trạng Thái</option>
              <option>Đã Xuất Bản</option>
              <option>Bản Nháp</option>
              <option>Chờ Duyệt</option>
            </select>
            <select className="filter-select">
              <option>Lọc theo Danh Mục</option>
              <option>Công Thức</option>
              <option>Mẹo Vặt</option>
              <option>Tin Tức</option>
            </select>
            <button className="btn-apply">Áp Dụng</button>
          </div>

          <div className="table-card">
            <table className="blog-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tiêu Đề</th>
                  <th>Danh Mục</th>
                  <th>Tác Giả</th>
                  <th>Ngày Xuất Bản</th>
                  <th>Lượt Xem</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {blogPosts.map(post => (
                  <tr key={post.id}>
                    <td>{post.id}</td>
                    <td className="post-title">{post.title}</td>
                    <td>{post.category}</td>
                    <td>{post.author}</td>
                    <td>{post.date}</td>
                    <td>{post.views.toLocaleString('vi-VN')}</td>
                    <td><span className={`status-badge ${statusColors[post.status]}`}>{post.status}</span></td>
                    <td>
                      <button className="action-edit">Sửa</button>
                      <button className="action-delete">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-pagination">
              <span>Hiển thị 1 - 20 trong tổng số 48 bài viết</span>
              <div className="pagination-buttons">
                <button>Trước</button>
                <span className="page-current">1</span>
                <button>2</button>
                <button>Sau</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
