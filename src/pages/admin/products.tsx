import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Eye,
  Loader2,
  PackagePlus,
  Pencil,
  Printer,
  Plus,
  Search,
  Tags,
  Trash2,
  Warehouse,
  X,
  FileSpreadsheet,
  ImagePlus,
  Upload,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, productKeys } from '@/src/entities/product/api/product-api';
import { useCategories } from '@/src/entities/category/api/category-api';
import { Product } from '@/src/entities/product/model/types';
import { adminService } from '@/src/entities/admin/api/admin-service';
import { InventoryReceiptPayload, InventoryReceiptUpsertPayload } from '@/src/entities/admin/model/types';
import { useAdminUiStore } from '@/src/shared/store/admin-ui-store';
import { queryClient } from '@/src/shared/lib/react-query';
import { downloadExcelTable } from '@/src/shared/lib/excel';
import { exportReceiptPdf } from '@/src/shared/lib/receipt-pdf';
import { Button } from '@/src/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/ui/dialog';
import { Input } from '@/src/shared/ui/input';
import { cn, formatCurrencyVND } from '@/src/shared/lib/utils';
import type { AdminOutletContext } from '@/src/app/layouts/admin-layout';
import { ProductForm } from './components/product-form';

type ProductTab = 'receiving' | 'warehouse' | 'catalog';
type ReceiptMode = 'RESTOCK' | 'ON_DEMAND';

type ReceiptLineDraft = {
  id: string;
  productId: string;
  categoryId: string;
  search: string;
  imageUrl: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
};

const copy = {
  vi: {
    title: 'Sản phẩm và kho',
    subtitle: 'Quản lý phiếu nhập, tồn kho, SKU và danh mục bán hàng.',
    tabs: {
      receiving: 'Nhập hàng',
      warehouse: 'Kho',
      catalog: 'Sản phẩm',
    },
    addProduct: 'Thêm sản phẩm',
    exportExcel: 'Xuất Excel',
    editProduct: 'Cập nhật sản phẩm',
    createProduct: 'Thêm sản phẩm mới',
    quickView: 'Xem nhanh',
    receivingTitle: 'Phiếu nhập hàng',
    receivingHint: 'Mỗi phiếu nhập đại diện cho một hóa đơn theo ngày và nhà cung cấp. Có thể thêm nhiều mặt hàng trong cùng một phiếu.',
    receiptModeLabel: 'Kieu nhap',
    receiptModeRestock: 'Nhap kho',
    receiptModeOnDemand: 'Nguon cung thu 3',
    receiptModeHelp: 'Chon nhap kho neu muon cong ton; chon nguon cung thu 3 neu chi ghi nhan dau vao theo don.',
    createReceipt: 'Tạo phiếu nhập',
    editReceipt: 'Sửa phiếu nhập',
    supplier: 'Nhà cung cấp',
    receivedAt: 'Ngày nhập',
    note: 'Ghi chú',
    receiptCode: 'Mã phiếu',
    receiptItems: 'Mặt hàng',
    addLine: 'Thêm dòng sản phẩm',
    productLookup: 'Tìm theo tên hoặc SKU',
    quantity: 'Số lượng',
    importCost: 'Giá nhập',
    salePrice: 'Giá bán',
    saveReceipt: 'Lưu phiếu nhập',
    updateReceipt: 'Cập nhật phiếu nhập',
    deleteReceipt: 'Xóa phiếu nhập',
    receiptSaved: 'Đã lưu phiếu nhập.',
    receiptUpdated: 'Đã cập nhật phiếu nhập.',
    receiptDeleted: 'Đã xóa phiếu nhập.',
    receiptRequired: 'Phiếu nhập cần ít nhất 1 mặt hàng hợp lệ.',
    noReceipts: 'Chưa có phiếu nhập kho nào.',
    lineProduct: 'Sản phẩm',
    lineSummary: 'Tạm tính',
    grandTotal: 'Tổng cộng',
    averageCost: 'Giá nhập TB',
    warehouseSummary: 'Tình trạng kho',
    lowStock: 'Sắp hết hàng',
    healthy: 'Ổn định',
    variants: 'SKU phụ',
    stock: 'Tồn kho',
    initialStock: 'Tồn ban đầu',
    threshold: 'Ngưỡng cảnh báo',
    promoPrice: 'Khuyến mãi',
    sold: 'Đã bán',
    actions: 'Thao tác',
    deleteConfirm: 'Bạn có chắc muốn ẩn sản phẩm này khỏi gian hàng không?',
    saved: 'Đã lưu sản phẩm.',
    created: 'Đã tạo sản phẩm mới.',
    deleted: 'Đã ẩn sản phẩm khỏi gian hàng.',
    noProducts: 'Chưa có sản phẩm phù hợp.',
    details: 'Chi tiết',
    warehouseAlert: 'Cảnh báo tồn kho thấp',
    inventoryHint: 'Sản phẩm được cảnh báo khi tồn kho còn dưới 50% tồn ban đầu hoặc thấp hơn mức cảnh báo tự đặt.',
    lowStockOnly: 'Chỉ xem sắp hết hàng',
    allProducts: 'Hiện tất cả',
    selectedItems: 'mặt hàng',
    totalQuantity: 'Tổng SL',
  },
  en: {
    title: 'Products and inventory',
    subtitle: 'Manage receipts, stock levels, SKUs, and sellable catalog data.',
    tabs: {
      receiving: 'Receiving',
      warehouse: 'Warehouse',
      catalog: 'Catalog',
    },
    addProduct: 'Add product',
    exportExcel: 'Export Excel',
    editProduct: 'Update product',
    createProduct: 'Create product',
    quickView: 'Quick view',
    receivingTitle: 'Inventory receipts',
    receivingHint: 'Each receipt represents one supplier invoice per day and can contain multiple products.',
    receiptModeLabel: 'Import mode',
    receiptModeRestock: 'Restock',
    receiptModeOnDemand: 'Third-party source',
    receiptModeHelp: 'Use restock when inventory should increase; use third-party source when you only want to record incoming supply.',
    createReceipt: 'Create receipt',
    editReceipt: 'Edit receipt',
    supplier: 'Supplier',
    receivedAt: 'Received date',
    note: 'Note',
    receiptCode: 'Receipt code',
    receiptItems: 'Items',
    addLine: 'Add item line',
    productLookup: 'Search by name or SKU',
    quantity: 'Quantity',
    importCost: 'Cost price',
    salePrice: 'Sale price',
    saveReceipt: 'Save receipt',
    updateReceipt: 'Update receipt',
    deleteReceipt: 'Delete receipt',
    receiptSaved: 'Receipt saved.',
    receiptUpdated: 'Receipt updated.',
    receiptDeleted: 'Receipt deleted.',
    receiptRequired: 'At least one valid line item is required.',
    noReceipts: 'No inventory receipts yet.',
    lineProduct: 'Product',
    lineSummary: 'Line total',
    grandTotal: 'Grand total',
    averageCost: 'Avg cost',
    warehouseSummary: 'Warehouse health',
    lowStock: 'Low stock',
    healthy: 'Healthy',
    variants: 'Variant SKUs',
    stock: 'Stock',
    initialStock: 'Initial stock',
    threshold: 'Alert threshold',
    promoPrice: 'Promo price',
    sold: 'Sold',
    actions: 'Actions',
    deleteConfirm: 'Hide this product from the storefront?',
    saved: 'Product updated.',
    created: 'Product created.',
    deleted: 'Product hidden from storefront.',
    noProducts: 'No matching products found.',
    details: 'Details',
    warehouseAlert: 'Low stock alert',
    inventoryHint: 'Items are flagged when stock falls below 50% of initial stock or below a custom threshold.',
    lowStockOnly: 'Low stock only',
    allProducts: 'Show all',
    selectedItems: 'items',
    totalQuantity: 'Total qty',
  },
} as const;

