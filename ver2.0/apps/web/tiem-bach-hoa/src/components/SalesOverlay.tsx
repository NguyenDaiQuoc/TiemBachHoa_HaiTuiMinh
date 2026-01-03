// src/components/SalesOverlay.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
// Đảm bảo file blackfriday.png được đặt trong thư mục public/images
import blackfridayImg from "/images/blackfriday.png"; 

// --- Kiểu dữ liệu cho props ---
type SalesOverlayProps = {
  onClose: () => void;
  ctaLink: string;
};

function SalesOverlay({ onClose, ctaLink }: SalesOverlayProps) {
  const navigate = useNavigate();

  // Xử lý click vào nút CTA
  const handleCtaClick = () => {
    navigate(ctaLink);
    onClose(); // Đóng overlay sau khi click CTA
  };
  
  // Logic đóng overlay
  const handleClose = () => {
      onClose();
  };

  return (
    // Backdrop: Che phủ toàn bộ viewport, z-index cao nhất
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      
      {/* Container chính của Popup */}
      <div className="relative w-[80%] max-w-xl mx-auto max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Nút "Bỏ qua nội dung chính" */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 z-10 text-white text-sm bg-black bg-opacity-30 px-3 py-1 rounded-full hover:bg-opacity-50 transition font-semibold"
          aria-label="Bỏ qua nội dung chính"
        >
          bỏ qua nội dung chính
        </button>

        {/* Nút Đóng (Góc trên bên phải) */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50 transition-all duration-200"
          aria-label="Đóng popup"
        >
          &times;
        </button>

        {/* Hình ảnh quảng cáo chính */}
        <div className="flex-grow flex items-center justify-center overflow-hidden cursor-pointer" onClick={handleCtaClick}>
            <img
                src={blackfridayImg}
                alt="Popup khuyến mãi"
                className="w-full h-auto object-contain"
            />
        </div>
        

        {/* Nút CTA: Đặt ở dưới cùng và căn giữa */}
        <div className="absolute bottom-0 w-full p-4 flex justify-center bg-transparent">
            <button
                onClick={handleCtaClick}
                className="w-4/5 py-3 text-lg font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-lg hover:from-orange-600 hover:to-red-700 transition transform hover:scale-105"
            >
                XEM NGAY
            </button>
        </div>
      </div>
    </div>
  );
}

export default SalesOverlay;