import Header from '../components/Header';
import Footer from '../components/Footer';

const tiers = [
  {
    name: 'Thường',
    threshold: 0,
    discount: 0,
    color: '#111827',
    vouchersPerMonth: 0,
    freeshipPerMonth: 0,
    priorityShipping: 0,
    birthdayGift: 'Không',
    prioritySupport: false,
    extra: ['Ưu đãi đăng ký cơ bản']
  },
  {
    name: 'Đồng',
    threshold: 500000,
    discount: 1,
    color: '#8B5A2B',
    vouchersPerMonth: 1,
    freeshipPerMonth: 0,
    priorityShipping: 1,
    birthdayGift: 'Coupon nhỏ',
    prioritySupport: false,
    extra: ['Ưu đãi sinh nhật nhỏ']
  },
  {
    name: 'Bạc',
    threshold: 1000000,
    discount: 2.5,
    color: '#9CA3AF',
    vouchersPerMonth: 2,
    freeshipPerMonth: 1,
    priorityShipping: 1,
    birthdayGift: 'Quà nhỏ',
    prioritySupport: true,
    extra: ['Quà sinh nhật', 'Ưu tiên xử lý khiếu nại']
  },
  {
    name: 'Vàng',
    threshold: 2000000,
    discount: 3.5,
    color: '#D4AF37',
    vouchersPerMonth: 3,
    freeshipPerMonth: 1,
    priorityShipping: 2,
    birthdayGift: 'Quà hấp dẫn',
    prioritySupport: true,
    extra: ['Giao hàng ưu tiên', 'Quà sinh nhật hấp dẫn']
  },
  {
    name: 'Bạch kim',
    threshold: 3000000,
    discount: 5,
    color: '#E5E4E2',
    vouchersPerMonth: 4,
    freeshipPerMonth: 2,
    priorityShipping: 3,
    birthdayGift: 'Quà giá trị',
    prioritySupport: true,
    extra: ['Quà sinh nhật giá trị', 'Hỗ trợ CSKH ưu tiên']
  },
  {
    name: 'Kim cương',
    threshold: 5000000,
    discount: 7.5,
    color: '#0EA5E9',
    vouchersPerMonth: 6,
    freeshipPerMonth: 4,
    priorityShipping: 5,
    birthdayGift: 'Quà cao cấp + voucher lớn',
    prioritySupport: true,
    extra: ['Toàn quyền ưu đãi: freeship, quà sinh nhật cao cấp, hỗ trợ VIP 24/7']
  },
];

export default function VIPPage() {
  return (
    <div className="vip-page-root">
      <Header />
      <div style={{ padding: '28px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Chương trình VIP</h1>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>Tích điểm theo chi tiêu hàng tháng. Hãy xem các hạng VIP, mức chi tiêu tương ứng và mức chiết khấu bạn sẽ nhận được.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {tiers.map((t, idx) => (
            <div key={t.name} style={{ padding: 18, borderRadius: 12, background: '#fff', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', transform: 'translateY(0)', transition: 'transform 240ms ease, box-shadow 240ms ease', cursor: 'default' }}
              onMouseEnter={(e:any)=>{ e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 12px 28px rgba(15,23,42,0.12)'; }}
              onMouseLeave={(e:any)=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(15,23,42,0.06)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Chi tiêu tối thiểu: <strong style={{ color: '#111' }}>{t.threshold.toLocaleString('vi-VN')} VNĐ</strong></div>
                </div>
                <div style={{ width: 54, height: 54, borderRadius: 12, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>{idx === 0 ? '★' : idx}</div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 12, flexDirection: 'column' }}>
                <div style={{ fontSize: 13, color: '#374151' }}>Ưu đãi chính</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 10px', background: '#f3f4f6', borderRadius: 8 }}>🎟️ Voucher VIP: <strong>{t.vouchersPerMonth}/tháng</strong></div>
                  <div style={{ padding: '8px 10px', background: '#f3f4f6', borderRadius: 8 }}>🚚 FreeShip: <strong>{t.freeshipPerMonth}/tháng</strong></div>
                  <div style={{ padding: '8px 10px', background: '#f3f4f6', borderRadius: 8 }}>⚡ Giao hàng ưu tiên: <strong>{t.priorityShipping}</strong></div>
                </div>

                <div style={{ marginTop: 8, fontSize: 13 }}>
                  <div>🎁 Quà sinh nhật: <strong>{t.birthdayGift}</strong></div>
                  <div style={{ marginTop: 6 }}>📞 Ưu tiên CSKH: <strong>{t.prioritySupport ? 'Có' : 'Không'}</strong></div>
                </div>

                <div style={{ marginTop: 8, color: '#6b7280' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.discount}% giảm giá</div>
                  <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                    {t.extra.map((x:any, i:number) => (
                      <li key={i} style={{ marginBottom: 6 }}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <section style={{ marginTop: 28, padding: 18, borderRadius: 12, background: '#f8fafc' }}>
          <h3 style={{ marginTop: 0 }}>Cách tính hạng và làm mới</h3>
          <p style={{ color: '#6b7280' }}>Hạng VIP được xác định dựa trên tổng chi tiêu trong tháng hiện tại. Mỗi đầu tháng, đồng hồ chi tiêu sẽ được làm mới và bạn sẽ bắt đầu tích lũy cho tháng mới. Hãy đảm bảo thanh toán đơn hàng trước khi kết thúc tháng để được tính vào hạng.</p>

          <h4 style={{ marginTop: 12 }}>Mẹo nhanh</h4>
          <ul>
            <li>Mua nhiều hơn vào các đợt khuyến mãi để nhanh lên hạng.</li>
            <li>Sử dụng mã ưu đãi cho thành viên để tiết kiệm hơn khi nâng hạng.</li>
            <li>Liên hệ chăm sóc khách hàng nếu có đơn hàng chưa được cập nhật.</li>
          </ul>
        </section>

      </div>
      <Footer />
    </div>
  );
}
