import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Image as ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories } from '@/src/entities/category/api/category-api';
import { Product, ProductVariant } from '@/src/entities/product/model/types';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Thiếu tên biến thể'),
  value: z.string().min(1, 'Thiếu giá trị biến thể'),
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

const SELLABLE_CATEGORY_SLUGS = new Set(['cong-nghe', 'gia-dung', 'my-pham']);
const BRAND_OPTIONS = ['Baseus', 'Sony', 'Apple', 'Samsung', 'Logitech', 'Xiaomi', 'Philips', 'LocknLock', "L'Oreal", 'La Roche-Posay'];
const SUBCATEGORY_OPTIONS = ['Dien thoai', 'Laptop', 'Chuot', 'Ban phim', 'Man hinh', 'Tai nghe', 'Sac/cap', 'Noi chien', 'May hut bui', 'Cham soc da'];
const TAG_OPTIONS = ['Chinh hang', 'Ban chay', 'Hang moi', 'Bao hanh', 'Gia tot', 'Phu hop van phong', 'Nho gon', 'Pin lau'];

export const ProductForm = ({ initialData, onSubmit, onCancel, isSubmitting }: ProductFormProps) => {
  const { data: categories } = useCategories();
  const sellableCategories = (categories || []).filter((category: any) => SELLABLE_CATEGORY_SLUGS.has(category.slug));
  const initialVariants: VariantDraft[] =
    initialData?.variants?.flatMap((group) =>
      group.options.map((variant: ProductVariant) => ({
        id: variant.id,
        name: variant.name,
        value: variant.value,
        sku: variant.sku || '',
        costPrice: variant.costPrice || 0,
        price: variant.price || initialData.price,
        promotionalPrice: variant.promotionalPrice || null,
        stock: variant.stock,
        initialStock: variant.initialStock ?? variant.stock,
        images: variant.images || [],
      }))
    ) || [];

  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>(initialVariants);

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
                    .replace(/đ/g, 'd')
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
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hang / thuong hieu</label>
              <input {...form.register('brand')} list="brand-options" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-bold outline-none" placeholder="Baseus, Sony..." />
              <datalist id="brand-options">
                {BRAND_OPTIONS.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loai con</label>
              <input {...form.register('subcategory')} list="subcategory-options" className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-bold outline-none" placeholder="Dien thoai, laptop..." />
              <datalist id="subcategory-options">
                {SUBCATEGORY_OPTIONS.map((subcategory) => (
                  <option key={subcategory} value={subcategory} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nhan / tag</label>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-background p-3">
              {TAG_OPTIONS.map((tag) => (
                <label key={tag} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-[10px] font-black uppercase tracking-widest">
                  <input type="checkbox" value={tag} {...form.register('tags')} className="h-3.5 w-3.5 accent-primary" />
                  {tag}
                </label>
              ))}
            </div>
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

      <div className="space-y-4 rounded-[28px] border border-border/50 bg-surface-sunken p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Biến thể / SKU</h3>
            <p className="text-xs text-muted-foreground">Mỗi mã có thể có giá nhập, giá bán, tồn kho và hình ảnh riêng.</p>
          </div>
          <Button type="button" onClick={addVariant} className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
            <Plus className="mr-2 h-4 w-4" />
            Thêm SKU
          </Button>
        </div>

        <div className="space-y-4">
          {variantDrafts.map((variant, index) => (
            <div key={variant.id || index} className="rounded-2xl border border-border bg-background p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-widest">SKU #{index + 1}</h4>
                <Button type="button" variant="ghost" onClick={() => removeVariant(index)} className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest text-rose-500">
                  Xóa
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Input value={variant.name} onChange={(event) => updateVariant(index, 'name', event.target.value)} placeholder="Tên biến thể" />
                <Input value={variant.value} onChange={(event) => updateVariant(index, 'value', event.target.value)} placeholder="Màu / dung lượng / phiên bản" />
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
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 text-[10px] font-black uppercase tracking-widest">
                  <Upload className="h-4 w-4" />
                  Ảnh SKU
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => void uploadVariantImages(index, event)} />
                </label>
              </div>

              {!!variant.images?.length && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {variant.images.map((image, imageIndex) => (
                    <img key={imageIndex} src={image} alt="" className="aspect-square rounded-2xl border border-border object-cover" />
                  ))}
                </div>
              )}
            </div>
          ))}
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
