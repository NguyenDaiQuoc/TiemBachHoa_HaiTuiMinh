import React from "react";
import "../../../css/admin/products.css";

const initialProducts = [
  { id: 101, name: 'Máy Hút Bụi Robot X1', category: 'Đồ Điện Tử Gia Dụng', price: 5500000, stock: 15, status: 'Đang bán', variants: 1 },
  { id: 102, name: 'Kem Dưỡng Da Ban Đêm A', category: 'Mỹ Phẩm & Chăm Sóc Da', price: 450000, stock: 88, status: 'Đang bán', variants: 3 },
  { id: 103, name: 'Bàn Chải Điện Sonic V3', category: 'Đồ Dùng Cá Nhân', price: 920000, stock: 5, status: 'Hết hàng', variants: 2 },
  { id: 104, name: 'Bộ Nồi Chảo Gốm Sứ', category: 'Gia Dụng Bếp', price: 1200000, stock: 25, status: 'Đang bán', variants: 1 },
  { id: 105, name: 'Tivi Thông Minh 55 inch', category: 'Đồ Điện Tử Gia Dụng', price: 18000000, stock: 0, status: 'Tạm ẩn', variants: 1 },
];

const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

const getStatusClass = (status) => {
  switch(status) {
    case 'Đang bán': return 'status-active';
    case 'Hết hàng': return 'status-soldout';
    case 'Tạm ẩn': return 'status-hidden';
    default: return 'status-default';
  }
};

export default function AdminProductsPage() {
  const [products] = React.useState(initialProducts);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = React.useState('Tất cả');

  const categories = ['Tất cả', 'Đồ Điện Tử Gia Dụng', 'Mỹ Phẩm & Chăm Sóc Da', 'Đồ Dùng Cá Nhân', 'Gia Dụng Bếp'];
  const statuses = ['Tất cả', 'Đang bán', 'Hết hàng', 'Tạm ẩn'];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory === 'Tất cả' || p.category === selectedCategory) &&
    (selectedStatus === 'Tất cả' || p.status === selectedStatus)
  );

  return (
    <div className="page-wrapper">
      <aside className="sidebar">
        <div className="sidebar-title">CMS Dashboard</div>
        <nav className="sidebar-nav">
          <div className="sidebar-item">📂 Quản lý Danh Mục</div>
          <div className="sidebar-item active">📦 Quản lý Sản Phẩm</div>
          <div className="sidebar-item">📄 Quản lý Đơn hàng</div>
        </nav>
      </aside>

      <main className="content">
        <header className="content-header">
          <h1 className="content-title">Quản Lý Sản Phẩm ({initialProducts.length})</h1>
          <button className="btn-add">+ Thêm Sản Phẩm Mới</button>
        </header>

        <div className="toolbar">
          <input type="text" placeholder="Tìm theo Tên Sản Phẩm, SKU..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
          <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)}>
            {categories.map(cat=> <option key={cat}>{cat}</option>)}
          </select>
          <select value={selectedStatus} onChange={e=>setSelectedStatus(e.target.value)}>
            {statuses.map(status=> <option key={status}>{status}</option>)}
          </select>
          <button className="btn-filter">Lọc</button>
        </div>

        <div className="table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th><input type="checkbox"/></th>
                <th>Sản Phẩm</th>
                <th>Danh Mục</th>
                <th>Giá Bán</th>
                <th>Tồn Kho</th>
                <th>Biến Thể</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td><input type="checkbox"/></td>
                  <td className="product-name">{p.name} <div className="sku">SKU: #{p.id}</div></td>
                  <td>{p.category}</td>
                  <td className="price">{formatCurrency(p.price)}</td>
                  <td className={p.stock<=10?'low-stock':''}>{p.stock===0?'Hết hàng':p.stock}</td>
                  <td>{p.variants}</td>
                  <td><span className={`status ${getStatusClass(p.status)}`}>{p.status}</span></td>
                  <td className="actions">
                    <button className="edit-btn">Sửa</button>
                    <button className="delete-btn">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Trang 1/2</span>
          <div className="pages">
            <button>Trước</button>
            <button className="current">1</button>
            <button>2</button>
            <button>Sau</button>
          </div>
        </div>
      </main>
    </div>
  );
}
