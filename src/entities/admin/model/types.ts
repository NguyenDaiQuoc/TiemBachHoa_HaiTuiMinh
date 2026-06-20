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
  membershipPoints?: number;
}

export interface CustomerUpdatePayload {
  name?: string;
  phone?: string | null;
  isActive?: boolean;
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
  products: {
    count: number;
    growth: number;
    lowStockCount: number;
  };
  vouchers: {
    count: number;
    active: number;
  };
  popularProducts: (Product & { orders: number })[];
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    paymentStatus: string;
    status: string;
    createdAt: string;
  }>;
  authLogs: Array<{
    id: string;
    user: string;
    action: string;
    timeLabel: string;
  }>;
  actionLogs: Array<{
    id: string;
    user: string;
    action: string;
    timeLabel: string;
  }>;
}

export interface AdminSettingsPayload {
  storeName: string;
  contactEmail: string;
  hotline: string;
  address: string;
  description: string;
}

export interface VoucherPayload {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherFormPayload {
  code: string;
  title: string;
  description?: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
}

export interface AdminAnalytics {
  timeline: Array<{
    date: string;
    revenue: number;
    sold: number;
    orders: number;
  }>;
  summary: {
    revenue: number;
    soldProducts: number;
    orders: number;
    profit: number;
  };
  bestSellingProducts: Array<{
    id: string;
    name: string;
    soldCount: number;
    revenueEstimate: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    totalOrders: number;
  }>;
}

export interface InventoryReceiptItemPayload {
  productId: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  product?: {
    id: string;
    name: string;
    sku?: string | null;
    images?: string[];
    variantsJson?: unknown[] | null;
  };
}

export interface InventoryReceiptLineInput {
  productId?: string;
  productName?: string;
  categoryId?: string | null;
  sku?: string | null;
  variantId?: string | null;
  variantAttributes?: Record<string, string> | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  quantity: number;
  costPrice: number;
  salePrice: number;
}

export interface InventoryReceiptUpsertPayload {
  mode?: 'RESTOCK' | 'ON_DEMAND';
  supplier?: string | null;
  note?: string | null;
  receivedAt?: string | null;
  items: InventoryReceiptLineInput[];
}

export interface AdminCategoryPayload {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryFormPayload {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
}

export interface SupplierPayload {
  id: string;
  name: string;
  code?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormPayload {
  name: string;
  code?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  isActive: boolean;
}

export interface MarketingCampaignPayload {
  id: string;
  name: string;
  slug: string;
  type: 'FLASH_SALE' | 'DEAL' | 'PROMOTION';
  description?: string | null;
  bannerImage?: string | null;
  productIds?: string[] | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCampaignFormPayload {
  name: string;
  slug: string;
  type: 'FLASH_SALE' | 'DEAL' | 'PROMOTION';
  description?: string | null;
  bannerImage?: string | null;
  productIds?: string[] | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
}

export interface RefinedMarketingPromptPayload {
  prompt: string;
  provider: string;
  model?: string | null;
}

export interface RefineMarketingPromptPayload {
  prompt: string;
  provider?: 'LOCAL' | 'CLAUDE';
  campaignType: 'FLASH_SALE' | 'DEAL' | 'PROMOTION';
  campaignName?: string | null;
  description?: string | null;
  productIds?: string[] | null;
}

export interface GeneratedMarketingImagePayload {
  id: string;
  userId?: string | null;
  prompt: string;
  finalPrompt: string;
  campaignType: 'FLASH_SALE' | 'DEAL' | 'PROMOTION';
  imageUrl: string;
  imagePath: string;
  status: 'COMPLETED' | string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface GenerateMarketingImagePayload {
  prompt: string;
  campaignType: 'FLASH_SALE' | 'DEAL' | 'PROMOTION';
  campaignName?: string | null;
  description?: string | null;
  productIds?: string[] | null;
}

export interface InventoryReceiptPayload {
  id: string;
  code: string;
  mode: 'RESTOCK' | 'NEW_PRODUCT' | 'ON_DEMAND';
  supplier?: string | null;
  note?: string | null;
  createdAt: string;
  items: InventoryReceiptItemPayload[];
}

export interface SupportInboxItem {
  id: string;
  channel: 'HUMAN';
  status: string;
  workflowStatus: {
    code: 'PENDING' | 'RECEIVED' | 'IN_PROGRESS' | 'READ';
    label: string;
    tone: 'warning' | 'info' | 'primary' | 'success';
  };
  assignedAdminId?: string | null;
  unreadForAdmin: number;
  unreadForUser: number;
  lastMessageAt: string;
  createdAt: string;
  customer: {
    id: string;
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
  lastMessage?: {
    id: string;
    sender: 'USER' | 'ADMIN' | 'SYSTEM';
    content: string;
    createdAt: string;
  } | null;
}

export interface SupportInboxMessage {
  id: string;
  sender: 'USER' | 'ADMIN' | 'SYSTEM';
  content: string;
  createdAt: string;
  userId?: string | null;
}

export interface SupportInboxConversation extends SupportInboxItem {
  messages: SupportInboxMessage[];
}

