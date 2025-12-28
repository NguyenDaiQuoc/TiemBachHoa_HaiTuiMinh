import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Custom hook để kiểm tra và enforce remember_until expiry
 * Chỉ chạy một lần duy nhất khi app start
 * Các component khác chỉ cần dùng onAuthStateChanged thôi, không cần kiểm tra remember_until
 */
export function useAuthPersistence() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // Chỉ kiểm tra remember_until khi user đã login
      if (u) {
        try {
          const rem = localStorage.getItem('remember_until');
          if (rem) {
            const until = Number(rem || '0');
            // Nếu hết hạn thì logout
            if (until > 0 && Date.now() > until) {
              localStorage.removeItem('remember_until');
              await auth.signOut();
            }
          }
        } catch (e) {
          console.error('useAuthPersistence check error', e);
        }
      }
    });
    return () => unsub();
  }, []);
}
