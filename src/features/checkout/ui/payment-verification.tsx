
import { Order, OrderStatus, PaymentStatus } from '@/src/entities/order/model/types';
import { PaymentMethod } from '@/src/entities/payment/model/types';
import { generateTransferContent } from '@/src/entities/order/lib/order-utils';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';
import { useCheckoutStore } from '../model/checkout-store';
import { useCartStore } from '@/src/entities/cart/model/store';

interface PaymentVerificationProps {
  order: Order;
}

export const PaymentVerification = ({ order }: PaymentVerificationProps) => {
  const [status, setStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const { updateOrderStatus, resetCheckout } = useCheckoutStore();
  const { clearCart } = useCartStore();
  const [countdown, setCountdown] = useState(600); // 10 minutes

  const transferContent = generateTransferContent(order.id, order.shippingInfo.fullName);

  useEffect(() => {
    // Simulate polling for payment confirmation
    const timer = setTimeout(() => {
      setStatus(PaymentStatus.SUCCESS);
      updateOrderStatus(OrderStatus.PAID, PaymentStatus.SUCCESS);
      clearCart();
      toast.success('Thanh toán thành công!', {
        description: `Đơn hàng ${order.id} đã được xác nhận.`,
      });
    }, 10000); // Confirm after 10s for demo

    const countdownTimer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [order.id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  if (status === PaymentStatus.SUCCESS) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 bg-primary/5 rounded-3xl border-2 border-primary/20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/30"
        >
          <Check className="h-10 w-10 stroke-[3px]" />
        </motion.div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black font-heading">THANH TOÁN THÀNH CÔNG!</h2>
          <p className="text-muted-foreground">
            Cảm ơn bạn đã tin tưởng Tiệm Bách Hoá Hai Tụi Mình. <br/>
            Mã đơn hàng của bạn là: <span className="font-bold text-foreground">{order.id}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <Button variant="outline" className="rounded-full" onClick={() => window.location.href = '/'}>
            VỀ TRANG CHỦ
          </Button>
          <Button className="rounded-full font-bold group" onClick={() => window.location.href = '/tracking'}>
             THEO DÕI NGAY
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center p-6 bg-muted/30 rounded-3xl border-dashed border-2 border-border">
        <h2 className="text-2xl font-bold font-heading">Đang chờ thanh toán</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Giao dịch sẽ hết hạn sau <span className="font-bold text-foreground">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        {order.paymentMethod === PaymentMethod.BANK_TRANSFER ? (
          <motion.div
            key="bank"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">NGÂN HÀNG</p>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <p className="font-bold">Vietcombank (VCB)</p>
                    <Copy className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" onClick={() => copyToClipboard('Vietcombank', 'Ngân hàng')} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">SỐ TÀI KHOẢN</p>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <p className="font-bold">1234567890</p>
                    <Copy className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" onClick={() => copyToClipboard('1234567890', 'Số tài khoản')} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">SỐ TIỀN</p>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="font-black text-primary text-lg">
                      {order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </p>
                    <Copy className="h-4 w-4 text-primary cursor-pointer" onClick={() => copyToClipboard(order.totalAmount.toString(), 'Số tiền')} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">NỘI DUNG CHUYỂN KHOẢN</p>
                  <div className="flex items-center justify-between p-3 bg-warning/5 rounded-xl border border-warning/10">
                    <p className="font-bold text-warning-foreground font-mono">{transferContent}</p>
                    <Copy className="h-4 w-4 text-warning-foreground cursor-pointer" onClick={() => copyToClipboard(transferContent, 'Nội dung')} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-surface-default rounded-3xl shadow-soft border-4 border-border/10">
                <QRCodeSVG 
                  value={`00020101021138580010A00000072701280006970403011412345678900208QRIBFTTA53037045408${order.totalAmount}5802VN62240820${transferContent}6304`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang chờ xác nhận từ hệ thống...
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="wallet"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center space-y-6 p-8 bg-muted/30 rounded-3xl"
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <ExternalLink className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold font-heading">Chuyển hướng đến cổng thanh toán</h3>
              <p className="text-sm text-muted-foreground">
                Vui lòng nhấn nút bên dưới để tiếp tục thanh toán qua {order.paymentMethod}
              </p>
            </div>
            <Button className="rounded-full px-8 h-12">
              THANH TOÁN NGAY
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Chờ bạn hoàn tất thanh toán...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 bg-info/5 border border-info/10 rounded-2xl flex gap-4 items-start text-xs text-info-foreground leading-relaxed">
        <Check className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Hệ thống sẽ tự động xác nhận sau khi chúng tôi nhận được tiền (từ 1-5 phút). 
          Nếu quá 15 phút chưa thấy xác nhận, vui lòng liên hệ hotline <strong>0123.456.789</strong> để được hỗ trợ nhanh nhất.
        </p>
      </div>
    </div>
  );
};
