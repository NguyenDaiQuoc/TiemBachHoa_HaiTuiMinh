import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { adminDb as db, adminAuth as auth } from '../../firebase';
import { ref, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { adminStorage as storage } from '../../firebase';
import uploadWithRetries from '../../utils/storage';
import AdminSidebar from '../../components/admin/Sidebar';
import '../../../css/admin/media.css';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function MediaPage() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const mediaDocs = collection(db, 'media');
      const q = query(mediaDocs, orderBy('uploadedAt', 'desc'));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMediaList(docs as any[]);
    } catch (e: any) {
      console.error('Load media error', e);
      setError('Không thể tải hình ảnh. Vui lòng kiểm tra quyền truy cập Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'other';
        
        // Upload to Firebase Storage (with retries)
        const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
        const { url: downloadURL } = await uploadWithRetries(storageRef, file as any, { maxRetries: 3 });

        // Save metadata to Firestore
        await addDoc(collection(db, 'media'), {
          name: file.name,
          type: fileType,
          size: file.size,
          url: downloadURL,
          storagePath: storageRef.fullPath,
          uploadedAt: serverTimestamp(),
          uploadedBy: auth.currentUser?.uid || 'admin',
          mimeType: file.type,
        });
      }
      await loadMedia();
      e.currentTarget.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Tải lên thất bại: ' + (error.message || ''));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (media: any) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tệp này không?')) return;
    try {
      // Delete from Storage
      const storageRef = ref(storage, media.storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'media', media.id));

      await loadMedia();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Xóa thất bại: ' + (error.message || ''));
    }
  };

  const filteredMedia = mediaList.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (!searchTerm) return true;
    return m.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getFileIcon = (type: string) => {
    if (type === 'image') return '🖼️';
    if (type === 'video') return '🎬';
    return '📄';
  };

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <main className="content">
          <header className="content-header">
            <h1 className="content-title">Quản Lý Ảnh & Media</h1>
          </header>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              color: '#991b1b'
            }}>
              <h3 style={{ margin: '0 0 8px 0' }}>⚠️ Lỗi</h3>
              <p style={{ margin: '0 0 16px 0' }}>{error}</p>
              <p style={{ margin: '0', fontSize: '12px', color: '#7f1d1d' }}>
                Vui lòng xem <strong>FIRESTORE_RULES_UPDATE.md</strong> để hướng dẫn khắc phục.
              </p>
            </div>
          )}

          {/* Upload Section */}
          <div className="media-upload-box">
            <div className="upload-area">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" className="upload-label">
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                  <strong>Nhấp để chọn hoặc kéo thả tệp</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Hỗ trợ: JPG, PNG, GIF, MP4, WebM...
                  </div>
                </div>
              </label>
              {uploading && <div className="uploading-text">Đang tải lên...</div>}
            </div>
          </div>

          {/* Filter & Search */}
          <div className="media-controls">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên tệp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
              <option value="all">Tất cả loại</option>
              <option value="image">Ảnh</option>
              <option value="video">Video</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Media Grid */}
          <div className="media-grid">
            {loading ? (
              <div className="media-placeholder">Đang tải danh sách media...</div>
            ) : filteredMedia.length === 0 ? (
              <div className="media-placeholder">Không có tệp nào</div>
            ) : (
              filteredMedia.map((media) => (
                <div key={media.id} className="media-card" onClick={() => setSelectedMedia(media)}>
                  {media.type === 'image' ? (
                    <img src={media.url} alt={media.name} className="media-thumbnail" />
                  ) : (
                    <div className="media-placeholder-icon">{getFileIcon(media.type)}</div>
                  )}
                  <div className="media-info">
                    <div className="media-name">{media.name}</div>
                    <div className="media-meta">
                      {formatFileSize(media.size)} · {media.type}
                    </div>
                  </div>
                  <button
                    className="media-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(media);
                    }}
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Detail Modal */}
          {selectedMedia && (
            <div className="media-modal-overlay" onClick={() => setSelectedMedia(null)}>
              <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
                {selectedMedia.type === 'image' && (
                  <img src={selectedMedia.url} alt={selectedMedia.name} style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '8px' }} />
                )}
                {selectedMedia.type === 'video' && (
                  <video
                    src={selectedMedia.url}
                    controls
                    style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '8px' }}
                  />
                )}
                {selectedMedia.type === 'other' && (
                  <div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                    <div>{selectedMedia.name}</div>
                  </div>
                )}

                <div className="media-detail-info">
                  <h3>{selectedMedia.name}</h3>
                  <div><strong>Loại:</strong> {selectedMedia.type}</div>
                  <div><strong>Kích thước:</strong> {formatFileSize(selectedMedia.size)}</div>
                  <div><strong>Tải lên lúc:</strong> {selectedMedia.uploadedAt && selectedMedia.uploadedAt.toDate ? selectedMedia.uploadedAt.toDate().toLocaleString('vi-VN') : '-'}</div>
                  <div>
                    <strong>URL:</strong>
                    <div className="url-box">
                      {selectedMedia.url}
                      <button
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMedia.url);
                          alert('Đã sao chép vào clipboard');
                        }}
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>
                  <button className="delete-btn" onClick={() => { handleDelete(selectedMedia); setSelectedMedia(null); }}>
                    Xóa tệp
                  </button>
                  <button className="close-btn" onClick={() => setSelectedMedia(null)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

