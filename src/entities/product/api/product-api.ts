import { useMutation, useQuery } from '@tanstack/react-query';
import { Product, ProductVariant } from '@/src/entities/product/model/types';
import { queryClient } from '@/src/shared/lib/react-query';
import { getAuthHeaders } from '@/src/shared/lib/auth-headers';

const BASE_URL = '/api/products';

export interface ProductListFilters {
  query?: string;
  category?: string;
  brand?: string;
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

export interface ProductBrand {
  name: string;
  count: number;
}

export interface ProductFacetChild {
  name: string;
  count: number;
}

export interface ProductCategoryFacet {
  id: string;
  name: string;
  slug: string;
  count: number;
  children: ProductFacetChild[];
}

export interface ProductFacetsResponse {
  categories: ProductCategoryFacet[];
  brands: ProductBrand[];
  total: number;
}

export const fetchBrands = async (category?: string): Promise<ProductBrand[]> => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);

  const response = await fetch(`${BASE_URL}/brands?${params.toString()}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Không thể tải danh sách thương hiệu');
  }

  return (payload.data || []) as ProductBrand[];
};

export const useProductBrands = (category?: string) =>
  useQuery({
    queryKey: [...productKeys.all, 'brands', category || 'all'] as const,
    queryFn: () => fetchBrands(category),
  });

export const fetchProductFacets = async (): Promise<ProductFacetsResponse> => {
  const response = await fetch(`${BASE_URL}/facets`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Không thể tải bộ lọc sản phẩm');
  }

  return (payload.data || { categories: [], brands: [], total: 0 }) as ProductFacetsResponse;
};

export const useProductFacets = () =>
  useQuery({
    queryKey: [...productKeys.all, 'facets'] as const,
    queryFn: fetchProductFacets,
  });
