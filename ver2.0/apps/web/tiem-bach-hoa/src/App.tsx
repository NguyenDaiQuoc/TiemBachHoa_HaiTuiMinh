
import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthPersistence } from "./hooks/useAuthPersistence";

//import for root page
import TiemBachHoaIndex from "./pages/TiemBachHoaIndex";
import Contact from "./pages/Contact";
import Nothing404 from "./pages/Nothing404";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VIP from "./pages/VIP";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import Setting from "./pages/Setting";
import Story from "./pages/Story";
import AboutUs from "./pages/AboutUs";
import FAQ from "./pages/FAQ";
import Term from "./pages/Term";
import Payment from "./pages/Payment";
import Shipping from "./pages/Shipping";
import Warranty from "./pages/Warranty";
import Return from "./pages/Return";
import Voucher from "./pages/Voucher";
import Promotion from "./pages/Promotion";
import Wish from "./pages/Wish";
import Address from "./pages/Address";
import Order from "./pages/Order";
import OrderConfirm from "./pages/OrderConfirm";
import OrderTracking from "./pages/OrderTracking";

// Lazy-loaded user pages
const Product = React.lazy(() => import("./pages/Product"));
const Categories = React.lazy(() => import("./pages/Categories"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Cart = React.lazy(() => import("./pages/Cart"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const ProdDetail = React.lazy(() => import("./pages/ProductDetail"));
const Sale = React.lazy(() => import("./pages/Sale"));
const Blog = React.lazy(() => import("./pages/Blog"));
const BlogDetail = React.lazy(() => import("./pages/BlogDetail"));
const Coupons = React.lazy(() => import("./pages/Coupons"));

// import for admin
const AdminIndex = React.lazy(() => import("./pages/admin/AdminIndex"));
const Dashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const Users = React.lazy(() => import("./pages/admin/Users"));
const Orders = React.lazy(() => import("./pages/admin/Orders"));
const Vouchers = React.lazy(() => import("./pages/admin/Vouchers"));
const Blogs = React.lazy(() => import("./pages/admin/Blogs"));
const BlogCates = React.lazy(() => import("./pages/admin/BlogCates"));
const Products = React.lazy(() => import("./pages/admin/Products"));
const ProdCates = React.lazy(() => import("./pages/admin/ProductCates"));
const Promotions = React.lazy(() => import("./pages/admin/Promotions"));
const Marketing = React.lazy(() => import("./pages/admin/Marketing"));
const Media = React.lazy(() => import("./pages/admin/Media"));
const Deals = React.lazy(() => import("./pages/admin/Deals"));
const News = React.lazy(() => import("./pages/admin/News"));
const Analytics = React.lazy(() => import("./pages/admin/Analytics"));
const General = React.lazy(() => import("./pages/admin/General"));
const Inventory = React.lazy(() => import("./pages/admin/Inventory"));
const Warehouse = React.lazy(() => import("./pages/admin/Warehouse"));
// import Dashboard from "./pages/admin/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";


export default function App() {
  // Check remember_until expiry globally
  useAuthPersistence();
  
  // Prevent scroll restoration on browser back/forward
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TiemBachHoaIndex />} />
        <Route path="/contact" element={<Contact />} />

        {/* ⭐⭐⭐ ROUTE DANH MỤC (TĨNH và ĐỘNG) ⭐⭐⭐ */}
        <Route path="/categories" element={<Suspense fallback={<div>Loading...</div>}><Categories /></Suspense>}></Route>
        <Route path="/categories/:slug" element={<Suspense fallback={<div>Loading...</div>}><Categories /></Suspense>}></Route>
        {/* Removed special '/all' product route. Use /products?category=slug to filter. */}
        {/* ⭐⭐⭐ END ROUTE DANH MỤC ⭐⭐⭐ */}

        <Route path="/products" element={<Suspense fallback={<div>Loading...</div>}><Product /></Suspense>} />
        <Route path="/404" element={<Nothing404 />}></Route>
        <Route path="/about-us" element={<AboutUs />}></Route>
        <Route path="/story" element={<Story />}></Route>
        <Route path="/blog" element={<Suspense fallback={<div>Loading...</div>}><Blog /></Suspense>}></Route>
        <Route path="/faqs" element={<FAQ />}></Route>
        <Route path="/general-terms" element={<Term />}></Route>
        <Route path="/payment-terms" element={<Payment />}></Route>
        <Route path="/shipping-policy" element={<Shipping />}></Route>
        <Route path="/warranty-policy" element={<Warranty />}></Route>
        <Route path="/return-policy" element={<Return />}></Route>
        <Route path="/sales" element={<Suspense fallback={<div>Loading...</div>}><Sale /></Suspense>}></Route>
        <Route path="/payment-method" element={<Payment />}></Route>
        <Route path="/my-voucher" element={<Voucher />}></Route>
        <Route path="/promotions" element={<Promotion />}></Route>
        <Route path="/coupons" element={<Suspense fallback={<div>Loading...</div>}><Coupons /></Suspense>}></Route>
        <Route path="/wish-list" element={<Wish />}></Route>
        <Route path="/address-book" element={<Address />}></Route>
        <Route path="/order-history" element={<Order />}></Route>
        <Route path="/profile" element={<Suspense fallback={<div>Loading...</div>}><Profile /></Suspense>}></Route>
        <Route path="/forgot-password" element={<ForgotPassword />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="/vip" element={<VIP />}></Route>
        <Route path="/cart" element={<ProtectedRoute><Suspense fallback={<div>Loading...</div>}><Cart /></Suspense></ProtectedRoute>}></Route>
        <Route path="/checkout" element={<ProtectedRoute><Suspense fallback={<div>Loading...</div>}><Checkout /></Suspense></ProtectedRoute>}></Route>
        <Route path="/order-confirm" element={<OrderConfirm />}></Route>
        <Route path="/order-tracking" element={<OrderTracking />}></Route>
        <Route path="/blog-detail/:slug" element={<Suspense fallback={<div>Loading...</div>}><BlogDetail /></Suspense>}></Route>
        <Route path="/product-detail/:productSlug" element={<Suspense fallback={<div>Loading...</div>}><ProdDetail /></Suspense>} />
        <Route path="/settings" element={<Setting />}></Route>
        {/* Route Admin */}
        <Route path="/admin" element={<Suspense fallback={<div>Loading admin...</div>}><AdminIndex /></Suspense>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Dashboard /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Inventory /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/warehouse" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Warehouse /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Users /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Orders /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/vouchers" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Vouchers /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/blogs" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Blogs /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/blog-cates" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><BlogCates /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/products" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Products /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/product-cates" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><ProdCates /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/promotions" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Promotions /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/marketing" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Marketing /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/media" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Media /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/deals" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Deals /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/news" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><News /></Suspense></ProtectedRoute>}></Route>
        <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><Suspense fallback={<div>Loading admin...</div>}><Analytics /></Suspense></ProtectedRoute>}></Route>

        <Route path="/admin/general" element={<ProtectedRoute><Suspense fallback={<div>Loading admin...</div>}><General /></Suspense></ProtectedRoute>}></Route>

        {/* Xử lý các đường dẫn không khớp */}
        <Route path="*" element={<Nothing404 />} />
      </Routes>
    </BrowserRouter>
  );
}
