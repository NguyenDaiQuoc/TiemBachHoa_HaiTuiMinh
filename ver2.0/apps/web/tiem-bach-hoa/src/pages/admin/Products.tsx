import React, { useState, useEffect, useMemo } from "react";
// Import các hàm CRUD cần thiết từ Firebase Firestore
import { adminDb as db, adminStorage as storage, adminAuth as auth } from "../../firebase-admin";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
} from "firebase/storage";
import uploadWithRetries from '../../utils/storage';
import { showSuccess, showError } from "../../utils/toast";

// Giả sử đường dẫn này là đúng
import AdminSidebar from "../../components/admin/Sidebar";
import "../../../css/admin/products.css"; // Đảm bảo CSS này hỗ trợ bố cục bảng chi tiết và modal

// ===========================================
// 1. INTERFACES VÀ TYPES
// ===========================================

// --- INTERFACE CHI TIẾT CHO BIẾN THỂ (Variation) ---
interface Variation {
  color: string;
  condition: string;
  defect: string;
  dimension: string;
  discount: number;
  image: string; // URL ảnh của biến thể
  material: string;
  newPrice: number;
  oldPrice: number;
  size: string;
  skuID: number;
  stock: number;
  weight: number;
}

// --- INTERFACE ĐẦY ĐỦ CHO SẢN PHẨM (ProductData) ---
interface ProductData {
  id: string;
  name: string;
  categorySlugs: string[];
  price: number;
  stock: number;
  status: 'Đang bán' | 'Hết hàng' | 'Tạm ẩn';
  variants: number;
  // Các trường Đánh giá (Vẫn phải giữ trong ProductData để hiển thị/tương tác API)
  averageRating: number;
  ratingBreakdown: Record<string, number>;
  ratingCount: number;
  totalRatingSum: number;
  // Các trường dữ liệu khác
  createdAt: Date;
  description: string;
  discount: number;
  image: string[]; // Mảng URL ảnh
  newPrice: number;
  oldPrice: number;
  tag: string[];
  variations: Variation[];
  video: string[]; // Mảng URL video
}

// Định nghĩa kiểu dữ liệu cho sản phẩm khi đang chỉnh sửa/tạo mới (dùng cho form)
type FormProductData = Omit<ProductData,
  'id' | 'createdAt' | 'variants' | 'price' | 'stock' | 'newPrice' | 'oldPrice' | 'discount'
  | 'averageRating' | 'ratingBreakdown' | 'ratingCount' | 'totalRatingSum'
> & {
  id?: string;
  slug?: string;
  newPriceInput: number;
  oldPriceInput: number;
  discountInput: number;
  ingredients?: string;
};

// Dữ liệu mặc định cho sản phẩm mới
const defaultNewProduct: FormProductData = {
  name: '',
  slug: '',
  categorySlugs: [],
  status: 'Tạm ẩn',
  description: '',
  newPriceInput: 0,
  oldPriceInput: 0,
  discountInput: 0,
  image: [],
  video: [],
  tag: [],
  variations: [],
};

// Hàm format tiền tệ
const formatCurrency = (amount: number) => Number(amount).toLocaleString('vi-VN') + ' VNĐ';

// Hàm lấy class trạng thái
const getStatusClass = (status: ProductData['status']) => {
  switch (status) {
    case 'Đang bán': return 'status-active';
    case 'Hết hàng': return 'status-soldout';
    case 'Tạm ẩn': return 'status-hidden';
    default: return 'status-default';
  }
};


// ===========================================
// 2. COMPONENT VariationForm (Biến thể)
// ===========================================

// Utility: convert a product name into a URL-friendly slug
const slugify = (input: string) => {
  if (!input) return '';
  // Normalize unicode (remove diacritics), to lower case
  let s = input.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  s = s.toLowerCase();
  // Replace any non-alphanumeric character with hyphen
  s = s.replace(/[^a-z0-9]+/g, '-');
  // Trim hyphens from ends
  s = s.replace(/^-+|-+$/g, '');
  // Collapse multiple hyphens
  s = s.replace(/-+/g, '-');
  return s;
}

