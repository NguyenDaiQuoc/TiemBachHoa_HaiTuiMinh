import React, { useState, useEffect } from "react";
import { adminDb as db, adminStorage as storage, adminAuth as auth } from "../../firebase-admin";
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
} from "firebase/firestore";
import {
  ref as storageRef,
} from "firebase/storage";
import uploadWithRetries from "../../utils/storage";
import { showSuccess, showError } from "../../utils/toast";
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/marketing.css";

// ========== INTERFACES ==========
interface Coupon {
  id: string;
  code: string;
  name: string;
  type: 'percent' | 'fixed' | 'freeship';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  used: number;
  limit: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'expired';
  description: string;
  createdAt?: any;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  recipientCount: number;
  sentCount: number;
  openRate: number;
  clickRate: number;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledDate?: string;
  createdAt?: any;
}

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  position: 'hero' | 'sidebar' | 'footer';
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  clicks: number;
  createdAt?: any;
}

const formatCurrency = (amount: number) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// ========== METRICS COMPONENT ==========
const MarketingMetrics: React.FC<{
  totalCoupons: number;
  activeCampaigns: number;
  emailSubscribers: number;
}> = ({ totalCoupons, activeCampaigns, emailSubscribers }) => {
  return (
    <div className="metrics-grid">
      <div className="metric-card border-primary">
        <p className="metric-label">Tổng Mã Giảm Giá</p>
        <h3 className="metric-value">{totalCoupons}</h3>
      </div>
      <div className="metric-card border-green">
        <p className="metric-label">Chiến Dịch Đang Chạy</p>
        <h3 className="metric-value text-green">{activeCampaigns}</h3>
      </div>
      <div className="metric-card border-blue">
        <p className="metric-label">Email Marketing</p>
        <h3 className="metric-value text-blue">{emailSubscribers.toLocaleString('vi-VN')}</h3>
      </div>
    </div>
  );
};

