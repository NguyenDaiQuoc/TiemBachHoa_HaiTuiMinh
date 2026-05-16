import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { useCategories } from '@/src/entities/category/api/category-api';
import { Product } from '@/src/entities/product/model/types';
import { Plus, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const productSchema = z.object({
  name: z.string().min(2, "Tên quá ngắn"),
  slug: z.string().min(2, "Slug không hợp lệ"),
  description: z.string().min(10, "Mô tả quá ngắn"),
  price: z.coerce.number().positive("Giá phải lớn hơn 0"),
  categoryId: z.string().uuid("Vui lòng chọn danh mục"),
  stock: z.coerce.number().int().min(0, "Tồn kho không được âm"),
  images: z.array(z.string()).min(1, "Ít nhất 1 hình ảnh"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProductForm = ({ initialData, onSubmit, onCancel, isSubmitting }: ProductFormProps) => {
  const { data: categories } = useCategories();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      slug: initialData.slug,
      description: initialData.description,
      price: initialData.price,
      categoryId: initialData.categoryId,
      stock: initialData.stock,
      images: initialData.images || [initialData.image],
    } : {
      name: '',
      slug: '',
      description: '',
      price: 0,
      categoryId: '',
      stock: 0,
      images: [],
    }
  });

  const [newImageUrl, setNewImageUrl] = useState('');

  const addImage = () => {
    if (!newImageUrl) return;
    const currentImages = form.getValues('images');
    form.setValue('images', [...currentImages, newImageUrl]);
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images');
    form.setValue('images', currentImages.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TÊN SẢN PHẨM</label>
            <Input 
              {...form.register('name')} 
              placeholder="Ví dụ: Nến thơm Organic" 
              onChange={(e) => {
                form.register('name').onChange(e);
                const name = e.target.value;
                if (!initialData) {
                  const slug = name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd')
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                  form.setValue('slug', slug);
                }
              }}
            />
            {form.formState.errors.name && <p className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SLUG (URL)</label>
            <Input {...form.register('slug')} placeholder="nen-thom-organic" />
            {form.formState.errors.slug && <p className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.slug.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">GIÁ BÁN (VND)</label>
              <Input type="number" {...form.register('price')} />
              {form.formState.errors.price && <p className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TỒN KHO</label>
              <Input type="number" {...form.register('stock')} />
              {form.formState.errors.stock && <p className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.stock.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">DANH MỤC</label>
            <select 
              {...form.register('categoryId')}
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-bold"
            >
              <option value="">Chọn danh mục...</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {form.formState.errors.categoryId && <p className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.categoryId.message}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">MÔ TẢ CHI TIẾT</label>
            <textarea 
              {...form.register('description')}
              rows={4}
              className="w-full p-4 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 font-medium resize-none"
              placeholder="Nhập mô tả sản phẩm..."
            />
            {form.formState.errors.description && <p className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">HÌNH ẢNH SẢN PHẨM (URL)</label>
            <div className="flex gap-2">
              <Input 
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
              />
              <Button type="button" onClick={addImage} size="icon" className="h-11 w-11 rounded-xl flex-shrink-0">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-4">
              {form.watch('images').map((url, index) => (
                <div key={index} className="relative aspect-square rounded-2xl bg-muted overflow-hidden border border-border group">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {form.watch('images').length === 0 && (
                <div className="col-span-3 h-24 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6 opacity-20 mb-1" />
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Chưa có hình ảnh</p>
                </div>
              )}
            </div>
            {form.formState.errors.images && <p className="text-[10px] text-rose-500 font-bold ml-1">{form.formState.errors.images.message}</p>}
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-3 border-t border-border">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          className="h-11 rounded-xl px-6 font-black text-[10px] uppercase tracking-widest"
        >
          Hủy bỏ
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="h-11 rounded-xl px-10 bg-primary font-black text-[10px] uppercase tracking-widest min-w-[140px]"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {initialData ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}
        </Button>
      </div>
    </form>
  );
};
