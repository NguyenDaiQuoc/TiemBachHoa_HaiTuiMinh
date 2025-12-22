import React, { useState, useEffect, useRef } from "react";
import "../../css/contact.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// -------------------------
// Style Colors (Tailwind giữ nguyên)
// -------------------------
const COLORS = {
  primaryBg: "bg-[#E5D3BD]",
  secondaryBg: "bg-[#FBF8F5]",
  accentOrange: "bg-[#C75F4B]",
  accentGreen: "text-[#4A6D56]",
  textPrimary: "text-[#3C3C3C]",
};

// -------------------------
// Custom Input Component
// -------------------------
interface CustomInputProps {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  isTextArea?: boolean;
}

function CustomInput({
  label,
  placeholder,
  type = "text",
  required = false,
  isTextArea = false,
}: CustomInputProps) {
  return (
    <div className="contact-input-group">
      <label className={`contact-label ${COLORS.textPrimary}`}>
        {label} {required && <span className="required">*</span>}
      </label>

      {isTextArea ? (
        <textarea
          placeholder={placeholder}
          rows={5}
          required={required}
          className="contact-textarea"
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          required={required}
          className="contact-input"
        />
      )}
    </div>
  );
}

// -------------------------
// MAIN CONTACT PAGE
// -------------------------
export default function ContactPage() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Logic hiện nút BackToTop
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowBackToTop(true);
      else setShowBackToTop(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Leaflet map + custom marker + popup
  useEffect(() => {
    if (!mapRef.current) return;

    const position: [number, number] = [10.8622032, 106.5926953];

    const map = L.map(mapRef.current, {
      center: position,
      zoom: 17,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    // Custom logo marker with shadow
    const customIcon = L.icon({
      iconUrl: "/images/logo-maker.png",
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
      className: "custom-marker-shadow", // thêm shadow css
    });

    const marker = L.marker(position, { icon: customIcon }).addTo(map);

    const gmapLink = `https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`;
    marker.bindPopup(
      `<b>📍 Tiệm Bách Hóa Hai Tụi Mình</b><br/>
       82/1E ấp 39, Xuân Thới Sơn, Hóc Môn, TP.HCM<br/>
       <a href="${gmapLink}" target="_blank" style="color:#C75F4B;text-decoration:underline;">Chỉ đường → Google Maps</a>`,
      {
        offset: L.point(0, 30),
        closeButton: false,
      }
    );

    // Popup hover with delay
    let popupTimeout: number;
    marker.on("mouseover", () => {
      clearTimeout(popupTimeout);
      marker.openPopup();
    });
    marker.on("mouseout", () => {
      popupTimeout = setTimeout(() => marker.closePopup(), 1000); // delay 1s trước khi ẩn
    });

    // Mobile: luôn mở
    const isMobile = window.innerWidth <= 768;
    if (isMobile) marker.openPopup();

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="contact-wrapper">
      <Header />
      <main className="contact-container">
        <h1 className="contact-title">Liên Hệ Với Chúng Tôi</h1>
        <p className="contact-desc">
          “Nhà Hai Đứa” luôn sẵn sàng lắng nghe và hỗ trợ bạn.
        </p>

        <div className="contact-grid">
          <section className="contact-form-card">
            <h2 className="contact-form-title">Gửi Yêu Cầu Hỗ Trợ</h2>
            <form className="form-fields">
              <div className="form-grid-2">
                <CustomInput label="Họ và Tên" placeholder="Ví dụ: Trần Văn C" required />
                <CustomInput
                  label="Email"
                  placeholder="Ví dụ: email@domain.com"
                  type="email"
                  required
                />
              </div>
              <CustomInput label="Số Điện Thoại" placeholder="090xxxxxxx" type="tel" />
              <CustomInput
                label="Tiêu đề"
                placeholder="Bạn cần hỗ trợ vấn đề gì?"
                required
              />
              <CustomInput
                label="Nội dung chi tiết"
                placeholder="Hãy mô tả chi tiết yêu cầu của bạn..."
                isTextArea
                required
              />
              <button type="submit" className="contact-submit-btn">
                Gửi Yêu Cầu
              </button>
            </form>
          </section>

          <aside className="contact-right">
            <div className="contact-info-card">
              <h3 className="info-title">Thông Tin Liên Lạc</h3>
              <div className="info-list">
                <p>
                  <span>📞</span> <strong>Hotline:</strong> 093 145 4176 - 089 945 4041
                </p>
                <p>
                  <span>📧</span> <strong>Email:</strong> support@nhahaidua.vn
                </p>
                <p>
                  <span>📍</span> <strong>Địa chỉ:</strong> 82/1F ấp Xuân Thới Đông 3, Hóc Môn, TP.HCM
                </p>
                <p className="worktime">Thời gian: 8h00 – 22h00 (T2 – T7)</p>
              </div>
            </div>

            <div className="contact-map-card">
              <h3 className="map-title">Văn Phòng / Kho Hàng</h3>
              <div
                ref={mapRef}
                style={{ height: "200px", width: "100%", borderRadius: "8px", boxShadow:  "0 0 12px rgba(199, 95, 75, 0.28)"}}
              />
              <p className="map-note">(Bản đồ chỉ đường thực tế)</p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
