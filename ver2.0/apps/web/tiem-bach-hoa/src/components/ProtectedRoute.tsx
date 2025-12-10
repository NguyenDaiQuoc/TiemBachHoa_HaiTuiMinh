import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';

interface Props { children: ReactElement }

export default function ProtectedRoute({ children }: Props) {
  const user = auth.currentUser;
  if (!user) return <Navigate to="/admin" replace />;
  return children;
}
