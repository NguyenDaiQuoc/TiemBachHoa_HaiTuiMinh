
import { BrowserRouter, Routes, Route } from "react-router-dom";

//import for root page
import TiemBachHoaIndex from "./pages/TiemBachHoaIndex";
import Contact from "./pages/Contact";
// Giả định component Product là ProductListingPage của bạn
import Product from "./pages/Product";
import Nothing404 from "./pages/Nothing404";
import AboutUs from "./pages/AboutUs";
import Categories from "./pages/Categories"; // <-- Component Categories
import FAQ from "./pages/FAQ";
import Term from "./pages/Term";
import Payment from "./pages/Payment";
import Shipping from "./pages/Shipping";
import Warranty from "./pages/Warranty";
import Return from "./pages/Return";
import Sale from "./pages/Sale";
import Voucher from "./pages/Voucher";
import Promotion from "./pages/Promotion";
import Wish from "./pages/Wish";
import Address from "./pages/Address";
import Order from "./pages/Order";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirm from "./pages/OrderConfirm";
import OrderTracking from "./pages/OrderTracking";
import BlogDetail from "./pages/BlogDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VIP from "./pages/VIP";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ProdDetail from "./pages/ProductDetail";
import Blog from "./pages/Blog";
import Setting from "./pages/Setting";

// import for admin
import AdminIndex from "./pages/admin/AdminIndex";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Orders from "./pages/admin/Orders";
import Vouchers from "./pages/admin/Vouchers";
import Blogs from "./pages/admin/Blogs";
import BlogCates from "./pages/admin/BlogCates";
import Products from "./pages/admin/Products";
import ProdCates from "./pages/admin/ProductCates";
import Promotions from "./pages/admin/Promotions";
import Marketing from "./pages/admin/Marketing";
import Media from "./pages/admin/Media";
import Deals from "./pages/admin/Deals";
import News from "./pages/admin/News";
import Analytics from "./pages/admin/Analytics";
import General from "./pages/admin/General";
import Inventory from "./pages/admin/Inventory";
import Warehouse from "./pages/admin/Warehouse";
// import Dashboard from "./pages/admin/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TiemBachHoaIndex />} />
        <Route path="/contact" element={<Contact />} />

        {/* ⭐⭐⭐ ROUTE DANH MỤC (TĨNH và ĐỘNG) ⭐⭐⭐ */}
        <Route path="/categories" element={<Categories />}></Route>
        <Route path="/categories/:slug" element={<Categories />}></Route>
        {/* ⭐️ ROUTE MỚI: BẮT ĐƯỜNG DẪN "XEM TẤT CẢ" VÀ DẪN ĐẾN TRANG SẢN PHẨM ⭐️ */}
        {/* /categories/khuyen-mai/all --> Product Component */}
        <Route path="/categories/:categorySlug/all" element={<Product />} />
        {/* ⭐⭐⭐ END ROUTE DANH MỤC ⭐⭐⭐ */}

        <Route path="/products" element={<Product />} />
        <Route path="/404" element={<Nothing404 />}></Route>
        <Route path="/about-us" element={<AboutUs />}></Route>
        <Route path="/blog" element={<Blog />}></Route>
        <Route path="/faqs" element={<FAQ />}></Route>
        <Route path="/general-terms" element={<Term />}></Route>
        <Route path="/payment-terms" element={<Payment />}></Route>
        <Route path="/shipping-policy" element={<Shipping />}></Route>
        <Route path="/warranty-policy" element={<Warranty />}></Route>
        <Route path="/return-policy" element={<Return />}></Route>
        <Route path="/sales" element={<Sale />}></Route>
        <Route path="/payment-method" element={<Payment />}></Route>
        <Route path="/my-voucher" element={<Voucher />}></Route>
        <Route path="/promotions" element={<Promotion />}></Route>
        <Route path="/wish-list" element={<Wish />}></Route>
        <Route path="/address-book" element={<Address />}></Route>
        <Route path="/order-history" element={<Order />}></Route>
        <Route path="/profile" element={<Profile />}></Route>
        <Route path="/forgot-password" element={<ForgotPassword />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>
  <Route path="/vip" element={<VIP />}></Route>
  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>}></Route>
  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>}></Route>
        <Route path="/order-confirm" element={<OrderConfirm />}></Route>
        <Route path="/order-tracking" element={<OrderTracking />}></Route>
        <Route path="/blog-detail" element={<BlogDetail />}></Route>
        <Route path="/product-detail/:productSlug" element={<ProdDetail/> } />
        <Route path="/settings" element={<Setting />}></Route>
        {/* Route Admin */}
        <Route path="/admin" element={<AdminIndex />} />
  <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>}></Route>
  <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><Inventory /></ProtectedRoute>}></Route>
  <Route path="/admin/warehouse" element={<ProtectedRoute requireAdmin><Warehouse /></ProtectedRoute>}></Route>
  <Route path="/admin/users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>}></Route>
  <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><Orders /></ProtectedRoute>}></Route>
  <Route path="/admin/vouchers" element={<ProtectedRoute requireAdmin><Vouchers /></ProtectedRoute>}></Route>
  <Route path="/admin/blogs" element={<ProtectedRoute requireAdmin><Blogs /></ProtectedRoute>}></Route>
  <Route path="/admin/blog-cates" element={<ProtectedRoute requireAdmin><BlogCates /></ProtectedRoute>}></Route>
  <Route path="/admin/products" element={<ProtectedRoute requireAdmin><Products /></ProtectedRoute>}></Route>
  <Route path="/admin/product-cates" element={<ProtectedRoute requireAdmin><ProdCates /></ProtectedRoute>}></Route>
  <Route path="/admin/promotions" element={<ProtectedRoute requireAdmin><Promotions /></ProtectedRoute>}></Route>
  <Route path="/admin/marketing" element={<ProtectedRoute requireAdmin><Marketing /></ProtectedRoute>}></Route>
  <Route path="/admin/media" element={<ProtectedRoute requireAdmin><Media /></ProtectedRoute>}></Route>
  <Route path="/admin/deals" element={<ProtectedRoute requireAdmin><Deals /></ProtectedRoute>}></Route>
  <Route path="/admin/news" element={<ProtectedRoute requireAdmin><News /></ProtectedRoute>}></Route>
  <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><Analytics /></ProtectedRoute>}></Route>

  <Route path="/admin/general" element={<ProtectedRoute><General /></ProtectedRoute>}></Route>

        {/* Xử lý các đường dẫn không khớp */}
        <Route path="*" element={<Nothing404 />} />
      </Routes>
    </BrowserRouter>
  );
}