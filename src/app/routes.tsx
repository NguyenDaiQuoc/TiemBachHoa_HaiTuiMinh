import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/src/shared/ui/skeleton';
import { ErrorBoundary } from '@/src/shared/ui/error-boundary';
import { ProtectedRoute } from '@/src/features/auth/ui/protected-route';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { useAdminAuthStore } from '@/src/shared/model/admin-auth-store';
import { useSupportUnreadStore } from '@/src/shared/model/support-unread-store';
import { isAdminRole } from '@/src/shared/model/auth-utils';
import { AppShell } from './layouts/app-shell';

const HomePage = lazy(() => import('@/src/pages/home').then((m) => ({ default: m.HomePage })));
const CheckoutPage = lazy(() => import('@/src/pages/checkout').then((m) => ({ default: m.CheckoutPage })));
const OrderTrackingPage = lazy(() => import('@/src/pages/order-tracking').then((m) => ({ default: m.OrderTrackingPage })));
const ProductDetailPage = lazy(() => import('@/src/pages/product-detail').then((m) => ({ default: m.ProductDetailPage })));
const SearchPage = lazy(() => import('@/src/pages/search').then((m) => ({ default: m.SearchPage })));
const CampaignPage = lazy(() => import('@/src/pages/campaign').then((m) => ({ default: m.CampaignPage })));
const LoginPage = lazy(() => import('@/src/pages/auth/login').then((m) => ({ default: m.LoginPage })));
const AdminLoginPage = lazy(() => import('@/src/pages/auth/admin-login').then((m) => ({ default: m.AdminLoginPage })));
const RegisterPage = lazy(() => import('@/src/pages/auth/register').then((m) => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import('@/src/pages/profile').then((m) => ({ default: m.ProfilePage })));
const CommunityPage = lazy(() => import('@/src/pages/community').then((m) => ({ default: m.CommunityPage })));
const CollectionsPage = lazy(() => import('@/src/pages/collections').then((m) => ({ default: m.CollectionsPage })));
const AboutPage = lazy(() => import('@/src/pages/info/ui/about-page').then((m) => ({ default: m.AboutPage })));
const FAQPage = lazy(() => import('@/src/pages/info/ui/faq-page').then((m) => ({ default: m.FAQPage })));
const PolicyPage = lazy(() => import('@/src/pages/info/ui/policy-page').then((m) => ({ default: m.PolicyPage })));
const ContactPage = lazy(() => import('@/src/pages/info/ui/contact-page').then((m) => ({ default: m.ContactPage })));
const AdminLayout = lazy(() => import('@/src/app/layouts/admin-layout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('@/src/pages/admin/dashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminOrders = lazy(() => import('@/src/pages/admin/orders').then((m) => ({ default: m.AdminOrders })));
const AdminProducts = lazy(() => import('@/src/pages/admin/products').then((m) => ({ default: m.AdminProducts })));
const AdminCategories = lazy(() => import('@/src/pages/admin/categories').then((m) => ({ default: m.AdminCategories })));
const AdminSuppliers = lazy(() => import('@/src/pages/admin/suppliers').then((m) => ({ default: m.AdminSuppliers })));
const AdminMarketing = lazy(() => import('@/src/pages/admin/marketing').then((m) => ({ default: m.AdminMarketing })));
const AdminCustomers = lazy(() => import('@/src/pages/admin/customers').then((m) => ({ default: m.AdminCustomers })));
const AdminVouchers = lazy(() => import('@/src/pages/admin/vouchers').then((m) => ({ default: m.AdminVouchers })));
const AdminAnalytics = lazy(() => import('@/src/pages/admin/analytics').then((m) => ({ default: m.AdminAnalytics })));
const AdminNotifications = lazy(() => import('@/src/pages/admin/notifications').then((m) => ({ default: m.AdminNotifications })));
const AdminSupport = lazy(() => import('@/src/pages/admin/support').then((m) => ({ default: m.AdminSupport })));
const AdminSettings = lazy(() => import('@/src/pages/admin/settings').then((m) => ({ default: m.AdminSettings })));
const AdminProfile = lazy(() => import('@/src/pages/admin/profile').then((m) => ({ default: m.AdminProfile })));

const PageLoader = () => (
  <div className="flex min-h-screen flex-col items-center justify-center space-y-8 bg-background p-8">
    <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
    <Skeleton className="h-4 w-48 rounded-full" />
  </div>
);

const APP_NAME = 'Ti\u1ec7m b\u00e1ch ho\u00e1 Hai T\u1ee5i M\u00ecnh';

const resolveTitle = (pathname: string) => {
  if (pathname === '/') return 'Trang chÃ¡Â»Â§';
  if (pathname.startsWith('/products')) return 'KhÃƒÂ¡m phÃƒÂ¡ sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m';
  if (pathname.startsWith('/flash-sale')) return 'Deal chÃƒÂ¡y giÃ¡Â»Â vÃƒÂ ng';
  if (pathname.startsWith('/new-arrivals')) return 'HÃƒÂ ng mÃ¡Â»â€ºi cÃ¡ÂºÂ­p bÃ¡ÂºÂ¿n';
  if (pathname.startsWith('/product/')) return 'Chi tiÃ¡ÂºÂ¿t sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m';
  if (pathname.startsWith('/collections')) return 'BÃ¡Â»â„¢ sÃ†Â°u tÃ¡ÂºÂ­p';
  if (pathname.startsWith('/community')) return 'CÃ¡Â»â„¢ng Ã„â€˜Ã¡Â»â€œng mua sÃ¡ÂºÂ¯m';
  if (pathname.startsWith('/tracking')) return 'Theo dÃƒÂµi Ã„â€˜Ã†Â¡n hÃƒÂ ng';
  if (pathname.startsWith('/checkout')) return 'Thanh toÃƒÂ¡n';
  if (pathname === '/login') return 'Ã„ÂÃ„Æ’ng nhÃ¡ÂºÂ­p';
  if (pathname === '/admin/login') return 'Ã„ÂÃ„Æ’ng nhÃ¡ÂºÂ­p quÃ¡ÂºÂ£n trÃ¡Â»â€¹';
  if (pathname === '/register') return 'Ã„ÂÃ„Æ’ng kÃƒÂ½';
  if (pathname.startsWith('/contact')) return 'LiÃƒÂªn hÃ¡Â»â€¡';
  if (pathname.startsWith('/about')) return 'VÃ¡Â»Â chÃƒÂºng mÃƒÂ¬nh';
  if (pathname.startsWith('/faq')) return 'HÃ¡Â»Âi Ã„â€˜ÃƒÂ¡p';
  if (pathname.startsWith('/privacy-policy')) return 'ChÃƒÂ­nh sÃƒÂ¡ch bÃ¡ÂºÂ£o mÃ¡ÂºÂ­t';
  if (pathname.startsWith('/shipping-policy')) return 'ChÃƒÂ­nh sÃƒÂ¡ch vÃ¡ÂºÂ­n chuyÃ¡Â»Æ’n';
  if (pathname.startsWith('/return-policy')) return 'ChÃƒÂ­nh sÃƒÂ¡ch Ã„â€˜Ã¡Â»â€¢i trÃ¡ÂºÂ£';
  if (pathname.startsWith('/profile/orders')) return 'TÃƒÂ i khoÃ¡ÂºÂ£n - Ã„ÂÃ†Â¡n hÃƒÂ ng';
  if (pathname.startsWith('/profile/wishlist')) return 'TÃƒÂ i khoÃ¡ÂºÂ£n - YÃƒÂªu thÃƒÂ­ch';
  if (pathname.startsWith('/profile/recently-viewed')) return 'TÃƒÂ i khoÃ¡ÂºÂ£n - Ã„ÂÃƒÂ£ xem gÃ¡ÂºÂ§n Ã„â€˜ÃƒÂ¢y';
  if (pathname.startsWith('/profile/membership')) return 'TÃƒÂ i khoÃ¡ÂºÂ£n - HÃ¡ÂºÂ¡ng thÃƒÂ nh viÃƒÂªn';
  if (pathname.startsWith('/profile/notifications')) return 'TÃƒÂ i khoÃ¡ÂºÂ£n - ThÃƒÂ´ng bÃƒÂ¡o';
  if (pathname.startsWith('/profile/addresses')) return 'TÃƒÂ i khoÃ¡ÂºÂ£n - Ã„ÂÃ¡Â»â€¹a chÃ¡Â»â€°';
  if (pathname.startsWith('/profile/security')) return 'TÃƒÂ i khoÃ¡ÂºÂ£n - BÃ¡ÂºÂ£o mÃ¡ÂºÂ­t';
  if (pathname.startsWith('/profile/settings')) return 'TÃƒÂ i khoÃ¡ÂºÂ£n - CÃƒÂ i Ã„â€˜Ã¡ÂºÂ·t';
  if (pathname.startsWith('/profile')) return 'TÃƒÂ i khoÃ¡ÂºÂ£n cÃƒÂ¡ nhÃƒÂ¢n';
  if (pathname.startsWith('/admin/profile')) return 'Admin - HÃ¡Â»â€œ sÃ†Â¡';
  if (pathname.startsWith('/admin/orders')) return 'Admin - Ã„ÂÃ†Â¡n hÃƒÂ ng';
  if (pathname.startsWith('/admin/products')) return 'Admin - SÃ¡ÂºÂ£n phÃ¡ÂºÂ©m';
  if (pathname.startsWith('/admin/categories')) return 'Admin - Danh mÃ¡Â»Â¥c';
  if (pathname.startsWith('/admin/suppliers')) return 'Admin - NhÃƒÂ  cung cÃ¡ÂºÂ¥p';
  if (pathname.startsWith('/admin/marketing')) return 'Admin - Marketing';
  if (pathname.startsWith('/admin/customers')) return 'Admin - KhÃƒÂ¡ch hÃƒÂ ng';
  if (pathname.startsWith('/admin/vouchers')) return 'Admin - Voucher';
  if (pathname.startsWith('/admin/analytics')) return 'Admin - PhÃƒÂ¢n tÃƒÂ­ch';
  if (pathname.startsWith('/admin/notifications')) return 'Admin - ThÃƒÂ´ng bÃƒÂ¡o';
  if (pathname.startsWith('/admin/support')) return 'Admin - TÃ†Â° vÃ¡ÂºÂ¥n khÃƒÂ¡ch hÃƒÂ ng';
  if (pathname.startsWith('/admin/settings')) return 'Admin - CÃƒÂ i Ã„â€˜Ã¡ÂºÂ·t';
  if (pathname.startsWith('/admin')) return 'Admin Dashboard';
  if (/^\/[^/]+$/.test(pathname)) return 'Chi\u1ebfn d\u1ecbch';
  return APP_NAME;
};

const RouteTitleManager = () => {
  const location = useLocation();
  const userUnreadCount = useSupportUnreadStore((state) => state.userUnreadCount);
  const adminUnreadCount = useSupportUnreadStore((state) => state.adminUnreadCount);

  useEffect(() => {
    const title = resolveTitle(location.pathname);
    const unreadCount = location.pathname.startsWith('/admin') ? adminUnreadCount : userUnreadCount;
    const baseTitle = title === APP_NAME ? APP_NAME : `${title} | ${APP_NAME}`;
    document.title = unreadCount > 0 ? `(${unreadCount}) ${baseTitle}` : baseTitle;
  }, [adminUnreadCount, location.pathname, userUnreadCount]);

  return null;
};

const useAuthHydration = (
  token: string | null,
  isHydrated: boolean,
  setAuth: (user: any, token: string | null) => void,
  logout: () => void,
  expectedScope: 'user' | 'admin'
) => {
  useEffect(() => {
    if (!token || !isHydrated) return;

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token invalid');
        return res.json();
      })
      .then((user) => {
        if (expectedScope === 'admin' && !isAdminRole(user?.role)) {
          logout();
          return;
        }

        if (expectedScope === 'user' && isAdminRole(user?.role)) {
          logout();
          return;
        }

        setAuth(user, token);
      })
      .catch(() => {
        logout();
      });
  }, [expectedScope, isHydrated, logout, setAuth, token]);
};

export const AppRoutes = () => {
  const userAuth = useAuthStore();
  const adminAuth = useAdminAuthStore();

  useAuthHydration(userAuth.token, userAuth.isHydrated, userAuth.setAuth, userAuth.logout, 'user');
  useAuthHydration(adminAuth.token, adminAuth.isHydrated, adminAuth.setAuth, adminAuth.logout, 'admin');

  if (!userAuth.isHydrated || !adminAuth.isHydrated) return <PageLoader />;

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
            <Route path="/community" element={<CommunityPage />} />
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
            <Route path="/:campaignSlug" element={<CampaignPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
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
            <Route path="categories" element={<AdminCategories />} />
            <Route path="suppliers" element={<AdminSuppliers />} />
            <Route path="marketing" element={<AdminMarketing />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

