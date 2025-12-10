import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, serverTimestamp, getDocs } from "firebase/firestore";
// 1. IMPORT THÊM HÀM TỪ FIREBASE STORAGE
// Cần đảm bảo bạn import 'storage' (Firebase Storage instance)
import { db, storage, auth } from "../../firebase"; // hoặc "/src/firebase" tùy theo đường dẫn tương đối
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import "../../../css/admin/categoryform.css";

// --- INTERFACE DỮ LIỆU ---
interface CategoryData {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    status: 'Hiển thị' | 'Ẩn';
    product_count: number;
    icon: string;
    children?: any;
}

// --- Định nghĩa Props cho Form ---
interface FormProps {
    initialData: CategoryData | null;
    onSave: (shouldRefresh: boolean) => void;
    onCancel: () => void;
}

// Hàm giả định (Giữ nguyên)
const isImagePath = (path: string) => path && (path.startsWith('http') || path.startsWith('https') || path.startsWith('/'));

// --- Component Khung Form (Section Container) ---
function FormContainer({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="form-section-container">
            <h2 className="form-section-title">{title}</h2>
            {children}
        </div>
    );
}

// --- Component Chính: Form Danh Mục Sản Phẩm ---
export default function AdminCategoryFormPage({ initialData, onSave, onCancel }: FormProps) {

    const isEditMode = !!initialData;
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        parentId: initialData?.parentId || '',
        description: '',
        metaTitle: '',
        metaDescription: '',
        status: initialData?.status === 'Hiển thị' ? 'visible' : 'hidden',
        icon: initialData?.icon || '',
        // Đảm bảo product_count là number
        product_count: initialData?.product_count || 0, 
    });
    const [loading, setLoading] = useState(false);
    const [allCategories, setAllCategories] = useState<CategoryData[]>([]);
    // 2. STATE CHO FILE ẢNH
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Tải danh sách danh mục để làm dropdown Parent (Giữ nguyên)
    useEffect(() => {
        const fetchAllCategories = async () => {
            // ... (Logic tải danh mục)
            try {
                const querySnapshot = await getDocs(collection(db, "categories"));
                const categories = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name || '',
                    slug: doc.data().slug || '',
                    parentId: doc.data().parentId || null,
                    status: doc.data().status === 'visible' ? 'Hiển thị' : 'Ẩn',
                    product_count: doc.data().product_count || 0,
                    icon: doc.data().icon || '',
                } as CategoryData));
                setAllCategories(categories);
            } catch (err) {
                console.error("Lỗi khi tải danh mục cha:", err);
            }
        };
        fetchAllCategories();
    }, []);

    // Cập nhật state khi input thay đổi
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Xử lý trường product_count là số
        if (name === 'product_count' && type === 'number') {
             // Chuyển đổi sang số, hoặc 0 nếu không hợp lệ
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Tự động tạo slug (Giữ nguyên)
        if (name === 'name' && !isEditMode && !formData.slug) {
            const newSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
            setFormData(prev => ({ ...prev, slug: newSlug }));
        }
    };

    // 3. HÀM XỬ LÝ CHỌN FILE
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setError(null);
            // Có thể xem trước ảnh ngay lập tức bằng cách tạo URL Object
            setFormData(prev => ({ ...prev, icon: URL.createObjectURL(file) }));
        }
    };

    // 4. HÀM TẢI ẢNH LÊN FIREBASE STORAGE
    const uploadImage = async (file: File, categoryId: string): Promise<string> => {
        // Ensure user is authenticated (Storage rules often require auth)
        if (!auth || !auth.currentUser) {
            setError('Bạn cần đăng nhập để thực hiện thao tác tải ảnh lên. Vui lòng đăng nhập tài khoản quản trị.');
            throw new Error('USER_NOT_AUTHENTICATED');
        }

        const fileExtension = (file.name.split('.').pop() || '').toLowerCase();
        const storagePath = `category_icons/${categoryId}.${fileExtension}`;
        const imageRef = ref(storage, storagePath);

        // Determine content type (some .ico files may not have file.type set)
        let contentType = file.type;
        if (!contentType) {
            if (fileExtension === 'ico') contentType = 'image/x-icon';
            else if (fileExtension === 'svg') contentType = 'image/svg+xml';
            else contentType = 'application/octet-stream';
        }

        try {
            const snapshot = await uploadBytes(imageRef, file, { contentType });
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (err: any) {
            console.error("Lỗi tải ảnh lên Storage:", err);
            // Provide actionable message for permission error
            if (err?.code === 'storage/unauthorized') {
                setError('Quyền truy cập bị từ chối: không có quyền tải tệp lên Storage. Vui lòng kiểm tra rules của Firebase Storage hoặc đảm bảo bạn đã đăng nhập.');
            } else {
                setError("Lỗi: Không thể tải ảnh lên Storage.");
            }
            throw err;
        }
    };

    // 5. HÀM XỬ LÝ LƯU/CẬP NHẬT LÊN Firestore (Đã chỉnh sửa)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            let finalIconUrl = formData.icon;
            const categoryId = isEditMode ? initialData!.id : uuidv4();

            // BƯỚC 1: Xử lý Upload ảnh (nếu có file mới)
            if (imageFile) {
                // Chỉ tải lên khi có file mới được chọn
                finalIconUrl = await uploadImage(imageFile, categoryId);
            } else if (isEditMode && !isImagePath(formData.icon)) {
                 // Nếu ở chế độ chỉnh sửa, không có file mới, và icon cũ không phải URL (giá trị mặc định '📁')
                 // thì ta xóa icon cũ đi, hoặc để rỗng, ở đây ta sẽ dùng URL icon hiện có nếu là URL
                 // Nếu không phải URL, nó sẽ giữ giá trị hiện tại (có thể là URL cũ hoặc '📁')
            }


            // Tạo Slug (Giữ nguyên)
            let finalSlug = formData.slug.trim();
            if (!finalSlug && formData.name) {
                finalSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
            }

            // BƯỚC 2: Chuẩn bị dữ liệu để gửi lên Firestore
            const dataToSave = {
                name: formData.name,
                slug: finalSlug,
                parentId: formData.parentId || '',
                description: formData.description,
                metaTitle: formData.metaTitle,
                metaDescription: formData.metaDescription,
                status: formData.status,
                // Lưu URL ảnh từ Storage (hoặc URL cũ/giá trị cũ)
                icon: finalIconUrl, 
                // Sử dụng product_count từ state
                product_count: formData.product_count, 
                updatedAt: serverTimestamp(),
                ...(isEditMode ? {} : { createdAt: serverTimestamp() }),
            };

            // BƯỚC 3: Lưu vào Firestore
            await setDoc(doc(db, "categories", categoryId), dataToSave, { merge: true });
            
            alert(`${isEditMode ? 'Chỉnh sửa' : 'Thêm mới'} danh mục "${formData.name}" thành công!`);
            onSave(true); // Đóng form và làm mới bảng

        } catch (err: any) {
            console.error("Lỗi khi lưu danh mục:", err);
            // Hiển thị lỗi đã set ở hàm uploadImage hoặc lỗi khác
            alert(`Lỗi khi lưu danh mục: ${error || err.message}`); 
        } finally {
            setLoading(false);
            setUploadProgress(null);
        }
    };

    return (
        <div className="category-form-page">
            <div className="category-form-container">
                <form onSubmit={handleSubmit}>
                    <header className="form-header">
                        <h1 className="form-title">
                            {isEditMode ? `✏️ Chỉnh Sửa Danh Mục: ${initialData?.name || 'N/A'}` : '➕ Thêm Danh Mục Sản Phẩm Mới'}
                        </h1>
                        <div className="header-buttons">
                            <button type="button" onClick={onCancel} className="button-cancel">
                                Hủy Bỏ
                            </button>
                            <button type="submit" disabled={loading} className="button-submit">
                                <span>💾</span>
                                {loading ? 'Đang lưu...' : (isEditMode ? 'Lưu Danh Mục' : 'Tạo Danh Mục')}
                            </button>
                        </div>
                    </header>

                    <div className="max-w-4xl mx-auto">
                        {/* 1. Thông Tin Cơ Bản */}
                        <FormContainer title="Thông Tin Cơ Bản">
                            {/* Tên Danh Mục */}
                            <div className="form-field-group">
                                <label className="form-label">Tên Danh Mục (*)</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Ví dụ: Đồ Dùng Nhà Bếp"
                                    required
                                />
                            </div>

                            {/* Slug/Đường dẫn URL */}
                            <div className="form-field-group">
                                <label className="form-label">Slug/Đường dẫn URL</label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="do-dung-nha-bep"
                                />
                                <p className="form-text-hint">Đường dẫn tự động tạo nếu để trống, quan trọng cho SEO.</p>
                            </div>

                            {/* Danh Mục Cha */}
                            <div className="form-field-group">
                                <label className="form-label">Danh Mục Cha (Parent Category)</label>
                                <select
                                    name="parentId"
                                    value={formData.parentId}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    <option value="">-- Chọn Danh Mục Cha (Không bắt buộc) --</option>
                                    {allCategories.map(cat => (
                                        cat.id !== initialData?.id && (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        )
                                    ))}
                                </select>
                            </div>

                            {/* Mô Tả Danh Mục */}
                            <div className="form-field-group">
                                <label className="form-label">Mô Tả Danh Mục</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="form-textarea"
                                    placeholder="Mô tả ngắn gọn về danh mục này..."
                                />
                                <p className="form-text-hint">Mô tả này có thể hiển thị trên trang danh mục, hữu ích cho SEO.</p>
                            </div>
                            
                            {/* SỐ LƯỢNG SẢN PHẨM (MỚI) */}
                            <div className="form-field-group">
                                <label className="form-label">Số Lượng Sản Phẩm (Product Count)</label>
                                <input
                                    type="number"
                                    name="product_count"
                                    value={formData.product_count}
                                    onChange={handleChange}
                                    className="form-input"
                                    min="0"
                                />
                                <p className="form-text-hint">Số lượng sản phẩm thuộc danh mục này.</p>
                            </div>

                            {/* Trạng thái hiển thị */}
                            <div className="form-field-group">
                                <label className="form-label">Trạng Thái</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="form-select"
                                >
                                    <option value="visible">Hiển thị</option>
                                    <option value="hidden">Ẩn</option>
                                </select>
                            </div>
                        </FormContainer>

                        <div className="form-grid-layout">
                            {/* Hình Ảnh Đại Diện (Icon) - ĐÃ SỬA */}
                            <div className="form-sub-section">
                                <h3 className="form-sub-title">Icon / Hình Ảnh Đại Diện</h3>
                                
                                {/* ẨN INPUT DÁN URL ĐI VÀ CHỈ DÙNG INPUT FILE */}
                                <input
                                    type="file"
                                    name="imageFile"
                                    onChange={handleFileChange}
                                    className="form-input form-input-small mb-3"
                                    accept=".jpg,.jpeg,.png,.gif,.webp,.ico,image/*"
                                />

                                <div className="icon-upload-area">
                                    {/* HIỂN THỊ ICON ĐÃ TẢI LÊN HOẶC ICON MỚI */}
                                    {isImagePath(formData.icon) ? (
                                        <img src={formData.icon} alt="Icon Preview" className="icon-preview" />
                                    ) : (
                                        <span className="icon-placeholder">
                                            {imageFile ? imageFile.name : initialData?.icon ? "Ảnh cũ/Chưa có ảnh" : "Chưa có ảnh"}
                                        </span>
                                    )}
                                </div>
                                <p className="form-text-hint text-center">Tải lên hình ảnh đại diện cho danh mục (dạng JPG, PNG, GIF).</p>
                                {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                            </div>

                            {/* SEO (Giữ nguyên) */}
                            <div className="form-sub-section">
                                <h3 className="form-sub-title">Cài Đặt SEO</h3>

                                <div className="form-field-group">
                                    <label className="form-label">Meta Title</label>
                                    <input
                                        type="text"
                                        name="metaTitle"
                                        value={formData.metaTitle}
                                        onChange={handleChange}
                                        className="form-input form-input-small"
                                    />
                                </div>

                                <div className="form-field-group">
                                    <label className="form-label">Meta Description</label>
                                    <textarea
                                        rows={2}
                                        name="metaDescription"
                                        value={formData.metaDescription}
                                        onChange={handleChange}
                                        className="form-textarea form-input-small"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nút Lưu Cuối Cùng */}
                        <div className="final-submit-group">
                            <button type="submit" disabled={loading} className="final-submit-button">
                                {loading ? 'Đang lưu...' : (isEditMode ? 'Lưu & Hoàn Tất Chỉnh Sửa' : 'Tạo Danh Mục Mới')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}