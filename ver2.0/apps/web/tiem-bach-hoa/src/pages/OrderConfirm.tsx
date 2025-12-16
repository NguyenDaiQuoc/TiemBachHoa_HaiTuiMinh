import { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/order-confirm.css";
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Format tiền tệ
const formatCurrency = (amount?: number | null) => {
  const numericAmount = Number(amount) || 0;
  return numericAmount.toLocaleString('vi-VN') + ' VNĐ';
};

export default function OrderConfirm() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const orderId = params.get('orderId');

  const [loading, setLoading] = useState<boolean>(!!orderId);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Không tìm thấy mã đơn hàng.');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'orders', orderId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError('Đơn hàng không tồn tại.');
          setOrder(null);
        } else {
          setOrder({ id: snap.id, ...(snap.data() as any) });
        }
      } catch (err: any) {
        console.error('Error fetching order', err);
        setError('Không thể tải dữ liệu đơn hàng. Có thể do quyền truy cập.');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const handleTrack = () => {
    // go to user's orders page where they can see tracking/status
    navigate('/orders');
  };

  const handleHome = () => navigate('/');

  if (loading) {
    return (
      <div className="thankyou-wrapper">
        <Header />
        <div className="thankyou-content">
          <div className="thankyou-card">
            <h2>Đang tải thông tin đơn hàng...</h2>
          </div>
        </div>
        <FloatingButtons />
        <Footer />
      </div>
    );
  }

  return (
    <div className="thankyou-wrapper">
      <Header />

      <div className="thankyou-content">
        <div className="thankyou-card">
          <div className="thankyou-icon"><span>✓</span></div>
          <h1 className="thankyou-title">{order ? 'ĐẶT HÀNG THÀNH CÔNG!' : 'LỖI'}</h1>

          {!order && (
            <div>
              <p>{error || 'Không có thông tin.'}</p>
              <div className="thankyou-actions">
                <button className="btn-secondary" onClick={handleHome}>Quay lại Trang Chủ</button>
              </div>
            </div>
          )}

          {order && (
            <>
              <p className="thankyou-subtitle">Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.</p>

              <p className="thankyou-label">Mã đơn hàng của bạn:</p>
              <div className="thankyou-orderid">{order.id}</div>

              <div className="thankyou-summary">
                <div>
                  <h3 className="summary-title">Thông tin Giao hàng</h3>
                  <p className="summary-item">Tên Khách Hàng: {order.customerName || order.customer || ''}</p>
                  <p className="summary-item">SĐT: {order.phone || ''}</p>
                  <p className="summary-item">Địa Chỉ: {order.address || ''} {order.district || ''} {order.city || ''}</p>
                  <p className="summary-item">Ghi chú: {order.notes || '-'}</p>
                </div>

                <div>
                  <h3 className="summary-title">Chi Tiết Thanh Toán</h3>
                  <div className="summary-row"><span>Tổng Đơn Hàng:</span><span className="highlight">{formatCurrency(order.subtotal)}</span></div>
                  <div className="summary-row"><span>Phí Vận Chuyển:</span><span>{formatCurrency(order.shippingFee)}</span></div>
                  <div className="summary-row"><span>Tổng Thanh Toán:</span><span className="highlight">{formatCurrency(order.total)}</span></div>
                  <div className="summary-row"><span>Phương thức:</span><span>{order.paymentMethod || 'COD'}</span></div>
                  <div className="summary-row"><span>Trạng thái:</span><span>{order.status || ''}</span></div>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginTop: 12 }}>
                <h3 className="summary-title">Sản phẩm</h3>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  <div>
                    {order.items.map((it: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                        <div>{it.name} {it.variation ? `(${it.variation})` : ''} x {it.quantity || it.qty || 1}</div>
                        <div>{formatCurrency((it.price || it.appliedPrice || 0) * (it.quantity || it.qty || 1))}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>Không có sản phẩm.</div>
                )}
              </div>

              <div className="thankyou-actions">
                <button className="btn-primary" onClick={handleTrack}>Theo Dõi Đơn Hàng</button>
                <button className="btn-secondary" onClick={handleHome}>Quay lại Trang Chủ</button>
              </div>
            </>
          )}
        </div>

        <p className="thankyou-note">Một email xác nhận chi tiết đã được (hoặc sẽ được) gửi đến hộp thư của bạn.</p>
      </div>

      <FloatingButtons />
      <Footer />
    </div>
  );
}
