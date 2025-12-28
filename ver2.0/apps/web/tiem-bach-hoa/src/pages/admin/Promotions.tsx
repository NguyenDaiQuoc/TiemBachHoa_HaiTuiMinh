import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { adminDb as db } from '../../firebase';
import AdminSidebar from '../../components/admin/Sidebar';
import '../../../css/admin/promotions.css';

interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'shipping' | 'bundle' | 'special';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  startDate: Timestamp;
  endDate: Timestamp;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function AdminPromotionPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: 'discount' | 'shipping' | 'bundle' | 'special';
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchase: number;
    startDate: string;
    endDate: string;
    active: boolean;
  }>({
    name: '',
    description: '',
    type: 'discount',
    discountType: 'percentage',
    discountValue: 0,
    minPurchase: 0,
    startDate: '',
    endDate: '',
    active: true,
  });

  useEffect(() => {
    const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Promotion[];
      setPromotions(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Lỗi tải khuyến mãi:', err);
      setError('Không thể tải khuyến mãi. Vui lòng kiểm tra quyền truy cập Firestore.');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startTimestamp = Timestamp.fromDate(new Date(formData.startDate));
      const endTimestamp = Timestamp.fromDate(new Date(formData.endDate));

      if (editingId) {
        await updateDoc(doc(db, 'promotions', editingId), {
          ...formData,
          startDate: startTimestamp,
          endDate: endTimestamp,
          updatedAt: Timestamp.now(),
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'promotions'), {
          ...formData,
          startDate: startTimestamp,
          endDate: endTimestamp,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      setFormData({
        name: '',
        description: '',
        type: 'discount',
        discountType: 'percentage',
        discountValue: 0,
        minPurchase: 0,
        startDate: '',
        endDate: '',
        active: true,
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa khuyến mãi này?')) return;
    try {
      await deleteDoc(doc(db, 'promotions', id));
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleEdit = (promo: Promotion) => {
    setFormData({
      name: promo.name,
      description: promo.description,
      type: promo.type,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minPurchase: promo.minPurchase,
      startDate: new Date(promo.startDate.toMillis()).toISOString().split('T')[0],
      endDate: new Date(promo.endDate.toMillis()).toISOString().split('T')[0],
      active: promo.active,
    });
    setEditingId(promo.id);
    setShowForm(true);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, 'promotions', id), {
        active: !currentActive,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const getStatus = (promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.startDate.toMillis());
    const end = new Date(promo.endDate.toMillis());

    if (!promo.active) return 'Tạm Dừng';
    if (now < start) return 'Sắp Diễn Ra';
    if (now > end) return 'Đã Kết Thúc';
    return 'Đang Hoạt Động';
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      discount: 'Giảm Giá',
      shipping: 'Miễn Phí Ship',
      bundle: 'Combo',
      special: 'Đặc Biệt',
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (timestamp: Timestamp) => {
    return new Date(timestamp.toMillis()).toLocaleDateString('vi-VN');
  };

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const status = getStatus(promo);
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && status === 'Đang Hoạt Động') ||
                         (filterStatus === 'upcoming' && status === 'Sắp Diễn Ra') ||
                         (filterStatus === 'ended' && status === 'Đã Kết Thúc') ||
                         (filterStatus === 'paused' && status === 'Tạm Dừng');
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => getStatus(p) === 'Đang Hoạt Động').length,
    upcoming: promotions.filter(p => getStatus(p) === 'Sắp Diễn Ra').length,
  };

  if (loading) {
    return (
      <div className="admin-page">
        <AdminSidebar />
        <div className="admin-main">
          <div className="promotion-container">
            <div className="promotion-placeholder">Đang tải khuyến mãi...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <AdminSidebar />
        <div className="admin-main">
          <div className="promotion-container">
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '24px',
              marginTop: '24px',
              color: '#991b1b'
            }}>
              <h3 style={{ margin: '0 0 8px 0' }}>⚠️ Lỗi</h3>
              <p style={{ margin: '0 0 16px 0' }}>{error}</p>
              <p style={{ margin: '0', fontSize: '12px', color: '#7f1d1d' }}>
                Vui lòng xem <strong>FIRESTORE_RULES_UPDATE.md</strong> để hướng dẫn khắc phục.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <div className="promotion-container">
          {/* Header */}
          <div className="promotion-header">
            <div>
              <h1 className="promotion-title">Quản Lý Khuyến Mãi & Ưu Đãi</h1>
              <p className="promotion-sub">Tổng cộng {stats.total} chương trình</p>
            </div>
            <button
              className="btn-add-promotion"
              onClick={() => {
                setFormData({
                  name: '',
                  description: '',
                  type: 'discount',
                  discountType: 'percentage',
                  discountValue: 0,
                  minPurchase: 0,
                  startDate: '',
                  endDate: '',
                  active: true,
                });
                setEditingId(null);
                setShowForm(!showForm);
              }}
            >
              ✨ Tạo Khuyến Mãi Mới
            </button>
          </div>

          {/* Metrics */}
          <div className="promotion-metrics">
            <div className="metric-card metric-total">
              <p className="metric-label">Tổng Chương Trình</p>
              <h3 className="metric-value">{stats.total}</h3>
            </div>
            <div className="metric-card metric-active">
              <p className="metric-label">Đang Hoạt Động</p>
              <h3 className="metric-value">{stats.active}</h3>
            </div>
            <div className="metric-card metric-upcoming">
              <p className="metric-label">Sắp Diễn Ra</p>
              <h3 className="metric-value">{stats.upcoming}</h3>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="promotion-form-container">
              <form onSubmit={handleSubmit} className="promotion-form">
                <div className="form-group">
                  <label>Tên Chương Trình</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Flash Sale Cuối Tuần"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mô Tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả chi tiết về chương trình"
                    rows={3}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Loại Khuyến Mãi</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="discount">Giảm Giá</option>
                      <option value="shipping">Miễn Phí Ship</option>
                      <option value="bundle">Combo</option>
                      <option value="special">Đặc Biệt</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Kiểu Giảm Giá</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    >
                      <option value="percentage">Phần Trăm (%)</option>
                      <option value="fixed">Số Tiền Cố Định (VNĐ)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Giá Trị Giảm</label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      placeholder={formData.discountType === 'percentage' ? '10' : '50000'}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Đơn Hàng Tối Thiểu (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.minPurchase}
                      onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày Bắt Đầu</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Ngày Kết Thúc</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <label htmlFor="active">Kích hoạt ngay</label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    {editingId ? 'Cập Nhật' : 'Tạo Mới'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="promotion-filters">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chương trình..."
              className="filter-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ended">Đã kết thúc</option>
              <option value="paused">Tạm dừng</option>
            </select>
          </div>

          {/* Promotions List */}
          <div className="promotion-list">
            {filteredPromotions.length === 0 ? (
              <div className="promotion-empty">Không có chương trình khuyến mãi nào</div>
            ) : (
              filteredPromotions.map((promo) => {
                const status = getStatus(promo);
                return (
                  <div key={promo.id} className="promotion-card">
                    <div className="promo-card-header">
                      <div className="promo-card-title-section">
                        <h3 className="promo-card-title">{promo.name}</h3>
                        <p className="promo-card-description">{promo.description}</p>
                        <div className="promo-card-meta">
                          <span className="meta-item">📁 {getTypeLabel(promo.type)}</span>
                          <span className="meta-item">
                            💰 {promo.discountType === 'percentage' 
                              ? `${promo.discountValue}%` 
                              : formatCurrency(promo.discountValue)}
                          </span>
                          <span className="meta-item">
                            📅 {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                          </span>
                          {promo.minPurchase > 0 && (
                            <span className="meta-item">🛒 Tối thiểu {formatCurrency(promo.minPurchase)}</span>
                          )}
                        </div>
                      </div>
                      <div className="promo-card-badges">
                        <span className={`badge badge-${status === 'Đang Hoạt Động' ? 'active' : status === 'Sắp Diễn Ra' ? 'upcoming' : status === 'Tạm Dừng' ? 'paused' : 'ended'}`}>
                          {status}
                        </span>
                      </div>
                    </div>

                    <div className="promo-card-actions">
                      <button
                        className="btn-edit-promo"
                        onClick={() => handleEdit(promo)}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className={`btn-toggle-promo ${promo.active ? 'active' : 'inactive'}`}
                        onClick={() => toggleActive(promo.id, promo.active)}
                      >
                        {promo.active ? '⏸️ Tạm Dừng' : '▶️ Kích Hoạt'}
                      </button>
                      <button
                        className="btn-delete-promo"
                        onClick={() => handleDelete(promo.id)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
