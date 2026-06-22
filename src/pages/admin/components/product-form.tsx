import { useEffect, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Image as ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories } from '@/src/entities/category/api/category-api';
import { useProductFacets } from '@/src/entities/product/api/product-api';
import { getWarrantyLabel, setWarrantyTag, WARRANTY_OPTIONS } from '@/src/entities/product/lib/warranty';
import { Product, ProductVariant } from '@/src/entities/product/model/types';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { cn } from '@/src/shared/lib/utils';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Thiếu tên biến thể'),
  value: z.string().min(1, 'Thiếu giá trị biến thể'),
  attributes: z.record(z.string(), z.string()).optional().default({}),
  sku: z.string().min(1, 'Thiếu SKU'),
  costPrice: z.coerce.number().min(0),
  price: z.coerce.number().positive(),
  promotionalPrice: z.coerce.number().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0),
  initialStock: z.coerce.number().int().min(0).optional(),
  images: z.array(z.string()).default([]),
});

const productSchema = z.object({
  name: z.string().min(2, 'Tên sản phẩm quá ngắn'),
  slug: z.string().min(2, 'Slug không hợp lệ'),
  sku: z.string().nullable().optional(),
  description: z.string().min(10, 'Mô tả cần ít nhất 10 ký tự'),
  costPrice: z.coerce.number().min(0, 'Giá nhập phải từ 0'),
  price: z.coerce.number().positive('Giá bán phải lớn hơn 0'),
  promotionalPrice: z.coerce.number().min(0).nullable().optional(),
  categoryId: z.string().uuid('Vui lòng chọn danh mục'),
  stock: z.coerce.number().int().min(0, 'Tồn kho không được âm'),
  initialStock: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  images: z.array(z.string()).min(1, 'Cần ít nhất 1 hình ảnh'),
  brand: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  variants: z.array(variantSchema).default([]),
});

type ProductFormData = z.infer<typeof productSchema>;
type ProductFormInput = z.input<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

type VariantDraft = z.infer<typeof variantSchema>;

const readFilesAsDataUrls = async (files: FileList | null) => {
  if (!files?.length) return [];

  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
};

const normalizeNullableNumber = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value) || value <= 0) return null;
  return value;
};

const BRAND_OPTIONS = ['Baseus', 'Anker', 'Ugreen', 'Sony', 'JBL', 'Apple', 'Samsung', 'Logitech', 'Razer', 'Asus', 'Dell', 'HP', 'Lenovo', 'Xiaomi', 'Philips', 'Electrolux', 'Panasonic', 'Sunhouse', 'LocknLock', 'Bear', 'Comet', "L'Oreal", 'La Roche-Posay', 'The Ordinary', 'CeraVe', 'Cocoon', 'Maybelline', 'Innisfree', 'Some By Mi', 'Simple'];
const SUBCATEGORY_OPTIONS = ['Điện thoại', 'Laptop', 'Máy tính bảng', 'Chuột', 'Bàn phím', 'Màn hình', 'Tai nghe', 'Loa', 'Sạc/cáp', 'Pin dự phòng', 'Webcam', 'Camera an ninh', 'Đồng hồ thông minh', 'Nồi chiên', 'Nồi cơm điện', 'Máy xay sinh tố', 'Ấm siêu tốc', 'Bếp điện', 'Máy hút bụi', 'Robot hút bụi', 'Quạt điện', 'Máy lọc không khí', 'Đèn LED', 'Đồ dùng nhà bếp', 'Chăm sóc da', 'Trang điểm', 'Chăm sóc tóc', 'Nước hoa', 'Chống nắng', 'Sữa rửa mặt', 'Mặt nạ', 'Son môi'];
const SKU_ATTRIBUTE_OPTIONS = ['Màu', 'Size', 'Mùi', 'Dung lượng', 'Phiên bản', 'Chất liệu', 'Model'];

