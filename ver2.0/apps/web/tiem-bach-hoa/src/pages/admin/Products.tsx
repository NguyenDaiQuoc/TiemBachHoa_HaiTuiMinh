import React, { useState, useEffect, useMemo } from "react";
// Import các hàm CRUD cần thiết từ Firebase Firestore
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

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
  newPriceInput: number;
  oldPriceInput: number;
  discountInput: number;
};

// Dữ liệu mặc định cho sản phẩm mới
const defaultNewProduct: FormProductData = {
  name: '',
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

const VariationForm: React.FC<{
  variation: Variation;
  index: number;
  onChange: (index: number, v: Variation) => void;
  onRemove: (index: number) => void;
}> = ({ variation, index, onChange, onRemove }) => {

  const handleVChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    onChange(index, {
      ...variation,
      [name]: type === 'number' ? Number(value) || 0 : value,
    });
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
      <label>URL Ảnh Biến Thể:</label><input type="text" name="image" value={variation.image} onChange={handleVChange} />
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
  const [warehouseOptions, setWarehouseOptions] = useState<Array<any>>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

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

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Price') || name.includes('Discount') ? Number(value) || 0 : value,
    }));
  };

  // Xử lý thay đổi cho các mảng slugs/tags
  const handleArrayChange = (name: 'categorySlugs' | 'tag', value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value.split(',').map(s => s.trim()).filter(s => s),
    }));
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
      color: '', condition: 'new 100%', defect: '', dimension: '', discount: formData.discountInput,
      image: '', material: '', newPrice: formData.newPriceInput, oldPrice: formData.oldPriceInput,
      size: '', skuID: Date.now(), stock: 0, weight: 0.1
    };
    setVariationsState(prev => [...prev, newVar]);
  };

  const handleRemoveVariation = (index: number) => {
    setVariationsState(prev => prev.filter((_, i) => i !== index));
  };


  // --- HÀM XỬ LÝ UPLOAD FILE GIẢ LẬP (Mô phỏng Storage Upload) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const newUrls = files.map(file => {
      // TRONG THỰC TẾ: Chỗ này sẽ gọi Firebase Storage và trả về URL
      // Hiện tại: Mô phỏng URL/tên file
      return `[Mô phỏng: ${file.name} - ${Date.now()}]`;
    });

    if (fileType === 'image') {
      setUploadedImages(prev => [...prev, ...newUrls]);
    } else {
      setUploadedVideos(prev => [...prev, ...newUrls]);
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
                  if (!id) { setFormData(prev => ({...prev, name: ''})); return; }
                  const w = warehouseOptions.find(x=> x.id === id || x.productId === id);
                  if (w) {
                    setFormData(prev => ({ ...prev, name: w.productName || prev.name }));
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
              {selectedWarehouseId && <div style={{fontSize:12,color:'#666',marginTop:6}}>Đã chọn sản phẩm từ kho — số tồn: {warehouseOptions.find(x=>x.id===selectedWarehouseId)?.stock || 0}</div>}

              <label>Mô Tả:</label>
              <textarea name="description" value={formData.description} onChange={handleChange} />

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
              <label>Category Slugs (cách nhau bởi dấu phẩy):</label>
              <input type="text" value={formData.categorySlugs.join(', ')} onChange={(e) => handleArrayChange('categorySlugs', e.target.value)} />

              <label>Tags (cách nhau bởi dấu phẩy):</label>
              <input type="text" value={formData.tag.join(', ')} onChange={(e) => handleArrayChange('tag', e.target.value)} />

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
                />
              ))}
            </div>
          </fieldset>


          <div className="modal-actions">
            <button type="submit" className="btn-save">Lưu</button>
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
  const [productsPerPage] = useState(10);

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
          id: doc.id, name: data.name || 'Sản phẩm không tên', categorySlugs: data.categorySlugs || [],
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
    setIsModalOpen(false);
    setLoading(true);

    const imageArray = formData.image; // Đã là mảng URL/tên file
    const videoArray = formData.video; // Đã là mảng URL/tên file

    // Chuẩn bị đối tượng dữ liệu để gửi lên Firestore
    const firestoreData = {
      name: formData.name,
      description: formData.description,
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

    } catch (error) {
      console.error("Lỗi khi lưu sản phẩm:", error);
      alert(`Lỗi: Không thể lưu sản phẩm. Chi tiết: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
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
          <h1 className="admin-product-content-title">Quản Lý Sản Phẩm ({products.length})</h1>
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