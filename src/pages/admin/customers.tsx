import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Ban, Calendar, Edit3, Mail, Phone, Search, ShieldCheck, ShoppingBag, Star, Users } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { adminService } from '@/src/entities/admin/api/admin-service';
import { Customer } from '@/src/entities/admin/model/types';
import type { AdminOutletContext } from '@/src/app/layouts/admin-layout';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/ui/dialog';
import { Input } from '@/src/shared/ui/input';
import { downloadExcelTable } from '@/src/shared/lib/excel';
import { cn } from '@/src/shared/lib/utils';

export const AdminCustomers = () => {
  const { refreshTick } = useOutletContext<AdminOutletContext>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getCustomers();
      setCustomers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [refreshTick]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [customers, searchQuery]
  );

  const handleExport = () => {
    downloadExcelTable(`admin-customers-${Date.now()}.xls`, 'Customers', [
      ['Tên', 'Email', 'Số điện thoại', 'Đơn hàng', 'Chi tiêu', 'Điểm thành viên', 'Trạng thái'],
      ...filteredCustomers.map((customer) => [
        customer.name,
        customer.email,
        customer.phone,
        String(customer.totalOrders),
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.totalSpent),
        String(customer.membershipPoints || 0),
        customer.status,
      ]),
    ]);
  };

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setIsDialogOpen(true);
  };

  const saveCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      await adminService.updateCustomer(selectedCustomer.id, { name: editName, phone: editPhone });
      toast.success('Đã cập nhật thông tin khách hàng');
      setIsDialogOpen(false);
      loadCustomers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleBan = async (customer: Customer) => {
    try {
      const shouldActivate = customer.status !== 'ACTIVE';
      await adminService.updateCustomer(customer.id, { isActive: shouldActivate });
      toast.success(shouldActivate ? 'Đã mở khoá tài khoản' : 'Đã khóa tài khoản người dùng');
      loadCustomers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalSpent = filteredCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const totalOrders = filteredCustomers.reduce((sum, customer) => sum + customer.totalOrders, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Quản lý <span className="text-primary italic">khách hàng</span>
          </h1>
          <p className="mt-1 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Xem thông tin, cập nhật hồ sơ và khoá tài khoản khi cần</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="h-11 rounded-xl border-2 border-border px-6 text-[10px] font-black uppercase tracking-widest">
          Xuất Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Tổng khách hàng', value: filteredCustomers.length, icon: Users },
          { label: 'Đơn hàng', value: totalOrders, icon: ShoppingBag },
          { label: 'Chi tiêu', value: new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(totalSpent), icon: Star },
          { label: 'Hoạt động', value: filteredCustomers.filter((customer) => customer.status === 'ACTIVE').length, icon: ShieldCheck },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[24px] border border-border/50 bg-surface-default p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{stat.label}</p>
            <p className="mt-1 text-xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Tìm theo tên, email, số điện thoại..."
          className="h-12 w-full rounded-2xl border border-border bg-surface-default pl-12 pr-4 text-xs font-bold outline-none"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-sm font-bold text-muted-foreground">Đang tải danh sách khách hàng...</div>
        ) : (
          filteredCustomers.map((customer) => (
            <motion.div key={customer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-border/50 bg-surface-default p-6">
              <div className="flex flex-col gap-5 md:flex-row">
                <div className="h-20 w-20 overflow-hidden rounded-[24px] border border-border bg-muted">
                  <img src={customer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.email}`} alt={customer.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight">{customer.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                      <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" />{customer.email}</span>
                      <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{customer.phone}</span>
                      <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" />{new Date(customer.lastOrderDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 rounded-2xl bg-surface-sunken p-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Đơn hàng</p>
                      <p className="mt-1 text-xs font-black">{customer.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Chi tiêu</p>
                      <p className="mt-1 text-xs font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.totalSpent)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Điểm</p>
                      <p className="mt-1 text-xs font-black">{customer.membershipPoints || 0}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest', customer.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                      {customer.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã bị khóa'}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => openEdit(customer)} className="h-9 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Sửa
                      </Button>
                      <Button variant="outline" onClick={() => toggleBan(customer)} className="h-9 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest">
                        <Ban className="mr-2 h-4 w-4" />
                        {customer.status === 'ACTIVE' ? 'Cấm user' : 'Mở khóa'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[32px] border-none bg-surface-default p-8 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Cập nhật khách hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Họ tên</label>
              <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Số điện thoại</label>
              <Input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest">Hủy</Button>
              <Button onClick={saveCustomer} className="h-11 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest">Lưu thay đổi</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
