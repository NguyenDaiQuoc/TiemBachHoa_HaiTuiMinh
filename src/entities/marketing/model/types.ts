import type { Product } from '@/src/entities/product/model/types';

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  type: 'FLASH_SALE' | 'DEAL' | 'PROMOTION' | string;
  description?: string | null;
  bannerImage?: string | null;
  productIds?: string[] | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDetailResponse {
  campaign: Campaign;
  products: Product[];
}
