import { useAdminAuthStore } from './admin-auth-store';
import { useAuthStore } from './auth-store';

export type AuthScope = 'user' | 'admin';

export const isAdminRole = (role?: string | null) => role === 'ADMIN' || role === 'SUPERADMIN' || role === 'STAFF';

export const getScopedToken = (scope: AuthScope) =>
  scope === 'admin' ? useAdminAuthStore.getState().token : useAuthStore.getState().token;

export const useScopedAuthState = (scope: AuthScope) => {
  const userState = useAuthStore((state) => state);
  const adminState = useAdminAuthStore((state) => state);

  return scope === 'admin' ? adminState : userState;
};
