import { Order, OrderStatus, PaymentStatus } from '@/src/entities/order/model/types';
import { PaymentMethod } from '@/src/entities/payment/model/types';
import { generateTransferContent } from '@/src/entities/order/lib/order-utils';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, Copy, ExternalLink, ArrowRight, RefreshCw, TimerReset, XCircle } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';
import { useCheckoutStore } from '../model/checkout-store';
import { useCartStore } from '@/src/entities/cart/model/store';

interface PaymentVerificationProps {
  order: Order;
}

const PAYMENT_WINDOW_SECONDS = 10 * 60;

const readViteEnv = (key: string) => {
  const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
  return meta.env?.[key] || '';
};

const bankTransferConfig = {
  bankName: readViteEnv('VITE_BANK_NAME') || 'MBBANK',
  bankCode: readViteEnv('VITE_BANK_CODE') || 'MB',
  accountNumber: readViteEnv('VITE_BANK_ACCOUNT_NUMBER') || '0931454176',
  accountHolder: readViteEnv('VITE_BANK_ACCOUNT_HOLDER') || 'NGUYENDAIQUOC',
};

const buildVietQrImageUrl = (bankCode: string, accountNumber: string, accountHolder: string, amount: number, content: string) => {
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: content,
    accountName: accountHolder,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNumber)}-compact2.png?${params.toString()}`;
};

const isPaidStatus = (value?: string) => value === 'PAID' || value === PaymentStatus.SUCCESS;

export const PaymentVerification = ({ order }: PaymentVerificationProps) => {
  const [status, setStatus] = useState<PaymentStatus>(
    isPaidStatus(order.paymentStatus) ? PaymentStatus.SUCCESS : PaymentStatus.PENDING
  );
  const [countdown, setCountdown] = useState(PAYMENT_WINDOW_SECONDS);
  const [isChecking, setIsChecking] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { updateOrderStatus } = useCheckoutStore();
  const restoreItems = useCartStore((state) => state.restoreItems);

  const trackingCode = order.trackingId || order.orderNumber || order.id;
  const requiresPaymentConfirmation = order.paymentMethod === PaymentMethod.BANK_TRANSFER;
  const bankName = bankTransferConfig.bankName || bankTransferConfig.bankCode || 'Chưa cấu hình ngân hàng';
  const accountNumber = bankTransferConfig.accountNumber || 'Chưa cấu hình số tài khoản';
  const accountHolder = bankTransferConfig.accountHolder || 'Chưa cấu hình chủ tài khoản';
  const transferContent = useMemo(
    () => generateTransferContent(order.orderNumber || order.id, order.shippingInfo.fullName),
    [order.id, order.orderNumber, order.shippingInfo.fullName]
  );
  const hasBankConfig = Boolean(bankTransferConfig.bankCode && bankTransferConfig.accountNumber && bankTransferConfig.accountHolder);
  const bankQrImageUrl = hasBankConfig
    ? buildVietQrImageUrl(bankTransferConfig.bankCode, bankTransferConfig.accountNumber, bankTransferConfig.accountHolder, order.totalAmount, transferContent)
    : '';

  const checkPaymentStatus = useCallback(
    async (isSilent = false) => {
      if (!trackingCode) return;
      if (!isSilent) setIsChecking(true);

      try {
        const response = await fetch(`/api/orders/track?code=${encodeURIComponent(trackingCode)}`);
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || payload?.message || 'Không thể kiểm tra thanh toán');
        }

        const nextPaymentStatus = payload.data?.order?.paymentStatus;
        if (isPaidStatus(nextPaymentStatus)) {
          setStatus(PaymentStatus.SUCCESS);
          updateOrderStatus(OrderStatus.PAID, PaymentStatus.SUCCESS);
          toast.success('Thanh toán đã được xác nhận!', {
            description: `Đơn hàng ${trackingCode} đã được cập nhật từ hệ thống.`,
          });
          return;
        }

        if (!isSilent) {
          toast.info('Chưa nhận được xác nhận thanh toán', {
            description: 'Nếu bạn vừa chuyển khoản, vui lòng chờ hệ thống hoặc admin xác nhận thêm một chút.',
          });
        }
      } catch (error) {
        if (!isSilent) toast.error(error instanceof Error ? error.message : 'Không thể kiểm tra thanh toán');
      } finally {
        if (!isSilent) setIsChecking(false);
      }
    },
    [trackingCode, updateOrderStatus]
  );

  const expireOrder = useCallback(async () => {
    if (!trackingCode || isExpiring) return;
    setIsExpiring(true);

    try {
      const response = await fetch('/api/orders/expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, trackingId: trackingCode }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || payload?.message || 'Không thể hủy đơn quá hạn');
      }

      const restoredItems = Array.isArray(payload.data?.restoredItems) ? payload.data.restoredItems : [];
      if (restoredItems.length) restoreItems(restoredItems);
      setStatus(PaymentStatus.FAILED);
      updateOrderStatus(OrderStatus.CANCELLED, PaymentStatus.FAILED);
      toast.info('Don thanh toan da het han', {
        description: restoredItems.length ? 'Sản phẩm đã được hoàn tồn kho và đưa lại vào giỏ hàng.' : 'Đơn hàng đã được hủy tự động.',
      });
    } catch (error) {
      setStatus(PaymentStatus.FAILED);
      toast.error(error instanceof Error ? error.message : 'Không thể hủy đơn quá hạn');
    } finally {
      setIsExpiring(false);
    }
  }, [isExpiring, order.id, order.orderNumber, restoreItems, trackingCode, updateOrderStatus]);

  const cancelPayment = useCallback(async () => {
    if (!trackingCode || isCancelling) return;
    setIsCancelling(true);

    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, trackingId: trackingCode }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || payload?.message || 'Không thể hủy thanh toán');
      }

      const restoredItems = Array.isArray(payload.data?.restoredItems) ? payload.data.restoredItems : [];
      if (restoredItems.length) restoreItems(restoredItems);
      updateOrderStatus(OrderStatus.CANCELLED, PaymentStatus.FAILED);
      toast.info('Đã hủy thanh toán', {
        description: 'Sản phẩm đã được đưa lại vào giỏ hàng. Tồn kho không bị trừ khi đơn chưa xác nhận thanh toán.',
      });
      window.location.href = '/checkout';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể hủy thanh toán');
    } finally {
      setIsCancelling(false);
    }
  }, [isCancelling, order.id, order.orderNumber, restoreItems, trackingCode, updateOrderStatus]);

  useEffect(() => {
    if (!requiresPaymentConfirmation || status === PaymentStatus.SUCCESS || status === PaymentStatus.FAILED) return;

    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void expireOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expireOrder, requiresPaymentConfirmation, status]);

  useEffect(() => {
    if (!requiresPaymentConfirmation || status !== PaymentStatus.PENDING) return;
    const poller = window.setInterval(() => checkPaymentStatus(true), 30000);
    return () => window.clearInterval(poller);
  }, [checkPaymentStatus, requiresPaymentConfirmation, status]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}`);
  };

  if (status === PaymentStatus.SUCCESS) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 bg-primary/5 rounded-3xl border-2 border-primary/20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/30"
        >
          <Check className="h-10 w-10 stroke-[3px]" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black font-heading">Thanh toán thành công</h2>
          <p className="text-muted-foreground">
            Cảm ơn bạn đã tin tưởng Tiệm Bách Hoá Hai Tụi Mình. <br />
            Mã đơn hàng của bạn là: <span className="font-bold text-foreground">{trackingCode}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <Button variant="outline" className="rounded-full" onClick={() => (window.location.href = '/')}>Về trang chủ</Button>
          <Button className="rounded-full font-bold group" onClick={() => (window.location.href = `/tracking?code=${encodeURIComponent(trackingCode)}`)}>
            Theo dõi ngay
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = status === PaymentStatus.FAILED;

  return (
    <div className="space-y-8">
      <div className="text-center p-6 bg-muted/30 rounded-3xl border-dashed border-2 border-border">
        <h2 className="text-2xl font-bold font-heading">
          {isExpired ? 'Giao dịch đã hết hạn' : requiresPaymentConfirmation ? 'Đang chờ thanh toán' : 'Đơn hàng đã được ghi nhận'}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {isExpired ? (
            'Vui lòng tạo lại đơn hoặc liên hệ cửa hàng nếu bạn đã chuyển khoản.'
          ) : requiresPaymentConfirmation ? (
            <>
              Giao dịch sẽ hết hạn sau{' '}
              <span className="font-bold text-foreground">
                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </span>
            </>
          ) : (
            'Cửa hàng đã ghi nhận đơn COD và giữ tồn kho cho đơn này.'
          )}
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
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Ngân hàng</p>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <p className="font-bold">{bankName}</p>
                    <Copy className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" onClick={() => copyToClipboard(bankName, 'ngân hàng')} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Số tài khoản</p>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <p className="font-bold">{accountNumber}</p>
                    <Copy className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" onClick={() => copyToClipboard(accountNumber, 'số tài khoản')} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Số tiền</p>
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="font-black text-primary text-lg">
                      {order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </p>
                    <Copy className="h-4 w-4 text-primary cursor-pointer" onClick={() => copyToClipboard(String(order.totalAmount), 'số tiền')} />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Nội dung chuyển khoản</p>
                  <div className="flex items-center justify-between p-3 bg-warning/5 rounded-xl border border-warning/10">
                    <p className="font-bold text-warning-foreground font-mono break-all">{transferContent}</p>
                    <Copy className="h-4 w-4 text-warning-foreground cursor-pointer shrink-0" onClick={() => copyToClipboard(transferContent, 'nội dung')} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-surface-default rounded-3xl shadow-soft border-4 border-border/10">
                {hasBankConfig ? (
                  <img src={bankQrImageUrl} alt="Mã VietQR chuyển khoản" className="h-[240px] w-[240px] rounded-2xl bg-white object-contain" />
                ) : (
                  <div className="flex h-[240px] w-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 p-5 text-center">
                    <p className="text-sm font-black text-destructive">Chưa cấu hình VietQR</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Cần thêm VITE_BANK_CODE, VITE_BANK_ACCOUNT_NUMBER và VITE_BANK_ACCOUNT_HOLDER trên Vercel.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                  {isExpired ? <TimerReset className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                  {isExpired ? 'Đã dừng chờ xác nhận' : 'Đang chờ xác nhận từ hệ thống'}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => checkPaymentStatus()} disabled={isChecking || isExpired}>
                    {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Kiểm tra thanh toán
                  </Button>
                  <Button type="button" variant="ghost" className="rounded-full text-destructive hover:text-destructive" onClick={cancelPayment} disabled={isCancelling || isExpired}>
                    {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Hủy thanh toán
                  </Button>
                </div>
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
              <h3 className="text-xl font-bold font-heading">Đơn hàng đã được ghi nhận</h3>
              <p className="text-sm text-muted-foreground">
                Phương thức {order.paymentMethod} đang chờ hệ thống thanh toán thật hoặc admin xác nhận.
              </p>
            </div>
            <Button type="button" variant="outline" className="rounded-full px-8 h-12" onClick={() => checkPaymentStatus()} disabled={isChecking}>
              {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Kiểm tra trạng thái
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 bg-info/5 border border-info/10 rounded-2xl flex gap-4 items-start text-xs text-info-foreground leading-relaxed">
        <Check className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Hệ thống chỉ báo thành công khi đơn hàng được xác nhận thanh toán trong dữ liệu thật. Nếu quá 15 phút chưa thấy xác nhận,
          vui lòng liên hệ hotline <strong>0931.454.176</strong> để được hỗ trợ nhanh nhất.
        </p>
      </div>
    </div>
  );
};
