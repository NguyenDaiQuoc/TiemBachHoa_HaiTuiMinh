import { useEffect, useMemo, useState } from 'react';
import { Building2, Loader2, Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/src/entities/admin/api/admin-service';
import type { SupplierFormPayload, SupplierPayload } from '@/src/entities/admin/model/types';
import { Button } from '@/src/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/ui/dialog';
import { EmptyState } from '@/src/shared/ui/empty-state';
import { Input } from '@/src/shared/ui/input';
import { LoadingState } from '@/src/shared/ui/loading-state';

const DEFAULT_FORM: SupplierFormPayload = {
  name: '',
  code: '',
  phone: '',
  email: '',
  address: '',
  note: '',
  isActive: true,
};

export const AdminSuppliers = () => {
  const [items, setItems] = useState<SupplierPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierPayload | null>(null);
  const [form, setForm] = useState<SupplierFormPayload>(DEFAULT_FORM);

  const loadData = async () => {
    setIsLoading(true);
    try {
      setItems(await adminService.getSuppliers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => `${item.name} ${item.code || ''} ${item.phone || ''}`.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  const openCreate = () => {
    setEditingItem(null);
    setForm(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  const openEdit = (item: SupplierPayload) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      code: item.code || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
      note: item.note || '',
      isActive: item.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên nhà cung cấp');
      return;
    }
    setIsSaving(true);
    try {
      if (editingItem) {
        await adminService.updateSupplier(editingItem.id, form);
        toast.success('Đã cập nhật nhà cung cấp');
      } else {
        await adminService.createSupplier(form);
        toast.success('Đã tạo nhà cung cấp');
      }
      setIsDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu nhà cung cấp');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: SupplierPayload) => {
    if (!window.confirm(`Ngừng kích hoạt nhà cung cấp "${item.name}"?`)) return;
    try {
      await adminService.deleteSupplier(item.id);
      toast.success('Đã ngừng kích hoạt nhà cung cấp');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật nhà cung cấp');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Nhà <span className="text-primary italic">cung cấp</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý đối tác nhập hàng để liên kết trực tiếp với phiếu nhập và tra cứu nhanh trong kho.</p>
        </div>
        <Button onClick={openCreate} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
          <Plus className="mr-2 h-4 w-4" />
          Thêm NCC
        </Button>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, mã NCC, số điện thoại..." className="h-12 rounded-2xl border-2 border-border bg-surface-default pl-12 text-sm font-medium" />
      </div>

      {isLoading ? (
        <LoadingState size="md" label="Đang tải nhà cung cấp" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Chưa có nhà cung cấp phù hợp" description="Thêm đối tác nhập hàng để liên kết với phiếu nhập kho và tra cứu nhanh." />
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-[28px] border border-border/50 bg-surface-default p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black">{item.name}</p>
                      <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.code || 'Không mã'}</span>
                    </div>
                    <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                      <p>{item.phone || 'Chưa có SĐT'}</p>
                      <p>{item.email || 'Chưa có email'}</p>
                      <p>{item.address || 'Chưa có địa chỉ'}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.note || 'Chưa có ghi chú thêm.'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEdit(item)} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest">
                    <Pencil className="mr-2 h-4 w-4" />
                    Sửa
                  </Button>
                  <Button variant="outline" onClick={() => void handleDelete(item)} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Ngừng dùng
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[32px] border-none bg-surface-default p-8 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Cập nhật nhà cung cấp' : 'Tạo nhà cung cấp mới'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tên NCC</label>
                <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mã NCC</label>
                <Input value={form.code || ''} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Số điện thoại</label>
                <Input value={form.phone || ''} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
                <Input value={form.email || ''} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Địa chỉ</label>
              <Input value={form.address || ''} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ghi chú</label>
              <textarea value={form.note || ''} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} rows={4} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none" />
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-bold">
              Kích hoạt nhà cung cấp
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu nhà cung cấp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
