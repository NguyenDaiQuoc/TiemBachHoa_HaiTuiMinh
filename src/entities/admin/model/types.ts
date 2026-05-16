import { Product } from '@/src/entities/product/model/types';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'PARTIAL' | 'FAILED' | 'REFUNDED';
export type ShippingMethod = 'STANDARD' | 'EXPRESS' | 'LOCAL_PICKUP';

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingMethod: ShippingMethod;
  createdAt: string;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    phone: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  avatar?: string;
}

export interface AdminStats {
  revenue: {
    total: number;
    growth: number;
    chart: { date: string; amount: number }[];
  };
  orders: {
    count: number;
    growth: number;
    pending: number;
  };
  customers: {
    count: number;
    growth: number;
  };
  popularProducts: (Product & { orders: number })[];
}
