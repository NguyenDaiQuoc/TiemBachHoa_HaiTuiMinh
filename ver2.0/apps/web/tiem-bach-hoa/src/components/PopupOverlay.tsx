// src/components/PopupOverlay.tsx

import React from "react";
// Đảm bảo file blackfriday.png được đặt trong thư mục public/images
import blackfridayImg from "/images/blackfriday.png"; // Hoặc đường dẫn tương đối khác

type PopupOverlayProps = {
  onClose: () => void;
  ctaLink: string;
};

function PopupOverlay({ onClose, ctaLink }: PopupOverlayProps) {
  const handleCtaClick = () => {
    window.location.href = ctaLink;
    onClose(); // Đóng overlay sau khi click CTA
  };

  return (
    // Backdrop: Che phủ toàn bộ viewport, không ảnh hưởng đến scroll của trang chính
    // z-index: Đảm bảo nó luôn nằm trên cùng của mọi element khác
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      
      {/* Container chính của Popup */}
      {/* max-h-full để popup không tràn ra ngoài nếu nội dung quá dài */}
      <div className="relative w-[80%] max-w-xl mx-auto max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Nút "Bỏ qua nội dung chính" - Theo yêu cầu từ hình ảnh gốc */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 text-white text-sm bg-black bg-opacity-30 px-3 py-1 rounded-full hover:bg-opacity-50 transition font-semibold"
          aria-label="Bỏ qua nội dung chính"
        >
          bỏ qua nội dung chính
        </button>

        {/* Nút Đóng (Góc trên bên phải) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-30 text-white hover:bg-opacity-50 transition-all duration-200"
          aria-label="Đóng popup"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Hình ảnh quảng cáo chính, điều chỉnh chiều cao linh hoạt */}
        <div className="flex-grow flex items-center justify-center overflow-hidden">
            <img
                src={blackfridayImg}
                alt="Popup khuyến mãi cuối tuần"
                className="w-full h-auto object-contain" // Thay đổi object-cover thành object-contain để ảnh không bị cắt
            />
        </div>
        

        {/* Nút CTA: Đặt ở dưới cùng và căn giữa */}
        {/* Điều chỉnh kích thước và màu sắc cho phù hợp hơn với ví dụ Shopee */}
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

export default PopupOverlay;