const VariationForm: React.FC<{
  variation: Variation;
  index: number;
  onChange: (index: number, v: Variation) => void;
  onRemove: (index: number) => void;
  onSetUploadError?: (err:any) => void;
}> = ({ variation, index, onChange, onRemove, onSetUploadError }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleVChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const typed = type === 'number' ? (Number(value) || 0) : value;

    let next: Variation = { ...variation, [name]: typed } as Variation;

    // Auto-calc discount% when old/new price changes (rounded, clamped 0–100)
    if (name === 'oldPrice' || name === 'newPrice') {
      const oldP = name === 'oldPrice' ? (Number(value) || 0) : (variation.oldPrice || 0);
      const newP = name === 'newPrice' ? (Number(value) || 0) : (variation.newPrice || 0);
      if (oldP > 0 && newP >= 0) {
        const percent = Math.round(Math.max(0, Math.min(100, ((oldP - newP) / oldP) * 100)));
        next = { ...next, discount: percent } as Variation;
      } else {
        next = { ...next, discount: 0 } as Variation;
      }
    }

    // If discount% changes, auto-calc newPrice (rounded)
    if (name === 'discount') {
      const oldP = variation.oldPrice || 0;
      const d = Number(value) || 0;
      if (oldP > 0 && d >= 0 && d <= 100) {
        const newP = Math.round(oldP * (100 - d) / 100);
        next = { ...next, newPrice: newP } as Variation;
      }
    }

    onChange(index, next);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!auth.currentUser) {
      showError('Vui lòng đăng nhập để upload hình ảnh!');
      return;
    }

    const file = e.target.files[0];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `product_images/variants/${Date.now()}_${safeName}`;
    const sRef = storageRef(storage, path);

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadWithRetries(sRef, file, {
        maxRetries: 3,
        onProgress: (pct) => setUploadProgress(pct),
      });
      onChange(index, { ...variation, image: result.url });
      showSuccess('Tải ảnh biến thể thành công!');
      setUploading(false);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Upload error (with retries):', error);
      const code = error?.code || error?.original?.code || 'unknown';
      showError(`Lỗi upload (${code}): ${error?.message || String(error)}`);
      setUploading(false);
    }
  };

  return (
    <div className="variation-item">
      <h4>Biến Thể #{index + 1} ({variation.size || 'Mới'})</h4>
      <div className="variation-row">
        <label>Màu:</label><input type="text" name="color" value={variation.color} onChange={handleVChange} />
        <label>Size:</label><input type="text" name="size" value={variation.size} onChange={handleVChange} />
        <label>SKU ID:</label><input type="number" name="skuID" value={variation.skuID} onChange={handleVChange} />
        <label>Tồn Kho:</label><input type="number" name="stock" value={variation.stock} onChange={handleVChange} />
      </div>
      <div className="variation-row">
        <label>Giá Gốc:</label><input type="number" name="oldPrice" value={variation.oldPrice} onChange={handleVChange} />
        <label>Giá Mới:</label><input type="number" name="newPrice" value={variation.newPrice} onChange={handleVChange} />
        <label>Giảm (%):</label><input type="number" name="discount" value={variation.discount} onChange={handleVChange} />
      </div>
      <div className="variation-row">
        <label>Trạng thái:</label>
        <select name="condition" value={variation.condition} onChange={handleVChange}>
          <option value="Mới">Mới</option>
          <option value="Gần như mới">Gần như mới</option>
          <option value="Tốt">Tốt</option>
          <option value="Bình thường">Bình thường</option>
          <option value="Cũ">Cũ</option>
        </select>
        <label>Trọng lượng (kg):</label>
        <input type="number" step="0.01" name="weight" value={variation.weight} onChange={handleVChange} />
        <label>Chất liệu:</label><input type="text" name="material" value={variation.material} onChange={handleVChange} />
      </div>
      <label>URL Ảnh Biến Thể:</label><input type="text" name="image" value={variation.image} onChange={handleVChange} placeholder="Hoặc tải ảnh bên dưới" />
      
      <div className="variant-image-upload">
        <label className="upload-label">
          📷 Tải ảnh sản phẩm biến thể
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
            <span>{uploadProgress}%</span>
          </div>
        )}
        {variation.image && (
          <div className="variant-image-preview">
            <img src={variation.image} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }} />
            <button 
              type="button" 
              onClick={() => onChange(index, { ...variation, image: '' })}
              className="btn-remove-image"
            >❌</button>
          </div>
        )}
      </div>
      
      <button type="button" onClick={() => onRemove(index)} className="btn-remove-variation">Xóa Biến Thể</button>
    </div>
  );
};


// ===========================================
// 3. COMPONENT ProductFormModal (Form chính)
// ===========================================

