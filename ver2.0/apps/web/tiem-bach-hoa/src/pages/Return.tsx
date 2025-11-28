import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/returnpolicy.css";

export default function ReturnPolicyPage() {
  return (
    <div className="return-wrapper">
      <Header />

      <div className="return-content">
        <h1 className="return-title">Chính Sách Đổi Trả & Hoàn Tiền</h1>
        <p className="return-subtitle">Sự hài lòng của bạn là ưu tiên hàng đầu của chúng tôi.</p>

        <div className="return-card">

          {/* Thời gian & Điều kiện */}
          <section className="return-section">
            <h2 className="section-title">1. Thời Gian & Điều Kiện Đổi/Trả</h2>
            <ul className="section-list">
              <li>Thời gian áp dụng: 07 ngày kể từ ngày khách hàng nhận được hàng.</li>
              <li>Sản phẩm đủ điều kiện:
                <ul className="sub-list">
                  <li>Còn nguyên vẹn tem, nhãn mác, bao bì gốc.</li>
                  <li>Chưa qua sử dụng, giặt giũ (đối với hàng dệt may).</li>
                  <li>Còn đầy đủ phụ kiện, quà tặng kèm (nếu có).</li>
                  <li>Không áp dụng cho hàng thanh lý hoặc các sản phẩm "Không đổi trả".</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Trường hợp không áp dụng */}
          <section className="return-section">
            <h2 className="section-title">2. Các Trường Hợp Không Hỗ Trợ Đổi/Trả</h2>
            <p className="section-sub">Chúng tôi xin phép từ chối đổi trả trong các trường hợp sau:</p>
            <ul className="section-list">
              <li>Khách hàng đã ký nhận sản phẩm nhưng báo lỗi ngoại quan (vỡ, móp méo).</li>
              <li>Sản phẩm đã qua sử dụng và không còn nguyên trạng.</li>
              <li>Sản phẩm là thực phẩm tươi sống, đã mở bao bì.</li>
              <li>Lý do đổi trả không xuất phát từ lỗi sản xuất hoặc sai sót của Tiệm.</li>
            </ul>
          </section>

          {/* Quy trình & Chi phí */}
          <section className="return-section">
            <h2 className="section-title">3. Quy Trình & Chi Phí</h2>
            <p className="section-sub-bold">Quy trình:</p>
            <ol className="section-ol">
              <li>Khách hàng liên hệ Hotline <b>090 123 4567</b> hoặc gửi email kèm ảnh/video lỗi.</li>
              <li>Tiệm xác nhận điều kiện đổi trả.</li>
              <li>Khách hàng gửi trả hàng về địa chỉ quy định.</li>
              <li>Tiệm xác nhận nhận hàng và hoàn tiền/gửi sản phẩm mới.</li>
            </ol>

            <p className="section-sub-bold">Chi phí:</p>
            <ul className="section-list">
              <li>Lỗi từ Tiệm/Nhà sản xuất: Tiệm chịu 100% chi phí vận chuyển.</li>
              <li>Đổi hàng theo yêu cầu Khách hàng: Khách hàng chịu chi phí vận chuyển hai chiều.</li>
            </ul>
          </section>

        </div>

        {/* CTA Hỗ trợ */}
        <div className="return-cta">
          <p className="cta-text">
            Nếu bạn có bất kỳ thắc mắc nào về chính sách này, đừng ngần ngại liên hệ:
          </p>
          <a href="#" className="cta-btn">LIÊN HỆ HỖ TRỢ NGAY</a>
        </div>

      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}
