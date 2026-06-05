import { useMutation, useQuery } from '@tanstack/react-query';
import { Product, ProductVariant } from '@/src/entities/product/model/types';
import { queryClient } from '@/src/shared/lib/react-query';
import { getAuthHeaders } from '@/src/shared/lib/auth-headers';

const BASE_URL = '/api/products';

export interface ProductListFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'popular' | 'newest' | 'price-asc' | 'price-desc';
  page?: number;
  limit?: number;
}

export interface ProductListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: Product[];
  meta: ProductListMeta;
}

export interface ProductUpsertPayload {
  name: string;
  slug: string;
  sku?: string | null;
  description: string;
  costPrice: number;
  price: number;
  promotionalPrice?: number | null;
  images: string[];
  categoryId: string;
  brand?: string | null;
  subcategory?: string | null;
  tags?: string[];
  stock: number;
  initialStock?: number;
  reorderLevel?: number | null;
  variants?: ProductVariant[];
}

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductListFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

const parseJson = async <T>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Không thể tải dữ liệu sản phẩm');
  }
  return (payload?.data ?? payload) as T;
};

export const fetchProducts = async (filters: ProductListFilters = {}): Promise<ProductListResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Không thể tải danh sách sản phẩm');
  }

  const items = (payload.data || []) as Product[];

  return {
    items,
    meta: payload.meta || { total: items.length, page: filters.page || 1, limit: filters.limit || items.length || 20, totalPages: 1 },
  };
};

export const fetchProduct = async (id: string): Promise<Product> => {
  const response = await fetch(`${BASE_URL}/${id}`);
  return parseJson<Product>(response);
};

export const useProducts = (filters: ProductListFilters = {}) =>
  useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
  });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });

export const createProduct = async (data: ProductUpsertPayload) => {
  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }, 'admin'),
    body: JSON.stringify(data),
  });

  return parseJson<Product>(response);
};

export const updateProduct = async ({ id, data }: { id: string; data: Partial<ProductUpsertPayload> }) => {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }, 'admin'),
    body: JSON.stringify(data),
  });

  return parseJson<Product>(response);
};

export const deleteProduct = async (id: string) => {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders({}, 'admin'),
  });

  return parseJson<null>(response);
};

export const useCreateProduct = () =>
  useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });

export const useUpdateProduct = () =>
  useMutation({
    mutationFn: updateProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });

export const useDeleteProduct = () =>
  useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