// ========== COUPON FORM MODAL ==========
const CouponFormModal: React.FC<{
  coupon: Coupon | null;
  onClose: () => void;
  onSave: (coupon: Partial<Coupon>) => void;
}> = ({ coupon, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Coupon>>(
    coupon || {
      code: '',
      name: '',
      type: 'percent',
      value: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      limit: 100,
      used: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      description: '',
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
    if (!formData.code || !formData.name) {
      showError('Vui lòng điền đầy đủ thông tin mã code và tên!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{coupon ? 'Sửa Mã Giảm Giá' : 'Thêm Mã Giảm Giá Mới'}</h2>
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
              />
            </div>
            <div className="form-group">
              <label>Tên Chiến Dịch *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Giảm giá tháng 12"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Loại Giảm Giá</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="percent">Phần Trăm (%)</option>
                <option value="fixed">Số Tiền Cố Định (VNĐ)</option>
                <option value="freeship">Miễn Phí Vận Chuyển</option>
              </select>
            </div>
            <div className="form-group">
              <label>Giá Trị</label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder={formData.type === 'percent' ? '15' : '50000'}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Đơn Hàng Tối Thiểu (VNĐ)</label>
              <input
                type="number"
                name="minOrderValue"
                value={formData.minOrderValue}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Giảm Tối Đa (VNĐ)</label>
              <input
                type="number"
                name="maxDiscount"
                value={formData.maxDiscount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Giới Hạn Số Lần Dùng</label>
              <input
                type="number"
                name="limit"
                value={formData.limit}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Trạng Thái</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Đang Hoạt Động</option>
                <option value="paused">Tạm Dừng</option>
                <option value="expired">Hết Hạn</option>
              </select>
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
            <label>Mô Tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Mô tả chi tiết về chương trình..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
            <button type="submit" className="btn-save">Lưu Mã Giảm Giá</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========== EMAIL CAMPAIGN FORM MODAL ==========
const EmailCampaignFormModal: React.FC<{
  campaign: EmailCampaign | null;
  onClose: () => void;
  onSave: (campaign: Partial<EmailCampaign>) => void;
}> = ({ campaign, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<EmailCampaign>>(
    campaign || {
      name: '',
      subject: '',
      content: '',
      recipientCount: 0,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      status: 'draft',
      scheduledDate: '',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['recipientCount', 'sentCount', 'openRate', 'clickRate'].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.content) {
      showError('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{campaign ? 'Sửa Chiến Dịch Email' : 'Tạo Chiến Dịch Email Mới'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên Chiến Dịch *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Khuyến mãi tháng 12"
              required
            />
          </div>

          <div className="form-group">
            <label>Tiêu Đề Email *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="🎉 Giảm giá sốc - Chỉ trong hôm nay!"
              required
            />
          </div>

          <div className="form-group">
            <label>Nội Dung Email *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={8}
              placeholder="Nhập nội dung email HTML hoặc text..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Trạng Thái</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="draft">Nháp</option>
                <option value="scheduled">Đã Lên Lịch</option>
                <option value="sent">Đã Gửi</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ngày Gửi</label>
              <input
                type="datetime-local"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Số Người Nhận</label>
              <input
                type="number"
                name="recipientCount"
                value={formData.recipientCount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Đã Gửi</label>
              <input
                type="number"
                name="sentCount"
                value={formData.sentCount}
                onChange={handleChange}
                placeholder="0"
                readOnly
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
            <button type="submit" className="btn-save">Lưu Chiến Dịch</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========== BANNER FORM MODAL ==========
const BannerFormModal: React.FC<{
  banner: Banner | null;
  onClose: () => void;
  onSave: (banner: Partial<Banner>) => void;
}> = ({ banner, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Banner>>(
    banner || {
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      position: 'hero',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      clicks: 0,
    }
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'clicks' ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!auth.currentUser) {
      showError('Vui lòng đăng nhập để upload hình ảnh!');
      return;
    }

    const file = e.target.files[0];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `banners/${Date.now()}_${safeName}`;
    const sRef = storageRef(storage, path);

    setUploading(true);
    setUploadProgress(0);

    try {
      const { url: downloadURL } = await uploadWithRetries(sRef, file as any, {
        maxRetries: 3,
        onProgress: (pct: number) => setUploadProgress(pct),
      });

      setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
      showSuccess('Tải ảnh banner thành công!');
    } catch (error: any) {
      console.error('Upload failed:', error);
      showError('Lỗi khi tải ảnh lên: ' + (error?.message || JSON.stringify(error)));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleGenerateAIImage = async () => {
    if (!aiPrompt || aiPrompt.trim().length < 10) {
      showError('Vui lòng nhập mô tả chi tiết hơn (ít nhất 10 ký tự)!');
      return;
    }

    if (!auth.currentUser) {
      showError('Vui lòng đăng nhập để sử dụng AI!');
      return;
    }

    setGeneratingAI(true);
    try {
      showSuccess('Đang tạo ảnh từ AI... Vui lòng đợi 10-20 giây!');

      // Call OpenAI DALL-E API
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `Create a professional e-commerce banner image for a grocery store with the following description: ${aiPrompt}. Style: modern, vibrant, eye-catching, suitable for website hero section.`,
          n: 1,
          size: '1792x1024', // Landscape ratio perfect for banners
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API call failed');
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;

      // Download image from OpenAI URL and upload to Firebase Storage
      const imageResponse = await fetch(imageUrl);
      const blob = await imageResponse.blob();
      
      const path = `banners/ai_generated_${Date.now()}.png`;
      const sRef = storageRef(storage, path);

      setUploadProgress(0);
      setUploading(true);

      try {
        const { url: downloadURL } = await uploadWithRetries(sRef, blob as any, {
          maxRetries: 3,
          onProgress: (pct: number) => setUploadProgress(pct),
        });

        setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
        showSuccess('✅ Tạo ảnh AI và lưu thành công!');
      } catch (error: any) {
        console.error('Upload to Firebase failed:', error);
        showError('Lỗi khi lưu ảnh: ' + (error?.message || JSON.stringify(error)));
      } finally {
        setUploading(false);
        setGeneratingAI(false);
        setUploadProgress(0);
      }

    } catch (error: any) {
      console.error('AI generation error:', error);
      if (error.message?.includes('API key')) {
        showError('⚠️ Chưa cấu hình OpenAI API Key! Vui lòng thêm VITE_OPENAI_API_KEY vào file .env');
      } else if (error.message?.includes('quota')) {
        showError('⚠️ Đã hết quota OpenAI API. Vui lòng kiểm tra billing!');
      } else {
        showError('Lỗi tạo ảnh AI: ' + error.message);
      }
      setGeneratingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) {
      showError('Vui lòng điền tiêu đề và upload hình ảnh!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{banner ? 'Sửa Banner' : 'Thêm Banner Mới'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tiêu Đề *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Khuyến mãi cuối năm"
              required
            />
          </div>

          <div className="form-group">
            <label>Mô Tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Mô tả ngắn về banner..."
            />
          </div>

          <div className="form-group">
            <label>Hình Ảnh Banner *</label>
            
            {/* AI Image Generation Section */}
            <div className="ai-generator-section">
              <div className="ai-header">
                <span className="ai-icon">🤖</span>
                <h4>Tạo Ảnh Bằng AI</h4>
              </div>
              <div className="ai-input-group">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="VD: Banner khuyến mãi Tết với màu đỏ vàng, có hình bánh chưng, mai vàng, phong bì lì xì, không gian cửa hàng tạp hóa..."
                  rows={3}
                  disabled={generatingAI || uploading}
                  className="ai-prompt-input"
                />
                <button
                  type="button"
                  onClick={handleGenerateAIImage}
                  disabled={generatingAI || uploading || !aiPrompt}
                  className="btn-ai-generate"
                >
                  {generatingAI ? '🎨 Đang tạo ảnh...' : '✨ Tạo Ảnh AI'}
                </button>
              </div>
              {generatingAI && (
                <div className="ai-loading">
                  <div className="ai-spinner"></div>
                  <p>AI đang vẽ banner cho bạn... (10-20 giây)</p>
                </div>
              )}
            </div>

            <div className="upload-divider">
              <span>HOẶC</span>
            </div>

            {/* Manual Upload Section */}
            <div className="banner-image-upload">
              <label className="upload-label">
                📷 Upload Hình Ảnh Có Sẵn
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={uploading || generatingAI}
                  style={{ display: 'none' }}
                />
              </label>
              {uploading && !generatingAI && (
                <div className="upload-progress">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  <span>{uploadProgress}%</span>
                </div>
              )}
              {uploading && generatingAI && (
                <div className="upload-progress">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  <span>Đang lưu ảnh AI: {uploadProgress}%</span>
                </div>
              )}
              {formData.imageUrl && (
                <div className="banner-preview">
                  <img src={formData.imageUrl} alt="Banner Preview" />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="btn-remove-image"
                  >✕ Xóa</button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Link URL</label>
            <input
              type="url"
              name="linkUrl"
              value={formData.linkUrl}
              onChange={handleChange}
              placeholder="https://example.com/promotion"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vị Trí Hiển Thị</label>
              <select name="position" value={formData.position} onChange={handleChange}>
                <option value="hero">Hero (Trang chủ lớn)</option>
                <option value="sidebar">Sidebar (Bên phải)</option>
                <option value="footer">Footer (Chân trang)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Trạng Thái</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Đang Hiển Thị</option>
                <option value="inactive">Ẩn</option>
              </select>
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

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
            <button type="submit" className="btn-save">Lưu Banner</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const coupons = [
  { id: 'SALE15', name: 'Giảm 15% Toàn Bộ', type: 'Phần trăm', value: '15%', used: 120, limit: 500, status: 'Đang Hoạt Động' },
  { id: 'FREESHIP', name: 'Miễn Phí Vận Chuyển', type: 'Vận Chuyển', value: '0 VNĐ', used: 350, limit: 'Không giới hạn', status: 'Đang Hoạt Động' },
  { id: 'NEWUSER50K', name: 'Giảm 50.000 cho KH mới', type: 'Số tiền', value: '50,000 VNĐ', used: 25, limit: 50, status: 'Tạm Dừng' },
];

// ========== MAIN COMPONENT ==========
export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'coupons' | 'emails' | 'banners'>('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // ========== FETCH DATA ==========
  useEffect(() => {
    fetchCoupons();
    fetchCampaigns();
    fetchBanners();
  }, []);

  const fetchCoupons = async () => {
    try {
      const q = query(collection(db, 'vouchers'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
      setCoupons(data);
    } catch (error: any) {
      console.error('Fetch coupons error:', error);
      showError('Lỗi khi tải danh sách mã giảm giá!');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const q = query(collection(db, 'email_campaigns'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailCampaign));
      setCampaigns(data);
    } catch (error: any) {
      console.error('Fetch campaigns error:', error);
    }
  };

  const fetchBanners = async () => {
    try {
      const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
      setBanners(data);
    } catch (error: any) {
      console.error('Fetch banners error:', error);
    }
  };

  // ========== COUPON CRUD ==========
  const handleSaveCoupon = async (couponData: Partial<Coupon>) => {
    try {
      if (editingCoupon) {
        // Update existing
        const docRef = doc(db, 'vouchers', editingCoupon.id);
        await updateDoc(docRef, { ...couponData });
        showSuccess('Cập nhật mã giảm giá thành công!');
      } else {
        // Create new
        await addDoc(collection(db, 'vouchers'), {
          ...couponData,
          used: 0,
          createdAt: serverTimestamp(),
        });
        showSuccess('Thêm mã giảm giá mới thành công!');
      }
      fetchCoupons();
      setShowCouponForm(false);
      setEditingCoupon(null);
    } catch (error: any) {
      console.error('Save coupon error:', error);
      showError('Lỗi khi lưu mã giảm giá: ' + error.message);
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowCouponForm(true);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
    try {
      await deleteDoc(doc(db, 'vouchers', id));
      showSuccess('Xóa mã giảm giá thành công!');
      fetchCoupons();
    } catch (error: any) {
      console.error('Delete coupon error:', error);
      showError('Lỗi khi xóa mã giảm giá!');
    }
  };

  // ========== EMAIL CAMPAIGN CRUD ==========
  const handleSaveCampaign = async (campaignData: Partial<EmailCampaign>) => {
    try {
      if (editingCampaign) {
        const docRef = doc(db, 'email_campaigns', editingCampaign.id);
        await updateDoc(docRef, { ...campaignData });
        showSuccess('Cập nhật chiến dịch email thành công!');
      } else {
        await addDoc(collection(db, 'email_campaigns'), {
          ...campaignData,
          createdAt: serverTimestamp(),
        });
        showSuccess('Tạo chiến dịch email mới thành công!');
      }
      fetchCampaigns();
      setShowEmailForm(false);
      setEditingCampaign(null);
    } catch (error: any) {
      console.error('Save campaign error:', error);
      showError('Lỗi khi lưu chiến dịch: ' + error.message);
    }
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setShowEmailForm(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa chiến dịch này?')) return;
    try {
      await deleteDoc(doc(db, 'email_campaigns', id));
      showSuccess('Xóa chiến dịch thành công!');
      fetchCampaigns();
    } catch (error: any) {
      console.error('Delete campaign error:', error);
      showError('Lỗi khi xóa chiến dịch!');
    }
  };

  // ========== BANNER CRUD ==========
  const handleSaveBanner = async (bannerData: Partial<Banner>) => {
    try {
      if (editingBanner) {
        const docRef = doc(db, 'banners', editingBanner.id);
        await updateDoc(docRef, { ...bannerData });
        showSuccess('Cập nhật banner thành công!');
      } else {
        await addDoc(collection(db, 'banners'), {
          ...bannerData,
          clicks: 0,
          createdAt: serverTimestamp(),
        });
        showSuccess('Thêm banner mới thành công!');
      }
      fetchBanners();
      setShowBannerForm(false);
      setEditingBanner(null);
    } catch (error: any) {
      console.error('Save banner error:', error);
      showError('Lỗi khi lưu banner: ' + error.message);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setShowBannerForm(true);
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa banner này?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
      showSuccess('Xóa banner thành công!');
      fetchBanners();
    } catch (error: any) {
      console.error('Delete banner error:', error);
      showError('Lỗi khi xóa banner!');
    }
  };

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
      case 'expired': return 'Hết Hạn';
      default: return status;
    }
  };

  const statusColors: Record<string, string> = {
    'active': 'status-active',
    'paused': 'status-paused',
    'expired': 'status-expired',
  };

  const activeCoupons = coupons.filter(c => c.status === 'active').length;

  return (
    <div className="admin-page">
      <AdminSidebar />
      <div className="admin-main">
        <div className="page-container">
          <header className="page-header">
            <h1 className="page-title">Quản Lý Marketing & Khuyến Mãi</h1>
          </header>

          <MarketingMetrics
            totalCoupons={coupons.length}
            activeCampaigns={activeCoupons}
            emailSubscribers={campaigns.length}
          />

          <div className="tabs">
            <button
              className={`tab-item ${activeTab === 'coupons' ? 'active' : ''}`}
              onClick={() => setActiveTab('coupons')}
            >
              Mã Giảm Giá (Coupons)
            </button>
            <button
              className={`tab-item ${activeTab === 'emails' ? 'active' : ''}`}
              onClick={() => setActiveTab('emails')}
            >
              Chiến Dịch Email
            </button>
            <button
              className={`tab-item ${activeTab === 'banners' ? 'active' : ''}`}
              onClick={() => setActiveTab('banners')}
            >
              Banner Quảng Cáo
            </button>
          </div>

          {activeTab === 'coupons' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Danh Sách Mã Giảm Giá</h2>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditingCoupon(null);
                    setShowCouponForm(true);
                  }}
                >
                  <span className="icon">🏷️</span> Thêm Mã Mới
                </button>
              </div>

              {loading ? (
                <div className="loading">Đang tải...</div>
              ) : coupons.length === 0 ? (
                <div className="empty-state">Chưa có mã giảm giá nào. Click "Thêm Mã Mới" để tạo!</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã CODE</th>
                      <th>Tên Chiến Dịch</th>
                      <th>Loại</th>
                      <th>Giá Trị</th>
                      <th>Đã Dùng</th>
                      <th>Giới Hạn</th>
                      <th>Thời Gian</th>
                      <th>Trạng Thái</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(coupon => (
                      <tr key={coupon.id}>
                        <td className="bold">{coupon.code}</td>
                        <td>{coupon.name}</td>
                        <td>{getTypeLabel(coupon.type)}</td>
                        <td>
                          {coupon.type === 'percent'
                            ? `${coupon.value}%`
                            : coupon.type === 'freeship'
                            ? 'Miễn phí'
                            : formatCurrency(coupon.value)}
                        </td>
                        <td>{coupon.used || 0}</td>
                        <td>{coupon.limit || 'Không giới hạn'}</td>
                        <td>
                          {coupon.startDate} → {coupon.endDate || '∞'}
                        </td>
                        <td>
                          <span className={`status ${statusColors[coupon.status]}`}>
                            {getStatusLabel(coupon.status)}
                          </span>
                        </td>
                        <td className="actions">
                          <button className="action-edit" onClick={() => handleEditCoupon(coupon)}>
                            Sửa
                          </button>
                          <button className="action-delete" onClick={() => handleDeleteCoupon(coupon.id)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Chiến Dịch Email Marketing</h2>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditingCampaign(null);
                    setShowEmailForm(true);
                  }}
                >
                  <span className="icon">📧</span> Tạo Chiến Dịch Mới
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="empty-state">
                  Chưa có chiến dịch email nào. Click "Tạo Chiến Dịch Mới" để bắt đầu!
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tên Chiến Dịch</th>
                      <th>Tiêu Đề Email</th>
                      <th>Người Nhận</th>
                      <th>Đã Gửi</th>
                      <th>Tỷ Lệ Mở</th>
                      <th>Tỷ Lệ Click</th>
                      <th>Ngày Gửi</th>
                      <th>Trạng Thái</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(campaign => (
                      <tr key={campaign.id}>
                        <td className="bold">{campaign.name}</td>
                        <td>{campaign.subject}</td>
                        <td>{campaign.recipientCount}</td>
                        <td>{campaign.sentCount}</td>
                        <td>{campaign.openRate}%</td>
                        <td>{campaign.clickRate}%</td>
                        <td>{campaign.scheduledDate || 'Chưa lên lịch'}</td>
                        <td>
                          <span className={`status status-${campaign.status}`}>
                            {campaign.status === 'draft' ? 'Nháp' : campaign.status === 'scheduled' ? 'Đã Lên Lịch' : 'Đã Gửi'}
                          </span>
                        </td>
                        <td className="actions">
                          <button className="action-edit" onClick={() => handleEditCampaign(campaign)}>
                            Sửa
                          </button>
                          <button className="action-delete" onClick={() => handleDeleteCampaign(campaign.id)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'banners' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Banner Quảng Cáo</h2>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditingBanner(null);
                    setShowBannerForm(true);
                  }}
                >
                  <span className="icon">🎨</span> Thêm Banner Mới
                </button>
              </div>

              {banners.length === 0 ? (
                <div className="empty-state">
                  Chưa có banner nào. Click "Thêm Banner Mới" để tạo banner quảng cáo!
                </div>
              ) : (
                <div className="banner-grid">
                  {banners.map(banner => (
                    <div key={banner.id} className="banner-card">
                      <div className="banner-image">
                        <img src={banner.imageUrl} alt={banner.title} />
                        <span className={`banner-status ${banner.status}`}>
                          {banner.status === 'active' ? 'Đang Hiển Thị' : 'Ẩn'}
                        </span>
                      </div>
                      <div className="banner-info">
                        <h3>{banner.title}</h3>
                        <p>{banner.description}</p>
                        <div className="banner-meta">
                          <span className="position-badge">{banner.position}</span>
                          <span className="clicks">👁️ {banner.clicks} clicks</span>
                        </div>
                        <div className="banner-dates">
                          {banner.startDate} → {banner.endDate || '∞'}
                        </div>
                        <div className="banner-actions">
                          <button className="action-edit" onClick={() => handleEditBanner(banner)}>
                            Sửa
                          </button>
                          <button className="action-delete" onClick={() => handleDeleteBanner(banner.id)}>
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showCouponForm && (
            <CouponFormModal
              coupon={editingCoupon}
              onClose={() => {
                setShowCouponForm(false);
                setEditingCoupon(null);
              }}
              onSave={handleSaveCoupon}
            />
          )}

          {showEmailForm && (
            <EmailCampaignFormModal
              campaign={editingCampaign}
              onClose={() => {
                setShowEmailForm(false);
                setEditingCampaign(null);
              }}
              onSave={handleSaveCampaign}
            />
          )}

          {showBannerForm && (
            <BannerFormModal
              banner={editingBanner}
              onClose={() => {
                setShowBannerForm(false);
                setEditingBanner(null);
              }}
              onSave={handleSaveBanner}
            />
          )}
        </div>
      </div>
    </div>
  );
}
