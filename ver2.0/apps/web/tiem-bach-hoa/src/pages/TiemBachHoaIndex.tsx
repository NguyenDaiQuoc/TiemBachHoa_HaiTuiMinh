import React, { useState } from "react";
import { FaFacebook, FaInstagram, FaMapMarkerAlt } from "react-icons/fa";

// --- Định nghĩa các giá trị Style ---
const COLORS = {
  primaryBg: "bg-[#E5D3BD]", // Màu Chính: Beige Ấm
  secondaryBg: "bg-[#FBF8F5]", // Màu Nền: Trắng Ngà
  accentOrange: "bg-[#C75F4B]", // Màu Điểm Nhấn: Cam Đất
  accentGreen: "text-[#4A6D56]", // Màu Chữ/Icon: Xanh Rêu
  textPrimary: "text-[#3C3C3C]", // Màu Chữ Đậm
};

// --- Kiểu dữ liệu cho props ---
type ProductCardProps = {
  image: string;
  name: string;
  price: string;
  oldPrice?: string;
  tag?: string | null;
};

type CategoryCardProps = {
  image: string;
  name: string;
};

// --- Component Card Sản Phẩm ---
function ProductCard({ image, name, price, oldPrice, tag }: ProductCardProps) {
  const isSale = oldPrice !== undefined;
  

  return (
    <div className={`flex flex-col rounded-xl shadow-md ${COLORS.secondaryBg} p-3 w-64`}>
      <div className="relative mb-3">
        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          <img src={image} alt={name} className="object-cover w-full h-full" />
        </div>
        {tag && (
          <span
            className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full text-white ${COLORS.accentOrange}`}
          >
            {tag}
          </span>
        )}
      </div>
      <span className={`text-base font-medium ${COLORS.textPrimary}`}>{name}</span>
      <div className="flex items-end justify-between mt-1">
        <span className={`text-lg font-bold ${COLORS.accentGreen}`}>{price}</span>
        {isSale && <span className="text-sm line-through text-gray-500">{oldPrice}</span>}
      </div>
    </div>
  );
}

// --- Component Card Danh mục ---
function CategoryCard({ image, name }: CategoryCardProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <div
        className={`w-32 h-32 md:w-40 md:h-40 ${COLORS.primaryBg} rounded-full shadow-md flex items-center justify-center overflow-hidden mb-2`}
      >
        <img src={image} alt={name} className="object-cover w-full h-full" />
      </div>
      <span className={`text-sm md:text-base font-semibold ${COLORS.textPrimary}`}>{name}</span>
    </div>
  );
}

// --- Component Chính: Layout Index ---
export default function TiemBachHoaIndex() {
  const products = [
    {
      name: "Nến thơm thư giãn",
      price: "180.000đ",
      oldPrice: "200.000đ",
      tag: "Mới",
      image: "https://via.placeholder.com/300/FBF8F5?text=Nen",
    },
    {
      name: "Bánh quy yến mạch",
      price: "150.000đ",
      oldPrice: "180.000đ",
      tag: "Hot",
      image: "https://via.placeholder.com/300/FBF8F5?text=Banh",
    },
    {
      name: "Khăn quấn organic",
      price: "150.000đ",
      tag: null,
      image: "https://via.placeholder.com/300/FBF8F5?text=Khan",
    },
    {
      name: "Bộ bát đĩa gốm",
      price: "350.000đ",
      tag: null,
      image: "https://via.placeholder.com/300/FBF8F5?text=Bat",
    },
  ];

  const categories = [
    { name: "Đồ dùng bếp", image: "https://via.placeholder.com/200/FBF8F5?text=Bep" },
    { name: "Nhu yếu phẩm", image: "https://via.placeholder.com/200/FBF8F5?text=Yeu" },
    { name: "Gia vị & Thực phẩm", image: "https://via.placeholder.com/200/FBF8F5?text=GiaVi" },
    { name: "Đồ uống & Trà", image: "https://via.placeholder.com/200/FBF8F5?text=Tra" },
  ];

  return (
    <div className={`wrapper`}>
      {/* Header */}
      <div className="header">
        <div className="header-container">
          <a href="TiemBachHoaIndex.tsx" className={`header-logo-text`}>
            Tiệm Bách Hóa Hai Tụi Mình
          </a>
          <div className="flex space-x-6 text-sm font-medium text-gray-700">
            <span>Trang chủ</span>
            <span>Sản phẩm</span>
            <span>Combo & Ưu đãi</span>
            <span>Blog/Câu chuyện</span>
            <span>Liên hệ</span>
          </div>
          <div className="flex space-x-4 text-xl text-gray-600">
            <span>🔍</span>
            <span>👤</span>
            <span>❤️</span>
            <span>🛒</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div
        className="bg-[#E5D3BD] w-full h-96"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://via.placeholder.com/1400x500/E5D3BD?text=Hero+Image+Góc+Bếp+Ấm+Cúng")',
          }}
        ></div>
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-start p-16 text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-md">
            Những điều nhỏ xinh làm nên tổ ấm
          </h1>
          <button
            className={`px-8 py-3 rounded-full font-semibold transition duration-200 ${COLORS.accentOrange} hover:bg-opacity-90`}
          >
            Khám Phá Ngay
          </button>
        </div>
      </div>

      {/* Danh Mục Nổi Bật */}
      <h2 className={`text-2xl font-bold mt-12 mb-6 text-center ${COLORS.textPrimary}`}>
        Danh Mục Nổi Bật
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-7xl px-8">
        {categories.map((cat) => (
          <CategoryCard key={cat.name} name={cat.name} image={cat.image} />
        ))}
      </div>

      {/* Sản Phẩm Mới */}
      <h2 className={`text-2xl font-bold mt-8 mb-6 text-center ${COLORS.textPrimary}`}>
        Sản Phẩm Mới
      </h2>
      <div className="flex justify-center mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p, index) => (
            <ProductCard key={index} {...p} />
          ))}
        </div>
      </div>

      {/* Câu Chuyện Nhà Hai Đứa */}
      <div className={`flex rounded-2xl shadow-xl overflow-hidden mb-16 max-w-7xl ${COLORS.primaryBg}`}>
        <div className="w-3/5 h-80 bg-gray-400 flex items-center justify-center overflow-hidden">
          <img
            src="https://via.placeholder.com/600x400/E5D3BD?text=Chuyện+Nhà+Hai+Đứa"
            alt="Câu chuyện"
            className="object-cover w-full h-full"
          />
        </div>
        <div className="w-2/5 p-8 flex flex-col justify-center">
          <h2 className={`text-2xl font-bold mb-3 ${COLORS.textPrimary}`}>Câu chuyện nhà Hai Đứa</h2>
          <p className={`text-sm ${COLORS.textPrimary} opacity-90`}>
            Tụi mình tin những điều nhỏ bé, chân thật nhất tạo nên tổ ấm. Tiệm Bách Hóa là nơi tụi
            mình sẻ chia đồ dùng, gia vị, và những câu chuyện ấm cúng mỗi ngày.
          </p>
          <button className={`mt-4 text-sm font-semibold underline ${COLORS.accentGreen} hover:opacity-80`}>
            Đọc thêm
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={`w-full ${COLORS.primaryBg} py-10 mt-auto`}>
        <div className="w-full max-w-7xl mx-auto px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm text-gray-700">
          <div>
            <span className={`text-lg font-bold ${COLORS.textPrimary}`}>Tiệm Bách Hóa</span>
            <p className="mt-2">Địa chỉ: 55 Lý Tự Trọng</p>
            <p>Hotline: 090xxxxxx</p>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Hỗ trợ khách hàng</span>
            <ul className="mt-2 space-y-1">
              <li>Chính sách đổi trả</li>
              <li>Hướng dẫn mua hàng</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Về Tiệm</span>
            <ul className="mt-2 space-y-1">
              <li>Giới thiệu</li>
              <li>Blog</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Đăng ký nhận bản tin</span>
            <div className="mt-2 flex">
              <input
                type="email"
                placeholder="Email của bạn"
                className="p-2 text-sm w-3/4 rounded-l-lg border border-r-0 border-gray-300"
              />
              <button className="p-2 text-sm text-white rounded-r-lg bg-[#4A6D56] hover:opacity-90">
                Gửi
              </button>
            </div>
            <div className="flex space-x-3 mt-4 text-xl text-[#4A6D56]">
              <FaFacebook />
              <FaInstagram />
              <FaMapMarkerAlt />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
