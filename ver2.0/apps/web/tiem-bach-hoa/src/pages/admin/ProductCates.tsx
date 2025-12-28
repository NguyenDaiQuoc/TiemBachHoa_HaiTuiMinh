import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, setDoc } from "firebase/firestore";
import { adminDb as db } from "../../firebase-admin";
import AdminSidebar from "../../components/admin/Sidebar";
import AdminCategoryFormPage from "./CategoryForm"; // ⭐️ IMPORT COMPONENT FORM MỚI ⭐️
import "../../../css/admin/productcates.css";

// --- INTERFACE DỮ LIỆU ---
interface CategoryData {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  status: 'Hiển thị' | 'Ẩn';
  product_count: number;
  icon: string;
  children?: CategoryData[];
}

// ... (Hàm isImagePath và buildCategoryTree giữ nguyên) ...
const isImagePath = (iconString: string): boolean => {
  if (!iconString) return false;
  const cleanString = iconString.split('?')[0].toLowerCase();
  return /\.(png|jpe?g|svg|gif|webp|ico)$/i.test(cleanString);
};

const buildCategoryTree = (data: CategoryData[], parentId: string | null = null): CategoryData[] => {
  return data
    .filter(category => category.parentId === parentId)
    .map(category => ({
      ...category,
      children: buildCategoryTree(data, category.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};
// ... (Hết hàm isImagePath và buildCategoryTree) ...


// --- COMPONENT HÀNG DANH MỤC (Cập nhật props) ---
function CategoryRow({ category, level = 0, onEdit, onDelete }: {
  category: CategoryData,
  level?: number,
  onEdit: (cat: CategoryData) => void,
  onDelete: (id: string, name: string) => void
}) {
  const indent = level * 20;
  const statusClass = category.status === 'Hiển thị' ? 'status-visible' : 'status-hidden';

  const IconElement = isImagePath(category.icon) ? (
    <img
      src={category.icon}
      alt={`${category.name} icon`}
      className="cate-category-icon-img" // Đã đổi tên class thành category-icon-img để thống nhất
      key={`img-${category.id}`}
    />
  ) : (
    <span className="category-icon-emoji" key={`emoji-${category.id}`}>{category.icon}</span>
  );

  return (
    <>
      <tr className="category-row">
        <td style={{ paddingLeft: `${20 + indent}px` }}>
          <div className="category-content-cell">
            <span className="prefix">{level > 0 ? '↳' : '•'}</span>
            {IconElement}
            <span className="category-name">{category.name}</span>
          </div>
        </td>
        <td>{category.slug}</td>
        <td>{category.product_count}</td>
        <td>{category.parentId || "---"}</td>
        <td><span className={`status ${statusClass}`}>{category.status}</span></td>
        <td>
          <button className="cate-btn-edit" onClick={() => onEdit(category)}>Sửa</button>
          <button className="cate-btn-delete" onClick={() => onDelete(category.id, category.name)}>Xóa</button>
        </td>
      </tr>
      {category.children && category.children.map(child => (
        <CategoryRow
          key={child.id}
          category={child}
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

// --- COMPONENT CHÍNH: ADMIN CATEGORY PAGE ---
export default function ProdCates() {
  const [loading, setLoading] = useState(true);
  const [categoriesTree, setCategoriesTree] = useState<CategoryData[]>([]);

  // ⭐️ STATE MỚI QUẢN LÝ FORM ⭐️
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);

  // Hàm tải dữ liệu (giữ nguyên)
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "categories"));
      // ... (Logic xử lý dữ liệu) ...
      const flatCategories: CategoryData[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const firestoreParentId = data.parenID || data.parentId;
        let processedParentId: string | null = null;
        if (firestoreParentId && firestoreParentId !== "null") {
          processedParentId = firestoreParentId;
        }

        const processedStatus: 'Hiển thị' | 'Ẩn' =
          data.status === 'visible' || data.status === 'Visible'
            ? 'Hiển thị'
            : 'Ẩn';

        return {
          id: doc.id,
          name: data.name || "N/A",
          slug: data.slug || "n-a",
          parentId: processedParentId,
          status: processedStatus,
          product_count: data.product_count || 0,
          icon: data.icon || '📁',
        } as CategoryData;
      });
      // Tính lại product_count bằng cách đếm các products trên toàn bộ collection
      try {
        const prodSnapshot = await getDocs(collection(db, "products"));
        const counts: Record<string, number> = {};
        prodSnapshot.docs.forEach(d => {
          const p: any = d.data();
          const slugs: string[] = p.categorySlugs || [];
          slugs.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
        });
        // Merge counts vào flatCategories
        const merged = flatCategories.map(fc => ({ ...fc, product_count: counts[fc.slug] || 0 }));
        const tree = buildCategoryTree(merged);
        setCategoriesTree(tree);
      } catch (countErr) {
        console.error('Không thể tính product counts:', countErr);
        const tree = buildCategoryTree(flatCategories);
        setCategoriesTree(tree);
      }

    } catch (error) {
      console.error("Lỗi khi tải danh mục sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);


  // --- HÀM XỬ LÝ FORM ---

  // Mở form thêm mới
  const handleOpenFormNew = () => {
    setEditingCategory(null); // Đặt null để báo hiệu chế độ thêm mới
    setIsFormOpen(true);
  };

  // Mở form chỉnh sửa
  const handleEditCategory = (category: CategoryData) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  // Đóng form và refresh data
  const handleCloseForm = (shouldRefresh = false) => {
    setIsFormOpen(false);
    setEditingCategory(null);
    if (shouldRefresh) {
      fetchCategories();
    }
  };


  // --- HÀM XỬ LÝ XÓA ---
  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"? Thao tác này không thể hoàn tác!`)) {
      try {
        await deleteDoc(doc(db, "categories", id));
        alert(`Danh mục "${name}" đã được xóa thành công.`);
        fetchCategories(); // Tải lại dữ liệu
      } catch (error) {
        console.error("Lỗi khi xóa danh mục:", error);
        alert("Lỗi: Không thể xóa danh mục.");
      }
    }
  };


  // Nếu form đang mở, hiển thị form thay vì bảng
  if (isFormOpen) {
    return (
      <AdminCategoryFormPage
        initialData={editingCategory}
        onSave={handleCloseForm} // Hàm này sẽ được gọi khi form lưu thành công
        onCancel={() => handleCloseForm(false)}
      />
    );
  }

  // Nếu form đóng, hiển thị bảng danh mục
  return (
    <div className="cate-dashboard-container">
      <AdminSidebar />
      <main className="cate-dashboard-content">

        <header className="cate-content-header">
          <h1 className="cate-content-title">Quản Lý Danh Mục Sản Phẩm</h1>
          <button className="cate-btn-add-category" onClick={handleOpenFormNew}>📁 Thêm Danh Mục Mới</button>
        </header>

        {loading ? (
          <p>Đang tải dữ liệu danh mục...</p>
        ) : (
          <div className="cate-table-container">
            <table className="cate-category-table">
              <thead>
                <tr>
                  <th>Tên Danh Mục</th>
                  <th>Slug (URL)</th>
                  <th>Số Sản Phẩm</th>
                  <th>Danh Mục Cha (ID)</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {categoriesTree.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>Chưa có danh mục nào được tạo.</td></tr>
                ) : (
                  categoriesTree.map(cat => (
                    <CategoryRow
                      key={cat.id}
                      category={cat}
                      onEdit={handleEditCategory}
                      onDelete={handleDeleteCategory}
                    />
                  ))
                )}
              </tbody>
            </table>
            <div className="cate-table-note">
              * Lưu ý: Cấu trúc danh mục phân cấp (cha/con) được hiển thị bằng ký hiệu "↳".
            </div>
          </div>
        )}

        <div className="seo-tool">
          <h3>Công Cụ SEO Danh Mục</h3>
          <p>→ Mẹo: Đảm bảo trường <strong>Slug</strong> ngắn gọn, chứa từ khóa chính và không dấu để tối ưu hóa SEO.</p>
        </div>
      </main>
    </div>
  );
}