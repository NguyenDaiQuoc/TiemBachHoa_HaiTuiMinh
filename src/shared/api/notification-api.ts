import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@/src/shared/lib/auth-headers';
import { AuthScope, isAdminRole, useScopedAuthState } from '@/src/shared/model/auth-utils';
import { NotificationCenterPayload } from '@/src/shared/model/notification';

const notificationKeys = {
  all: ['notification-center'] as const,
  scope: (scope: AuthScope) => [...notificationKeys.all, scope] as const,
};

const basePathByScope: Record<AuthScope, string> = {
  user: '/api/user/notifications',
  admin: '/api/admin/notifications',
};

const emptyNotificationCenter: NotificationCenterPayload = {
  items: [],
  unreadCount: 0,
};

const parseResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || fallbackMessage);
  }
  return payload.data as T;
};

const fetchNotifications = async (scope: AuthScope): Promise<NotificationCenterPayload> => {
  const response = await fetch(basePathByScope[scope], {
    headers: getAuthHeaders({}, scope),
  });
  return parseResponse<NotificationCenterPayload>(response, 'Không thể tải thông báo');
};

const markNotificationRead = async ({ scope, id }: { scope: AuthScope; id: string }) => {
  const response = await fetch(`${basePathByScope[scope]}/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders({}, scope),
  });
  return parseResponse(response, 'Không thể cập nhật thông báo');
};

const markAllNotificationsRead = async (scope: AuthScope) => {
  const response = await fetch(`${basePathByScope[scope]}/read-all`, {
    method: 'POST',
    headers: getAuthHeaders({}, scope),
  });
  return parseResponse(response, 'Không thể cập nhật toàn bộ thông báo');
};

export const useNotificationCenter = (scope: AuthScope, enabled = true) => {
  const { token, user, isHydrated } = useScopedAuthState(scope);
  const queryClient = useQueryClient();
  const canAccessScope = scope === 'user' || isAdminRole(user?.role);
  const isEnabled = enabled && isHydrated && !!token && canAccessScope;

  const query = useQuery({
    queryKey: notificationKeys.scope(scope),
    queryFn: () => fetchNotifications(scope),
    enabled: isEnabled,
    placeholderData: emptyNotificationCenter,
  });

  useEffect(() => {
    if (!isEnabled || !token) {
      queryClient.setQueryData(notificationKeys.scope(scope), emptyNotificationCenter);
      return;
    }

    const stream = new EventSource(`${basePathByScope[scope]}/stream?token=${encodeURIComponent(token)}`);

    const handleNotification = () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.scope(scope) });
    };

    const handleError = () => {
      stream.close();
    };

    stream.addEventListener('notification', handleNotification);
    stream.onerror = handleError;

    return () => {
      stream.removeEventListener('notification', handleNotification);
      stream.onerror = null;
      stream.close();
    };
  }, [isEnabled, queryClient, scope, token]);

  return query;
};

export const useMarkNotificationRead = (scope: AuthScope) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead({ scope, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.scope(scope) });
    },
  });
};

export const useMarkAllNotificationsRead = (scope: AuthScope) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.scope(scope) });
    },
  });
};

export { notificationKeys, emptyNotificationCenter };
