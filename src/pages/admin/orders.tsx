import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Eye, Loader2, Search, ShoppingCart, Truck, XCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAdminOrders, useUpdateBatchOrderStatus } from '@/src/entities/order/api/order-api';
import type { AdminOutletContext } from '@/src/app/layouts/admin-layout';
import { Button } from '@/src/shared/ui/button';
import { cn } from '@/src/shared/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/ui/dialog';
import { OrderDetail } from './components/order-detail';
import { downloadExcelTable } from '@/src/shared/lib/excel';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-500 bg-blue-500/10', icon: Clock },
  SHIPPED: { label: 'Đang giao', color: 'text-purple-500 bg-purple-500/10', icon: Truck },
  DELIVERED: { label: 'Đã giao', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã huỷ', color: 'text-rose-500 bg-rose-500/10', icon: XCircle },
};

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'SHIPPED', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
] as const;

export const AdminOrders = () => {
  const { refreshTick } = useOutletContext<AdminOutletContext>();
  const { data: orders = [], isLoading, refetch } = useAdminOrders();
  const batchMutation = useUpdateBatchOrderStatus();
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    refetch();
  }, [refreshTick, refetch]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchSearch = `${order.orderNumber} ${order.user?.name || ''} ${order.user?.email || ''}`.toLowerCase().includes(globalFilter.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [globalFilter, orders, statusFilter]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const allVisibleSelected = filteredOrders.length > 0 && filteredOrders.every((order: any) => selectedIds.includes(order.id));

  const handleBatchUpdate = async (status: 'SHIPPED' | 'CANCELLED' | 'DELIVERED') => {
    if (!selectedIds.length) return;
    try {
      await batchMutation.mutateAsync({ ids: selectedIds, status });
      toast.success(`Đã cập nhật ${selectedIds.length} đơn hàng`);
      setSelectedIds([]);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleExport = () => {
    downloadExcelTable(`admin-orders-${Date.now()}.xls`, 'Orders', [
      ['Mã đơn', 'Khách hàng', 'Email', 'Tổng tiền', 'Trạng thái', 'Thanh toán', 'Ngày tạo'],
      ...filteredOrders.map((order: any) => [
        order.orderNumber,
        order.user?.name || 'Khách vãng lai',
        order.user?.email || '',
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount),
        STATUS_CONFIG[order.status]?.label || order.status,
        order.paymentStatus,
        new Date(order.createdAt).toLocaleString('vi-VN'),
      ]),
    ]);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Quản lý <span className="text-primary italic">đơn hàng</span>
          </h1>
          <p className="mt-1 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Theo dõi vận chuyển, xử lý xác nhận và xuất báo cáo Excel</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="h-11 rounded-xl border-2 border-border px-6 text-[10px] font-black uppercase tracking-widest">
          <Download className="mr-2 h-4 w-4" />
          Xuất Excel
        </Button>
      </div>

      <div className="rounded-[28px] border border-border/30 bg-muted/20 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Tìm kiếm mã đơn, tên khách hàng..."
              className="h-12 w-full rounded-2xl border border-border bg-surface-default pl-12 pr-4 text-xs font-bold outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(filter.value)}
                className="h-10 rounded-2xl px-4 text-[10px] font-black uppercase tracking-widest"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-border/50 bg-foreground p-4 text-background">
          <span className="text-sm font-black">{selectedIds.length} đơn hàng được chọn</span>
          <Button variant="ghost" className="h-10 rounded-2xl bg-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20" onClick={() => handleBatchUpdate('SHIPPED')}>
            Giao hàng
          </Button>
          <Button variant="ghost" className="h-10 rounded-2xl bg-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20" onClick={() => handleBatchUpdate('DELIVERED')}>
            Đã giao
          </Button>
          <Button variant="ghost" className="h-10 rounded-2xl bg-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20" onClick={() => handleBatchUpdate('CANCELLED')}>
            Huỷ đơn
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-[32px] border border-border/50 bg-surface-default">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="p-5">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() => setSelectedIds(allVisibleSelected ? [] : filteredOrders.map((order: any) => order.id))}
                  />
                </th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mã đơn</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Khách hàng</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tổng tiền</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Trạng thái</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ngày tạo</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground/30">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">Không tìm thấy đơn hàng phù hợp</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => {
                  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                  const Icon = config.icon;
                  return (
                    <tr key={order.id} className="border-b border-border/30 transition-colors hover:bg-muted/10">
                      <td className="p-5">
                        <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleSelection(order.id)} />
                      </td>
                      <td className="p-5 text-xs font-black uppercase tracking-wider">{order.orderNumber}</td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black">{order.user?.name || 'Khách vãng lai'}</span>
                          <span className="text-[11px] text-muted-foreground">{order.user?.email || ''}</span>
                        </div>
                      </td>
                      <td className="p-5 text-xs font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</td>
                      <td className="p-5">
                        <div className={cn('inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[10px] font-black', config.color)}>
                          <Icon className="h-3.5 w-3.5" />
                          {config.label}
                        </div>
                      </td>
                      <td className="p-5 text-[11px] font-semibold text-muted-foreground">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="p-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-none bg-surface-default p-8 shadow-2xl sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
              Chi tiết <span className="text-primary italic">đơn hàng</span>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setIsDetailOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};
