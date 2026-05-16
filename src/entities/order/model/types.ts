
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  PACKING = 'PACKING',
  SHIPPING = 'SHIPPING',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  note?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string; // 8-character alphanumeric
  items: OrderItem[];
  totalAmount: number;
  shippingInfo: ShippingInfo;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingMethodId?: string;
  shippingFee: number;
  estimatedArrival?: string;
  trackingId?: string;
  createdAt: string;
  updatedAt: string;
}
