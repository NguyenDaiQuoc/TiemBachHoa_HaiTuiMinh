import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Product } from '../model/types';
import { productService } from './product-service';

const makeResponse = (body: unknown, ok = true) =>
  ({
    ok,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

const products: Product[] = [
  {
    id: 'p-1',
    name: 'Tai nghe Bluetooth FitGo',
    slug: 'tai-nghe-bluetooth-fitgo',
    price: 120000,
    description: 'FitGo headset',
    image: 'https://example.com/p-1.jpg',
    images: ['https://example.com/p-1.jpg'],
    categoryId: 'cat-tech',
    category: 'Công nghệ',
    stock: 4,
    soldCount: 2,
    isActive: true,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'p-2',
    name: 'Chuột không dây Baseus',
    slug: 'chuot-khong-day-baseus',
    price: 90000,
    description: 'Baseus mouse',
    image: 'https://example.com/p-2.jpg',
    images: ['https://example.com/p-2.jpg'],
    categoryId: 'cat-tech',
    category: 'Công nghệ',
    stock: 6,
    soldCount: 1,
    isActive: true,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
];

describe('product service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns product detail data and nulls failed detail responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse({ data: products[0] }));
    await expect(productService.getProductById('tai-nghe-bluetooth-fitgo')).resolves.toEqual(products[0]);
    expect(fetch).toHaveBeenCalledWith('/api/products/tai-nghe-bluetooth-fitgo');

    vi.mocked(fetch).mockResolvedValueOnce(makeResponse({ message: 'missing' }, false));
    await expect(productService.getProductById('missing-product')).resolves.toBeNull();
  });

  it('limits search results and encodes the query', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse({ data: products }));

    await expect(productService.searchProducts('Tai nghe FitGo', 1)).resolves.toEqual([products[0]]);
    expect(fetch).toHaveBeenCalledWith('/api/products?query=Tai%20nghe%20FitGo&limit=1');
  });

  it('returns empty arrays for malformed list payloads instead of throwing', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeResponse({ data: null }))
      .mockResolvedValueOnce(makeResponse({ data: { id: 'not-an-array' } }))
      .mockResolvedValueOnce(makeResponse({ data: 'invalid' }));

    await expect(productService.getRelatedProducts('cat-tech')).resolves.toEqual([]);
    await expect(productService.searchProducts('FitGo')).resolves.toEqual([]);
    await expect(productService.getFilteredProducts({ category: 'cat-tech' })).resolves.toEqual([]);
  });

  it('builds filtered product query params from defined values', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse({ data: products }));

    await productService.getFilteredProducts({
      query: 'FitGo',
      category: 'cat-tech',
      minPrice: 50000,
      maxPrice: 150000,
      minRating: 4,
      sortBy: 'price-asc',
      page: 2,
      limit: 12,
    });

    expect(fetch).toHaveBeenCalledWith('/api/products?query=FitGo&category=cat-tech&minPrice=50000&maxPrice=150000&minRating=4&sortBy=price-asc&page=2&limit=12');
  });
});
