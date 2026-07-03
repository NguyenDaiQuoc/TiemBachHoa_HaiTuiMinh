const STORE_EMAIL_FROM = 'luutrithon1996@gmail.com';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export const getStoreEmailFrom = () => STORE_EMAIL_FROM;

export const sendStoreEmail = async ({ to, subject, html, text }: EmailPayload) => {
  const apiKey = process.env.RESEND_API_KEY || '';
  const from = process.env.STORE_EMAIL_FROM || STORE_EMAIL_FROM;

  if (!to || !to.includes('@')) return { success: false, skipped: true, reason: 'Missing recipient' };

  if (apiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || payload?.error || 'Không thể gửi email');
    return { success: true, provider: 'resend', id: payload?.id };
  }

  console.log('[EMAIL:stub]', { from, to, subject, text: text || html.replace(/<[^>]+>/g, ' ') });
  return { success: true, provider: 'stub' };
};

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

export const sendOrderConfirmationEmail = async ({ order, shippingInfo, paymentMethod, checkoutMeta }: any) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemRows = items
    .map(
      (item: any) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">${money(Number(item.price || 0) * Number(item.quantity || 1))}</td>
        </tr>`
    )
    .join('');
  const paymentLabel = paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng';
  const html = `
    <div style="font-family:Arial,sans-serif;color:#3c3c3c;line-height:1.6;max-width:680px;margin:auto;background:#fbf8f5;padding:24px;border-radius:18px;">
      <h1 style="color:#4a6d56;margin:0 0 8px;">Hai Tụi Mình đã nhận đơn hàng</h1>
      <p>Cảm ơn bạn đã đặt hàng. Dưới đây là chi tiết hóa đơn của đơn <strong>${order.orderNumber}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;margin:18px 0;">
        <thead><tr><th style="text-align:left;padding:12px;">Sản phẩm</th><th style="padding:12px;">SL</th><th style="text-align:right;padding:12px;">Thành tiền</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p><strong>Tạm tính:</strong> ${money(checkoutMeta?.subtotal || 0)}</p>
      <p><strong>Phí vận chuyển:</strong> ${money(checkoutMeta?.shippingFee || 0)}</p>
      ${checkoutMeta?.membershipDiscount ? `<p><strong>Ưu đãi thành viên:</strong> -${money(checkoutMeta.membershipDiscount)}</p>` : ''}
      <p style="font-size:18px;"><strong>Tổng cộng:</strong> ${money(order.totalAmount)}</p>
      <p><strong>Phương thức thanh toán:</strong> ${paymentLabel}</p>
      <p><strong>Người nhận:</strong> ${shippingInfo.fullName} - ${shippingInfo.phone}</p>
      <p><strong>Địa chỉ:</strong> ${shippingInfo.address}</p>
      <p style="font-size:12px;color:#777;">Email này được gửi từ ${getStoreEmailFrom()}.</p>
    </div>`;

  return sendStoreEmail({
    to: shippingInfo.email,
    subject: `Xác nhận đơn hàng ${order.orderNumber} | Hai Tụi Mình`,
    html,
    text: `Hai Tụi Mình đã nhận đơn ${order.orderNumber}. Tổng cộng: ${money(order.totalAmount)}. Thanh toán: ${paymentLabel}.`,
  });
};
