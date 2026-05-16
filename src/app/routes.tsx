import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Skeleton } from '@/src/shared/ui/skeleton';
import { ErrorBoundary } from '@/src/shared/ui/error-boundary';
import { ProtectedRoute } from '@/src/features/auth/ui/protected-route';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { AppShell } from './layouts/app-shell';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('@/src/pages/home').then(m => ({ default: m.HomePage })));
const CheckoutPage = lazy(() => import('@/src/pages/checkout').then(m => ({ default: m.CheckoutPage })));
const OrderTrackingPage = lazy(() => import('@/src/pages/order-tracking').then(m => ({ default: m.OrderTrackingPage })));
const ProductDetailPage = lazy(() => import('@/src/pages/product-detail').then(m => ({ default: m.ProductDetailPage })));
const SearchPage = lazy(() => import('@/src/pages/search').then(m => ({ default: m.SearchPage })));
const LoginPage = lazy(() => import('@/src/pages/auth/login').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/src/pages/auth/register').then(m => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import('@/src/pages/profile').then(m => ({ default: m.ProfilePage })));
const CollectionsPage = lazy(() => import('@/src/pages/collections').then(m => ({ default: m.CollectionsPage })));
const AboutPage = lazy(() => import('@/src/pages/info/ui/about-page').then(m => ({ default: m.AboutPage })));
const FAQPage = lazy(() => import('@/src/pages/info/ui/faq-page').then(m => ({ default: m.FAQPage })));
const PolicyPage = lazy(() => import('@/src/pages/info/ui/policy-page').then(m => ({ default: m.PolicyPage })));
const ContactPage = lazy(() => import('@/src/pages/info/ui/contact-page').then(m => ({ default: m.ContactPage })));
const AdminLayout = lazy(() => import('@/src/app/layouts/admin-layout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('@/src/pages/admin/dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminOrders = lazy(() => import('@/src/pages/admin/orders').then(m => ({ default: m.AdminOrders })));
const AdminProducts = lazy(() => import('@/src/pages/admin/products').then(m => ({ default: m.AdminProducts })));
const AdminCustomers = lazy(() => import('@/src/pages/admin/customers').then(m => ({ default: m.AdminCustomers })));

const PageLoader = () => (
  <div className="min-h-screen bg-background p-8 space-y-8 flex flex-col items-center justify-center">
    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
    <Skeleton className="h-4 w-48 rounded-full" />
  </div>
);

const APP_NAME = 'Tiệm bách hoá Hai Tụi Mình';

const resolveTitle = (pathname: string) => {
  if (pathname === '/') return 'Trang chủ';
  if (pathname.startsWith('/products')) return 'Khám phá sản phẩm';
  if (pathname.startsWith('/flash-sale')) return 'Deal cháy giờ vàng';
  if (pathname.startsWith('/new-arrivals')) return 'Hàng mới cập bến';
  if (pathname.startsWith('/product/')) return 'Chi tiết sản phẩm';
  if (pathname.startsWith('/collections')) return 'Bộ sưu tập';
  if (pathname.startsWith('/tracking')) return 'Theo dõi đơn hàng';
  if (pathname.startsWith('/checkout')) return 'Thanh toán';
  if (pathname === '/login') return 'Đăng nhập';
  if (pathname === '/register') return 'Đăng ký';
  if (pathname.startsWith('/contact')) return 'Liên hệ';
  if (pathname.startsWith('/about')) return 'Về chúng mình';
  if (pathname.startsWith('/faq')) return 'Hỏi đáp';
  if (pathname.startsWith('/privacy-policy')) return 'Chính sách bảo mật';
  if (pathname.startsWith('/shipping-policy')) return 'Chính sách vận chuyển';
  if (pathname.startsWith('/return-policy')) return 'Chính sách đổi trả';
  if (pathname.startsWith('/profile/orders')) return 'Tài khoản - Đơn hàng';
  if (pathname.startsWith('/profile/wishlist')) return 'Tài khoản - Yêu thích';
  if (pathname.startsWith('/profile/recently-viewed')) return 'Tài khoản - Đã xem gần đây';
  if (pathname.startsWith('/profile/membership')) return 'Tài khoản - Hạng thành viên';
  if (pathname.startsWith('/profile/addresses')) return 'Tài khoản - Địa chỉ';
  if (pathname.startsWith('/profile/security')) return 'Tài khoản - Bảo mật';
  if (pathname.startsWith('/profile/settings')) return 'Tài khoản - Cài đặt';
  if (pathname.startsWith('/profile')) return 'Tài khoản cá nhân';
  return APP_NAME;
};

const RouteTitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const title = resolveTitle(location.pathname);
    document.title = title === APP_NAME ? APP_NAME : `${title} | ${APP_NAME}`;
  }, [location.pathname]);

  return null;
};

export const AppRoutes = () => {
  const { token, setAuth, logout, isHydrated } = useAuthStore();

  useEffect(() => {
    if (token && isHydrated) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Token invalid');
          return res.json();
        })
        .then(user => {
          setAuth(user, token);
        })
        .catch(() => {
          logout();
        });
    }
  }, [token, isHydrated, setAuth, logout]);

  if (!isHydrated) return <PageLoader />;

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <RouteTitleManager />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/tracking" element={<OrderTrackingPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/products" element={<SearchPage />} />
            <Route path="/flash-sale" element={<SearchPage />} />
            <Route path="/new-arrivals" element={<SearchPage />} />
            <Route path="/search" element={<Navigate to="/products" replace />} />
            <Route
              path="/profile/*"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/account/*" element={<Navigate to="/profile" replace />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/shipping-policy" element={<PolicyPage type="shipping" />} />
            <Route path="/return-policy" element={<PolicyPage type="return" />} />
            <Route path="/privacy-policy" element={<PolicyPage type="privacy" />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="settings" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};
