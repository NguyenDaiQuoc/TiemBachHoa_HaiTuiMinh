import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/shared/model/auth-store';

const BASE_URL = '/api/community';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
};

export interface CommunityReviewMedia {
  type: 'image' | 'video';
  url: string;
}

export interface CommunityReview {
  id: string;
  rating: number;
  content: string;
  media: CommunityReviewMedia[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  sellerResponse?: string | null;
  sellerRespondedAt?: string | null;
  createdAt: string;
  isHelpfulByMe: boolean;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export interface CommunityReviewSummary {
  total: number;
  average: number;
  breakdown: Record<number, number>;
  mediaCount: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface CommunityFeedItem {
  id: string;
  type: 'review';
  createdAt: string;
  review: CommunityReview;
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
  };
  engagement: {
    helpfulCount: number;
    badge: string;
  };
}

export interface TrendingProduct {
  id: string;
  name: string;
  price: number;
  soldCount: number;
  image: string;
  category?: {
    name: string;
  } | string;
}

export interface CommunityShopProfile {
  id: string;
  slug: string;
  name: string;
  description: string;
  followerCount: number;
  following: boolean;
  notificationsEnabled: boolean;
}

export interface CommunityMissionProgress {
  id: string;
  progress: number;
  completedAt?: string | null;
  rewardClaimed: boolean;
  mission: {
    id: string;
    slug: string;
    title: string;
    description: string;
    targetCount: number;
    rewardPoints: number;
    actionType: string;
  };
}

export interface CommunityAchievement {
  id: string;
  unlockedAt: string;
  badge: {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
  };
}

export interface ReferralProfile {
  userId: string;
  code: string;
  referredByCode?: string | null;
  totalInvites: number;
  totalRewards: number;
}

export interface ReferralEvent {
  id: string;
  code: string;
  rewardPoints: number;
  status: string;
  createdAt: string;
}

export type SupportChannel = 'AI' | 'HUMAN';

export interface SupportMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT' | 'ADMIN' | 'SYSTEM';
  content: string;
  createdAt: string;
  userId?: string | null;
}

export interface SupportConversation {
  id: string;
  channel: SupportChannel;
  status: string;
  workflowStatus: {
    code: 'PENDING' | 'RECEIVED' | 'IN_PROGRESS' | 'READ';
    label: string;
    tone: 'warning' | 'info' | 'primary' | 'success';
  };
  assignedAdminId?: string | null;
  lastMessageAt: string;
  messages: SupportMessage[];
}

const authHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseJson = async <T>(response: Response): Promise<ApiEnvelope<T>> => {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || payload?.message || 'Không thể tải dữ liệu cộng đồng');
  }

  return payload;
};

const request = async <T>(path: string, init?: RequestInit) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });

  return parseJson<T>(response);
};

export const communityKeys = {
  all: ['community'] as const,
  shop: () => [...communityKeys.all, 'shop'] as const,
  feed: () => [...communityKeys.all, 'feed'] as const,
  reviews: (productId: string, filters: { sort: string; withMedia: boolean }) =>
    [...communityKeys.all, 'reviews', productId, filters] as const,
  checkIn: () => [...communityKeys.all, 'check-in'] as const,
  referral: () => [...communityKeys.all, 'referral'] as const,
  missions: () => [...communityKeys.all, 'missions'] as const,
  chat: (channel: SupportChannel) => [...communityKeys.all, 'chat', channel] as const,
};

export const useCommunityShop = () =>
  useQuery({
    queryKey: communityKeys.shop(),
    queryFn: async () => (await request<CommunityShopProfile>('/shop')).data,
  });

export const useToggleShopFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => (await request<{ following: boolean; followerCount: number }>('/shop/follow', { method: 'POST' })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.shop() });
    },
  });
};

export const useCommunityFeed = () =>
  useInfiniteQuery({
    queryKey: communityKeys.feed(),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await request<{ items: CommunityFeedItem[]; trendingProducts: TrendingProduct[] }>(
        `/feed?page=${pageParam}&limit=6`
      );

      return {
        data: response.data,
        meta: response.meta,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.meta?.hasMore ? (lastPage.meta?.page || 1) + 1 : undefined),
  });

