import { BrowserRouter, Routes, Route } from "react-router-dom";

import TiemBachHoaIndex from "./pages/TiemBachHoaIndex";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TiemBachHoaIndex />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  );
}
