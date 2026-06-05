import { AuthScope, getScopedToken } from '@/src/shared/model/auth-utils';

export const getAuthHeaders = (headers: HeadersInit = {}, scope: AuthScope = 'user') => {
  const token = getScopedToken(scope);

  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
