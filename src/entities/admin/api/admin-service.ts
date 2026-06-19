import {
  AdminAnalytics,
  AdminCategoryFormPayload,
  AdminCategoryPayload,
  AdminSettingsPayload,
  AdminStats,
  Customer,
  CustomerUpdatePayload,
  GeneratedMarketingImagePayload,
  GenerateMarketingImagePayload,
  InventoryReceiptPayload,
  InventoryReceiptUpsertPayload,
  MarketingCampaignFormPayload,
  MarketingCampaignPayload,
  RefinedMarketingPromptPayload,
  RefineMarketingPromptPayload,
  SupportInboxConversation,
  SupportInboxItem,
  SupplierFormPayload,
  SupplierPayload,
  VoucherFormPayload,
  VoucherPayload,
} from '../model/types';
import { getAuthHeaders } from '@/src/shared/lib/auth-headers';

const getAdminHeaders = (headers: HeadersInit = {}) => getAuthHeaders(headers, 'admin');
const parsePayload = async <T>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || payload?.message || 'Không thể tải dữ liệu quản trị');
  }

  return payload.data as T;
};

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const response = await fetch('/api/admin/stats', { headers: getAdminHeaders() });
    return parsePayload<AdminStats>(response);
  },

  getAnalytics: async (period: '7d' | '30d' | '365d' = '7d'): Promise<AdminAnalytics> => {
    const response = await fetch(`/api/admin/analytics?period=${period}`, { headers: getAdminHeaders() });
    return parsePayload<AdminAnalytics>(response);
  },

  getCustomers: async (): Promise<Customer[]> => {
    const response = await fetch('/api/admin/customers', { headers: getAdminHeaders() });
    return parsePayload<Customer[]>(response);
  },

  updateCustomer: async (id: string, data: CustomerUpdatePayload): Promise<Customer> => {
    const response = await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return parsePayload<Customer>(response);
  },

  getSettings: async (): Promise<AdminSettingsPayload> => {
    const response = await fetch('/api/admin/settings', { headers: getAdminHeaders() });
    return parsePayload<AdminSettingsPayload>(response);
  },

  updateSettings: async (data: AdminSettingsPayload): Promise<AdminSettingsPayload> => {
    const response = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return parsePayload<AdminSettingsPayload>(response);
  },

  getVouchers: async (): Promise<VoucherPayload[]> => {
    const response = await fetch('/api/admin/vouchers', { headers: getAdminHeaders() });
    return parsePayload<VoucherPayload[]>(response);
  },

  getCategories: async (): Promise<AdminCategoryPayload[]> => {
    const response = await fetch('/api/admin/categories', { headers: getAdminHeaders() });
    return parsePayload<AdminCategoryPayload[]>(response);
  },

  createCategory: async (data: AdminCategoryFormPayload): Promise<AdminCategoryPayload> => {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<AdminCategoryPayload>(response);
    return payload;
  },

  updateCategory: async (id: string, data: Partial<AdminCategoryFormPayload>): Promise<AdminCategoryPayload> => {
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<AdminCategoryPayload>(response);
    return payload;
  },

  deleteCategory: async (id: string): Promise<null> => {
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    const payload = await parsePayload<null>(response);
    return payload;
  },

  getSuppliers: async (): Promise<SupplierPayload[]> => {
    const response = await fetch('/api/admin/suppliers', { headers: getAdminHeaders() });
    return parsePayload<SupplierPayload[]>(response);
  },

  createSupplier: async (data: SupplierFormPayload): Promise<SupplierPayload> => {
    const response = await fetch('/api/admin/suppliers', {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<SupplierPayload>(response);
    return payload;
  },

  updateSupplier: async (id: string, data: Partial<SupplierFormPayload>): Promise<SupplierPayload> => {
    const response = await fetch(`/api/admin/suppliers/${id}`, {
      method: 'PATCH',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<SupplierPayload>(response);
    return payload;
  },

  deleteSupplier: async (id: string): Promise<null> => {
    const response = await fetch(`/api/admin/suppliers/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    const payload = await parsePayload<null>(response);
    return payload;
  },

  getMarketingCampaigns: async (): Promise<MarketingCampaignPayload[]> => {
    const response = await fetch('/api/admin/marketing/campaigns', { headers: getAdminHeaders() });
    return parsePayload<MarketingCampaignPayload[]>(response);
  },

  createMarketingCampaign: async (data: MarketingCampaignFormPayload): Promise<MarketingCampaignPayload> => {
    const response = await fetch('/api/admin/marketing/campaigns', {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<MarketingCampaignPayload>(response);
    return payload;
  },

  updateMarketingCampaign: async (id: string, data: Partial<MarketingCampaignFormPayload>): Promise<MarketingCampaignPayload> => {
    const response = await fetch(`/api/admin/marketing/campaigns/${id}`, {
      method: 'PATCH',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<MarketingCampaignPayload>(response);
    return payload;
  },

  deleteMarketingCampaign: async (id: string): Promise<null> => {
    const response = await fetch(`/api/admin/marketing/campaigns/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    const payload = await parsePayload<null>(response);
    return payload;
  },

  refineMarketingPrompt: async (data: RefineMarketingPromptPayload): Promise<RefinedMarketingPromptPayload> => {
    const response = await fetch('/api/admin/marketing/prompts/refine', {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<RefinedMarketingPromptPayload>(response);
    return payload;
  },

  generateMarketingImage: async (data: GenerateMarketingImagePayload): Promise<GeneratedMarketingImagePayload> => {
    const response = await fetch('/api/admin/marketing/images/generate', {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<GeneratedMarketingImagePayload>(response);
    return payload;
  },

  createVoucher: async (data: VoucherFormPayload): Promise<VoucherPayload> => {
    const response = await fetch('/api/admin/vouchers', {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<VoucherPayload>(response);
    return payload;
  },

  updateVoucher: async (id: string, data: Partial<VoucherFormPayload>): Promise<VoucherPayload> => {
    const response = await fetch(`/api/admin/vouchers/${id}`, {
      method: 'PATCH',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<VoucherPayload>(response);
    return payload;
  },

  createInventoryReceipt: async (data: InventoryReceiptUpsertPayload): Promise<InventoryReceiptPayload> => {
    const response = await fetch('/api/admin/inventory/receipts', {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<InventoryReceiptPayload>(response);
    return payload;
  },

  updateInventoryReceipt: async (id: string, data: InventoryReceiptUpsertPayload): Promise<InventoryReceiptPayload> => {
    const response = await fetch(`/api/admin/inventory/receipts/${id}`, {
      method: 'PATCH',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    const payload = await parsePayload<InventoryReceiptPayload>(response);
    return payload;
  },

  deleteInventoryReceipt: async (id: string): Promise<null> => {
    const response = await fetch(`/api/admin/inventory/receipts/${id}`, {
      method: 'DELETE',
      headers: getAdminHeaders(),
    });
    const payload = await parsePayload<null>(response);
    return payload;
  },

  receiveInventory: async (data: InventoryReceiptUpsertPayload): Promise<InventoryReceiptPayload> => {
    return adminService.createInventoryReceipt(data);
  },

  getInventoryReceipts: async (): Promise<InventoryReceiptPayload[]> => {
    const response = await fetch('/api/admin/inventory/receipts', { headers: getAdminHeaders() });
    return parsePayload<InventoryReceiptPayload[]>(response);
  },

  getSupportConversations: async (): Promise<SupportInboxItem[]> => {
    const response = await fetch('/api/admin/support/conversations', { headers: getAdminHeaders() });
    return parsePayload<SupportInboxItem[]>(response);
  },

  getSupportConversation: async (id: string): Promise<SupportInboxConversation> => {
    const response = await fetch(`/api/admin/support/conversations/${id}`, { headers: getAdminHeaders() });
    return parsePayload<SupportInboxConversation>(response);
  },

  sendSupportReply: async (id: string, message: string): Promise<{ id: string }> => {
    const response = await fetch(`/api/admin/support/conversations/${id}/messages`, {
      method: 'POST',
      headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message }),
    });
    return parsePayload<{ id: string }>(response);
  },
};



