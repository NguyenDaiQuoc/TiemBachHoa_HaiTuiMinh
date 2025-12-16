import React from "react";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/media.css";

const mediaItems = [
  { id: 1, name: 'nen_thom_lavender.jpg', type: 'Image', size: '150KB', date: '10/11/2025', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%2392c952" width="150" height="150"/%3E%3C/svg%3E' },
  { id: 2, name: 'muong_go_set.png', type: 'Image', size: '250KB', date: '08/11/2025', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23771796" width="150" height="150"/%3E%3C/svg%3E' },
  { id: 3, name: 'huong_dan_sudung.mp4', type: 'Video', size: '5.2MB', date: '05/11/2025', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%2324f355" width="150" height="150"/%3E%3C/svg%3E' },
  { id: 4, name: 'bao_cao_quy_4.pdf', type: 'Document', size: '1.1MB', date: '01/11/2025', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23d32776" width="150" height="150"/%3E%3C/svg%3E' },
  { id: 5, name: 'binh_gom_trang.jpg', type: 'Image', size: '320KB', date: '25/10/2025', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23a86d26" width="150" height="150"/%3E%3C/svg%3E' },
];

const MediaCard = ({ item }) => {
  const preview = item.type === 'Image'
    ? <img src={item.url} alt={item.name} className="media-preview-img" />
    : <div className="media-preview-other">{item.type === 'Video' ? '▶️' : '📄'}</div>;

  return (
    <div className="media-card">
      <div className="media-preview">{preview}</div>
      <div className="media-info">
        <p className="media-name" title={item.name}>{item.name}</p>
        <div className="media-meta">
          <p>Loại: {item.type}</p>
          <p>Kích cỡ: {item.size}</p>
        </div>
      </div>
      <div className="media-actions">
        <button className="action-edit">Sửa/Xem</button>
        <button className="action-delete">Xóa</button>
      </div>
    </div>
  );
};

export default function AdminMediaPage() {
  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Quản Lý Hình Ảnh & Media</h1>
          <button className="btn-upload">
            <span className="icon">⬆️</span> Tải Lên Tệp Mới
          </button>
        </header>

        <div className="filters">
          <input type="text" placeholder="Tìm kiếm theo Tên tệp, Mô tả..." className="filter-input" />
          <select className="filter-select">
            <option>Lọc theo Loại Tệp</option>
            <option>Image (JPG, PNG)</option>
            <option>Video (MP4, GIF)</option>
            <option>Tài liệu (PDF)</option>
          </select>
          <select className="filter-select">
            <option>Sắp xếp theo Ngày tải lên</option>
            <option>Mới nhất</option>
            <option>Cũ nhất</option>
          </select>
          <button className="btn-apply">Áp Dụng</button>
        </div>

        <div className="media-grid-container">
          <div className="media-grid">
            {mediaItems.map(item => <MediaCard key={item.id} item={item} />)}
            <div className="media-upload-placeholder">
              <div className="upload-inner">
                <span className="upload-icon">+</span>
                <p className="upload-text">Kéo & Thả Tệp</p>
              </div>
            </div>
          </div>

          <div className="pagination">
            <span className="pagination-info">Hiển thị 1 - 5 trong tổng số 1,235 tệp media</span>
            <div className="pagination-controls">
              <button className="pagination-btn">Trước</button>
              <span className="pagination-current">1</span>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">Sau</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

