import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { showError } from '../utils/toast';

interface Props {
  children: ReactElement;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
  // Synchronously compute allowed access to avoid blank flicker on refresh
  const user = auth.currentUser;
  let allowed = false;
  if (user) allowed = true;
  else {
    try {
      const saved = localStorage.getItem('adminLoginInfo');
      if (saved) {
        const info = JSON.parse(saved);
        if (info && info.expiry && Date.now() < info.expiry) {
          allowed = true;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Admin routes: redirect to admin login page
  if (requireAdmin && !allowed) {
    // show a friendly toast once
    showError('Cần đăng nhập để sử dụng tính năng quản trị');
    return <Navigate to="/admin" replace />;
  }

  // Non-admin protected routes: show modal prompt
  if (!requireAdmin && !allowed) {
    showError('Cần đăng nhập để sử dụng tính năng này');
    return (
      <>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 400,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ marginBottom: 12, color: '#1f2937' }}>Chưa đăng nhập</h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>
              Vui lòng đăng nhập để sử dụng tính năng này
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <a
                href="/login"
                style={{
                  background: '#C75F4B',
                  color: '#fff',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Đăng nhập
              </a>
              <a
                href="/"
                style={{
                  background: '#e5e7eb',
                  color: '#374151',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Quay lại
              </a>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  return children;
}
