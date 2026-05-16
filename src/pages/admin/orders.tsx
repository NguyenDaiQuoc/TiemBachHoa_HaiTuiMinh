import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnDef
} from '@tanstack/react-table';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  ShoppingCart,
  MoreHorizontal,
  Clock,
  AlertCircle,
  XCircle,
  Truck,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useAdminOrders, useUpdateBatchOrderStatus } from '@/src/entities/order/api/order-api';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/ui/dialog";
import { OrderDetail } from './components/order-detail';

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  PENDING: { label: 'CHỜ XÁC NHẬN', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  PROCESSING: { label: 'ĐANG XỬ LÝ', color: 'text-blue-500 bg-blue-500/10', icon: AlertCircle },
  SHIPPED: { label: 'ĐANG GIAO', color: 'text-purple-500 bg-purple-500/10', icon: Truck },
  DELIVERED: { label: 'ĐÃ GIAO', color: 'text-emerald-500 bg-emerald-500/10', icon: CheckCircle2 },
  CANCELLED: { label: 'ĐÃ HỦY', color: 'text-rose-500 bg-rose-500/10', icon: XCircle },
  REFUNDED: { label: 'HOÀN TIỀN', color: 'text-slate-500 bg-slate-500/10', icon: XCircle },
};

export const AdminOrders = () => {
  const { data: orders = [], isLoading } = useAdminOrders();
  const batchMutation = useUpdateBatchOrderStatus();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const [rowSelection, setRowSelection] = useState({});
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleBatchUpdate = async (status: string) => {
    const ids = Object.keys(rowSelection);
    if (ids.length === 0) return;
    
    try {
      await batchMutation.mutateAsync({ ids, status });
      toast.success(`Đã cập nhật ${ids.length} đơn hàng sang ${status}`);
      setRowSelection({});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border/50 text-primary focus:ring-primary/20"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border/50 text-primary focus:ring-primary/20"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      accessorKey: 'orderNumber',
      header: 'MÃ ĐƠN HÀNG',
      cell: ({ row }) => (
        <span className="font-black text-xs uppercase tracking-wider">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: 'user',
      header: 'KHÁCH HÀNG',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-black text-xs uppercase italic">{row.original.user?.name || 'Khách vãng lai'}</span>
          <span className="text-[10px] text-muted-foreground opacity-60 font-bold">{row.original.user?.email || row.original.customerEmail}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'TỔNG TIỀN',
      cell: ({ row }) => (
        <span className="font-black text-xs">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'TRẠNG THÁI',
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.PENDING;
        const { label, color, icon: Icon } = config;
        return (
          <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent font-black text-[8px] uppercase tracking-widest", color)}>
            <Icon className="h-3 w-3" />
            {label}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'NGÀY TẠO',
      cell: ({ row }) => (
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
          {new Date(row.original.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
           <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => {
              setSelectedOrder(row.original);
              setIsDetailOpen(true);
            }}
           >
              <Eye className="h-4 w-4" />
           </Button>
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
           </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Quản lý <span className="text-primary italic">Đơn hàng</span></h1>
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mt-1 opacity-60">Theo dõi và cập nhật trạng thái vận chuyển</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="h-11 rounded-xl px-6 border-2 border-border font-black text-[10px] uppercase tracking-widest flex gap-2">
            <Download className="h-4 w-4" /> Xuất file EXCEL
          </Button>
        </div>
      </div>

      {/* Table Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/20 p-4 rounded-3xl border border-border/30">
        <div className="relative flex-1 w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <input 
              type="text"
              placeholder="Tìm kiếm mã đơn, khách hàng..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface-default border-2 border-transparent focus:border-primary/20 rounded-2xl outline-none text-xs font-bold transition-all"
           />
        </div>
        <Button variant="outline" className="h-12 w-full md:w-auto px-6 rounded-2xl border-2 border-border bg-surface-default flex gap-2 font-black text-[10px] uppercase tracking-widest">
           <Filter className="h-4 w-4" /> FILTER CHUYÊN SÂU
        </Button>
      </div>

      {/* Main Table */}
      <div className="bg-surface-default rounded-[40px] border border-border/50 shadow-2xl overflow-hidden relative">
        {/* Bulk Actions Floating Bar */}
        <AnimatePresence>
          {Object.keys(rowSelection).length > 0 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-foreground text-background px-8 py-4 rounded-[32px] shadow-2xl flex items-center gap-8 border border-white/10"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-widest opacity-60 uppercase">Đã chọn</span>
                <span className="text-xl font-black font-heading tracking-tighter">{Object.keys(rowSelection).length} ĐƠN HÀNG</span>
              </div>
              
              <div className="h-10 w-px bg-white/10" />
              
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  disabled={batchMutation.isPending}
                  onClick={() => handleBatchUpdate('SHIPPED')}
                  className="bg-white/5 hover:bg-white/10 text-white font-black text-[10px] tracking-widest uppercase h-12 rounded-2xl px-6"
                >
                  {batchMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />} GIAO HÀNG LOẠT
                </Button>
                <Button 
                  variant="ghost" 
                  disabled={batchMutation.isPending}
                  onClick={() => handleBatchUpdate('CANCELLED')}
                  className="bg-white/5 hover:bg-white/10 text-white font-black text-[10px] tracking-widest uppercase h-12 rounded-2xl px-6"
                >
                  <XCircle className="mr-2 h-4 w-4" /> HỦY ĐƠN LOẠT
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="absolute inset-0 bg-surface-default/80 backdrop-blur-sm z-50 flex items-center justify-center">
             <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border/50 bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <th 
                      key={header.id}
                      className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors group">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-6">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && !isLoading && (
                <tr>
                   <td colSpan={columns.length} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                         <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                            <ShoppingCart className="h-8 w-8" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Không tìm thấy đơn hàng nào</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/30">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
               Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, orders.length)} trên {orders.length} kết quả
            </div>
            
            <div className="flex items-center gap-2">
               <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-xl"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
               >
                  <ChevronsLeft className="h-4 w-4" />
               </Button>
               <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-xl"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
               >
                  <ChevronLeft className="h-4 w-4" />
               </Button>
               <div className="flex items-center gap-1 mx-2">
                  {[...Array(table.getPageCount())].map((_, i) => (
                    <Button 
                      key={i}
                      variant={table.getState().pagination.pageIndex === i ? "default" : "outline"}
                      className={cn(
                        "h-10 w-10 rounded-xl font-black text-xs",
                        table.getState().pagination.pageIndex !== i && "hover:bg-primary/10 hover:text-primary border-none bg-transparent"
                      )}
                      onClick={() => table.setPageIndex(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
               </div>
               <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-xl"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
               >
                  <ChevronRight className="h-4 w-4" />
               </Button>
               <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-xl"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
               >
                  <ChevronsRight className="h-4 w-4" />
               </Button>
            </div>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none bg-surface-default shadow-2xl p-8">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight italic">
                 Chi tiết <span className="text-primary italic">Đơn hàng</span>
              </DialogTitle>
           </DialogHeader>
           {selectedOrder && (
             <OrderDetail order={selectedOrder} onClose={() => setIsDetailOpen(false)} />
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
