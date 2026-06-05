import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Copy, Gift, Loader2, Percent, Plus, Save, Search, ShieldCheck, TicketPercent } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { adminService } from '@/src/entities/admin/api/admin-service';
import type { AdminOutletContext } from '@/src/app/layouts/admin-layout';
import type { VoucherFormPayload, VoucherPayload } from '@/src/entities/admin/model/types';
import { Button } from '@/src/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/ui/dialog';
import { Input } from '@/src/shared/ui/input';

const DEFAULT_FORM: VoucherFormPayload = {
  code: '',
  title: '',
  description: '',
  type: 'PERCENT',
  value: 10,
  minOrderValue: 0,
  maxDiscount: 0,
  usageLimit: 100,
  startsAt: null,
  endsAt: null,
  isActive: true,
};

const toLocalDateTimeValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const toIsoOrNull = (value: string) => (value ? new Date(value).toISOString() : null);

export const AdminVouchers = () => {
  const { refreshTick } = useOutletContext<AdminOutletContext>();
  const [vouchers, setVouchers] = useState<VoucherPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherPayload | null>(null);
  const [form, setForm] = useState<VoucherFormPayload>(DEFAULT_FORM);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    adminService
      .getVouchers()
      .then((data) => {
        if (active) setVouchers(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTick]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const matchesSearch = `${voucher.code} ${voucher.title}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesActive = !showActiveOnly || voucher.isActive;
      return matchesSearch && matchesActive;
    });
  }, [searchQuery, showActiveOnly, vouchers]);

  const openCreateDialog = () => {
    setEditingVoucher(null);
    setForm(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (voucher: VoucherPayload) => {
    setEditingVoucher(voucher);
    setForm({
      code: voucher.code,
      title: voucher.title,
      description: voucher.description || '',
      type: voucher.type,
      value: voucher.value,
      minOrderValue: voucher.minOrderValue || 0,
      maxDiscount: voucher.maxDiscount || 0,
      usageLimit: voucher.usageLimit || 0,
      startsAt: voucher.startsAt,
      endsAt: voucher.endsAt,
      isActive: voucher.isActive,
    });
    setIsDialogOpen(true);
  };

  const refreshVouchers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getVouchers();
      setVouchers(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.title.trim()) {
      toast.error('Vui lòng nhập mã voucher và tiêu đề');
      return;
    }

    setIsSaving(true);
    try {
      const payload: VoucherFormPayload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        description: form.description?.trim() || '',
        startsAt: form.startsAt,
        endsAt: form.endsAt,
      };

      if (editingVoucher) {
        await adminService.updateVoucher(editingVoucher.id, payload);
        toast.success('Đã cập nhật voucher');
      } else {
        await adminService.createVoucher(payload);
        toast.success('Đã tạo voucher mới');
      }

      setIsDialogOpen(false);
      await refreshVouchers();
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu voucher');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickToggle = async (voucher: VoucherPayload) => {
    try {
      await adminService.updateVoucher(voucher.id, { isActive: !voucher.isActive });
      toast.success(voucher.isActive ? 'Đã tạm ngưng voucher' : 'Đã kích hoạt voucher');
      await refreshVouchers();
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật trạng thái voucher');
    }
  };

  const handleDuplicate = async (voucher: VoucherPayload) => {
    try {
      const duplicatedCode = `${voucher.code}-NEW`;
      await adminService.createVoucher({
        code: duplicatedCode.slice(0, 32),
        title: `${voucher.title} bản sao`,
        description: voucher.description || '',
        type: voucher.type,
        value: voucher.value,
        minOrderValue: voucher.minOrderValue || 0,
        maxDiscount: voucher.maxDiscount || 0,
        usageLimit: voucher.usageLimit || 100,
        startsAt: voucher.startsAt,
        endsAt: voucher.endsAt,
        isActive: false,
      });
      toast.success('Đã nhân bản voucher');
      await refreshVouchers();
    } catch (error: any) {
      toast.error(error.message || 'Không thể nhân bản voucher');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Quản lý <span className="text-primary italic">voucher</span>
          </h1>
          <p className="mt-1 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">
            Tạo mã giảm giá, kiểm soát chiến dịch và theo dõi mức độ sử dụng
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => void refreshVouchers()} className="h-11 rounded-xl border-2 border-border px-6 text-[10px] font-black uppercase tracking-widest">
            Làm mới
          </Button>
          <Button onClick={openCreateDialog} className="h-11 rounded-xl bg-primary px-6 text-[10px] font-black uppercase tracking-widest">
            <Plus className="mr-2 h-4 w-4" />
            Tạo voucher
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-[28px] border border-border/50 bg-surface-default p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tổng voucher</p>
          <p className="mt-2 text-2xl font-black">{vouchers.length}</p>
        </div>
        <div className="rounded-[28px] border border-border/50 bg-surface-default p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Đang hoạt động</p>
          <p className="mt-2 text-2xl font-black">{vouchers.filter((voucher) => voucher.isActive).length}</p>
        </div>
        <div className="rounded-[28px] border border-border/50 bg-surface-default p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lượt sử dụng</p>
          <p className="mt-2 text-2xl font-black">{vouchers.reduce((sum, voucher) => sum + voucher.usedCount, 0)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo mã voucher hoặc tên chiến dịch..."
            className="h-12 rounded-2xl border-2 border-border bg-surface-default pl-12 text-xs font-bold"
          />
        </div>
        <Button variant="outline" onClick={() => setShowActiveOnly((prev) => !prev)} className="h-12 rounded-2xl border-2 border-border px-6 text-[10px] font-black uppercase tracking-widest">
          {showActiveOnly ? 'Hiện tất cả' : 'Chỉ xem đang chạy'}
        </Button>
      </div>

      <div className="grid gap-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-border/50 bg-surface-default p-12 text-center">
            <Gift className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-bold text-muted-foreground">Chưa có voucher nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          filteredVouchers.map((voucher, index) => (
            <motion.div
              key={voucher.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[32px] border border-border/50 bg-surface-default p-6"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 px-4 py-2 text-sm font-black uppercase tracking-widest text-primary">
                      {voucher.code}
                    </div>
                    <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${voucher.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                      {voucher.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">{voucher.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{voucher.description || 'Chưa có mô tả cho chiến dịch này.'}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-surface-sunken p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ưu đãi</p>
                      <p className="mt-2 text-sm font-black">
                        {voucher.type === 'PERCENT'
                          ? `${voucher.value}%`
                          : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(voucher.value)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-surface-sunken p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Đơn tối thiểu</p>
                      <p className="mt-2 text-sm font-black">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(voucher.minOrderValue || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-surface-sunken p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Đã dùng</p>
                      <p className="mt-2 text-sm font-black">
                        {voucher.usedCount}/{voucher.usageLimit || '∞'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-surface-sunken p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Hiệu lực</p>
                      <p className="mt-2 text-sm font-black">
                        {voucher.endsAt ? new Date(voucher.endsAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 lg:max-w-[280px] lg:justify-end">
                  <Button variant="outline" onClick={() => openEditDialog(voucher)} className="h-11 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest">
                    <Save className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                  <Button variant="outline" onClick={() => void handleDuplicate(voucher)} className="h-11 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest">
                    <Copy className="mr-2 h-4 w-4" />
                    Nhân bản
                  </Button>
                  <Button onClick={() => void handleQuickToggle(voucher)} className="h-11 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest">
                    {voucher.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-none bg-surface-default p-8 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {editingVoucher ? 'Cập nhật voucher' : 'Tạo voucher mới'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mã voucher</label>
              <Input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tên chiến dịch</label>
              <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mô tả</label>
              <textarea
                value={form.description || ''}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loại giảm giá</label>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as 'PERCENT' | 'FIXED' }))}
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-bold outline-none"
              >
                <option value="PERCENT">Phần trăm</option>
                <option value="FIXED">Tiền mặt</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Giá trị</label>
              <Input type="number" value={form.value} onChange={(event) => setForm((prev) => ({ ...prev, value: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Đơn tối thiểu</label>
              <Input type="number" value={form.minOrderValue || 0} onChange={(event) => setForm((prev) => ({ ...prev, minOrderValue: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Giảm tối đa</label>
              <Input type="number" value={form.maxDiscount || 0} onChange={(event) => setForm((prev) => ({ ...prev, maxDiscount: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Giới hạn lượt dùng</label>
              <Input type="number" value={form.usageLimit || 0} onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bắt đầu</label>
              <Input type="datetime-local" value={toLocalDateTimeValue(form.startsAt)} onChange={(event) => setForm((prev) => ({ ...prev, startsAt: toIsoOrNull(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kết thúc</label>
              <Input type="datetime-local" value={toLocalDateTimeValue(form.endsAt)} onChange={(event) => setForm((prev) => ({ ...prev, endsAt: toIsoOrNull(event.target.value) }))} />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 md:col-span-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <label className="flex flex-1 items-center justify-between text-sm font-bold">
                Kích hoạt ngay sau khi lưu
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest">
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving} className="h-11 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TicketPercent className="mr-2 h-4 w-4" />}
              {editingVoucher ? 'Lưu thay đổi' : 'Tạo voucher'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
