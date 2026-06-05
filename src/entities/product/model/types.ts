export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  sku?: string;
  costPrice?: number;
  price?: number;
  promotionalPrice?: number;
  stock: number;
  initialStock?: number;
  images?: string[];
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  isVerified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  costPrice?: number;
  price: number;
  promotionalPrice?: number;
  oldPrice?: number;
  description: string;
  longDescription?: string;
  image: string; // Keep for backward compatibility or first image
  images: string[];
  categoryId: string;
  category: Category | string;
  brand?: string | null;
  subcategory?: string | null;
  tags?: string[];
  isNew?: boolean;
  stock: number;
  initialStock?: number;
  reorderLevel?: number;
  soldCount: number;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: {
    type: 'color' | 'size' | 'capacity';
    options: ProductVariant[];
  }[];
  specifications?: ProductSpecification[];
  reviews?: ProductReview[];
  features?: string[];
}
