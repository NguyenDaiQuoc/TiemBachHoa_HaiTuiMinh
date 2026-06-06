import React, { useState } from 'react';
import { Card } from '@/src/shared/ui/card';
import { Button } from '@/src/shared/ui/button';
import { MapPin, Plus, Trash2, Edit2, Loader2, Home, CheckCircle2 } from 'lucide-react';
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from '@/src/entities/user/api/user-api';
import { AddressDialog } from './ui/address-dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/shared/lib/utils';

export const AddressesTab: React.FC = () => {
  const { data: addresses = [], isLoading } = useAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Đã thêm địa chỉ mới');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateMutation.mutateAsync({ id: editingAddress.id, data });
      toast.success('Đã cập nhật địa chỉ');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Đã xóa địa chỉ');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openCreateDialog = () => {
    setEditingAddress(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: any) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight">ĐỊA CHỈ CỦA TÔI</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Quản lý danh sách địa chỉ nhận hàng của bạn</p>
        </div>
        <Button 
          onClick={openCreateDialog}
          className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" /> THÊM ĐỊA CHỈ MỚI
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card className="p-12 border-none shadow-soft bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-tight italic">CHƯA CÓ ĐỊA CHỈ</h3>
            <p className="text-xs text-muted-foreground font-medium max-w-[240px]">Hãy thêm địa chỉ giao hàng để trải nghiệm mua sắm nhanh chóng hơn.</p>
          </div>
          <Button variant="outline" onClick={openCreateDialog} className="rounded-xl font-bold">Thêm địa chỉ đầu tiên</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {addresses.map((addr: any) => (
              <motion.div
                key={addr.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  "p-6 h-full border-none shadow-soft relative overflow-hidden transition-all duration-300 group",
                  addr.isDefault 
                    ? "bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20 shadow-xl shadow-primary/5" 
                    : "bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900"
                )}>
                  {addr.isDefault && (
                    <div className="absolute top-0 right-0 py-1 px-4 bg-primary text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-xl flex items-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="h-3 w-3" /> MẶC ĐỊNH
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-border/50 transition-transform group-hover:scale-110">
                      <Home className={cn("w-5 h-5", addr.isDefault ? "text-primary" : "text-slate-400")} />
                    </div>
                    <div className="space-y-2 pr-8">
                      <div className="flex flex-col">
                        <h4 className="font-black italic uppercase tracking-tight text-lg leading-none">{addr.receiverName}</h4>
                        <span className="text-[10px] font-black text-primary mt-1 opacity-80">{addr.phone}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {addr.detail}, {addr.ward}, {addr.district}, {addr.province}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openEditDialog(addr)}
                      className="flex-1 h-10 rounded-xl bg-background/50 hover:bg-background border border-border/50 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-2" /> CHỈNH SỬA
                    </Button>
                    {!addr.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(addr.id)}
                        className="h-10 w-10 p-0 rounded-xl bg-rose-500/5 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                     )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddressDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={editingAddress ? handleUpdate : handleCreate}
        initialData={editingAddress}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};