const getPrimaryImage = (product: Product) => product.images?.[0] || product.image || 'https://via.placeholder.com/320x320?text=HTM';
const getVariantCount = (product: Product) => product.variants?.reduce((sum, group) => sum + group.options.length, 0) || 0;

const isLowStock = (product: Product) => {
  if (product.initialStock !== undefined && product.initialStock <= 2) return false;
  const fallbackThreshold = product.initialStock ? Math.ceil(product.initialStock * 0.5) : 0;
  const threshold = Math.max(product.reorderLevel || 0, fallbackThreshold);
  return threshold > 0 && product.stock <= threshold;
};

const createEmptyLine = (): ReceiptLineDraft => ({
  id: crypto.randomUUID(),
  productId: '',
  categoryId: '',
  search: '',
  imageUrl: '',
  quantity: 1,
  costPrice: 0,
  salePrice: 0,
});

const normalizeCurrencyInput = (value: string) => {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
};

const formatCurrencyInput = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, Number(value) || 0));

const normalizeLookupText = (value: string) => value.trim().toLowerCase();

const slugifyProductName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `combo-${Date.now()}`;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const AdminProducts = () => {
  const { refreshTick } = useOutletContext<AdminOutletContext>();
  const locale = useAdminUiStore((state) => state.locale);
  const t = copy[locale];
  const receiptTooltips = {
    createReceipt: locale === 'vi' ? 'Tao phieu nhap moi' : 'Create a new receipt',
    exportExcel: locale === 'vi' ? 'Xuat phieu nhap ra Excel' : 'Export receipt to Excel',
    exportPdf: locale === 'vi' ? 'In hoac tai PDF phieu nhap' : 'Print or download receipt PDF',
    addLine: locale === 'vi' ? 'Them mot dong san pham' : 'Add one product line',
    editReceipt: locale === 'vi' ? 'Sua phieu nhap' : 'Edit receipt',
    deleteReceipt: locale === 'vi' ? 'Xoa phieu nhap' : 'Delete receipt',
    removeLine: locale === 'vi' ? 'Xoa dong san pham' : 'Remove product line',
    uploadImage: locale === 'vi' ? 'Tai anh san pham' : 'Upload product image',
  };
  const [activeTab, setActiveTab] = useState<ProductTab>('receiving');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [receipts, setReceipts] = useState<InventoryReceiptPayload[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<InventoryReceiptPayload | null>(null);
  const [receiptSupplier, setReceiptSupplier] = useState('');
  const [isSupplierPickerOpen, setIsSupplierPickerOpen] = useState(false);
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptNote, setReceiptNote] = useState('');
  const [receiptMode, setReceiptMode] = useState<ReceiptMode>('RESTOCK');
  const [receiptLines, setReceiptLines] = useState<ReceiptLineDraft[]>([createEmptyLine()]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comboName, setComboName] = useState('');
  const [comboPrice, setComboPrice] = useState(0);
  const [comboCategoryId, setComboCategoryId] = useState('');
  const [comboProductIds, setComboProductIds] = useState<string[]>([]);

  const { data, isLoading, refetch } = useProducts({ query: catalogQuery, page: 1, limit: 200 });
  const { data: categoryData } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  useEffect(() => {
    refetch();
  }, [refreshTick, refetch]);

  useEffect(() => {
    let active = true;
    setReceiptsLoading(true);

    adminService
      .getInventoryReceipts()
      .then((payload) => {
        if (active) setReceipts(payload);
      })
      .catch((error) => {
        if (active) toast.error(error.message || 'Không thể tải phiếu nhập');
      })
      .finally(() => {
        if (active) setReceiptsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTick]);

  useEffect(() => {
    let active = true;
    adminService
      .getSuppliers()
      .then((payload) => {
        if (active) {
          setSuppliers(payload.filter((item) => item.isActive).map((item) => ({ id: item.id, name: item.name, isActive: item.isActive })));
        }
      })
      .catch(() => {
        if (active) setSuppliers([]);
      });

    return () => {
      active = false;
    };
  }, [refreshTick]);

  const products = useMemo(() => data?.items || [], [data]);
  const categories = useMemo(() => (categoryData || []).filter((category: { isActive?: boolean }) => category.isActive !== false), [categoryData]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const comboProducts = useMemo(() => comboProductIds.map((id) => productMap.get(id)).filter((product): product is Product => Boolean(product)), [comboProductIds, productMap]);
  const comboSuggestedPrice = useMemo(() => Math.max(0, comboProducts.reduce((sum, product) => sum + product.price, 0)), [comboProducts]);
  const supplierSuggestions = useMemo(() => {
    const lookup = normalizeLookupText(receiptSupplier);
    const matched = lookup ? suppliers.filter((supplier) => normalizeLookupText(supplier.name).includes(lookup)) : suppliers;
    return matched.slice(0, 8);
  }, [receiptSupplier, suppliers]);
  const findProductForLine = (line: ReceiptLineDraft) => {
    const selected = line.productId ? productMap.get(line.productId) : null;
    if (selected) return selected;

    const lookup = normalizeLookupText(line.search);
    if (!lookup) return null;

    return (
      products.find((product) => normalizeLookupText(product.name) === lookup || normalizeLookupText(product.sku || '') === lookup) ||
      products.find((product) => normalizeLookupText(product.name).includes(lookup) || normalizeLookupText(product.sku || '').includes(lookup)) ||
      null
    );
  };

  const findProductForSearch = (search: string) => {
    const lookup = normalizeLookupText(search);
    if (!lookup) return null;

    return products.find((product) => normalizeLookupText(product.name) === lookup || normalizeLookupText(product.sku || '') === lookup) || null;
  };

  const warehouseProducts = useMemo(() => {
    const base = showLowStockOnly ? products.filter(isLowStock) : products;
    return [...base].sort((left, right) => {
      if (isLowStock(left) !== isLowStock(right)) return isLowStock(left) ? -1 : 1;
      return left.stock - right.stock;
    });
  }, [products, showLowStockOnly]);

  const catalogProducts = useMemo(() => {
    return [...products].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [products]);

  const lowStockCount = useMemo(() => products.filter(isLowStock).length, [products]);
  const healthyCount = Math.max(products.length - lowStockCount, 0);
  const resolvedReceiptLines = receiptLines
    .map((line) => {
      const product = findProductForLine(line);
      return {
        line,
        product,
        productName: product?.name || line.search.trim(),
        imageUrl: line.imageUrl.trim() || (product ? getPrimaryImage(product) : ''),
      };
    })
    .filter((item) => !!item.product || !!item.productName);
  const totalReceiptQuantity = resolvedReceiptLines.reduce((sum, { line }) => sum + Math.max(1, Number(line.quantity) || 1), 0);
  const totalReceiptAmount = resolvedReceiptLines.reduce((sum, { line }) => sum + Math.max(1, Number(line.quantity) || 1) * Math.max(0, Number(line.costPrice) || 0), 0);
  const validReceiptLines = resolvedReceiptLines;
  const receiptPreview = {
    code: editingReceipt?.code || `DRAFT-${receiptDate.replaceAll('-', '') || Date.now()}`,
    mode: receiptMode,
    supplier: receiptSupplier || null,
    note: receiptNote || null,
    createdAt: receiptDate ? new Date(`${receiptDate}T08:00:00`).toISOString() : new Date().toISOString(),
    items: validReceiptLines.map(({ line, product, productName }) => ({
      productId: product?.id || '',
      quantity: Math.max(1, Number(line.quantity) || 1),
      costPrice: Math.max(0, Number(line.costPrice) || 0),
      salePrice: Math.max(1, Number(line.salePrice) || 0),
      product: { name: productName, sku: product?.sku },
    })),
  };

  const resetReceiptForm = () => {
    setEditingReceipt(null);
    setReceiptSupplier('');
    setReceiptDate(new Date().toISOString().slice(0, 10));
    setReceiptNote('');
    setReceiptMode('RESTOCK');
    setReceiptLines([createEmptyLine()]);
  };

  const loadReceiptIntoForm = (receipt: InventoryReceiptPayload) => {
    setEditingReceipt(receipt);
    setReceiptSupplier(receipt.supplier || '');
    setReceiptDate(new Date(receipt.createdAt).toISOString().slice(0, 10));
    setReceiptNote(receipt.note || '');
    setReceiptMode(receipt.mode === 'ON_DEMAND' ? 'ON_DEMAND' : 'RESTOCK');
    setReceiptLines(
      receipt.items.map((item) => ({
        id: crypto.randomUUID(),
        productId: item.productId,
        categoryId: '',
        search: item.product?.name || item.product?.sku || '',
        imageUrl: item.product?.images?.[0] || '',
        quantity: item.quantity,
        costPrice: item.costPrice,
        salePrice: item.salePrice,
      }))
    );
    setIsReceiptDialogOpen(true);
  };

  const openCreateReceiptDialog = () => {
    resetReceiptForm();
    setIsReceiptDialogOpen(true);
  };

  const refreshReceiptData = async () => {
    const [updatedReceipts] = await Promise.all([
      adminService.getInventoryReceipts(),
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
    ]);
    setReceipts(updatedReceipts);
    await refetch();
  };

  const buildReceiptRows = (receipt: {
    code: string;
    supplier?: string | null;
    note?: string | null;
    createdAt: string;
    items: Array<{
      quantity: number;
      costPrice: number;
      salePrice: number;
      productId: string;
      product?: { name?: string | null; sku?: string | null } | null;
    }>;
  }) => {
    const totalQuantity = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = receipt.items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

    return [
      ['Phiếu nhập', receipt.code],
      ['Nhà cung cấp', receipt.supplier || '-'],
      ['Ngày nhập', new Date(receipt.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')],
      ['Ghi chú', receipt.note || '-'],
      [],
      ['STT', 'Sản phẩm', 'SKU', 'Số lượng', 'Giá nhập', 'Giá bán', 'Thành tiền'],
      ...receipt.items.map((item, index) => [
        String(index + 1),
        item.product?.name || item.productId,
        item.product?.sku || '',
        String(item.quantity),
        String(item.costPrice),
        String(item.salePrice),
        String(item.quantity * item.costPrice),
      ]),
      [],
      ['', '', 'Tổng cộng', String(totalQuantity), '', '', String(totalCost)],
    ];
  };

  const exportReceiptToExcel = (receipt: {
    code: string;
    supplier?: string | null;
    note?: string | null;
    createdAt: string;
    items: Array<{
      quantity: number;
      costPrice: number;
      salePrice: number;
      productId: string;
      product?: { name?: string | null; sku?: string | null } | null;
    }>;
  }) => {
    downloadExcelTable(`${receipt.code}.xls`, receipt.code, buildReceiptRows(receipt));
  };

  const exportReceiptToPdfFile = async (receipt: {
    code: string;
    supplier?: string | null;
    note?: string | null;
    createdAt: string;
    items: Array<{
      quantity: number;
      costPrice: number;
      salePrice: number;
      productId: string;
      product?: { name?: string | null; sku?: string | null } | null;
    }>;
  }) => {
    try {
      await exportReceiptPdf(receipt, locale);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : locale === 'vi' ? 'Không thể xuất PDF phiếu nhập.' : 'Unable to export the receipt PDF.');
    }
  };

  const updateReceiptLine = (lineId: string, patch: Partial<ReceiptLineDraft>) => {
    setReceiptLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  };

  const handleReceiptSearchChange = (lineId: string, search: string) => {
    updateReceiptLine(lineId, { search, productId: '' });

    const selected = findProductForSearch(search);
    if (selected) {
      handleProductSelect(lineId, selected);
    }
  };

  const handleProductSelect = (lineId: string, product: Product) => {
    updateReceiptLine(lineId, {
      productId: product.id,
      categoryId: product.categoryId || '',
      search: product.name,
      imageUrl: getPrimaryImage(product),
      costPrice: product.costPrice || 0,
      salePrice: product.price,
    });
  };

  const handleReceiptImageUpload = async (lineId: string, file?: File) => {
    if (!file) return;

    try {
      const imageUrl = await readFileAsDataUrl(file);
      updateReceiptLine(lineId, { imageUrl });
    } catch {
      toast.error(locale === 'vi' ? 'Khong the doc anh san pham.' : 'Unable to read product image.');
    }
  };

  const resolveReceiptLineBySearch = (line: ReceiptLineDraft) => {
    const product = findProductForLine(line);
    if (product) handleProductSelect(line.id, product);
  };

  const receiptLineMatches = (line: ReceiptLineDraft) => {
    const lookup = normalizeLookupText(line.search);
    if (!lookup) return [];

    return products
      .filter((product) => `${product.name} ${product.sku || ''}`.toLowerCase().includes(lookup))
      .slice(0, 6);
  };

  const handleSaveReceipt = async () => {
    const normalizedLines = validReceiptLines.map(({ line, product, productName, imageUrl }) => ({
      productId: product?.id,
      productName: product ? undefined : productName,
      categoryId: product ? undefined : line.categoryId || undefined,
      imageUrl: imageUrl || undefined,
      quantity: Math.max(1, Number(line.quantity) || 1),
      costPrice: Math.max(0, Number(line.costPrice) || 0),
      salePrice: Math.max(1, Number(line.salePrice) || 0),
    }));

    if (normalizedLines.length === 0 || normalizedLines.some((line) => (!line.productId && (!line.productName || !line.categoryId)) || line.salePrice <= 0 || line.quantity <= 0)) {
      toast.error(t.receiptRequired);
      return;
    }

    const payload: InventoryReceiptUpsertPayload = {
      mode: receiptMode,
      supplier: receiptSupplier || undefined,
      note: receiptNote || undefined,
      receivedAt: new Date(`${receiptDate}T08:00:00`).toISOString(),
      items: normalizedLines,
    };

    setReceiptSubmitting(true);
    try {
      if (editingReceipt) {
        await adminService.updateInventoryReceipt(editingReceipt.id, payload);
        toast.success(t.receiptUpdated);
      } else {
        await adminService.createInventoryReceipt(payload);
        toast.success(t.receiptSaved);
      }

      setIsReceiptDialogOpen(false);
      resetReceiptForm();
      await refreshReceiptData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu phiếu nhập');
    } finally {
      setReceiptSubmitting(false);
    }
  };

  const handleDeleteReceipt = async (receipt: InventoryReceiptPayload) => {
    const confirmed = window.confirm(`${t.deleteReceipt}: ${receipt.code}?`);
    if (!confirmed) return;

    try {
      await adminService.deleteInventoryReceipt(receipt.id);
      toast.success(t.receiptDeleted);
      await refreshReceiptData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa phiếu nhập');
    }
  };

  const openCreateDialog = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const openCreateComboDialog = () => {
    setComboName('');
    setComboPrice(0);
    setComboProductIds([]);
    setComboCategoryId(categories[0]?.id || '');
    setIsComboDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t.deleted);
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa sản phẩm');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (selectedProduct) {
        await updateMutation.mutateAsync({ id: selectedProduct.id, data: formData });
        toast.success(t.saved);
      } else {
        await createMutation.mutateAsync(formData);
        toast.success(t.created);
      }

      setIsFormOpen(false);
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu sản phẩm');
    }
  };

  const handleCreateCombo = async () => {
    if (!comboName.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng nhập tên combo.' : 'Enter a combo name.');
      return;
    }
    if (comboProducts.length < 2) {
      toast.error(locale === 'vi' ? 'Combo cần ít nhất 2 sản phẩm.' : 'A combo needs at least 2 products.');
      return;
    }
    if (!comboCategoryId) {
      toast.error(locale === 'vi' ? 'Vui lòng chọn danh mục cho combo.' : 'Select a combo category.');
      return;
    }

    const finalPrice = Math.max(1, comboPrice || Math.round(comboSuggestedPrice * 0.9));
    const stock = Math.max(0, Math.min(...comboProducts.map((product) => Math.max(0, product.stock || 0))));

    try {
      await createMutation.mutateAsync({
        name: comboName.trim(),
        slug: `${slugifyProductName(comboName)}-${Date.now().toString(36)}`,
        sku: `COMBO-${Date.now()}`,
        description: `Combo gồm: ${comboProducts.map((product) => product.name).join(', ')}.`,
        costPrice: comboProducts.reduce((sum, product) => sum + (product.costPrice || 0), 0),
        price: finalPrice,
        promotionalPrice: finalPrice,
        images: comboProducts.map(getPrimaryImage).filter(Boolean).slice(0, 4),
        categoryId: comboCategoryId,
        brand: 'Hai Tụi Mình Combo',
        subcategory: 'Combo',
        tags: ['combo', ...comboProducts.map((product) => `combo:${product.id}`)],
        stock,
        initialStock: stock,
        reorderLevel: 0,
        variants: [],
      });
      toast.success(locale === 'vi' ? 'Đã tạo combo sản phẩm.' : 'Product combo created.');
      setIsComboDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      refetch();
    } catch (error: any) {
      toast.error(error.message || (locale === 'vi' ? 'Không thể tạo combo.' : 'Unable to create combo.'));
    }
  };

  const exportCatalog = () => {
    downloadExcelTable(`admin-products-${Date.now()}.xls`, 'Products', [
      ['Tên sản phẩm', 'SKU', 'Danh mục', 'Giá nhập', 'Giá bán', 'Khuyến mãi', 'Tồn kho', 'Tồn ban đầu', 'Đã bán'],
      ...catalogProducts.map((product) => [
        product.name,
        product.sku || '',
        typeof product.category === 'string' ? product.category : product.category?.name || '',
        String(product.costPrice || 0),
        String(product.price),
        String(product.promotionalPrice || ''),
        String(product.stock),
        String(product.initialStock || 0),
        String(product.soldCount),
      ]),
    ]);
  };

  const tabs: Array<{ key: ProductTab; label: string; icon: typeof PackagePlus }> = [
    { key: 'receiving', label: t.tabs.receiving, icon: ClipboardList },
    { key: 'warehouse', label: t.tabs.warehouse, icon: Warehouse },
    { key: 'catalog', label: t.tabs.catalog, icon: Box },
  ];

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden sm:space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter sm:text-4xl">
            {t.title.split(' ')[0]} <span className="text-primary italic">{t.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Button variant="outline" onClick={exportCatalog} className="h-11 rounded-xl border-2 border-border px-6 text-[10px] font-black uppercase tracking-widest">
            {t.exportExcel}
          </Button>
          <Button variant="outline" onClick={openCreateComboDialog} className="h-11 rounded-xl border-2 border-primary/30 px-6 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10">
            <Tags className="mr-2 h-4 w-4" />
            {locale === 'vi' ? 'Tạo combo' : 'Create combo'}
          </Button>
          <Button onClick={openCreateDialog} className="h-11 rounded-xl bg-primary px-6 text-[10px] font-black uppercase tracking-widest">
            <Plus className="mr-2 h-4 w-4" />
            {t.addProduct}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-[24px] border border-border/50 bg-surface-default p-2 sm:flex sm:flex-wrap sm:gap-3 sm:rounded-[28px] sm:p-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase tracking-widest transition-all sm:justify-start sm:px-5',
              activeTab === tab.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'receiving' && (
          <motion.div key="receiving" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[28px] border border-border/50 bg-surface-default p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-black uppercase tracking-tight">{t.receivingTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t.receivingHint}</p>
              </div>
              <Button onClick={openCreateReceiptDialog} title={receiptTooltips.createReceipt} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest sm:self-start lg:self-auto">
                <PackagePlus className="mr-2 h-4 w-4" />
                {t.createReceipt}
              </Button>
            </div>

            {receiptsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : receipts.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-border bg-surface-default p-12 text-center text-sm text-muted-foreground">{t.noReceipts}</div>
            ) : (
              <div className="grid gap-4">
                {receipts.map((receipt) => {
                  const quantityTotal = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
                  return (
                    <div key={receipt.id} className="rounded-[32px] border border-border/50 bg-surface-default p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">{receipt.code}</span>
                            <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {receipt.items.length} {t.selectedItems}
                            </span>
                            <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {t.totalQuantity}: {quantityTotal}
                            </span>
                          </div>
                          <div className="grid gap-3 text-sm sm:grid-cols-3">
                            <div className="rounded-2xl border border-border/50 bg-background px-4 py-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.supplier}</p>
                              <p className="mt-2 font-black">{receipt.supplier || '-'}</p>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-background px-4 py-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.receivedAt}</p>
                              <p className="mt-2 font-black">{new Date(receipt.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}</p>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-background px-4 py-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.note}</p>
                              <p className="mt-2 line-clamp-2 font-black">{receipt.note || '-'}</p>
                            </div>
                          </div>
                          <div className="grid gap-2">
                            {receipt.items.map((item) => (
                              <div key={`${receipt.id}-${item.productId}`} className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-black">{item.product?.name || item.productId}</p>
                                  <p className="text-xs text-muted-foreground">{item.product?.sku || 'SKU'}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm sm:min-w-[320px]">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.quantity}</p>
                                    <p className="font-black">{item.quantity}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.importCost}</p>
                                    <p className="font-black">{formatCurrencyVND(item.costPrice)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.salePrice}</p>
                                    <p className="font-black">{formatCurrencyVND(item.salePrice)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 lg:flex-col">
                          <Button variant="ghost" size="icon" aria-label={receiptTooltips.exportExcel} title={receiptTooltips.exportExcel} className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary" onClick={() => exportReceiptToExcel(receipt)}>
                            <FileSpreadsheet className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={receiptTooltips.exportPdf} title={receiptTooltips.exportPdf} className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary" onClick={() => void exportReceiptToPdfFile(receipt)}>
                            <Printer className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={receiptTooltips.editReceipt} title={receiptTooltips.editReceipt} className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary" onClick={() => loadReceiptIntoForm(receipt)}>
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={receiptTooltips.deleteReceipt} title={receiptTooltips.deleteReceipt} className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => void handleDeleteReceipt(receipt)}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'warehouse' && (
          <motion.div key="warehouse" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[28px] border border-border/50 bg-surface-default p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.warehouseSummary}</p>
                <p className="mt-3 text-3xl font-black">{products.length}</p>
              </div>
              <div className="rounded-[28px] border border-amber-500/30 bg-amber-500/5 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">{t.lowStock}</p>
                <p className="mt-3 text-3xl font-black text-amber-600">{lowStockCount}</p>
              </div>
              <div className="rounded-[28px] border border-emerald-500/30 bg-emerald-500/5 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{t.healthy}</p>
                <p className="mt-3 text-3xl font-black text-emerald-600">{healthyCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-[28px] border border-border/50 bg-surface-default p-5">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">{t.warehouseAlert}</h2>
                <p className="text-sm text-muted-foreground">{t.inventoryHint}</p>
              </div>
              <Button variant="outline" onClick={() => setShowLowStockOnly((prev) => !prev)} className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {showLowStockOnly ? t.allProducts : t.lowStockOnly}
              </Button>
            </div>

            <div className="grid gap-4">
              {warehouseProducts.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-border bg-surface-default p-10 text-center text-sm text-muted-foreground">{t.noProducts}</div>
              ) : (
                warehouseProducts.map((product) => {
                  const low = isLowStock(product);
                  return (
                    <div key={product.id} className={cn('rounded-[28px] border p-5 transition-all', low ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/50 bg-surface-default')}>
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <img src={getPrimaryImage(product)} alt={product.name} className="h-20 w-20 rounded-2xl border border-border/50 object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black">{product.name}</h3>
                            {low && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                <AlertTriangle className="h-3 w-3" />
                                {t.lowStock}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {product.sku || 'SKU'} • {t.variants}: {getVariantCount(product)}
                          </p>
                          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.stock}</p>
                              <p className="font-black">{product.stock}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.initialStock}</p>
                              <p className="font-black">{product.initialStock || 0}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.threshold}</p>
                              <p className="font-black">{Math.max(product.reorderLevel || 0, Math.ceil((product.initialStock || 0) * 0.5))}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.sold}</p>
                              <p className="font-black">{product.soldCount}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 md:w-[250px]">
                          <div className="rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.importCost}</p>
                            <p className="font-black">{formatCurrencyVND(product.costPrice || 0)}</p>
                          </div>
                          <div className="rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.salePrice}</p>
                            <p className="font-black">{formatCurrencyVND(product.price)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'catalog' && (
          <motion.div key="catalog" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-xl">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                  placeholder={t.productLookup}
                  className="h-12 w-full rounded-2xl border border-border bg-surface-default pl-11 pr-4 text-sm font-medium outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : catalogProducts.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-border bg-surface-default p-10 text-center text-sm text-muted-foreground">{t.noProducts}</div>
              ) : (
                catalogProducts.map((product) => (
                  <div key={product.id} className="rounded-[32px] border border-border/50 bg-surface-default p-5 shadow-sm transition-all hover:border-primary/30">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <img src={getPrimaryImage(product)} alt={product.name} className="h-24 w-24 rounded-3xl border border-border/50 object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-black">{product.name}</h3>
                          {isLowStock(product) && <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">{t.lowStock}</span>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {(typeof product.category === 'string' ? product.category : product.category?.name) || 'Danh mục'} • {product.sku || 'SKU'} • {t.variants}:{' '}
                          {getVariantCount(product)}
                        </p>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.importCost}</p>
                            <p className="font-black">{formatCurrencyVND(product.costPrice || 0)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.salePrice}</p>
                            <p className="font-black">{formatCurrencyVND(product.price)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.promoPrice}</p>
                            <p className="font-black">{product.promotionalPrice ? formatCurrencyVND(product.promotionalPrice) : '-'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.stock}</p>
                            <p className="font-black">{product.stock}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsQuickViewOpen(true);
                          }}
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary" onClick={() => openEditDialog(product)}>
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-xl bg-muted/30 hover:bg-destructive/10 hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => void handleDelete(product.id)}
                        >
                          {deleteMutation.isPending && deleteMutation.variables === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto overflow-x-hidden rounded-[24px] border-none bg-surface-default p-4 shadow-2xl sm:w-full sm:rounded-[32px] sm:p-6 lg:p-8 xl:max-w-6xl">
          <DialogHeader className="-mx-1 rounded-[22px] bg-surface-default px-1 pb-4 sm:-mx-2 sm:rounded-[28px] sm:px-2">
            <DialogTitle className="pr-10 text-xl font-black uppercase italic tracking-tight sm:text-2xl">{editingReceipt ? t.editReceipt : t.createReceipt}</DialogTitle>
            <div className="flex flex-wrap gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                title={receiptTooltips.exportExcel}
                onClick={() => exportReceiptToExcel(receiptPreview)}
                disabled={receiptPreview.items.length === 0}
                className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Xuất Excel
              </Button>
              <Button
                type="button"
                variant="outline"
                title={receiptTooltips.exportPdf}
                onClick={() => void exportReceiptToPdfFile(receiptPreview)}
                disabled={receiptPreview.items.length === 0}
                className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                <Printer className="mr-2 h-4 w-4" />
                In / PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr_1fr]">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.supplier}</label>
                <div className="relative">
                  <Input
                    value={receiptSupplier}
                    onFocus={() => setIsSupplierPickerOpen(true)}
                    onBlur={() => window.setTimeout(() => setIsSupplierPickerOpen(false), 120)}
                    onChange={(event) => {
                      setReceiptSupplier(event.target.value);
                      setIsSupplierPickerOpen(true);
                    }}
                    placeholder={locale === 'vi' ? 'Chon hoac nhap nha cung cap' : 'Select or type a supplier'}
                    className="h-14 w-full rounded-[22px] border-2 border-primary/35 bg-secondary/40 px-5 pr-12 text-sm font-black text-foreground shadow-[0_10px_30px_rgba(60,60,60,0.06)] outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setIsSupplierPickerOpen((open) => !open)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    aria-label={locale === 'vi' ? 'Mo danh sach nha cung cap' : 'Open supplier list'}
                  >
                    <ChevronDown className={cn('h-4 w-4 transition-transform', isSupplierPickerOpen && 'rotate-180')} />
                  </button>

                  {isSupplierPickerOpen && supplierSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[20px] border border-primary/20 bg-background shadow-2xl shadow-primary/10 ring-1 ring-black/5">
                      <div className="max-h-64 overflow-y-auto p-2">
                        {supplierSuggestions.map((supplier) => {
                          const selected = supplier.name === receiptSupplier;
                          return (
                            <button
                              key={supplier.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setReceiptSupplier(supplier.name);
                                setIsSupplierPickerOpen(false);
                              }}
                              className={cn(
                                'flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition-colors',
                                selected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-primary/10 hover:text-primary'
                              )}
                            >
                              <span className="truncate">{supplier.name}</span>
                              {selected && <Check className="h-4 w-4 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.receivedAt}</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground md:block" />
                  <Input
                    type="date"
                    value={receiptDate}
                    onChange={(event) => setReceiptDate(event.target.value)}
                    className="h-12 w-full rounded-2xl border-border bg-background px-4 text-sm font-medium text-foreground md:pl-11"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.note}</label>
                <Input
                  value={receiptNote}
                  onChange={(event) => setReceiptNote(event.target.value)}
                  className="h-12 w-full rounded-2xl border-border bg-background px-4 text-sm font-medium text-foreground"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-border/50 bg-background p-4 sm:rounded-[28px]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.receiptModeLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.receiptModeHelp}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-muted/30 p-1">
                  <button
                    type="button"
                    onClick={() => setReceiptMode('RESTOCK')}
                    className={cn(
                      'h-11 rounded-[16px] px-4 text-[10px] font-black uppercase tracking-widest transition-all',
                      receiptMode === 'RESTOCK' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'
                    )}
                  >
                    {t.receiptModeRestock}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptMode('ON_DEMAND')}
                    className={cn(
                      'h-11 rounded-[16px] px-4 text-[10px] font-black uppercase tracking-widest transition-all',
                      receiptMode === 'ON_DEMAND' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'
                    )}
                  >
                    {t.receiptModeOnDemand}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/50 bg-muted/20 p-3 sm:rounded-[28px] sm:p-4">
              <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">{t.receiptItems}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {validReceiptLines.length} {t.selectedItems} • {t.totalQuantity}: {totalReceiptQuantity}
                  </p>
                </div>
                <Button variant="outline" title={receiptTooltips.addLine} onClick={() => setReceiptLines((current) => [...current, createEmptyLine()])} className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest sm:self-start">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addLine}
                </Button>
              </div>

              <div className="mt-4 rounded-[24px] border border-border/50 bg-background/50 sm:rounded-[28px]">
                <div className="hidden xl:grid xl:grid-cols-[72px_96px_minmax(0,1.15fr)_minmax(0,0.95fr)_112px_148px_148px_160px] xl:gap-5 xl:rounded-t-[28px] xl:border-b xl:border-border/50 xl:bg-background/95 xl:px-4 xl:py-3 xl:backdrop-blur">
                  <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">STT</p>
                  <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{locale === 'vi' ? 'Ảnh' : 'Image'}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{t.lineProduct}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{locale === 'vi' ? 'Danh muc' : 'Category'}</p>
                  <p className="text-right text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{t.quantity}</p>
                  <p className="text-right text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{t.importCost}</p>
                  <p className="text-right text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{t.salePrice}</p>
                  <p className="text-right text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{t.lineSummary}</p>
                </div>

                <div className="max-h-[48vh] space-y-4 overflow-y-auto p-3 sm:p-4">
                  {receiptLines.map((line, index) => {
                  const matches = receiptLineMatches(line);
                  const selectedLineProduct = findProductForLine(line);
                  const lineTotal = line.quantity * line.costPrice;

                  return (
                    <div key={line.id} className="rounded-[22px] border border-border/50 bg-background p-3 sm:rounded-[28px] sm:p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {t.lineProduct} #{index + 1}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={receiptTooltips.removeLine}
                          title={receiptTooltips.removeLine}
                          disabled={receiptLines.length === 1}
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setReceiptLines((current) => current.filter((item) => item.id !== line.id))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-5 xl:grid-cols-[72px_96px_minmax(0,1fr)_180px_112px_148px_148px_160px] xl:items-start">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground xl:hidden">STT</label>
                          <div className="flex h-12 items-center justify-center rounded-2xl border border-border bg-muted/20 px-4 text-sm font-black tabular-nums">
                            {index + 1}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground xl:hidden">{locale === 'vi' ? 'Ảnh' : 'Image'}</label>
                          <div className="relative h-16 w-20 overflow-hidden rounded-2xl border border-border bg-muted/20">
                            {line.imageUrl || selectedLineProduct ? (
                              <img src={line.imageUrl || getPrimaryImage(selectedLineProduct!)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <ImagePlus className="h-5 w-5" />
                              </div>
                            )}
                            <label title={receiptTooltips.uploadImage} className="absolute inset-0 flex cursor-pointer items-end justify-end bg-black/0 p-1 transition-colors hover:bg-black/20">
                              <span className="rounded-lg bg-background/90 p-1 shadow-sm">
                                <Upload className="h-3.5 w-3.5" />
                              </span>
                              <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleReceiptImageUpload(line.id, event.target.files?.[0])} />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={line.search}
                              onChange={(event) => handleReceiptSearchChange(line.id, event.target.value)}
                              onBlur={() => resolveReceiptLineBySearch(line)}
                              placeholder={t.productLookup}
                              className="h-12 w-full rounded-2xl border-border bg-background pl-11 pr-4 text-sm font-medium text-foreground"
                            />
                          </div>
                          {line.search && matches.length > 0 && !selectedLineProduct && (
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-2 shadow-sm">
                              {matches.map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => handleProductSelect(line.id, product)}
                                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all hover:bg-background"
                                >
                                  <div>
                                    <p className="font-black">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">{product.sku || 'SKU'} • {t.stock}: {product.stock}</p>
                                  </div>
                                  <span className="text-xs font-black text-primary">{formatCurrencyVND(product.costPrice || 0)}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {selectedLineProduct && (
                            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                              <p className="font-black">{selectedLineProduct.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {selectedLineProduct.sku || 'SKU'} • {t.stock}: {selectedLineProduct.stock}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground xl:hidden">{locale === 'vi' ? 'Danh muc' : 'Category'}</label>
                          <div className="relative">
                            <select
                              value={line.categoryId || selectedLineProduct?.categoryId || ''}
                              disabled={!!selectedLineProduct}
                              onChange={(event) => updateReceiptLine(line.id, { categoryId: event.target.value })}
                              className="h-12 w-full appearance-none rounded-2xl border border-border bg-background px-4 pr-11 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <option value="">{locale === 'vi' ? 'Chon danh muc' : 'Select category'}</option>
                              {categories.map((category: { id: string; name: string }) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground xl:hidden">{t.quantity}</label>
                          <Input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(event) => updateReceiptLine(line.id, { quantity: Math.max(1, Number(event.target.value) || 1) })}
                            className="h-12 w-full rounded-2xl border-border bg-background px-4 text-right text-sm font-medium tabular-nums text-foreground"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground xl:hidden">{t.importCost}</label>
                          <Input
                            inputMode="numeric"
                            value={formatCurrencyInput(line.costPrice)}
                            onChange={(event) => updateReceiptLine(line.id, { costPrice: normalizeCurrencyInput(event.target.value) })}
                            className="h-12 w-full rounded-2xl border-border bg-background px-4 text-right text-sm font-medium tabular-nums text-foreground"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground xl:hidden">{t.salePrice}</label>
                          <Input
                            inputMode="numeric"
                            value={formatCurrencyInput(line.salePrice)}
                            onChange={(event) => updateReceiptLine(line.id, { salePrice: Math.max(1, normalizeCurrencyInput(event.target.value) || 1) })}
                            className="h-12 w-full rounded-2xl border-border bg-background px-4 text-right text-sm font-medium tabular-nums text-foreground"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground xl:hidden">{t.lineSummary}</label>
                          <div className="flex h-12 items-center justify-end rounded-2xl border border-border bg-muted/20 px-4 text-right text-sm font-black tabular-nums">{formatCurrencyVND(lineTotal)}</div>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>

                <div className="sticky bottom-0 z-10 border-t border-border/50 bg-background/95 px-4 py-4 backdrop-blur">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.selectedItems}</p>
                      <p className="mt-1 text-lg font-black tabular-nums">{validReceiptLines.length}</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.totalQuantity}</p>
                      <p className="mt-1 text-lg font-black tabular-nums">{totalReceiptQuantity}</p>
                    </div>
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t.grandTotal}</p>
                      <p className="mt-1 text-lg font-black tabular-nums text-primary">{formatCurrencyVND(totalReceiptAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
                Hủy
              </Button>
              <Button onClick={() => void handleSaveReceipt()} disabled={receiptSubmitting} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
                {receiptSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingReceipt ? t.updateReceipt : t.saveReceipt}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isComboDialogOpen} onOpenChange={setIsComboDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-none bg-surface-default p-8 shadow-2xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">{locale === 'vi' ? 'Tạo combo sản phẩm' : 'Create product combo'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale === 'vi' ? 'Tên combo' : 'Combo name'}</label>
                <Input value={comboName} onChange={(event) => setComboName(event.target.value)} placeholder="Combo chăm sóc da mùa hè" className="h-12 rounded-2xl bg-background" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale === 'vi' ? 'Danh mục' : 'Category'}</label>
                  <select value={comboCategoryId} onChange={(event) => setComboCategoryId(event.target.value)} className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-bold outline-none">
                    <option value="">{locale === 'vi' ? 'Chọn danh mục' : 'Select category'}</option>
                    {categories.map((category: { id: string; name: string }) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale === 'vi' ? 'Giá combo' : 'Combo price'}</label>
                  <Input
                    inputMode="numeric"
                    value={comboPrice ? formatCurrencyInput(comboPrice) : ''}
                    onChange={(event) => setComboPrice(normalizeCurrencyInput(event.target.value))}
                    placeholder={formatCurrencyInput(Math.round(comboSuggestedPrice * 0.9))}
                    className="h-12 rounded-2xl bg-background text-right font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale === 'vi' ? 'Tóm tắt' : 'Summary'}</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Items</p>
                    <p className="font-black">{comboProducts.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Giá lẻ</p>
                    <p className="font-black">{formatCurrencyVND(comboSuggestedPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Tồn combo</p>
                    <p className="font-black">{comboProducts.length ? Math.min(...comboProducts.map((product) => Math.max(0, product.stock || 0))) : 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale === 'vi' ? 'Chọn sản phẩm trong combo' : 'Select combo products'}</label>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black text-primary">{comboProducts.length}</span>
              </div>
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {products.map((product) => {
                  const checked = comboProductIds.includes(product.id);
                  return (
                    <label key={product.id} className={cn('flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors', checked ? 'border-primary/40 bg-primary/10' : 'border-border/50 bg-background hover:bg-muted/40')}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setComboProductIds((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id));
                        }}
                        className="h-4 w-4 accent-primary"
                      />
                      <img src={getPrimaryImage(product)} alt="" className="h-12 w-12 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-black">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrencyVND(product.price)} • SL {product.stock}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsComboDialogOpen(false)} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
              {locale === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button onClick={() => void handleCreateCombo()} disabled={createMutation.isPending} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tags className="mr-2 h-4 w-4" />}
              {locale === 'vi' ? 'Lưu combo' : 'Save combo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-none bg-surface-default p-8 shadow-2xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">{selectedProduct ? t.editProduct : t.createProduct}</DialogTitle>
          </DialogHeader>
          <ProductForm
            initialData={selectedProduct}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="overflow-hidden rounded-[32px] border-none bg-surface-default p-0 shadow-2xl sm:max-w-3xl">
          {selectedProduct && (
            <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
              <div className="flex items-center justify-center bg-muted/30 p-8">
                <img src={getPrimaryImage(selectedProduct)} alt={selectedProduct.name} className="max-h-[320px] w-full rounded-3xl object-cover" />
              </div>
              <div className="space-y-5 p-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {(typeof selectedProduct.category === 'string' ? selectedProduct.category : selectedProduct.category?.name) || 'Danh mục'}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{selectedProduct.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedProduct.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.importCost}</p>
                    <p className="mt-2 font-black">{formatCurrencyVND(selectedProduct.costPrice || 0)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.salePrice}</p>
                    <p className="mt-2 font-black">{formatCurrencyVND(selectedProduct.price)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.stock}</p>
                    <p className="mt-2 font-black">{selectedProduct.stock}</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.variants}</p>
                    <p className="mt-2 font-black">{getVariantCount(selectedProduct)}</p>
                  </div>
                </div>

                {!!selectedProduct.variants?.length && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest">{t.details}</h3>
                    <div className="space-y-2">
                      {selectedProduct.variants.flatMap((group) => group.options).map((variant) => (
                        <div key={variant.id} className="rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-black">
                                {variant.name}: {variant.value}
                              </p>
                              <p className="text-xs text-muted-foreground">{variant.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black">{formatCurrencyVND(variant.price || 0)}</p>
                              <p className="text-xs text-muted-foreground">
                                {t.stock}: {variant.stock}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
