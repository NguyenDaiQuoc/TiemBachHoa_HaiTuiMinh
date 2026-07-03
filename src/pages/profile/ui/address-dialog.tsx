import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/shared/ui/dialog';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { Checkbox } from '@/src/shared/ui/checkbox';
import { Loader2 } from 'lucide-react';

const addressSchema = z.object({
  receiverName: z.string().min(2, "Tên người nhận phải có ít nhất 2 ký tự"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ").max(15),
  province: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
  district: z.string().min(1, "Vui lòng chọn quận/huyện"),
  ward: z.string().min(1, "Vui lòng chọn phường/xã"),
  detail: z.string().min(5, "Địa chỉ chi tiết quá ngắn"),
  isDefault: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;
type AddressFormInput = z.input<typeof addressSchema>;

interface AddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormValues) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

export const AddressDialog: React.FC<AddressDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading
}) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AddressFormInput, unknown, AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      receiverName: '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      detail: '',
      isDefault: false,
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(initialData || {
        receiverName: '',
        phone: '',
        province: '',
        district: '',
        ward: '',
        detail: '',
        isDefault: false,
      });
    }
  }, [isOpen, initialData, reset]);

  const onFormSubmit = async (data: AddressFormValues) => {
    await onSubmit(data);
    onClose();
  };

  const isDefault = watch('isDefault');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[32px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
            {initialData ? 'CẬP NHẬT ĐỊA CHỈ' : 'THÊM ĐỊA CHỈ MỚI'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">HỌ VÀ TÊN</label>
              <Input {...register('receiverName')} placeholder="Ví dụ: Nguyễn Văn A" className="h-12 rounded-2xl bg-muted/30 border-none" />
              {errors.receiverName && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.receiverName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SỐ ĐIỆN THOẠI</label>
              <Input {...register('phone')} placeholder="Ví dụ: 0901234567" className="h-12 rounded-2xl bg-muted/30 border-none" />
              {errors.phone && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">TỈNH/THÀNH</label>
              <Input {...register('province')} placeholder="TP. Hồ Chí Minh" className="h-12 rounded-2xl bg-muted/30 border-none px-3" />
              {errors.province && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.province.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">QUẬN/HUYỆN</label>
              <Input {...register('district')} placeholder="Quận 1" className="h-12 rounded-2xl bg-muted/30 border-none px-3" />
              {errors.district && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.district.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phường/xã</label>
              <Input {...register('ward')} placeholder="Phường Đa Kao" className="h-12 rounded-2xl bg-muted/30 border-none px-3" />
              {errors.ward && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.ward.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">ĐỊA CHỈ CHI TIẾT</label>
            <Input {...register('detail')} placeholder="Số nhà, tên đường..." className="h-12 rounded-2xl bg-muted/30 border-none" />
            {errors.detail && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.detail.message}</p>}
          </div>

          <div className="flex items-center gap-2 px-1">
            <Checkbox 
              id="isDefault" 
              checked={isDefault}
              onCheckedChange={(checked) => setValue('isDefault', checked === true)}
            />
            <label htmlFor="isDefault" className="text-xs font-bold uppercase tracking-widest text-muted-foreground cursor-pointer select-none">
              Đặt làm địa chỉ mặc định
            </label>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'CẬP NHẬT' : 'HOÀN TẤT'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