const TAG_OPTIONS = ['Chính hãng', 'Bán chạy', 'Hàng mới', 'Giá tốt', 'Cao cấp', 'Giá rẻ', 'Phù hợp văn phòng', 'Nhỏ gọn', 'Pin lâu', 'Tiết kiệm điện', 'Dễ sử dụng', 'Quà tặng', 'Bảo hành dài', 'Freeship', 'Limited'];

const CATEGORY_BRAND_OPTIONS: Record<string, string[]> = {
  'cong-nghe': ['Baseus', 'Cuktech', 'Anker', 'Ugreen', 'Sony', 'JBL', 'Apple', 'Samsung', 'Logitech', 'Razer', 'Asus', 'Dell', 'HP', 'Lenovo', 'Xiaomi'],
  'gia-dung': ['Philips', 'Electrolux', 'Panasonic', 'Sunhouse', 'LocknLock', 'Bear', 'Comet', 'Xiaomi'],
  'my-pham': ["L'Oreal", 'La Roche-Posay', 'The Ordinary', 'CeraVe', 'Cocoon', 'Maybelline', 'Innisfree', 'Some By Mi', 'Simple'],
};

const CATEGORY_SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  'cong-nghe': ['Điện thoại', 'Laptop', 'Máy tính bảng', 'Chuột', 'Bàn phím', 'Màn hình', 'Tai nghe', 'Loa', 'Sạc/cáp', 'Pin dự phòng', 'Webcam', 'Camera an ninh', 'Đồng hồ thông minh'],
  'gia-dung': ['Nồi chiên', 'Nồi cơm điện', 'Máy xay sinh tố', 'Ấm siêu tốc', 'Bếp điện', 'Máy hút bụi', 'Robot hút bụi', 'Quạt điện', 'Máy lọc không khí', 'Đèn LED', 'Đồ dùng nhà bếp'],
  'my-pham': ['Chăm sóc da', 'Trang điểm', 'Chăm sóc tóc', 'Nước hoa', 'Chống nắng', 'Sữa rửa mặt', 'Mặt nạ', 'Son môi'],
};

