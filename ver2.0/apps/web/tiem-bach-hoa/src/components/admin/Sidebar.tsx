import React from "react";
// 1. IMPORT THÊM useLocation để lấy đường dẫn hiện tại
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../../firebase";
import "../../../css/admin/sidebar.css";

// --- SIDEBAR COMPONENT ---
export default function AdminSidebar() {
  const navigate = useNavigate();
  // 2. SỬ DỤNG useLocation để biết URL hiện tại
  const location = useLocation();

  const handleLogout = () => {
    // Xóa thông tin đăng nhập và đăng xuất khỏi Firebase
    localStorage.removeItem("adminLoginInfo");
    auth.signOut();
    navigate("/admin");
  };

  // Các mục menu (Giữ nguyên)
  const menuItems = [
    { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },

    // Quản lý Sản Phẩm
    { label: "Sản Phẩm", icon: "🏷️", path: "/admin/products" },
    { label: "Danh Mục Sản Phẩm", icon: "📂", path: "/admin/product-cates" },

    // Quản lý Đơn Hàng & Bán Hàng
    { label: "Quản Lý Đơn Hàng", icon: "📦", path: "/admin/orders" },
    { label: "Deals/Flash Sale", icon: "⚡", path: "/admin/deals" },

    // Quản lý Khách Hàng & Marketing
    { label: "Khách Hàng/Người Dùng", icon: "👥", path: "/admin/users" },
    { label: "Marketing Tổng Quan", icon: "📢", path: "/admin/marketing" },
    { label: "Voucher/Mã Giảm Giá", icon: "🎫", path: "/admin/vouchers" },
    { label: "Khuyến Mãi/Ưu Đãi", icon: "✨", path: "/admin/promotions" },

    // Quản lý Nội Dung
    { label: "Quản Lý Bài Viết/Blog", icon: "✍️", path: "/admin/blogs" },
    { label: "Danh Mục Bài Viết", icon: "📰", path: "/admin/blog-cates" },
    { label: "Tin Tức/Thông Báo", icon: "🔔", path: "/admin/news" },
    { label: "Thư Viện Ảnh/Media", icon: "🖼️", path: "/admin/media" },

    // Hệ thống & Cấu hình
    { label: "Báo Cáo/Analytics", icon: "📊", path: "/admin/analytics" },
    { label: "Cấu Hình Chung", icon: "⚙️", path: "/admin/general" },
  ];

  /**
   * Hàm kiểm tra xem đường dẫn hiện tại có khớp với đường dẫn của menu item hay không.
   * @param path Đường dẫn của menu item
   * @returns boolean
   */
  const isLinkActive = (path: string): boolean => {
    // location.pathname trả về đường dẫn hiện tại (ví dụ: "/admin/products")
    return location.pathname === path;
  };


  // Hàm điều hướng (thay thế thẻ <a> bằng navigate để chuyển trang mà không tải lại)
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="admin-sidebar">
      <a href="/admin/dashboard"><h1 className="admin-sidebar-header"><span>ADMIN</span> Dashboard</h1></a>
      <ul className="admin-sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.path}>
            {/* 3. Áp dụng class 'active' nếu đường dẫn khớp */}
            <div
              className={`sidebar-menu-item ${isLinkActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)} // Sử dụng onClick để điều hướng
            >
              <span className="sidebar-menu-icon">{item.icon}</span>
              {item.label}
            </div>
          </li>
        ))}
      </ul>

      <div className="admin-sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          <span>🚪</span> Đăng Xuất
        </button>
      </div>
    </div>
  );
}