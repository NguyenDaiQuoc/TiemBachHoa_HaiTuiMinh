
export enum PaymentMethod {
  ZALOPAY = 'ZALOPAY',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  BANK_TRANSFER = 'BANK_TRANSFER',
  COD = 'COD',
}

export interface PaymentProvider {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
}

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: PaymentMethod.BANK_TRANSFER,
    name: 'Chuyển khoản ngân hàng (QR)',
    icon: 'University',
    description: 'Chuyển khoản qua mã QR động (VietQR)',
  },
  {
    id: PaymentMethod.MOMO,
    name: 'Ví MoMo',
    icon: 'Wallet',
    description: 'Thanh toán qua ứng dụng MoMo',
  },
  {
    id: PaymentMethod.ZALOPAY,
    name: 'ZaloPay',
    icon: 'Zap',
    description: 'Thanh toán qua ứng dụng ZaloPay',
  },
  {
    id: PaymentMethod.VNPAY,
    name: 'VNPAY',
    icon: 'CreditCard',
    description: 'Thanh toán qua cổng VNPAY-QR',
  },
  {
    id: PaymentMethod.COD,
    name: 'Thanh toán khi nhận hàng (COD)',
    icon: 'Truck',
    description: 'Giao hàng và thu tiền tận nơi',
  },
];
