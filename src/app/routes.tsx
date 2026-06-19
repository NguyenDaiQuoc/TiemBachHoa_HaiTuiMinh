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
const CollectionsPage = lazy(() => import('@/src/pages/collections').then((m) => ({ default: m.CollectionsPage })));
const BlogIndexPage = lazy(() => import('@/src/pages/blog').then((m) => ({ default: m.BlogIndexPage })));
const BlogDetailPage = lazy(() => import('@/src/pages/blog').then((m) => ({ default: m.BlogDetailPage })));
const TrustPage = lazy(() => import('@/src/pages/info/ui/trust-page').then((m) => ({ default: m.TrustPage })));
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

const APP_NAME = 'Tiệm Bách Hoá Hai Tụi Mình';

const resolveTitle = (pathname: string) => {
  if (pathname === '/') return 'Trang chủ';
  if (pathname.startsWith('/products')) return 'Khám phá sản phẩm';
  if (pathname.startsWith('/flash-sale')) return 'Deal cháy giờ vàng';
  if (pathname.startsWith('/new-arrivals')) return 'Hàng mới cập bến';
  if (pathname.startsWith('/product/')) return 'Chi tiết sản phẩm';
  if (pathname.startsWith('/collections')) return 'Bộ sưu tập';
  if (pathname.startsWith('/blog')) return 'Cẩm nang mua sắm';
  if (pathname.startsWith('/store')) return 'Giới thiệu cửa hàng';
  if (pathname.startsWith('/why-buy')) return 'Vì sao chọn Hai Tụi Mình';
  if (pathname.startsWith('/authentic-guarantee')) return 'Cam kết chính hãng';
  if (pathname.startsWith('/tracking')) return 'Theo dõi đơn hàng';
  if (pathname.startsWith('/checkout')) return 'Thanh toán';
  if (pathname === '/login') return 'Đăng nhập';
  if (pathname === '/admin/login') return 'Đăng nhập quản trị';
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
  if (pathname.startsWith('/profile/notifications')) return 'Tài khoản - Thông báo';
  if (pathname.startsWith('/profile/addresses')) return 'Tài khoản - Địa chỉ';
  if (pathname.startsWith('/profile/security')) return 'Tài khoản - Bảo mật';
  if (pathname.startsWith('/profile/settings')) return 'Tài khoản - Cài đặt';
  if (pathname.startsWith('/profile')) return 'Tài khoản cá nhân';
  if (pathname.startsWith('/admin/profile')) return 'Admin - Hồ sơ';
  if (pathname.startsWith('/admin/orders')) return 'Admin - Đơn hàng';
  if (pathname.startsWith('/admin/products')) return 'Admin - Sản phẩm';
  if (pathname.startsWith('/admin/categories')) return 'Admin - Danh mục';
  if (pathname.startsWith('/admin/suppliers')) return 'Admin - Nhà cung cấp';
  if (pathname.startsWith('/admin/marketing')) return 'Admin - Marketing';
  if (pathname.startsWith('/admin/customers')) return 'Admin - Khách hàng';
  if (pathname.startsWith('/admin/vouchers')) return 'Admin - Voucher';
  if (pathname.startsWith('/admin/analytics')) return 'Admin - Phân tích';
  if (pathname.startsWith('/admin/notifications')) return 'Admin - Thông báo';
  if (pathname.startsWith('/admin/support')) return 'Admin - Tư vấn khách hàng';
  if (pathname.startsWith('/admin/settings')) return 'Admin - Cài đặt';
  if (pathname.startsWith('/admin')) return 'Admin Dashboard';
  if (/^\/[^/]+$/.test(pathname)) return 'Chiến dịch';
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

const RouteScrollManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

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
        <RouteScrollManager />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/tracking" element={<OrderTrackingPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/products" element={<SearchPage />} />
            <Route path="/flash-sale" element={<SearchPage />} />
            <Route path="/new-arrivals" element={<SearchPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/community" element={<Navigate to="/products" replace />} />
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
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/store" element={<TrustPage type="store" />} />
            <Route path="/why-buy" element={<TrustPage type="why-buy" />} />
            <Route path="/authentic-guarantee" element={<TrustPage type="guarantee" />} />
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


