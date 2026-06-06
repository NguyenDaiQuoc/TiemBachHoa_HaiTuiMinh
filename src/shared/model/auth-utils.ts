import { useAdminAuthStore } from './admin-auth-store';
import { useAuthStore } from './auth-store';

export type AuthScope = 'user' | 'admin';

export const isAdminRole = (role?: string | null) => role === 'ADMIN' || role === 'SUPERADMIN' || role === 'STAFF';

export const getScopedToken = (scope: AuthScope) =>
  scope === 'admin' ? useAdminAuthStore.getState().token : useAuthStore.getState().token;

export const useScopedAuthState = (scope: AuthScope) => {
  const userToken = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const userHydrated = useAuthStore((state) => state.isHydrated);
  const adminToken = useAdminAuthStore((state) => state.token);
  const adminUser = useAdminAuthStore((state) => state.user);
  const adminHydrated = useAdminAuthStore((state) => state.isHydrated);

  return scope === 'admin'
    ? { token: adminToken, user: adminUser, isHydrated: adminHydrated }
    : { token: userToken, user, isHydrated: userHydrated };
};