export const ProductForm = ({ initialData, onSubmit, onCancel, isSubmitting }: ProductFormProps) => {
  const { data: categories } = useCategories();
  const { data: facets } = useProductFacets();
  const sellableCategories = (categories || []).filter((category: any) => category.isActive !== false && category.slug !== 'san-pham-nhap-kho');
  const initialVariants: VariantDraft[] =
    initialData?.variants?.flatMap((group) =>
      group.options.map((variant: ProductVariant) => ({
        id: variant.id,
        name: variant.name,
        value: variant.value,
        sku: variant.sku || '',
        attributes: variant.attributes || {},
        costPrice: variant.costPrice || 0,
        price: variant.price || initialData.price,
        promotionalPrice: variant.promotionalPrice || null,
        stock: variant.stock,
        initialStock: variant.initialStock ?? variant.stock,
        images: variant.images || [],
      }))
    ) || [];

  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>(initialVariants);
  const [skuFilters, setSkuFilters] = useState<Record<string, string>>({});
  const [customBrandsByCategory, setCustomBrandsByCategory] = useState<Record<string, string[]>>({});
  const [customSubcategoriesByCategory, setCustomSubcategoriesByCategory] = useState<Record<string, string[]>>({});

  const form = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          sku: initialData.sku || '',
          description: initialData.description,
          costPrice: initialData.costPrice || 0,
          price: initialData.price,
          promotionalPrice: initialData.promotionalPrice || null,
          categoryId: initialData.categoryId,
          stock: initialData.stock,
          initialStock: initialData.initialStock || initialData.stock,
          reorderLevel: initialData.reorderLevel || 0,
          images: initialData.images?.length ? initialData.images : [initialData.image].filter(Boolean),
          brand: initialData.brand || '',
          subcategory: initialData.subcategory || '',
          tags: initialData.tags || [],
          variants: initialVariants,
        }
      : {
          name: '',
          slug: '',
          sku: '',
          description: '',
          costPrice: 0,
          price: 0,
          promotionalPrice: null,
          categoryId: '',
          stock: 0,
          initialStock: 0,
          reorderLevel: 0,
          images: [],
          brand: '',
          subcategory: '',
          tags: [],
          variants: [],
        },
  });

  const selectedCategoryId = form.watch('categoryId');
  const selectedCategory = sellableCategories.find((category: any) => category.id === selectedCategoryId);
  const selectedCategorySlug = selectedCategory?.slug || '';
  const selectedCategoryFacet = facets?.categories.find((category) => category.slug === selectedCategorySlug);
  const selectedBrand = form.watch('brand')?.trim() || '';
  const selectedSubcategory = form.watch('subcategory')?.trim() || '';

  const mergeOptionNames = (...groups: Array<Array<string | undefined>>) =>
    Array.from(new Set(groups.flat().map((value) => value?.trim()).filter((value): value is string => Boolean(value)))).sort((left, right) => left.localeCompare(right, 'vi'));

  const categoryBrandOptions = selectedCategorySlug
    ? mergeOptionNames(
        CATEGORY_BRAND_OPTIONS[selectedCategorySlug] || [],
        selectedCategoryFacet?.brands?.map((item) => item.name) || [],
        customBrandsByCategory[selectedCategorySlug] || [],
        initialData?.categoryId === selectedCategoryId ? [initialData?.brand || undefined] : []
      )
    : BRAND_OPTIONS;

  const categorySubcategoryOptions = selectedCategorySlug
    ? mergeOptionNames(
        CATEGORY_SUBCATEGORY_OPTIONS[selectedCategorySlug] || [],
        selectedCategoryFacet?.subcategories?.map((item) => item.name) || [],
        customSubcategoriesByCategory[selectedCategorySlug] || [],
        initialData?.categoryId === selectedCategoryId ? [initialData?.subcategory || undefined] : []
      )
    : SUBCATEGORY_OPTIONS;

  const addScopedOption = (type: 'brand' | 'subcategory') => {
    if (!selectedCategorySlug) {
      toast.error('Vui lòng chọn danh mục trước khi thêm lựa chọn con.');
      return;
    }

    const value = type === 'brand' ? selectedBrand : selectedSubcategory;
    if (!value) return;

    const setState = type === 'brand' ? setCustomBrandsByCategory : setCustomSubcategoriesByCategory;
    setState((current) => ({
      ...current,
      [selectedCategorySlug]: mergeOptionNames(current[selectedCategorySlug] || [], [value]),
    }));
  };

  useEffect(() => {
    if (!selectedCategorySlug) return;

    const currentBrand = form.getValues('brand')?.trim();
    const currentSubcategory = form.getValues('subcategory')?.trim();

    if (currentBrand && !categoryBrandOptions.includes(currentBrand)) {
      form.setValue('brand', '', { shouldDirty: true });
    }

    if (currentSubcategory && !categorySubcategoryOptions.includes(currentSubcategory)) {
      form.setValue('subcategory', '', { shouldDirty: true });
    }
  }, [selectedCategorySlug]);

  const syncVariants = (nextVariants: VariantDraft[]) => {
    setVariantDrafts(nextVariants);
    form.setValue('variants', nextVariants as ProductFormData['variants'], { shouldValidate: true });
  };

  const addVariant = () => {
    syncVariants([
      ...variantDrafts,
      {
        id: crypto.randomUUID(),
        name: '',
        value: '',
        sku: '',
        attributes: {},
        costPrice: 0,
        price: 0,
        promotionalPrice: null,
        stock: 0,
        initialStock: 0,
        images: [],
      },
    ]);
  };

  const updateVariant = <T extends keyof VariantDraft>(index: number, key: T, value: VariantDraft[T]) => {
    const next = [...variantDrafts];
    next[index] = { ...next[index], [key]: value };
    syncVariants(next);
  };

  const removeVariant = (index: number) => {
    syncVariants(variantDrafts.filter((_, itemIndex) => itemIndex !== index));
  };
  const updateVariantAttribute = (index: number, key: string, value: string) => {
    const nextAttributes = { ...(variantDrafts[index].attributes || {}) };
    if (value.trim()) nextAttributes[key] = value.trim();
    else delete nextAttributes[key];
    updateVariant(index, 'attributes', nextAttributes as VariantDraft['attributes']);

    const label = Object.entries(nextAttributes)
      .filter(([, attributeValue]) => attributeValue)
      .map(([attributeKey, attributeValue]) => `${attributeKey}: ${attributeValue}`)
      .join(' / ');
    if (label) {
      updateVariant(index, 'name', label);
      updateVariant(index, 'value', Object.values(nextAttributes).filter(Boolean).join(' / '));
    }
  };

  const buildSkuFromAttributes = (index: number) => {
    const baseSku = form.getValues('sku')?.trim() || form.getValues('slug')?.trim() || 'HTM';
    const attributeCode = Object.values(variantDrafts[index].attributes || {})
      .filter(Boolean)
      .map((value) =>
        value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .replace(/[^a-zA-Z0-9]+/g, '')
          .slice(0, 8)
          .toUpperCase()
      )
      .filter(Boolean)
      .join('-');
    updateVariant(index, 'sku', [baseSku, attributeCode || String(index + 1).padStart(2, '0')].join('-').toUpperCase());
  };

  const attributeChoices = SKU_ATTRIBUTE_OPTIONS.map((attribute) => ({
    attribute,
    values: Array.from(new Set(variantDrafts.map((variant) => variant.attributes?.[attribute]).filter((value): value is string => Boolean(value)))).sort(),
  })).filter((item) => item.values.length > 0);

  const filteredVariantDrafts = variantDrafts.filter((variant) =>
    Object.entries(skuFilters).every(([attribute, value]) => !value || variant.attributes?.[attribute] === value)
  );

  const toggleSkuFilter = (attribute: string, value: string) => {
    setSkuFilters((prev) => ({ ...prev, [attribute]: prev[attribute] === value ? '' : value }));
  };

  const uploadProductImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const images = await readFilesAsDataUrls(event.target.files);
    form.setValue('images', [...form.getValues('images'), ...images], { shouldValidate: true });
    event.target.value = '';
  };

  const uploadVariantImages = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const images = await readFilesAsDataUrls(event.target.files);
    updateVariant(index, 'images', [...(variantDrafts[index].images || []), ...images]);
    event.target.value = '';
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit({
        ...data,
        sku: data.sku?.trim() || null,
        brand: data.brand?.trim() || null,
        subcategory: data.subcategory?.trim() || null,
        tags: data.tags || [],
        promotionalPrice: normalizeNullableNumber(data.promotionalPrice),
        variants: variantDrafts.map((variant) => ({
          ...variant,
          promotionalPrice: normalizeNullableNumber(variant.promotionalPrice),
          initialStock: variant.initialStock ?? variant.stock,
        })),
      });
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu sản phẩm');
    }
  };

  const images = form.watch('images');
  const selectedTags = form.watch('tags') || [];
  const selectedWarranty = getWarrantyLabel(selectedTags) || '';

  const updateWarranty = (value: string) => {
    form.setValue('tags', setWarrantyTag(form.getValues('tags') || [], value || null), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tên sản phẩm</label>
            <Input
              {...form.register('name')}
              onChange={(event) => {
                form.register('name').onChange(event);
                if (!initialData) {
                  const slug = event.target.value
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/Ä'/g, 'd')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                  form.setValue('slug', slug);
                }
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Slug</label>
              <Input {...form.register('slug')} />
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">SKU chính</label>
              <Input {...form.register('sku')} placeholder="HTM-001" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Giá nhập</label>
              <Input type="number" {...form.register('costPrice')} />
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Giá bán</label>
              <Input type="number" {...form.register('price')} />
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Giá khuyến mãi</label>
              <Input type="number" {...form.register('promotionalPrice')} placeholder="Để trống nếu không có" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tồn kho</label>
              <Input type="number" {...form.register('stock')} />
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tồn ban đầu</label>
              <Input type="number" {...form.register('initialStock')} />
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mốc cảnh báo</label>
              <Input type="number" {...form.register('reorderLevel')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Danh mục</label>
            <select {...form.register('categoryId')} className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-bold outline-none">
              <option value="">Chọn danh mục...</option>
              {sellableCategories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hãng / thương hiệu</label>
              <input {...form.register('brand')} list="brand-options" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-bold outline-none" placeholder="Baseus, Sony..." />
              <datalist id="brand-options">
                {categoryBrandOptions.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-muted-foreground">Chỉ gợi ý hãng thuộc danh mục đang chọn.</p>
                {selectedBrand && !categoryBrandOptions.includes(selectedBrand) && (
                  <button type="button" onClick={() => addScopedOption('brand')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                    Thêm hãng
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loại con</label>
              <input {...form.register('subcategory')} list="subcategory-options" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-bold outline-none" placeholder="Điện thoại, laptop..." />
              <datalist id="subcategory-options">
                {categorySubcategoryOptions.map((subcategory) => (
                  <option key={subcategory} value={subcategory} />
                ))}
              </datalist>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-muted-foreground">Lưu sản phẩm xong lựa chọn mới sẽ nằm dưới danh mục này.</p>
                {selectedSubcategory && !categorySubcategoryOptions.includes(selectedSubcategory) && (
                  <button type="button" onClick={() => addScopedOption('subcategory')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                    Thêm danh mục con
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nhãn / tag</label>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-background p-3">
              {TAG_OPTIONS.map((tag) => (
                <label key={tag} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-[10px] font-black uppercase tracking-widest">
                  <input type="checkbox" value={tag} {...form.register('tags')} className="h-3.5 w-3.5 accent-primary" />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bảo hành</label>
            <select value={selectedWarranty} onChange={(event) => updateWarranty(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-bold outline-none focus:border-primary">
              <option value="">Không gắn bảo hành</option>
              {WARRANTY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="ml-1 text-xs text-muted-foreground">Sẽ hiển thị cho khách dưới dạng tag bảo hành trên sản phẩm.</p>
          </div>

          {Object.values(form.formState.errors).length > 0 && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
              {Object.values(form.formState.errors)
                .map((error) => error?.message)
                .filter(Boolean)
                .join(' • ')}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mô tả</label>
            <textarea {...form.register('description')} rows={5} className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm outline-none" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hình ảnh sản phẩm</label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-[10px] font-black uppercase tracking-widest">
                <Upload className="h-4 w-4" />
                Upload từ máy
                <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => void uploadProductImages(event)} />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {images.map((url, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => form.setValue('images', images.filter((_, itemIndex) => itemIndex !== index), { shouldValidate: true })}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length === 0 && (
                <div className="col-span-3 flex h-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                  <ImageIcon className="mb-1 h-6 w-6 opacity-20" />
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Chưa có hình ảnh</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 rounded-[28px] border border-border/50 bg-surface-sunken p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Biến thể / SKU</h3>
            <p className="mt-1 text-xs text-muted-foreground">Quản lý SKU theo nhiều thuộc tính như Màu, Size, Mùi, Dung lượng. Click bộ lọc để xem nhanh SKU nào còn hàng.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-xl border border-border bg-background px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {filteredVariantDrafts.length}/{variantDrafts.length} SKU hiển thị
            </span>
            <span className="inline-flex items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
              {variantDrafts.filter((variant) => Number(variant.stock || 0) > 0).length} còn hàng
            </span>
            <Button type="button" onClick={addVariant} className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
              <Plus className="mr-2 h-4 w-4" />
              Thêm SKU
            </Button>
          </div>
        </div>

        {attributeChoices.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lọc nhanh phân loại</p>
              {Object.values(skuFilters).some(Boolean) && (
                <button type="button" onClick={() => setSkuFilters({})} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                  Xóa lọc
                </button>
              )}
            </div>
            <div className="space-y-3">
              {attributeChoices.map(({ attribute, values }) => (
                <div key={attribute} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-20 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{attribute}</span>
                  {values.map((value) => {
                    const matching = variantDrafts.filter((variant) => variant.attributes?.[attribute] === value);
                    const inStock = matching.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
                    const active = skuFilters[attribute] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleSkuFilter(attribute, value)}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors',
                          active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface-default text-foreground hover:border-primary/40'
                        )}
                      >
                        {value} <span className={active ? 'text-primary-foreground/70' : 'text-muted-foreground'}>({inStock})</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {variantDrafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm font-medium text-muted-foreground">
              Chưa có SKU riêng. Thêm SKU nếu sản phẩm có nhiều màu, size, mùi hoặc phiên bản.
            </div>
          ) : filteredVariantDrafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm font-medium text-muted-foreground">
              Không có SKU khớp bộ lọc hiện tại.
            </div>
          ) : (
            filteredVariantDrafts.map((variant) => {
              const index = variantDrafts.findIndex((item) => item.id === variant.id);
              return (
                <div key={variant.id || index} className={cn('rounded-2xl border bg-background p-4', Number(variant.stock || 0) > 0 ? 'border-border' : 'border-rose-500/30 bg-rose-500/5')}>
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest">SKU #{index + 1}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{variant.sku || 'Chưa có mã SKU'} · {Number(variant.stock || 0) > 0 ? `${variant.stock} còn hàng` : 'Hết hàng'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => buildSkuFromAttributes(index)} className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest">
                        Tự tạo SKU
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => removeVariant(index)} className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest text-rose-500">
                        Xóa
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-2xl border border-border/60 bg-surface-default p-3 md:grid-cols-4">
                    {SKU_ATTRIBUTE_OPTIONS.map((attribute) => (
                      <div key={attribute} className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{attribute}</label>
                        <Input value={variant.attributes?.[attribute] || ''} onChange={(event) => updateVariantAttribute(index, attribute, event.target.value)} placeholder={attribute} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Input value={variant.name} onChange={(event) => updateVariant(index, 'name', event.target.value)} placeholder="Tên hiển thị biến thể" />
                    <Input value={variant.value} onChange={(event) => updateVariant(index, 'value', event.target.value)} placeholder="Giá trị gộp" />
                    <Input value={variant.sku || ''} onChange={(event) => updateVariant(index, 'sku', event.target.value)} placeholder="SKU" />
                    <Input type="number" value={variant.costPrice || 0} onChange={(event) => updateVariant(index, 'costPrice', Number(event.target.value))} placeholder="Giá nhập" />
                    <Input type="number" value={variant.price || 0} onChange={(event) => updateVariant(index, 'price', Number(event.target.value))} placeholder="Giá bán" />
                    <Input
                      type="number"
                      value={variant.promotionalPrice ?? ''}
                      onChange={(event) => updateVariant(index, 'promotionalPrice', event.target.value ? Number(event.target.value) : null)}
                      placeholder="Giá khuyến mãi"
                    />
                    <Input type="number" value={variant.stock || 0} onChange={(event) => updateVariant(index, 'stock', Number(event.target.value))} placeholder="Tồn kho" />
                    <Input type="number" value={variant.initialStock || 0} onChange={(event) => updateVariant(index, 'initialStock', Number(event.target.value))} placeholder="Tồn ban đầu" />
                    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 text-[10px] font-black uppercase tracking-widest">
                      <Upload className="h-4 w-4" />
                      Ảnh SKU
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => void uploadVariantImages(index, event)} />
                    </label>
                  </div>

                  {!!variant.images?.length && (
                    <div className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-6">
                      {variant.images.map((image, imageIndex) => (
                        <img key={imageIndex} src={image} alt="" className="aspect-square rounded-2xl border border-border object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting} className="h-11 min-w-[160px] rounded-xl px-10 text-[10px] font-black uppercase tracking-widest">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}
        </Button>
      </div>
    </form>
  );
};
