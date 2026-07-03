import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/src/shared/ui/form-field';
import { Button } from '@/src/shared/ui/button';
import { Checkbox } from '@/src/shared/ui/checkbox';
import { useAddresses, useCreateAddress } from '@/src/entities/user/api/user-api';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { useCheckoutStore } from '../model/checkout-store';
import { MapPin, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  address: z.string().min(5, 'Địa chỉ quá ngắn'),
  note: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  onSuccess: () => void;
}

export const CheckoutForm = ({ onSuccess }: CheckoutFormProps) => {
  const { setShippingInfo, shippingInfo } = useCheckoutStore();
  const user = useAuthStore((state) => state.user);
  const { data: addresses = [] } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: shippingInfo?.fullName ?? '',
      email: shippingInfo?.email ?? '',
      phone: shippingInfo?.phone ?? '',
      address: shippingInfo?.address ?? '',
      note: shippingInfo?.note ?? '',
    },
  });

  useEffect(() => {
    if (!shippingInfo && addresses.length) {
      const defaultAddress = addresses.find((address: any) => address.isDefault) || addresses[0];
      if (defaultAddress) applyAddress(defaultAddress);
    }
  }, [addresses, shippingInfo]);

  const formatAddress = (address: any) => [address.detail, address.ward, address.district, address.province]
    .filter(Boolean)
    .filter((part) => part !== 'Đang cập nhật')
    .join(', ');

  const applyAddress = (address: any) => {
    form.setValue('fullName', address.receiverName || '', { shouldValidate: true });
    form.setValue('phone', address.phone || '', { shouldValidate: true });
    form.setValue('address', formatAddress(address), { shouldValidate: true });
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    if (saveToAddressBook && user) {
      try {
        await createAddressMutation.mutateAsync({
          receiverName: data.fullName,
          phone: data.phone,
          detail: data.address,
          province: 'Đang cập nhật',
          district: 'Đang cập nhật',
          ward: 'Đang cập nhật',
          isDefault: addresses.length === 0,
        });
        toast.success('Đã lưu địa chỉ vào sổ địa chỉ');
      } catch (error: any) {
        toast.error(error.message || 'Không thể lưu địa chỉ');
      }
    }

    setShippingInfo(data);
    onSuccess();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold font-heading">Thông tin giao hàng</h3>
          {addresses.length > 0 && (
            <Button type="button" variant="outline" className="rounded-full text-xs font-bold" onClick={() => setShowAddressPicker((value) => !value)}>
              <MapPin className="mr-2 h-4 w-4" /> Chọn địa chỉ
            </Button>
          )}
        </div>

        {showAddressPicker && addresses.length > 0 && (
          <div className="grid gap-3 rounded-3xl border border-border/60 bg-muted/20 p-3">
            {addresses.map((address: any) => (
              <button
                key={address.id}
                type="button"
                onClick={() => {
                  applyAddress(address);
                  setShowAddressPicker(false);
                }}
                className="rounded-2xl border border-border/50 bg-card p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black">{address.receiverName} - {address.phone}</p>
                  {address.isDefault && <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-primary">Mặc định</span>}
                </div>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{formatAddress(address)}</p>
              </button>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField 
            form={form} 
            name="fullName" 
            label="Họ và tên" 
            placeholder="Nguyễn Văn A" 
          />
          <FormField 
            form={form} 
            name="email" 
            label="Email" 
            placeholder="example@gmail.com" 
            type="email"
          />
        </div>
        <FormField 
          form={form} 
          name="phone" 
          label="Số điện thoại" 
          placeholder="090..." 
        />
        <FormField 
          form={form} 
          name="address" 
          label="Địa chỉ giao hàng" 
          placeholder="Số nhà, đường, phường/xã..." 
        />
        <FormField 
          form={form} 
          name="note" 
          label="Ghi chú (tùy chọn)" 
          placeholder="Lời nhắn cho shipper..." 
        />

        {user && (
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/50 bg-muted/20 p-4 text-sm font-bold">
            <Checkbox checked={saveToAddressBook} onCheckedChange={(checked) => setSaveToAddressBook(checked === true)} />
            <Save className="h-4 w-4 text-primary" />
            Lưu địa chỉ này vào sổ địa chỉ
          </label>
        )}
      </div>
      
      <Button type="submit" disabled={createAddressMutation.isPending} className="w-full h-12 rounded-full font-bold">
        TIẾP TỤC CHỌN PHƯƠNG THỨC THANH TOÁN
      </Button>
    </form>
  );
};
