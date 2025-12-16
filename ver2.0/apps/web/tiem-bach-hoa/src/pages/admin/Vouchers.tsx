import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { showSuccess, showError } from "../../utils/toast";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/vouchers.css";

// ========== INTERFACES ==========
interface Voucher {
  id: string;
  code: string;
  description: string;
  type: 'percent' | 'fixed' | 'freeship';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  used: number;
  limit: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'expired';
  createdAt?: any;
}

// Format tiền tệ
const formatCurrency = (amount: number) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// ========== VOUCHER FORM MODAL ==========
const VoucherFormModal: React.FC<{
  voucher: Voucher | null;
  onClose: () => void;
  onSave: (voucher: Partial<Voucher>) => void;
}> = ({ voucher, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Voucher>>(
    voucher || {
      code: '',
      description: '',
      type: 'percent',
      value: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      limit: 100,
      used: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['value', 'minOrderValue', 'maxDiscount', 'limit', 'used'].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.description) {
      showError('Vui lòng điền đầy đủ mã CODE và mô tả!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{voucher ? 'Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Mã CODE *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: SALE2024"
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group">
              <label>Loại Giảm Giá</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="percent">Phần Trăm (%)</option>
                <option value="fixed">Số Tiền Cố Định (VNĐ)</option>
                <option value="freeship">Miễn Phí Vận Chuyển</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Mô Tả *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Giảm 30% cho đơn hàng tối thiểu 500K"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Giá Trị</label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder={formData.type === 'percent' ? '30' : '50000'}
              />
              <small>{formData.type === 'percent' ? '(%)' : '(VNĐ)'}</small>
            </div>
            <div className="form-group">
              <label>Đơn Tối Thiểu (VNĐ)</label>
              <input
                type="number"
                name="minOrderValue"
                value={formData.minOrderValue}
                onChange={handleChange}
                placeholder="500000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Giảm Tối Đa (VNĐ)</label>
              <input
                type="number"
                name="maxDiscount"
                value={formData.maxDiscount}
                onChange={handleChange}
                placeholder="100000"
              />
            </div>
            <div className="form-group">
              <label>Giới Hạn Số Lần</label>
              <input
                type="number"
                name="limit"
                value={formData.limit}
                onChange={handleChange}
                placeholder="100"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ngày Bắt Đầu</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Ngày Kết Thúc</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Trạng Thái</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="active">Đang Hoạt Động</option>
              <option value="paused">Tạm Dừng</option>
              <option value="expired">Đã Hết Hạn</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
            <button type="submit" className="btn-save">Lưu Mã</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Component Metric Voucher
const VoucherMetrics: React.FC<{
  totalVouchers: number;
  activeVouchers: number;
  totalUsage: number;
}> = ({ totalVouchers, activeVouchers, totalUsage }) => {

  return (
    <div className="metrics-grid">
      <div className="metric-card metric-total">
        <p className="metric-title">Tổng Số Mã Giảm Giá</p>
        <h3 className="metric-value">{totalVouchers}</h3>
      </div>
      <div className="metric-card metric-active">
        <p className="metric-title">Mã Đang Hoạt Động</p>
        <h3 className="metric-value">{activeVouchers}</h3>
      </div>
      <div className="metric-card metric-usage">
        <p className="metric-title">Tổng Lượt Sử Dụng</p>
        <h3 className="metric-value">{totalUsage.toLocaleString('vi-VN')}</h3>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========
export default function AdminVoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // ========== FETCH DATA ==========
  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vouchers, searchQuery, statusFilter, typeFilter]);

  const fetchVouchers = async () => {
    try {
      const q = query(collection(db, 'vouchers'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher));
      setVouchers(data);
      setFilteredVouchers(data);
    } catch (error: any) {
      console.error('Fetch vouchers error:', error);
      showError('Lỗi khi tải danh sách voucher!');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vouchers];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.type === typeFilter);
    }

    setFilteredVouchers(filtered);
  };

  // ========== CRUD OPERATIONS ==========
  const handleSave = async (voucherData: Partial<Voucher>) => {
    try {
      if (editingVoucher) {
        // Update
        const docRef = doc(db, 'vouchers', editingVoucher.id);
        await updateDoc(docRef, { ...voucherData });
        showSuccess('Cập nhật voucher thành công!');
      } else {
        // Create
        await addDoc(collection(db, 'vouchers'), {
          ...voucherData,
          code: voucherData.code?.toUpperCase(),
          used: 0,
          createdAt: serverTimestamp(),
        });
        showSuccess('Tạo voucher mới thành công!');
      }
      fetchVouchers();
      setShowForm(false);
      setEditingVoucher(null);
    } catch (error: any) {
      console.error('Save voucher error:', error);
      showError('Lỗi khi lưu voucher: ' + error.message);
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
    try {
      await deleteDoc(doc(db, 'vouchers', id));
      showSuccess('Xóa voucher thành công!');
      fetchVouchers();
    } catch (error: any) {
      console.error('Delete voucher error:', error);
      showError('Lỗi khi xóa voucher!');
    }
  };

  const handleToggleStatus = async (voucher: Voucher) => {
    try {
      const newStatus = voucher.status === 'active' ? 'paused' : 'active';
      const docRef = doc(db, 'vouchers', voucher.id);
      await updateDoc(docRef, { status: newStatus });
      showSuccess(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'tạm dừng'} voucher!`);
      fetchVouchers();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      showError('Lỗi khi thay đổi trạng thái!');
    }
  };

  // ========== HELPERS ==========
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'percent': return 'Phần trăm';
      case 'fixed': return 'Số tiền';
      case 'freeship': return 'Miễn phí ship';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Đang Hoạt Động';
      case 'paused': return 'Tạm Dừng';
      case 'expired': return 'Đã Hết Hạn';
      default: return status;
    }
  };

  const formatValue = (voucher: Voucher) => {
    if (voucher.type === 'percent') return `${voucher.value}%`;
    if (voucher.type === 'freeship') return 'Miễn phí';
    return formatCurrency(voucher.value);
  };

  const statusColors: Record<string, string> = {
    active: 'status-active',
    paused: 'status-paused',
    expired: 'status-expired',
  };

  const totalUsage = vouchers.reduce((sum, v) => sum + (v.used || 0), 0);
  const activeCount = vouchers.filter(v => v.status === 'active').length;

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <main className="content">
        <header className="content-header">
          <h1 className="content-title">Quản Lý Voucher & Mã Giảm Giá</h1>
          <button className="btn-create" onClick={() => { setEditingVoucher(null); setShowForm(true); }}>
            <span>🎟️</span> Tạo Mã Giảm Giá Mới
          </button>
        </header>

        <VoucherMetrics totalVouchers={vouchers.length} activeVouchers={activeCount} totalUsage={totalUsage} />

        <div className="filter-bar">
          <input 
            type="text" 
            placeholder="Tìm kiếm theo Mã CODE, Mô tả..." 
            className="filter-input" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Lọc theo Trạng Thái</option>
            <option value="active">Đang Hoạt Động</option>
            <option value="expired">Đã Hết Hạn</option>
            <option value="paused">Tạm Dừng</option>
          </select>
          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">Lọc theo Loại</option>
            <option value="percent">Phần trăm</option>
            <option value="fixed">Số tiền</option>
            <option value="freeship">Miễn phí ship</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
        ) : (
          <div className="table-container">
            <table className="voucher-table">
              <thead>
                <tr>
                  <th>Mã VOUCHER</th>
                  <th>Mô Tả</th>
                  <th>Loại</th>
                  <th>Giá Trị</th>
                  <th>Đã Dùng</th>
                  <th>Giới Hạn</th>
                  <th>Hiệu Lực</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                      Không tìm thấy voucher nào
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map(v => (
                    <tr key={v.id} className="voucher-row">
                      <td className="voucher-id">{v.code}</td>
                      <td>{v.description}</td>
                      <td>{getTypeLabel(v.type)}</td>
                      <td><strong>{formatValue(v)}</strong></td>
                      <td>{v.used || 0}</td>
                      <td>{v.limit || 'Không giới hạn'}</td>
                      <td className="validity">
                        {v.startDate && new Date(v.startDate).toLocaleDateString('vi-VN')} - {v.endDate && new Date(v.endDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td><span className={`status ${statusColors[v.status]}`}>{getStatusLabel(v.status)}</span></td>
                      <td className="action-buttons">
                        <button 
                          className="btn-toggle"
                          onClick={() => handleToggleStatus(v)}
                          title={v.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
                        >
                          {v.status === 'active' ? '⏸ Ngừng' : '▶ Bật'}
                        </button>
                        <button className="btn-edit" onClick={() => handleEdit(v)}>✏️ Sửa</button>
                        <button className="btn-delete" onClick={() => handleDelete(v.id)}>🗑️ Xóa</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="table-pagination">
              <span>Hiển thị {filteredVouchers.length} mã giảm giá</span>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <VoucherFormModal
            voucher={editingVoucher}
            onClose={() => { setShowForm(false); setEditingVoucher(null); }}
            onSave={handleSave}
          />
        )}

        </main>
      </div>
    </div>
  );
}