const ProductFormModal: React.FC<{
  product: FormProductData;
  onClose: () => void;
  onSave: (product: FormProductData & { variations: Variation[] }) => void;
}> = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState<FormProductData>(product);
  const [variationsState, setVariationsState] = useState<Variation[]>(product.variations);
  // State để lưu trữ tên file/URL giả lập sau khi "upload"
  const [uploadedImages, setUploadedImages] = useState<string[]>(product.image);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>(product.video);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [mainUploadProgress, setMainUploadProgress] = useState(0);
  const [lastUploadError, setLastUploadError] = useState<any>(null);
  const [warehouseOptions, setWarehouseOptions] = useState<Array<any>>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [categoryOptions, setCategoryOptions] = useState<Array<{slug:string,name:string}>>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [categoryInputText, setCategoryInputText] = useState<string>((product.categorySlugs || []).join(', '));
  const [tagInputText, setTagInputText] = useState<string>((product.tag || []).join(', '));

  // Load warehouse items for selection (to allow choosing existing warehouse product when creating product)
  useEffect(() => {
    const loadWarehouse = async () => {
      try {
        const snap = await getDocs(collection(db, 'warehouse'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setWarehouseOptions(items.slice(0, 500));
      } catch (err) {
        console.error('Load warehouse options failed', err);
        setWarehouseOptions([]);
      }
    };
    loadWarehouse();
  }, []);

  // keep raw input text in sync when user toggles checkboxes or suggestions
  useEffect(() => {
    setCategoryInputText((formData.categorySlugs || []).join(', '));
    setTagInputText((formData.tag || []).join(', '));
  }, [formData.categorySlugs, formData.tag]);

  // Load category options and tag suggestions (from existing products)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cs = await getDocs(collection(db, 'categories'));
        const cats = cs.docs.map(d => ({ slug: (d.data() as any).slug || d.id, name: (d.data() as any).name || d.id }));
        if (mounted) setCategoryOptions(cats);
      } catch (err) {
        console.warn('Failed to load categories for product form', err);
        setCategoryOptions([]);
      }

      try {
        // collect tag suggestions from existing products (small scan)
        const ps = await getDocs(collection(db, 'products'));
        const tagsSet = new Set<string>();
        ps.docs.forEach(d => {
          const data = d.data() as any;
          if (Array.isArray(data.tag)) data.tag.forEach((t: string) => tagsSet.add(t));
        });
        if (mounted) setTagSuggestions(Array.from(tagsSet));
      } catch (err) {
        console.warn('Failed to load tag suggestions', err);
        setTagSuggestions([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const isNumericField = name.includes('Price') || name.includes('Discount');
      const typed = isNumericField ? (Number(value) || 0) : value;

      const updates: any = { [name]: typed };

      // Tự động sinh slug khi thay đổi tên sản phẩm
      if (name === 'name' && value) {
        updates.slug = slugify(value);
      }

      // Tự tính giảm giá (%) khi thay đổi giá
      if (name === 'oldPriceInput' || name === 'newPriceInput') {
        const oldP = name === 'oldPriceInput' ? (Number(value) || 0) : (prev.oldPriceInput || 0);
        const newP = name === 'newPriceInput' ? (Number(value) || 0) : (prev.newPriceInput || 0);
        if (oldP > 0 && newP >= 0) {
          const percent = Math.round(Math.max(0, Math.min(100, ((oldP - newP) / oldP) * 100)));
          updates.discountInput = percent;
        } else {
          updates.discountInput = 0;
        }
      }

      // Ngược lại: nếu người dùng nhập % giảm giá, tự tính lại giá mới
      if (name === 'discountInput') {
        const oldP = prev.oldPriceInput || 0;
        const d = Number(value) || 0;
        if (oldP > 0 && d >= 0 && d <= 100) {
          const newP = Math.round(oldP * (100 - d) / 100);
          updates.newPriceInput = newP;
        }
      }

      return { ...prev, ...updates };
    });
  };

  // Xử lý thay đổi cho các mảng slugs/tags
  const handleArrayChange = (name: 'categorySlugs' | 'tag', value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value.split(',').map(s => s.trim()).filter(s => s),
    }));
  };

  const toggleCategory = (slug: string) => {
    setFormData(prev => {
      const next = new Set(prev.categorySlugs || []);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return { ...prev, categorySlugs: Array.from(next) } as FormProductData;
    });
  };

  const toggleTagSuggestion = (tag: string) => {
    setFormData(prev => {
      const next = new Set(prev.tag || []);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return { ...prev, tag: Array.from(next) } as FormProductData;
    });
  };

  // Xử lý thay đổi Variations
  const handleVariationChange = (index: number, newVariation: Variation) => {
    setVariationsState(prev => {
      const newVariations = [...prev];
      newVariations[index] = newVariation;
      return newVariations;
    });
  };

  const handleAddVariation = () => {
    const newVar: Variation = {
      color: '', condition: 'Mới', defect: '', dimension: '', discount: formData.discountInput,
      image: '', material: '', newPrice: formData.newPriceInput, oldPrice: formData.oldPriceInput,
      size: '', skuID: Date.now(), stock: 0, weight: 0.1
    };
    setVariationsState(prev => [...prev, newVar]);
  };

  const handleRemoveVariation = (index: number) => {
    setVariationsState(prev => prev.filter((_, i) => i !== index));
  };


  // --- HÀM XỬ LÝ UPLOAD FILE THẬT LÊN Firebase Storage ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
    if (!e.target.files || e.target.files.length === 0) return;

    // Kiểm tra auth admin
    if (!auth.currentUser) {
      showError('Vui lòng đăng nhập admin trước khi tải file lên!');
      return;
    }

    const files = Array.from(e.target.files);

    // sequential upload to simplify progress tracking
    setUploadingMain(true);
    setMainUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = fileType === 'image'
          ? `product_images/main/${Date.now()}_${i}_${safeName}`
          : `product_videos/${Date.now()}_${i}_${safeName}`;

        const sRef = storageRef(storage, path);
        const res = await uploadWithRetries(sRef, file, {
          maxRetries: 3,
          onProgress: (pct) => {
            const overall = Math.round(((i / files.length) * 100) + (pct / files.length));
            setMainUploadProgress(overall);
          }
        });

        if (fileType === 'image') setUploadedImages(prev => [...prev, res.url]); else setUploadedVideos(prev => [...prev, res.url]);
      }

      showSuccess('Tải file lên thành công');
    } catch (error: any) {
      console.error('Upload error (with retries):', error);
      setLastUploadError(error);
      const code = error?.code || error?.original?.code || 'unknown';
      showError(`Lỗi upload (${code}): ${error?.message || String(error)}`);
      setUploadingMain(false);
    }
  };

  // Xóa ảnh/video khỏi danh sách đã tải lên
  const handleRemoveMedia = (urlToRemove: string, fileType: 'image' | 'video') => {
    if (fileType === 'image') {
      setUploadedImages(prev => prev.filter(url => url !== urlToRemove));
    } else {
      setUploadedVideos(prev => prev.filter(url => url !== urlToRemove));
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gộp variations và media đã tải lên vào formData trước khi lưu
    onSave({
      ...formData,
      variations: variationsState,
      image: uploadedImages,
      video: uploadedVideos
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content large-modal">
        <h2>{formData.id ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h2>
        <form onSubmit={handleSubmit}>

          <div className="form-grid">
            {/* Cột 1: Thông tin cơ bản */}
            <fieldset>
              <legend>Thông Tin Cơ Bản & Giá</legend>
              <label>Tên Sản Phẩm (chọn từ kho hoặc tạo mới):</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <select value={selectedWarehouseId} onChange={(e)=>{
                  const id = e.target.value;
                  setSelectedWarehouseId(id);
                  if (!id) { 
                    setFormData(prev => ({...prev, name: '', slug: ''})); 
                    return; 
                  }
                  const w = warehouseOptions.find(x=> x.id === id || x.productId === id);
                  if (w) {
                    const productName = w.productName || '';
                    setFormData(prev => ({ 
                      ...prev, 
                      name: productName,
                      slug: slugify(productName) // Tự động sinh slug khi chọn từ kho
                    }));
                    setUploadedImages(w.image ? [w.image] : (w.images || []));
                    // set a default variation stock if empty
                    if (variationsState.length === 0) {
                      setVariationsState([{ color:'', condition:'new', defect:'', dimension:'', discount:0, image: (w.image||''), material:'', newPrice: formData.newPriceInput || 0, oldPrice: formData.oldPriceInput || 0, size:'', skuID: Date.now(), stock: w.stock || 0, weight:0 }]);
                    }
                  }
                }}>
                  <option value="">-- Tạo mới --</option>
                  {warehouseOptions.map(w => (
                    <option key={w.id} value={w.id}>{w.productName} · Kho: {w.stock || 0}</option>
                  ))}
                </select>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Tên sản phẩm" required />
              </div>
              <label>Slug (đường dẫn URL, có thể chỉnh sửa):</label>
              <input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} placeholder="ví dụ: sua-dau-goi-xyz" />
              {selectedWarehouseId && <div style={{fontSize:12,color:'#666',marginTop:6}}>Đã chọn sản phẩm từ kho — số tồn: {warehouseOptions.find(x=>x.id===selectedWarehouseId)?.stock || 0}</div>}

              <label>Mô Tả:</label>
              <textarea name="description" value={formData.description} onChange={handleChange} />

              <label>Thành Phần & Nguồn Gốc:</label>
              <textarea 
                name="ingredients" 
                value={formData.ingredients || ''} 
                onChange={handleChange}
                placeholder="Nhập thông tin về thành phần, xuất xứ, nguồn gốc..."
                rows={4}
              />

              <label>Trạng Thái:</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Đang bán">Đang bán (visible)</option>
                <option value="Tạm ẩn">Tạm ẩn (hidden)</option>
              </select>

              <label>Giá Gốc (Chung):</label>
              <input type="number" name="oldPriceInput" value={formData.oldPriceInput} onChange={handleChange} required />

              <label>Giá Mới (Chung):</label>
              <input type="number" name="newPriceInput" value={formData.newPriceInput} onChange={handleChange} required />

              <label>Giảm Giá (Chung %):</label>
              <input type="number" name="discountInput" value={formData.discountInput} onChange={handleChange} />
            </fieldset>

            {/* Cột 2: Phân loại & Media */}
            <fieldset>
              <legend>Phân Loại & Media</legend>
              <label>Chọn Danh Mục (có thể chọn nhiều):</label>
              <div className="category-multiselect">
                {categoryOptions.length === 0 ? (
                  <div style={{fontSize:12,color:'#666'}}>Chưa có danh mục trong hệ thống, bạn có thể nhập slug thủ công:</div>
                ) : (
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {categoryOptions.map(c => (
                      <label key={c.slug} style={{display:'inline-flex',alignItems:'center',gap:6}}>
                        <input type="checkbox" checked={(formData.categorySlugs || []).includes(c.slug)} onChange={() => toggleCategory(c.slug)} />
                        <span style={{fontSize:13}}>{c.name} <small style={{color:'#666'}}>({c.slug})</small></span>
                      </label>
                    ))}
                  </div>
                )}
                <div style={{marginTop:8}}>
                  <div style={{fontSize:12,color:'#666'}}>Hoặc nhập slug thủ công (cách nhau bằng dấu phẩy):</div>
                  <input
                    type="text"
                    value={categoryInputText}
                    onChange={(e) => setCategoryInputText(e.target.value)}
                    onBlur={() => handleArrayChange('categorySlugs', categoryInputText)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                    placeholder="nhập slug danh mục, cách nhau bằng dấu phẩy"
                  />
                </div>
              </div>

              <label>Tags (chọn hoặc nhập thêm):</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8}}>
                {(tagSuggestions || []).slice(0, 40).map(tag => (
                  <button type="button" key={tag} onClick={() => toggleTagSuggestion(tag)} className={ (formData.tag||[]).includes(tag) ? 'tag-sel' : 'tag-plain' }>
                    {tag}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={tagInputText}
                onChange={(e) => setTagInputText(e.target.value)}
                onBlur={() => handleArrayChange('tag', tagInputText)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                placeholder="nhập tag, cách nhau bằng dấu phẩy"
              />

              {/* UPLOAD ẢNH */}
              <div className="upload-control">
                <label>Tải lên Ảnh Chính (Chọn nhiều):</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'image')}
                />
                <div className="uploaded-list">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="uploaded-item">
                      {url.substring(0, 30)}...
                      <button type="button" onClick={() => handleRemoveMedia(url, 'image')}>X</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* UPLOAD VIDEO */}
              <div className="upload-control">
                <label>Tải lên Video (Chọn nhiều):</label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'video')}
                />
                <div className="uploaded-list">
                  {uploadedVideos.map((url, index) => (
                    <div key={index} className="uploaded-item">
                      {url.substring(0, 30)}...
                      <button type="button" onClick={() => handleRemoveMedia(url, 'video')}>X</button>
                    </div>
                  ))}
                </div>
              </div>

            </fieldset>
          </div>

          {/* Cột 3: Quản lý Biến thể (Toàn bộ chiều rộng) */}
          <fieldset className="variation-manager-fieldset">
            <legend>Quản Lý Biến Thể ({variationsState.length})</legend>
            <button type="button" onClick={handleAddVariation} className="btn-add-variation">+ Thêm Biến Thể</button>

            <div className="variations-list">
              {variationsState.map((v, index) => (
                <VariationForm
                  key={index}
                  variation={v}
                  index={index}
                  onChange={handleVariationChange}
                  onRemove={handleRemoveVariation}
                    onSetUploadError={setLastUploadError}
                />
              ))}
            </div>
          </fieldset>


          <div className="modal-actions">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              {uploadingMain && (
                <div style={{width:200}}>
                  <div style={{height:8, background:'#eee', borderRadius:4, overflow:'hidden'}}>
                    <div style={{width:`${mainUploadProgress}%`, height:'100%', background:'#4caf50'}} />
                  </div>
                  <div style={{fontSize:12,color:'#666',marginTop:6}}>{mainUploadProgress}% đang tải lên...</div>
                </div>
              )}
              <button type="submit" className="btn-save" disabled={uploadingMain}>{uploadingMain ? 'Đang tải...' : 'Lưu'}</button>
            </div>
            {lastUploadError && (
              <div style={{marginTop:8, padding:8, background:'#fff4f4', border:'1px solid #ffdddd', borderRadius:6}}>
                <div style={{fontWeight:700, color:'#b00000'}}>Lỗi upload (chi tiết)</div>
                <pre style={{maxHeight:160, overflow:'auto', fontSize:12, marginTop:6, whiteSpace:'pre-wrap'}}>{JSON.stringify(lastUploadError, Object.getOwnPropertyNames(lastUploadError || {}), 2)}</pre>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button type="button" className="btn-ghost" onClick={async ()=>{ try { await navigator.clipboard.writeText(JSON.stringify(lastUploadError, null, 2)); showSuccess('Đã copy lỗi vào clipboard'); } catch(e){ showError('Không thể copy'); } }}>Copy lỗi</button>
                  <button type="button" className="btn-ghost" onClick={()=>setLastUploadError(null)}>Đóng</button>
                </div>
              </div>
            )}
            <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ===========================================
// 4. COMPONENT AdminProductsPage (Trang chính)
// ===========================================

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedStatus, setSelectedStatus] = useState('Tất cả');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FormProductData | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(true);
  const DEFAULT_PER_PAGE = 10;

  const statuses = ['Tất cả', 'Đang bán', 'Hết hàng', 'Tạm ẩn'];


  // --- LOGIC LẤY DỮ LIỆU (CRUD READ) ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const productsCollection = collection(db, "products");
      const productSnapshot = await getDocs(productsCollection);

      const productsList: ProductData[] = productSnapshot.docs.map(doc => {
        const data = doc.data();

        let totalStock = 0;
        let variantCount = 0;
        const variations: Variation[] = (data.variations || []).map((v: any) => ({
          color: v.color || '', condition: v.condition || '', defect: v.defect || '', dimension: v.dimension || '',
          discount: v.discount || 0, image: v.image || '', material: v.material || '', newPrice: v.newPrice || 0,
          oldPrice: v.oldPrice || 0, size: v.size || '', skuID: v.skuID || 0, stock: v.stock || 0, weight: v.weight || 0,
        }));


        if (variations.length > 0) {
          variantCount = variations.length;
          totalStock = variations.reduce((sum, v) => sum + (v.stock || 0), 0);
        }

        let status: ProductData['status'];
        const firestoreStatus = data.status;
        if (firestoreStatus === 'visible') {
          status = 'Đang bán';
        } else if (firestoreStatus === 'hidden') {
          status = 'Tạm ẩn';
        } else {
          status = totalStock > 0 ? 'Đang bán' : 'Hết hàng';
        }

        const createdAtDate = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();

        return {
          id: doc.id, name: data.name || 'Sản phẩm không tên', slug: data.slug || '', categorySlugs: data.categorySlugs || [],
          price: data.newPrice || data.oldPrice || 0, stock: totalStock, status: status, variants: variantCount,
          averageRating: data.averageRating || 0, createdAt: createdAtDate, description: data.description || '',
          discount: data.discount || 0, image: data.image || [], newPrice: data.newPrice || 0, oldPrice: data.oldPrice || 0,
          ratingBreakdown: data.ratingBreakdown || {}, ratingCount: data.ratingCount || 0, tag: data.tag || [],
          totalRatingSum: data.totalRatingSum || 0, variations: variations, video: data.video || [],
        } as ProductData;
      });

      setProducts(productsList);
      setError(null);
    } catch (err: any) {
      console.error("Lỗi khi tải sản phẩm:", err);
      setError("Không thể tải dữ liệu sản phẩm từ Firestore.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- LOGIC CRUD CẢI TIẾN ---

  // Xử lý XÓA (DELETE)
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" (ID: ${productId})?`)) {
      try {
        const docRef = doc(db, "products", productId);
        await deleteDoc(docRef);
        setProducts(products.filter(p => p.id !== productId));
        alert(`Sản phẩm "${productName}" đã được xóa thành công.`);
      } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        alert("Lỗi: Không thể xóa sản phẩm.");
      }
    }
  };

  // Chuẩn bị mở modal Thêm mới
  const handleAddProduct = () => {
    setEditingProduct(defaultNewProduct);
    setIsModalOpen(true);
  };

  // Chuẩn bị mở modal Chỉnh sửa
  const handleEditProduct = (productId: string) => {
    const productToEdit = products.find(p => p.id === productId);
    if (productToEdit) {
      const formProduct: FormProductData = {
        ...productToEdit,
        slug: (productToEdit as any).slug || '',
        ingredients: (productToEdit as any).ingredients || '',
        newPriceInput: productToEdit.newPrice,
        oldPriceInput: productToEdit.oldPrice,
        discountInput: productToEdit.discount,
        // image và video đã là mảng string URL, được truyền trực tiếp
        variations: productToEdit.variations,
      };
      formProduct.id = productToEdit.id;

      setEditingProduct(formProduct);
      setIsModalOpen(true);
    }
  };

  // Xử lý LƯU (CREATE & UPDATE)
  const handleSaveProduct = async (formData: FormProductData & { variations: Variation[] }) => {
    // Check authentication first
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('Lỗi: Bạn phải đăng nhập để lưu sản phẩm.');
      setLoading(false);
      return;
    }

    // Check admin permissions
    try {
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      const isAdmin = adminDoc.exists() || (userDoc.exists() && userDoc.data()?.role === 'admin');
      
      if (!isAdmin) {
        alert('Lỗi: Bạn không có quyền admin để thực hiện thao tác này. Vui lòng liên hệ quản trị viên để được cấp quyền.');
        setLoading(false);
        return;
      }
    } catch (permError) {
      console.error('Lỗi khi kiểm tra quyền admin:', permError);
      alert('Lỗi: Không thể xác thực quyền admin. Vui lòng thử lại.');
      setLoading(false);
      return;
    }

    setIsModalOpen(false);
    setLoading(true);
    let saveError: any = null;

    const imageArray = formData.image; // Đã là mảng URL/tên file
    const videoArray = formData.video; // Đã là mảng URL/tên file

    // Chuẩn bị đối tượng dữ liệu để gửi lên Firestore
  // Determine desired slug: prefer admin-provided slug, else generate from name
  const desiredBase = (formData.slug && String(formData.slug).trim()) ? String(formData.slug).trim() : String(formData.name || '');
  const finalSlug = await generateUniqueSlug(desiredBase, formData.id);

  const firestoreData = {
      name: formData.name,
      slug: finalSlug,
      description: formData.description,
      ingredients: formData.ingredients || '',
      categorySlugs: formData.categorySlugs,
      tag: formData.tag,
      oldPrice: formData.oldPriceInput,
      newPrice: formData.newPriceInput,
      discount: formData.discountInput,
      status: formData.status === 'Đang bán' ? 'visible' : 'hidden',

      image: imageArray,
      video: videoArray,
      variations: formData.variations,

      // Các trường Đánh giá mặc định
      averageRating: 0,
      ratingBreakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      ratingCount: 0,
      totalRatingSum: 0,
    };

    try {
      if (formData.id) {
        // UPDATE
        const docRef = doc(db, "products", formData.id);
        await updateDoc(docRef, {
          ...firestoreData,
          updatedAt: serverTimestamp(),
        });
        alert(`Sản phẩm "${formData.name}" đã được cập nhật thành công.`);
      } else {
        // CREATE
        const productsCollection = collection(db, "products");
        await addDoc(productsCollection, {
          ...firestoreData,
          createdAt: serverTimestamp(),
        });
        alert(`Sản phẩm "${formData.name}" đã được thêm mới thành công.`);
      }

      await fetchProducts();

    } catch (err: any) {
      console.error('One or more uploads failed in ProductFormModal (with retries)', err);
      saveError = err;
      setError(err?.message || String(err));
      showError('Một hoặc nhiều file tải lên thất bại. Xem chi tiết trong console hoặc phần "Lỗi upload".');
    } finally {
      let errorMessage = 'Lỗi không xác định';
      if (saveError?.code === 'permission-denied') {
        errorMessage = 'Bạn không có quyền thực hiện thao tác này. Vui lòng kiểm tra:\n' +
                      '1. Tài khoản của bạn có được thêm vào collection "admins" hoặc có role="admin" trong collection "users"\n' +
                      '2. Firestore rules đã được deploy đúng cách\n' +
                      '3. Bạn đã đăng nhập với tài khoản admin';
      } else if (saveError?.message) {
        errorMessage = saveError.message;
      }
      
      alert(`Lỗi: Không thể lưu sản phẩm.\n\nChi tiết: ${errorMessage}\n\nUser ID: ${auth.currentUser?.uid || 'N/A'}`);
      setLoading(false);
    }
  };

  // Đóng Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };


  // --- LOGIC TÌM KIẾM, LỌC & PHÂN TRANG ---

  // Debounce cho tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => { clearTimeout(handler); };
  }, [searchQuery]);


  // Lấy danh sách Categories duy nhất để làm Filter
  const allCategories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    products.forEach(p => {
      p.categorySlugs.forEach(slug => uniqueCategories.add(slug));
    });
    return ['Tất cả', ...Array.from(uniqueCategories)];
  }, [products]);

  // LỌC DỮ LIỆU CUỐI CÙNG
  const filteredProducts = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase().trim();

    return products.filter(p => {
      const categoryMatch = selectedCategory === 'Tất cả' || p.categorySlugs.includes(selectedCategory);
      const statusMatch = selectedStatus === 'Tất cả' || p.status === selectedStatus;

      if (!categoryMatch || !statusMatch) { return false; }

      if (!query) return true;

      const searchFields = [
        p.name.toLowerCase(), p.description.toLowerCase(), p.id.toLowerCase(),
        ...p.tag.map(t => t.toLowerCase()),
        ...p.variations.flatMap(v => [
          v.color.toLowerCase(), v.size.toLowerCase(), v.material.toLowerCase(),
          v.skuID.toString(),
        ]),
      ].join(' ');

      return searchFields.includes(query);
    });
  }, [products, debouncedSearchQuery, selectedCategory, selectedStatus]);


  // LOGIC PHÂN TRANG 
  const productsPerPage = showAll ? (filteredProducts.length || DEFAULT_PER_PAGE) : DEFAULT_PER_PAGE;
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const pageNumbers: number[] = useMemo(() => {
    const numbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      numbers.push(i);
    }
    return numbers;
  }, [totalPages, currentPage]);


  // --- RENDER COMPONENT CHÍNH ---
  if (loading) {
    return <div className="admin-product-loading-state">Đang tải dữ liệu sản phẩm...</div>;
  }

  if (error) {
    return <div className="admin-product-error-state">Lỗi: {error}</div>;
  }

  return (
    <div className="admin-product-page-wrapper">
      <AdminSidebar />

      <main className="admin-product-content">
        <header className="admin-product-content-header">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <h1 className="admin-product-content-title">Quản Lý Sản Phẩm ({products.length})</h1>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:14}}>
                <input type="checkbox" checked={showAll} onChange={(e)=>{ setShowAll(e.target.checked); setCurrentPage(1); }} />
                <span>Hiển thị tất cả</span>
              </label>
            </div>
            <button className="admin-product-btn-add" onClick={handleAddProduct}>+ Thêm Sản Phẩm Mới</button>
        </header>

        <div className="admin-product-toolbar">
          <input type="text" placeholder="Tìm kiếm: Tên, Mô tả, Tags, SKU..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            {allCategories.map(catSlug => <option key={catSlug} value={catSlug}>{catSlug === 'Tất cả' ? 'Tất cả Danh mục' : catSlug}</option>)}
          </select>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            {statuses.map(status => <option key={status}>{status}</option>)}
          </select>
        </div>

        {/* BẢNG HIỂN THỊ CHI TIẾT */}
        <div className="admin-product-table-container">
          <table className="admin-product-products-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Ảnh</th>
                <th>Sản Phẩm (ID)</th>
                <th>Giá Gốc/Giảm (%)</th>
                <th>Tồn Kho (Biến Thể)</th>
                <th>Danh Mục (Slugs)</th>
                <th>Tags</th>
                <th>Đánh Giá (TB/Tổng)</th>
                <th>Ngày Tạo</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map(p => (
                <tr key={p.id}>
                  <td><input type="checkbox" /></td>
                  <td className="product-thumb">
                    {p.image.length > 0 && <img src={p.image[0].startsWith('[Mô phỏng:') ? 'placeholder.jpg' : p.image[0]} alt={p.name} width="50" height="50" />}
                  </td>
                  <td className="admin-product-product-name">
                    <div className="name-text"><strong>{p.name}</strong></div>
                    <div className="sku-id">#{p.id}</div>
                    <div className="description-preview">{p.description.substring(0, 30)}...</div>
                  </td>
                  <td className="pro-admin-product-price">
                    <div className="product-old-price"><del>{formatCurrency(p.oldPrice)}</del></div>
                    <div className="new-price"><strong>{formatCurrency(p.newPrice)}</strong></div>
                    <div className="discount-info">Giảm: {p.discount}%</div>
                  </td>
                  <td className={p.stock <= 10 && p.stock > 0 ? 'low-stock' : (p.stock === 0 ? 'status-soldout' : '')}>
                    <div className="stock-count"><strong>{p.stock}</strong></div>
                    <div className="variant-count">({p.variants} Biến Thể)</div>
                  </td>
                  <td>{p.categorySlugs.join(', ')}</td>
                  <td>{p.tag.join(', ')}</td>
                  <td>
                    <div className="rating-avg">⭐ {p.averageRating.toFixed(1)}</div>
                    <div className="rating-count">({p.ratingCount} Lượt)</div>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td><span className={`status ${getStatusClass(p.status)}`}>{p.status}</span></td>
                  <td className="admin-product-actions">
                    <button
                      className="admin-product-edit-btn"
                      onClick={() => handleEditProduct(p.id)}
                    >Sửa</button>
                    <button
                      className="admin-product-delete-btn"
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                    >Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOGIC PHÂN TRANG */}
        <div className="admin-product-pagination">
          <span>Hiển thị {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} / {filteredProducts.length} sản phẩm</span>
          <div className="admin-product-pages">
            <button onClick={prevPage} disabled={currentPage === 1}>Trước</button>

            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={currentPage === number ? 'admin-product-current' : ''}
              >
                {number}
              </button>
            ))}

            <button onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0}>Sau</button>
          </div>
        </div>
      </main>

      {/* RENDER MODAL KHI CÓ SẢN PHẨM ĐANG CHỈNH SỬA/TẠO MỚI */}
      {isModalOpen && editingProduct && (
        <ProductFormModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

// Generate a unique slug by checking existing slugs in 'products'.
// If a collision is found, append -1, -2, ... until unique.
const generateUniqueSlug = async (base: string, excludeId?: string) => {
  const baseSlug = slugify(base);
  if (!baseSlug) return baseSlug;

  try {
    const productsRef = collection(db, 'products');
    // Range query to get slugs that start with baseSlug
    const start = baseSlug;
    const end = baseSlug + '\uf8ff';
    const q = query(productsRef, where('slug', '>=', start), where('slug', '<=', end));
    const snap = await getDocs(q);
    const existing = snap.docs.map(d => ({ id: d.id, slug: (d.data() as any).slug || '' }));

    // If no existing slugs, return baseSlug
    if (existing.length === 0) return baseSlug;

    // Build a set of slugs to check
    const set = new Set(existing.map(e => e.slug));
    // If existing only contains the current document's slug, it's fine
    if (excludeId) {
      const other = existing.filter(e => e.id !== excludeId);
      if (other.length === 0) return baseSlug;
    } else {
      if (!set.has(baseSlug)) return baseSlug;
    }

    // Try suffixes
    for (let i = 1; i < 1000; i++) {
      const candidate = `${baseSlug}-${i}`;
      if (!set.has(candidate)) return candidate;
    }

    // Fallback (very unlikely)
    return `${baseSlug}-${Date.now()}`;
  } catch (err) {
    console.error('generateUniqueSlug error', err);
    return base;
  }
}