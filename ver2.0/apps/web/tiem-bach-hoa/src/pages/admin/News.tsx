import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminSidebar from '../../components/admin/Sidebar';
import '../../../css/admin/news.css';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'promotion' | 'maintenance' | 'update';
  priority: 'low' | 'medium' | 'high';
  published: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function AdminNewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    type: 'announcement' | 'promotion' | 'maintenance' | 'update';
    priority: 'low' | 'medium' | 'high';
    published: boolean;
  }>({
    title: '',
    content: '',
    type: 'announcement',
    priority: 'medium',
    published: true,
  });

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NewsItem[];
      setNewsList(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Lỗi tải thông báo:', err);
      setError('Không thể tải thông báo. Vui lòng kiểm tra quyền truy cập Firestore.');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'news', editingId), {
          ...formData,
          updatedAt: Timestamp.now(),
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'news'), {
          ...formData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      setFormData({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'medium',
        published: true,
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa?')) return;
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleEdit = (item: NewsItem) => {
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      priority: item.priority,
      published: item.published,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      announcement: 'Thông báo',
      promotion: 'Khuyến mãi',
      maintenance: 'Bảo trì',
      update: 'Cập nhật',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
    };
    return colors[priority] || '#FF9800';
  };

  const formatDate = (timestamp: Timestamp) => {
    return new Date(timestamp.toMillis()).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="admin-page">
        <AdminSidebar />
        <div className="admin-main">
          <div className="news-container">
            <div className="news-placeholder">Đang tải...</div>
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
          <div className="news-container">
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
        <div className="news-container">
          {/* Header */}
          <div className="news-header">
            <div>
              <h1 className="news-title">Tin Tức & Thông Báo</h1>
              <p className="news-sub">Quản lý các thông báo hệ thống</p>
            </div>
            <button 
              className="btn-add-news"
              onClick={() => {
                setFormData({
                  title: '',
                  content: '',
                  type: 'announcement',
                  priority: 'medium',
                  published: true,
                });
                setEditingId(null);
                setShowForm(!showForm);
              }}
            >
              + Thêm Thông Báo
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="news-form-container">
              <form onSubmit={handleSubmit} className="news-form">
                <div className="form-group">
                  <label>Tiêu Đề</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nội Dung</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Nhập nội dung"
                    rows={5}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Loại</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="announcement">Thông báo</option>
                      <option value="promotion">Khuyến mãi</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="update">Cập nhật</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Mức Độ Ưu Tiên</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung Bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                </div>

                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  />
                  <label htmlFor="published">Công Bố Ngay</label>
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

          {/* News List */}
          <div className="news-list">
            {newsList.length === 0 ? (
              <div className="news-empty">Chưa có thông báo</div>
            ) : (
              newsList.map((item) => (
                <div key={item.id} className="news-card">
                  <div className="news-card-header">
                    <div className="news-card-title-section">
                      <h3 className="news-card-title">{item.title}</h3>
                      <div className="news-card-badges">
                        <span
                          className="badge badge-type"
                          style={{ background: getPriorityColor(item.priority) }}
                        >
                          {getTypeLabel(item.type)}
                        </span>
                        <span
                          className="badge badge-priority"
                          style={{ background: getPriorityColor(item.priority) }}
                        >
                          {item.priority === 'low' ? 'Thấp' : item.priority === 'medium' ? 'Trung Bình' : 'Cao'}
                        </span>
                        {item.published ? (
                          <span className="badge badge-published">Công Bố</span>
                        ) : (
                          <span className="badge badge-draft">Nháp</span>
                        )}
                      </div>
                    </div>
                    <div className="news-card-actions">
                      <button
                        className="btn-edit-news"
                        onClick={() => handleEdit(item)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete-news"
                        onClick={() => handleDelete(item.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="news-card-content">{item.content}</p>

                  <div className="news-card-footer">
                    <span className="news-date">
                      Cập nhật: {formatDate(item.updatedAt)}
                    </span>
                    {item.createdAt !== item.updatedAt && (
                      <span className="news-date-created">
                        Tạo: {formatDate(item.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
