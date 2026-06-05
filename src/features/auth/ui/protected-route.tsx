import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminRole } from '@/src/shared/model/auth-utils';
import { useAdminAuthStore } from '@/src/shared/model/admin-auth-store';
import { useAuthStore } from '@/src/shared/model/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const userAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();
  const location = useLocation();
  const { user, token } = requireAdmin ? adminAuth : userAuth;
  const hasAdminRole = isAdminRole(user?.role);

  if (!token || !user) {
    return <Navigate to={requireAdmin ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  }

  if (requireAdmin && !hasAdminRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
