import { Product } from '../model/types';

const parsePayload = async (response: Response) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Không thể tải sản phẩm');
  }
  return payload;
};

export const productService = {
  getProductById: async (id: string): Promise<Product | null> => {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) return null;
    const payload = await parsePayload(response);
    return payload?.data || null;
  },

  getRelatedProducts: async (categoryId: string): Promise<Product[]> => {
    const response = await fetch(`/api/products?category=${categoryId}`);
    if (!response.ok) return [];
    const payload = await parsePayload(response);
    return Array.isArray(payload?.data) ? payload.data : [];
  },

  searchProducts: async (query: string, limit = 5): Promise<Product[]> => {
    const response = await fetch(`/api/products?query=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) return [];
    const payload = await parsePayload(response);
    return Array.isArray(payload?.data) ? payload.data.slice(0, limit) : [];
  },

  getFilteredProducts: async (params: {
    query?: string;
    category?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    minRating?: number | null;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<Product[]> => {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.category) searchParams.append('category', params.category);
    if (params.minPrice) searchParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
    if (params.minRating) searchParams.append('minRating', params.minRating.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/products?${searchParams.toString()}`);
    if (!response.ok) return [];
    const payload = await parsePayload(response);
    return Array.isArray(payload?.data) ? payload.data : [];
  },
};
