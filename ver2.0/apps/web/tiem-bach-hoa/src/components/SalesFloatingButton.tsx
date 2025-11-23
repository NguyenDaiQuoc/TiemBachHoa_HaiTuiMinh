// src/components/SalesFloatingButton.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Dùng lại ảnh Black Friday làm icon, hoặc đổi thành icon nhỏ hơn nếu có
import blackfridaySmallIcon from "/images/blackfriday.png"; 

// Hàm tính thời gian còn lại đến 00:00 ngày hôm sau
const calculateTimeLeft = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Đặt thành 00:00:00 ngày hôm sau

    const difference = tomorrow.getTime() - now.getTime();
    if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0 };

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return { hours, minutes, seconds };
};

type SalesFloatingButtonProps = {
    show: boolean;
    ctaLink: string;
};

function SalesFloatingButton({ show, ctaLink }: SalesFloatingButtonProps) {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (!show) return;

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        // Cleanup
        return () => clearInterval(timer);
    }, [show]);

    if (!show) return null;
    
    // Format thời gian đếm ngược
    const timeDisplay = `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;

    return (
        <div 
            onClick={() => navigate(ctaLink)} 
            className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 p-2 cursor-pointer transition-all duration-300 hover:scale-105"
            style={{
                backgroundColor: 'red', // Màu nền nổi bật
                borderRadius: '50% / 10%', // Shape tương tự Shopee
                width: '60px',
                height: '80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
            }}
        >
            {/* LƯU Ý: Nếu ảnh blackfriday.png quá to, bạn nên tạo một icon nhỏ riêng */}
            <img 
                src={blackfridaySmallIcon} 
                alt="Icon Sale" 
                className="w-8 h-8 mb-1 object-contain" 
            />
            <div className="text-xs font-bold text-white leading-none">
                GIẢM SỐC
            </div>
            {/* Bộ đếm ngược */}
            <div className="text-xs font-bold text-yellow-300 bg-red-800 px-1 rounded mt-0.5">
                {timeDisplay}
            </div>
        </div>
    );
}

export default SalesFloatingButton;