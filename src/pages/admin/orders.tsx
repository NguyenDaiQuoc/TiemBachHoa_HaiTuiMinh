import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Eye, Loader2, Search, ShoppingCart, Truck, XCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { useAdminOrders, useUpdateBatchOrderStatus, useUpdateOrderStatus } from '@/src/entities/order/api/order-api';
import type { AdminOutletContext } from '@/src/app/layouts/admin-layout';
import { Button } from '@/src/shared/ui/button';
import { cn } from '@/src/shared/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/ui/dialog';
import { OrderDetail } from './components/order-detail';
import { downloadExcelTable } from '@/src/shared/lib/excel';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-amber-500/10 text-amber-600', icon: Clock },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-500/10 text-blue-600', icon: Clock },
  SHIPPED: { label: 'Đang giao', color: 'bg-purple-500/10 text-purple-600', icon: Truck },
  DELIVERED: { label: 'Đã giao', color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', color: 'bg-rose-500/10 text-rose-600', icon: XCircle },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PAID: { label: 'Đã thanh toán', color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
  UNPAID: { label: 'Chưa thanh toán', color: 'bg-amber-500/10 text-amber-600', icon: Clock },
  PENDING: { label: 'Chờ thanh toán', color: 'bg-amber-500/10 text-amber-600', icon: Clock },
  FAILED: { label: 'Thanh toán lỗi', color: 'bg-rose-500/10 text-rose-600', icon: XCircle },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-slate-500/10 text-slate-600', icon: XCircle },
};

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'SHIPPED', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
] as const;

const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
const customerNameOf = (order: any) => order.customerName || order.user?.name || order.user?.email || 'Khách vãng lai';
const customerEmailOf = (order: any) => order.customerEmail || order.user?.email || '';

export const AdminOrders = () => {
  const { refreshTick } = useOutletContext<AdminOutletContext>();
  const { data: orders = [], isLoading, refetch } = useAdminOrders();
  const batchMutation = useUpdateBatchOrderStatus();
  const statusMutation = useUpdateOrderStatus();
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['value']>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    refetch();
  }, [refreshTick, refetch]);

  const filteredOrders = useMemo(() => {
    const keyword = globalFilter.toLowerCase();
    return orders.filter((order: any) => {
      const matchSearch = `${order.orderNumber} ${customerNameOf(order)} ${customerEmailOf(order)}`.toLowerCase().includes(keyword);
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [globalFilter, orders, statusFilter]);

  const allVisibleSelected = filteredOrders.length > 0 && filteredOrders.every((order: any) => selectedIds.includes(order.id));
  const toggleSelection = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

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

  const handleQuickStatus = async (order: any, status: string, openTracking = false) => {
    try {
      await statusMutation.mutateAsync({ id: order.id, status });
      toast.success('Đã cập nhật trạng thái đơn hàng');
      refetch();
      if (openTracking) window.open(`/tracking?code=${encodeURIComponent(order.orderNumber || order.id)}`, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const handleExport = () => {
    downloadExcelTable(`admin-orders-${Date.now()}.xls`, 'Orders', [
      ['Mã đơn', 'Khách hàng', 'Email', 'Tổng tiền', 'Trạng thái đơn', 'Thanh toán', 'Ngày tạo'],
      ...filteredOrders.map((order: any) => [
        order.orderNumber,
        customerNameOf(order),
        customerEmailOf(order),
        money(order.totalAmount),
        STATUS_CONFIG[order.status]?.label || order.status,
        PAYMENT_CONFIG[order.paymentStatus]?.label || order.paymentStatus,
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
              <Button key={filter.value} variant={statusFilter === filter.value ? 'default' : 'outline'} onClick={() => setStatusFilter(filter.value)} className="h-10 rounded-2xl px-4 text-[10px] font-black uppercase tracking-widest">
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
            Hủy đơn
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-[32px] border border-border/50 bg-surface-default">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="p-5">
                  <input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedIds(allVisibleSelected ? [] : filteredOrders.map((order: any) => order.id))} />
                </th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mã đơn</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Khách hàng</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tổng tiền</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Trạng thái đơn</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Thanh toán</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ngày tạo</th>
                <th className="p-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-20 text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-20 text-center">
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
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = statusConfig.icon;
                  const paymentConfig = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.UNPAID;
                  const PaymentIcon = paymentConfig.icon;

                  return (
                    <tr key={order.id} className="border-b border-border/30 transition-colors hover:bg-muted/10">
                      <td className="p-5">
                        <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleSelection(order.id)} />
                      </td>
                      <td className="p-5 text-xs font-black uppercase tracking-wider">{order.orderNumber}</td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black">{customerNameOf(order)}</span>
                          <span className="text-[11px] text-muted-foreground">{customerEmailOf(order)}</span>
                        </div>
                      </td>
                      <td className="p-5 text-xs font-black">{money(order.totalAmount)}</td>
                      <td className="p-5">
                        <div className={cn('inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[10px] font-black', statusConfig.color)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig.label}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className={cn('inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[10px] font-black', paymentConfig.color)}>
                          <PaymentIcon className="h-3.5 w-3.5" />
                          {paymentConfig.label}
                        </div>
                      </td>
                      <td className="p-5 text-[11px] font-semibold text-muted-foreground">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="p-5">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {order.status === 'PENDING' && (
                            <>
                              <Button variant="outline" className="h-9 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest" onClick={() => handleQuickStatus(order, 'PROCESSING')} disabled={statusMutation.isPending}>
                                Xác nhận
                              </Button>
                              <Button variant="outline" className="h-9 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest text-rose-600" onClick={() => handleQuickStatus(order, 'CANCELLED')} disabled={statusMutation.isPending}>
                                Hủy đơn
                              </Button>
                            </>
                          )}
                          {order.status === 'PROCESSING' && (
                            <Button variant="outline" className="h-9 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest text-purple-600" onClick={() => handleQuickStatus(order, 'SHIPPED', true)} disabled={statusMutation.isPending}>
                              {order.paymentStatus === 'UNPAID' ? 'Bắt đầu vận chuyển' : 'Đã soạn hàng'}
                            </Button>
                          )}
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
                        </div>
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
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto overflow-x-hidden rounded-[24px] border-none bg-surface-default p-4 shadow-2xl sm:max-w-5xl sm:rounded-[32px] sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
              Chi tiết <span className="text-primary italic">đơn hàng</span>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setIsDetailOpen(false)} onUpdated={refetch} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};
