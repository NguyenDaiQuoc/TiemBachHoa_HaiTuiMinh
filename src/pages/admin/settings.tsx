import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';
import { adminService } from '@/src/entities/admin/api/admin-service';
import { AdminSettingsPayload } from '@/src/entities/admin/model/types';
import type { AdminOutletContext } from '@/src/app/layouts/admin-layout';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { toast } from 'sonner';

const DEFAULT_SETTINGS: AdminSettingsPayload = {
  storeName: '',
  contactEmail: '',
  hotline: '',
  address: '',
  description: '',
};

export const AdminSettings = () => {
  const { refreshTick, triggerRefresh } = useOutletContext<AdminOutletContext>();
  const [form, setForm] = useState<AdminSettingsPayload>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    adminService
      .getSettings()
      .then((data) => {
        if (active) setForm(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTick]);

  const handleChange = (key: keyof AdminSettingsPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const data = await adminService.updateSettings(form);
      setForm(data);
      toast.success('Đã lưu cấu hình cửa hàng');
      triggerRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">
          Cấu hình <span className="text-primary italic">hệ thống</span>
        </h1>
        <p className="mt-1 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Quản lý thông tin cửa hàng và dữ liệu liên hệ</p>
      </div>

      <div className="max-w-4xl space-y-8">
        <div className="rounded-[40px] border border-border/50 bg-surface-default p-10 shadow-2xl">
          <h3 className="mb-8 flex items-center gap-4 text-sm font-black uppercase tracking-widest">
            Thông tin cửa hàng
            <div className="h-px flex-1 bg-border/50" />
          </h3>

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Tên cửa hàng</label>
                <Input value={form.storeName} onChange={(event) => handleChange('storeName', event.target.value)} className="h-12 rounded-2xl bg-surface-sunken px-5 text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Email liên hệ</label>
                <Input value={form.contactEmail} onChange={(event) => handleChange('contactEmail', event.target.value)} className="h-12 rounded-2xl bg-surface-sunken px-5 text-xs font-bold" />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Hotline</label>
                <Input value={form.hotline} onChange={(event) => handleChange('hotline', event.target.value)} className="h-12 rounded-2xl bg-surface-sunken px-5 text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Địa chỉ</label>
                <Input value={form.address} onChange={(event) => handleChange('address', event.target.value)} className="h-12 rounded-2xl bg-surface-sunken px-5 text-xs font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Mô tả cửa hàng</label>
              <textarea
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                rows={5}
                className="w-full rounded-[24px] bg-surface-sunken px-5 py-4 text-sm font-medium outline-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="h-12 rounded-2xl px-8 text-[10px] font-black uppercase tracking-widest">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Lưu cấu hình
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
