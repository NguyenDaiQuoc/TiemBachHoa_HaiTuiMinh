import { BrowserRouter, Routes, Route } from "react-router-dom";

import TiemBachHoaIndex from "./pages/TiemBachHoaIndex";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import AdminIndex from "./pages/admin/AdminIndex"
import Dashboard from "./pages/admin/Dashboard"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TiemBachHoaIndex />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/products" element={<Product/>}/>
        {/* Route Admin */}
        <Route path="/admin" element={<AdminIndex />} />
        <Route path="/dashboard" element={<Dashboard/>}></Route>
      </Routes>
    </BrowserRouter>
  );
}
