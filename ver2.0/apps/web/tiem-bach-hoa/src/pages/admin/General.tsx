import React from "react";
import "../../../css/admin/general.css";

const SettingsContainer = ({ title, description, children }) => (
  <div className="settings-card">
    <h2 className="settings-title">{title}</h2>
    <p className="settings-desc">{description}</p>
    <div className="settings-content">{children}</div>
  </div>
);

const SettingInput = ({ label, value, type = 'text', hint }) => (
  <div className="setting-row">
    <div className="setting-info">
      <label className="setting-label">{label}</label>
      {hint && <p className="setting-hint">{hint}</p>}
    </div>
    <div className="setting-control">
      {type === 'toggle' ? (
        <button className={`toggle-btn ${value ? 'active' : ''}`}>
          <span className={`toggle-circle ${value ? 'active' : ''}`} />
        </button>
      ) : type === 'select' ? (
        <select defaultValue={value} className="input-field">
          <option>{value}</option>
        </select>
      ) : (
        <input type={type} defaultValue={value} className="input-field" />
      )}
    </div>
  </div>
);

export default function AdminSettingsPage() {
  const activeSection = 'general';

  const menuItems = [
    { key: 'general', label: 'Thông Tin Chung', icon: '🌎' },
    { key: 'seo', label: 'Cài Đặt SEO', icon: '🔍' },
    { key: 'payment', label: 'Thanh Toán', icon: '💳' },
    { key: 'shipping', label: 'Vận Chuyển', icon: '🚚' },
    { key: 'social', label: 'Mạng Xã Hội', icon: '📱' },
  ];

  const renderSettingsContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <SettingsContainer 
            title="Thông Tin Chung Cửa Hàng"
            description="Cập nhật tên, logo, email liên hệ và múi giờ mặc định."
          >
            <SettingInput label="Tên Website" value="Minimal Lifestyle Store" hint="Tên sẽ hiển thị trên tiêu đề trình duyệt." />
            <SettingInput label="Email Hỗ Trợ Khách Hàng" value="support@minimalstore.vn" hint="Địa chỉ email dùng để gửi thông báo hệ thống và hỗ trợ khách hàng." />
            <SettingInput label="Múi Giờ Mặc Định" value="(GMT+07:00) Hồ Chí Minh" type="select" hint="Quan trọng cho việc tính toán thời gian đơn hàng/báo cáo." />
            <SettingInput label="Bật Chế Độ Bảo Trì" value={false} type="toggle" hint="Ẩn website đối với khách hàng (chỉ Admin được truy cập)." />
          </SettingsContainer>
        );
      case 'seo':
        return (
          <SettingsContainer 
            title="Cài Đặt SEO"
            description="Thiết lập các thẻ meta và cấu hình chung cho SEO website."
          >
            <SettingInput label="Meta Title Mặc Định" value="Minimal Lifestyle - Nội Thất & Đồ Trang Trí Tối Giản" hint="Tiêu đề mặc định nếu trang không có tiêu đề riêng." />
            <SettingInput label="Meta Description Mặc Định" value="Khám phá các sản phẩm trang trí nhà cửa tối giản, thân thiện với môi trường." hint="Mô tả mặc định cho SEO." />
            <SettingInput label="Tự động tạo SEO Friendly URL" value={true} type="toggle" hint="Chuyển đổi tiêu đề thành URL thân thiện khi tạo sản phẩm/bài viết." />
          </SettingsContainer>
        );
      case 'payment':
        return (
          <SettingsContainer 
            title="Cổng Thanh Toán & Tiền Tệ"
            description="Quản lý các phương thức thanh toán và đơn vị tiền tệ chính thức."
          >
            <SettingInput label="Đơn vị Tiền tệ Chính" value="VNĐ (Vietnam Dong)" type="select" hint="Đơn vị tiền tệ hiển thị trên toàn bộ website." />
            <SettingInput label="Kích hoạt Thanh toán COD" value={true} type="toggle" hint="Cho phép khách hàng thanh toán khi nhận hàng." />
            <SettingInput label="Tên tài khoản Ngân hàng" value="Nguyễn Văn A - Vietcombank" hint="Thông tin hiển thị khi khách hàng chọn chuyển khoản." />
          </SettingsContainer>
        );
      default:
        return <p className="no-selection">Vui lòng chọn một mục từ menu bên trái.</p>;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Quản Lý Cấu Hình Chung</h1>
        </header>

        <div className="settings-layout">
          <div className="settings-menu">
            {menuItems.map(item => (
              <button key={item.key} className={`menu-item ${item.key === activeSection ? 'active' : ''}`}>
                <span className="menu-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div className="settings-content-wrapper">
            {renderSettingsContent()}
            <div className="save-btn-container">
              <button className="save-btn">Lưu Thay Đổi Cấu Hình</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
