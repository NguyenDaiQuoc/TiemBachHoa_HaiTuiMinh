import type { Product } from '../model/types';

export const getProductUrlKey = (product: Pick<Product, 'id' | 'slug'>) => encodeURIComponent(product.slug || product.id);

export const getProductUrl = (product: Pick<Product, 'id' | 'slug'>) => `/product/${getProductUrlKey(product)}`;
