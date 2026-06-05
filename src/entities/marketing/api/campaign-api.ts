import { useQuery } from '@tanstack/react-query';
import type { CampaignDetailResponse } from '@/src/entities/marketing/model/types';

const BASE_URL = '/api/campaigns';

export const campaignKeys = {
  all: ['campaigns'] as const,
  detail: (slug: string) => [...campaignKeys.all, 'detail', slug] as const,
};

export const fetchCampaign = async (slug: string): Promise<CampaignDetailResponse> => {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(slug)}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Không thể tải chiến dịch');
  }

  return payload?.data as CampaignDetailResponse;
};

export const useCampaign = (slug: string) =>
  useQuery({
    queryKey: campaignKeys.detail(slug),
    queryFn: () => fetchCampaign(slug),
    enabled: Boolean(slug),
    retry: false,
  });
