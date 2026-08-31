import { useEffect, useMemo, useState } from 'react';
import { FolderTree, Loader2, Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/src/entities/admin/api/admin-service';
import type { AdminCategoryFormPayload, AdminCategoryPayload } from '@/src/entities/admin/model/types';
import { Button } from '@/src/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/ui/dialog';
import { Input } from '@/src/shared/ui/input';
import { EmptyState } from '@/src/shared/ui/empty-state';
import { LoadingState } from '@/src/shared/ui/loading-state';

const DEFAULT_FORM: AdminCategoryFormPayload = {
  name: '',
  slug: '',
  description: '',
  image: '',
  isActive: true,
};

export const AdminCategories = () => {
  const [items, setItems] = useState<AdminCategoryPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminCategoryPayload | null>(null);
  const [form, setForm] = useState<AdminCategoryFormPayload>(DEFAULT_FORM);

  const loadData = async () => {
    setIsLoading(true);
    try {
      setItems(await adminService.getCategories());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => `${item.name} ${item.slug}`.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  const openCreate = () => {
    setEditingItem(null);
    setForm(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (item: AdminCategoryPayload) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      image: item.image || '',
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Vui lòng nhập tên và slug cho danh mục');
      return;
    }
    setIsSaving(true);
    try {
      if (editingItem) {
        await adminService.updateCategory(editingItem.id, form);
        toast.success('Đã cập nhật danh mục');
      } else {
        await adminService.createCategory(form);
        toast.success('Đã tạo danh mục');
      }
      setIsDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu danh mục');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: AdminCategoryPayload) => {
    if (!window.confirm(`Ẩn danh mục "${item.name}"?`)) return;
    try {
      await adminService.deleteCategory(item.id);
      toast.success('Đã ẩn danh mục');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể ẩn danh mục');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Danh mục <span className="text-primary italic">sản phẩm</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý nhóm hàng để điều hướng storefront, sản phẩm và marketing rõ ràng hơn.</p>
        </div>
        <Button onClick={openCreate} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
          <Plus className="mr-2 h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên hoặc slug danh mục..." className="h-12 rounded-2xl border-2 border-border bg-surface-default pl-12 text-sm font-medium" />
      </div>

      {isLoading ? (
        <LoadingState size="md" label="Đang tải danh mục" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderTree} title="Chưa có danh mục phù hợp" description="Tạo danh mục mới để phân loại sản phẩm trong cửa hàng." />
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-[28px] border border-border/50 bg-surface-default p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black">{item.name}</p>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${item.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                        {item.isActive ? 'Đang dùng' : 'Đã ẩn'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">/{item.slug}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description || 'Chưa có mô tả danh mục.'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEdit(item)} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest">
                    <Pencil className="mr-2 h-4 w-4" />
                    Sửa
                  </Button>
                  <Button variant="outline" onClick={() => void handleDelete(item)} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Ẩn
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[32px] border-none bg-surface-default p-8 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tên danh mục</label>
                <Input
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name,
                      slug: editingItem
                        ? prev.slug
                        : name
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/đ/g, 'd')
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, ''),
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Slug</label>
                <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ảnh danh mục</label>
              <Input value={form.image || ''} onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))} placeholder="URL hoặc data URL ảnh" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mô tả</label>
              <textarea value={form.description || ''} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none" />
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-bold">
              Hiển thị danh mục trên hệ thống
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu danh mục
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
