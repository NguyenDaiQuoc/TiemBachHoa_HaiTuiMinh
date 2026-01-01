// Simple serverless endpoint (Vercel/Netlify style) that returns a provider payment URL
// NOTE: This is a placeholder. Replace with real provider integration (Momo/VNPAY/ZaloPay) and signatures.
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { provider, amount, orderId } = req.body || {};
    if (!provider || !amount) return res.status(400).json({ error: 'Missing provider or amount' });

    // For demo, build a fake payment URL including provider and amount
    const base = `https://pay.example.com/${provider}`;
    const params = new URLSearchParams({ amount: String(amount), orderId: orderId || '', ts: String(Date.now()) });
    const paymentUrl = `${base}?${params.toString()}`;

    // Return the paymentUrl which the client can convert to a QR code
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ paymentUrl });
  } catch (err) {
    console.error('create-payment-url error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
