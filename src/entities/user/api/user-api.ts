import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/shared/model/auth-store';

const API_BASE = '/api/user';

export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  addresses: () => [...userKeys.all, 'addresses'] as const,
  points: () => [...userKeys.all, 'points'] as const,
  transactions: () => [...userKeys.all, 'transactions'] as const,
  notificationSettings: () => [...userKeys.all, 'notifications'] as const,
  vouchers: () => [...userKeys.all, 'vouchers'] as const,
};

const parseApiResponse = async (response: Response, fallbackMessage: string) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || payload.message || fallbackMessage);
  }

  return payload.data ?? payload;
};

export const getProfile = async (token: string) => {
  const response = await fetch(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseApiResponse(response, 'Không thể tải hồ sơ người dùng');
};

export const updateProfile = async ({
  token,
  data,
}: {
  token: string;
  data: Record<string, unknown>;
}) => {
  const response = await fetch(`${API_BASE}/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseApiResponse(response, 'Không thể cập nhật thông tin cá nhân');
};

export const changePassword = async ({ token, data }: { token: string; data: any }) => {
  const response = await fetch(`${API_BASE}/profile/password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseApiResponse(response, 'Không thể đổi mật khẩu');
};

export const updateAvatar = async ({ token, avatar }: { token: string; avatar: string }) => {
  const response = await fetch(`${API_BASE}/profile/avatar`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ avatar }),
  });

  return parseApiResponse(response, 'Không thể cập nhật ảnh đại diện');
};

export const getAddresses = async (token: string) => {
  const response = await fetch(`${API_BASE}/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseApiResponse(response, 'Không thể tải danh sách địa chỉ');
};

export const createAddress = async ({ token, data }: { token: string; data: any }) => {
  const response = await fetch(`${API_BASE}/addresses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return parseApiResponse(response, 'Không thể thêm địa chỉ');
};

export const updateAddress = async ({
  token,
  id,
  data,
}: {
  token: string;
  id: string;
  data: any;
}) => {
  const response = await fetch(`${API_BASE}/addresses/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return parseApiResponse(response, 'Không thể cập nhật địa chỉ');
};

export const deleteAddress = async ({ token, id }: { token: string; id: string }) => {
  const response = await fetch(`${API_BASE}/addresses/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseApiResponse(response, 'Không thể xóa địa chỉ');
};

export const getPoints = async (token: string) => {
  const response = await fetch(`${API_BASE}/membership/points`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseApiResponse(response, 'Không thể tải điểm thành viên');
};

export const getTransactions = async (token: string) => {
  const response = await fetch(`${API_BASE}/membership/transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseApiResponse(response, 'Không thể tải lịch sử điểm');
};

export const getVouchers = async (token: string) => {
  const response = await fetch(`${API_BASE}/vouchers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseApiResponse(response, 'Không thể tải voucher');
};

export const getNotificationSettings = async (token: string) => {
  const response = await fetch(`${API_BASE}/notifications/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseApiResponse(response, 'Không thể tải cài đặt thông báo');
};

export const updateNotificationSetting = async ({
  token,
  type,
  data,
}: {
  token: string;
  type: string;
  data: any;
}) => {
  const response = await fetch(`${API_BASE}/notifications/settings/${type}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return parseApiResponse(response, 'Không thể cập nhật cài đặt thông báo');
};

export const useProfile = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => getProfile(token!),
    enabled: !!token,
  });
};

export const useUpdateProfile = () => {
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => updateProfile({ token: token!, data }),
    onSuccess: (updatedUser) => {
      setAuth(updatedUser, token);
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
};

export const useChangePassword = () => {
  const token = useAuthStore((state) => state.token);
  return useMutation({
    mutationFn: (data: any) => changePassword({ token: token!, data }),
  });
};

export const useUpdateAvatar = () => {
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatar: string) => updateAvatar({ token: token!, avatar }),
    onSuccess: (data) => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setAuth({ ...currentUser, avatar: data.avatar }, token);
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      }
    },
  });
};

export const useAddresses = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: userKeys.addresses(),
    queryFn: () => getAddresses(token!),
    enabled: !!token,
  });
};

export const useCreateAddress = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createAddress({ token: token!, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
    },
  });
};

export const useUpdateAddress = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAddress({ token: token!, id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
    },
  });
};

export const useDeleteAddress = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAddress({ token: token!, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
    },
  });
};

export const usePoints = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: userKeys.points(),
    queryFn: () => getPoints(token!),
    enabled: !!token,
  });
};

export const useTransactions = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: userKeys.transactions(),
    queryFn: () => getTransactions(token!),
    enabled: !!token,
  });
};

export const useVouchers = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: userKeys.vouchers(),
    queryFn: () => getVouchers(token!),
    enabled: !!token,
  });
};

export const useNotificationSettings = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: userKeys.notificationSettings(),
    queryFn: () => getNotificationSettings(token!),
    enabled: !!token,
  });
};

export const useUpdateNotificationSetting = () => {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, data }: { type: string; data: any }) =>
      updateNotificationSetting({ token: token!, type, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.notificationSettings() });
    },
  });
};