export const useProductReviews = (productId: string, filters: { sort: string; withMedia: boolean }) =>
  useQuery({
    queryKey: communityKeys.reviews(productId, filters),
    enabled: !!productId,
    queryFn: async () =>
      (
        await request<{ summary: CommunityReviewSummary; reviews: CommunityReview[] }>(
          `/products/${productId}/reviews?sort=${filters.sort}&withMedia=${filters.withMedia}`
        )
      ).data,
  });

export const useCreateProductReview = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { rating: number; content: string; media: CommunityReviewMedia[] }) =>
      (
        await request<CommunityReview>(`/products/${productId}/reviews`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...communityKeys.all, 'reviews', productId] });
    },
  });
};

export const useToggleReviewHelpful = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) =>
      (
        await request<{ helpfulCount: number; liked: boolean }>(`/reviews/${reviewId}/helpful`, {
          method: 'POST',
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...communityKeys.all, 'reviews', productId] });
    },
  });
};

export const trackProductView = async (productId: string) => {
  const sessionId = window.localStorage.getItem('community-session-id') || crypto.randomUUID();
  window.localStorage.setItem('community-session-id', sessionId);

  await request(`/products/${productId}/view`, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
};

export const useCommunityCheckIn = (enabled = true) =>
  useQuery({
    queryKey: communityKeys.checkIn(),
    enabled,
    queryFn: async () =>
      (await request<{ checkedInToday: boolean; streak: number; lastCheckInAt?: string | null }>('/check-in/status')).data,
  });

export const useDoCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => (await request('/check-in', { method: 'POST' })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.checkIn() });
      queryClient.invalidateQueries({ queryKey: communityKeys.missions() });
    },
  });
};

export const useReferral = (enabled = true) =>
  useQuery({
    queryKey: communityKeys.referral(),
    enabled,
    queryFn: async () => (await request<{ profile: ReferralProfile; events: ReferralEvent[] }>('/referral')).data,
  });

export const useClaimReferral = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) =>
      (
        await request<{ claimed: boolean }>('/referral/claim', {
          method: 'POST',
          body: JSON.stringify({ code }),
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.referral() });
    },
  });
};

export const useCommunityMissions = (enabled = true) =>
  useQuery({
    queryKey: communityKeys.missions(),
    enabled,
    queryFn: async () =>
      (await request<{ missions: CommunityMissionProgress[]; achievements: CommunityAchievement[] }>('/missions')).data,
  });

export const useSupportConversation = (channel: SupportChannel, enabled = true) =>
  {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();

    const query = useQuery({
      queryKey: communityKeys.chat(channel),
      enabled,
      queryFn: async () => (await request<SupportConversation>(`/chat?channel=${channel}`)).data,
    });

    useEffect(() => {
      if (!enabled || !token) return;

      const stream = new EventSource(`${BASE_URL}/chat/stream?token=${encodeURIComponent(token)}`);
      const handleSupport = (event: Event) => {
        const payload = JSON.parse((event as MessageEvent).data || '{}') as { channel?: SupportChannel };
        if (payload.channel && payload.channel !== channel) return;
        queryClient.invalidateQueries({ queryKey: communityKeys.chat(channel) });
      };

      const handleError = () => {
        stream.close();
      };

      stream.addEventListener('support', handleSupport);
      stream.onerror = handleError;

      return () => {
        stream.removeEventListener('support', handleSupport);
        stream.onerror = null;
        stream.close();
      };
    }, [channel, enabled, queryClient, token]);

    return query;
  };

export const useSendSupportMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channel, message }: { channel: SupportChannel; message: string }) =>
      (
        await request<{ userMessage: SupportMessage; assistantMessage: SupportMessage | null }>('/chat', {
          method: 'POST',
          body: JSON.stringify({ channel, message }),
        })
      ).data,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.chat(variables.channel) });
    },
  });
};
