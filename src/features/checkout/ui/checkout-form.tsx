import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/src/shared/ui/form-field';
import { Button } from '@/src/shared/ui/button';
import { useCheckoutStore } from '../model/checkout-store';

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

  const onSubmit = (data: CheckoutFormValues) => {
    setShippingInfo(data);
    onSuccess();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-heading">Thông tin giao hàng</h3>
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
      </div>
      
      <Button type="submit" className="w-full h-12 rounded-full font-bold">
        TIẾP TỤC CHỌN PHƯƠNG THỨC THANH TOÁN
      </Button>
    </form>
  );
};
