import React from "react";
import "../../../css/admin/news.css";

const newsItems = [
  { id: 'NEWS1001', title: 'Thông Báo Điều Chỉnh Giá Dịch Vụ Vận Chuyển', type: 'Thông báo', author: 'Ban Quản Trị', date: '10/11/2025', status: 'Đã Xuất Bản', isUrgent: true },
  { id: 'NEWS1002', title: 'Tuyển Dụng: Nhân Viên Marketing Digital', type: 'Tuyển dụng', author: 'HR Dept.', date: '05/11/2025', status: 'Đã Xuất Bản', isUrgent: false },
  { id: 'NEWS1003', title: 'Báo Cáo Hoạt Động Quý 4/2025', type: 'Báo cáo', author: 'Ban Lãnh Đạo', date: '01/11/2025', status: 'Bản Nháp', isUrgent: false },
  { id: 'NEWS1004', title: 'Cập Nhật Chính Sách Bảo Mật Mới', type: 'Chính sách', author: 'Phòng Pháp Lý', date: '25/10/2025', status: 'Chờ Duyệt', isUrgent: true },
];

const NewsMetrics = () => {
  const totalNews = 22;
  const urgent = 5;

  return (
    <div className="metrics-grid">
      <div className="metric-card primary">
        <p className="metric-label">Tổng Số Tin Tức/TB</p>
        <h3 className="metric-value">{totalNews}</h3>
      </div>
      <div className="metric-card urgent">
        <p className="metric-label">Tin Tức Quan Trọng/Khẩn</p>
        <h3 className="metric-value">{urgent}</h3>
      </div>
      <div className="metric-card draft">
        <p className="metric-label">Bản Nháp / Chờ Duyệt</p>
        <h3 className="metric-value">7</h3>
      </div>
    </div>
  );
};

export default function AdminNewsPage() {
  const statusColors = {
    'Đã Xuất Bản': 'status-published',
    'Bản Nháp': 'status-draft',
    'Chờ Duyệt': 'status-pending',
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Quản Lý Tin Tức & Thông Báo</h1>
          <button className="btn-create">
            <span className="icon">📣</span> Tạo Tin Mới
          </button>
        </header>

        <NewsMetrics />

        <div className="filters">
          <input type="text" placeholder="Tìm kiếm theo Tiêu đề, Tác giả..." className="filter-input" />
          <select className="filter-select">
            <option>Lọc theo Trạng Thái</option>
            <option>Đã Xuất Bản</option>
            <option>Bản Nháp</option>
            <option>Chờ Duyệt</option>
          </select>
          <select className="filter-select">
            <option>Lọc theo Loại Tin</option>
            <option>Thông báo</option>
            <option>Tuyển dụng</option>
            <option>Chính sách</option>
          </select>
          <button className="btn-apply">Áp Dụng</button>
        </div>

        <div className="news-table-container">
          <table className="news-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu Đề</th>
                <th>Loại Tin</th>
                <th>Tác Giả</th>
                <th>Ngày Đăng</th>
                <th>Quan Trọng</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {newsItems.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="title-cell">{item.title}</td>
                  <td>{item.type}</td>
                  <td>{item.author}</td>
                  <td>{item.date}</td>
                  <td className={item.isUrgent ? 'urgent-text' : 'normal-text'}>
                    {item.isUrgent ? '⭐ KHẨN' : 'Bình thường'}
                  </td>
                  <td><span className={`status ${statusColors[item.status]}`}>{item.status}</span></td>
                  <td>
                    <button className="action-edit">Sửa</button>
                    <button className="action-delete">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <span className="pagination-info">Hiển thị 1 - 20 trong tổng số 22 tin tức</span>
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
  );
}
