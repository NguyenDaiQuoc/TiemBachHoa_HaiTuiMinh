import React from "react";

// -------------------------
// Style System
// -------------------------
const COLORS = {
  primaryBg: "bg-[#E5D3BD]",      // Beige ấm
  secondaryBg: "bg-[#FBF8F5]",    // Trắng ngà
  accentOrange: "bg-[#C75F4B]",   // Cam đất
  accentGreen: "text-[#4A6D56]",  // Xanh rêu
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
    <div className="mb-4">
      <label className={`block text-sm font-semibold mb-1 ${COLORS.textPrimary}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {isTextArea ? (
        <textarea
          placeholder={placeholder}
          rows={5}
          required={required}
          className={`w-full p-3 rounded-lg ${COLORS.secondaryBg} border border-gray-300 focus:ring-2 focus:ring-[#4A6D56] text-sm resize-none`}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          required={required}
          className={`w-full p-3 rounded-lg ${COLORS.secondaryBg} border border-gray-300 focus:ring-2 focus:ring-[#4A6D56] text-sm`}
        />
      )}
    </div>
  );
}

// -------------------------
// Contact Page Component
// -------------------------
export default function ContactPage() {
  return (
    <div className={`flex flex-col items-center min-h-screen ${COLORS.secondaryBg} font-sans`}>

      {/* HEADER */}
      <header
        className={`w-full flex justify-center py-4 px-8 shadow-sm ${COLORS.secondaryBg} border-b border-gray-200`}
      >
        <div className="w-full max-w-7xl h-10 flex items-center justify-between">
          <span className="text-xl font-bold">Tiệm Bách Hóa Nhà Hai Đứa</span>
        </div>
      </header>

      {/* CONTENT */}
      <main className="w-full max-w-7xl px-8 mt-12 mb-24">

        <h1 className={`text-4xl font-extrabold mb-4 ${COLORS.textPrimary}`}>
          Liên Hệ Với Chúng Tôi
        </h1>

        <p className="text-lg text-gray-600 mb-12">
          “Nhà Hai Đứa” luôn sẵn sàng lắng nghe và hỗ trợ bạn.
        </p>

        {/* Layout 2 cột */}
        <div className="flex space-x-10">

          {/* LEFT - FORM */}
          <section
            className={`w-2/3 p-8 rounded-xl shadow-xl ${COLORS.primaryBg} bg-opacity-70`}
          >
            <h2 className={`text-2xl font-bold mb-6 ${COLORS.accentGreen}`}>
              Gửi Yêu Cầu Hỗ Trợ
            </h2>

            <form className="space-y-1">
              {/* Hàng 2 ô */}
              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Họ và Tên"
                  placeholder="Ví dụ: Trần Văn C"
                  required
                />
                <CustomInput
                  label="Email"
                  placeholder="Ví dụ: email@domain.com"
                  type="email"
                  required
                />
              </div>

              <CustomInput
                label="Số Điện Thoại"
                placeholder="090xxxxxxx"
                type="tel"
              />

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

              <button
                type="submit"
                className={`w-full py-3 mt-4 rounded-lg font-bold text-white uppercase shadow-md transition duration-200 ${COLORS.accentOrange} hover:bg-opacity-90`}
              >
                Gửi Yêu Cầu
              </button>
            </form>
          </section>

          {/* RIGHT - INFO */}
          <aside className="w-1/3 space-y-8">

            {/* CONTACT INFO */}
            <div className="p-6 rounded-xl shadow-md bg-white">
              <h3 className={`text-xl font-bold mb-4 ${COLORS.accentGreen}`}>
                Thông Tin Liên Lạc
              </h3>

              <div className="space-y-3 text-gray-700">
                <p className="flex items-center">
                  <span className="text-xl mr-3">📞</span>
                  <span className="font-semibold">Hotline:</span>&nbsp; 090 123 4567
                </p>

                <p className="flex items-center">
                  <span className="text-xl mr-3">📧</span>
                  <span className="font-semibold">Email CSKH:</span>&nbsp; support@nhahaidua.vn
                </p>

                <p className="flex items-center">
                  <span className="text-xl mr-3">📍</span>
                  <span className="font-semibold">Địa chỉ:</span>&nbsp; 123 Đường Sạch Đẹp, Q.7, TP.HCM
                </p>

                <p className="text-sm italic pt-2">
                  Thời gian làm việc: 8h00 – 17h00 (T2 – T6)
                </p>
              </div>
            </div>

            {/* MAP */}
            <div className={`p-6 rounded-xl shadow-md ${COLORS.primaryBg}`}>
              <h3 className={`text-xl font-bold mb-4 ${COLORS.textPrimary}`}>
                Văn Phòng / Kho Hàng
              </h3>

              <div className="relative w-full h-52 rounded-lg overflow-hidden border-2 border-gray-300">
                <iframe
                  className="w-full h-full"
                  loading="lazy"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.164985242964!2d106.7017553!3d10.8007398!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528dabcac5809%3A0x8c953c0c8a57e4!2zUGjGsOG7nW5nIDEgLSBRdeG6rW4gNw!5e0!3m2!1svi!2s!4v1700000000000"
                ></iframe>
              </div>

              <p className="text-sm text-center mt-3 text-gray-700">
                (Bản đồ chỉ đường thực tế)
              </p>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
