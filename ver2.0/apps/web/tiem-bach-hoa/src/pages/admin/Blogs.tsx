import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, Timestamp, where } from 'firebase/firestore';
import { adminDb as db } from '../../firebase';
import AdminSidebar from '../../components/admin/Sidebar';
import '../../../css/admin/blogs.css';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  featured: boolean;
  published: boolean;
  views: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'Tin Tức',
    author: 'Admin',
    featured: false,
    published: true,
  });

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        views: 0,
        ...doc.data(),
      })) as BlogPost[];
      setPosts(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Lỗi tải bài viết:', err);
      setError('Không thể tải bài viết. Vui lòng kiểm tra quyền truy cập Firestore.');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'blogs', editingId), {
          ...formData,
          updatedAt: Timestamp.now(),
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'blogs'), {
          ...formData,
          views: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      setFormData({
        title: '',
        description: '',
        content: '',
        category: 'Tin Tức',
        author: 'Admin',
        featured: false,
        published: true,
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa bài viết này?')) return;
    try {
      await deleteDoc(doc(db, 'blogs', id));
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      description: post.description,
      content: post.content,
      category: post.category,
      author: post.author,
      featured: post.featured,
      published: post.published,
    });
    setEditingId(post.id);
    setShowForm(true);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'published' && post.published) ||
                         (filterStatus === 'draft' && !post.published);
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(posts.map(p => p.category))];
  const stats = {
    total: posts.length,
    published: posts.filter(p => p.published).length,
    draft: posts.filter(p => !p.published).length,
  };

  const formatDate = (timestamp: Timestamp) => {
    return new Date(timestamp.toMillis()).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="admin-page">
        <AdminSidebar />
        <div className="admin-main">
          <div className="blog-container">
            <div className="blog-placeholder">Đang tải bài viết...</div>
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
          <div className="blog-container">
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
        <div className="blog-container">
          {/* Header */}
          <div className="blog-header">
            <div>
              <h1 className="blog-title">Quản Lý Bài Viết Blog</h1>
              <p className="blog-sub">Tổng cộng {stats.total} bài viết</p>
            </div>
            <button
              className="btn-add-blog"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  content: '',
                  category: 'Tin Tức',
                  author: 'Admin',
                  featured: false,
                  published: true,
                });
                setEditingId(null);
                setShowForm(!showForm);
              }}
            >
              ✏️ Viết Bài Mới
            </button>
          </div>

          {/* Metrics */}
          <div className="blog-metrics">
            <div className="metric-card metric-total">
              <p className="metric-label">Tổng Bài Viết</p>
              <h3 className="metric-value">{stats.total}</h3>
            </div>
            <div className="metric-card metric-published">
              <p className="metric-label">Đã Xuất Bản</p>
              <h3 className="metric-value">{stats.published}</h3>
            </div>
            <div className="metric-card metric-draft">
              <p className="metric-label">Bản Nháp</p>
              <h3 className="metric-value">{stats.draft}</h3>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="blog-form-container">
              <form onSubmit={handleSubmit} className="blog-form">
                <div className="form-group">
                  <label>Tiêu Đề</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tiêu đề bài viết"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mô Tả Ngắn</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả ngắn gọn (hiển thị trong danh sách)"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nội Dung</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Nhập nội dung bài viết"
                    rows={8}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Danh Mục</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Công Thức, Mẹo Vặt, Tin Tức..."
                      list="categories"
                    />
                    <datalist id="categories">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label>Tác Giả</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="Tên tác giả"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group checkbox">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                    <label htmlFor="featured">Ghim bài viết (nổi bật)</label>
                  </div>

                  <div className="form-group checkbox">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    />
                    <label htmlFor="published">Xuất bản ngay</label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    {editingId ? 'Cập Nhật Bài Viết' : 'Tạo Bài Viết'}
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
          <div className="blog-filters">
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, tác giả..."
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
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
            </select>
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Posts List */}
          <div className="blog-posts">
            {filteredPosts.length === 0 ? (
              <div className="blog-empty">Không có bài viết nào</div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className="blog-post-card">
                  <div className="post-card-header">
                    <div className="post-card-title-section">
                      <h3 className="post-card-title">
                        {post.featured && <span className="featured-star">⭐</span>}
                        {post.title}
                      </h3>
                      <p className="post-card-description">{post.description}</p>
                      <div className="post-card-meta">
                        <span className="meta-item">📁 {post.category}</span>
                        <span className="meta-item">✍️ {post.author}</span>
                        <span className="meta-item">📅 {formatDate(post.createdAt)}</span>
                        <span className="meta-item">👁️ {post.views} lượt xem</span>
                      </div>
                    </div>
                    <div className="post-card-badges">
                      {post.published ? (
                        <span className="badge badge-published">Xuất Bản</span>
                      ) : (
                        <span className="badge badge-draft">Nháp</span>
                      )}
                    </div>
                  </div>

                  <div className="post-card-actions">
                    <button
                      className="btn-edit-post"
                      onClick={() => handleEdit(post)}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="btn-delete-post"
                      onClick={() => handleDelete(post.id)}
                    >
                      🗑️ Xóa
                    </button>
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
