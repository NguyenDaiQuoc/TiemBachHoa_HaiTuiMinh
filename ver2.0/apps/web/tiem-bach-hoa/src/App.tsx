import { BrowserRouter, Routes, Route } from "react-router-dom";

//import for root page
import TiemBachHoaIndex from "./pages/TiemBachHoaIndex";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Nothing404 from "./pages/Nothing404";
import AboutUs from "./pages/AboutUs";
import Categories from "./pages/Categories";
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
// import Dashboard from "./pages/admin/Dashboard";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TiemBachHoaIndex />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/categories" element={<Categories/>}></Route>
        <Route path="/products" element={<Product/>}/>
        <Route path="/404" element={<Nothing404/>}></Route>
        <Route path="/about-us" element={<AboutUs/>}></Route>
        <Route path="/blog" element={<Blog/>}></Route>
        <Route path="/faqs" element={<FAQ/>}></Route>
        <Route path="/general-terms" element={<Term/>}></Route>  
        <Route path="/payment-terms" element={<Payment/>}></Route>
        <Route path="/shipping-policy" element={<Shipping/>}></Route>
        <Route path="/warranty-policy" element={<Warranty/>}></Route>
        <Route path="/return-policy" element={<Return/>}></Route>
        <Route path="/sales" element={<Sale/>}></Route> 
        <Route path="/payment-method" element={<Payment/>}></Route>
        <Route path="/my-voucher" element={<Voucher/>}></Route>
        <Route path="/promotions" element={<Promotion/>}></Route>
        <Route path="/wish-list" element={<Wish/>}></Route>
        <Route path="/address-book" element={<Address/>}></Route>
        <Route path="/order-history" element={<Order/>}></Route>
        <Route path="/profile" element={<Profile/>}></Route>
        <Route path="/forgot-password" element={<ForgotPassword/>}></Route>
        <Route path="/login" element={<Login/>}></Route>
        <Route path="/register" element={<Register/>}></Route>
        <Route path="/cart" element={<Cart/>}></Route>
        <Route path="/checkout" element={<Checkout/>}></Route>
        <Route path="/order-confirm" element={<OrderConfirm/>}></Route>
        <Route path="/order-tracking" element={<OrderTracking/>}></Route>
        <Route path="/blog-detail" element={<BlogDetail/>}></Route>
        <Route path="/product-detail" element={<ProdDetail/>}></Route>
        <Route path="/settings" element={<Setting/>}></Route>
        {/* Route Admin */}
        <Route path="/admin" element={<AdminIndex />} />
        <Route path="/admin/dashboard" element={<Dashboard/>}></Route>
        <Route path="/admin/users" element={<Users/>}></Route>
        <Route path="/admin/orders" element={<Orders/>}></Route>
        <Route path="/admin/vouchers" element={<Vouchers/>}></Route>
        <Route path="/admin/blogs" element={<Blogs/>}></Route>
        <Route path="/admin/blog-cates" element={<BlogCates/>}></Route>
        <Route path="/admin/products" element={<Products/>}></Route>
        <Route path="/admin/product-cates" element={<ProdCates/>}></Route>
        <Route path="/admin/promotions" element={<Promotions/>}></Route>
        <Route path="/admin/marketing" element={<Marketing/>}></Route>
        <Route path="/admin/media" element={<Media/>}></Route>
        <Route path="/admin/deals" element={<Deals/>}></Route>
        <Route path="/admin/news" element={<News/>}></Route>
        <Route path="/admin/analytics" element={<Analytics/>}></Route>

        <Route path="/admin/general" element={<General/>}></Route>
        
      </Routes>
    </BrowserRouter>
  );
}
